// @vitest-environment happy-dom
import {
  ESSENTIAL_COOKIES,
  FAQ_ITEMS,
  type FaqItem,
  LOCAL_STORAGE_ITEMS,
} from "@mindkid/shared/client";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { normalizeFaqItems, toFaqAnchor } from "#server/services/faq-service";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const pageMetaMock = vi.fn();
const useHeadMock = vi.fn();
const useSeoMetaMock = vi.fn();
const apiMock = vi.fn();

const mockRoute = ref<{
  path: string;
  hash: string;
  query: Record<string, string>;
}>({
  path: "/faq",
  hash: "",
  query: {},
});

const mockLoggedIn = ref(false);
const mockFaqFetchData = ref<{ items: FaqItem[] } | null>(null);
const mockCatalogFetchData = ref<{
  items: Array<{
    code: string;
    title: string;
    competency: string | null;
    age_band: string | null;
    difficulty: number | null;
    access_tier: "free" | "login" | "standard" | "premium";
    thumbnail_emoji: string | null;
    locked: boolean;
    cta: { action: string; text: string; href: string };
  }>;
  total: number;
  facets: {
    total: number;
    competency: Record<string, number>;
    age_band: Record<string, number>;
    age: Record<string, number>;
    access_tier: Record<string, number>;
    strand?: Record<string, number>;
  };
  next_cursor: string | null;
} | null>(null);

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useRouter", () => ({
  push: pushMock,
  replace: replaceMock,
}));
vi.stubGlobal("useRoute", () => mockRoute.value);
vi.stubGlobal("useHead", useHeadMock);
vi.stubGlobal("useSeoMeta", useSeoMetaMock);

vi.mock("#imports", () => ({
  definePageMeta: pageMetaMock,
  useHead: useHeadMock,
  useSeoMeta: useSeoMetaMock,
  useRoute: () => mockRoute.value,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  useUserSession: () => ({
    loggedIn: mockLoggedIn,
  }),
  useFetch: (url: string) => {
    const result =
      url === "/api/guest/faq"
        ? {
            data: mockFaqFetchData,
            pending: ref(false),
            error: ref(null),
            refresh: vi.fn(),
          }
        : {
            data: mockCatalogFetchData,
            pending: ref(false),
            error: ref(null),
            refresh: vi.fn(),
          };
    return Object.assign(Promise.resolve(result), result);
  },
}));

vi.mock("~/composables/use-api", () => ({
  useApi: () => apiMock,
}));

const stubs = {
  UIcon: { template: "<i />" },
  PublicNavbar: { template: '<nav data-testid="public-navbar" />' },
  PublicFooter: { template: '<footer data-testid="public-footer" />' },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
};

let wrapper: VueWrapper | null = null;

