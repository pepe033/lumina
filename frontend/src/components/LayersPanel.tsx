import React, { useState } from 'react';
import { Layer } from '../types';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onLayerSelect: (layerId: string) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerDuplicate: (layerId: string) => void;
  onLayerVisibilityToggle?: (layerId: string) => void;
  onLayerReorder?: (fromIndex: number, toIndex: number) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerDelete,
  onLayerDuplicate,
  // onLayerVisibilityToggle - reserved for future use
  // onLayerReorder - reserved for future use
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Odwrócona kolejność warstw - najnowsza na górze
  const reversedLayers = [...layers].reverse();

  const getLayerIcon = (layer: Layer) => {
    switch (layer.type) {
      case 'text':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        );
      case 'sticker':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const getLayerName = (layer: Layer) => {
    if (layer.type === 'text') {
      const content = layer.content.trim();
      return content.length > 0 ? content.substring(0, 20) + (content.length > 20 ? '...' : '') : 'Tekst';
    }
    if (layer.type === 'sticker') {
      return 'Naklejka';
    }
    return 'Warstwa';
  };

  const getLayerTypeLabel = (layer: Layer) => {
    switch (layer.type) {
      case 'text':
        return 'Tekst';
      case 'sticker':
        return 'Naklejka';
      default:
        return 'Warstwa';
    }
  };

  return (
    <div className="w-80 flex-shrink-0 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Warstwy</h3>
          <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
            {layers.length}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-colors"
          title={isCollapsed ? 'Rozwiń' : 'Zwiń'}
        >
          <svg
            className={`w-5 h-5 text-slate-300 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3">
            {layers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-700/30 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">Brak warstw</p>
                <p className="text-slate-500 text-xs mt-1">
                  Dodaj tekst lub naklejkę, aby utworzyć warstwę
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {reversedLayers.map((layer) => {
                  const isActive = activeLayerId === layer.id;

                  return (
                    <div
                      key={layer.id}
                      onClick={() => onLayerSelect(layer.id)}
                      className={`group relative rounded-lg border transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500'
                      }`}
                    >
                      <div className="p-3">
                        {/* Layer info */}
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-600/50 text-slate-400'
                          }`}>
                            {getLayerIcon(layer)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-white truncate">
                                {getLayerName(layer)}
                              </h4>
                              <span className="text-xs text-slate-400 bg-slate-600/50 px-1.5 py-0.5 rounded flex-shrink-0">
                                {getLayerTypeLabel(layer)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>Opacity: {Math.round(layer.opacity * 100)}%</span>
                              <span>•</span>
                              <span>Rotation: {layer.rotation}°</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onLayerDuplicate(layer.id);
                              }}
                              className="w-7 h-7 rounded-lg bg-slate-600/50 hover:bg-blue-500/30 hover:text-blue-300 text-slate-300 flex items-center justify-center transition-colors"
                              title="Duplikuj"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onLayerDelete(layer.id);
                              }}
                              className="w-7 h-7 rounded-lg bg-slate-600/50 hover:bg-red-500/30 hover:text-red-300 text-slate-300 flex items-center justify-center transition-colors"
                              title="Usuń"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayersPanel;
