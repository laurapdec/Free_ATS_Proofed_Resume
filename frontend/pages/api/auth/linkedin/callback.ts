import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// In-memory state store (imported from the auth endpoint)
declare const stateStore: Map<string, number>;

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

  // Validate state parameter
  if (!state || typeof state !== 'string' || !stateStore.has(state)) {
    return res.redirect('/error?message=Invalid state parameter');
  }

  // Check state expiration
  const timestamp = stateStore.get(state)!;
  if (Date.now() - timestamp > 10 * 60 * 1000) {
    stateStore.delete(state);
    return res.redirect('/error?message=State parameter expired');
  }

  // Remove used state
  stateStore.delete(state);

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
    });

    const { access_token } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    // Store the user data in your preferred storage solution
    // For now, we'll just redirect to the editor page
    const redirectPath = '/editor';
    res.redirect(redirectPath);
  } catch (error) {
    console.error('LinkedIn API Error:', error);
    res.redirect('/error?message=Authentication failed');
  }
}