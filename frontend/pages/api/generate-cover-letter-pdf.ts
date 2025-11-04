import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

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
    const content = fields.content?.[0];

    if (!content) {
      return res.status(400).json({ message: 'No content provided' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `generated-cover-letter-${timestamp}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    // Create PDF
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);
    doc.fontSize(12).text(content);
    doc.end();

    // Wait for the stream to finish
    await new Promise<void>((resolve) => stream.on('finish', resolve));

    // Return the URL for the generated PDF
    const fileUrl = `/uploads/${filename}`;
    res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
}