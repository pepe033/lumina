import api from './api';
import { AuthResponse, LoginForm, RegisterForm } from '../types';

export const authService = {
  login: async (credentials: LoginForm): Promise<AuthResponse> => {
    const response = await api.post('/v1/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterForm): Promise<AuthResponse> => {
    const response = await api.post('/v1/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/v1/logout');
  },

  getCurrentUser: async () => {
    const response = await api.get('/user');
    return response.data;
  },
};