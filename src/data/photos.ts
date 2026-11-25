import manifest from "./photos.json";

export interface DriverPhoto {
  file: string;
  title: string;
  page: string;
  credit: string;
}

const PHOTOS = manifest as Record<string, DriverPhoto>;

export function driverPhoto(code: string): DriverPhoto | null {
  if (!code) return null;
  return PHOTOS[code] || null;
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