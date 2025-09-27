
require('dotenv').config();
const functions = require('firebase-functions');
const express = require('express');
const admin = require('firebase-admin');
const { GoogleGenAI, Modality, MediaResolution } = require('@google/genai');
const cors = require('cors');

admin.initializeApp({
  credential: admin.credential.cert(require('../serviceKey.json')),
});
const db = admin.firestore();

// Unified Gemini AI client for both text and voice
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const sessions = new Map();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("✅ Server with Firebase is working!");
});

app.get("/users", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("users").get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Session cleanup - remove sessions older than 30 minutes
setInterval(() => {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  for (const [patientId, session] of sessions.entries()) {
    if (now - session.createdAt > thirtyMinutes) {
      if (session.liveSession) {
        session.liveSession.disconnect?.();
      }
      sessions.delete(patientId);
      console.log(`Cleaned up expired session for patient: ${patientId}`);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size,
    geminiApiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Session management endpoints
app.delete('/chat/:patientId', (req, res) => {
  const { patientId } = req.params;
  const session = sessions.get(patientId);
  
  if (session) {
    if (session.liveSession) {
      session.liveSession.disconnect?.();
    }
    sessions.delete(patientId);
    res.json({ message: 'Session ended successfully' });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Gemini API configured: ${!!process.env.GEMINI_API_KEY}`);
});

// Chat session management
class ChatSession {
  constructor(patientId, context) {
    this.patientId = patientId;
    this.context = context;
    this.messages = [];
    this.questionCount = 0;
    this.liveSession = null;
    this.responseQueue = [];
    this.createdAt = Date.now();
  }

  addMessage(role, content) {
    this.messages.push({ role, content });
    if (role === 'model') {
      this.questionCount++;
    }
  }

  shouldEndSession() {
    return this.questionCount >= 10 || 
           this.messages.some(msg => msg.content?.includes('SUMMARY_START'));
  }

  getConversationHistory() {
    return [
      { role: 'user', content: this.context },
      ...this.messages
    ];
  }
}

// Text-based chat using regular Gemini API
app.post('/chat', async (req, res) => {
  const { patientId, userInput, mode, context } = req.body;

  console.log('Chat request:', { patientId, mode, hasContext: !!context, userInput: userInput?.substring(0, 50) });

  try {
    if (mode === 'voice') {
      return await handleVoiceChat(req, res);
    } else {
      return await handleTextChat(req, res);
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return res.status(500).json({ 
      error: error.message,
      reply: 'I apologize, but I encountered an error. Please try again.'
    });
  }
});

async function handleTextChat(req, res) {
  const { patientId, userInput, context } = req.body;

  let session = sessions.get(patientId);
  
  if (!session) {
    session = new ChatSession(patientId, context);
    sessions.set(patientId, session);
  }

  // Add user input to conversation
  session.addMessage('user', userInput);

  try {
    const model = 'gemini-2.5-flash';
    const conversationHistory = session.getConversationHistory();
    
    // Build contents array for the API
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    console.log('Sending to Gemini 2.5 Flash:', {
      model,
      messageCount: contents.length,
      lastMessage: contents[contents.length - 1]?.parts[0]?.text?.substring(0, 100)
    });

    const response = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        thinkingConfig: {
          thinkingBudget: 8000,
        },
      },
    });

    let replyText = '';
    for await (const chunk of response) {
      if (chunk.text) {
        replyText += chunk.text;
      }
    }

    console.log('Received response from Gemini:', replyText.substring(0, 100) + '...');

    if (!replyText.trim()) {
      throw new Error('Empty response from Gemini API');
    }

    session.addMessage('model', replyText);

    // Check if session should end
    // TODO: Store summaries in Firestore after confirmation from patient
    if (session.shouldEndSession()) {
      const summary = replyText.includes('SUMMARY_START') 
        ? replyText.split('SUMMARY_START')[1]
        : replyText;

      await db.collection('patientSummaries').doc(patientId).set({
        summary,
        conversationHistory: session.messages,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      sessions.delete(patientId);

      return res.json({
        reply: replyText,
        endSession: true,
        sessionId: patientId
      });
    }

    return res.json({
      reply: replyText,
      endSession: false,
      sessionId: patientId
    });

  } catch (error) {
    console.error('Error in text chat:', error);
    throw error;
  }
}

async function handleVoiceChat(req, res) {
  const { patientId, userInput, context } = req.body;

  try {
    let sessionWrapper = sessions.get(patientId);

    if (!sessionWrapper || !sessionWrapper.liveSession) {
      console.log('Creating new voice session for patient:', patientId);
      
      const responseQueue = [];
      
      const liveSession = await ai.live.connect({
        model: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: function () {
            console.log('Live session opened for patient:', patientId);
          },
          onmessage: function (message) {
            responseQueue.push(message);
          },
          onerror: function (e) {
            console.error('Live session error:', e.message);
          },
          onclose: function (e) {
            console.log('Live session closed:', e.reason);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr',
              }
            }
          }
        },
      });

      sessionWrapper = new ChatSession(patientId, context);
      sessionWrapper.liveSession = liveSession;
      sessionWrapper.responseQueue = responseQueue;
      sessions.set(patientId, sessionWrapper);

      // Send initial context
      await liveSession.sendClientContent({
        turns: [context]
      });
    }

    // Send user input
    await sessionWrapper.liveSession.sendClientContent({
      turns: [userInput]
    });

    sessionWrapper.addMessage('user', userInput);

    // Wait for and process response
    let replyText = '';
    let audioData = null;
    
    const turn = await handleTurn(sessionWrapper.responseQueue);
    
    for (const message of turn) {
      if (message.serverContent?.modelTurn?.parts) {
        const part = message.serverContent.modelTurn.parts[0];
        if (part?.text) replyText += part.text;
        if (part?.inlineData?.data) audioData = part.inlineData.data;
      }
    }

    sessionWrapper.addMessage('model', replyText);

    // Check if session should end
    if (sessionWrapper.shouldEndSession()) {
      const summary = replyText.includes('SUMMARY_START')
        ? replyText.split('SUMMARY_START')[1]
        : replyText;

      await db.collection('patientSummaries').doc(patientId).set({
        summary,
        conversationHistory: sessionWrapper.messages,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      sessionWrapper.liveSession.close();
      sessions.delete(patientId);

      return res.json({
        reply: replyText,
        audioData,
        endSession: true,
        sessionId: patientId
      });
    }

    return res.json({
      reply: replyText,
      audioData,
      endSession: false,
      sessionId: patientId
    });

  } catch (error) {
    console.error('Error in voice chat:', error);
    throw error;
  }
}

// Helper function to handle turn completion (from your boilerplate)
async function handleTurn(responseQueue) {
  const turn = [];
  let done = false;
  
  while (!done) {
    const message = await waitMessage(responseQueue);
    turn.push(message);
    if (message.serverContent && message.serverContent.turnComplete) {
      done = true;
    }
  }
  return turn;
}

async function waitMessage(responseQueue) {
  let done = false;
  let message = undefined;
  
  while (!done) {
    message = responseQueue.shift();
    if (message) {
      done = true;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  return message;
}

exports.api = functions.https.onRequest(app);
