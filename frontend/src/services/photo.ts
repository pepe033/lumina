import api from './api';
import { Photo, PhotoResponse } from '../types';

export const photoService = {
  getPhotos: async (): Promise<{ data: Photo[] }> => {
    const response = await api.get('/v1/photos');
    return response.data;
  },

  uploadPhoto: async (file: File, title?: string): Promise<PhotoResponse> => {
    const formData = new FormData();
    formData.append('photo', file);
    if (title) {
      formData.append('title', title);
    }

    const response = await api.post('/v1/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPhoto: async (id: number): Promise<Photo> => {
    const response = await api.get(`/v1/photos/${id}`);
    return response.data;
  },

  updatePhoto: async (id: number, title: string): Promise<PhotoResponse> => {
    const response = await api.put(`/v1/photos/${id}`, { title });
    return response.data;
  },

  deletePhoto: async (id: number): Promise<void> => {
    await api.delete(`/v1/photos/${id}`);
  },

  // Photo editing operations
  resizePhoto: async (id: number, width: number, height: number) => {
    const response = await api.post(`/v1/photos/${id}/resize`, { width, height });
    return response.data;
  },

  cropPhoto: async (id: number, x: number, y: number, width: number, height: number) => {
    const response = await api.post(`/v1/photos/${id}/crop`, { x, y, width, height });
    return response.data;
  },

  adjustBrightness: async (id: number, brightness: number) => {
    const response = await api.post(`/v1/photos/${id}/brightness`, { brightness });
    return response.data;
  },

  adjustContrast: async (id: number, contrast: number) => {
    const response = await api.post(`/v1/photos/${id}/contrast`, { contrast });
    return response.data;
  },
};