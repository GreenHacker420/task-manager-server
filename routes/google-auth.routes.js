import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.model.js';
import { generateToken } from '../utils/jwt.utils.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route   POST /api/auth/google
// @desc    Login or register with Google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }
    
    const { email, name, picture } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if not exists
      // Generate a random password for Google users
      const randomPassword = Math.random().toString(36).slice(-8);
      
      user = new User({
        name,
        email,
        password: randomPassword, // This will be hashed by the pre-save hook
        avatar: picture || ''
      });
      
      await user.save();
    }
    
    // Generate JWT token
    const jwtToken = generateToken(user._id);
    
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

export default router;
