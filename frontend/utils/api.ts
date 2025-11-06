import { config } from './config';
const API_URL = config.apiUrl;

async function fetchWithRetry(url: string, options: RequestInit, retries: number = config.maxRetries): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function generatePDF(resumeData: any): Promise<string> {
  try {
    console.log('Generating PDF with resume data...');

    // Send the resume data to generate the PDF
    const response = await fetchWithRetry(`${API_URL}/api/v1/resumes/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(resumeData),
      mode: 'cors',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to generate PDF:', errorText);
      throw new Error(`Failed to generate PDF: ${errorText}`);
    }

    const data = await response.json();
    console.log('PDF generation response:', data);

    // Return the direct URL to serve the PDF
    const timestamp = Date.now();
    const directUrl = `${API_URL}/api/v1/pdf/serve-pdf/${data.resume_id}?t=${timestamp}`;
    console.log('Returning PDF URL:', directUrl);
    return directUrl;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}