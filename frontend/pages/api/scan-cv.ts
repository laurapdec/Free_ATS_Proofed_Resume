import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import type { Resume } from '../../../types/resume';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Here you would integrate with a CV parsing service
    // For now, we'll return a basic structure
    const parsedResume: Resume = {
      contactInfo: {
        email: '',
        phone: '',
        location: {
          city: '',
          country: '',
        },
      },
      experiences: [],
      education: [],
      publications: [],
      skills: [],
      languages: [],
    };

    res.status(200).json(parsedResume);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ message: 'Failed to process CV' });
  }
}