describe("G17 Public Pages & Components — FAQ, Cookie Banner & Public Game Catalog", () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    pageMetaMock.mockReset();
    useHeadMock.mockReset();
    useSeoMetaMock.mockReset();
    apiMock.mockReset();
    localStorage.clear();
    mockRoute.value = { path: "/faq", hash: "", query: {} };
    mockLoggedIn.value = false;
    mockFaqFetchData.value = null;
    mockCatalogFetchData.value = null;
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  describe("FAQ & Help (BR-FAQ-01..06)", () => {
    it("BR-FAQ-04: normalizeFaqItems chuẩn hoá cả định dạng đầy đủ lẫn { q, a } từ seo_pages", () => {
      const normalized = normalizeFaqItems([
        {
          id: "faq-cms-1",
          anchor: "cau-hoi-cms-1",
          category: "billing",
          question: "Gói học có ưu đãi theo năm không?",
          answer: "Có, gói năm tiết kiệm hơn so với đăng ký lẻ.",
          legalLink: "/refund-policy",
        },
        {
          q: "Bé mấy tuổi bắt đầu chơi được?",
          a: "Bé từ 3 tuổi đã có thể bắt đầu với phân tầng Lớp Mầm.",
        },
      ]);

      expect(normalized).toHaveLength(2);
      expect(normalized[0]).toEqual({
        id: "faq-cms-1",
        anchor: "cau-hoi-cms-1",
        category: "billing",
        question: "Gói học có ưu đãi theo năm không?",
        answer: "Có, gói năm tiết kiệm hơn so với đăng ký lẻ.",
        legalLink: "/refund-policy",
      });
      expect(normalized[1]?.id).toBe("faq-2");
      expect(normalized[1]?.anchor).toBe(
        toFaqAnchor("Bé mấy tuổi bắt đầu chơi được?", 1)
      );
      expect(normalized[1]?.category).toBe("product");
    });

    it("BR-FAQ-04: faq.vue hiển thị nội dung từ seo_pages (page_type='faq') khi đã publish và fallback về FAQ_ITEMS khi chưa seed", async () => {
      const FaqPage = (await import("~/pages/faq.vue")).default;

      // 1. Khi DB chưa có hàng faq (mockFaqFetchData = null) -> fallback về FAQ_ITEMS
      wrapper = mount(FaqPage, { global: { stubs } });
      await flushPromises();

      expect(wrapper.text()).toContain(FAQ_ITEMS[0]?.question ?? "");

      // 2. Khi Manager publish nội dung mới trong seo_pages -> hiển thị ngay không cần deploy
      mockFaqFetchData.value = {
        items: [
          {
            id: "faq-live-1",
            anchor: "cau-hoi-moi-tu-cms",
            category: "product",
            question: "Câu hỏi mới do Manager cập nhật trên CMS?",
            answer: "Có, nội dung này được đọc trực tiếp từ bảng seo_pages.",
          },
        ],
      };
      await flushPromises();

      expect(wrapper.text()).toContain(
        "Câu hỏi mới do Manager cập nhật trên CMS?"
      );
      expect(wrapper.text()).toContain(
        "Có, nội dung này được đọc trực tiếp từ bảng seo_pages."
      );
      expect(wrapper.find("#cau-hoi-moi-tu-cms").exists()).toBe(true);
    });

    it("BR-FAQ-01: mỗi câu hỏi có URL neo riêng và mở trực tiếp câu hỏi khi truy cập bằng URL có hash", async () => {
      mockRoute.value = {
        path: "/faq",
        hash: "#chinh-sach-hoan-tien",
        query: {},
      };
      const FaqPage = (await import("~/pages/faq.vue")).default;
      wrapper = mount(FaqPage, { global: { stubs } });
      await flushPromises();

      const targetEl = wrapper.find("#chinh-sach-hoan-tien");
      expect(targetEl.exists()).toBe(true);
      const triggerBtn = targetEl.find("button.accordion-trigger");
      expect(triggerBtn.attributes("aria-expanded")).toBe("true");
    });

    it("BR-FAQ-02, BR-FAQ-03, BR-FAQ-05, BR-FAQ-06: link tới trang chính sách, sinh FAQPage JSON-LD và trả lời thẳng câu hỏi khó", async () => {
      const FaqPage = (await import("~/pages/faq.vue")).default;
      wrapper = mount(FaqPage, { global: { stubs } });
      await flushPromises();

      // BR-FAQ-02: Có link tới trang chính sách pháp lý thay vì copy nguyên văn
      const legalLinks = wrapper
        .findAll("a.ref-link")
        .map((a) => a.attributes("href"));
      expect(legalLinks).toContain("/refund-policy");
      expect(legalLinks).toContain("/child-privacy");

      // BR-FAQ-03: Sinh FAQPage JSON-LD
      expect(useHeadMock).toHaveBeenCalled();
      const headArg = useHeadMock.mock.calls[0]?.[0];
      const headObj = typeof headArg === "function" ? headArg() : headArg;
      const scriptText = headObj?.script?.[0]?.innerHTML ?? "";
      const parsedLd = JSON.parse(scriptText) as {
        "@type": string;
        mainEntity: Array<{ name: string }>;
      };
      expect(parsedLd["@type"]).toBe("FAQPage");
      expect(parsedLd.mainEntity.length).toBe(FAQ_ITEMS.length);

      // BR-FAQ-05 & BR-FAQ-06: Trả lời thẳng giới hạn sản phẩm
      expect(wrapper.text()).toContain(
        "không cam kết biến trẻ thành thần đồng hay tăng chỉ số IQ"
      );
    });
  });

  describe("Cookie & Consent Banner (BR-CKB-01..07)", () => {
    it("BR-CKB-01, BR-CKB-04, BR-CKB-05: trang /cookie liệt kê đầy đủ 6 nhóm cookie thiết yếu và bộ nhớ cục bộ", async () => {
      mockRoute.value = { path: "/cookie", hash: "", query: {} };
      const CookiePage = (await import("~/pages/cookie.vue")).default;
      wrapper = mount(CookiePage, { global: { stubs } });
      await flushPromises();

      for (const c of ESSENTIAL_COOKIES) {
        expect(wrapper.text()).toContain(c.name);
        expect(wrapper.text()).toContain(c.purpose);
        expect(wrapper.text()).toContain(c.maxAge);
      }
      for (const item of LOCAL_STORAGE_ITEMS) {
        expect(wrapper.text()).toContain(item.key);
        expect(wrapper.text()).toContain(item.purpose);
      }
      expect(wrapper.text()).toContain("Cam kết không cookie bên thứ ba");
    });

    it("BR-CKB-02, BR-CKB-03, BR-CKB-07: banner không chặn nội dung, ghi nhớ 12 tháng sau khi đóng, và KHÔNG bao giờ hiện trên /play/**", async () => {
      const Banner = (await import("~/components/cookie-notice-banner.vue"))
        .default;

      // 1. Mở trang public lần đầu -> hiện banner mỏng ở đáy trang
      mockRoute.value = { path: "/", hash: "", query: {} };
      wrapper = mount(Banner, { global: { stubs } });
      await flushPromises();

      expect(wrapper.find("aside.cookie-banner").exists()).toBe(true);

      // 2. Bấm "Đã hiểu" -> lưu localStorage và ẩn banner 12 tháng (BR-CKB-07)
      await wrapper.find("button.cookie-btn").trigger("click");
      await flushPromises();

      expect(wrapper.find("aside.cookie-banner").exists()).toBe(false);
      const ackRaw = localStorage.getItem("cookie_notice_ack");
      expect(ackRaw).toBeTruthy();

      // 3. Trên bề mặt trẻ /play/** -> NEVER hiện banner kể cả khi chưa đóng (BR-CKB-03)
      localStorage.removeItem("cookie_notice_ack");
      mockRoute.value = {
        path: "/play/GL-C1-CNT-CARD-0001",
        hash: "",
        query: {},
      };
      wrapper.unmount();
      wrapper = mount(Banner, { global: { stubs } });
      await flushPromises();

      expect(wrapper.find("aside.cookie-banner").exists()).toBe(false);
    });
  });

  describe("Public Game Catalog (BR-GCP-01..09)", () => {
    it("BR-GCP-01, BR-GCP-03, BR-GCP-04, BR-GCP-05, BR-GCP-07, BR-GCP-09: hiển thị metadata cả game khoá, đồng bộ bộ lọc vào URL và dựng lại CTA sau hydrate đúng 1 lần gọi access-context", async () => {
      mockRoute.value = { path: "/games", hash: "", query: {} };
      mockLoggedIn.value = true;
      mockCatalogFetchData.value = {
        items: [
          {
            code: "GL-C1-CNT-CARD-0001",
            title: "Đếm số táo đỏ",
            competency: "C1",
            age_band: "3-4",
            difficulty: 1,
            access_tier: "free",
            thumbnail_emoji: "🍎",
            locked: false,
            cta: {
              action: "play",
              text: "Chơi thử ngay",
              href: "/play/GL-C1-CNT-CARD-0001",
            },
          },
          {
            code: "GL-C2-SHP-CARD-0002",
            title: "Ghép hình không gian",
            competency: "C2",
            age_band: "4-5",
            difficulty: 3,
            access_tier: "standard",
            thumbnail_emoji: "🔷",
            locked: true,
            cta: {
              action: "upgrade_standard",
              text: "Mở khoá với Gói Tiêu chuẩn",
              href: "/pricing",
            },
          },
        ],
        total: 2,
        facets: {
          total: 2,
          competency: { C1: 1, C2: 1 },
          age_band: { "3-4": 1, "4-5": 1, "5-6": 0 },
          age: {},
          access_tier: { free: 1, standard: 1 },
        },
        next_cursor: null,
      };

      apiMock.mockImplementation((url: string) => {
        if (url === "/api/users/access-context") {
          return Promise.resolve({
            has_active_child: true,
            active_keys: ["play_standard_games"],
            allowed_tiers: ["free", "login", "standard"],
          });
        }
        return Promise.resolve({ completed_level_codes: [] });
      });

      const GamesPage = (await import("~/pages/games/index.vue")).default;
      const Host = defineComponent({
        components: { GamesPage },
        template: "<Suspense><GamesPage /></Suspense>",
      });
      wrapper = mount(Host, { global: { stubs } });
      await flushPromises();
      await flushPromises();

      // BR-GCP-01 & BR-GCP-07: Hiển thị cả 2 thẻ kèm link chi tiết /games/{code}
      expect(wrapper.text()).toContain("Đếm số táo đỏ");
      expect(wrapper.text()).toContain("Ghép hình không gian");
      const detailLinks = wrapper
        .findAll("a.card-title-link")
        .map((a) => a.attributes("href"));
      expect(detailLinks).toContain("/games/GL-C1-CNT-CARD-0001");
      expect(detailLinks).toContain("/games/GL-C2-SHP-CARD-0002");

      // BR-GCP-09: Chỉ gọi /api/users/access-context đúng 1 lần cho cả trang và mở khoá CTA standard
      const accessContextCalls = apiMock.mock.calls.filter(
        (call) => call[0] === "/api/users/access-context"
      );
      expect(accessContextCalls).toHaveLength(1);

      const actionHrefs = wrapper
        .findAll("a.btn-card-action")
        .map((a) => a.attributes("href"));
      expect(actionHrefs).toContain("/play/GL-C2-SHP-CARD-0002");

      // BR-GCP-03: Chọn bộ lọc độ tuổi phản ánh vào URL
      const ageButtons = wrapper.findAll("button.filter-pill-btn");
      const mamButton = ageButtons.find((b) => b.text().includes("3–4 tuổi"));
      expect(mamButton).toBeDefined();
      await mamButton?.trigger("click");
      expect(pushMock).toHaveBeenCalledWith({
        path: "/games",
        query: expect.objectContaining({ age_band: "3-4" }),
      });
    });
  });
});
