// biome-ignore lint/style/useFilenamingConvention: Spec canonical filename designTokens.ts
// @kidthink/game-engine — Design Tokens (Canvas rendering counterpart to CSS @theme)

export const designTokens = {
  colors: {
    brand: {
      50: "#f5f3ff",
      100: "#ede9fe",
      200: "#ddd6fe",
      300: "#c4b5fd",
      400: "#a78bfa",
      500: "#8b5cf6",
      600: "#7c3aed",
      700: "#6d28d9",
      800: "#5b21b6",
      900: "#4c1d95",
    },
    cta: "#f97316",
    ctaHover: "#ea580c",
    ctaLight: "#ffedd5",
    surface: {
      50: "#fafafa",
      100: "#f4f4f5",
      200: "#e4e4e7",
      300: "#d4d4d8",
      400: "#a1a1aa", // Note: border/placeholder only, does not satisfy 4.5:1 body contrast
      500: "#71717a",
      600: "#52525b",
      700: "#3f3f46",
      800: "#27272a",
      900: "#18181b",
    },
    retry: "#d97706",
    semantic: {
      success: { 400: "#4ade80", 500: "#22c55e", 600: "#16a34a" },
      warning: { 400: "#facc15", 500: "#eab308", 600: "#ca8a04" },
      danger: { 400: "#f87171", 500: "#ef4444", 600: "#dc2626" },
    },
  },
  radius: {
    chip: "12px",
    button: "16px",
    card: "24px",
    full: "9999px",
  },
  motion: {
    instant: "90ms",
    quick: "160ms",
    base: "200ms",
    snap: "260ms",
    settle: "340ms",
  },
} as const;

export type DesignTokens = typeof designTokens;
