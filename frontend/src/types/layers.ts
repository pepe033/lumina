/**
 * Text Layer System
 * Definiuje strukturę warstwy tekstowej dla edytora obrazów
 */

export type LayerType = 'text' | 'image' | 'shape' | 'sticker';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface TextLayer {
  // Identyfikacja warstwy
  id: string;
  type: LayerType;

  // Zawartość tekstowa
  content: string;

  // Pozycja i wymiary
  x: number;
  y: number;
  width: number;
  height: number;

  // Transformacje
  rotation: number; // w stopniach

  // Styl czcionki
  fontSize: number; // w pikselach
  fontFamily: string;
  color: string; // hex, rgb, rgba

  // Formatowanie tekstu
  bold: boolean;
  italic: boolean;
  underline: boolean;

  // Obramowanie tekstu
  strokeColor: string; // hex, rgb, rgba
  strokeWidth: number; // w pikselach

  // Cień
  shadowX: number; // przesunięcie w osi X
  shadowY: number; // przesunięcie w osi Y
  shadowBlur: number; // rozmycie cienia
  shadowColor: string; // hex, rgb, rgba

  // Wyświetlanie
  opacity: number; // 0-1
  align: TextAlign;
}

/**
 * Sticker Layer System
 * Definiuje strukturę warstwy naklejki dla edytora obrazów
 */
export interface StickerLayer {
  // Identyfikacja warstwy
  id: string;
  type: 'sticker';

  // Źródło naklejki
  src: string; // URL lub ścieżka do obrazka

  // Pozycja i wymiary
  x: number;
  y: number;
  width: number;
  height: number;

  // Transformacje
  rotation: number; // w stopniach
  opacity: number; // 0-1
}

/**
 * Union type for all possible layer types
 */
export type Layer = TextLayer | StickerLayer;

/**
 * Typ dla częściowych aktualizacji warstwy tekstowej
 */
export type TextLayerUpdate = Partial<Omit<TextLayer, 'id' | 'type'>>;

/**
 * Domyślne wartości dla nowej warstwy tekstowej
 */
export const DEFAULT_TEXT_LAYER: Omit<TextLayer, 'id'> = {
  type: 'text',
  content: 'Nowy tekst',
  x: 100,
  y: 100,
  width: 200,
  height: 50,
  rotation: 0,
  fontSize: 24,
  fontFamily: 'Arial',
  color: '#000000',
  bold: false,
  italic: false,
  underline: false,
  strokeColor: '#000000',
  strokeWidth: 0,
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowColor: '#000000',
  opacity: 1,
  align: 'left',
};

/**
 * Domyślne wartości dla nowej warstwy naklejki
 */
export const DEFAULT_STICKER_LAYER: Omit<StickerLayer, 'id' | 'src'> = {
  type: 'sticker',
  x: 150,
  y: 150,
  width: 100,
  height: 100,
  rotation: 0,
  opacity: 1,
};

/**
 * Helper function do tworzenia nowej warstwy tekstowej
 */
export function createTextLayer(overrides?: Partial<TextLayer>): TextLayer {
  return {
    id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...DEFAULT_TEXT_LAYER,
    ...overrides,
  };
}

/**
 * Helper function do tworzenia nowej warstwy naklejki
 */
export function createStickerLayer(overrides: Partial<StickerLayer> & { src: string }): StickerLayer {
  return {
    id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...DEFAULT_STICKER_LAYER,
    ...overrides,
  };
}
