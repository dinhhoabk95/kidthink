// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageMetaMock = vi.fn();
const fetchMock = vi.fn();
const routerPushMock = vi.fn();
const requestPasswordResetMock = vi.fn();
const resetPasswordMock = vi.fn();

let currentMockRoute: {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
} = {
  path: "/",
  params: {},
  query: {},
};

vi.mock("~/composables/use-api", () => ({
  useApi: () => fetchMock,
}));

vi.mock("~/composables/use-auth-client", () => ({
  useUserAuthClient: () => ({
    requestPasswordReset: requestPasswordResetMock,
    resetPassword: resetPasswordMock,
  }),
}));

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
    requestPasswordResetMock.mockResolvedValue({
      data: { status: true },
      error: null,
    });
    resetPasswordMock.mockResolvedValue({
      data: { status: true },
      error: null,
    });
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

  it("trang /forgot-password gọi authClient.requestPasswordReset và hiển thị thông báo trung lập (BR-PWR-02)", async () => {
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

    expect(requestPasswordResetMock).toHaveBeenCalledWith({
      email: "parent@example.com",
      redirectTo: "/reset-password",
    });
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

  it("trang /reset-password gọi authClient.resetPassword và chuyển về /login (BR-PWR-09)", async () => {
    currentMockRoute = {
      path: "/dat-lai-mat-khau",
      params: {},
      query: { token: "valid-reset-token-123" },
    };

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

    expect(resetPasswordMock).toHaveBeenCalledWith({
      token: "valid-reset-token-123",
      newPassword: "NewSecurePass123!",
    });
    expect(wrapper.find('[data-testid="reset-success-banner"]').exists()).toBe(
      true
    );
    expect(routerPushMock).toHaveBeenCalledWith("/login");
  });

  it("trang /reset-password hiển thị trạng thái hết hạn khi API trả INVALID_TOKEN / 410", async () => {
    currentMockRoute = {
      path: "/dat-lai-mat-khau",
      params: {},
      query: { token: "expired-token-999" },
    };
    resetPasswordMock.mockResolvedValue({
      data: null,
      error: {
        code: "INVALID_TOKEN",
        message: "Liên kết đặt lại mật khẩu đã hết hạn.",
        status: 410,
      },
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

    expect(wrapper.find('[data-testid="reset-token-expired"]').exists()).toBe(
      true
    );
    expect(
      wrapper.find('[data-testid="request-again-link"]').attributes("href")
    ).toBe("/quen-mat-khau");
  });
});
