# Free ATS Proofed Resume

Transforms LinkedIn profile data into an ATS-optimized resume format. Make your CV robot proof.

## Project Structure

```
Free_ATS_Proofed_Resume/
├── backend/          # Node.js/Express backend with TypeScript
├── frontend/         # React frontend with TypeScript
└── README.md         # This file
```

## Features

- 🔐 **LinkedIn OAuth Authentication** - Secure login with LinkedIn
- 📊 **MongoDB Storage** - Store user profile data in MongoDB
- 🎯 **Profile Data Retrieval** - Fetch and display LinkedIn profile data
- 🚀 **Full-Stack TypeScript** - Type-safe development across the entire stack
- 🔄 **REST API** - Clean API architecture for data access

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud instance)
- LinkedIn Developer Account (for OAuth credentials)

## Setup Instructions

### 1. LinkedIn Developer Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Under "Auth" tab, add redirect URLs:
   - `http://localhost:5000/auth/linkedin/callback`
4. Note your Client ID and Client Secret
5. Request access to the following scopes:
   - `r_emailaddress`
   - `r_liteprofile`

### 2. MongoDB Setup

You can use either:
- **Local MongoDB**: Install MongoDB locally and run `mongod`
- **MongoDB Atlas**: Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env file with your credentials
# - Add your MongoDB connection string
# - Add LinkedIn Client ID and Secret
# - Configure session secret
nano .env

# Build the project
npm run build

# Start development server
npm run dev
```

The backend will run on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env file if needed (default should work)
nano .env

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Environment Variables

### Backend (.env)

```env
MONGODB_URI=mongodb://localhost:27017/free-ats-resume
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:5000/auth/linkedin/callback
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_random_session_secret_here
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000
```

## Usage

1. Start MongoDB (if running locally):
   ```bash
   mongod
   ```

2. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

3. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

5. Click "Sign in with LinkedIn" to authenticate

6. After successful authentication, you'll be redirected to the dashboard where you can view your LinkedIn profile data

## API Endpoints

### Authentication
- `GET /auth/linkedin` - Initiate LinkedIn OAuth flow
- `GET /auth/linkedin/callback` - LinkedIn OAuth callback
- `GET /auth/check` - Check authentication status
- `GET /auth/user` - Get current user data
- `GET /auth/profile` - Get user's LinkedIn profile data
- `POST /auth/logout` - Logout user

### General
- `GET /health` - Health check endpoint
- `GET /` - API information

## Database Schema

### User Collection

```typescript
{
  linkedinId: string;        // LinkedIn user ID (unique)
  displayName: string;       // Full name
  email: string;             // Email address
  firstName: string;         // First name
  lastName: string;          // Last name
  profilePicture?: string;   // Profile image URL
  headline?: string;         // LinkedIn headline
  summary?: string;          // Profile summary
  positions?: any[];         // Work experience
  educations?: any[];        // Education history
  skills?: any[];            // Skills list
  rawProfileData: any;       // Complete LinkedIn profile data
  createdAt: Date;           // Account creation timestamp
  updatedAt: Date;           // Last update timestamp
}
```

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with LinkedIn OAuth 2.0
- **Session Management**: express-session
- **CORS**: cors middleware

### Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Styling**: Inline styles (can be extended with CSS frameworks)

## Development

### Backend Development

```bash
cd backend

# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Frontend Development

```bash
cd frontend

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the connection string in `.env`
- Verify network access if using MongoDB Atlas

### LinkedIn OAuth Issues
- Verify Client ID and Secret are correct
- Ensure callback URL matches exactly (including protocol and port)
- Check that your LinkedIn app has the required permissions

### Port Conflicts
- If ports 3000 or 5000 are in use, update the port numbers in:
  - Backend `.env` file (PORT)
  - Frontend `vite.config.ts` (server.port)
  - Backend `.env` file (FRONTEND_URL)

## Future Enhancements

- [ ] Resume generation from LinkedIn data
- [ ] ATS optimization suggestions
- [ ] Multiple resume templates
- [ ] PDF export functionality
- [ ] Resume customization editor
- [ ] Skills matching with job descriptions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Support

For issues and questions, please open an issue on the GitHub repository
