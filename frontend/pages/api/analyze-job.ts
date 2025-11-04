import { NextApiRequest, NextApiResponse } from 'next';
import { LanguageServiceClient, protos } from '@google-cloud/language';

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
    const document: protos.google.cloud.language.v1.IDocument = {
      content: jobDescription,
      type: protos.google.cloud.language.v1.Document.Type.PLAIN_TEXT,
    };

    // Perform entity and sentiment analysis
    const entityResults = await client.analyzeEntities({ document });
    const sentimentResults = await client.analyzeSentiment({ document });
    
    const entities = entityResults[0].entities || [];
    const sentiment = sentimentResults[0].documentSentiment;

    // Extract key skills and requirements from job description
    const skills = entities
      .filter((entity: protos.google.cloud.language.v1.IEntity) => 
        entity.type === protos.google.cloud.language.v1.Entity.Type.OTHER || // Skills are often tagged as OTHER
        entity.type === protos.google.cloud.language.v1.Entity.Type.CONSUMER_GOOD || // Technology products
        entity.type === protos.google.cloud.language.v1.Entity.Type.UNKNOWN // Sometimes skills are tagged as unknown
      )
      .map((entity: protos.google.cloud.language.v1.IEntity) => entity.name || '');

    // Compare with resume
    const resumeSkills = new Set(resume.skills || []);
    const matchingSkills = skills.filter((skill: string) => resumeSkills.has(skill));
    const missingSkills = skills.filter((skill: string) => !resumeSkills.has(skill));

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
   - Overall tone: ${(sentiment?.score || 0) > 0 ? 'Positive' : 'Neutral'}
   - Key requirements identified: ${skills.length}

Would you like me to help you tailor your resume for this position or generate a customized cover letter?`;

    return res.status(200).json({ analysis, skills, matchingSkills, missingSkills });

  } catch (error) {
    console.error('Error analyzing job description:', error);
    return res.status(500).json({ error: 'Error analyzing job description' });
  }
}