# Free ATS-Proofed Resume Generator

An AI-powered resume optimization platform that transforms LinkedIn profiles and job descriptions into ATS-optimized resumes. Features conversational AI, automatic job description parsing, and a Firefox extension for seamless job application workflow.

## 🚀 Features

### Core Features
- **AI-Powered Resume Optimization**: Transform LinkedIn profiles into ATS-friendly resumes
- **Conversational AI**: Chat with AI to optimize your resume for specific job applications
- **Job Description Parsing**: Automatically extract job requirements from pasted descriptions
- **Real-time PDF Preview**: See your optimized resume instantly
- **Multi-format Export**: Generate PDFs optimized for ATS systems

### Account & Authentication
- **Secure User Accounts**: Email/password authentication with JWT tokens
- **Profile Management**: Update personal information and preferences
- **Password Reset**: Forgot password functionality
- **Subscription Management**: Free and premium plans

### Firefox Extension
- **Job Description Extraction**: Automatically detect and extract job details from major job sites
- **One-Click Optimization**: Floating action button on job pages
- **Seamless Integration**: Direct connection with the web app
- **Multi-Site Support**: LinkedIn, Indeed, Glassdoor, Monster, and more

### Premium Features
- **Unlimited Resume Optimizations**: No limits on resume generations
- **AI Cover Letter Generation**: Automatically create tailored cover letters
- **Advanced Job Matching**: Enhanced job description analysis
- **Priority Support**: Direct customer support

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Chakra UI**: Modern component library
- **PDF.js**: PDF rendering and generation

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: Database ORM
- **JWT Authentication**: Secure token-based auth
- **SQLite**: Production-ready database

### AI & ML
- **Google Cloud Natural Language API**: Text analysis and job parsing
- **Conversational AI**: Context-aware resume optimization

### Browser Extension
- **Firefox Extension API**: Cross-browser compatibility
- **Content Scripts**: Job site integration
- **Background Processing**: Efficient data handling

## 📋 Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.9+ and **pip**
- **Firefox Browser** (for extension)
- **Vercel Account** (for deployment)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/laurapdec/Free_ATS_Proofed_Resume.git
cd Free_ATS_Proofed_Resume
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python -m uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### 4. Firefox Extension Setup
```bash
cd firefox-extension
# Load as temporary extension in Firefox
# Go to about:debugging -> This Firefox -> Load Temporary Add-on
# Select manifest.json
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///database.db
BACKEND_CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

## 🚀 Production Deployment

### Automated Deployment
```bash
# Set your Vercel token
export VERCEL_TOKEN=your_vercel_token

# Run deployment script
./deploy.sh
```

### Manual Deployment Steps

#### 1. Backend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy backend
cd backend
vercel --prod
```

#### 2. Frontend Deployment (Vercel)
```bash
# Deploy frontend
cd frontend
vercel --prod
```

#### 3. Environment Setup
- Set production environment variables in Vercel dashboard
- Update CORS origins for production URLs
- Configure database for production use

#### 4. Firefox Extension Deployment
```bash
# Package the extension
cd firefox-extension
zip -r ats-resume-optimizer.xpi *

# Submit to Firefox Add-ons
# https://addons.mozilla.org/developers/
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **CORS Protection**: Configured cross-origin policies
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API rate limiting (configurable)

## 📱 Firefox Extension

### Installation
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the sidebar
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `firefox-extension` directory

### Features
- **Automatic Detection**: Recognizes job posting pages
- **One-Click Extraction**: Extract job details with a button click
- **Direct Integration**: Send data directly to the web app
- **Multi-Site Support**: Works on LinkedIn, Indeed, Glassdoor, and more

### Development
```bash
cd firefox-extension
# Make changes to extension files
# Reload extension in about:debugging
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/laurapdec/Free_ATS_Proofed_Resume/issues)
- **Discussions**: [GitHub Discussions](https://github.com/laurapdec/Free_ATS_Proofed_Resume/discussions)
- **Email**: Contact the maintainers

## 🙏 Acknowledgments

- Google Cloud Natural Language API for text analysis
- PDF.js for PDF rendering capabilities
- Chakra UI for the beautiful component library
- FastAPI for the robust backend framework

---

**Made with ❤️ for job seekers worldwide**
