import React from 'react';
import { useParams } from 'react-router-dom';

const EditorPage: React.FC = () => {
  const { photoId } = useParams<{ photoId: string }>();

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">
              Edytor zdjęć
            </h3>
            <p className="text-slate-400 mt-1">
              Edytuj swoje zdjęcie za pomocą różnych narzędzi i filtrów
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6">
        {/* Sidebar with editing tools */}
        <div className="w-80 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
          <div className="space-y-6">
            {/* Basic Adjustments */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Podstawowe ustawienia
              </h4>
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Jasność</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Kontrast</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nasycenie</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Filtry
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-3 text-sm font-medium text-slate-300 hover:text-white transition-all duration-200">
                  Oryginał
                </button>
                <button className="bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-3 text-sm font-medium text-slate-300 hover:text-white transition-all duration-200">
                  Vintage
                </button>
                <button className="bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-3 text-sm font-medium text-slate-300 hover:text-white transition-all duration-200">
                  Czarno-biały
                </button>
                <button className="bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-3 text-sm font-medium text-slate-300 hover:text-white transition-all duration-200">
                  Sepia
                </button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Akcje
              </h4>
              <div className="space-y-3">
                <button className="w-full py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Zapisz zmiany
                </button>
                <button className="w-full py-3 px-4 rounded-xl font-semibold bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Resetuj
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main editing area */}
        <div className="flex-1 bg-slate-800/30 rounded-2xl border border-slate-700/50 flex items-center justify-center p-8">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
            <div className="w-[600px] h-[400px] bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-600/50 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-lg font-medium">Zdjęcie #{photoId}</p>
                <p className="text-slate-500 text-sm mt-2">Podgląd zdjęcia zostanie wyświetlony tutaj</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;