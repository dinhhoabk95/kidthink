// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const pageMetaMock = vi.fn();
const fetchMock = vi.fn();
const routerPushMock = vi.fn();
const verifyEmailMock = vi.fn();
const sendVerificationEmailMock = vi.fn();
const refreshUserSessionMock = vi.fn();
const currentSessionUser = ref<{ email: string } | null>(null);
const routeState = {
  path: "/verify-email",
  query: {} as Record<string, string>,
};

vi.mock("~/composables/use-api", () => ({
  useApi: () => fetchMock,
}));

vi.mock("~/composables/use-auth-client", () => ({
  useUserAuthClient: () => ({
    verifyEmail: verifyEmailMock,
    sendVerificationEmail: sendVerificationEmailMock,
  }),
  useUserSession: () => ({
    user: currentSessionUser,
    fetch: refreshUserSessionMock,
  }),
}));

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
    currentSessionUser.value = null;
    refreshUserSessionMock.mockResolvedValue(true);
    verifyEmailMock.mockResolvedValue({ data: { status: true }, error: null });
    sendVerificationEmailMock.mockResolvedValue({
      data: { status: true },
      error: null,
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("xác thực token hợp lệ lần đầu và chuyển hướng sang /me/children/create (BR-EVF-08)", async () => {
    const page = await mountVerifyEmailPage();

    expect(verifyEmailMock).toHaveBeenCalledWith({
      query: { token: "valid-token-123" },
    });
    expect(refreshUserSessionMock).toHaveBeenCalled();
    expect(page.find('[data-testid="verify-success"]').exists()).toBe(true);
    expect(routerPushMock).toHaveBeenCalledWith("/me/children/create");
  });

  it("thiếu token trên URL hiển thị lỗi và dùng email từ session để gửi lại khi bỏ trống ô nhập (BR-EVF-04, BR-EVF-07)", async () => {
    routeState.query = {};
    currentSessionUser.value = { email: "session.parent@example.com" };

    const page = await mountVerifyEmailPage();

    expect(verifyEmailMock).not.toHaveBeenCalled();
    expect(page.find('[data-testid="verify-error-section"]').exists()).toBe(
      true
    );

    await page
      .find('[data-testid="resend-verification-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(sendVerificationEmailMock).toHaveBeenCalledWith({
      email: "session.parent@example.com",
      callbackURL: "/verify-email",
    });
    expect(page.find('[data-testid="resend-success-message"]').exists()).toBe(
      true
    );
  });

  it("token hết hạn (410 TOKEN_EXPIRED) hiển thị thông báo thân thiện, không lộ email và cho phép gửi lại (BR-EVF-05, BR-EVF-07)", async () => {
    verifyEmailMock.mockResolvedValue({
      data: null,
      error: {
        code: "TOKEN_EXPIRED",
        status: 410,
        message: "Liên kết xác thực đã hết hạn.",
      },
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

    expect(sendVerificationEmailMock).toHaveBeenCalledWith({
      email: "parent@example.com",
      callbackURL: "/verify-email",
    });
    expect(page.find('[data-testid="resend-success-message"]').exists()).toBe(
      true
    );
  });

  it("token không hợp lệ (404) hiển thị lỗi chung không tiết lộ email (BR-EVF-05)", async () => {
    verifyEmailMock.mockResolvedValue({
      data: null,
      error: {
        code: "INVALID_TOKEN",
        status: 404,
        message: "Token không hợp lệ.",
      },
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

  it("hiển thị lỗi khi gửi lại quá giới hạn (429) trên trang verify-email", async () => {
    verifyEmailMock.mockResolvedValue({
      data: null,
      error: {
        code: "INVALID_TOKEN",
        status: 400,
        message: "Invalid token",
      },
    });
    sendVerificationEmailMock.mockResolvedValue({
      data: null,
      error: {
        status: 429,
        message: "Bạn đã gửi quá nhiều yêu cầu.",
      },
    });

    const page = await mountVerifyEmailPage();
    await page
      .find('[data-testid="resend-email-input"]')
      .setValue("parent@example.com");
    await page
      .find('[data-testid="resend-verification-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(page.find('[data-testid="resend-error-message"]').text()).toContain(
      "Bạn đã gửi quá nhiều yêu cầu."
    );
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
