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
    console.log('Fetching resume ID...');
    // First get the resume ID
    const resumeResponse = await fetch(`${API_URL}/api/v1/resumes/generate-pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      mode: 'cors',
    });

    if (!resumeResponse.ok) {
      const errorText = await resumeResponse.text();
      console.error('Failed to get resume ID:', errorText);
      throw new Error(`Failed to get resume ID: ${errorText}`);
    }

    const data = await resumeResponse.json();
    console.log('Got response:', data);
    const { resume_id } = data;
    
    // Return the direct URL instead of creating a blob
    const timestamp = Date.now();
    const directUrl = `${API_URL}/api/v1/pdf/serve-pdf/${resume_id}?t=${timestamp}`;
    console.log('Returning direct PDF URL:', directUrl);
    return directUrl;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}