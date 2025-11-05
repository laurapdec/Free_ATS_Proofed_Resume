import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Forward to backend API
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json(data);
    }

    // Set HTTP-only cookie with the token
    res.setHeader('Set-Cookie', [
      `auth-token=${data.access_token}; HttpOnly; Path=/; Max-Age=${30 * 60}; SameSite=Strict`,
      `user-data=${JSON.stringify(data.user)}; Path=/; Max-Age=${30 * 60}; SameSite=Strict`
    ]);

    return res.status(201).json({
      success: true,
      user: data.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}