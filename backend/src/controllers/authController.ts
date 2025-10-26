import { Request, Response } from 'express';
import User from '../models/User';

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = req.user as any;
    const userData = await User.findById(user.id);

    if (!userData) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: userData._id,
        linkedinId: userData.linkedinId,
        displayName: userData.displayName,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profilePicture: userData.profilePicture,
        headline: userData.headline,
        summary: userData.summary,
        positions: userData.positions,
        educations: userData.educations,
        skills: userData.skills,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = req.user as any;
    const userData = await User.findById(user.id);

    if (!userData) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Return the raw profile data
    res.status(200).json({
      success: true,
      profile: userData.rawProfileData,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response): void => {
  req.logout((err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Error logging out' });
      return;
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
};
