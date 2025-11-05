# Google Cloud SQL Setup Guide

This guide will help you set up Google Cloud SQL for your ATS Resume application to replace the default SQLite database with a production-ready PostgreSQL database.

## Prerequisites

1. **Google Cloud Account**: Sign up at [cloud.google.com](https://cloud.google.com)
2. **Billing Enabled**: Enable billing for your Google Cloud project
3. **Google Cloud SDK**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk)
4. **Authentication**: Run `gcloud auth login` to authenticate

## Quick Setup (Automated)

The easiest way to set up Google Cloud SQL is using our automated setup script:

```bash
cd backend
python setup_cloudsql.py
```

The script will:
- Check your Google Cloud authentication
- Create a Cloud SQL PostgreSQL instance
- Create a database and user
- Update your `.env` file with the correct configuration
- Provide next steps for running the application

## Manual Setup

If you prefer to set up Cloud SQL manually:

### 1. Create a Cloud SQL Instance

```bash
# Set your project (replace with your project ID)
gcloud config set project YOUR_PROJECT_ID

# Create PostgreSQL instance
gcloud sql instances create ats-resume-db \
    --region=us-central1 \
    --database-version=POSTGRES_13 \
    --tier=db-f1-micro \
    --storage-type=HDD \
    --storage-size=10GB \
    --backup-start-time=02:00
```

### 2. Create Database and User

```bash
# Create database
gcloud sql databases create ats_resume --instance=ats-resume-db

# Create user
gcloud sql users create ats_user --instance=ats-resume-db --password=YOUR_PASSWORD
```

### 3. Configure Environment Variables

Update your `.env` file with:

```env
# Database Configuration for Google Cloud SQL
DATABASE_TYPE=cloudsql
INSTANCE_CONNECTION_NAME=YOUR_PROJECT:us-central1:ats-resume-db
DB_USER=ats_user
DB_PASS=YOUR_PASSWORD
DB_NAME=ats_resume

# Google Cloud Project
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
```

## Database Migration

If you have existing data in SQLite, you can migrate it to Cloud SQL:

```python
from app.db.models import migrate_from_sqlite_to_cloudsql
migrate_from_sqlite_to_cloudsql()
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Initialize Database

```python
from app.db.models import init_db
init_db()
```

## Start the Application

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Troubleshooting

### Connection Issues

1. **Check Environment Variables**: Ensure all Cloud SQL variables are set correctly
2. **Service Account**: Make sure your Google Cloud credentials are valid
3. **Firewall**: Cloud SQL should allow connections from your IP

### Authentication Errors

```bash
# Check authentication
gcloud auth list

# Check project
gcloud config get-value project

# Re-authenticate if needed
gcloud auth login
```

### Database Errors

```bash
# Check instance status
gcloud sql instances describe ats-resume-db

# Check database list
gcloud sql databases list --instance=ats-resume-db

# Check users
gcloud sql users list --instance=ats-resume-db
```

## Cost Optimization

- **Instance Tier**: Start with `db-f1-micro` for development
- **Storage**: Begin with 10GB HDD storage
- **Backups**: Automatic daily backups are enabled
- **Monitoring**: Use Cloud Monitoring to track usage

## Production Considerations

1. **Instance Sizing**: Upgrade to `db-g1-small` or higher for production
2. **High Availability**: Enable read replicas for better performance
3. **SSL**: Use SSL connections in production
4. **Backup Strategy**: Configure automated backups
5. **Monitoring**: Set up alerts for database metrics

## Support

For issues with Google Cloud SQL setup, check:
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud SQL Troubleshooting](https://cloud.google.com/sql/docs/troubleshooting)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-cloud-sql)