import { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error, error_description } = req.query

  // Handle OAuth errors
  if (error) {
    return res.redirect(`/error?message=${error_description || 'Authentication failed'}`)
  }

  // Exchange code for access token
  try {
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI as string,
        client_id: process.env.LINKEDIN_CLIENT_ID as string,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET as string,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const { access_token } = await tokenResponse.json()

    // Fetch user profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch profile')
    }

    const profile = await profileResponse.json()

    // Redirect to editor with the profile data
    res.redirect(`/editor?profile=${encodeURIComponent(JSON.stringify(profile))}`)
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    res.redirect('/error?message=Failed to authenticate with LinkedIn')
  }
}