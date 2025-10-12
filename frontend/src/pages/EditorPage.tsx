import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { photoAPI } from '../services/api';
import { Photo, Layer, TextLayer, StickerLayer, createTextLayer, createStickerLayer } from '../types';
import CropTool, { CropArea } from '../components/CropTool';
import SliderControl from '../components/SliderControl';
import FilterGallery from '../components/FilterGallery';
import TextToolbar from '../components/TextToolbar';
import TextEditor from '../components/TextEditor';
import StickerPanel from '../components/StickerPanel';
import StickerEditor from '../components/StickerEditor';
import { Filter } from '../constants/filters';
import { drawAllTextLayers } from '../utils/textRenderer';
import { drawAllStickerLayers } from '../utils/stickerRenderer';
import {
  applyTemperature,
  applyHue,
  applyExposure,
  applyShadows,
  applyHighlights,
  applyVibrance,
  applyClarity,
  applySharpness,
  applyBlur,
  applyNoise,
  applyVignette,
} from '../utils/imageFilters';

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  filter: 'none' | 'grayscale' | 'sepia' | 'vintage';
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  // Faza 2: Zaawansowane adjustacje
  temperature: number;
  hue: number;
  exposure: number;
  shadows: number;
  highlights: number;
  clarity: number;
  vibrance: number;
  sharpness: number;
  blur: number;
  noise: number;
  vignette: number;
}

