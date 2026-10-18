// @vitest-environment happy-dom
import { ApiError } from "@mindkid/errors/client";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageMetaMock = vi.fn();
const fetchMock = vi.fn();

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useRoute", () => ({ params: { uuid: "child-uuid-detail-1" } }));
vi.stubGlobal("$fetch", fetchMock);

const stubs = {
  UIcon: { template: "<i />" },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
};

let wrapper: VueWrapper | null = null;

async function mountChildDetailPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/me/children/[uuid]/index.vue")).default;
  wrapper = mount(Page, {
    global: {
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

describe("Trang quản lý hồ sơ trẻ /me/children/[uuid] (BR-CPR-01..08)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/children") {
        return Promise.resolve({
          children: [
            {
              uuid: "child-uuid-detail-1",
              display_name: "Bé Bơ",
              birth_year: 2022,
              age_band: "4-5",
              avatar_id: "avatar-preset-01",
              relationship: "child",
              status: "active",
              purge_at: null,
            },
          ],
        });
      }
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("hiển thị thông tin trẻ, liên kết sửa/báo cáo, và lưu trữ hồ sơ giữ nguyên quyền xem báo cáo (BR-CPR-01, BR-CPR-02, BR-CPR-07)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/children") {
        return Promise.resolve({
          children: [
            {
              uuid: "child-uuid-detail-1",
              display_name: "Bé Bơ",
              birth_year: 2022,
              age_band: "4-5",
              avatar_id: "avatar-preset-01",
              relationship: "child",
              status: "active",
              purge_at: null,
            },
          ],
        });
      }
      if (url === "/api/users/children/child-uuid-detail-1/archive") {
        return Promise.resolve({
          uuid: "child-uuid-detail-1",
          status: "archived",
        });
      }
      return Promise.resolve({});
    });

    const page = await mountChildDetailPage();

    expect(pageMetaMock).toHaveBeenCalledWith({
      layout: "account",
      middleware: ["user-auth"],
    });
    expect(page.find('[data-testid="child-display-name"]').text()).toBe(
      "Bé Bơ"
    );
    expect(
      page.find('[data-testid="edit-child-link"]').attributes("href")
    ).toBe("/me/children/child-uuid-detail-1/edit");
    expect(
      page.find('[data-testid="report-child-link"]').attributes("href")
    ).toBe("/me/children/child-uuid-detail-1/report");

    await page.find('[data-testid="archive-child-btn"]').trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/children/child-uuid-detail-1/archive",
      {
        method: "POST",
        body: {},
      }
    );
    expect(page.find('[data-testid="child-status-badge"]').text()).toBe(
      "Đã lưu trữ"
    );
    expect(page.find('[data-testid="restore-child-btn"]').exists()).toBe(true);
    expect(page.find('[data-testid="report-child-link"]').exists()).toBe(true);
  });

  it("khôi phục hồ sơ archived và xử lý lỗi 402 CHILD_LIMIT_EXCEEDED khi hết quota (BR-CPR-02)", async () => {
    let shouldFailQuota = true;

    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/children") {
        return Promise.resolve({
          children: [
            {
              uuid: "child-uuid-detail-1",
              display_name: "Bé Bơ",
              birth_year: 2022,
              age_band: "4-5",
              avatar_id: "avatar-preset-01",
              relationship: "child",
              status: "archived",
              purge_at: null,
            },
          ],
        });
      }
      if (url === "/api/users/children/child-uuid-detail-1/restore") {
        if (shouldFailQuota) {
          return Promise.reject(
            new ApiError({
              code: "CHILD_LIMIT_EXCEEDED",
              status: 402,
              message:
                "Không thể khôi phục. Gói dịch vụ đã đạt hạn mức tối đa 3 hồ sơ trẻ đang hoạt động.",
            })
          );
        }
        return Promise.resolve({
          uuid: "child-uuid-detail-1",
          status: "active",
        });
      }
      return Promise.resolve({});
    });

    const page = await mountChildDetailPage();
    await page.find('[data-testid="restore-child-btn"]').trigger("click");
    await flushPromises();

    expect(page.find('[data-testid="quota-exceeded-banner"]').exists()).toBe(
      true
    );
    expect(page.find('[data-testid="quota-exceeded-banner"]').text()).toContain(
      "đạt hạn mức tối đa 3 hồ sơ"
    );

    shouldFailQuota = false;
    await page.find('[data-testid="restore-child-btn"]').trigger("click");
    await flushPromises();

    expect(page.find('[data-testid="quota-exceeded-banner"]').exists()).toBe(
      false
    );
    expect(page.find('[data-testid="child-status-badge"]').text()).toBe(
      "Đang hoạt động"
    );
  });

  it("yêu cầu xoá cần gõ đúng tên trẻ + mật khẩu và chuyển sang chờ xoá 30 ngày (BR-CPR-03, BR-CPR-04, BR-CPR-08)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/children") {
        return Promise.resolve({
          children: [
            {
              uuid: "child-uuid-detail-1",
              display_name: "Bé Bơ",
              birth_year: 2022,
              age_band: "4-5",
              avatar_id: "avatar-preset-01",
              relationship: "child",
              status: "active",
              purge_at: null,
            },
          ],
        });
      }
      if (url === "/api/users/children/child-uuid-detail-1") {
        return Promise.resolve({
          uuid: "child-uuid-detail-1",
          status: "pending_deletion",
          purge_at: "2026-11-17T00:00:00.000Z",
        });
      }
      return Promise.resolve({});
    });

    const page = await mountChildDetailPage();
    await page.find('[data-testid="open-delete-modal-btn"]').trigger("click");
    await flushPromises();

    expect(page.find('[data-testid="delete-child-modal"]').exists()).toBe(true);

    // Gõ sai tên trẻ -> chặn tại form
    await page
      .find('[data-testid="delete-confirm-name-input"]')
      .setValue("Bé Khác");
    await page
      .find('[data-testid="delete-password-input"]')
      .setValue("SecretPass123!");
    await page
      .find('[data-testid="delete-child-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(page.find('[data-testid="delete-modal-error"]').text()).toContain(
      "Tên xác nhận không trùng khớp"
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/users/children/child-uuid-detail-1",
      expect.anything()
    );

    // Gõ đúng tên trẻ + mật khẩu
    await page
      .find('[data-testid="delete-confirm-name-input"]')
      .setValue("Bé Bơ");
    await page
      .find('[data-testid="delete-child-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/children/child-uuid-detail-1",
      {
        method: "DELETE",
        body: {
          password: "SecretPass123!",
          confirm_name: "Bé Bơ",
        },
      }
    );

    expect(page.find('[data-testid="delete-child-modal"]').exists()).toBe(
      false
    );
    expect(page.find('[data-testid="pending-deletion-banner"]').exists()).toBe(
      true
    );
    expect(page.find('[data-testid="child-purge-at"]').text()).toContain(
      "2026-11-17"
    );
  });

  it("cho phép huỷ yêu cầu xoá trong thời gian ân hạn 30 ngày (BR-CPR-03)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/children") {
        return Promise.resolve({
          children: [
            {
              uuid: "child-uuid-detail-1",
              display_name: "Bé Bơ",
              birth_year: 2022,
              age_band: "4-5",
              avatar_id: "avatar-preset-01",
              relationship: "child",
              status: "pending_deletion",
              purge_at: "2026-11-17T00:00:00.000Z",
            },
          ],
        });
      }
      if (url === "/api/users/children/child-uuid-detail-1/delete/cancel") {
        return Promise.resolve({
          uuid: "child-uuid-detail-1",
          status: "archived",
        });
      }
      return Promise.resolve({});
    });

    const page = await mountChildDetailPage();
    expect(page.find('[data-testid="pending-deletion-banner"]').exists()).toBe(
      true
    );

    await page.find('[data-testid="cancel-delete-child-btn"]').trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/children/child-uuid-detail-1/delete/cancel",
      {
        method: "POST",
        body: {},
      }
    );
    expect(page.find('[data-testid="pending-deletion-banner"]').exists()).toBe(
      false
    );
    expect(page.find('[data-testid="child-status-badge"]').text()).toBe(
      "Đã lưu trữ"
    );
  });
});
