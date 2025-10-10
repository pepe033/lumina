import React, { useState, useEffect } from 'react';
import { TextLayer } from '../types';
import { ChromePicker, ColorResult } from 'react-color';

interface TextToolbarProps {
  layer: TextLayer | null;
  onUpdate: (id: string, updates: Partial<TextLayer>) => void;
}

// 8 Google Fonts do wyboru
const GOOGLE_FONTS = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Playfair Display',
  'Merriweather',
];

const TextToolbar: React.FC<TextToolbarProps> = ({ layer, onUpdate }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);
  const [showShadowColorPicker, setShowShadowColorPicker] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState<Set<string>>(new Set());

  // Load Google Font dynamically
  const loadGoogleFont = (fontFamily: string) => {
    if (fontsLoaded.has(fontFamily)) return;

    const link = document.createElement('link');
    const fontName = fontFamily.replace(' ', '+');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    setFontsLoaded(prev => new Set(prev).add(fontFamily));
  };

  // Load all fonts on mount
  useEffect(() => {
    GOOGLE_FONTS.forEach(font => loadGoogleFont(font));
  }, []);

  if (!layer) {
    return (
      <div className="p-6 text-center text-slate-400">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <p className="text-sm">Zaznacz warstwę tekstową<br />aby edytować</p>
      </div>
    );
  }

  const handleColorChange = (color: ColorResult) => {
    onUpdate(layer.id, { color: color.hex });
  };

  const handleStrokeColorChange = (color: ColorResult) => {
    onUpdate(layer.id, { strokeColor: color.hex });
  };

  const handleShadowColorChange = (color: ColorResult) => {
    onUpdate(layer.id, { shadowColor: color.hex });
  };

  const handleFontChange = (fontFamily: string) => {
    loadGoogleFont(fontFamily);
    onUpdate(layer.id, { fontFamily });
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto max-h-full">
      {/* Font Family Dropdown */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">
          Czcionka
        </label>
        <select
          value={layer.fontFamily}
          onChange={(e) => handleFontChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ fontFamily: layer.fontFamily }}
        >
          {GOOGLE_FONTS.map(font => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size Slider */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">
          Rozmiar: {layer.fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="120"
          value={layer.fontSize}
          onChange={(e) => onUpdate(layer.id, { fontSize: Number(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">
          Kolor tekstu
        </label>
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white flex items-center justify-between hover:bg-slate-600 transition-colors"
          >
            <span>{layer.color}</span>
            <div
              className="w-8 h-8 rounded border-2 border-white"
              style={{ backgroundColor: layer.color }}
            />
          </button>
          {showColorPicker && (
            <div className="absolute z-50 mt-2">
              <div
                className="fixed inset-0"
                onClick={() => setShowColorPicker(false)}
              />
              <ChromePicker
                color={layer.color}
                onChange={handleColorChange}
                disableAlpha={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Text Style Toggles: Bold, Italic, Underline */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">
          Styl tekstu
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate(layer.id, { bold: !layer.bold })}
            className={
              layer.bold
                ? 'flex-1 px-4 py-2 rounded-lg font-bold text-lg transition-colors bg-blue-600 text-white'
                : 'flex-1 px-4 py-2 rounded-lg font-bold text-lg transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600'
            }
          >
            B
          </button>
          <button
            onClick={() => onUpdate(layer.id, { italic: !layer.italic })}
            className={
              layer.italic
                ? 'flex-1 px-4 py-2 rounded-lg italic text-lg transition-colors bg-blue-600 text-white'
                : 'flex-1 px-4 py-2 rounded-lg italic text-lg transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600'
            }
          >
            I
          </button>
          <button
            onClick={() => onUpdate(layer.id, { underline: !layer.underline })}
            className={
              layer.underline
                ? 'flex-1 px-4 py-2 rounded-lg underline text-lg transition-colors bg-blue-600 text-white'
                : 'flex-1 px-4 py-2 rounded-lg underline text-lg transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600'
            }
          >
            U
          </button>
        </div>
      </div>

      {/* Text Alignment */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">
          Wyrównanie
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate(layer.id, { align: 'left' })}
            className={
              layer.align === 'left'
                ? 'flex-1 px-3 py-2 rounded-lg transition-colors bg-blue-600 text-white'
                : 'flex-1 px-3 py-2 rounded-lg transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600'
            }
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => onUpdate(layer.id, { align: 'center' })}
            className={
              layer.align === 'center'
                ? 'flex-1 px-3 py-2 rounded-lg transition-colors bg-blue-600 text-white'
                : 'flex-1 px-3 py-2 rounded-lg transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600'
            }
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => onUpdate(layer.id, { align: 'right' })}
            className={
              layer.align === 'right'
                ? 'flex-1 px-3 py-2 rounded-lg transition-colors bg-blue-600 text-white'
                : 'flex-1 px-3 py-2 rounded-lg transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600'
            }
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stroke/Outline */}
      <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg">
        <h4 className="text-sm font-semibold text-white">Obramowanie</h4>

        {/* Stroke Color */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Kolor obramowania
          </label>
          <div className="relative">
            <button
              onClick={() => setShowStrokeColorPicker(!showStrokeColorPicker)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white flex items-center justify-between hover:bg-slate-600 transition-colors text-sm"
            >
              <span>{layer.strokeColor}</span>
              <div
                className="w-6 h-6 rounded border-2 border-white"
                style={{ backgroundColor: layer.strokeColor }}
              />
            </button>
            {showStrokeColorPicker && (
              <div className="absolute z-50 mt-2">
                <div
                  className="fixed inset-0"
                  onClick={() => setShowStrokeColorPicker(false)}
                />
                <ChromePicker
                  color={layer.strokeColor}
                  onChange={handleStrokeColorChange}
                  disableAlpha={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Grubość: {layer.strokeWidth}px
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={layer.strokeWidth}
            onChange={(e) => onUpdate(layer.id, { strokeWidth: Number(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>
      </div>

      {/* Shadow */}
      <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg">
        <h4 className="text-sm font-semibold text-white">Cień</h4>

        {/* Shadow Color */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Kolor cienia
          </label>
          <div className="relative">
            <button
              onClick={() => setShowShadowColorPicker(!showShadowColorPicker)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white flex items-center justify-between hover:bg-slate-600 transition-colors text-sm"
            >
              <span>{layer.shadowColor}</span>
              <div
                className="w-6 h-6 rounded border-2 border-white"
                style={{ backgroundColor: layer.shadowColor }}
              />
            </button>
            {showShadowColorPicker && (
              <div className="absolute z-50 mt-2">
                <div
                  className="fixed inset-0"
                  onClick={() => setShowShadowColorPicker(false)}
                />
                <ChromePicker
                  color={layer.shadowColor}
                  onChange={handleShadowColorChange}
                  disableAlpha={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Shadow X */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Przesunięcie X: {layer.shadowX}px
          </label>
          <input
            type="range"
            min="-50"
            max="50"
            value={layer.shadowX}
            onChange={(e) => onUpdate(layer.id, { shadowX: Number(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>

        {/* Shadow Y */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Przesunięcie Y: {layer.shadowY}px
          </label>
          <input
            type="range"
            min="-50"
            max="50"
            value={layer.shadowY}
            onChange={(e) => onUpdate(layer.id, { shadowY: Number(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>

        {/* Shadow Blur */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Rozmycie: {layer.shadowBlur}px
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={layer.shadowBlur}
            onChange={(e) => onUpdate(layer.id, { shadowBlur: Number(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">
          Przezroczystość: {Math.round(layer.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={layer.opacity}
          onChange={(e) => onUpdate(layer.id, { opacity: Number(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
      </div>
    </div>
  );
};

export default TextToolbar;
