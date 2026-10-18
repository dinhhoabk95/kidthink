// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const pushMock = vi.fn();
const fetchSessionMock = vi.fn();
const refreshMock = vi.fn();
const apiFetchMock = vi.fn();

const mockRouteQuery = ref<Record<string, string>>({});

interface MockSubscriptionResponse {
  packages: Array<{
    code: string;
    name: string;
    description: string;
    status: string;
    source_label: string;
    granted_at: string;
    expires_at: string | null;
    days_left: number | null;
    is_soft_unlock: boolean;
  }>;
  entitlements: Array<{
    key: string;
    label: string;
    description: string | null;
    group: string;
    status: string;
    source_label: string;
    expires_at: string | null;
    is_soft_unlock: boolean;
  }>;
  quotas: Array<{
    quota_key: string;
    label: string;
    used: number;
    total: number;
  }>;
  orders: Array<{
    id: number;
    uuid: string;
    package_code: string;
    package_name: string;
    offer_code: string;
    amount_vnd: number;
    currency: string;
    status: string;
    created_at: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    polite_reason: string | null;
  }>;
  recurring_subscription: {
    id: number;
    package_code: string;
    billing_period: "monthly" | "annual";
    price_vnd: number;
    auto_renew: boolean;
    status: string;
    current_period_end: string;
    next_billing_at: string | null;
    can_cancel: boolean;
  } | null;
  cancellation_guidance: string;
  data_preservation_notice: string;
  has_higher_tier: boolean;
}

const mockSubscriptionData = ref<MockSubscriptionResponse>({
  packages: [],
  entitlements: [],
  quotas: [],
  orders: [],
  recurring_subscription: null,
  cancellation_guidance: "",
  data_preservation_notice: "",
  has_higher_tier: true,
});

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: mockRouteQuery.value }),
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("~/composables/use-api", () => ({
  useApi: () => apiFetchMock,
}));

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(),
  useSeoMeta: vi.fn(),
  useUserSession: () => ({ fetch: fetchSessionMock }),
  useFetch: () => ({
    data: mockSubscriptionData,
    pending: ref(false),
    error: ref(null),
    refresh: refreshMock,
  }),
}));

const globalStubs = {
  UIcon: { template: "<i />" },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
};

