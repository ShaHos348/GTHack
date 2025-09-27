async function handleVoiceChat(req, res) {
  const { patientId, userInput, context, audioData } = req.body;

  try {
    // Get the existing session or create a new one for context management
    let sessionWrapper = sessions.get(patientId);
    if (!sessionWrapper) {
      sessionWrapper = new ChatSession(patientId, context);
      sessions.set(patientId, sessionWrapper);
    }

    const isStartSession = userInput === 'START_SESSION';
    let pcmBuffer = null; // To hold the transcoded audio

    // --- STEP 1: Process audio FIRST, before any API calls ---
    if (!isStartSession && audioData) {
      console.log('🎤 Received audio data from user, length:', audioData.length);
      
      const webmBuffer = Buffer.from(audioData, 'base64');
      console.log('🔄 Converted Base64 to WebM buffer, length:', webmBuffer.length);
      
      console.log('🎵 Starting FFmpeg transcoding...');
      pcmBuffer = await transcodeWebmToL16(webmBuffer);
      // Now pcmBuffer is ready to be sent instantly
    }

    // --- STEP 2: Connect to the API only when we are ready to send ---
    if (!sessionWrapper.liveSession) {
      console.log('🎤 Creating new VOICE session for patient:', patientId);
      
      const responseQueue = [];
      const audioParts = [];
      
      const liveSession = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => console.log('🎙️ Live AUDIO session opened for patient:', patientId),
          onmessage: (message) => {
            responseQueue.push(message);
            handleModelTurn(message, audioParts);
          },
          onerror: (e) => console.error('❌ Live session error:', e.message),
          onclose: (e) => console.log('🔇 Live session closed:', e.reason),
        },
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: 'Zephyr' 
              } 
            } 
          },
          contextWindowCompression: { 
            triggerTokens: 25600, 
            slidingWindow: { targetTokens: 12800 } 
          },
        },
      });

      sessionWrapper.liveSession = liveSession;
      sessionWrapper.responseQueue = responseQueue;
      sessionWrapper.audioParts = audioParts;

      // 🔧 FIX 1: Only send context ONCE - only for START_SESSION in voice mode
      if (isStartSession) {
        console.log('📋 Sending initial context for new voice session');
        await liveSession.sendRealtimeInput({
          text: sessionWrapper.context + '\n\nPlease start the medical interview now. Respond with audio.'
        });
        
        // 🔧 FIX 2: Wait for model's initial response before allowing audio input
        console.log('⏳ Waiting for model\'s initial response before accepting user input...');
        const initialTurn = await handleTurn(sessionWrapper.responseQueue);
        
        // Process initial response
        let replyText = '';
        let responseAudioData = null;
        
        for (const message of initialTurn) {
          if (message.serverContent?.modelTurn?.parts) {
            const part = message.serverContent.modelTurn.parts[0];
            if (part?.text) replyText += part.text;
            if (part?.inlineData?.data) {
              responseAudioData = part.inlineData.data;
              console.log('🔊 Received initial audio response, length:', responseAudioData.length);
            }
          }
        }

        // Combine all audio parts if multiple chunks
        if (sessionWrapper.audioParts && sessionWrapper.audioParts.length > 0) {
          responseAudioData = sessionWrapper.audioParts.join('');
          sessionWrapper.audioParts = []; // Reset for next response
        }

        sessionWrapper.addMessage('model', replyText || '[Audio Response]');

        return res.json({
          reply: replyText || 'Audio response',
          audioData: responseAudioData,
          endSession: false,
          sessionId: patientId
        });
      }
    }

    // --- STEP 3: Send user input (audio or text) only for non-START_SESSION ---
    if (!isStartSession) {
      console.log("🔍 TURN STATE:", {
        hasPendingMessages: sessionWrapper.responseQueue.length,
        audioPartsCount: sessionWrapper.audioParts.length,
        hasAudio: !!pcmBuffer,
        hasText: !!(userInput && userInput.trim())
      });

      if (pcmBuffer) {
        // Convert to Base64 and use correct MIME type
        const base64Pcm = pcmBuffer.toString('base64');
        console.log('📤 Sending transcoded PCM buffer to Gemini Live, Base64 length:', base64Pcm.length);
        await sessionWrapper.liveSession.sendRealtimeInput({
          audio: {
            data: base64Pcm,
            mimeType: 'audio/pcm;rate=16000'
          }
        });
      } else if (userInput && userInput.trim()) {
        await sessionWrapper.liveSession.sendRealtimeInput({
          text: userInput
        });
      }
      
      sessionWrapper.addMessage('user', userInput || '[Audio Message]');

      // Wait for and process response
      let replyText = '';
      let responseAudioData = null;
      
      const turn = await handleTurn(sessionWrapper.responseQueue);
      
      for (const message of turn) {
        if (message.serverContent?.modelTurn?.parts) {
          const part = message.serverContent.modelTurn.parts[0];
          if (part?.text) replyText += part.text;
          if (part?.inlineData?.data) {
            responseAudioData = part.inlineData.data;
            console.log('🔊 Received audio response, length:', responseAudioData.length);
          }
        }
      }

      // Combine all audio parts if multiple chunks
      if (sessionWrapper.audioParts && sessionWrapper.audioParts.length > 0) {
        responseAudioData = sessionWrapper.audioParts.join('');
        sessionWrapper.audioParts = []; // Reset for next response
      }

      sessionWrapper.addMessage('model', replyText || '[Audio Response]');

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
          reply: replyText || 'Session completed',
          audioData: responseAudioData,
          endSession: true,
          sessionId: patientId
        });
      }

      return res.json({
        reply: replyText || 'Audio response',
        audioData: responseAudioData,
        endSession: false,
        sessionId: patientId
      });
    }

    // If we reach here, something went wrong
    throw new Error('Unexpected flow in handleVoiceChat');

  } catch (error) {
    console.error('Error in voice chat:', error);
    throw error;
  }
}