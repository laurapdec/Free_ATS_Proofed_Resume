import axios from 'axios';
import { AuthResponse, UserResponse, ProfileResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const authService = {
  checkAuth: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>('/auth/check');
    return response.data;
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await api.get<UserResponse>('/auth/user');
    return response.data;
  },

  getUserProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>('/auth/profile');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getLinkedInAuthUrl: (): string => {
    return `${API_URL}/auth/linkedin`;
  },
};

export default authService;
