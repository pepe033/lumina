import React, { useState } from 'react';
import { EMOJI_CATEGORIES, EMOJI_CATEGORY_NAMES, EmojiCategory } from '../constants/emojis';

interface StickerPanelProps {
  onStickerSelect: (src: string) => void;
  onUpload: (src: string) => void;
}

const StickerPanel: React.FC<StickerPanelProps> = ({ onStickerSelect, onUpload }) => {
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('emotions');
  const [uploadedSticker, setUploadedSticker] = useState<string | null>(null);

  // Konwersja emoji na obrazek (data URL)
  const emojiToImage = (emoji: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      // Ustawienie rozmiaru canvas
      canvas.width = 128;
      canvas.height = 128;

      // Rysowanie emoji
      ctx.font = '100px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 64, 64);

      // Konwersja na data URL
      resolve(canvas.toDataURL('image/png'));
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedSticker(result);
        onUpload(result);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleStickerClick = async (emoji: string) => {
    const imageData = await emojiToImage(emoji);
    onStickerSelect(imageData);
  };

  const handleUploadedStickerClick = () => {
    if (uploadedSticker) {
      onUpload(uploadedSticker);
    }
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg">
      <div className="flex border-b border-gray-700 mb-4">
        {(Object.keys(EMOJI_CATEGORIES) as EmojiCategory[]).map((category) => (
          <button
            key={category}
            className={`px-4 py-2 text-sm font-medium ${
              activeCategory === category
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {EMOJI_CATEGORY_NAMES[category]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-2 mb-4">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <div
            key={`${emoji}-${index}`}
            className="text-2xl cursor-pointer p-1 rounded-md hover:bg-gray-700 flex items-center justify-center transition-colors"
            onClick={() => handleStickerClick(emoji)}
            title={emoji}
          >
            {emoji}
          </div>
        ))}
      </div>
      <div className="upload-section">
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          onChange={handleFileChange}
          id="sticker-upload"
          className="hidden"
        />
        <label
          htmlFor="sticker-upload"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer text-center block transition-colors"
        >
          Upload własnej naklejki
        </label>
        {uploadedSticker && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Podgląd (kliknij aby dodać):</p>
            <div
              className="w-24 h-24 bg-gray-700 rounded-md flex items-center justify-center p-2 cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={handleUploadedStickerClick}
            >
              <img src={uploadedSticker} alt="Uploaded Sticker Preview" className="max-w-full max-h-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StickerPanel;
