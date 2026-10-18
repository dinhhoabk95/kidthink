// @vitest-environment happy-dom
import { ApiError } from "@mindkid/errors/client";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageMetaMock = vi.fn();
const fetchMock = vi.fn();

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("$fetch", fetchMock);

const stubs = {
  UIcon: { template: "<i />" },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
};

let wrapper: VueWrapper | null = null;

async function mountSettingsPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/me/settings/index.vue")).default;
  wrapper = mount(Page, {
    global: {
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

describe("Trang cài đặt tài khoản /me/settings (BR-ACS-01..05, 09, 10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/guest/auth/oauth/providers") {
        return Promise.resolve({
          providers: [
            { provider: "google", label: "Google", is_enabled: true },
          ],
        });
      }
      if (url === "/api/users/social-identities") {
        return Promise.resolve({ items: [] });
      }
      return Promise.resolve({ ok: true });
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("mở modal đổi mật khẩu, gọi reauth + POST /api/users/password thành công (BR-ACS-01, BR-ACS-02)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/auth/reauth") {
        return Promise.resolve({
          ok: true,
          reauthenticated_at: new Date().toISOString(),
        });
      }
      if (url === "/api/users/password") {
        return Promise.resolve({
          ok: true,
          message: "Đã đổi mật khẩu thành công.",
        });
      }
      return Promise.resolve({});
    });

    const page = await mountSettingsPage();
    const openBtn = page.find('[data-testid="open-password-modal-btn"]');
    expect(openBtn.exists()).toBe(true);

    await openBtn.trigger("click");
    await flushPromises();

    expect(page.find('[data-testid="password-modal"]').exists()).toBe(true);

    await page
      .find('[data-testid="password-current-input"]')
      .setValue("OldPass123!");
    await page
      .find('[data-testid="password-new-input"]')
      .setValue("NewPass456!");
    await page
      .find('[data-testid="password-confirm-input"]')
      .setValue("NewPass456!");

    await page.find('[data-testid="password-form"]').trigger("submit.prevent");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/auth/reauth",
      expect.objectContaining({
        method: "POST",
        body: { password: "OldPass123!" },
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/password",
      expect.objectContaining({
        method: "POST",
        body: { new_password: "NewPass456!" },
      })
    );
    expect(page.find('[data-testid="password-modal"]').exists()).toBe(false);
    expect(
      page.find('[data-testid="settings-status-banner"]').text()
    ).toContain("Đã đổi mật khẩu thành công.");
  });

  it("hiển thị lỗi khi mật khẩu xác nhận không khớp hoặc lỗi field từ API", async () => {
    const page = await mountSettingsPage();
    await page.find('[data-testid="open-password-modal-btn"]').trigger("click");

    await page
      .find('[data-testid="password-current-input"]')
      .setValue("OldPass123!");
    await page
      .find('[data-testid="password-new-input"]')
      .setValue("NewPass456!");
    await page
      .find('[data-testid="password-confirm-input"]')
      .setValue("Mismatch789!");

    await page.find('[data-testid="password-form"]').trigger("submit.prevent");
    await flushPromises();

    expect(
      page.find('[data-testid="password-field-error-confirm"]').text()
    ).toContain("Mật khẩu xác nhận không khớp.");
  });

  it("mở modal đổi email, gọi reauth + POST /api/users/email và giữ nguyên email hiện tại khi chờ xác nhận (BR-ACS-04)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/auth/reauth") {
        return Promise.resolve({
          ok: true,
          reauthenticated_at: new Date().toISOString(),
        });
      }
      if (url === "/api/users/email") {
        return Promise.resolve({
          pending_email: "new.parent@example.com",
          expires_at: new Date(Date.now() + 86_400_000).toISOString(),
          message: "Đã gửi liên kết xác nhận tới email mới.",
        });
      }
      return Promise.resolve({});
    });

    const page = await mountSettingsPage();
    expect(page.find('[data-testid="current-user-email"]').text()).toBe(
      "phuhuynh@example.com"
    );

    await page.find('[data-testid="open-email-modal-btn"]').trigger("click");
    await flushPromises();

    expect(page.find('[data-testid="email-modal"]').exists()).toBe(true);

    await page
      .find('[data-testid="email-current-password-input"]')
      .setValue("CurrentPass123!");
    await page
      .find('[data-testid="email-new-input"]')
      .setValue("new.parent@example.com");

    await page.find('[data-testid="email-form"]').trigger("submit.prevent");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/auth/reauth",
      expect.objectContaining({
        method: "POST",
        body: { password: "CurrentPass123!" },
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/email",
      expect.objectContaining({
        method: "POST",
        body: { new_email: "new.parent@example.com" },
      })
    );

    expect(page.find('[data-testid="email-modal"]').exists()).toBe(false);
    expect(page.find('[data-testid="current-user-email"]').text()).toBe(
      "phuhuynh@example.com"
    );
    expect(page.find('[data-testid="pending-email-banner"]').text()).toContain(
      "new.parent@example.com"
    );
  });

  it("hiển thị thông báo lỗi khi đổi sang email đã được sử dụng (409 EMAIL_ALREADY_IN_USE, BR-ACS-03)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/auth/reauth") {
        return Promise.resolve({
          ok: true,
          reauthenticated_at: new Date().toISOString(),
        });
      }
      if (url === "/api/users/email") {
        return Promise.reject(
          new ApiError({
            code: "EMAIL_ALREADY_IN_USE",
            status: 409,
            message: "Địa chỉ email này đã được sử dụng bởi tài khoản khác.",
            details: { field: "new_email" },
          })
        );
      }
      return Promise.resolve({});
    });

    const page = await mountSettingsPage();
    await page.find('[data-testid="open-email-modal-btn"]').trigger("click");

    await page
      .find('[data-testid="email-current-password-input"]')
      .setValue("CurrentPass123!");
    await page
      .find('[data-testid="email-new-input"]')
      .setValue("taken@example.com");

    await page.find('[data-testid="email-form"]').trigger("submit.prevent");
    await flushPromises();

    expect(page.find('[data-testid="email-modal"]').exists()).toBe(true);
    expect(page.find('[data-testid="email-modal-error"]').text()).toContain(
      "Địa chỉ email này đã được sử dụng bởi tài khoản khác."
    );
  });
});
