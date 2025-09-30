import api from './api';
import { Photo, PhotoResponse } from '../types';

export const photoService = {
  getPhotos: async (): Promise<Photo[]> => {
    const response = await api.get('/photos');
    return response.data;
  },

  uploadPhoto: async (file: File, title?: string): Promise<Photo> => {
    const formData = new FormData();
    formData.append('photo', file);
    if (title) {
      formData.append('title', title);
    }

    const response = await api.post('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPhoto: async (id: number): Promise<Photo> => {
    const response = await api.get(`/photos/${id}`);
    return response.data;
  },

  updatePhoto: async (id: number, title: string): Promise<Photo> => {
    const response = await api.put(`/photos/${id}`, { title });
    return response.data;
  },

  deletePhoto: async (id: number): Promise<void> => {
    await api.delete(`/photos/${id}`);
  },

  // Photo editing operations
  resizePhoto: async (id: number, width: number, height: number) => {
    const response = await api.post(`/photos/${id}/resize`, { width, height });
    return response.data;
  },

  cropPhoto: async (id: number, x: number, y: number, width: number, height: number) => {
    const response = await api.post(`/photos/${id}/crop`, { x, y, width, height });
    return response.data;
  },

  adjustBrightness: async (id: number, brightness: number) => {
    const response = await api.post(`/photos/${id}/brightness`, { brightness });
    return response.data;
  },

  adjustContrast: async (id: number, contrast: number) => {
    const response = await api.post(`/photos/${id}/contrast`, { contrast });
    return response.data;
  },
};