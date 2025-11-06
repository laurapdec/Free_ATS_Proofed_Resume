# Cloud Run Deployment Instructions

## Step 1: Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project watchful-lotus-451816-k2
```

## Step 2: Build and Push Docker Image

```bash
PROJECT_ID="watchful-lotus-451816-k2"
SERVICE_NAME="ats-resume-backend"
REGION="us-central1"

# Build the Docker image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest backend/

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest
```

## Step 3: Deploy to Cloud Run

Replace the environment variable values with your actual credentials from `.env`:

```bash
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="YOUR_DATABASE_URL" \
  --set-env-vars SECRET_KEY="YOUR_SECRET_KEY" \
  --set-env-vars ALGORITHM="HS256" \
  --set-env-vars FRONTEND_URL="https://www.atsproofedcv.com" \
  --set-env-vars BACKEND_CORS_ORIGINS="https://www.atsproofedcv.com,http://localhost:3000" \
  --set-env-vars LINKEDIN_CLIENT_ID="YOUR_LINKEDIN_CLIENT_ID" \
  --set-env-vars LINKEDIN_CLIENT_SECRET="YOUR_LINKEDIN_CLIENT_SECRET" \
  --set-env-vars GOOGLE_CLOUD_PROJECT="watchful-lotus-451816-k2" \
  --set-env-vars SENDGRID_API_KEY="YOUR_SENDGRID_API_KEY" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --max-instances 100
```

## Get the Cloud Run Service URL

```bash
gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)'
```

Update your frontend `NEXT_PUBLIC_API_URL` with this URL.

## View Logs

```bash
gcloud run logs read $SERVICE_NAME --limit 50 --region $REGION
```
