// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import KidProfileBadge from "~/components/kid/profile-badge.vue";
import KidProfileSwitcherModal from "~/components/kid/profile-switcher-modal.vue";
import type { KidProfileItem } from "~/composables/play/use-kid-profile";

const sampleChildren: KidProfileItem[] = [
  {
    uuid: "uuid-kid-1",
    display_name: "Bé An",
    birth_year: 2021,
    age_band: "3-4",
    avatar_id: "avatar-preset-01",
    relationship: "parent",
    status: "active",
    daily_play_cap_minutes: 30,
  },
  {
    uuid: "uuid-kid-2",
    display_name: "Bé Bình",
    birth_year: 2019,
    age_band: "5-6",
    avatar_id: "avatar-preset-02",
    relationship: "parent",
    status: "active",
    daily_play_cap_minutes: 45,
  },
];

const globalStubs = {
  UIcon: { template: "<i />" },
};

describe("KidProfileBadge component (BR-CPS-06)", () => {
  it("hiển thị tên bé, emoji avatar và nhãn dải tuổi", () => {
    const wrapper = mount(KidProfileBadge, {
      props: {
        activeChild: sampleChildren[0] as KidProfileItem,
        hasMultipleChildren: true,
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.text()).toContain("Bé An");
    expect(wrapper.text()).toContain("Mầm (3–4t)");
    expect(wrapper.attributes("aria-label")).toContain("Bé Bé An");
  });

  it("phát ra request-switch khi click và có nhiều trẻ", async () => {
    const wrapper = mount(KidProfileBadge, {
      props: {
        activeChild: sampleChildren[0] as KidProfileItem,
        hasMultipleChildren: true,
      },
      global: { stubs: globalStubs },
    });

    await wrapper.trigger("click");
    expect(wrapper.emitted("request-switch")).toHaveLength(1);
  });

  it("không phát ra request-switch khi chỉ có 1 trẻ", async () => {
    const wrapper = mount(KidProfileBadge, {
      props: {
        activeChild: sampleChildren[0] as KidProfileItem,
        hasMultipleChildren: false,
      },
      global: { stubs: globalStubs },
    });

    await wrapper.trigger("click");
    expect(wrapper.emitted("request-switch")).toBeUndefined();
  });
});

describe("KidProfileSwitcherModal component (BR-CPS-01..07)", () => {
  it("hiển thị danh sách các bé và đánh dấu bé đang chơi", () => {
    const wrapper = mount(KidProfileSwitcherModal, {
      props: {
        children: sampleChildren,
        activeUuid: "uuid-kid-1",
        isSwitching: false,
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.text()).toContain("Bé An");
    expect(wrapper.text()).toContain("Bé Bình");
    expect(wrapper.text()).toContain("Đang chơi");

    const activeBtn = wrapper.find('[data-testid="switch-child-uuid-kid-1"]');
    expect(activeBtn.attributes("disabled")).toBeDefined();
    expect(activeBtn.attributes("aria-pressed")).toBe("true");

    const otherBtn = wrapper.find('[data-testid="switch-child-uuid-kid-2"]');
    expect(otherBtn.attributes("disabled")).toBeUndefined();
  });

  it("phát ra sự kiện select khi chọn bé khác", async () => {
    const wrapper = mount(KidProfileSwitcherModal, {
      props: {
        children: sampleChildren,
        activeUuid: "uuid-kid-1",
        isSwitching: false,
      },
      global: { stubs: globalStubs },
    });

    const otherBtn = wrapper.find('[data-testid="switch-child-uuid-kid-2"]');
    await otherBtn.trigger("click");

    expect(wrapper.emitted("select")).toHaveLength(1);
    expect(wrapper.emitted("select")?.[0]).toEqual(["uuid-kid-2"]);
  });

  it("hiển thị thông báo lỗi khi có switchError", () => {
    const wrapper = mount(KidProfileSwitcherModal, {
      props: {
        children: sampleChildren,
        activeUuid: "uuid-kid-1",
        switchError: "Cần xác thực cổng phụ huynh.",
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.text()).toContain("Cần xác thực cổng phụ huynh.");
  });

  it("phát ra sự kiện close khi bấm nút Đóng", async () => {
    const wrapper = mount(KidProfileSwitcherModal, {
      props: {
        children: sampleChildren,
        activeUuid: "uuid-kid-1",
      },
      global: { stubs: globalStubs },
    });

    const closeBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Đóng"));
    expect(closeBtn).toBeDefined();
    await closeBtn?.trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});
