import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.routes.js';
import googleAuthRoutes from './routes/google-auth.routes.js';
import userRoutes from './routes/user.routes.js';
import taskRoutes from './routes/task.routes.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
// Apply Helmet for security headers
app.use(helmet());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all requests
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if(!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:8080',
      // Allow Netlify domains for frontend deployment
      'https://task-manager-frontend-app.netlify.app',
      'https://682a3d73ebf3b97da1be65b7--task-manager-frontend-app.netlify.app',
      'https://682a3f85ce6033e5b4528a1e--task-manager-frontend-app.netlify.app',
      'https://682a45646e7c9ce0247457f4--task-manager-frontend-app.netlify.app',
      'https://task.greenhacker.tech',
      'http://task.greenhacker.tech',
      // Allow Netlify deploy previews and branch deploys
      /https:\/\/[a-z0-9-]+--task-manager-frontend-app\.netlify\.app/
    ];

    // In production, check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      // In development, allow all origins
      callback(null, true);
    } else {
      console.log('CORS blocked request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Total-Count'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging middleware - use 'combined' format in production for more details
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI format check:', process.env.MONGODB_URI ?
  `URI starts with: ${process.env.MONGODB_URI.substring(0, 10)}...` : 'MongoDB URI is not defined');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('MongoDB connection error details:', JSON.stringify(err, null, 2));
    process.exit(1);
  });

// Debug middleware to log request body - only in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log('Request Body:', req.body);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

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

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Use path and fileURLToPath
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Serve static files from the public directory
  const staticPath = path.resolve(__dirname, 'public');
  console.log(`Serving static files from: ${staticPath}`);

  app.use(express.static(staticPath));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res, next) => {
    // Skip API routes and health check
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
