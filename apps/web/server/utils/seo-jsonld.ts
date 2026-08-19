import { FAQ_ITEMS, type FaqItem } from "@mindkid/shared";

const SITE_URL = process.env.SITE_URL || "https://mindkid.vn";
const BRAND_NAME = "MindKid";

/**
 * BR-SEO2-03: Organization & WebSite JSON-LD
 */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/brand-logo.png`,
    description:
      "Thinking Play Platform - Thư viện tư duy qua trò chơi cho trẻ mầm non 3-6 tuổi",
    sameAs: ["https://zalo.me/mindkid"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@mindkid.vn",
      contactType: "customer service",
      availableLanguage: "vi",
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/games?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * BR-GDP-04: LearningResource JSON-LD for Game Level
 */
export interface GameLevelSeoData {
  code: string;
  title: string;
  description?: string;
  age_band?: string;
  competency_name?: string;
  learning_objectives?: string[];
  is_free?: boolean;
}

export function buildLearningResourceJsonLd(game: GameLevelSeoData) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: game.title,
    description:
      game.description ||
      `Trò chơi rèn luyện tư duy ${game.competency_name || ""} cho bé ${game.age_band || "3-6"} tuổi`,
    learningResourceType: "Interactive Game",
    educationalLevel: game.age_band
      ? `Trẻ mầm non ${game.age_band} tuổi`
      : "Mầm non (3-6 tuổi)",
    inLanguage: "vi-VN",
    isAccessibleForFree: Boolean(game.is_free),
    teaches: game.learning_objectives?.length
      ? game.learning_objectives.join(", ")
      : game.competency_name || "Tư duy toán học mầm non",
    url: `${SITE_URL}/games/${game.code}`,
  };
}

/**
 * BreadcrumbList JSON-LD
 */
export function buildBreadcrumbListJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * BR-FAQ-03: FAQPage JSON-LD
 */
export function buildFaqPageJsonLd(items: readonly FaqItem[] = FAQ_ITEMS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * BR-PSH-04: Course JSON-LD for Program / Curriculum
 */
export interface ProgramCourseSeoData {
  code: string;
  title: string;
  description?: string;
  target_age: { min: number; max: number };
  duration_weeks: number;
  access_tier?: string;
}

export function buildCourseJsonLd(program: ProgramCourseSeoData) {
  const isFree = program.access_tier === "free";
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: program.title,
    description:
      program.description ||
      `Chương trình phát triển tư duy ${program.duration_weeks} tuần cho trẻ ${program.target_age.min}–${program.target_age.max} tuổi`,
    courseCode: program.code,
    educationalLevel: `Trẻ mầm non ${program.target_age.min}–${program.target_age.max} tuổi`,
    inLanguage: "vi-VN",
    isAccessibleForFree: isFree,
    provider: {
      "@type": "Organization",
      name: BRAND_NAME,
      url: SITE_URL,
    },
    url: `${SITE_URL}/programs/${program.code}`,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      duration: `P${program.duration_weeks}W`,
    },
  };
}
