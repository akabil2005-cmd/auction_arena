/** Local actress assets served from /public/actresses */
export const ACTRESS_IMAGE_FALLBACK = '/actresses/samantha.jpg';

export function getActressImageSrc(image?: string | null): string {
  if (!image) return ACTRESS_IMAGE_FALLBACK;
  if (image.startsWith('/actresses/')) return image;
  if (image.startsWith('actresses/')) return `/${image}`;
  return ACTRESS_IMAGE_FALLBACK;
}

export function preloadActressImage(image?: string | null): void {
  if (typeof window === 'undefined') return;
  const src = getActressImageSrc(image);
  const img = new window.Image();
  img.src = src;
}
