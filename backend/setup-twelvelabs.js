// Setup script for TwelveLabs integration
// Run this once to create your index and update your .env file

require('dotenv').config();
const { TwelveLabs } = require('twelvelabs-js');

async function setupTwelveLabs() {
  console.log('🚀 Setting up TwelveLabs integration...');
  
  // Check if API key is configured
  if (!process.env.TL_API_KEY) {
    console.log('❌ Please set your TL_API_KEY in the .env file');
    console.log('   Get your API key from: https://api.twelvelabs.io/');
    return;
  }

  try {
    const client = new TwelveLabs({
      apiKey: process.env.TL_API_KEY,
    });

    console.log('📋 Creating index for medical meetings...');
    console.log('ℹ️  Note: Creating Pegasus index for video analysis and Q&A.');
    
    // First, let's list existing indexes to test connection
    console.log('🔍 Testing connection...');
    const indexes = await client.indexes.list();
    console.log('✅ Connection successful!');
    console.log('📊 Existing indexes:', indexes.data?.length || 0);

    // Create index with Pegasus for video analysis and Q&A
    const index = await client.indexes.create({
      indexName: 'doctor-patient-pegasus-' + Date.now(), // Unique name
      models: [
        {
          modelName: 'pegasus1.2', // Pegasus model for Analyze API (no dash)
          modelOptions: ['visual', 'audio'] // Only visual and audio are supported
        }
      ],
      addons: ['thumbnail'] // Optional: for video thumbnails
    });

    console.log('✅ Index created successfully!');
    console.log('📝 Index ID:', index._id || index.id);
    console.log('📝 Index Name:', index.index_name || index.name);
    console.log('📝 Full response:', JSON.stringify(index, null, 2));
    console.log('');
    console.log('🔧 Please update your .env file:');
    console.log(`TWELVELABS_INDEX_ID=${index._id || index.id}`);
    console.log('');
    console.log('🎉 Setup complete! You can now upload and search videos.');

  } catch (error) {
    console.error('❌ Error setting up TwelveLabs:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 This looks like an authentication error. Please check your API key.');
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      console.log('💡 This looks like a quota/limit error. Please check your TwelveLabs account limits.');
    }
  }
}

// Run the setup
setupTwelveLabs();