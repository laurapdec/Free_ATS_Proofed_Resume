import { NextApiRequest, NextApiResponse } from 'next';
import { LanguageServiceClient } from '@google-cloud/language';

// Initialize the Language client
const client = new LanguageServiceClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobDescription, resume } = req.body;

    if (!jobDescription || !resume) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Analyze the job description with Google Cloud Natural Language API
    const document = {
      content: jobDescription,
      type: 'PLAIN_TEXT',
    };

    // Perform entity and sentiment analysis
    const [result] = await client.analyzeEntities({ document });
    const [sentiment] = await client.analyzeSentiment({ document });

    // Extract key skills and requirements from job description
    const skills = result.entities
      .filter(entity => 
        entity.type === 'SKILL' || 
        entity.type === 'TECHNOLOGY' ||
        entity.type === 'UNKNOWN' // Sometimes skills are tagged as unknown
      )
      .map(entity => entity.name);

    // Compare with resume
    const resumeSkills = new Set(resume.skills || []);
    const matchingSkills = skills.filter(skill => resumeSkills.has(skill));
    const missingSkills = skills.filter(skill => !resumeSkills.has(skill));

    // Generate personalized analysis
    const analysis = `
Based on my analysis of the job description:

1. Skills Match:
   - You have ${matchingSkills.length} matching skills: ${matchingSkills.join(', ')}
   - Consider highlighting these skills in your application

2. Areas for Development:
   - The role requires these additional skills: ${missingSkills.join(', ')}
   - Consider acquiring or emphasizing experience in these areas

3. Job Sentiment:
   - Overall tone: ${sentiment.documentSentiment.score > 0 ? 'Positive' : 'Neutral'}
   - Key requirements identified: ${skills.length}

Would you like me to help you tailor your resume for this position or generate a customized cover letter?`;

    return res.status(200).json({ analysis, skills, matchingSkills, missingSkills });

  } catch (error) {
    console.error('Error analyzing job description:', error);
    return res.status(500).json({ error: 'Error analyzing job description' });
  }
}