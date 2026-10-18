// @vitest-environment happy-dom
import { ApiError } from "@mindkid/errors/client";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageMetaMock = vi.fn();
const fetchMock = vi.fn();
const routerPushMock = vi.fn();

let currentMockRoute: {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
} = {
  path: "/",
  params: {},
  query: {},
};

vi.mock("#imports", () => ({
  definePageMeta: (meta: Record<string, string | string[]>) =>
    pageMetaMock(meta),
  useRoute: () => currentMockRoute,
  useRouter: () => ({ push: routerPushMock, replace: routerPushMock }),
  navigateTo: (to: string) => routerPushMock(to),
  useSeoMeta: vi.fn(),
  useUserSession: () => ({
    loggedIn: { value: false },
    fetch: vi.fn().mockResolvedValue(undefined),
  }),
  useRuntimeConfig: () => ({ public: {} }),
}));

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

describe("Password Recovery Pages — /login, /forgot-password, /reset-password (#290 S2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockRoute = { path: "/", params: {}, query: {} };
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("trang /login có link Quên mật khẩu trỏ tới /quen-mat-khau", async () => {
    fetchMock.mockResolvedValue({ providers: [] });
    const LoginPage = (await import("~/pages/login.vue")).default;
    wrapper = mount(LoginPage, { global: { stubs } });
    await flushPromises();

    const forgotLink = wrapper.find('[data-testid="forgot-password-link"]');
    expect(forgotLink.exists()).toBe(true);
    expect(forgotLink.attributes("href")).toBe("/quen-mat-khau");
  });

  it("trang /forgot-password gửi POST /api/guest/auth/users/forgot-password và hiển thị thông báo trung lập (BR-PWR-02)", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const ForgotPage = (await import("~/pages/forgot-password.vue")).default;
    wrapper = mount(ForgotPage, { global: { stubs } });
    await flushPromises();

    await wrapper
      .find('[data-testid="forgot-email-input"]')
      .setValue("parent@example.com");
    await wrapper
      .find('[data-testid="forgot-password-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/guest/auth/users/forgot-password",
      expect.objectContaining({
        method: "POST",
        body: { email: "parent@example.com" },
      })
    );
    expect(
      wrapper.find('[data-testid="forgot-success-message"]').exists()
    ).toBe(true);
  });

  it("trang /reset-password hiển thị cảnh báo thiếu token kèm link /quen-mat-khau khi không có query token", async () => {
    currentMockRoute = { path: "/dat-lai-mat-khau", params: {}, query: {} };
    const ResetPage = (await import("~/pages/reset-password.vue")).default;
    wrapper = mount(ResetPage, { global: { stubs } });
    await flushPromises();

    expect(wrapper.find('[data-testid="reset-token-expired"]').exists()).toBe(
      true
    );
    expect(
      wrapper.find('[data-testid="request-again-link"]').attributes("href")
    ).toBe("/quen-mat-khau");
  });

  it("trang /reset-password gửi POST /api/guest/auth/users/reset-password và chuyển về /login (BR-PWR-09)", async () => {
    currentMockRoute = {
      path: "/dat-lai-mat-khau",
      params: {},
      query: { token: "valid-reset-token-123" },
    };
    fetchMock.mockResolvedValue({
      ok: true,
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
    });

    const ResetPage = (await import("~/pages/reset-password.vue")).default;
    wrapper = mount(ResetPage, { global: { stubs } });
    await flushPromises();

    await wrapper
      .find('[data-testid="reset-password-input"]')
      .setValue("NewSecurePass123!");
    await wrapper
      .find('[data-testid="reset-confirm-input"]')
      .setValue("NewSecurePass123!");
    await wrapper
      .find('[data-testid="reset-password-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/guest/auth/users/reset-password",
      expect.objectContaining({
        method: "POST",
        body: {
          token: "valid-reset-token-123",
          new_password: "NewSecurePass123!",
        },
      })
    );
    expect(wrapper.find('[data-testid="reset-success-banner"]').exists()).toBe(
      true
    );
    expect(routerPushMock).toHaveBeenCalledWith("/login");
  });

  it("trang /reset-password hiển thị trạng thái hết hạn khi API trả TOKEN_EXPIRED", async () => {
    currentMockRoute = {
      path: "/dat-lai-mat-khau",
      params: {},
      query: { token: "expired-token-999" },
    };
    fetchMock.mockRejectedValue(
      new ApiError({
        code: "TOKEN_EXPIRED",
        message: "Liên kết đặt lại mật khẩu đã hết hạn.",
        status: 410,
      })
    );

    const ResetPage = (await import("~/pages/reset-password.vue")).default;
    wrapper = mount(ResetPage, { global: { stubs } });
    await flushPromises();

    await wrapper
      .find('[data-testid="reset-password-input"]')
      .setValue("NewSecurePass123!");
    await wrapper
      .find('[data-testid="reset-confirm-input"]')
      .setValue("NewSecurePass123!");
    await wrapper
      .find('[data-testid="reset-password-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(wrapper.find('[data-testid="reset-token-expired"]').exists()).toBe(
      true
    );
    expect(
      wrapper.find('[data-testid="request-again-link"]').attributes("href")
    ).toBe("/quen-mat-khau");
  });
});
