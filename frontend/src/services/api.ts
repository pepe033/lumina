import axios, { AxiosResponse } from 'axios';
import { Photo, AuthResponse } from '../types';

// Prefer environment variable set by setup scripts / docker-compose. Expect value like: http://backend:8000/api/v1
let API_BASE_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.replace(/\/+$|\/$/, '')) || 'http://localhost:8000/api/v1';

// If env points to the Docker service name (backend) but the frontend is running in the browser on the host
// (typical local dev: npm start), remap `backend` -> `localhost` so requests go to the host's port 8000.
try {
  if (typeof window !== 'undefined' && API_BASE_URL.includes('backend')) {
    const host = window.location.hostname;
    // if we're not inside docker network where 'backend' would resolve, map to localhost
    if (host !== 'backend') {
      API_BASE_URL = API_BASE_URL.replace(/backend/g, 'localhost');
    }
  }
} catch (e) {
  // ignore in non-browser environments
}

// Ensure API path includes /api/v1. If someone set REACT_APP_API_URL to a shorter path (eg /api), normalize to /api/v1
try {
  const url = new URL(API_BASE_URL);
  // If pathname does not already contain /api/v1, adjust it
  if (!url.pathname.includes('/api/v1')) {
    if (url.pathname.includes('/api')) {
      url.pathname = url.pathname.replace(/\/api(?!\/v1)/, '/api/v1');
    } else if (url.pathname === '/' || url.pathname === '') {
      url.pathname = '/api/v1';
    } else {
      // append api/v1
      url.pathname = url.pathname.replace(/\/$/, '') + '/api/v1';
    }
    API_BASE_URL = url.toString().replace(/\/+$/,'');
  }
} catch (e) {
  // if URL parsing fails, fallback: ensure string contains '/api/v1'
  if (!API_BASE_URL.includes('/api/v1')) {
    if (API_BASE_URL.includes('/api')) {
      API_BASE_URL = API_BASE_URL.replace(/\/api(?!\/v1)/, '/api/v1');
    } else {
      API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api/v1';
    }
  }
}

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

    // New: pobierz surowe dane obrazu jako blob (z auth header)
    getPhotoRaw: (id: number): Promise<AxiosResponse<Blob>> =>
        api.get(`/photos/${id}/raw`, { responseType: 'blob' }),
};

export default api;
