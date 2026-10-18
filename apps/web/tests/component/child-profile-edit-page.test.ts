// @vitest-environment happy-dom
import { ApiError } from "@mindkid/errors/client";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageMetaMock = vi.fn();
const fetchMock = vi.fn();

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useRoute", () => ({ params: { uuid: "child-uuid-edit-1" } }));
vi.stubGlobal("$fetch", fetchMock);

const stubs = {
  UIcon: { template: "<i />" },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
};

let wrapper: VueWrapper | null = null;

async function mountEditChildPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/me/children/[uuid]/edit.vue")).default;
  wrapper = mount(Page, {
    global: {
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

describe("Trang sửa hồ sơ trẻ /me/children/[uuid]/edit (BR-CPC-01..10)", () => {
  const currentYear = new Date().getFullYear();

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/children") {
        return Promise.resolve({
          children: [
            {
              uuid: "child-uuid-edit-1",
              display_name: "Bé Bơ",
              birth_year: currentYear - 4,
              age_band: "4-5",
              avatar_id: "avatar-preset-01",
              relationship: "child",
              status: "active",
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

  it("hiển thị form đúng 4 trường đóng, không có input file, có giải thích minh bạch và tự suy nhóm tuổi (BR-CPC-01..06, BR-CPC-08)", async () => {
    const page = await mountEditChildPage();

    expect(pageMetaMock).toHaveBeenCalledWith({
      layout: "account",
      middleware: ["user-auth"],
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/users/children");

    expect(page.find('input[type="file"]').exists()).toBe(false);
    expect(page.findAll('[data-testid="avatar-preset-btn"]')).toHaveLength(12);
    expect(
      page.find('[data-testid="privacy-transparency-notice"]').text()
    ).toContain("Chúng tôi không thu thập họ tên đầy đủ, ngày sinh, ảnh chụp");
    expect(page.find('[data-testid="derived-age-band"]').text()).toContain(
      "4-5 tuổi"
    );
  });

  it("gửi PATCH /api/users/children/[uuid] với đúng 4 trường đóng khi lưu thay đổi (BR-CPC-01)", async () => {
    const updatedBirthYear = currentYear - 5;

    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/children") {
        return Promise.resolve({
          children: [
            {
              uuid: "child-uuid-edit-1",
              display_name: "Bé Bơ",
              birth_year: currentYear - 4,
              age_band: "4-5",
              avatar_id: "avatar-preset-01",
              relationship: "child",
              status: "active",
            },
          ],
        });
      }
      if (url === "/api/users/children/child-uuid-edit-1") {
        return Promise.resolve({
          uuid: "child-uuid-edit-1",
          display_name: "Bé Bơ Lớn",
          birth_year: updatedBirthYear,
          age_band: "5-6",
          avatar_id: "avatar-preset-03",
          relationship: "student",
        });
      }
      return Promise.resolve({});
    });

    const page = await mountEditChildPage();

    await page
      .find('[data-testid="child-display-name-input"]')
      .setValue("Bé Bơ Lớn");
    await page
      .find('[data-testid="child-birth-year-select"]')
      .setValue(String(updatedBirthYear));
    const presetButtons = page.findAll('[data-testid="avatar-preset-btn"]');
    await presetButtons[2]?.trigger("click");
    await page
      .find('[data-testid="child-relationship-select"]')
      .setValue("student");

    await page
      .find('[data-testid="edit-child-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/children/child-uuid-edit-1",
      {
        method: "PATCH",
        body: {
          display_name: "Bé Bơ Lớn",
          birth_year: updatedBirthYear,
          avatar_id: "avatar-preset-03",
          relationship: "student",
        },
      }
    );

    expect(
      page.find('[data-testid="edit-child-status-message"]').text()
    ).toContain("Đã cập nhật hồ sơ của bé thành công.");
  });

  it("hiển thị thông báo lỗi khi PATCH trả về 422 CHILD_AGE_OUT_OF_RANGE (BR-CPC-10)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/users/children") {
        return Promise.resolve({
          children: [
            {
              uuid: "child-uuid-edit-1",
              display_name: "Bé Bơ",
              birth_year: currentYear - 4,
              age_band: "4-5",
              avatar_id: "avatar-preset-01",
              relationship: "child",
              status: "active",
            },
          ],
        });
      }
      if (url === "/api/users/children/child-uuid-edit-1") {
        return Promise.reject(
          new ApiError({
            code: "CHILD_AGE_OUT_OF_RANGE",
            status: 422,
            message: "MindKid là sản phẩm dành riêng cho trẻ từ 3–6 tuổi.",
          })
        );
      }
      return Promise.resolve({});
    });

    const page = await mountEditChildPage();
    await page
      .find('[data-testid="edit-child-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(page.find('[data-testid="edit-child-error"]').text()).toContain(
      "MindKid là sản phẩm dành riêng cho trẻ từ 3–6 tuổi."
    );
  });
});
