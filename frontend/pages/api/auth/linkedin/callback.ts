import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, state } = req.query;

  // Verify state to prevent CSRF attacks
  const savedState = sessionStorage.getItem('linkedin_oauth_state');
  if (state !== savedState) {
    return res.status(400).json({ message: 'Invalid state parameter' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/linkedin/callback`,
        client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
    });

    const { access_token } = tokenResponse.data;

    // Fetch user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    // Fetch email address
    const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    // Transform LinkedIn data to our Resume format
    const profile = profileResponse.data;
    const email = emailResponse.data.elements[0]['handle~'].emailAddress;

    // Redirect back to the main page with the profile data
    res.redirect(
      `/?profile=${encodeURIComponent(
        JSON.stringify({
          contactInfo: {
            email,
            phone: '',  // LinkedIn API doesn't provide phone number
            location: {
              city: profile.location.preferredLocale.country,
              country: profile.location.country.defaultLocale,
            },
          },
          experiences: profile.positions.values.map((position: any) => ({
            id: position.id,
            title: position.title,
            company: position.company.name,
            location: position.location.name,
            startDate: position.startDate.year + '-' + position.startDate.month,
            endDate: position.isCurrent ? 'Present' : position.endDate.year + '-' + position.endDate.month,
            description: [position.summary || ''],
            skills: [],
          })),
          education: profile.educations.values.map((education: any) => ({
            id: education.id,
            school: education.schoolName,
            degree: education.degree,
            field: education.fieldOfStudy,
            startDate: education.startDate.year.toString(),
            endDate: education.endDate ? education.endDate.year.toString() : '',
          })),
          publications: [],
          skills: profile.skills.values.map((skill: any) => ({
            id: skill.id,
            name: skill.skill.name,
            level: 'Intermediate',
            endorsements: skill.numEndorsements,
          })),
          languages: profile.languages.values.map((language: any) => ({
            id: language.id,
            name: language.language.name,
            proficiency: 'Professional Working',
          })),
        })
      )}`
    );
  } catch (error) {
    console.error('LinkedIn API Error:', error);
    res.redirect('/?error=linkedin_api_error');
  }
}