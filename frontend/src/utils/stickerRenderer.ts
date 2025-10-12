import type { StickerLayer } from '../types';

/**
 * Funkcja pomocnicza do ładowania obrazu
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Rysuje pojedynczą warstwę naklejki na canvas
 */
export const drawStickerLayer = async (
  ctx: CanvasRenderingContext2D,
  layer: StickerLayer
): Promise<void> => {
  try {
    // Załaduj obraz naklejki
    const img = await loadImage(layer.src);

    // Zapisz stan kontekstu
    ctx.save();

    // Ustaw przezroczystość
    ctx.globalAlpha = layer.opacity;

    // Przesuń punkt odniesienia do środka naklejki
    ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);

    // Zastosuj rotację
    ctx.rotate((layer.rotation * Math.PI) / 180);

    // Narysuj obraz (z punktem odniesienia w środku)
    ctx.drawImage(
      img,
      -layer.width / 2,
      -layer.height / 2,
      layer.width,
      layer.height
    );

    // Przywróć stan kontekstu
    ctx.restore();
  } catch (error) {
    console.error('Error drawing sticker layer:', error);
  }
};

/**
 * Rysuje wszystkie warstwy naklejek na canvas
 */
export const drawAllStickerLayers = async (
  ctx: CanvasRenderingContext2D,
  layers: StickerLayer[]
): Promise<void> => {
  // Rysuj naklejki w kolejności (jedna po drugiej)
  for (const layer of layers) {
    await drawStickerLayer(ctx, layer);
  }
};
