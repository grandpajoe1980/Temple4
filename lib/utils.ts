import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Returns a readable foreground color (#ffffff or #0f172a) for given background hex
export function getContrastColor(hex?: string) {
  if (!hex) return '#0f172a';
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return luminanceContrast(r, g, b) > 0.5 ? '#0f172a' : '#ffffff';
  }
  if (cleaned.length !== 6) return '#0f172a';
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return luminanceContrast(r, g, b) > 0.5 ? '#0f172a' : '#ffffff';
}

function luminanceContrast(r: number, g: number, b: number) {
  // convert to linear RGB
  const srgb = [r, g, b].map((v) => v / 255).map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  // relative luminance
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return L;
}
