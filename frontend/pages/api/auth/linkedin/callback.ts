import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, state, error, error_description } = req.query;

  // Handle LinkedIn OAuth errors
  if (error) {
    console.error('LinkedIn OAuth error:', error, error_description);
    return res.redirect(`/error?message=${encodeURIComponent(error_description as string || 'Authentication failed')}`);
  }

  try {
    // Forward the authentication code to your backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await axios.get(`${backendUrl}/api/v1/linkedin/callback`, {
      params: {
        code,
        state,
      },
    });

    // If the backend call is successful, redirect to the editor page
    await response;
    const redirectPath = sessionStorage.getItem('redirect_after_auth') || '/editor';
    res.redirect(redirectPath);
  } catch (error) {
    console.error('Backend API Error:', error);
    res.redirect('/error?message=Authentication failed');
  }
}