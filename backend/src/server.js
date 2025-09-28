
require('dotenv').config();
const functions = require('firebase-functions');
const express = require('express');
const admin = require('firebase-admin');
const { GoogleGenAI, Modality, MediaResolution } = require('@google/genai');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const { Writable, PassThrough } = require('stream');
const { TwelveLabs } = require('twelvelabs-js');
const multer = require('multer');

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceKey.json')),
});
const db = admin.firestore();

// Unified Gemini AI client for both text and voice
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// TwelveLabs client initialization
const twelveLabsClient = new TwelveLabs({
  apiKey: process.env.TL_API_KEY,
});

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

const sessions = new Map();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' })); // Increased limit for audio data
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Get patient conversation summary
app.get("/patient/:patientId/summary", async (req, res) => {
  try {
    const { patientId } = req.params;
    const patientDoc = await db.collection('patients').doc(patientId).get();
    
    if (!patientDoc.exists) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const patientData = patientDoc.data();
    
    // Get all conversation summaries from subcollection
    const summariesSnapshot = await db.collection('patients').doc(patientId)
      .collection('conversationSummaries')
      .orderBy('timestamp', 'desc')
      .get();
    
    const summaries = summariesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      patientId,
      latestSummary: patientData.latestConversationSummary || null,
      lastConversationDate: patientData.lastConversationDate || null,
      allSummaries: summaries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get patient doctor insights
app.get("/patient/:patientId/insights", async (req, res) => {
  try {
    const { patientId } = req.params;
    const patientDoc = await db.collection('patients').doc(patientId).get();
    
    if (!patientDoc.exists) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const patientData = patientDoc.data();
    
    res.json({
      patientId,
      doctorInsight: patientData.doctorInsight || "",
      doctorInsightUpdatedBy: patientData.doctorInsightUpdatedBy || null,
      doctorInsightUpdatedAt: patientData.doctorInsightUpdatedAt || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update patient doctor insights
app.put("/patient/:patientId/insights", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { doctorInsight, doctorId } = req.body;
    
    if (!doctorInsight && doctorInsight !== "") {
      return res.status(400).json({ error: 'Doctor insight is required' });
    }
    
    const patientRef = db.collection('patients').doc(patientId);
    const patientDoc = await patientRef.get();
    
    const updateData = {
      doctorInsight,
      doctorInsightUpdatedBy: doctorId,
      doctorInsightUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (patientDoc.exists) {
      await patientRef.update(updateData);
    } else {
      await patientRef.set({
        ...updateData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Doctor insight updated successfully',
      patientId 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get full patient data including insurance information
app.get("/patient/:patientId/data", async (req, res) => {
  try {
    const { patientId } = req.params;
    const patientDoc = await db.collection('patients').doc(patientId).get();
    
    if (!patientDoc.exists) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const patientData = patientDoc.data();
    
    res.json({
      patientId,
      insuranceProvider: patientData.insuranceProvider || null,
      insuranceMemberId: patientData.insuranceMemberId || null,
      firstName: patientData.firstName || null,
      lastName: patientData.lastName || null,
      // Include other fields as needed
      ...patientData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// TWELVELABS VIDEO API ENDPOINTS
// =====================

// Test TwelveLabs connection
app.get("/twelvelabs/test", async (req, res) => {
  try {
    console.log('🧪 Testing TwelveLabs connection...');
    
    if (!process.env.TL_API_KEY || process.env.TL_API_KEY === 'your_twelvelabs_api_key_here') {
      return res.status(400).json({
        error: 'TwelveLabs API key not configured',
        message: 'Please set TL_API_KEY in your .env file'
      });
    }

    // Test by listing indexes
    const indexes = await twelveLabsClient.indexes.list();
    
    // Also test tasks.create method signature
    console.log('🔍 Testing task creation method...');
    console.log('Available methods:', Object.keys(twelveLabsClient.tasks));
    
    res.json({
      success: true,
      message: 'TwelveLabs connection successful',
      apiKey: process.env.TL_API_KEY.substring(0, 8) + '...',
      indexCount: indexes.data?.length || 0,
      indexId: process.env.TWELVELABS_INDEX_ID || 'Not set',
      taskMethods: Object.keys(twelveLabsClient.tasks),
    });
    
  } catch (error) {
    console.error('❌ TwelveLabs test failed:', error);
    res.status(500).json({
      error: 'TwelveLabs connection failed',
      details: error.message
    });
  }
});

// Create TwelveLabs index (one-time setup)
app.post("/twelvelabs/create-index", async (req, res) => {
  try {
    const { indexName, engines } = req.body;
    
    const index = await twelveLabsClient.indexes.create({
      indexName: indexName || 'medical-meetings-index',
      models: engines || [
        {
          modelName: 'marengo2.7',
          modelOptions: ['visual', 'audio'] // Only these two options are supported
        }
      ],
      addons: ['thumbnail']
    });

    console.log('✅ TwelveLabs index created:', index);
    
    res.json({
      success: true,
      indexId: index.id,
      indexName: index.indexName || indexName,
      message: 'Index created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating TwelveLabs index:', error);
    res.status(500).json({ 
      error: 'Failed to create index',
      details: error.message 
    });
  }
});

// Upload video to TwelveLabs
app.post("/twelvelabs/upload-video", upload.single('video'), async (req, res) => {
  try {
    const { patientId, doctorId, title, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    console.log('🎥 Uploading video to TwelveLabs...', {
      filename: req.file.originalname,
      size: req.file.size,
      patientId,
      title
    });

    // Use built-in fetch API with proper Blob handling (Node 18+)
    // Convert Buffer to Blob with proper MIME type
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    
    const formData = new FormData();
    formData.append('index_id', process.env.TWELVELABS_INDEX_ID);
    formData.append('video_file', blob, req.file.originalname);
    
    console.log('� Uploading to TwelveLabs API directly...');
    
    const response = await fetch('https://api.twelvelabs.io/v1.3/tasks', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.TL_API_KEY,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ TwelveLabs API Error:', response.status, errorBody);
      throw new Error(`TwelveLabs API Error: ${response.status} - ${errorBody}`);
    }
    
    const uploadResult = await response.json();
    console.log('✅ Upload successful:', uploadResult);

    // Try to extract both task id and video id (different SDK/versions use different names)
    const taskId = uploadResult._id || uploadResult.id || uploadResult.task_id || uploadResult.taskId || null;
    const videoId = uploadResult.video_id || uploadResult.videoId || null;

    // initial processing status - prefer returned status if present
    const initialStatus = (uploadResult.status && uploadResult.status.toLowerCase()) || 'processing';
    const initialProgress = (uploadResult.process && uploadResult.process.percent_complete) || 0;

    console.log('📤 Extracted IDs:', { taskId, videoId, initialStatus, initialProgress });

    // Store video metadata in Firestore, saving both ids (task + video)
    const videoMetadata = {
      twelveLabsTaskId: taskId || null,
      twelveLabsVideoId: videoId || null,
      patientId,
      doctorId: doctorId || null,
      title: title || req.file.originalname,
      description: description || '',
      filename: req.file.originalname,
      fileSize: req.file.size,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      processingStatus: initialStatus,
      processingProgress: initialProgress,
    };

    const videoRef = await db.collection('videos').add(videoMetadata);

    res.json({
      success: true,
      videoDocId: videoRef.id,
      twelveLabsTaskId: taskId,
      twelveLabsVideoId: videoId,
      message: 'Video upload started successfully'
    });

  } catch (error) {
    console.error('❌ Error uploading video to TwelveLabs:', error);
    res.status(500).json({ 
      error: 'Failed to upload video',
      details: error.message 
    });
  }
});

// Check video processing status (accept either taskId or videoId)
app.get("/twelvelabs/video-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const indexId = process.env.TWELVELABS_INDEX_ID;

    let status = 'unknown';
    let progress = 0;
    let videoId = null;

    // Try to retrieve a task first (task id)
    try {
      const task = await twelveLabsClient.tasks.retrieve(id);
      // Task object may contain status, video_id, and process.percent_complete
      status = task.status || 'processing';
      progress = task.process?.percent_complete ?? task.progress ?? 0;
      videoId = task.video_id || task.videoId || null;
      console.log('[TwelveLabs] tasks.retrieve result:', { status, progress, videoId });
    } catch (taskErr) {
      // If tasks.retrieve fails (maybe id was actually a video id), fallback to videos.retrieve
      console.log('[TwelveLabs] tasks.retrieve failed, trying videos.retrieve:', taskErr.message || taskErr);
      if (!indexId) {
        return res.status(500).json({ error: 'TWELVELABS_INDEX_ID not set in env' });
      }
      try {
        const video = await twelveLabsClient.videos.retrieve(indexId, id);
        // videos.retrieve has indexed_at / updated_at fields — if indexed_at exists -> ready
        videoId = video._id || video.id || id;
        status = video.indexed_at ? 'ready' : (video.status || 'processing');
        // percent progress may not be available here; rely on indexed_at for completion
        progress = video.indexed_at ? 100 : 0;
        console.log('[TwelveLabs] videos.retrieve result:', { status, progress, videoId });
      } catch (videoErr) {
        console.error('[TwelveLabs] videos.retrieve also failed:', videoErr.message || videoErr);
        // return best-effort error
        return res.status(500).json({ error: 'Failed to retrieve task or video status', details: videoErr.message || videoErr });
      }
    }

    // Update Firestore doc (match by taskId or videoId)
    let videoQuery = await db.collection('videos')
      .where('twelveLabsTaskId', '==', id)
      .limit(1)
      .get();

    if (videoQuery.empty && videoId) {
      videoQuery = await db.collection('videos')
        .where('twelveLabsVideoId', '==', videoId)
        .limit(1)
        .get();
    }

    if (!videoQuery.empty) {
      const videoDoc = videoQuery.docs[0];
      const updateData = {
        processingStatus: status,
        processingProgress: progress,
      };
      if (videoId) updateData.twelveLabsVideoId = videoId;
      await videoDoc.ref.update(updateData);
    }

    return res.json({
      id,
      status,
      progress,
      videoId,
      message: status === 'ready' ? 'Video processing complete' : 'Video processing in progress'
    });

  } catch (error) {
    console.error('❌ Error checking video status:', error);
    res.status(500).json({ error: 'Failed to check video status', details: error.message });
  }
});

// Combined search: Marengo for timestamps + Pegasus for text analysis
app.post("/twelvelabs/search", async (req, res) => {
  try {
    const { query, patientId, videoIds } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log('🔍 Simplified search with query:', query);

    // Get video IDs from database if patientId is provided
    let searchVideoIds = videoIds;
    
    if (patientId && !videoIds) {
      const videosQuery = await db.collection('videos')
        .where('patientId', '==', patientId)
        .where('processingStatus', '==', 'ready')
        .get();
      
      searchVideoIds = videosQuery.docs
        .map(doc => doc.data().twelveLabsVideoId)
        .filter(id => id); // Remove null values
    }

    if (!searchVideoIds || searchVideoIds.length === 0) {
      return res.json({
        success: true,
        results: [],
        textAnalysis: '',
        message: 'No processed videos found for search'
      });
    }

    // Skip the problematic search API for now, just do text analysis
    let textAnalysis = '';
    if (searchVideoIds.length > 0) {
      try {
        const analyzeResponse = await fetch('https://api.twelvelabs.io/v1.3/analyze', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.TL_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            video_id: searchVideoIds[0],
            model: 'pegasus1.2',
            prompt: query,
            temperature: 0.2
          })
        });

        if (analyzeResponse.ok) {
          const responseText = await analyzeResponse.text();
          
          // Handle streaming response from TwelveLabs (multiple JSON objects)
          let reply = '';
          const lines = responseText.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const jsonObj = JSON.parse(line);
              if (jsonObj.event_type === 'text_generation' && jsonObj.text) {
                reply += jsonObj.text;
              }
            } catch (parseError) {
              // Skip lines that aren't valid JSON
              continue;
            }
          }
          
          // If no text was extracted from streaming format, try fallback
          if (!reply) {
            try {
              const singleJson = JSON.parse(responseText);
              reply = singleJson.message || singleJson.data || singleJson.text || 'No analysis available';
            } catch {
              reply = 'No analysis available';
            }
          }
          
          textAnalysis = reply;
        }
      } catch (analyzeError) {
        console.log('Text analysis failed:', analyzeError.message);
        textAnalysis = 'Text analysis unavailable at the moment';
      }
    }

    res.json({
      success: true,
      query,
      results: [], // Empty timestamp results for now since search API is problematic
      textAnalysis: textAnalysis, // Pegasus text analysis
      totalResults: 0
    });

  } catch (error) {
    console.error('❌ Error in combined search:', error);
    res.status(500).json({ 
      error: 'Failed to search videos',
      details: error.message 
    });
  }
});

// Analyze video (open-ended QA) using Pegasus
app.post("/twelvelabs/analyze", async (req, res) => {
  try {
    const { videoId, prompt, temperature = 0.2 } = req.body;
    if (!videoId || !prompt) {
      return res.status(400).json({ error: 'videoId and prompt are required' });
    }

    // Call TwelveLabs Analyze API (open-ended analysis / Pegasus)
    // REST path: POST https://api.twelvelabs.io/v1.3/analyze
    const body = {
      video_id: videoId,
      model: 'pegasus-1',   // request Pegasus for open-ended video analysis
      prompt,
      temperature
    };

    const analyzeResp = await fetch('https://api.twelvelabs.io/v1.3/analyze', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.TL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!analyzeResp.ok) {
      const errText = await analyzeResp.text();
      console.error('TwelveLabs Analyze API error:', analyzeResp.status, errText);
      return res.status(500).json({ error: 'TwelveLabs analyze failed', details: errText });
    }

    const responseText = await analyzeResp.text();
    
    // Handle streaming response from TwelveLabs (multiple JSON objects)
    let replyText = '';
    const lines = responseText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const jsonObj = JSON.parse(line);
        if (jsonObj.event_type === 'text_generation' && jsonObj.text) {
          replyText += jsonObj.text;
        }
      } catch (parseError) {
        // Skip lines that aren't valid JSON
        continue;
      }
    }
    
    // If no text was extracted from streaming format, try fallback
    if (!replyText) {
      try {
        const singleJson = JSON.parse(responseText);
        replyText = singleJson.message || singleJson.data || singleJson.text || 'No analysis available';
      } catch {
        replyText = 'No analysis available';
      }
    }

    res.json({
      success: true,
      videoId,
      prompt,
      reply: replyText
    });

  } catch (error) {
    console.error('❌ Error in /twelvelabs/analyze:', error);
    res.status(500).json({ error: 'Analyze failed', details: error.message });
  }
});

// Simple analyze-only endpoint (for when you just want text analysis without search)
app.post("/twelvelabs/analyze-only", async (req, res) => {
  try {
    const { videoId, prompt, temperature = 0.2 } = req.body;
    if (!videoId || !prompt) {
      return res.status(400).json({ error: 'videoId and prompt are required' });
    }

    console.log('🤖 Analyzing video:', videoId, 'with prompt:', prompt);

    // Call TwelveLabs Analyze API directly
    const analyzeResponse = await fetch('https://api.twelvelabs.io/v1.3/analyze', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.TL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_id: videoId,
        model: 'pegasus1.2',
        prompt,
        temperature
      })
    });

    if (!analyzeResponse.ok) {
      const errText = await analyzeResponse.text();
      console.error('Analyze API error:', analyzeResponse.status, errText);
      return res.status(500).json({ error: 'Analyze failed', details: errText });
    }

    const responseText = await analyzeResponse.text();
    
    // Handle streaming response from TwelveLabs (multiple JSON objects)
    let reply = '';
    const lines = responseText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const jsonObj = JSON.parse(line);
        if (jsonObj.event_type === 'text_generation' && jsonObj.text) {
          reply += jsonObj.text;
        }
      } catch (parseError) {
        // Skip lines that aren't valid JSON
        continue;
      }
    }
    
    // If no text was extracted from streaming format, try fallback
    if (!reply) {
      try {
        const singleJson = JSON.parse(responseText);
        reply = singleJson.message || singleJson.data || singleJson.text || 'No analysis available';
      } catch {
        reply = 'No analysis available';
      }
    }

    res.json({
      success: true,
      videoId,
      prompt,
      reply: reply
    });

  } catch (error) {
    console.error('❌ Error in analyze-only:', error);
    res.status(500).json({ error: 'Analyze failed', details: error.message });
  }
});

// Update all video statuses for a patient
app.post("/patient/:patientId/update-video-statuses", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log('🔄 Updating video statuses for patient:', patientId);
    
    // Get all videos for this patient
    const videosSnapshot = await db.collection('videos')
      .where('patientId', '==', patientId)
      .get();

    if (videosSnapshot.empty) {
      return res.json({ message: 'No videos found for this patient', updated: 0 });
    }

    let updatedCount = 0;
    const statusUpdates = [];

    for (const doc of videosSnapshot.docs) {
      const videoData = doc.data();
      const videoId = doc.id;
      
      // Skip if already ready
      if (videoData.processingStatus === 'ready') {
        continue;
      }

      // Try to get status from TwelveLabs
      const taskId = videoData.twelveLabsTaskId || videoData.twelveLabsVideoId;
      if (!taskId) {
        continue;
      }

      try {
        let status = 'unknown';
        let progress = 0;
        let twelveLabsVideoId = videoData.twelveLabsVideoId;

        // Try tasks.retrieve first
        try {
          const task = await twelveLabsClient.tasks.retrieve(taskId);
          status = task.status || 'processing';
          progress = task.process?.percent_complete ?? task.progress ?? 0;
          twelveLabsVideoId = task.video_id || twelveLabsVideoId;
          console.log(`[${videoId}] Task status:`, { status, progress, twelveLabsVideoId });
        } catch (taskErr) {
          // Fallback to videos.retrieve
          try {
            const video = await twelveLabsClient.videos.retrieve(process.env.TWELVELABS_PEGASUS_INDEX_ID, taskId);
            twelveLabsVideoId = video._id || video.id || taskId;
            status = video.indexed_at ? 'ready' : (video.status || 'processing');
            progress = video.indexed_at ? 100 : 0;
            console.log(`[${videoId}] Video status:`, { status, progress, twelveLabsVideoId });
          } catch (videoErr) {
            console.log(`[${videoId}] Both task and video retrieve failed:`, videoErr.message);
            continue;
          }
        }

        // Update Firestore
        const updateData = {
          processingStatus: status,
          processingProgress: progress,
        };
        if (twelveLabsVideoId) {
          updateData.twelveLabsVideoId = twelveLabsVideoId;
        }

        await doc.ref.update(updateData);
        updatedCount++;
        
        statusUpdates.push({
          videoId,
          title: videoData.title,
          oldStatus: videoData.processingStatus,
          newStatus: status,
          progress: progress
        });

      } catch (error) {
        console.error(`Error updating status for video ${videoId}:`, error.message);
      }
    }

    console.log(`✅ Updated ${updatedCount} video statuses`);
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} video statuses`,
      updated: updatedCount,
      statusUpdates: statusUpdates
    });

  } catch (error) {
    console.error('❌ Error updating video statuses:', error);
    res.status(500).json({ error: 'Failed to update video statuses', details: error.message });
  }
});

// Get patient's videos
app.get("/patient/:patientId/videos", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const videosSnapshot = await db.collection('videos')
      .where('patientId', '==', patientId)
      .orderBy('uploadedAt', 'desc')
      .get();
    
    const videos = videosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate?.()?.toISOString() || null
    }));

    res.json({
      patientId,
      videos,
      totalVideos: videos.length
    });

  } catch (error) {
    console.error('❌ Error fetching patient videos:', error);
    res.status(500).json({ 
      error: 'Failed to fetch videos',
      details: error.message 
    });
  }
});

// AI-powered medication analysis endpoint
app.post("/analyze-medication", async (req, res) => {
  try {
    const { insuranceProvider, memberId, diagnosis, prescription } = req.body;
    
    if (!insuranceProvider || !memberId || !diagnosis || !prescription) {
      return res.status(400).json({ 
        error: 'Missing required fields: insuranceProvider, memberId, diagnosis, prescription' 
      });
    }

    const prompt = `You are a Clinical Pharmacy Assistant AI. Analyze the user's medication request and provide cost-effective alternatives depending on the doctor's diagnosis and patient insurance information.

User Input:
Insurance: ${insuranceProvider}
Member ID: ${memberId}
Diagnosis: ${diagnosis}
Prescription: ${prescription}

Analyze the prescribed medication and suggest up to 3 therapeutically similar alternatives that are commonly found in lower-cost formulary tiers.`;

    console.log('🔍 Analyzing medication with AI:', { insuranceProvider, memberId, diagnosis, prescription });

    const responseSchema = {
      type: 'object',
      required: ['querySummary', 'prescribedMedicationDetails', 'costEffectiveAlternatives'],
      properties: {
        querySummary: {
          type: 'object',
          required: ['insuranceProvider', 'memberId', 'diagnosis'],
          properties: {
            insuranceProvider: {
              type: 'string',
            },
            memberId: {
              type: 'string',
            },
            diagnosis: {
              type: 'string',
            },
          },
        },
        prescribedMedicationDetails: {
          type: 'object',
          required: ['medicationName', 'activeIngredient', 'typicalTier', 'estimatedCopay'],
          properties: {
            medicationName: {
              type: 'string',
            },
            activeIngredient: {
              type: 'string',
            },
            typicalTier: {
              type: 'string',
            },
            estimatedCopay: {
              type: 'string',
            },
          },
        },
        costEffectiveAlternatives: {
          type: 'array',
          maxItems: 3,
          items: {
            type: 'object',
            required: ['medicationName', 'formularyTier', 'estimatedCopay', 'rationale'],
            properties: {
              medicationName: {
                type: 'string',
              },
              formularyTier: {
                type: 'string',
              },
              estimatedCopay: {
                type: 'string',
              },
              rationale: {
                type: 'string',
              },
            },
          },
        },
      },
    };

    const result = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      config: {
        temperature: 0.2,
        thinkingConfig: {
          thinkingBudget: 8000,
        },
        responseMimeType: 'application/json',
        responseSchema,
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    let responseText = '';
    for await (const chunk of result) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    console.log('🤖 Raw AI Response:', responseText);
    
    try {
      const aiAnalysis = JSON.parse(responseText);
      
      // Validate the response structure
      if (!aiAnalysis.costEffectiveAlternatives || !Array.isArray(aiAnalysis.costEffectiveAlternatives)) {
        throw new Error('Invalid AI response structure');
      }

      console.log('✅ Successfully analyzed medication:', aiAnalysis);
      res.json(aiAnalysis);
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response was:', responseText);
      
      // Fallback response
      res.json({
        querySummary: {
          insuranceProvider,
          memberId,
          diagnosis
        },
        prescribedMedicationDetails: {
          medicationName: prescription,
          activeIngredient: "Unknown",
          typicalTier: "Tier 3 (Brand)",
          estimatedCopay: "$30 - $60"
        },
        costEffectiveAlternatives: [
          {
            medicationName: "Generic equivalent (if available)",
            formularyTier: "Tier 1 (Generic)",
            estimatedCopay: "$0 - $15",
            rationale: "Generic versions are typically the most cost-effective option."
          }
        ]
      });
    }

  } catch (error) {
    console.error('Error in medication analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze medication alternatives',
      details: error.message 
    });
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
    this.audioParts = [];
    this.createdAt = Date.now();
  }

  addMessage(role, content) {
    this.messages.push({ role, content });
    if (role === 'model') {
      this.questionCount++;
    }
  }

  shouldEndSession() {
    return this.messages.some(msg => msg.content?.includes('SUMMARY_START'));
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

  console.log('🔄 CHAT REQUEST RECEIVED:');
  console.log('========================');
  console.log('Patient ID:', patientId);
  console.log('Mode:', mode);
  console.log('User Input:', userInput);
  console.log('Has Context:', !!context);
  console.log('Context Length:', context?.length || 0);
  
  if (context) {
    console.log('📋 FULL CONTEXT RECEIVED:');
    console.log('=========================');
    console.log(context);
    console.log('=========================');
  }

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

  // Handle START_SESSION trigger for initial AI response
  const isStartSession = userInput === 'START_SESSION';
  
  // Add user input to conversation (skip for START_SESSION)
  if (!isStartSession) {
    session.addMessage('user', userInput);
  }

  try {
    const model = 'gemini-2.5-flash';
    
    let contents;
    
    if (isStartSession) {
      // For initial session, just send context and ask AI to start
      contents = [
        {
          role: 'user',
          parts: [{ text: context + '\n\nPlease start the medical interview now.' }]
        }
      ];
    } else {
      // Normal conversation flow
      const conversationHistory = session.getConversationHistory();
      contents = conversationHistory.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    }

    console.log('Sending to Gemini 2.5 Flash:', {
      model,
      messageCount: contents.length,
      lastMessageLength: contents[contents.length - 1]?.parts[0]?.text?.length,
      lastMessagePreview: contents[contents.length - 1]?.parts[0]?.text?.substring(0, 200) + '...'
    });
    
    console.log('📤 FULL LAST MESSAGE CONTENT:');
    console.log('==============================');
    console.log(contents[contents.length - 1]?.parts[0]?.text);
    console.log('==============================');

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
    if (session.shouldEndSession()) {
      console.log('🏁 Session ending, storing summary for patient:', patientId);
      const summary = replyText.includes('SUMMARY_START') 
        ? replyText.split('SUMMARY_START')[1]
        : replyText;

      console.log('📋 Summary to store:', summary.substring(0, 100) + '...');

      // Store summary in the patients collection
      const patientRef = db.collection('patients').doc(patientId);
      
      try {
        // Try to update the patient document with the latest summary
        await patientRef.update({
          latestConversationSummary: summary,
          lastConversationDate: admin.firestore.FieldValue.serverTimestamp(),
          conversationHistory: session.messages,
        });
      } catch (error) {
        // If patient document doesn't exist, create it with the summary
        console.log('⚠️ Error updating patient document:', error.code, error.message);
        if (error.code === 'not-found') {
          console.log('📝 Creating new patient document with summary');
          await patientRef.set({
            latestConversationSummary: summary,
            lastConversationDate: admin.firestore.FieldValue.serverTimestamp(),
            conversationHistory: session.messages,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          throw error; // Re-throw if it's a different error
        }
      }

      // Also store in a subcollection for historical records
      await patientRef.collection('conversationSummaries').add({
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

/**
 * Transcodes a WebM audio buffer to a raw L16 PCM audio buffer.
 * @param {Buffer} webmBuffer The input audio buffer in WebM format.
 * @returns {Promise<Buffer>} A promise that resolves with the raw L16 PCM buffer.
 */
function transcodeWebmToL16(webmBuffer) {
  return new Promise((resolve, reject) => {
    const pcmChunks = [];
    const passThrough = new PassThrough();
    passThrough.end(webmBuffer);

    const writableStream = new Writable({
      write(chunk, encoding, callback) {
        pcmChunks.push(chunk);
        callback();
      },
    });

    ffmpeg(passThrough)
      .inputFormat('webm')
      .audioCodec('pcm_s16le') // Signed 16-bit Little Endian PCM
      .audioFrequency(16000)   // 16kHz sample rate
      .audioChannels(1)        // Mono
      .toFormat('s16le')       // Output format
      .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .on('end', () => {
        const pcmBuffer = Buffer.concat(pcmChunks);
        console.log('✅ FFmpeg transcoding successful, PCM buffer length:', pcmBuffer.length);
        resolve(pcmBuffer);
      })
      .pipe(writableStream);
  });
}

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
        console.log('⏳ Waiting for model\'s initial response...');
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
        // pcmBuffer was prepared in Step 1
        console.log('� Sending transcoded PCM buffer to Gemini Live, length:', pcmBuffer.length);
        // Convert to Base64 and use correct MIME type
        const base64Pcm = pcmBuffer.toString('base64');
        console.log('📤 Converted to Base64, length:', base64Pcm.length);
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
    }

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

      // Store summary in the patients collection
      const patientRef = db.collection('patients').doc(patientId);
      
      try {
        // Try to update the patient document with the latest summary
        await patientRef.update({
          latestConversationSummary: summary,
          lastConversationDate: admin.firestore.FieldValue.serverTimestamp(),
          conversationHistory: sessionWrapper.messages,
        });
      } catch (error) {
        // If patient document doesn't exist, create it with the summary
        if (error.code === 'not-found') {
          await patientRef.set({
            latestConversationSummary: summary,
            lastConversationDate: admin.firestore.FieldValue.serverTimestamp(),
            conversationHistory: sessionWrapper.messages,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          throw error; // Re-throw if it's a different error
        }
      }

      // Also store in a subcollection for historical records
      await patientRef.collection('conversationSummaries').add({
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

  } catch (error) {
    console.error('Error in voice chat:', error);
    throw error;
  }
}

// Audio handling function from boilerplate
function handleModelTurn(message, audioParts) {
  if (message.serverContent?.modelTurn?.parts) {
    const part = message.serverContent?.modelTurn?.parts?.[0];

    if (part?.fileData) {
      console.log(`📁 File: ${part?.fileData.fileUri}`);
    }

    if (part?.inlineData) {
      const inlineData = part?.inlineData;
      audioParts.push(inlineData?.data ?? '');
      console.log('🎵 Audio chunk received, length:', inlineData?.data?.length || 0);
    }

    if (part?.text) {
      console.log('💬 Text response:', part?.text);
    }
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
