import React from 'react';
import { authService } from '../services/authService';

const Login: React.FC = () => {
  const handleLinkedInLogin = () => {
    window.location.href = authService.getLinkedInAuthUrl();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Free ATS Proofed Resume</h1>
        <p style={styles.subtitle}>
          Transform your LinkedIn profile into an ATS-optimized resume
        </p>
        <button onClick={handleLinkedInLogin} style={styles.button}>
          Sign in with LinkedIn
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
    maxWidth: '400px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
  },
  button: {
    backgroundColor: '#0077B5',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    fontSize: '16px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
};

export default Login;
