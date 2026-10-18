import {
  buildPublicHreflangLinks,
  type HreflangLinkTag,
  isNoIndexRoute,
  NOINDEX_ROBOTS_DIRECTIVE,
} from "@mindkid/shared/client";
import { useHead, useRoute, useRuntimeConfig, useSeoMeta } from "#imports";

export function resolvePublicSiteUrl(
  configuredSiteUrl?: string | null
): string {
  if (
    typeof configuredSiteUrl === "string" &&
    configuredSiteUrl.trim().length > 0
  ) {
    return configuredSiteUrl.trim();
  }
  return "https://mindkid.vn";
}

export function usePublicSeoHead(): {
  readonly hreflangLinks: () => readonly HreflangLinkTag[];
  readonly robots: () => typeof NOINDEX_ROBOTS_DIRECTIVE | undefined;
} {
  const route = useRoute();
  const runtimeConfig = useRuntimeConfig();
  const rawSiteUrl = runtimeConfig.public?.siteUrl;
  const siteUrl = resolvePublicSiteUrl(
    typeof rawSiteUrl === "string" ? rawSiteUrl : undefined
  );

  const robots = (): typeof NOINDEX_ROBOTS_DIRECTIVE | undefined =>
    isNoIndexRoute(route.path) ? NOINDEX_ROBOTS_DIRECTIVE : undefined;

  const hreflangLinks = (): readonly HreflangLinkTag[] =>
    buildPublicHreflangLinks(route.path, siteUrl);

  useSeoMeta({
    robots,
  });

  useHead(() => ({
    link: [...hreflangLinks()],
  }));

  return { hreflangLinks, robots };
}
