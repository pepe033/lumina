import React from 'react';
import PhotoUpload from '../components/PhotoUpload';
import { useNavigate } from 'react-router-dom';
import { Photo } from '../types';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  const handleUploadSuccess = (_newPhoto: Photo): void => {
    // Po udanym uploadzie możemy przekierować do biblioteki
    setTimeout(() => {
      navigate('/library');
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-3xl font-bold text-white">
              Prześlij Zdjęcia
            </h3>
            <p className="text-slate-400 text-base mt-1">
              Dodaj nowe zdjęcia do swojej biblioteki. Obsługiwane formaty: JPG, PNG, GIF.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <PhotoUpload onUploadSuccess={handleUploadSuccess} />

      {/* Info Section */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/30">
        <h4 className="text-lg font-semibold text-white mb-3">Wskazówki dotyczące przesyłania</h4>
        <ul className="space-y-2 text-slate-400">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Obsługiwane formaty: JPG, PNG, GIF</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Maksymalny rozmiar pliku: 10 MB</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Możesz przeciągnąć i upuścić plik w obszarze uploadu</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Po przesłaniu zostaniesz automatycznie przekierowany do biblioteki</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UploadPage;
