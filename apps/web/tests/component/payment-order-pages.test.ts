// @vitest-environment happy-dom
import { ApiError } from "@mindkid/errors/client";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageMetaMock = vi.fn();
const fetchMock = vi.fn();

let currentMockRoute: {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
} = {
  path: "/me/orders/create",
  params: {},
  query: {},
};

vi.mock("#imports", () => ({
  definePageMeta: (meta: Record<string, string | string[]>) =>
    pageMetaMock(meta),
  useRoute: () => currentMockRoute,
  useRouter: () => ({ push: vi.fn() }),
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

describe("Payment Order Create & Proof Upload Pages (#290 S7, BR-POC-01..07, BR-PPU-01..08)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockRoute = { path: "/me/orders/create", params: {}, query: {} };
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("trang /me/orders/create hiển thị thông báo cộng dồn ngày (BR-POC-05), tạo đơn và hiện VietQR + transfer_note + kỳ vọng duyệt 12h & mở khoá 3 ngày (BR-POC-02/03/07)", async () => {
    fetchMock.mockImplementation(
      (url: string, options?: { method?: string }) => {
        if (url === "/api/users/subscription" && !options?.method) {
          return Promise.resolve({ packages: [] });
        }
        if (url === "/api/users/orders" && options?.method === "POST") {
          return Promise.resolve({
            uuid: "11111111-2222-3333-4444-555555555555",
            package_code: "PKG-standard",
            offer_code: "annual",
            amount_vnd: 490_000,
            currency: "VND",
            status: "pending",
            transfer_note: "TM11111111",
            qr_payload: "000201010212...",
            qr_image_url:
              "https://img.vietqr.io/image/970407-1234567890-compact2.png",
            bank_info: {
              bankId: "970407",
              bankName: "Techcombank",
              accountNo: "1234567890",
              accountName: "MINDKID CORP",
            },
            expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          });
        }
        return Promise.resolve({});
      }
    );

    const CreateOrderPage = (await import("~/pages/me/orders/create.vue"))
      .default;
    wrapper = mount(CreateOrderPage, { global: { stubs } });
    await flushPromises();

    expect(wrapper.find('[data-testid="stacking-notice"]').exists()).toBe(true);

    await wrapper.find('[data-testid="create-order-btn"]').trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/orders",
      expect.objectContaining({
        method: "POST",
        body: {
          package_code: "PKG-standard",
          offer_code: "annual",
        },
      })
    );

    expect(
      wrapper.find('[data-testid="transfer-instructions-card"]').exists()
    ).toBe(true);
    expect(wrapper.find('[data-testid="order-transfer-note"]').text()).toBe(
      "TM11111111"
    );
    expect(wrapper.find('[data-testid="manual-review-notice"]').exists()).toBe(
      true
    );
    expect(
      wrapper.find('[data-testid="go-to-proof-btn"]').attributes("href")
    ).toBe("/me/orders/11111111-2222-3333-4444-555555555555/proof");
  });

  it("trang /me/orders/create xử lý lỗi 409 ORDER_ALREADY_PENDING và hiển thị link tới đơn đang chờ (BR-POC-04)", async () => {
    fetchMock.mockImplementation(
      (url: string, options?: { method?: string }) => {
        if (url === "/api/users/subscription" && !options?.method) {
          return Promise.resolve({ packages: [] });
        }
        return Promise.reject(
          new ApiError({
            code: "ORDER_ALREADY_PENDING",
            message: "Bạn đã có đơn hàng chưa xử lý cho gói này.",
            status: 409,
            details: {
              existing_order_uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            },
          })
        );
      }
    );

    const CreateOrderPage = (await import("~/pages/me/orders/create.vue"))
      .default;
    wrapper = mount(CreateOrderPage, { global: { stubs } });
    await flushPromises();

    await wrapper.find('[data-testid="create-order-btn"]').trigger("click");
    await flushPromises();

    expect(wrapper.find('[data-testid="create-order-error"]').exists()).toBe(
      true
    );
    expect(
      wrapper.find('[data-testid="existing-order-link"]').attributes("href")
    ).toBe("/me/orders/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/proof");
  });

  it("trang /me/orders/[uuid]/proof nộp FormData chứng từ và hiển thị thông báo mở khoá tạm thời 3 ngày (BR-PPU-04/06/07)", async () => {
    const orderUuid = "11111111-2222-3333-4444-555555555555";
    currentMockRoute = {
      path: `/me/orders/${orderUuid}/proof`,
      params: { uuid: orderUuid },
      query: {},
    };

    fetchMock.mockImplementation(
      (url: string, options?: { method?: string }) => {
        if (url === `/api/users/orders/${orderUuid}` && !options?.method) {
          return Promise.resolve({
            uuid: orderUuid,
            package_code: "PKG-standard",
            offer_code: "annual",
            amount_vnd: 490_000,
            currency: "VND",
            status: "pending",
            transfer_note: "TM11111111",
          });
        }
        if (
          url === `/api/users/orders/${orderUuid}/proof` &&
          options?.method === "POST"
        ) {
          return Promise.resolve({
            uuid: orderUuid,
            status: "submitted",
            soft_unlock_until: new Date(
              Date.now() + 3 * 86_400_000
            ).toISOString(),
            message:
              "Bạn đã có thể dùng ngay. Chúng tôi sẽ xác nhận trong 12 giờ làm việc.",
          });
        }
        return Promise.resolve({});
      }
    );

    const ProofPage = (await import("~/pages/me/orders/[uuid]/proof.vue"))
      .default;
    wrapper = mount(ProofPage, { global: { stubs } });
    await flushPromises();

    expect(wrapper.find('[data-testid="proof-upload-form"]').exists()).toBe(
      true
    );

    await wrapper
      .find('[data-testid="bank-txn-ref-input"]')
      .setValue("FT26291847291");
    await wrapper
      .find('[data-testid="proof-upload-form"]')
      .trigger("submit.prevent");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/users/orders/${orderUuid}/proof`,
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );

    expect(wrapper.find('[data-testid="soft-unlock-banner"]').exists()).toBe(
      true
    );
    expect(wrapper.find('[data-testid="soft-unlock-banner"]').text()).toContain(
      "Bạn đã có thể dùng ngay"
    );
  });
});
