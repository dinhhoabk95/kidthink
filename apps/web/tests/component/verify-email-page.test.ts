// @vitest-environment happy-dom
import { ApiError } from "@mindkid/errors/client";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageMetaMock = vi.fn();
const fetchMock = vi.fn();
const routerPushMock = vi.fn();
const routeState = {
  path: "/verify-email",
  query: {} as Record<string, string>,
};

vi.mock("#imports", () => ({
  definePageMeta: (meta: Record<string, string | string[]>) =>
    pageMetaMock(meta),
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPushMock,
  }),
  useSeoMeta: vi.fn(),
}));

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("$fetch", fetchMock);
vi.stubGlobal("useRoute", () => routeState);
vi.stubGlobal("useRouter", () => ({
  push: routerPushMock,
}));

const stubs = {
  UIcon: { template: "<i />" },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
};

let wrapper: VueWrapper | null = null;

async function mountVerifyEmailPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/verify-email.vue")).default;
  wrapper = mount(Page, {
    global: {
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

describe("Trang xác thực email /verify-email & /xac-thuc (BR-EVF-01..08, #290 S1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.path = "/verify-email";
    routeState.query = { token: "valid-token-123" };
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("xác thực token hợp lệ lần đầu và chuyển hướng sang /me/children/create (BR-EVF-08)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/guest/auth/users/verify-email") {
        return Promise.resolve({
          status: "active",
          already_verified: false,
        });
      }
      return Promise.resolve({});
    });

    const page = await mountVerifyEmailPage();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/guest/auth/users/verify-email",
      expect.objectContaining({
        method: "POST",
        body: { token: "valid-token-123" },
      })
    );
    expect(page.find('[data-testid="verify-success"]').exists()).toBe(true);
    expect(routerPushMock).toHaveBeenCalledWith("/me/children/create");
  });

  it("token đã dùng nhưng tài khoản đã active thì điều hướng êm về /me không báo lỗi (BR-EVF-04)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/guest/auth/users/verify-email") {
        return Promise.resolve({
          status: "active",
          already_verified: true,
        });
      }
      return Promise.resolve({});
    });

    const page = await mountVerifyEmailPage();

    expect(page.find('[data-testid="verify-already-active"]').exists()).toBe(
      true
    );
    expect(page.find('[data-testid="verify-error-section"]').exists()).toBe(
      false
    );
    expect(routerPushMock).toHaveBeenCalledWith("/me");
  });

  it("token hết hạn (410 TOKEN_EXPIRED) hiển thị thông báo thân thiện, không lộ email và cho phép gửi lại (BR-EVF-05, BR-EVF-07)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/guest/auth/users/verify-email") {
        return Promise.reject(
          new ApiError({
            code: "TOKEN_EXPIRED",
            status: 410,
            message: "Liên kết xác thực đã hết hạn.",
          })
        );
      }
      if (url === "/api/users/auth/resend-verification") {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({});
    });

    const page = await mountVerifyEmailPage();

    const errBlock = page.find('[data-testid="verify-error-section"]');
    expect(errBlock.exists()).toBe(true);
    expect(errBlock.text()).toContain("Liên kết xác thực đã hết hạn");
    expect(errBlock.text()).not.toContain("@");

    await page
      .find('[data-testid="resend-email-input"]')
      .setValue("parent@example.com");
    await page
      .find('[data-testid="resend-verification-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/auth/resend-verification",
      expect.objectContaining({
        method: "POST",
        body: { email: "parent@example.com" },
      })
    );
    expect(page.find('[data-testid="resend-success-message"]').exists()).toBe(
      true
    );
  });

  it("token không hợp lệ (404) hiển thị lỗi chung không tiết lộ email (BR-EVF-05)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/guest/auth/users/verify-email") {
        return Promise.reject(
          new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "Token không hợp lệ.",
          })
        );
      }
      return Promise.resolve({});
    });

    const page = await mountVerifyEmailPage();

    const errBlock = page.find('[data-testid="verify-error-section"]');
    expect(errBlock.exists()).toBe(true);
    expect(errBlock.text()).toContain("Liên kết xác thực không hợp lệ");
    expect(errBlock.text()).not.toContain("@");
  });

  it("xác nhận đổi email tại /verify-email-change gọi POST /api/guest/auth/verify-email-change", async () => {
    routeState.path = "/verify-email-change";
    routeState.query = {
      token: "change-token-999",
      email: "new.email@example.com",
    };

    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/guest/auth/verify-email-change") {
        return Promise.resolve({
          ok: true,
          email: "new.email@example.com",
          message: "Đã cập nhật địa chỉ email mới.",
        });
      }
      return Promise.resolve({});
    });

    const page = await mountVerifyEmailPage();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/guest/auth/verify-email-change",
      expect.objectContaining({
        method: "POST",
        body: {
          token: "change-token-999",
          new_email: "new.email@example.com",
        },
      })
    );
    expect(
      page.find('[data-testid="email-change-verified-banner"]').exists()
    ).toBe(true);
  });

  it("renderEmailTemplate('email_verification', { url }) hoạt động khi không truyền code (#289 S2)", async () => {
    const { renderEmailTemplate } = await import("@mindkid/notification");
    const rendered = await renderEmailTemplate("email_verification", {
      url: "https://mindkid.vn/xac-thuc?token=valid-token-123",
    });
    expect(rendered.subject).toContain("Xác nhận");
    expect(rendered.html).toContain(
      "https://mindkid.vn/xac-thuc?token=valid-token-123"
    );
    expect(rendered.text).toContain(
      "https://mindkid.vn/xac-thuc?token=valid-token-123"
    );
  });
});
