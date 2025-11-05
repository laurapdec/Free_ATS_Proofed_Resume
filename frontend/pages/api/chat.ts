import { NextApiRequest, NextApiResponse } from 'next';
import { LanguageServiceClient, protos } from '@google-cloud/language';

// Initialize the Language client
const client = new LanguageServiceClient();

interface JobDetails {
  companyName?: string;
  positionName?: string;
  location?: string;
  workType?: 'remote' | 'hybrid' | 'onsite';
  salaryRange?: string;
  visaSponsorship?: boolean;
  foreignersOk?: boolean;
  companyLogo?: string;
}

async function extractJobDetails(jobDescription: string): Promise<JobDetails> {
  const document: protos.google.cloud.language.v1.IDocument = {
    content: jobDescription,
    type: protos.google.cloud.language.v1.Document.Type.PLAIN_TEXT,
  };

  const entityResults = await client.analyzeEntities({ document });
  const entities = entityResults[0].entities || [];

  let jobDetails: JobDetails = {};

  // Extract company name (usually ORG entities)
  const orgEntities = entities.filter((entity: protos.google.cloud.language.v1.IEntity) =>
    entity.type === protos.google.cloud.language.v1.Entity.Type.ORGANIZATION
  );
  if (orgEntities.length > 0 && orgEntities[0].name) {
    jobDetails.companyName = orgEntities[0].name;
  }

  // Extract location (LOCATION entities)
  const locationEntities = entities.filter((entity: protos.google.cloud.language.v1.IEntity) =>
    entity.type === protos.google.cloud.language.v1.Entity.Type.LOCATION
  );
  if (locationEntities.length > 0 && locationEntities[0].name) {
    jobDetails.location = locationEntities[0].name;
  }

  // Extract position from text patterns
  const positionPatterns = [
    /(?:we are looking for|we're hiring|position:\s*|role:\s*)([a-zA-Z\s]+?)(?:\s*(?:with|who|that|\.|$))/i,
    /(?:senior|junior|lead|principal|staff)\s+([a-zA-Z\s]+?)(?:\s*(?:with|who|that|\.|$))/i,
    /([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Designer|Manager|Analyst|Scientist|Architect))/i
  ];

  for (const pattern of positionPatterns) {
    const match = jobDescription.match(pattern);
    if (match && match[1]) {
      jobDetails.positionName = match[1].trim();
      break;
    }
  }

  // Determine work type
  if (jobDescription.toLowerCase().includes('remote')) {
    jobDetails.workType = 'remote';
  } else if (jobDescription.toLowerCase().includes('hybrid')) {
    jobDetails.workType = 'hybrid';
  } else if (jobDescription.toLowerCase().includes('onsite') || jobDescription.toLowerCase().includes('office')) {
    jobDetails.workType = 'onsite';
  }

  // Check for visa sponsorship
  jobDetails.visaSponsorship = jobDescription.toLowerCase().includes('visa') ||
                              jobDescription.toLowerCase().includes('sponsorship') ||
                              jobDescription.toLowerCase().includes('work authorization');

  // Check if foreigners are OK (look for international mentions)
  jobDetails.foreignersOk = jobDescription.toLowerCase().includes('international') ||
                           jobDescription.toLowerCase().includes('global') ||
                           jobDescription.toLowerCase().includes('remote') ||
                           jobDetails.visaSponsorship;

  // Get company logo using Clearbit API (free tier)
  if (jobDetails.companyName) {
    try {
      const domain = await getCompanyDomain(jobDetails.companyName);
      if (domain) {
        jobDetails.companyLogo = `https://logo.clearbit.com/${domain}`;
      }
    } catch (error) {
      console.log('Could not fetch company logo:', error);
    }
  }

  // Get salary data from levels.fyi API
  if (jobDetails.companyName && jobDetails.positionName) {
    try {
      jobDetails.salaryRange = await getSalaryData(jobDetails.companyName, jobDetails.positionName);
    } catch (error) {
      console.log('Could not fetch salary data:', error);
    }
  }

  return jobDetails;
}

async function getCompanyDomain(companyName: string): Promise<string | null> {
  // Use a simple company name to domain mapping
  // In a real implementation, you might use an API like Clearbit's autocomplete
  const cleanName = companyName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  return `${cleanName}.com`; // Simplified - in reality you'd need better domain resolution
}

async function getSalaryData(companyName: string, positionName: string): Promise<string | undefined> {
  // This is a placeholder - levels.fyi doesn't have a public API
  // You'd need to scrape or use alternative salary data sources
  // For now, return a placeholder based on common salary ranges
  const position = positionName.toLowerCase();

  if (position.includes('senior') && position.includes('engineer')) {
    return '$150,000 - $250,000';
  } else if (position.includes('engineer')) {
    return '$100,000 - $180,000';
  } else if (position.includes('designer')) {
    return '$80,000 - $150,000';
  } else if (position.includes('manager')) {
    return '$120,000 - $200,000';
  }

  return undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, resume, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    // Check if the message contains a job description
    const isJobDescription = /job description|position|role|we are hiring|we're looking for|requirements|responsibilities/i.test(message) &&
                            message.length > 200; // Assume longer messages are job descriptions

    let response: string;
    let jobDetails: JobDetails | null = null;

    if (isJobDescription) {
      // Extract job details
      jobDetails = await extractJobDetails(message);

      response = `I detected a job description! Here's what I extracted:

**Company:** ${jobDetails.companyName || 'Not found'}
**Position:** ${jobDetails.positionName || 'Not found'}
**Location:** ${jobDetails.location || 'Not specified'}
**Work Type:** ${jobDetails.workType || 'Not specified'}
**Salary Range:** ${jobDetails.salaryRange || 'Not available'}
**Visa Sponsorship:** ${jobDetails.visaSponsorship ? 'Yes' : 'Not mentioned'}
**Open to Foreigners:** ${jobDetails.foreignersOk ? 'Likely yes' : 'Not clear'}

I've automatically filled in your application details. Would you like me to help optimize your resume for this position or generate a tailored cover letter?`;
    } else {
      // Handle general conversation
      const conversationContext = conversationHistory.slice(-5).map((msg: any) =>
        `${msg.role}: ${msg.content}`
      ).join('\n');

      // Simple conversational responses based on keywords
      if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
        response = "Hello! I'm here to help you with your job applications. You can paste a job description, ask questions about your resume, or get advice on your career. What would you like to talk about?";
      } else if (message.toLowerCase().includes('resume') || message.toLowerCase().includes('cv')) {
        response = "I'd be happy to help with your resume! You can ask me to analyze it, suggest improvements, or help tailor it for specific positions. What would you like me to focus on?";
      } else if (message.toLowerCase().includes('interview')) {
        response = "Interview preparation is crucial! I can help you practice common questions, prepare for specific roles, or give tips on how to present yourself. What type of interview are you preparing for?";
      } else if (message.toLowerCase().includes('salary') || message.toLowerCase().includes('compensation')) {
        response = "Salary negotiation can be tricky. I can help you research market rates, prepare negotiation strategies, or understand compensation packages. What specific advice are you looking for?";
      } else {
        response = "I'm here to help with your job search! Whether you need resume advice, interview preparation, salary negotiation tips, or help with job applications, just let me know what you need assistance with.";
      }
    }

    return res.status(200).json({
      response,
      isJobDescription,
      jobDetails,
      detected: isJobDescription
    });

  } catch (error) {
    console.error('Error processing chat message:', error);
    return res.status(500).json({ error: 'Error processing message' });
  }
}