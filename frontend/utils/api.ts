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
    if (!resumeData) {
      throw new Error('No resume data provided');
    }

    // Validate required fields
    if (!resumeData.contactInfo) {
      throw new Error('Contact information is required');
    }

    console.log('Generating PDF with data:', resumeData);
    
    // Add cache-busting query parameter
    const timestamp = Date.now();
    const url = `${API_URL}/api/v1/resumes/generate-pdf?t=${timestamp}`;
    
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/pdf',
      },
      credentials: 'same-origin', // Changed from 'include' to 'same-origin'
      mode: 'cors',
      body: JSON.stringify(resumeData),
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to generate PDF';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('Invalid response format: Expected PDF');
    }

    try {
      // Convert the response to a blob and create an object URL
      const blob = await response.blob();
      // Revoke any existing object URL to prevent memory leaks
      if (window._pdfObjectUrl) {
        URL.revokeObjectURL(window._pdfObjectUrl);
      }
      const objectUrl = URL.createObjectURL(blob);
      window._pdfObjectUrl = objectUrl; // Store for later cleanup
      return objectUrl;
    } catch (blobError) {
      console.error('Error creating blob URL:', blobError);
      throw new Error('Failed to create PDF preview');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}