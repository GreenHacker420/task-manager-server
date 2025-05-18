import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the API URL from environment or use default
const API_URL = process.env.API_URL || 'http://localhost:5001';

// Perform health check
const checkHealth = async () => {
  try {
    console.log(`Checking health of API at ${API_URL}/health...`);
    
    const response = await axios.get(`${API_URL}/health`);
    
    if (response.status === 200 && response.data.status === 'ok') {
      console.log('✅ API is healthy');
      console.log(`Uptime: ${response.data.uptime} seconds`);
      console.log(`Timestamp: ${response.data.timestamp}`);
      process.exit(0);
    } else {
      console.error('❌ API health check failed');
      console.error('Response:', response.data);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ API health check failed');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
};

// Run the health check
checkHealth();
