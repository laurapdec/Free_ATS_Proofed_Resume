#!/usr/bin/env python3
"""
Google Cloud SQL Setup Script for ATS Resume Application

This script helps you set up Google Cloud SQL for your ATS Resume application.
It guides you through creating a PostgreSQL instance and configuring the necessary
environment variables.

Prerequisites:
1. Google Cloud account with billing enabled
2. Google Cloud SDK installed (gcloud)
3. Authenticated with Google Cloud (gcloud auth login)

Usage:
    python setup_cloudsql.py
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, description):
    """Run a shell command and return the result."""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ Success")
            return result.stdout.strip()
        else:
            print(f"✗ Failed: {result.stderr}")
            return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def check_gcloud_auth():
    """Check if user is authenticated with Google Cloud."""
    print("Checking Google Cloud authentication...")
    result = run_command("gcloud auth list --filter=status:ACTIVE --format='value(account)'", "Checking authentication")
    if not result:
        print("\n❌ Not authenticated with Google Cloud.")
        print("Please run: gcloud auth login")
        return False
    print(f"✓ Authenticated as: {result}")
    return True

def get_project_id():
    """Get the current Google Cloud project ID."""
    result = run_command("gcloud config get-value project", "Getting current project")
    if not result:
        print("\n❌ No project set.")
        print("Please set a project: gcloud config set project YOUR_PROJECT_ID")
        return None
    return result

def create_sql_instance(project_id, instance_name, region="us-central1"):
    """Create a Cloud SQL PostgreSQL instance."""
    print(f"\nCreating Cloud SQL instance '{instance_name}' in region {region}...")

    # Check if instance already exists
    check_cmd = f"gcloud sql instances describe {instance_name} --project={project_id} 2>/dev/null"
    if run_command(check_cmd, f"Checking if instance '{instance_name}' exists"):
        print(f"✓ Instance '{instance_name}' already exists")
        return True

    # Create the instance
    create_cmd = f"""gcloud sql instances create {instance_name} \
        --project={project_id} \
        --region={region} \
        --database-version=POSTGRES_13 \
        --tier=db-f1-micro \
        --storage-type=HDD \
        --storage-size=10GB \
        --backup-start-time=02:00"""

    if run_command(create_cmd, "Creating Cloud SQL instance"):
        print("✓ Cloud SQL instance created successfully")
        return True
    return False

def create_database(project_id, instance_name, database_name):
    """Create a database in the Cloud SQL instance."""
    print(f"\nCreating database '{database_name}'...")

    # Check if database exists
    check_cmd = f"gcloud sql databases describe {database_name} --instance={instance_name} --project={project_id} 2>/dev/null"
    if run_command(check_cmd, f"Checking if database '{database_name}' exists"):
        print(f"✓ Database '{database_name}' already exists")
        return True

    # Create the database
    create_cmd = f"gcloud sql databases create {database_name} --instance={instance_name} --project={project_id}"
    if run_command(create_cmd, "Creating database"):
        print("✓ Database created successfully")
        return True
    return False

def create_database_user(project_id, instance_name, username, password):
    """Create a database user."""
    print(f"\nCreating database user '{username}'...")

    # Check if user exists
    check_cmd = f"gcloud sql users describe {username} --instance={instance_name} --project={project_id} 2>/dev/null"
    if run_command(check_cmd, f"Checking if user '{username}' exists"):
        print(f"✓ User '{username}' already exists")
        return True

    # Create the user
    create_cmd = f"gcloud sql users create {username} --instance={instance_name} --project={project_id} --password='{password}'"
    if run_command(create_cmd, "Creating database user"):
        print("✓ Database user created successfully")
        return True
    return False

def update_env_file(instance_name, database_name, username, password, project_id, region="us-central1"):
    """Update the .env file with Cloud SQL configuration."""
    env_path = Path(".env")

    # Create instance connection name
    instance_connection_name = f"{project_id}:{region}:{instance_name}"

    env_content = f"""# Database Configuration for Google Cloud SQL
DATABASE_TYPE=cloudsql
INSTANCE_CONNECTION_NAME={instance_connection_name}
DB_USER={username}
DB_PASS={password}
DB_NAME={database_name}

# Google Cloud Project
GOOGLE_CLOUD_PROJECT={project_id}
"""

    if env_path.exists():
        print(f"\nUpdating existing .env file...")
        current_content = env_path.read_text()

        # Remove old database configuration
        lines = current_content.split('\n')
        filtered_lines = []
        skip_section = False

        for line in lines:
            if line.startswith('# Database Configuration'):
                skip_section = True
                continue
            elif skip_section and (line.startswith('#') or line.strip() == ''):
                continue
            elif skip_section and line.startswith('DATABASE_TYPE'):
                continue
            elif skip_section and line.startswith('INSTANCE_CONNECTION_NAME'):
                continue
            elif skip_section and line.startswith('DB_'):
                continue
            elif skip_section and line.startswith('GOOGLE_CLOUD_PROJECT'):
                continue
            else:
                skip_section = False
                filtered_lines.append(line)

        # Add new configuration
        new_content = '\n'.join(filtered_lines).strip() + '\n\n' + env_content
        env_path.write_text(new_content)
    else:
        print(f"\nCreating new .env file...")
        env_path.write_text(env_content)

    print("✓ Environment file updated")

def main():
    print("🚀 Google Cloud SQL Setup for ATS Resume Application")
    print("=" * 60)

    # Check prerequisites
    if not check_gcloud_auth():
        sys.exit(1)

    project_id = get_project_id()
    if not project_id:
        sys.exit(1)

    # Get user input
    print(f"\n📋 Configuration for project: {project_id}")

    instance_name = input("Enter Cloud SQL instance name (default: ats-resume-db): ").strip() or "ats-resume-db"
    region = input("Enter region (default: us-central1): ").strip() or "us-central1"
    database_name = input("Enter database name (default: ats_resume): ").strip() or "ats_resume"
    username = input("Enter database username (default: ats_user): ").strip() or "ats_user"

    import getpass
    password = getpass.getpass("Enter database password: ")
    if not password:
        print("❌ Password is required")
        sys.exit(1)

    confirm_password = getpass.getpass("Confirm database password: ")
    if password != confirm_password:
        print("❌ Passwords do not match")
        sys.exit(1)

    # Create resources
    print("\n🔧 Creating Google Cloud SQL resources...")
    print(f"Project: {project_id}")
    print(f"Instance: {instance_name}")
    print(f"Region: {region}")
    print(f"Database: {database_name}")
    print(f"Username: {username}")

    # Create Cloud SQL instance
    if not create_sql_instance(project_id, instance_name, region):
        print("❌ Failed to create Cloud SQL instance")
        sys.exit(1)

    # Create database
    if not create_database(project_id, instance_name, database_name):
        print("❌ Failed to create database")
        sys.exit(1)

    # Create user
    if not create_database_user(project_id, instance_name, username, password):
        print("❌ Failed to create database user")
        sys.exit(1)

    # Update environment file
    update_env_file(instance_name, database_name, username, password, project_id, region)

    print("\n🎉 Google Cloud SQL setup completed successfully!")
    print("\n📝 Next steps:")
    print("1. Install required Python packages: pip install -r requirements.txt")
    print("2. Run database initialization: python -c 'from app.db.models import init_db; init_db()'")
    print("3. Start the application: python -m uvicorn app.main:app --reload")
    print("\n💡 Your application is now configured to use Google Cloud SQL!")

if __name__ == "__main__":
    main()