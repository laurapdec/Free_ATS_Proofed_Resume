#!/bin/bash

# Backend Deployment Script for Vercel
echo "🚀 Deploying Free ATS Resume Backend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ You're not logged in to Vercel. Please login first:"
    echo "vercel login"
    exit 1
fi

# Deploy to Vercel
echo "📦 Deploying backend to Vercel..."
vercel --prod

echo "✅ Backend deployment complete!"
echo "🔗 Update your frontend .env.production with the new backend URL"
echo "Example: NEXT_PUBLIC_API_URL=https://your-backend-project.vercel.app"