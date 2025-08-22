const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for development
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Serve static files
app.use(express.static('.'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Image Enhancement server with FP16-optimized model is running'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    replicate: {
      deployment: 'mranderson01901234/scunet-fp16',
      status: 'connected',
      model: 'FP16-optimized SCUNet'
    },
    timestamp: new Date().toISOString()
  });
});

// Proxy endpoint for Replicate API calls
app.post('/api/replicate/predictions', async (req, res) => {
  try {
    const { deploymentId, input } = req.body;
    
    if (!deploymentId || !input) {
      return res.status(400).json({ error: 'Missing deploymentId or input' });
    }
    
    console.log('🔄 Proxying request to Replicate:', deploymentId);
    
    const response = await fetch(`https://api.replicate.com/v1/deployments/${deploymentId}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Replicate API error:', response.status, data);
      return res.status(response.status).json(data);
    }
    
    console.log('✅ Replicate API response:', data);
    res.json(data);
    
  } catch (error) {
    console.error('💥 Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Proxy endpoint for checking prediction status
app.get('/api/replicate/predictions/:predictionId', async (req, res) => {
  try {
    const { predictionId } = req.params;
    
    console.log('🔄 Checking prediction status:', predictionId);
    
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Replicate API error:', response.status, data);
      return res.status(response.status).json(data);
    }
    
    console.log('✅ Prediction status:', data.status);
    res.json(data);
    
  } catch (error) {
    console.error('💥 Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Proxy endpoint for deployment info
app.get('/api/replicate/deployments/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    
    console.log('🔄 Getting deployment info:', deploymentId);
    
    const response = await fetch(`https://api.replicate.com/v1/deployments/${deploymentId}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Replicate API error:', response.status, data);
      return res.status(response.status).json(data);
    }
    
    console.log('✅ Deployment info:', data);
    res.json(data);
    
  } catch (error) {
    console.error('💥 Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Image Enhancement server running on port ${PORT}`);
  console.log(`📱 FP16-optimized SCUNet model: mranderson01901234/scunet-fp16`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
}); 