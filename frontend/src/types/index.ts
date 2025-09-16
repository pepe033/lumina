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

// Editor Types
export interface EditorState {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export interface Filter {
  id: string;
  name: string;
  description: string;
}