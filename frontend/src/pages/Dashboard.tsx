import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User } from '../types';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userResponse, profileResponse] = await Promise.all([
        authService.getCurrentUser(),
        authService.getUserProfile(),
      ]);

      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user);
      }

      if (profileResponse.success && profileResponse.profile) {
        setProfile(profileResponse.profile);
      }
    } catch (err: any) {
      console.error('Error loading user data:', err);
      setError(err.response?.data?.message || 'Failed to load user data');
      if (err.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      {user && (
        <div style={styles.card}>
          <h2>User Information</h2>
          {user.profilePicture && (
            <img
              src={user.profilePicture}
              alt="Profile"
              style={styles.profilePicture}
            />
          )}
          <div style={styles.infoRow}>
            <strong>Name:</strong> {user.displayName}
          </div>
          <div style={styles.infoRow}>
            <strong>Email:</strong> {user.email}
          </div>
          <div style={styles.infoRow}>
            <strong>LinkedIn ID:</strong> {user.linkedinId}
          </div>
          {user.headline && (
            <div style={styles.infoRow}>
              <strong>Headline:</strong> {user.headline}
            </div>
          )}
        </div>
      )}

      {profile && (
        <div style={styles.card}>
          <h2>LinkedIn Profile Data</h2>
          <pre style={styles.pre}>{JSON.stringify(profile, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  profilePicture: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    marginBottom: '20px',
  },
  infoRow: {
    padding: '10px 0',
    borderBottom: '1px solid #eee',
  },
  pre: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '5px',
    overflow: 'auto',
    maxHeight: '400px',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '50px',
    fontSize: '18px',
  },
  error: {
    textAlign: 'center' as const,
    padding: '50px',
    fontSize: '18px',
    color: '#dc3545',
  },
};

export default Dashboard;
