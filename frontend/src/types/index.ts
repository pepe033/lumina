// API Types
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: number;
  user_id: number;
  title: string;
  filename: string;
  path: string;
  size: number;
  mime_type: string;
  width?: number;
  height?: number;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface PhotoResponse {
  message: string;
  photo: Photo;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// Component Props
export interface PhotoUploadProps {
  onUploadSuccess?: (photo: Photo) => void;
}

// Editor Types
export interface EditorState {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  scale: number;
}