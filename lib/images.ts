import imageUrls from './image-urls.json';

export function getImageUrl(filename: string): string {
  return imageUrls[filename as keyof typeof imageUrls] || `/banners/${filename}`;
}

export const BANNER_IMAGES = {
  '4en': getImageUrl('4en.webp'),
  '4hi': getImageUrl('4hi.webp'),
  '3en': getImageUrl('3en.webp'),
  '3hi': getImageUrl('3hi.webp'),
  '2en': getImageUrl('2en.webp'),
  '2hi': getImageUrl('2hi.webp'),
  '1en': getImageUrl('1en.webp'),
  '1hi': getImageUrl('1hi.webp'),
} as const;

export const SLOT_GAME_IMAGES = {
  neonShinjuku: getImageUrl('neon-shinjuku/preview.webp'),
  maestro: getImageUrl('maestro/preview.webp'),
  villagersDream: getImageUrl('villagers-dream/preview.webp'),
  rupeeRush: getImageUrl('rupee-rush/preview.webp'),
  forestRomp: getImageUrl('forest-romp/preview.webp'),
} as const;