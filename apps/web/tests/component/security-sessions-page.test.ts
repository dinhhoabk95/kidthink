// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageMetaMock = vi.fn();
const useHeadMock = vi.fn();
const fetchMock = vi.fn();
const routerPushMock = vi.fn();

vi.mock("#imports", () => ({
  useRoute: () => ({ path: "/me/settings/security" }),
  useSeoMeta: vi.fn(),
}));

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useHead", useHeadMock);
vi.stubGlobal("useSeoMeta", vi.fn());
vi.stubGlobal("$fetch", fetchMock);
vi.stubGlobal("useRoute", () => ({ path: "/me/settings/security" }));
vi.stubGlobal("useRouter", () => ({
  push: routerPushMock,
}));

const stubs = {
  UIcon: { template: "<i />" },
  UButton: { template: '<button type="button"><slot /></button>' },
  UBadge: { template: "<span><slot /></span>" },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
  PwaInstallBanner: {
    template: '<div data-testid="pwa-banner-stub" />',
  },
};

let wrapper: VueWrapper | null = null;

async function mountSecurityPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/me/settings/security.vue")).default;
  wrapper = mount(Page, {
    global: {
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

async function mountAccountLayout(): Promise<VueWrapper> {
  const Layout = (await import("~/layouts/account.vue")).default;
  wrapper = mount(Layout, {
    global: {
      stubs,
    },
    slots: {
      default: '<div data-testid="account-slot-content">Main Content</div>',
    },
  });
  await flushPromises();
  return wrapper;
}

describe("Quản lý phiên đăng nhập & Đăng xuất (/me/settings/security & layouts/account.vue, BR-LGN-04, BR-LGN-05, BR-LGN-10, #290 S5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/mfa/status") {
        return Promise.resolve({
          enabled: false,
          confirmed_at: null,
          recovery_codes_remaining: 0,
        });
      }
      if (url === "/api/users/auth/sessions") {
        return Promise.resolve({
          sessions: [
            {
              id: "sess-current",
              deviceLabel:
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/125.0.0.0 Safari/537.36",
              ipAddress: "113.161.72.99",
              authMethod: "password",
              createdAt: "2026-10-18T10:00:00.000Z",
              lastUsedAt: "2026-10-18T11:00:00.000Z",
              isCurrent: true,
            },
            {
              id: "sess-other",
              deviceLabel:
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605.1.15",
              ipAddress: "2001:ee0:4f89:1234::1",
              authMethod: "google",
              createdAt: "2026-10-17T08:00:00.000Z",
              lastUsedAt: "2026-10-17T09:30:00.000Z",
              isCurrent: false,
            },
          ],
        });
      }
      if (url.startsWith("/api/users/notifications")) {
        return Promise.resolve({ items: [], unread_count: 2 });
      }
      return Promise.resolve({ ok: true });
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("hiển thị danh sách phiên hoạt động với thiết bị thô, vị trí/IP đã che và phương thức đăng nhập (BR-LGN-05, BR-LGN-10)", async () => {
    const page = await mountSecurityPage();

    const rows = page.findAll('[data-testid="session-row"]');
    expect(rows).toHaveLength(2);

    const firstRow = rows[0];
    expect(firstRow?.find('[data-testid="session-device-label"]').text()).toBe(
      "Chrome trên macOS"
    );
    expect(
      firstRow?.find('[data-testid="current-session-badge"]').exists()
    ).toBe(true);
    expect(firstRow?.find('[data-testid="session-auth-method"]').text()).toBe(
      "Mật khẩu"
    );
    const firstLoc = firstRow?.find('[data-testid="session-location"]').text();
    expect(firstLoc).toContain("113.161.x.x");
    expect(firstLoc).not.toContain("113.161.72.99");
    expect(
      firstRow?.find('[data-testid="revoke-session-btn-sess-current"]').exists()
    ).toBe(false);

    const secondRow = rows[1];
    expect(secondRow?.find('[data-testid="session-device-label"]').text()).toBe(
      "Safari trên iOS"
    );
    expect(secondRow?.find('[data-testid="session-auth-method"]').text()).toBe(
      "Google"
    );
    const secondLoc = secondRow
      ?.find('[data-testid="session-location"]')
      .text();
    expect(secondLoc).toContain("Mạng IPv6");
    expect(secondLoc).not.toContain("2001:ee0");
  });

  it("thu hồi phiên đăng nhập đơn lẻ qua DELETE /api/users/auth/sessions/:id", async () => {
    const page = await mountSecurityPage();

    const revokeBtn = page.find(
      '[data-testid="revoke-session-btn-sess-other"]'
    );
    expect(revokeBtn.exists()).toBe(true);

    await revokeBtn.trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/auth/sessions/sess-other",
      expect.objectContaining({
        method: "DELETE",
      })
    );
    expect(page.findAll('[data-testid="session-row"]')).toHaveLength(1);
  });

  it("đăng xuất mọi thiết bị yêu cầu reauth mật khẩu trước khi gọi POST /api/users/auth/logout-all (BR-LGN-04)", async () => {
    const page = await mountSecurityPage();

    await page
      .find('[data-testid="open-logout-all-modal-btn"]')
      .trigger("click");
    await flushPromises();

    expect(page.find('[data-testid="logout-all-reauth-modal"]').exists()).toBe(
      true
    );

    await page
      .find('[data-testid="logout-all-password-input"]')
      .setValue("MyCurrentPass123!");
    await page
      .find('[data-testid="logout-all-reauth-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/auth/reauth",
      expect.objectContaining({
        method: "POST",
        body: { password: "MyCurrentPass123!" },
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/auth/logout-all",
      expect.objectContaining({
        method: "POST",
        body: {},
      })
    );
    expect(routerPushMock).toHaveBeenCalledWith("/login");
  });

  it("layout account hiển thị NotificationBell và nút Đăng xuất gọi POST /api/users/auth/logout (BR-LGN-04)", async () => {
    const layout = await mountAccountLayout();

    expect(layout.find('[data-testid="notification-bell-link"]').exists()).toBe(
      true
    );

    const logoutBtn = layout.find('[data-testid="account-logout-btn"]');
    expect(logoutBtn.exists()).toBe(true);

    await logoutBtn.trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/auth/logout",
      expect.objectContaining({
        method: "POST",
        body: {},
      })
    );
    expect(routerPushMock).toHaveBeenCalledWith("/login");
  });
});
