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
    console.log('[LinkedIn Callback] Received authorization code. Exchanging for token...');
    
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
    console.log('[LinkedIn Callback] Successfully obtained access token');

    // Get user profile
    console.log('[LinkedIn Callback] Fetching user profile...');
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log('[LinkedIn Callback] Profile data received:', {
      id: profileResponse.data.id,
      firstName: profileResponse.data.firstName,
      lastName: profileResponse.data.lastName,
    });

    // Store the user data in your preferred storage solution
    // Redirect back to home page
    const redirectPath = '/';
    console.log('[LinkedIn Callback] Redirecting to:', redirectPath);
    res.redirect(redirectPath);
    } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[LinkedIn Callback] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
        }
      });
    } else {
      console.error('[LinkedIn Callback] Unknown Error:', error);
    }
    res.redirect('/error');
  }
}