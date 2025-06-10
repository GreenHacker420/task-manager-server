import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from '../../routes/auth.routes.js';
import googleAuthRoutes from '../../routes/google-auth.routes.js';
import userRoutes from '../../routes/user.routes.js';
import taskRoutes from '../../routes/task.routes.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Trust proxy for serverless functions
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for Netlify Functions
}));

// Rate limiting (configured for serverless)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  keyGenerator: (req) => {
    // Use Netlify's client IP header or fallback
    return req.headers['x-nf-client-connection-ip'] ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.ip ||
           'unknown';
  }
});

app.use(limiter);

// CORS configuration - simplified for serverless
app.use(cors({
  origin: [
    'https://task.greenhacker.tech',
    'http://task.greenhacker.tech',
    'https://task-manager-frontend-app.netlify.app',
    /https:\/\/[a-z0-9-]+--task-manager-frontend-app\.netlify\.app/,
    process.env.FRONTEND_URL || 'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Total-Count'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Additional CORS headers for serverless functions
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://task.greenhacker.tech');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging middleware
app.use(morgan('combined'));

// Connect to MongoDB (with connection caching for serverless)
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    console.log('Attempting MongoDB connection...');
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1, // Limit connection pool for serverless
    });

    cachedDb = connection;
    console.log('MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

// Middleware to ensure database connection (only for routes that need it)
const requireDatabase = async (req, res, next) => {
  try {
    // Set a timeout for database connection to prevent function timeout
    const connectionPromise = connectToDatabase();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 8000)
    );

    await Promise.race([connectionPromise, timeoutPromise]);
    next();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    res.status(500).json({
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Routes (apply database middleware only to routes that need it)
app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/auth', requireDatabase, googleAuthRoutes);
app.use('/api/users', requireDatabase, userRoutes);
app.use('/api/tasks', requireDatabase, taskRoutes);

// API root route
app.get('/api', (_req, res) => {
  res.json({
    message: 'Welcome to Task Manager API',
    status: 'healthy',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Test route
app.post('/api/test', (req, res) => {
  console.log('Test route hit with body:', req.body);
  res.json({
    message: 'Test route successful',
    receivedData: req.body
  });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    message: err.message || 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Export the serverless function
export const handler = serverless(app);
