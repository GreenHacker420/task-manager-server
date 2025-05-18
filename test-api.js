import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Test the test route
const testApiConnection = async () => {
  try {
    const response = await axios.post(`${API_URL}/test`, {
      testData: 'This is a test'
    });
    
    console.log('Test API Response:', response.data);
    console.log('API connection successful!');
  } catch (error) {
    console.error('Error connecting to API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

// Test the login route
const testLogin = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'demo@example.com',
      password: 'password'
    });
    
    console.log('Login Response:', response.data);
    console.log('Login successful!');
  } catch (error) {
    console.error('Error logging in:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

// Run the tests
const runTests = async () => {
  console.log('Testing API connection...');
  await testApiConnection();
  
  console.log('\nTesting login...');
  await testLogin();
};

runTests();
