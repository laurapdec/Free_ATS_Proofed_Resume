# Backend Deployment to Vercel

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```
3. **Google Cloud SQL**: Set up your PostgreSQL instance
4. **Environment Variables**: Configure your production secrets

## Deployment Steps

### 1. Login to Vercel
```bash
vercel login
```

### 2. Configure Environment Variables
Before deploying, set up your environment variables in Vercel:

```bash
# Navigate to backend directory
cd backend

# Set environment variables (replace with your actual values)
vercel env add BACKEND_CORS_ORIGINS
vercel env add FRONTEND_URL
vercel env add LINKEDIN_CLIENT_ID
vercel env add LINKEDIN_CLIENT_SECRET
vercel env add LINKEDIN_REDIRECT_URI
vercel env add DATABASE_URL
vercel env add SECRET_KEY
vercel env add ALLOWED_HOSTS
vercel env add SENDGRID_API_KEY
vercel env add FROM_EMAIL
vercel env add DB_USER
vercel env add DB_PASS
vercel env add DB_NAME
vercel env add INSTANCE_CONNECTION_NAME
vercel env add GOOGLE_APPLICATION_CREDENTIALS_BASE64
```

Or use the deploy script:
```bash
./deploy.sh
```

### 3. Deploy to Production
```bash
vercel --prod
```

### 4. Update Frontend Configuration
After deployment, update your frontend's `.env.production`:

```dotenv
NEXT_PUBLIC_API_URL=https://your-backend-project.vercel.app
```

Replace `your-backend-project` with your actual Vercel project name.

### 5. Redeploy Frontend
```bash
cd ../frontend
vercel --prod
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `BACKEND_CORS_ORIGINS` | Allowed frontend URLs | `https://atsproofedcv.com` |
| `FRONTEND_URL` | Frontend application URL | `https://atsproofedcv.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `SECRET_KEY` | Random secret key for JWT | `your-secure-random-key` |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID | `77gcmcgk4l7uc7` |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth client secret | `your-secret` |
| `LINKEDIN_REDIRECT_URI` | OAuth callback URL | `https://your-backend.vercel.app/api/v1/linkedin/callback` |

## Troubleshooting

- **CORS Issues**: Ensure `BACKEND_CORS_ORIGINS` includes your frontend URL
- **Database Connection**: Verify Google Cloud SQL instance is accessible
- **Environment Variables**: Check all required variables are set in Vercel dashboard
- **Build Errors**: Ensure all dependencies are in `requirements.txt`

## Google Cloud SQL Setup

1. Create a PostgreSQL instance in Google Cloud Console
2. Enable Cloud SQL Admin API
3. Create a service account with Cloud SQL Client role
4. Download the JSON key and base64 encode it for `GOOGLE_APPLICATION_CREDENTIALS_BASE64`