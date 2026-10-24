import {
  type AccessTier,
  AGE_BANDS,
  type AgeBand,
  COMPETENCY_CATALOG,
  findStrand,
  type LevelCta,
} from "@mindkid/shared/client";

export const COMPETENCY_ICONS: Readonly<Record<string, string>> = {
  C1: "i-lucide-hash",
  C2: "i-lucide-shapes",
  C3: "i-lucide-git-branch",
  C4: "i-lucide-lightbulb",
  C5: "i-lucide-message-circle",
  C6: "i-lucide-compass",
};

export function getCompetencyIcon(code: string): string {
  return COMPETENCY_ICONS[code] || "i-lucide-sparkles";
}

export const COMPETENCY_OPTIONS = COMPETENCY_CATALOG.map((entry) => ({
  value: entry.code,
  label: entry.name,
  emoji: entry.emoji,
}));

export const AGE_BAND_LABELS: Record<
  AgeBand,
  { label: string; shortLabel: string }
> = {
  "3-4": { label: "3–4 tuổi (Lớp Mầm)", shortLabel: "3–4 tuổi (Mầm)" },
  "4-5": { label: "4–5 tuổi (Lớp Chồi)", shortLabel: "4–5 tuổi (Chồi)" },
  "5-6": { label: "5–6 tuổi (Lớp Lá)", shortLabel: "5–6 tuổi (Lá)" },
};

export const AGE_BAND_OPTIONS = AGE_BANDS.map((band) => ({
  value: band,
  ...AGE_BAND_LABELS[band],
}));

export const TIER_OPTIONS = [
  { value: "free", label: "Miễn phí chơi thử" },
  { value: "login", label: "Cần đăng ký tài khoản" },
  { value: "standard", label: "Gói Tiêu chuẩn" },
  { value: "premium", label: "Gói Premium" },
] as const;

export const PAGE_SIZE = 60;

export interface CatalogItem {
  code: string;
  title: string;
  competency: string | null;
  age_band: string | null;
  difficulty: number | null;
  access_tier: AccessTier;
  thumbnail_emoji: string | null;
  locked: boolean;
  cta: LevelCta;
}

export interface CatalogFacets {
  total: number;
  competency: Record<string, number>;
  age_band: Record<string, number>;
  age: Record<string, number>;
  access_tier: Record<string, number>;
  strand?: Record<string, number>;
}

export interface CatalogResponse {
  items: CatalogItem[];
  total: number;
  facets: CatalogFacets;
  next_cursor: string | null;
}

export interface UserAccessContext {
  has_active_child: boolean;
  active_keys: string[];
  allowed_tiers: string[];
}

export function normalizeStrandCode(raw: string | undefined): string {
  if (!raw) {
    return "";
  }
  const found = findStrand(raw);
  return found ? found.code : raw;
}

export function getTierFilterLabel(tier: string): string {
  const match = TIER_OPTIONS.find((t) => t.value === tier);
  return match ? match.label : tier;
}

export function getAgeBandLabel(band: string): string {
  const match = AGE_BAND_OPTIONS.find((a) => a.value === band);
  return match ? match.label : `${band} tuổi`;
}
