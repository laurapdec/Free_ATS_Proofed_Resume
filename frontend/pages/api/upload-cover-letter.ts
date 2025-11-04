import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

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
    const [_, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ message: 'Invalid file type. Please upload a PDF or DOCX file.' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalExt = path.extname(file.originalFilename || '');
    const filename = `cover-letter-${timestamp}${originalExt}`;
    const filepath = path.join(uploadsDir, filename);

    // Copy file to uploads directory
    await fs.promises.copyFile(file.filepath, filepath);

    // Return the URL for the uploaded file
    const fileUrl = `/uploads/${filename}`;
    res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
}