import manifest from "./photos.json";

export interface DriverPhoto {
  /** Bundled portrait from Wikipedia (legacy fallback). */
  file: string;
  /** Full-body cut-out on a transparent background, from Formula 1. */
  hero?: string;
  /** Square head crop on a transparent background, from Formula 1. */
  avatar?: string;
  title: string;
  page: string;
  credit: string;
}

const PHOTOS = manifest as Record<string, DriverPhoto>;

export function driverPhoto(code: string): DriverPhoto | null {
  if (!code) return null;
  return PHOTOS[code] || null;
}

/** Small circular portrait used in lists and classification tables. */
export function driverAvatarFile(code: string): string | null {
  const photo = driverPhoto(code);
  return photo ? photo.avatar || photo.file : null;
}

/** Tall cut-out used in the driver profile banner. */
export function driverHeroFile(code: string): string | null {
  const photo = driverPhoto(code);
  return photo ? photo.hero || photo.file : null;
}

/** Fallback avatar text when a portrait has not been downloaded. */
export function driverInitials(name: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + last).toUpperCase();
}