const EditorPage: React.FC = () => {
  const { photoId } = useParams<{ photoId: string }>();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'color' | 'light' | 'effects' | 'filters' | 'text' | 'stickers'>('basic');
  const [activeFilterId, setActiveFilterId] = useState<string>('original');

  // FAZA 4.2: State management dla warstw tekstowych
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    filter: 'none',
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    // Faza 2: Zaawansowane adjustacje
    temperature: 0,
    hue: 0,
    exposure: 0,
    shadows: 0,
    highlights: 0,
    clarity: 0,
    vibrance: 0,
    sharpness: 0,
    blur: 0,
    noise: 0,
    vignette: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const uncropedImageRef = useRef<HTMLImageElement | null>(null); // Kopia przed cropem
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // FAZA 4.2: Funkcje zarządzające warstwami tekstowymi
  const addTextLayer = useCallback(() => {
    const newLayer = createTextLayer({
      x: 50,
      y: 50,
    });
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  }, []);

  const addStickerLayer = useCallback((src: string) => {
    const canvas = displayCanvasRef.current;
    const newLayer = createStickerLayer({
      src,
      x: canvas ? canvas.width / 2 - 50 : 50,
      y: canvas ? canvas.height / 2 - 50 : 50,
    });
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === id) {
        return { ...layer, ...updates } as Layer;
      }
      return layer;
    }));
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
    if (activeLayerId === id) {
      setActiveLayerId(null);
    }
  }, [activeLayerId]);

  const duplicateLayer = useCallback((id: string) => {
    const layerToDuplicate = layers.find(layer => layer.id === id);
    if (!layerToDuplicate) return;

    const duplicatedLayer = createTextLayer({
      ...(layerToDuplicate as TextLayer),
      x: layerToDuplicate.x + 20,
      y: layerToDuplicate.y + 20,
    });
    setLayers(prev => [...prev, duplicatedLayer]);
    setActiveLayerId(duplicatedLayer.id);
  }, [layers]);

  // Load photo data and image
  useEffect(() => {
    if (!photoId) return;

    const loadPhotoData = async (id: number) => {
      try {
        setLoading(true);

        // Fetch photo metadata
        const photosResponse = await photoAPI.getPhotos();
        const photoData = photosResponse.data.find(p => p.id === id);

        if (!photoData) {
          console.error('Photo not found');
          return;
        }

        setPhoto(photoData);

        // Fetch photo blob
        const response = await photoAPI.getPhotoRaw(id);
        const blob = response.data as Blob;
        const objectUrl = URL.createObjectURL(blob);
        setOriginalImageUrl(objectUrl);

        // Load image
        const img = new Image();
        img.onload = () => {
          originalImageRef.current = img;
          uncropedImageRef.current = img; // Zachowaj oryginalny obraz
          initializeCanvas(img);
          setLoading(false);
        };
        img.src = objectUrl;
      } catch (error) {
        console.error('Error loading photo:', error);
        setLoading(false);
      }
    };

    loadPhotoData(parseInt(photoId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId]);

  const initializeCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maxWidth = 800;
    const maxHeight = 600;
    let width = img.width;
    let height = img.height;

    // Scale down if too large
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    const displayCanvas = displayCanvasRef.current;
    if (displayCanvas) {
      displayCanvas.width = width;
      displayCanvas.height = height;
    }

    applyAdjustments();
  };

  const applyAdjustments = useCallback(() => {
    const canvas = canvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    const img = originalImageRef.current;

    if (!canvas || !displayCanvas || !img) return;

    const ctx = canvas.getContext('2d');
    const displayCtx = displayCanvas.getContext('2d');

    if (!ctx || !displayCtx) return;

    // Calculate dimensions based on rotation
    const rotation = adjustments.rotation * Math.PI / 180;
    const isRotated90or270 = Math.abs(adjustments.rotation % 180) === 90;

    // Get base dimensions
    const maxWidth = 800;
    const maxHeight = 600;
    let baseWidth = img.width;
    let baseHeight = img.height;

    // Scale down if too large
    if (baseWidth > maxWidth) {
      baseHeight = (baseHeight * maxWidth) / baseWidth;
      baseWidth = maxWidth;
    }
    if (baseHeight > maxHeight) {
      baseWidth = (baseWidth * maxHeight) / baseHeight;
      baseHeight = maxHeight;
    }

    // Swap dimensions if rotated 90 or 270 degrees
    const canvasWidth = isRotated90or270 ? baseHeight : baseWidth;
    const canvasHeight = isRotated90or270 ? baseWidth : baseHeight;

    // Update canvas dimensions
    canvas.width = baseWidth;
    canvas.height = baseHeight;
    displayCanvas.width = canvasWidth;
    displayCanvas.height = canvasHeight;

    // Draw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // === PHASE 1: Basic pixel-based adjustments ===

    // Apply filter first
    if (adjustments.filter === 'grayscale') {
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
      }
    } else if (adjustments.filter === 'sepia') {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
        data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
        data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
      }
    } else if (adjustments.filter === 'vintage') {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i] = Math.min(255, (0.393 * r + 0.769 * g + 0.189 * b) * 0.8);
        data[i + 1] = Math.min(255, (0.349 * r + 0.686 * g + 0.168 * b) * 0.8);
        data[i + 2] = Math.min(255, (0.272 * r + 0.534 * g + 0.131 * b) * 0.6);
      }
    }

    // Apply basic adjustments
    const brightnessFactor = 1 + adjustments.brightness / 100;
    const contrastFactor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
    const saturationFactor = 1 + adjustments.saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply saturation (skip if filter is active)
      if (adjustments.filter === 'none' && adjustments.saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * saturationFactor;
        g = gray + (g - gray) * saturationFactor;
        b = gray + (b - gray) * saturationFactor;
      }

      // Apply brightness
      if (adjustments.brightness !== 0) {
        r *= brightnessFactor;
        g *= brightnessFactor;
        b *= brightnessFactor;
      }

      // Apply contrast
      if (adjustments.contrast !== 0) {
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    // === PHASE 2: Advanced color adjustments ===

    // Temperature adjustment
    applyTemperature(data, adjustments.temperature);

    // Hue rotation
    applyHue(data, adjustments.hue);

    // Vibrance
    applyVibrance(data, adjustments.vibrance);

    // === PHASE 3: Lighting adjustments ===

    // Exposure
    applyExposure(data, adjustments.exposure);

    // Shadows
    applyShadows(data, adjustments.shadows);

    // Highlights
    applyHighlights(data, adjustments.highlights);

    // === PHASE 4: Spatial effects (require full imageData) ===

    // Clarity
    applyClarity(imageData, adjustments.clarity);

    // Sharpness
    applySharpness(imageData, adjustments.sharpness);

    // Blur
    applyBlur(imageData, adjustments.blur);

    // Noise
    applyNoise(data, adjustments.noise);

    // Vignette
    applyVignette(imageData, adjustments.vignette);

    // Create temporary canvas with all adjustments applied
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
    }

    // Apply rotation and flip to display canvas
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    displayCtx.save();
    displayCtx.translate(displayCanvas.width / 2, displayCanvas.height / 2);

    // Apply flips using scale
    const scaleX = adjustments.flipHorizontal ? -1 : 1;
    const scaleY = adjustments.flipVertical ? -1 : 1;
    displayCtx.scale(scaleX, scaleY);

    displayCtx.rotate(rotation);
    displayCtx.drawImage(tempCanvas, -canvas.width / 2, -canvas.height / 2);
    displayCtx.restore();
  }, [adjustments]);

  useEffect(() => {
    if (originalImageRef.current) {
      applyAdjustments();
    }
  }, [adjustments, applyAdjustments]);

  const handleSave = async () => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas || !photoId) return;

    try {
      setSaving(true);

      // Create a temporary canvas for final composition
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = displayCanvas.width;
      finalCanvas.height = displayCanvas.height;
      const finalCtx = finalCanvas.getContext('2d');

      if (!finalCtx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw the edited image
      finalCtx.drawImage(displayCanvas, 0, 0);

      // Draw all text layers on top
      if (layers.length > 0) {
        // Load all Google Fonts before rendering
        const textLayers = layers.filter(l => l.type === 'text') as TextLayer[];
        const stickerLayers = layers.filter(l => l.type === 'sticker') as StickerLayer[];

        if (textLayers.length > 0) {
          const uniqueFonts = Array.from(new Set(textLayers.map(l => l.fontFamily)));
          await Promise.all(uniqueFonts.map(font => {
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;700&display=swap`;
            link.rel = 'stylesheet';
            if (!document.querySelector(`link[href="${link.href}"]`)) {
              document.head.appendChild(link);
            }
            return document.fonts.load(`${textLayers[0].fontSize}px "${font}"`);
          }));
          drawAllTextLayers(finalCtx, textLayers);
        }

        if (stickerLayers.length > 0) {
          await drawAllStickerLayers(finalCtx, stickerLayers);
        }
      }

      // Convert final canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        finalCanvas.toBlob((b) => {
          if (b) resolve(b);
        }, 'image/jpeg', 0.95);
      });

      // Create FormData with edited image
      const formData = new FormData();
      formData.append('photo', blob, `edited_${photo?.filename || 'photo.jpg'}`);
      formData.append('title', photo?.title || 'Edited Photo');

      // Upload as new photo
      await photoAPI.uploadPhoto(formData);

      // Navigate back to library
      navigate('/library');
    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Błąd podczas zapisywania zdjęcia');
    } finally {
      setSaving(false);
    }
  };

  const handleRotateLeft = () => {
    setAdjustments({ ...adjustments, rotation: adjustments.rotation - 90 });
  };

  const handleRotateRight = () => {
    setAdjustments({ ...adjustments, rotation: adjustments.rotation + 90 });
  };

  const handleFlipHorizontal = () => {
    setAdjustments({ ...adjustments, flipHorizontal: !adjustments.flipHorizontal });
  };

  const handleFlipVertical = () => {
    setAdjustments({ ...adjustments, flipVertical: !adjustments.flipVertical });
  };

  const handleCropApply = (cropArea: CropArea) => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;

    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    // Get the cropped image data
    const croppedImageData = ctx.getImageData(
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height
    );

    // Create new image from cropped data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropArea.width;
    tempCanvas.height = cropArea.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(croppedImageData, 0, 0);
    }

    // Create new Image from cropped canvas
    const newImg = new Image();
    newImg.onload = () => {
      originalImageRef.current = newImg;
      initializeCanvas(newImg);
      setCropMode(false);
    };
    newImg.src = tempCanvas.toDataURL();
  };

  const handleCropCancel = () => {
    setCropMode(false);
  };

  const handleCropStart = () => {
    setCropMode(true);
  };

  const handleReset = () => {
    // Przywróć oryginalny obraz przed cropem
    if (uncropedImageRef.current) {
      originalImageRef.current = uncropedImageRef.current;
      initializeCanvas(uncropedImageRef.current);
    }

    // Zresetuj ID filtra
    setActiveFilterId('original');

    // Zresetuj wszystkie adjustacje
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      filter: 'none',
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      // Faza 2: Zaawansowane adjustacje
      temperature: 0,
      hue: 0,
      exposure: 0,
      shadows: 0,
      highlights: 0,
      clarity: 0,
      vibrance: 0,
      sharpness: 0,
      blur: 0,
      noise: 0,
      vignette: 0,
    });
  };

  const handleBack = () => {
    navigate('/library');
  };

  const handleFilterSelect = (filter: Filter) => {
    setActiveFilterId(filter.id);

    // Apply selected filter adjustments - zachowaj rotation i flip
    setAdjustments({
      brightness: filter.adjustments.brightness || 0,
      contrast: filter.adjustments.contrast || 0,
      saturation: filter.adjustments.saturation || 0,
      filter: filter.adjustments.filter || 'none',
      rotation: adjustments.rotation,
      flipHorizontal: adjustments.flipHorizontal,
      flipVertical: adjustments.flipVertical,
      temperature: filter.adjustments.temperature || 0,
      hue: filter.adjustments.hue || 0,
      exposure: filter.adjustments.exposure || 0,
      shadows: filter.adjustments.shadows || 0,
      highlights: filter.adjustments.highlights || 0,
      clarity: filter.adjustments.clarity || 0,
      vibrance: filter.adjustments.vibrance || 0,
      sharpness: filter.adjustments.sharpness || 0,
      blur: filter.adjustments.blur || 0,
      noise: filter.adjustments.noise || 0,
      vignette: filter.adjustments.vignette || 0,
    });
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
      }
    };
  }, [originalImageUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
            <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-slate-400 text-lg">Ładowanie zdjęcia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header - compact */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 shadow-2xl flex-shrink-0 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate">
              Edytor zdjęć
            </h3>
            <p className="text-slate-400 text-xs truncate">
              {photo?.title || `Zdjęcie #${photoId}`}
            </p>
          </div>
        </div>
      </div>

      {/* Main content - fixed height, no outer scrolling */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Sidebar with editing tools - SCROLLABLE */}
        <div className="w-96 flex-shrink-0 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col overflow-hidden">
          {/* Tabs Navigation - FIXED */}
          <div className="grid grid-cols-7 border-b border-slate-700/50 flex-shrink-0">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-2 py-3 text-[10px] font-semibold transition-all flex flex-col items-center gap-1 ${
                activeTab === 'basic'
                  ? 'bg-slate-700/50 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-[9px] leading-none">Podst.</span>
            </button>
            <button
              onClick={() => setActiveTab('color')}
              className={`px-2 py-3 text-[10px] font-semibold transition-all flex flex-col items-center gap-1 ${
                activeTab === 'color'
                  ? 'bg-slate-700/50 text-white border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className="text-[9px] leading-none">Kolor</span>
            </button>
            <button
              onClick={() => setActiveTab('light')}
              className={`px-2 py-3 text-[10px] font-semibold transition-all flex flex-col items-center gap-1 ${
                activeTab === 'light'
                  ? 'bg-slate-700/50 text-white border-b-2 border-orange-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-[9px] leading-none">Światło</span>
            </button>
            <button
              onClick={() => setActiveTab('effects')}
              className={`px-2 py-3 text-[10px] font-semibold transition-all flex flex-col items-center gap-1 ${
                activeTab === 'effects'
                  ? 'bg-slate-700/50 text-white border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-[9px] leading-none">Efekty</span>
            </button>
            <button
              onClick={() => setActiveTab('filters')}
              className={`px-2 py-3 text-[10px] font-semibold transition-all flex flex-col items-center gap-1 ${
                activeTab === 'filters'
                  ? 'bg-slate-700/50 text-white border-b-2 border-green-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-[9px] leading-none">Filtry</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-2 py-3 text-[10px] font-semibold transition-all flex flex-col items-center gap-1 ${
                activeTab === 'text'
                  ? 'bg-slate-700/50 text-white border-b-2 border-red-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="text-[9px] leading-none">Tekst</span>
            </button>
            <button
              onClick={() => setActiveTab('stickers')}
              className={`px-2 py-3 text-[10px] font-semibold transition-all flex flex-col items-center gap-1 ${
                activeTab === 'stickers'
                  ? 'bg-slate-700/50 text-white border-b-2 border-yellow-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[9px] leading-none">Naklejki</span>
            </button>
          </div>

          {/* Tabs Content - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6">
              <div className="space-y-6">
                {/* TAB: Podstawowe */}
                {activeTab === 'basic' && (
                  <>
                    <div>
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span>Adjustacje</span>
                      </h4>
                      <div className="space-y-3">
                        <SliderControl
                          label="Jasność"
                          value={adjustments.brightness}
                          onChange={(value) => setAdjustments({ ...adjustments, brightness: value })}
                          min={-100}
                          max={100}
                        />
                        <SliderControl
                          label="Kontrast"
                          value={adjustments.contrast}
                          onChange={(value) => setAdjustments({ ...adjustments, contrast: value })}
                          min={-100}
                          max={100}
                        />
                        <SliderControl
                          label="Nasycenie"
                          value={adjustments.saturation}
                          onChange={(value) => setAdjustments({ ...adjustments, saturation: value })}
                          min={-100}
                          max={100}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <span>Filtry</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setAdjustments({ ...adjustments, filter: 'none' })}
                          className={`rounded-lg p-2.5 text-xs font-medium transition-all duration-200 ${
                            adjustments.filter === 'none'
                              ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
                              : 'bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-blue-500/50 hover:text-white'
                          }`}
                        >
                          Oryginał
                        </button>
                        <button
                          onClick={() => setAdjustments({ ...adjustments, filter: 'vintage' })}
                          className={`rounded-lg p-2.5 text-xs font-medium transition-all duration-200 ${
                            adjustments.filter === 'vintage'
                              ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
                              : 'bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-blue-500/50 hover:text-white'
                          }`}
                        >
                          Vintage
                        </button>
                        <button
                          onClick={() => setAdjustments({ ...adjustments, filter: 'grayscale' })}
                          className={`rounded-lg p-2.5 text-xs font-medium transition-all duration-200 ${
                            adjustments.filter === 'grayscale'
                              ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
                              : 'bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-blue-500/50 hover:text-white'
                          }`}
                        >
                          Czarno-biały
                        </button>
                        <button
                          onClick={() => setAdjustments({ ...adjustments, filter: 'sepia' })}
                          className={`rounded-lg p-2.5 text-xs font-medium transition-all duration-200 ${
                            adjustments.filter === 'sepia'
                              ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
                              : 'bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-blue-500/50 hover:text-white'
                          }`}
                        >
                          Sepia
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Obrót</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={handleRotateLeft}
                            className="rounded-lg p-2.5 text-xs font-medium bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-orange-500/50 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span>Lewo</span>
                          </button>
                          <button
                            onClick={handleRotateRight}
                            className="rounded-lg p-2.5 text-xs font-medium bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-orange-500/50 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <span>Prawo</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                            </svg>
                          </button>
                        </div>
                        <SliderControl
                          label="Precyzyjny obrót"
                          value={adjustments.rotation}
                          onChange={(value) => setAdjustments({ ...adjustments, rotation: value })}
                          min={-180}
                          max={180}
                          color="orange"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>Odbicie & Przycinanie</span>
                      </h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={handleFlipHorizontal}
                            className={`rounded-lg p-2.5 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                              adjustments.flipHorizontal
                                ? 'bg-cyan-500/20 border-2 border-cyan-500 text-white'
                                : 'bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/50 hover:text-white'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Poziomo</span>
                          </button>
                          <button
                            onClick={handleFlipVertical}
                            className={`rounded-lg p-2.5 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                              adjustments.flipVertical
                                ? 'bg-cyan-500/20 border-2 border-cyan-500 text-white'
                                : 'bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/50 hover:text-white'
                            }`}
                          >
                            <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Pionowo</span>
                          </button>
                        </div>
                        <button
                          onClick={handleCropStart}
                          disabled={cropMode}
                          className="w-full rounded-lg p-2.5 text-xs font-medium bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/50 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Przytnij</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB: Kolor */}
                {activeTab === 'color' && (
                  <>
                    <div>
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <span>Temperatura i Odcień</span>
                      </h4>
                      <div className="space-y-3">
                        <SliderControl
                          label="Temperatura"
                          value={adjustments.temperature}
                          onChange={(value) => setAdjustments({ ...adjustments, temperature: value })}
                          min={-100}
                          max={100}
                          color="orange"
                        />
                        <SliderControl
                          label="Odcień (Hue)"
                          value={adjustments.hue}
                          onChange={(value) => setAdjustments({ ...adjustments, hue: value })}
                          min={0}
                          max={360}
                          color="purple"
                        />
                        <SliderControl
                          label="Żywość (Vibrance)"
                          value={adjustments.vibrance}
                          onChange={(value) => setAdjustments({ ...adjustments, vibrance: value })}
                          min={-100}
                          max={100}
                          color="pink"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TAB: Światło */}
                {activeTab === 'light' && (
                  <>
                    <div>
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Ekspozycja</span>
                      </h4>
                      <div className="space-y-3">
                        <SliderControl
                          label="Ekspozycja (Exposure)"
                          value={adjustments.exposure}
                          onChange={(value) => setAdjustments({ ...adjustments, exposure: value })}
                          min={-100}
                          max={100}
                          color="yellow"
                        />
                        <SliderControl
                          label="Cienie (Shadows)"
                          value={adjustments.shadows}
                          onChange={(value) => setAdjustments({ ...adjustments, shadows: value })}
                          min={-100}
                          max={100}
                          color="blue"
                        />
                        <SliderControl
                          label="Światła (Highlights)"
                          value={adjustments.highlights}
                          onChange={(value) => setAdjustments({ ...adjustments, highlights: value })}
                          min={-100}
                          max={100}
                          color="orange"
                        />
                        <SliderControl
                          label="Klarowność (Clarity)"
                          value={adjustments.clarity}
                          onChange={(value) => setAdjustments({ ...adjustments, clarity: value })}
                          min={-100}
                          max={100}
                          color="cyan"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TAB: Efekty */}
                {activeTab === 'effects' && (
                  <>
                    <div>
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span>Efekty Specjalne</span>
                      </h4>
                      <div className="space-y-3">
                        <SliderControl
                          label="Ostrość (Sharpness)"
                          value={adjustments.sharpness}
                          onChange={(value) => setAdjustments({ ...adjustments, sharpness: value })}
                          min={0}
                          max={100}
                          color="blue"
                        />
                        <SliderControl
                          label="Rozmycie (Blur)"
                          value={adjustments.blur}
                          onChange={(value) => setAdjustments({ ...adjustments, blur: value })}
                          min={0}
                          max={50}
                          color="purple"
                        />
                        <SliderControl
                          label="Szum (Noise)"
                          value={adjustments.noise}
                          onChange={(value) => setAdjustments({ ...adjustments, noise: value })}
                          min={0}
                          max={100}
                          color="green"
                        />
                        <SliderControl
                          label="Winieta (Vignette)"
                          value={adjustments.vignette}
                          onChange={(value) => setAdjustments({ ...adjustments, vignette: value })}
                          min={0}
                          max={100}
                          color="purple"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TAB: Filtry */}
                {activeTab === 'filters' && (
                  <div>
                    <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18M3 12h18M3 21h18" />
                      </svg>
                      <span>Filtry</span>
                    </h4>
                    <div className="space-y-4">
                      {/* Filter gallery component */}
                      <FilterGallery
                        originalImage={uncropedImageRef.current}
                        activeFilterId={activeFilterId}
                        onFilterSelect={handleFilterSelect}
                      />
                    </div>
                  </div>
                )}

                {/* TAB: Tekst */}
                {activeTab === 'text' && (
                  <div>
                    <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4h-3a2 2 0 00-2 2v12a2 2 0 002 2h3a2 2 0 002-2V6a2 2 0 00-2-2zm-4 0H7a2 2 0 00-2 2v12a2 2 0 002 2h5m0-16v16" />
                      </svg>
                      <span>Warstwy Tekstowe</span>
                    </h4>
                    <div className="space-y-4">
                      {/* Text layers list */}
                      <div className="space-y-2">
                        {layers.length === 0 && (
                          <p className="text-slate-400 text-sm text-center">
                            Brak warstw tekstowych. Dodaj nową warstwę tekstową, aby rozpocząć.
                          </p>
                        )}
                        {layers.map(layer => {
                          // Only show text layers in this list
                          if (layer.type !== 'text') return null;

                          return (
                            <div
                              key={layer.id}
                              className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3
                              ${activeLayerId === layer.id
                                  ? 'bg-blue-500/20 border-blue-500'
                                  : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-700/50'
                              }`}
                              onClick={() => setActiveLayerId(layer.id)}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {layer.content}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                  Pozycja: ({Math.round(layer.x)}, {Math.round(layer.y)})
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteLayer(layer.id);
                                }}
                                className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all flex items-center justify-center"
                              >
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add text layer button */}
                      <button
                        onClick={addTextLayer}
                        className="w-full rounded-lg p-2.5 text-xs font-medium bg-green-500 hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Dodaj tekst</span>
                      </button>

                      {/* Text Toolbar - pokazuje się gdy zaznaczona jest warstwa tekstowa */}
                      {activeLayerId && layers.find(l => l.id === activeLayerId) && (
                        <div className="border-t border-slate-700 pt-4 mt-4">
                          <TextToolbar
                            layer={layers.find(l => l.id === activeLayerId && l.type === 'text') as TextLayer || null}
                            onUpdate={(id, updates) => updateLayer(id, updates)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: Stickers */}
                {activeTab === 'stickers' && (
                  <div>
                    <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Naklejki</span>
                    </h4>
                    <StickerPanel
                      onStickerSelect={addStickerLayer}
                      onUpload={addStickerLayer}
                    />
                  </div>
                )}

                {/* Actions - visible on all tabs */}
                <div>
                  <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Akcje</span>
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Zapisywanie...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          <span>Zapisz</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Resetuj</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main editing area - STICKY POSITION */}
        <div className="flex-1 flex items-start justify-center overflow-visible min-h-0">
          <div className="sticky top-4 bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 relative">
            <canvas
              ref={displayCanvasRef}
              className="max-w-full max-h-full h-auto shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 250px)', maxWidth: 'calc(100vw - 600px)' }}
            />
            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Crop Tool Overlay */}
            {cropMode && displayCanvasRef.current && (
              <div className="absolute top-0 left-0" style={{ width: displayCanvasRef.current.width, height: displayCanvasRef.current.height }}>
                <CropTool
                  imageWidth={displayCanvasRef.current.width}
                  imageHeight={displayCanvasRef.current.height}
                  onCropApply={handleCropApply}
                  onCropCancel={handleCropCancel}
                />
              </div>
            )}

            {/* Text layers - rendered on top of the image */}
            {layers.length > 0 && (
              <div className="absolute top-0 left-0" style={{ width: displayCanvasRef.current?.width || 0, height: displayCanvasRef.current?.height || 0, pointerEvents: 'none' }}>
                {layers.map(layer => {
                  if (layer.type === 'text') {
                    return (
                      <TextEditor
                        key={layer.id}
                        layer={layer}
                        onUpdate={(updates) => updateLayer(layer.id, updates)}
                        onDelete={() => deleteLayer(layer.id)}
                        onDuplicate={() => duplicateLayer(layer.id)}
                        isActive={activeLayerId === layer.id}
                        setActive={() => setActiveLayerId(layer.id)}
                      />
                    );
                  }
                  if (layer.type === 'sticker') {
                    return (
                      <StickerEditor
                        key={layer.id}
                        sticker={layer as StickerLayer}
                        onUpdate={(id, updates) => updateLayer(id, updates)}
                        onDelete={() => deleteLayer(layer.id)}
                        isActive={activeLayerId === layer.id}
                        setActive={() => setActiveLayerId(layer.id)}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;

