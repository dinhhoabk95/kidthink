// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import KidPlayLimitModal from "~/components/kid/play-limit-modal.vue";

const mockFetch = vi.fn();
vi.stubGlobal("$fetch", mockFetch);

vi.mock("~/composables/use-csrf-fetch", () => ({
  useCsrfHeaders: () => ({
    headers: () => ({ "x-csrf-token": "mock-csrf" }),
  }),
}));

const globalStubs = {
  UIcon: { template: "<i />" },
  KidMascot: { template: "<div data-testid='mascot-stub' />" },
  ParentGateModal: {
    emits: ["verified", "cancel"],
    template: `
      <div data-testid="parent-gate-stub">
        <button data-testid="gate-verify" @click="$emit('verified', 'valid-gate-token')" />
        <button data-testid="gate-cancel" @click="$emit('cancel')" />
      </div>
    `,
  },
};

describe("KidPlayLimitModal component (Task #286)", () => {
  it("hiển thị lời nhắn ấm áp và 2 gợi ý hoạt động ngoài màn hình (BR-HPL-04, §7.3)", () => {
    const wrapper = mount(KidPlayLimitModal, {
      props: {
        childUuid: "uuid-child-1",
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.text()).toContain("Hôm nay bé chơi giỏi lắm rồi!");
    expect(wrapper.text()).toContain("Vẽ tranh sáng tạo");
    expect(wrapper.text()).toContain("Xếp đồ chơi yêu thích");
    expect(wrapper.find('[data-testid="mascot-stub"]').exists()).toBe(true);
  });

  it("bấm nút về sảnh phát ra emit 'leave'", async () => {
    const wrapper = mount(KidPlayLimitModal, {
      props: {
        childUuid: "uuid-child-1",
      },
      global: { stubs: globalStubs },
    });

    const leaveBtn = wrapper.find('[data-testid="play-limit-leave-btn"]');
    expect(leaveBtn.exists()).toBe(true);

    await leaveBtn.trigger("click");
    expect(wrapper.emitted("leave")).toHaveLength(1);
  });

  it("bấm nút 'Xin ba mẹ thêm giờ' mở Parent Gate và sau khi giải đúng hiển thị tùy chọn cấp thêm giờ", async () => {
    const wrapper = mount(KidPlayLimitModal, {
      props: {
        childUuid: "uuid-child-1",
      },
      global: { stubs: globalStubs },
    });

    const askParentBtn = wrapper.find(
      '[data-testid="play-limit-ask-parent-btn"]'
    );
    expect(askParentBtn.exists()).toBe(true);

    await askParentBtn.trigger("click");
    expect(wrapper.find('[data-testid="parent-gate-stub"]').exists()).toBe(
      true
    );

    // Giả lập phụ huynh giải đúng cổng toán
    await wrapper.find('[data-testid="gate-verify"]').trigger("click");
    await flushPromises();

    // Hiện bảng chọn 15 phút hoặc 30 phút
    const grant15Btn = wrapper.find('[data-testid="grant-15-mins-btn"]');
    const grant30Btn = wrapper.find('[data-testid="grant-30-mins-btn"]');
    expect(grant15Btn.exists()).toBe(true);
    expect(grant30Btn.exists()).toBe(true);
  });

  it("phụ huynh bấm cấp thêm 15 phút gọi API grant-extra-time và emit 'granted'", async () => {
    mockFetch.mockResolvedValueOnce({
      success: true,
      granted_minutes: 15,
      new_total_minutes: 45,
    });

    const wrapper = mount(KidPlayLimitModal, {
      props: {
        childUuid: "uuid-child-1",
      },
      global: { stubs: globalStubs },
    });

    await wrapper
      .find('[data-testid="play-limit-ask-parent-btn"]')
      .trigger("click");
    await wrapper.find('[data-testid="gate-verify"]').trigger("click");
    await flushPromises();

    await wrapper.find('[data-testid="grant-15-mins-btn"]').trigger("click");
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/users/children/uuid-child-1/grant-extra-time",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({
          minutes: 15,
          gate_token: "valid-gate-token",
        }),
      })
    );

    expect(wrapper.emitted("granted")).toEqual([[15]]);
  });

  it("hiển thị thông báo lỗi thân thiện khi API grant-extra-time trả lỗi từ server", async () => {
    mockFetch.mockRejectedValueOnce({
      statusCode: 422,
      data: {
        code: "VALIDATION_ERROR",
        message: "Đã cấp 30 phút hôm nay; tối đa 30 phút/ngày.",
      },
    });

    const wrapper = mount(KidPlayLimitModal, {
      props: {
        childUuid: "uuid-child-1",
      },
      global: { stubs: globalStubs },
    });

    await wrapper
      .find('[data-testid="play-limit-ask-parent-btn"]')
      .trigger("click");
    await wrapper.find('[data-testid="gate-verify"]').trigger("click");
    await flushPromises();

    await wrapper.find('[data-testid="grant-15-mins-btn"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain(
      "Đã cấp 30 phút hôm nay; tối đa 30 phút/ngày."
    );
  });
});
