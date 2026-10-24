import {
  type AccessTier,
  buildPublicHreflangLinks,
  type EntitlementKey,
  findCompetency,
  type StrandCatalogEntry,
} from "@mindkid/shared/client";
import type { ComputedRef } from "vue";
import { useHead, useSeoMeta } from "#imports";

export interface RelatedGame {
  code: string;
  title: string;
  difficulty?: number;
  access_tier: AccessTier;
  locked: boolean;
  emoji?: string;
  age_band?: string;
}

export interface AlternativeGame {
  code: string;
  title: string;
  access_tier?: string;
}

export interface GameDetailResponse {
  code: string;
  title: string;
  description: string;
  competency: string;
  strand_code?: string;
  strand_name?: string;
  age_min: number;
  age_max: number;
  age_band: string;
  difficulty: number;
  theme_id: string;
  template_code: string;
  template_name: string;
  mechanic_type: string;
  access_tier: AccessTier;
  locked: boolean;
  scoring: { mode: string };
  rounds: Array<{
    round_index: number;
    instruction?: string | null;
  }>;
  cta: {
    text: string;
    action: string;
    href: string;
  };
  preview_images?: string[];
  related_games?: RelatedGame[];
  thumbnail_emoji?: string;
}

export interface ApiErrorPayload {
  data?: {
    alternatives?: AlternativeGame[];
  };
}

export function hasErrorAlternatives(val: object): val is ApiErrorPayload {
  return "data" in val && typeof val.data === "object" && val.data !== null;
}

export const LEVEL_STRAND_REGEX = /^GL-(C[1-6])-([A-Z]{2,5})-/;

export interface UserAccessContext {
  is_authenticated: boolean;
  has_active_child: boolean;
  active_keys: EntitlementKey[];
  allowed_tiers: AccessTier[];
}

export interface GameDetailMetaTarget {
  code: string;
  title: string;
  description: string;
  age_band: string;
  access_tier: string;
  competency: string;
  strand_code?: string;
}

export function buildLearningResourceJsonLd(
  game: GameDetailMetaTarget | undefined,
  strandInfo: StrandCatalogEntry | undefined,
  code: string
): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: game?.title || "Trò chơi tư duy",
    description: game?.description || "",
    learningResourceType: "Interactive Game",
    educationalLevel: `Trẻ mầm non ${game?.age_band || "3–6"} tuổi`,
    inLanguage: "vi-VN",
    isAccessibleForFree: game?.access_tier === "free",
    teaches:
      strandInfo?.name ||
      findCompetency(game?.competency || "C1")?.name ||
      "Tư duy toán học",
    url: `https://mindkid.vn/games/${code}`,
  });
}

export function buildBreadcrumbJsonLd(
  game: GameDetailMetaTarget | undefined,
  code: string
): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: "https://mindkid.vn/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Thư viện trò chơi",
        item: "https://mindkid.vn/games",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: game?.title || "Trò chơi tư duy",
        item: `https://mindkid.vn/games/${code}`,
      },
    ],
  });
}

export function buildFaqJsonLd(game: GameDetailMetaTarget | undefined): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Trò chơi ${game?.title || ""} phù hợp cho bé bao nhiêu tuổi?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Trò chơi được thiết kế chuẩn sư phạm cho bé trong độ tuổi ${game?.age_band || "3–6"} tuổi.`,
        },
      },
      {
        "@type": "Question",
        name: "Bé có được chơi thử miễn phí không?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            game?.access_tier === "free"
              ? "Trò chơi hoàn toàn miễn phí cho mọi bé trải nghiệm."
              : "Phụ huynh có thể đăng ký tài khoản để bắt đầu cho bé chơi thử.",
        },
      },
    ],
  });
}

export function useGameDetailSeo(
  game: ComputedRef<GameDetailMetaTarget | undefined>,
  strandInfo: ComputedRef<StrandCatalogEntry | undefined>,
  code: ComputedRef<string>
): void {
  useSeoMeta({
    title: () =>
      `${game.value?.title || "Trò chơi tư duy"} — Trò chơi cho bé ${game.value?.age_band || "3–6"} tuổi | MindKid`,
    description: () => game.value?.description || "",
    ogTitle: () => `${game.value?.title || "Trò chơi tư duy"} — MindKid`,
    ogDescription: () => game.value?.description || "",
    ogImage: () => `https://mindkid.vn/images/og-${code.value}.png`,
    ogType: "article",
  });

  useHead({
    htmlAttrs: { lang: "vi-VN" },
    link: () => [
      { rel: "canonical", href: `https://mindkid.vn/games/${code.value}` },
      ...buildPublicHreflangLinks(`/games/${code.value}`, "https://mindkid.vn"),
    ],
    script: [
      {
        type: "application/ld+json",
        innerHTML: () =>
          buildLearningResourceJsonLd(game.value, strandInfo.value, code.value),
      },
      {
        type: "application/ld+json",
        innerHTML: () => buildBreadcrumbJsonLd(game.value, code.value),
      },
      {
        type: "application/ld+json",
        innerHTML: () => buildFaqJsonLd(game.value),
      },
    ],
  });
}
