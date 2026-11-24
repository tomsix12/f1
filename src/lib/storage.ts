import { CACHE_KEY } from "../config";
import type { SeasonData } from "../types";

export interface CacheEntry {
  savedAt: number;
  data: SeasonData;
}

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage may be unavailable (private mode, quota, file://) */
  }
}

/** Last successful payload, kept in localStorage together with its timestamp. */
export const cache = {
  read(): CacheEntry | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<CacheEntry> | null;
      if (!parsed || !parsed.data || !Array.isArray(parsed.data.races) || !parsed.data.races.length) {
        return null;
      }
      return {
        savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
        data: parsed.data,
      };
    } catch {
      return null;
    }
  },

  write(savedAt: number, data: SeasonData): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt, data }));
    } catch (error) {
      console.warn("[F1] Unable to cache data:", error);
    }
  },
};