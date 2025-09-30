import React, { useState, useEffect, useRef } from 'react';
import PhotoUpload from '../components/PhotoUpload';
import { photoAPI } from '../services/api';
import { Photo } from '../types';

const DashboardPage: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadPhotos();
  }, []);

  const loadPhotos = async (): Promise<void> => {
    try {
      const response = await photoAPI.getPhotos();
      // Filter out converted/thumbnail files (they have filename that contains 'converted_')
      const allPhotos: Photo[] = response.data;
      const filtered = allPhotos.filter((p) => !p.filename.includes('converted_'));

      // Optional debug log in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.debug('Loaded photos:', { all: allPhotos.length, filtered: filtered.length });
      }

      setPhotos(filtered);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newPhoto: Photo): void => {
    setPhotos((prev) => [newPhoto, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Moje Zdjęcia
        </h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Przesyłaj i zarządzaj swoimi zdjęciami. Kliknij na dowolne zdjęcie aby rozpocząć edycję.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white border-2 border-gray-300 border-dashed rounded-lg p-6">
        <PhotoUpload onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Ładowanie zdjęć...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-1 aspect-h-1">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {photo.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(photo.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && photos.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nie masz jeszcze żadnych zdjęć. Prześlij swoje pierwsze zdjęcie powyżej!</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;