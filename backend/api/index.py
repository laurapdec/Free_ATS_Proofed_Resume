import sys
from pathlib import Path

# Add the parent directory to Python path so imports work
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

# Export the FastAPI app for Vercel serverless
handler = app