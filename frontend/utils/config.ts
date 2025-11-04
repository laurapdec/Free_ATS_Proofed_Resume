export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  defaultTimeout: 30000, // 30 seconds
  maxRetries: 3,
} as const;