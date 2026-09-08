// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import VictoryModal from "~/components/kid/victory-modal.vue";

/**
 * Harness DOM cho bề mặt chơi (Task #260 T13/T15).
 * Chỉ `tests/component/` chạy trong happy-dom; phần còn lại của apps/web giữ
 * môi trường node.
 */
describe("KidVictoryModal", () => {
  it("stars = 1 thì hiện đúng 1 sao", () => {
    const wrapper = mount(VictoryModal, {
      props: { show: true, stars: 1 },
    });

    expect(wrapper.findAll(".star-icon")).toHaveLength(1);
  });

  it("stars = 3 thì hiện đúng 3 sao", () => {
    const wrapper = mount(VictoryModal, {
      props: { show: true, stars: 3 },
    });

    expect(wrapper.findAll(".star-icon")).toHaveLength(3);
  });

  it("stars = null thì Cấm — NEVER hiện sao nào", () => {
    const wrapper = mount(VictoryModal, {
      props: { show: true, stars: null },
    });

    expect(wrapper.findAll(".star-icon")).toHaveLength(0);
    expect(wrapper.find(".stars-arc").exists()).toBe(false);
  });

  it("Ca âm: DOM Cấm — NEVER chứa chuỗi `Điểm` (BR-FBK: trẻ mầm non không đọc điểm số)", () => {
    const wrapper = mount(VictoryModal, {
      props: { show: true, stars: 2, celebration: "good" },
    });

    expect(wrapper.text()).not.toContain("Điểm");
    expect(wrapper.text()).not.toContain("điểm");
  });

  it("`/complete` lỗi (celebration nice_try, stars null) thì Cấm — NEVER khen `Bé Giỏi Quá!`", () => {
    const wrapper = mount(VictoryModal, {
      props: { show: true, stars: null, celebration: "nice_try" },
    });

    expect(wrapper.text()).not.toContain("Bé Giỏi Quá!");
    expect(wrapper.text()).toContain("Bé Đã Hoàn Thành!");
  });

  it("Escape đóng modal và trả focus về phần tử gọi (BR-A11-12)", async () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();

    const wrapper = mount(VictoryModal, {
      props: { show: true, stars: 3 },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(wrapper.emitted("continue")).toHaveLength(1);

    wrapper.unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("Tab vòng trong modal Cấm — NEVER thoát ra nền", async () => {
    const outside = document.createElement("button");
    outside.textContent = "ngoài";
    document.body.appendChild(outside);

    const wrapper = mount(VictoryModal, {
      props: { show: true, stars: 3 },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBeGreaterThan(1);

    const last = buttons.at(-1)?.element as HTMLElement;
    last.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));

    expect(document.activeElement).not.toBe(outside);
    expect(wrapper.element.contains(document.activeElement)).toBe(true);

    wrapper.unmount();
    outside.remove();
  });
});
