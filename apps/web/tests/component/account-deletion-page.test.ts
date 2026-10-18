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

async function mountDeletePage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/me/settings/delete.vue")).default;
  wrapper = mount(Page, {
    global: {
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

describe("Trang xoá tài khoản /me/settings/delete (BR-ADL-01..07)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/account/delete-summary") {
        return Promise.resolve({
          child_profiles_count: 2,
          active_subscription_days: 45,
          grace_period_days: 30,
          lost_data_items: [
            "Toàn bộ 2 hồ sơ trẻ em (nickname, tuổi, avatar) và dữ liệu liên quan",
            "45 ngày còn lại của gói thuê bao đang hoạt động",
          ],
          retained_legal_items: [
            "Hồ sơ giao dịch thanh toán (ẩn danh thông tin cá nhân)",
          ],
        });
      }
      if (url === "/api/users/account/delete/status") {
        return Promise.resolve({
          status: "active",
          purge_at: null,
          is_pending_deletion: false,
        });
      }
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("hiển thị số lượng hồ sơ bé và số ngày gói học bị mất từ delete-summary (BR-ADL-07)", async () => {
    const page = await mountDeletePage();

    expect(page.find('[data-testid="child-profiles-count"]').text()).toContain(
      "2 hồ sơ"
    );
    expect(
      page.find('[data-testid="active-subscription-days"]').text()
    ).toContain("45 ngày");
    expect(page.text()).toContain(
      "Toàn bộ 2 hồ sơ trẻ em (nickname, tuổi, avatar) và dữ liệu liên quan"
    );
  });

  it("mở modal reauth khi yêu cầu xoá, gọi reauth + POST /api/users/account/delete và chuyển sang chờ xoá (BR-ADL-01, BR-ADL-03)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/account/delete-summary") {
        return Promise.resolve({
          child_profiles_count: 1,
          active_subscription_days: 10,
          grace_period_days: 30,
          lost_data_items: ["Hồ sơ bé"],
          retained_legal_items: ["Hoá đơn"],
        });
      }
      if (url === "/api/users/account/delete/status") {
        return Promise.resolve({
          status: "active",
          purge_at: null,
          is_pending_deletion: false,
        });
      }
      if (url === "/api/users/auth/reauth") {
        return Promise.resolve({
          ok: true,
          reauthenticated_at: new Date().toISOString(),
        });
      }
      if (url === "/api/users/account/delete") {
        return Promise.resolve({
          purge_at: "2026-11-17T00:00:00.000Z",
          grace_period_days: 30,
          message: "Yêu cầu xoá tài khoản đã được ghi nhận.",
        });
      }
      return Promise.resolve({});
    });

    const page = await mountDeletePage();
    const requestBtn = page.find('[data-testid="request-deletion-btn"]');
    expect(requestBtn.exists()).toBe(true);

    await requestBtn.trigger("click");
    await flushPromises();

    expect(page.find('[data-testid="deletion-reauth-modal"]').exists()).toBe(
      true
    );

    await page
      .find('[data-testid="deletion-password-input"]')
      .setValue("MySecretPass123!");
    await page
      .find('[data-testid="deletion-reauth-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/auth/reauth",
      expect.objectContaining({
        method: "POST",
        body: { password: "MySecretPass123!" },
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/account/delete",
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(page.find('[data-testid="deletion-reauth-modal"]').exists()).toBe(
      false
    );
    expect(page.find('[data-testid="pending-deletion-banner"]').exists()).toBe(
      true
    );
    expect(page.find('[data-testid="purge-at-display"]').text()).toContain(
      "2026-11-17"
    );
  });

  it("cho phép huỷ yêu cầu xoá trong thời gian chờ 30 ngày (BR-ADL-02)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/account/delete-summary") {
        return Promise.resolve({
          child_profiles_count: 1,
          active_subscription_days: 0,
          grace_period_days: 30,
          lost_data_items: ["Hồ sơ bé"],
          retained_legal_items: ["Hoá đơn"],
        });
      }
      if (url === "/api/users/account/delete/status") {
        return Promise.resolve({
          status: "pending_deletion",
          purge_at: "2026-11-17T00:00:00.000Z",
          is_pending_deletion: true,
        });
      }
      if (url === "/api/users/account/delete/cancel") {
        return Promise.resolve({
          status: "active",
          message: "Tài khoản của bạn đã được khôi phục nguyên trạng.",
        });
      }
      return Promise.resolve({});
    });

    const page = await mountDeletePage();
    expect(page.find('[data-testid="pending-deletion-banner"]').exists()).toBe(
      true
    );

    await page.find('[data-testid="cancel-deletion-btn"]').trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/account/delete/cancel",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(page.find('[data-testid="pending-deletion-banner"]').exists()).toBe(
      false
    );
    expect(
      page.find('[data-testid="deletion-status-message"]').text()
    ).toContain("Tài khoản của bạn đã được khôi phục nguyên trạng.");
  });

  it("hiển thị lỗi khi mật khẩu reauth không chính xác (BR-ADL-03)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/account/delete-summary") {
        return Promise.resolve({
          child_profiles_count: 0,
          active_subscription_days: 0,
          grace_period_days: 30,
          lost_data_items: [],
          retained_legal_items: [],
        });
      }
      if (url === "/api/users/account/delete/status") {
        return Promise.resolve({
          status: "active",
          purge_at: null,
          is_pending_deletion: false,
        });
      }
      if (url === "/api/users/auth/reauth") {
        return Promise.reject(
          new ApiError({
            code: "INVALID_CREDENTIALS",
            status: 401,
            message: "Mật khẩu xác thực không chính xác.",
            details: { field: "password" },
          })
        );
      }
      return Promise.resolve({});
    });

    const page = await mountDeletePage();
    await page.find('[data-testid="request-deletion-btn"]').trigger("click");

    await page
      .find('[data-testid="deletion-password-input"]')
      .setValue("WrongPassword");
    await page
      .find('[data-testid="deletion-reauth-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(page.find('[data-testid="deletion-reauth-modal"]').exists()).toBe(
      true
    );
    expect(page.find('[data-testid="deletion-modal-error"]').text()).toContain(
      "Mật khẩu xác thực không chính xác."
    );
  });
});
