import api from './api';
import axios from 'axios';
import { AuthResponse, LoginForm, RegisterForm } from '../types';

export const authService = {
  login: async (credentials: LoginForm): Promise<AuthResponse> => {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterForm): Promise<AuthResponse> => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/logout');
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('http://localhost:8000/api/user', {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  },
};