describe("Register Page & Subscription View Page (#290 S8, #291 S5, #292 S5)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    fetchSessionMock.mockReset();
    refreshMock.mockReset();
    apiFetchMock.mockReset();
    mockRouteQuery.value = {};
    mockSubscriptionData.value = {
      packages: [],
      entitlements: [],
      quotas: [],
      orders: [],
      recurring_subscription: null,
      cancellation_guidance: "",
      data_preservation_notice: "",
      has_higher_tier: true,
    };
  });

  describe("Register Page (/register) — #290 S8", () => {
    it("fetches /api/guest/consent-requirements and submits flat consent fields to /api/guest/auth/users/register", async () => {
      apiFetchMock.mockImplementation((url: string) => {
        if (url === "/api/guest/consent-requirements") {
          return Promise.resolve({
            terms: { requirement_at: "2026-01-01T00:00:00.000Z" },
            privacy: { requirement_at: "2026-01-02T00:00:00.000Z" },
          });
        }
        if (url === "/api/guest/auth/users/register") {
          return Promise.resolve({
            user: {
              uuid: "u-123",
              displayName: "Phụ Huynh Test",
              status: "pending_verification",
            },
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const RegisterPage = (await import("~/pages/register/index.vue")).default;
      const wrapper = mount(RegisterPage, { global: { stubs: globalStubs } });

      await wrapper.get("#reg-name").setValue("Phụ Huynh Test");
      await wrapper.get("#reg-email").setValue("phuhuynh@example.com");
      await wrapper.get("#reg-password").setValue("chuoixanh123");
      await wrapper.get("#reg-terms").setValue(true);
      await wrapper.get("#reg-privacy").setValue(true);

      await wrapper.get("form").trigger("submit.prevent");
      await flushPromises();

      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/guest/consent-requirements"
      );
      expect(apiFetchMock).not.toHaveBeenCalledWith(
        "/api/guest/consents/requirements"
      );
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/guest/auth/users/register",
        {
          method: "POST",
          body: {
            display_name: "Phụ Huynh Test",
            email: "phuhuynh@example.com",
            password: "chuoixanh123",
            accept_terms: true,
            accept_privacy: true,
            terms_requirement_at: "2026-01-01T00:00:00.000Z",
            privacy_requirement_at: "2026-01-02T00:00:00.000Z",
          },
          credentials: "include",
        }
      );

      wrapper.unmount();
    });

    it("surfaces error and does not silently swallow when /api/guest/consent-requirements fails", async () => {
      apiFetchMock.mockRejectedValueOnce(
        new Error("Không thể tải điều khoản pháp lý.")
      );

      const RegisterPage = (await import("~/pages/register/index.vue")).default;
      const wrapper = mount(RegisterPage, { global: { stubs: globalStubs } });

      await wrapper.get("#reg-name").setValue("Phụ Huynh Test");
      await wrapper.get("#reg-email").setValue("phuhuynh@example.com");
      await wrapper.get("#reg-password").setValue("chuoixanh123");
      await wrapper.get("#reg-terms").setValue(true);
      await wrapper.get("#reg-privacy").setValue(true);

      await wrapper.get("form").trigger("submit.prevent");
      await flushPromises();

      const alertBox = wrapper.find('[role="alert"]');
      expect(alertBox.exists()).toBe(true);
      expect(alertBox.text()).toContain("Không thể tải điều khoản pháp lý.");
      expect(apiFetchMock).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });
  });

  describe("Subscription View Page (/me/subscription) — #291 S5 & #292 S5", () => {
    it("displays child learning data preservation commitment (BR-SBV-02) and requires explicit consent to opt-in recurring billing (BR-RBL-01)", async () => {
      apiFetchMock.mockResolvedValue({
        subscription_id: "10",
        auto_renew: true,
      });

      const SubscriptionPage = (await import("~/pages/me/subscription.vue"))
        .default;
      const wrapper = mount(SubscriptionPage, {
        global: { stubs: globalStubs },
      });
      await flushPromises();

      // BR-SBV-02: Data preservation notice always visible
      const notice = wrapper.get('[data-testid="data-preservation-notice"]');
      expect(notice.text()).toContain(
        "hồ sơ của các bé và toàn bộ tiến độ học vẫn được giữ nguyên"
      );

      // BR-RBL-01: Opt-in button disabled until explicit consent checkbox is checked
      const optInBtn = wrapper.get('[data-testid="recurring-opt-in-btn"]');
      expect(optInBtn.attributes("disabled")).toBeDefined();

      await wrapper
        .get('[data-testid="recurring-consent-checkbox"]')
        .setValue(true);
      expect(optInBtn.attributes("disabled")).toBeUndefined();

      await wrapper
        .get('[data-testid="recurring-billing-section"] form')
        .trigger("submit.prevent");
      await flushPromises();

      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/users/subscriptions/recurring/opt-in",
        {
          method: "POST",
          body: {
            package_code: "PKG-standard",
            billing_period: "monthly",
            consent_accepted: true,
          },
          credentials: "include",
        }
      );
      expect(refreshMock).toHaveBeenCalled();

      wrapper.unmount();
    });

    it("allows cancelling active recurring subscription via /api/users/subscriptions/recurring/cancel (BR-RBL-03)", async () => {
      mockSubscriptionData.value = {
        ...mockSubscriptionData.value,
        recurring_subscription: {
          id: 42,
          package_code: "PKG-premium",
          billing_period: "annual",
          price_vnd: 490_000,
          auto_renew: true,
          status: "active",
          current_period_end: "2027-01-01T00:00:00.000Z",
          next_billing_at: "2027-01-01T00:00:00.000Z",
          can_cancel: true,
        },
      };

      apiFetchMock.mockResolvedValue({
        ok: true,
        auto_renew: false,
      });

      const SubscriptionPage = (await import("~/pages/me/subscription.vue"))
        .default;
      const wrapper = mount(SubscriptionPage, {
        global: { stubs: globalStubs },
      });
      await flushPromises();

      const cancelBtn = wrapper.get('[data-testid="recurring-cancel-btn"]');
      await cancelBtn.trigger("click");
      await flushPromises();

      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/users/subscriptions/recurring/cancel",
        {
          method: "POST",
          body: {
            subscription_id: 42,
          },
          credentials: "include",
        }
      );
      expect(refreshMock).toHaveBeenCalled();

      wrapper.unmount();
    });
  });
});
