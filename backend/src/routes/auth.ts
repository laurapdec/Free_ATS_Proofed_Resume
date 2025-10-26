import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import { getCurrentUser, getUserProfile, logout } from '../controllers/authController';

const router = Router();

// LinkedIn OAuth routes
router.get('/linkedin', passport.authenticate('linkedin'));

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    // Successful authentication, redirect to frontend
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendURL}/dashboard`);
  }
);

// Get current authenticated user
router.get('/user', getCurrentUser);

// Get user profile data
router.get('/profile', getUserProfile);

// Logout
router.post('/logout', logout);

// Check authentication status
router.get('/check', (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ authenticated: true, user: req.user });
  } else {
    res.status(200).json({ authenticated: false });
  }
});

export default router;
