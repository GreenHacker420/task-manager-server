import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';
import Task from './models/task.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create demo user
const createDemoUser = async () => {
  try {
    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'demo@example.com' });

    if (existingUser) {
      console.log('Demo user already exists, deleting...');
      await User.deleteOne({ email: 'demo@example.com' });
    }

    // Create new demo user with direct password (will be hashed by pre-save hook)
    const demoUser = new User({
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'password',  // This will be hashed by the pre-save hook
      avatar: '/avatar.png'
    });

    await demoUser.save();
    console.log('Demo user created successfully');
    console.log('Demo user password hash:', demoUser.password);
    return demoUser;
  } catch (error) {
    console.error('Error creating demo user:', error);
    process.exit(1);
  }
};

// Create demo tasks
const createDemoTasks = async (userId) => {
  try {
    // Check if demo tasks already exist
    const existingTasks = await Task.find({ createdBy: userId });

    if (existingTasks.length > 0) {
      console.log('Demo tasks already exist');
      return;
    }

    // Create demo tasks
    const demoTasks = [
      {
        title: 'Draft the initial concept',
        description: 'Create the initial concept for the project',
        status: 'Draft',
        type: 'Main Task',
        progress: 25,
        subtasks: [
          { text: 'Research market trends', completed: true, authorId: userId },
          { text: 'Define project scope', completed: false, authorId: userId }
        ],
        tags: ['Important', 'Urgent'],
        priority: 'High',
        comments: 3,
        files: 2,
        starred: true,
        dueDate: new Date('2024-08-10'),
        createdAt: new Date('2024-01-05'),
        assignedTo: userId,
        createdBy: userId,
        category: 'Marketing'
      },
      {
        title: 'UI/UX enhancements',
        description: 'Improve the user interface and experience',
        status: 'In Progress',
        type: 'Secondary Task',
        progress: 70,
        subtasks: [
          { text: 'Design wireframes', completed: true, authorId: userId },
          { text: 'Develop prototypes', completed: true, authorId: userId }
        ],
        tags: ['Design', 'Review'],
        priority: 'Medium',
        comments: 5,
        files: 1,
        starred: false,
        dueDate: new Date('2024-08-15'),
        createdAt: new Date('2024-01-08'),
        assignedTo: userId,
        createdBy: userId,
        category: 'Development'
      },
      {
        title: 'Content refinement',
        description: 'Refine the content for the project',
        status: 'Editing',
        type: 'Tertiary Task',
        progress: 50,
        subtasks: [
          { text: 'Proofread content', completed: false, authorId: userId },
          { text: 'Edit for clarity', completed: false, authorId: userId }
        ],
        tags: ['Review'],
        priority: 'Low',
        comments: 2,
        files: 3,
        starred: true,
        dueDate: new Date('2024-08-20'),
        createdAt: new Date('2024-01-12'),
        assignedTo: userId,
        createdBy: userId,
        category: 'Content'
      },
      {
        title: 'Finalize documentation',
        description: 'Complete all documentation for the project',
        status: 'Done',
        type: 'Main Task',
        progress: 100,
        subtasks: [
          { text: 'Compile user guides', completed: true, authorId: userId },
          { text: 'Submit final report', completed: true, authorId: userId }
        ],
        tags: ['Documentation'],
        priority: 'Urgent',
        comments: 0,
        files: 5,
        starred: false,
        dueDate: new Date('2024-08-25'),
        createdAt: new Date('2024-01-15'),
        assignedTo: userId,
        createdBy: userId,
        category: 'Documentation'
      }
    ];

    await Task.insertMany(demoTasks);
    console.log('Demo tasks created successfully');
  } catch (error) {
    console.error('Error creating demo tasks:', error);
    process.exit(1);
  }
};

// Run the seed function
const seedDatabase = async () => {
  try {
    const demoUser = await createDemoUser();
    await createDemoTasks(demoUser._id);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
