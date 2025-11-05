import { NextApiRequest, NextApiResponse } from 'next';
import { parseCookies } from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get token from cookies
    const cookies = parseCookies({ req });
    const token = cookies['auth-token'];

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

    if (req.method === 'GET') {
      // Get profile
      const backendResponse = await fetch(`${backendUrl}/api/v1/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        return res.status(backendResponse.status).json(data);
      }

      return res.status(200).json(data);

    } else if (req.method === 'PUT') {
      // Update profile
      const backendResponse = await fetch(`${backendUrl}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        return res.status(backendResponse.status).json(data);
      }

      return res.status(200).json(data);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}