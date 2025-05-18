import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/user.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for testing login'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Test login function
const testLogin = async (email, password) => {
  try {
    console.log(`Attempting to login with email: ${email} and password: ${password}`);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      return false;
    }
    
    console.log('User found:', user.email);
    console.log('Stored password hash:', user.password);
    
    // Test password comparison
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match result:', isMatch);
      return isMatch;
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return false;
    }
  } catch (error) {
    console.error('Error testing login:', error);
    return false;
  }
};

// Create a new user with a known password
const createTestUser = async () => {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('Test user already exists, deleting...');
      await User.deleteOne({ email: 'test@example.com' });
    }
    
    // Create new test user with a known password
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword
    });
    
    await testUser.save();
    console.log('Test user created with password:', password);
    console.log('Hashed password:', hashedPassword);
    
    return { email: 'test@example.com', password };
  } catch (error) {
    console.error('Error creating test user:', error);
    return null;
  }
};

// Run the test
const runTest = async () => {
  try {
    // Create test user
    const testUser = await createTestUser();
    
    if (!testUser) {
      console.log('Failed to create test user');
      process.exit(1);
    }
    
    // Test login with correct credentials
    console.log('\nTesting login with correct credentials:');
    const correctLoginResult = await testLogin(testUser.email, testUser.password);
    console.log('Login result with correct credentials:', correctLoginResult);
    
    // Test login with incorrect password
    console.log('\nTesting login with incorrect password:');
    const incorrectLoginResult = await testLogin(testUser.email, 'wrongpassword');
    console.log('Login result with incorrect password:', incorrectLoginResult);
    
    // Test login with demo user
    console.log('\nTesting login with demo user:');
    const demoLoginResult = await testLogin('demo@example.com', 'password');
    console.log('Login result with demo user:', demoLoginResult);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nLogin test complete');
  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    process.exit(0);
  }
};

runTest();
