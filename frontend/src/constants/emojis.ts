/**
 * Biblioteka emoji podzielona na kategorie
 */
export const EMOJI_CATEGORIES = {
  emotions: ['😀', '😂', '😍', '😢', '😡', '🤔', '😴', '🥳'],
  hands: ['👍', '👎', '👌', '✌️', '👋', '🙏', '👏', '💪'],
  hearts: ['❤️', '💔', '💖', '💕', '💞', '💓', '💗', '💙'],
  symbols: ['✅', '❌', '❓', '❗️', '⭐️', '✨', '🔥', '💯'],
};

export type EmojiCategory = keyof typeof EMOJI_CATEGORIES;

export const EMOJI_CATEGORY_NAMES: { [key in EmojiCategory]: string } = {
  emotions: 'Emocje',
  hands: 'Dłonie',
  hearts: 'Serca',
  symbols: 'Symbole',
};

