import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';
import Task from './models/task.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for checking'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Check users in the database
const checkUsers = async () => {
  try {
    const users = await User.find({}).select('-password');
    console.log('Users in the database:');
    console.log(JSON.stringify(users, null, 2));
    
    // Check if demo user exists
    const demoUser = await User.findOne({ email: 'demo@example.com' });
    if (demoUser) {
      console.log('\nDemo user exists with ID:', demoUser._id);
    } else {
      console.log('\nDemo user does not exist');
    }
    
    return users;
  } catch (error) {
    console.error('Error checking users:', error);
    return [];
  }
};

// Check tasks in the database
const checkTasks = async (userId) => {
  try {
    const tasks = await Task.find({ createdBy: userId });
    console.log(`\nTasks for user ${userId}:`);
    console.log(`Total tasks: ${tasks.length}`);
    
    if (tasks.length > 0) {
      console.log('Task statuses:');
      const statusCounts = {};
      tasks.forEach(task => {
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      });
      console.log(statusCounts);
    }
    
    return tasks;
  } catch (error) {
    console.error('Error checking tasks:', error);
    return [];
  }
};

// Run the check
const checkDatabase = async () => {
  try {
    const users = await checkUsers();
    
    if (users.length > 0) {
      const userId = users[0]._id;
      await checkTasks(userId);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase check complete');
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    process.exit(0);
  }
};

checkDatabase();
