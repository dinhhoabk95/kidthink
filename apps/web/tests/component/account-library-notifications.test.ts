// @vitest-environment happy-dom
import { ApiError } from "@mindkid/errors/client";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const mockRoute = ref<{
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
}>({
  path: "/me",
  params: { code: "CUR-C1-34-01", uuid: "CUR-C1-34-01" },
  query: {},
});

const navigateToMock = vi.fn();
const useHeadMock = vi.fn();
const definePageMetaMock = vi.fn();
const apiMock = vi.fn();

const mockProgramData = ref({
  code: "CUR-C1-34-01",
  title: "Lộ trình tư duy toán 3-4 tuổi",
  description: "Chương trình toán học tương tác cho bé",
  target_age: { min: 3, max: 4 },
  access_tier: "standard",
  duration_weeks: 4,
  sessions_per_week: 3,
  weeks: [
    {
      week_no: 1,
      goal: "Làm quen đếm 1-5",
      session_count: 3,
      item_count: 6,
      items: [],
    },
  ],
  competency_distribution: [{ code: "C1", label: "Số & Phép tính", share: 1 }],
});

function useFetchStub() {
  return Promise.resolve({
    data: mockProgramData,
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  });
}

vi.mock("#imports", () => ({
  useRoute: () => mockRoute.value,
  navigateTo: (...args: string[]) => navigateToMock(...args),
  useHead: (...args: object[]) => useHeadMock(...args),
  definePageMeta: (...args: object[]) => definePageMetaMock(...args),
  useFetch: () => useFetchStub(),
}));

vi.mock("~/composables/use-api", () => ({
  useApi: () => apiMock,
}));

vi.stubGlobal("useRoute", () => mockRoute.value);
vi.stubGlobal("navigateTo", (...args: string[]) => navigateToMock(...args));
vi.stubGlobal("useHead", (...args: object[]) => useHeadMock(...args));
vi.stubGlobal("definePageMeta", (...args: object[]) =>
  definePageMetaMock(...args)
);
vi.stubGlobal("useFetch", () => useFetchStub());

const stubs = {
  UIcon: {
    props: ["name"],
    template: '<i :data-icon="name" />',
  },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
  PublicNavbar: { template: "<header />" },
  PublicFooter: { template: "<footer />" },
};

let wrapper: VueWrapper | null = null;

