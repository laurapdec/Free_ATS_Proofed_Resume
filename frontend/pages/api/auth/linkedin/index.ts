import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';

// In-memory state store (replace with Redis/DB in production)
const stateStore = new Map<string, number>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Generate state parameter for CSRF protection
  const state = randomBytes(32).toString('hex');
  stateStore.set(state, Date.now());

  // Clean up expired states (older than 10 minutes)
  const now = Date.now();
  Array.from(stateStore.entries()).forEach(([storedState, timestamp]) => {
    if (now - timestamp > 10 * 60 * 1000) {
      stateStore.delete(storedState);
    }
  });

  // Build LinkedIn authorization URL
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', process.env.LINKEDIN_CLIENT_ID || '');
  authUrl.searchParams.append('redirect_uri', process.env.LINKEDIN_REDIRECT_URI || '');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', 'r_liteprofile r_emailaddress w_member_social');
  authUrl.searchParams.append('prompt', 'consent');

  // Redirect to LinkedIn OAuth page
  res.redirect(authUrl.toString());
}