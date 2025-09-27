import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useAuth } from '../hooks/useAuth';
import { getPatientData, getQuestionnaireData } from './firebase';

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<{ from: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [patientContext, setPatientContext] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const patientId = currentUser?.uid || 'anonymous';

  // Build patient context from historical data
  const buildPatientContext = async (uid: string): Promise<string> => {
    try {
      const [patientData, questionnaireData] = await Promise.all([
        getPatientData(uid),
        getQuestionnaireData(uid)
      ]);

      let context = `You are a virtual medical assistant helping collect a detailed patient history.

The patient will provide initial background information and chief complaint.

Your goal is to ask clear, focused, and medically logical questions to:
- Understand the main symptom(s) and their characteristics (onset, duration, severity, quality)
- Identify any associated symptoms or red flags (e.g., nausea, vision changes, chest pain)
- Explore relevant past medical history, medications, allergies, family history, and lifestyle factors
- Narrow down possible causes to help the doctor in diagnosis and treatment planning

Keep questions concise and easy for the patient to answer.

Stop asking new questions when you have gathered sufficient clinical information or after 10 questions.

At that point, generate a clear and concise bullet-point summary of the patient's key history points, including their main complaint, symptom details, relevant past conditions, and any important risks.

Then politely thank the patient for their information.

Begin by asking the patient to describe their main symptoms and how these affect their daily life right now.

---PATIENT HISTORY---`;

      if (patientData) {
        context += `\n\nPatient Information:`;
        if (patientData.firstName && patientData.lastName) {
          context += `\n- Name: ${patientData.firstName} ${patientData.lastName}`;
        }
        if (patientData.birthday) {
          const age = new Date().getFullYear() - new Date(patientData.birthday).getFullYear();
          context += `\n- Age: ${age} years old (DOB: ${patientData.birthday})`;
        }
        if (patientData.sex) {
          context += `\n- Sex: ${patientData.sex}`;
        }
        if (patientData.currentMedications) {
          context += `\n- Current Medications: ${patientData.currentMedications}`;
        }
        if (patientData.allergies) {
          context += `\n- Allergies: ${patientData.allergies}`;
        }
        if (patientData.pastSurgeries) {
          context += `\n- Past Surgeries/Procedures: ${patientData.pastSurgeries}`;
        }
        if (patientData.familyHistory) {
          context += `\n- Family History: ${patientData.familyHistory}`;
        }
        if (patientData.lifestyle) {
          context += `\n- Lifestyle: ${patientData.lifestyle}`;
        }
      }

      if (questionnaireData && Object.keys(questionnaireData).length > 0) {
        context += `\n\nPrevious Questionnaire Responses:`;
        Object.entries(questionnaireData).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.trim()) {
            context += `\n- ${key}: ${value}`;
          }
        });
      }

      return context;
    } catch (error) {
      console.error('Error building patient context:', error);
      return `You are a virtual medical assistant helping collect a detailed patient history.

The patient will provide initial background information and chief complaint.

Your goal is to ask clear, focused, and medically logical questions to:
- Understand the main symptom(s) and their characteristics (onset, duration, severity, quality)
- Identify any associated symptoms or red flags (e.g., nausea, vision changes, chest pain)
- Explore relevant past medical history, medications, allergies, family history, and lifestyle factors
- Narrow down possible causes to help the doctor in diagnosis and treatment planning

Keep questions concise and easy for the patient to answer.

Stop asking new questions when you have gathered sufficient clinical information or after 10 questions.

At that point, generate a clear and concise bullet-point summary of the patient's key history points, including their main complaint, symptom details, relevant past conditions, and any important risks.

Then politely thank the patient for their information.

Begin by asking the patient to describe their main symptoms and how these affect their daily life right now.`;
    }
  };

  // Load patient context when component mounts or user changes
  useEffect(() => {
    setContextLoading(true);
    if (currentUser?.uid) {
      buildPatientContext(currentUser.uid)
        .then(setPatientContext)
        .finally(() => setContextLoading(false));
    } else {
      setPatientContext(null);
      setContextLoading(false);
    }
  }, [currentUser?.uid]); 

  const sendMessage = async (text: string, audioBlob?: Blob) => {
    if (isSending || (!text.trim() && !audioBlob)) return;
    
    setIsSending(true);
    setError(null);

    // Add user message immediately for better UX
    setMessages(prev => [...prev, { from: 'user', text }]);

    try {
      const requestBody: {
        patientId: string;
        sessionId: string | null;
        userInput: string;
        mode: string;
        context?: string | null;
        audioData?: string;
      } = {
        patientId,
        sessionId,
        userInput: text,
        mode: voiceMode ? 'voice' : 'text',
        context: sessionId ? undefined : patientContext,
      };

      // Handle audio input for voice mode
      if (audioBlob && voiceMode) {
        const audioBase64 = await blobToBase64(audioBlob);
        requestBody.audioData = audioBase64;
      }

      console.log('Sending message:', { 
        patientId, 
        mode: voiceMode ? 'voice' : 'text', 
        hasContext: !!patientContext,
        textLength: text.length 
      });

      const res = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (!data.reply) {
        throw new Error('Empty response from server');
      }

      // Add AI response
      setMessages(prev => [...prev, { from: 'ai', text: data.reply }]);

      // Handle audio response
      if (data.audioData && audioRef.current && voiceMode) {
        try {
          audioRef.current.src = `data:audio/wav;base64,${data.audioData}`;
          await audioRef.current.play();
        } catch (audioError) {
          console.warn('Audio playback failed:', audioError);
        }
      }

      // Update session state
      if (!sessionId) setSessionId(data.sessionId);
      
      if (data.endSession) {
        alert('Session completed! Your responses have been saved for the doctor to review.');
        setSessionId(null);
        setMessages(prev => [...prev, { 
          from: 'ai', 
          text: 'Thank you for completing the questionnaire. Your doctor will review your responses.' 
        }]);
      }

    } catch (err) {
      console.error('Send message error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        from: 'ai', 
        text: `I apologize, but I encountered an error: ${errorMessage}. Please try again.` 
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:audio/wav;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        sendMessage('', audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Medical Assistant Chat</h1>
        <div className="flex items-center gap-4">
          <Switch checked={voiceMode} onCheckedChange={setVoiceMode}>
            Voice Mode {voiceMode ? '🎤' : '💬'}
          </Switch>
          {sessionId && (
            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
              Session Active
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {contextLoading && (
        <div className="text-center py-4 text-sm text-gray-600 bg-blue-50 rounded mb-4">
          🔄 Loading your medical history and previous responses...
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-center py-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-grow overflow-auto border rounded-lg p-4 mb-4 flex flex-col gap-3 bg-gray-50">
        {messages.length === 0 && !contextLoading && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🏥</div>
            <p>Ready to help you with your medical questionnaire.</p>
            <p className="text-sm mt-2">
              {voiceMode ? 'Click the microphone to start speaking' : 'Type your message below to begin'}
            </p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
              m.from === 'user' 
                ? 'bg-blue-500 text-white self-end ml-auto' 
                : 'bg-white text-gray-800 self-start border'
            }`}
          >
            <div className="text-xs opacity-70 mb-1">
              {m.from === 'user' ? '👤 You' : '🤖 Medical Assistant'}
            </div>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
        
        {isSending && (
          <div className="bg-white text-gray-600 self-start p-3 rounded-lg border max-w-[80%]">
            <div className="text-xs opacity-70 mb-1">🤖 Medical Assistant</div>
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      {voiceMode ? (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex-grow text-center">
            {isRecording ? (
              <div className="text-red-600">
                <div className="animate-pulse text-2xl mb-2">🔴</div>
                <p>Recording... Click to stop</p>
              </div>
            ) : (
              <div className="text-gray-600">
                <div className="text-2xl mb-2">🎤</div>
                <p>Click to start voice recording</p>
              </div>
            )}
          </div>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending}
            className={`px-6 py-3 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          <audio ref={audioRef} controls className="hidden" />
        </div>
      ) : (
        <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isSending}
            className="flex-grow border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Type your message or describe your symptoms..."
          />
          <Button 
            onClick={handleSend} 
            disabled={isSending || !input.trim()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 text-center mt-2">
        This chat is secure and will be reviewed by your healthcare provider.
        {voiceMode && ' Voice responses will be played automatically.'}
      </div>
    </div>
  );
}
