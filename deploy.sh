#!/bin/bash

# Production Deployment Script for ATS Resume Optimizer

echo "🚀 Starting production deployment..."

# Check if required environment variables are set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN environment variable is not set"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd frontend
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod --yes

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app is now live at: https://atsproofedcv.com"
else
    echo "❌ Deployment failed"
    exit 1
fi

echo "🎉 Production deployment completed!"