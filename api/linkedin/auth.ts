import { VercelRequest, VercelResponse } from '@vercel/node'
import { v4 as uuidv4 } from 'uuid'

// Store states in memory (for demo purposes - use a proper state store in production)
const states = new Map()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Generate and store state parameter for CSRF protection
  const state = uuidv4()
  states.set(state, Date.now())

  // Clean up old states (older than 1 hour)
  const oneHourAgo = Date.now() - 3600000
  for (const [key, timestamp] of states.entries()) {
    if (timestamp < oneHourAgo) {
      states.delete(key)
    }
  }

  // Build LinkedIn authorization URL
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('client_id', process.env.LINKEDIN_CLIENT_ID as string)
  authUrl.searchParams.append('redirect_uri', process.env.LINKEDIN_REDIRECT_URI as string)
  authUrl.searchParams.append('state', state)
  authUrl.searchParams.append('scope', 'r_liteprofile r_emailaddress w_member_social')
  authUrl.searchParams.append('prompt', 'consent')

  // Redirect to LinkedIn
  res.redirect(307, authUrl.toString())
}