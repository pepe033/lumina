import React, { useState, useEffect, useRef } from 'react';
import PhotoUpload from '../components/PhotoUpload';
import { photoAPI } from '../services/api';
import { Photo } from '../types';

const DashboardPage: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fetchedRef = useRef(false);

  // Map photo id -> object URL (state for render, ref for up-to-date cleanup)
  const [photoSrcMap, setPhotoSrcMap] = useState<Record<number, string>>({});
  const photoSrcRef = useRef<Record<number, string>>({});

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadPhotos();
    // cleanup on unmount
    return () => {
      // revoke all object URLs (copy current values to avoid stale-ref lint warning)
      const urls = Object.values(photoSrcRef.current);
      urls.forEach((url) => {
        try {
          // only revoke if it was created via URL.createObjectURL (skip data URIs)
          if (url && url.startsWith && !url.startsWith('data:')) {
            URL.revokeObjectURL(url);
          }
        } catch (e) {
          // ignore errors during cleanup
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When photos list changes, ensure we have blobs for each
    photos.forEach((photo) => {
      if (photoSrcMap[photo.id]) return; // already fetched
      // If the photo model already provides a data URI, use it directly
      if (photo.url && photo.url.startsWith && photo.url.startsWith('data:')) {
        // store data URI directly (no need to revoke later)
        photoSrcRef.current[photo.id] = photo.url;
        setPhotoSrcMap((prev) => ({ ...prev, [photo.id]: photo.url }));
        return;
      }
      fetchPhotoBlob(photo.id);
    });
    // cleanup removed photos' object URLs
    const currentIds = new Set(photos.map((p) => p.id));
    const toRevoke = Object.keys(photoSrcRef.current).map(Number).filter((id) => !currentIds.has(id));
    if (toRevoke.length > 0) {
      setPhotoSrcMap((prev) => {
        const next = { ...prev };
        toRevoke.forEach((id) => {
          const url = photoSrcRef.current[id];
          if (url) {
            URL.revokeObjectURL(url);
            delete photoSrcRef.current[id];
          }
          if (next[id]) delete next[id];
        });
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const fetchPhotoBlob = async (id: number) => {
    try {
      // Use axios wrapper which includes baseURL and Authorization header
      const response = await photoAPI.getPhotoRaw(id);
      const blob = response.data as Blob;
      const objectUrl = URL.createObjectURL(blob);
      // update ref and state (state triggers render)
      photoSrcRef.current[id] = objectUrl;
      setPhotoSrcMap((prev) => ({ ...prev, [id]: objectUrl }));
    } catch (err) {
      console.error('Error fetching photo blob via axios', id, err);
    }
  };

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
    // fetch its blob
    fetchPhotoBlob(newPhoto.id);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-white">
              Moje Zdjęcia
            </h3>
            <p className="text-slate-400 mt-1">
              Przesyłaj i zarządzaj swoimi zdjęciami. Kliknij na dowolne zdjęcie aby rozpocząć edycję.
            </p>
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
            <div className="text-slate-400 text-sm">Wszystkich zdjęć</div>
            <div className="text-3xl font-bold text-white mt-1">{photos.length}</div>
          </div>
          <div className="flex-1 bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
            <div className="text-slate-400 text-sm">Rozmiar galerii</div>
            <div className="text-3xl font-bold text-white mt-1">
              {(photos.reduce((acc, p) => acc + (p.size || 0), 0) / 1024 / 1024).toFixed(1)} MB
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <PhotoUpload onUploadSuccess={handleUploadSuccess} />

      {/* Photos Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-slate-400 text-lg">Ładowanie zdjęć...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group bg-slate-800/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer hover:scale-105"
            >
              <div className="aspect-square overflow-hidden bg-slate-900/50">
                <img
                  src={photoSrcMap[photo.id] ?? photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                  {photo.title}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-slate-500">
                    {new Date(photo.created_at).toLocaleDateString('pl-PL')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-lg text-center">
            Nie masz jeszcze żadnych zdjęć.<br />
            Prześlij swoje pierwsze zdjęcie powyżej!
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
