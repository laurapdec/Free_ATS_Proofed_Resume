const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function generatePDF(resumeData: any): Promise<string> {
  try {
    console.log('Generating PDF with data:', resumeData);
    const response = await fetch(`${API_URL}/api/v1/resumes/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/pdf',
      },
      mode: 'cors',
      body: JSON.stringify(resumeData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate PDF: ${errorText}`);
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('Invalid response format: Expected PDF');
    }

    // Convert the response to a blob and create an object URL
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return url;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}