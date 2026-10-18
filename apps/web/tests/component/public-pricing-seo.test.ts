// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildPublicHreflangLinks,
  NOINDEX_ROBOTS_DIRECTIVE,
} from "@mindkid/shared/client";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

interface HeadInput {
  title?: string;
  meta?: readonly Record<string, string>[];
  link?: readonly Record<string, string>[];
  script?: readonly { type?: string; innerHTML?: string }[];
}

const useSeoMetaCalls: Record<
  string,
  string | (() => string | undefined) | undefined
>[] = [];
const useHeadCalls: (HeadInput | (() => HeadInput))[] = [];
const mockRoutePath = ref("/pricing");
const mockRouteParams = ref<Record<string, string>>({});

vi.mock("#imports", () => ({
  useSeoMeta: (
    meta: Record<string, string | (() => string | undefined) | undefined>
  ) => {
    useSeoMetaCalls.push(meta);
  },
  useHead: (head: HeadInput | (() => HeadInput)) => {
    useHeadCalls.push(head);
  },
  useRoute: () => ({
    get path() {
      return mockRoutePath.value;
    },
    get params() {
      return mockRouteParams.value;
    },
  }),
  useRuntimeConfig: () => ({
    public: {
      apiBaseUrl: "",
      siteUrl: "https://mindkid.vn",
    },
  }),
  definePageMeta: vi.fn(),
}));

const stubs = {
  UIcon: { template: "<i />" },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
  PublicNavbar: { template: "<header />" },
  PublicFooter: { template: "<footer />" },
};