describe("G23 Account UI — Library Save CTA, Notification Inbox & Offline Pack Revocation (BR-MLB, BR-NIB, BR-OCP-05)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.value = {
      path: "/me",
      params: { code: "CUR-C1-34-01", uuid: "CUR-C1-34-01" },
      query: {},
    };
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  describe("My Library Save Button on Catalog & Program Detail (BR-MLB-01)", () => {
    it("BR-MLB-01: CatalogGameCard gọi POST /api/users/library/items qua useApi và đổi sang trạng thái Đã lưu", async () => {
      apiMock.mockResolvedValueOnce({ success: true });
      const CatalogGameCard = (
        await import("~/components/catalog-game-card.vue")
      ).default;

      wrapper = mount(CatalogGameCard, {
        props: {
          game: {
            code: "GL-C1-CNT-0001",
            entity_id: 101,
            title: "Đếm số táo đỏ",
            competency: "C1",
            age_band: "3-4",
            difficulty: 1,
            access_tier: "free",
            thumbnail_emoji: "🍎",
            locked: false,
            cta: {
              action: "play",
              text: "Chơi thử miễn phí",
              href: "/play/GL-C1-CNT-0001",
            },
          },
        },
        global: { stubs },
      });

      const saveBtn = wrapper.find('[data-testid="save-library-btn"]');
      expect(saveBtn.exists()).toBe(true);
      expect(saveBtn.text()).toContain("Lưu");

      await saveBtn.trigger("click");
      await flushPromises();

      expect(apiMock).toHaveBeenCalledWith("/api/users/library/items", {
        method: "POST",
        body: {
          entity_type: "game_level",
          entity_id: 101,
          code: "GL-C1-CNT-0001",
        },
      });
      expect(saveBtn.text()).toContain("Đã lưu");
    });

    it("BR-MLB-01 (ca âm): CatalogGameCard và programs/[code].vue hiển thị thông báo lỗi khi vượt hạn mức 402 QUOTA_EXCEEDED", async () => {
      apiMock.mockRejectedValueOnce(
        new ApiError({
          code: "QUOTA_EXCEEDED",
          statusCode: 402,
          message: "Vượt hạn mức thư viện",
        })
      );

      const CatalogGameCard = (
        await import("~/components/catalog-game-card.vue")
      ).default;
      wrapper = mount(CatalogGameCard, {
        props: {
          game: {
            code: "GL-C1-CNT-0002",
            title: "Ghép đôi hình khối",
            competency: "C2",
            age_band: "4-5",
            difficulty: 2,
            access_tier: "standard",
            thumbnail_emoji: "🔷",
            locked: true,
            cta: {
              action: "upgrade",
              text: "Nâng cấp gói",
              href: "/pricing",
            },
          },
        },
        global: { stubs },
      });

      await wrapper.find('[data-testid="save-library-btn"]').trigger("click");
      await flushPromises();

      const cardErr = wrapper.find('[data-testid="save-library-error"]');
      expect(cardErr.exists()).toBe(true);
      expect(cardErr.text()).toContain("Đã đạt giới hạn lưu trữ");

      wrapper.unmount();

      apiMock.mockRejectedValueOnce(
        new ApiError({
          code: "QUOTA_EXCEEDED",
          statusCode: 402,
          message: "Vượt hạn mức thư viện",
        })
      );
      const ProgramDetailPage = (await import("~/pages/programs/[code].vue"))
        .default;
      const Host = {
        components: { ProgramDetailPage },
        template: "<Suspense><ProgramDetailPage /></Suspense>",
      };
      wrapper = mount(Host, { global: { stubs } });
      await flushPromises();

      const progSaveBtn = wrapper.find(
        '[data-testid="save-program-library-btn"]'
      );
      expect(progSaveBtn.exists()).toBe(true);
      await progSaveBtn.trigger("click");
      await flushPromises();

      expect(apiMock).toHaveBeenCalledWith("/api/users/library/items", {
        method: "POST",
        body: {
          entity_type: "curriculum",
          code: "CUR-C1-34-01",
        },
      });
      const progErr = wrapper.find(
        '[data-testid="save-program-library-error"]'
      );
      expect(progErr.exists()).toBe(true);
      expect(progErr.text()).toContain("Đã đạt giới hạn lưu trữ");
    });
  });

  describe("Notification Bell & Inbox (BR-NIB-01..05)", () => {
    it("BR-NIB-01 & BR-NIB-05 (ca âm): NotificationBell hiển thị số chưa đọc trên /me nhưng ẩn hoàn toàn và không gọi API trên /play", async () => {
      apiMock.mockResolvedValueOnce({ unread_count: 5 });
      const NotificationBell = (
        await import("~/components/notification-bell.vue")
      ).default;

      mockRoute.value = { path: "/me", params: {}, query: {} };
      wrapper = mount(NotificationBell, { global: { stubs } });
      await flushPromises();

      expect(apiMock).toHaveBeenCalledWith("/api/users/notifications?limit=1");
      expect(
        wrapper.find('[data-testid="notification-bell-badge"]').text()
      ).toBe("5");

      wrapper.unmount();
      apiMock.mockClear();

      mockRoute.value = {
        path: "/play/GL-C1-CNT-0001",
        params: {},
        query: {},
      };
      wrapper = mount(NotificationBell, { global: { stubs } });
      await flushPromises();

      expect(apiMock).not.toHaveBeenCalled();
      expect(
        wrapper.find('[data-testid="notification-bell-link"]').exists()
      ).toBe(false);
    });

    it("BR-NIB-02, BR-NIB-03, BR-NIB-04 (ca âm): me/notifications.vue đánh dấu đã đọc bất biến và chặn open redirect //evil.com", async () => {
      apiMock.mockImplementation((url: string) => {
        if (url.startsWith("/api/users/notifications?limit=20")) {
          return Promise.resolve({
            items: [
              {
                uuid: "notif-1",
                code: "WEEKLY_REPORT",
                title: "Báo cáo tuần mới",
                body: "Bé đã hoàn thành 5 bài học",
                action_url: "//evil.example.com/phishing",
                occurred_at: "2026-08-15T10:00:00.000Z",
                read_at: null,
              },
            ],
            next_cursor: null,
            unread_count: 1,
            snapshot_at: "2026-08-15T10:05:00.000Z",
          });
        }
        return Promise.resolve({ ok: true });
      });

      const NotificationsPage = (await import("~/pages/me/notifications.vue"))
        .default;
      wrapper = mount(NotificationsPage, { global: { stubs } });
      await flushPromises();

      expect(wrapper.text()).toContain("Báo cáo tuần mới");

      const itemBtn = wrapper
        .findAll("button")
        .find((b) => b.text().includes("Báo cáo tuần mới"));
      expect(itemBtn).toBeDefined();
      await itemBtn?.trigger("click");
      await flushPromises();

      expect(apiMock).toHaveBeenCalledWith(
        "/api/users/notifications/notif-1/read",
        { method: "PATCH" }
      );
      expect(navigateToMock).toHaveBeenCalledWith("/me");
    });
  });

  describe("Offline Pack Revocation Cleanup on Page (BR-OCP-05)", () => {
    it("BR-OCP-05 (ca âm): me/curricula/[uuid]/offline.vue xoá sạch các tuần đã tải và báo thu hồi quyền khi API trả 403 ENTITLEMENT_REQUIRED", async () => {
      apiMock
        .mockResolvedValueOnce({
          pack_id: "CUR-C1-34-01-w1",
          total_size_bytes: 25 * 1024 * 1024,
          lease_expires_at: "2026-08-23T00:00:00.000Z",
        })
        .mockRejectedValueOnce(
          new ApiError({
            code: "ENTITLEMENT_REQUIRED",
            statusCode: 403,
            message: "Gói học đã hết hạn",
          })
        );

      const OfflinePage = (
        await import("~/pages/me/curricula/[uuid]/offline.vue")
      ).default;
      wrapper = mount(OfflinePage, { global: { stubs } });
      await flushPromises();

      const downloadBtns = wrapper
        .findAll("button")
        .filter((b) => b.text().includes("Tải về máy"));
      expect(downloadBtns.length).toBeGreaterThanOrEqual(2);

      await downloadBtns[0]?.trigger("click");
      await flushPromises();
      expect(wrapper.text()).toContain("Đã tải ngoại tuyến");

      await downloadBtns[1]?.trigger("click");
      await flushPromises();

      expect(wrapper.text()).not.toContain("Đã tải ngoại tuyến");
      expect(wrapper.text()).toContain(
        "Quyền truy cập gói học đã thay đổi hoặc hết hạn. Dữ liệu ngoại tuyến đã được dọn sạch."
      );
    });
  });
});
