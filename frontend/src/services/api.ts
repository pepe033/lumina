import axios, { AxiosResponse } from 'axios';
import { Photo, AuthResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for handling auth errors
let isRedirecting401 = false;
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (!isRedirecting401 && window.location.pathname !== '/login') {
                isRedirecting401 = true;
                localStorage.removeItem('authToken');
                window.location.assign('/login');
            }
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    register: (userData: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
    }): Promise<AxiosResponse<AuthResponse>> => api.post('/register', userData),

    login: (credentials: {
        email: string;
        password: string;
    }): Promise<AxiosResponse<AuthResponse>> => api.post('/login', credentials),

    logout: (): Promise<AxiosResponse<{ message: string }>> => api.post('/logout'),
};

export const photoAPI = {
    getPhotos: (): Promise<AxiosResponse<Photo[]>> => api.get('/photos'),

    uploadPhoto: (formData: FormData): Promise<AxiosResponse<Photo>> =>
        // Do not set Content-Type here - let the browser set the correct multipart boundary
        api.post('/photos', formData),

    deletePhoto: (id: number): Promise<AxiosResponse<{ message: string }>> =>
        api.delete(`/photos/${id}`),

    updatePhoto: (id: number, data: { title?: string }): Promise<AxiosResponse<Photo>> =>
        api.put(`/photos/${id}`, data),
};

export default api;