describe("G19 — Pricing Page, Program Showcase & SEO Invariants (BR-PRC, BR-RBL-01, BR-SEO2-01, BR-SEO2-09)", () => {
  beforeEach(() => {
    useSeoMetaCalls.length = 0;
    useHeadCalls.length = 0;
    mockRoutePath.value = "/pricing";
    mockRouteParams.value = {};
  });

  describe("Pricing Page (BR-PRC-01..08, BR-RBL-01, BR-RBL-03, Task #292 S5)", () => {
    it("BR-RBL-01 & BR-RBL-03: renders explicit opt-in auto-renewal notice and removes deprecated BR-PRC-07 non-renewal text", async () => {
      const PricingPage = (await import("~/pages/pricing.vue")).default;
      const wrapper = mount(PricingPage, { global: { stubs } });
      await flushPromises();

      const text = wrapper.text();
      expect(text).not.toContain("không tự động gia hạn");
      expect(text).toContain("chỉ tự động gia hạn khi bạn chủ động bật");
      expect(text).toContain("bạn huỷ được bất cứ lúc nào");

      // BR-PRC-03: manual bank transfer 12 working hours notice
      expect(text).toContain("Thanh toán bằng chuyển khoản ngân hàng");
      expect(text).toContain("12 giờ làm việc");

      // BR-PRC-04: child data retention notice
      expect(text).toContain(
        "Khi hết hạn, hồ sơ và tiến độ học của bé vẫn được giữ nguyên."
      );

      // BR-PRC-02 & BR-PRC-06: 3 package columns (Free, Standard, Premium)
      expect(text).toContain("Miễn phí");
      expect(text).toContain("Tiêu chuẩn");
      expect(text).toContain("Premium");

      const seoDesc = String(useSeoMetaCalls[0]?.description ?? "");
      expect(seoDesc.toLowerCase()).not.toContain("không tự động gia hạn");

      // BR-PRC-08 & BR-SEO2-09: Product + Offer JSON-LD and hreflang links
      const headArg = useHeadCalls[0];
      const resolvedHead = typeof headArg === "function" ? headArg() : headArg;
      expect(resolvedHead?.link).toEqual(
        expect.arrayContaining([
          {
            rel: "alternate",
            hreflang: "vi-VN",
            href: "https://mindkid.vn/pricing",
          },
          {
            rel: "alternate",
            hreflang: "x-default",
            href: "https://mindkid.vn/pricing",
          },
        ])
      );
      const jsonLdRaw = resolvedHead?.script?.[0]?.innerHTML ?? "{}";
      const parsedJsonLd = JSON.parse(jsonLdRaw) as {
        "@type": string;
        offers: { "@type": string }[];
      };
      expect(parsedJsonLd["@type"]).toBe("Product");
      expect(parsedJsonLd.offers).toHaveLength(2);

      wrapper.unmount();
    });
  });

  describe("SEO noindex & hreflang (BR-SEO2-01, BR-SEO2-09, Task #291 S4)", () => {
    it("BR-SEO2-01: account.vue and kid.vue layouts enforce useSeoMeta({ robots: 'noindex, nofollow' })", async () => {
      const AccountLayout = (await import("~/layouts/account.vue")).default;
      const accountWrapper = mount(AccountLayout, {
        global: { stubs },
        slots: { default: "<div>Account content</div>" },
      });
      expect(useSeoMetaCalls).toContainEqual({
        robots: NOINDEX_ROBOTS_DIRECTIVE,
      });
      accountWrapper.unmount();

      useSeoMetaCalls.length = 0;
      const KidLayout = (await import("~/layouts/kid.vue")).default;
      const kidWrapper = mount(KidLayout, {
        global: { stubs },
        slots: { default: "<div>Kid content</div>" },
      });
      expect(useSeoMetaCalls).toContainEqual({
        robots: NOINDEX_ROBOTS_DIRECTIVE,
      });
      kidWrapper.unmount();
    });

    it("BR-SEO2-01: nuxt.config.ts routeRules sets X-Robots-Tag: noindex, nofollow for /me/** and /play/**", () => {
      const nuxtConfigPath = resolve(
        import.meta.dirname,
        "../../nuxt.config.ts"
      );
      const nuxtConfigContent = readFileSync(nuxtConfigPath, "utf-8");

      expect(nuxtConfigContent).toContain('"/me/**"');
      expect(nuxtConfigContent).toContain('"/play/**"');
      expect(nuxtConfigContent).toContain(
        '"X-Robots-Tag": "noindex, nofollow"'
      );
    });

    it("BR-SEO2-09 & BR-SEO2-01: public layout emits hreflang vi-VN and x-default on public routes and noindex on /me or /play", async () => {
      mockRoutePath.value = "/programs";
      const PublicLayout = (await import("~/layouts/public.vue")).default;
      const wrapper = mount(PublicLayout, {
        global: { stubs },
        slots: { default: "<div>Public page</div>" },
      });

      const robotsFn = useSeoMetaCalls[0]?.robots;
      const resolvedRobots =
        typeof robotsFn === "function" ? robotsFn() : robotsFn;
      expect(resolvedRobots).toBeUndefined();

      const headArg = useHeadCalls[0];
      const resolvedHead = typeof headArg === "function" ? headArg() : headArg;
      expect(resolvedHead?.link).toEqual([
        {
          rel: "alternate",
          hreflang: "vi-VN",
          href: "https://mindkid.vn/programs",
        },
        {
          rel: "alternate",
          hreflang: "x-default",
          href: "https://mindkid.vn/programs",
        },
      ]);

      // Switch route to /me/settings -> robots becomes noindex, nofollow and hreflang becomes empty
      mockRoutePath.value = "/me/settings";
      const meRobots = typeof robotsFn === "function" ? robotsFn() : robotsFn;
      expect(meRobots).toBe("noindex, nofollow");

      const meHead = typeof headArg === "function" ? headArg() : headArg;
      expect(meHead?.link).toEqual([]);

      wrapper.unmount();
    });

    it("BR-SEO2-09: buildPublicHreflangLinks normalizes root, subpaths, query params, and trailing slashes", () => {
      expect(buildPublicHreflangLinks("/", "https://mindkid.vn/")).toEqual([
        {
          rel: "alternate",
          hreflang: "vi-VN",
          href: "https://mindkid.vn/",
        },
        {
          rel: "alternate",
          hreflang: "x-default",
          href: "https://mindkid.vn/",
        },
      ]);

      expect(
        buildPublicHreflangLinks(
          "/games?competency=C1#top",
          "https://mindkid.vn"
        )
      ).toEqual([
        {
          rel: "alternate",
          hreflang: "vi-VN",
          href: "https://mindkid.vn/games",
        },
        {
          rel: "alternate",
          hreflang: "x-default",
          href: "https://mindkid.vn/games",
        },
      ]);
    });
  });
});
