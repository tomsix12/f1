import type { AccentKey, ThemeMode } from "../types";

export interface AccentPalette {
  primary: string;
  "on-primary": string;
  "primary-container": string;
  "on-primary-container": string;
}

export interface AccentDefinition {
  label: string;
  light: AccentPalette;
  dark: AccentPalette;
}

export interface NeutralPalette {
  bg: string;
  surface: string;
  "surface-2": string;
  "surface-3": string;
  text: string;
  "text-2": string;
  "text-3": string;
  line: string;
}

/**
 * Neutrals (backgrounds, surfaces, type) stay grey/black or white/grey in both
 * modes; the accent only changes primary / container tokens. These values are
 * mirrored by the CSS custom properties in src/styles/tokens.css and are used
 * at runtime only for the browser theme-color and the accent swatches.
 */
export const NEUTRALS: Record<"dark" | "light", NeutralPalette> = {
  light: {
    bg: "#F6F6F7",
    surface: "#FFFFFF",
    "surface-2": "#EFEFF1",
    "surface-3": "#E4E4E7",
    text: "#0B0B0C",
    "text-2": "#3C3C40",
    "text-3": "#68686E",
    line: "#DDDDE0",
  },
  dark: {
    bg: "#0B0B0C",
    surface: "#141416",
    "surface-2": "#1E1E21",
    "surface-3": "#29292D",
    text: "#FAFAFB",
    "text-2": "#C6C6CA",
    "text-3": "#8E8E94",
    line: "#2E2E32",
  },
};

export const ACCENTS: Record<AccentKey, AccentDefinition> = {
  red: {
    label: "Red",
    light: { primary: "#D32F2F", "on-primary": "#FFFFFF", "primary-container": "#FFDAD6", "on-primary-container": "#410002" },
    dark: { primary: "#FFB4AB", "on-primary": "#690005", "primary-container": "#93000A", "on-primary-container": "#FFDAD6" },
  },
  blue: {
    label: "Blue",
    light: { primary: "#1565C0", "on-primary": "#FFFFFF", "primary-container": "#D6E3FF", "on-primary-container": "#001B3E" },
    dark: { primary: "#A9C7FF", "on-primary": "#003063", "primary-container": "#00468B", "on-primary-container": "#D6E3FF" },
  },
  green: {
    label: "Green",
    light: { primary: "#2E7D32", "on-primary": "#FFFFFF", "primary-container": "#C8E6C9", "on-primary-container": "#002105" },
    dark: { primary: "#8FD694", "on-primary": "#00390F", "primary-container": "#00531B", "on-primary-container": "#C8E6C9" },
  },
  teal: {
    label: "Teal",
    light: { primary: "#00695C", "on-primary": "#FFFFFF", "primary-container": "#B2DFDB", "on-primary-container": "#00201C" },
    dark: { primary: "#6FD8C8", "on-primary": "#00382F", "primary-container": "#005144", "on-primary-container": "#B2DFDB" },
  },
  amber: {
    label: "Amber",
    light: { primary: "#8A4F00", "on-primary": "#FFFFFF", "primary-container": "#FFE0B2", "on-primary-container": "#2B1700" },
    dark: { primary: "#FFB95C", "on-primary": "#4A2800", "primary-container": "#6A3B00", "on-primary-container": "#FFE0B2" },
  },
  pink: {
    label: "Pink",
    light: { primary: "#B0005C", "on-primary": "#FFFFFF", "primary-container": "#FFD9E2", "on-primary-container": "#3E001D" },
    dark: { primary: "#FFB1C8", "on-primary": "#64002F", "primary-container": "#8E0046", "on-primary-container": "#FFD9E2" },
  },
  violet: {
    label: "Violet",
    light: { primary: "#6A3DB8", "on-primary": "#FFFFFF", "primary-container": "#EADDFF", "on-primary-container": "#23005C" },
    dark: { primary: "#D0BCFF", "on-primary": "#3A1D71", "primary-container": "#513A87", "on-primary-container": "#EADDFF" },
  },
  graphite: {
    label: "Graphite",
    light: { primary: "#2E2E32", "on-primary": "#FFFFFF", "primary-container": "#E4E4E7", "on-primary-container": "#1B1B1E" },
    dark: { primary: "#E4E4E7", "on-primary": "#1B1B1E", "primary-container": "#3C3C40", "on-primary-container": "#E4E4E7" },
  },
};

export const ACCENT_ORDER: AccentKey[] = [
  "red",
  "blue",
  "green",
  "teal",
  "amber",
  "pink",
  "violet",
  "graphite",
];

export const DEFAULT_ACCENT: AccentKey = "red";

export function isAccentKey(value: unknown): value is AccentKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(ACCENTS, value);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "dark" || value === "light";
}