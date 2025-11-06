import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import type { Resume } from '../../types/resume';
import fs from 'fs';
import { config as appConfig } from '../../utils/config';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let files: formidable.Files = {};

  try {
    const form = formidable();
    [, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('cv', fs.createReadStream(file.filepath), {
      filename: file.originalFilename || 'resume.pdf',
      contentType: file.mimetype || 'application/pdf',
    });
    formData.append('name', 'Uploaded Resume');
    formData.append('email', 'user@example.com');
    formData.append('role', 'Job Seeker');

    const uploadResponse = await fetch(`${appConfig.apiUrl}/api/v1/resumes/upload/`, {
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${await uploadResponse.text()}`);
    }

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
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to process CV'
    });
  } finally {
    const file = files?.file?.[0];
    if (file?.filepath) {
      try {
        fs.unlinkSync(file.filepath);
      } catch (err) {
        console.error('Error cleaning up temp file:', err);
      }
    }
  }
}