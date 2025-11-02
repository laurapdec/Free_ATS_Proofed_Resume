const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

export async function generatePDF(resumeData: any): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/api/v1/resumes/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      mode: 'cors',
      body: JSON.stringify(resumeData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Convert the response to a blob and create an object URL
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}