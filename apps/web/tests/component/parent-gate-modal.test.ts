// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ParentGateModal from "~/components/parent-gate-modal.vue";

vi.mock("~/composables/use-csrf-fetch", () => ({
  useCsrfHeaders: () => ({
    headers: () => ({ "x-csrf-token": "test-token" }),
  }),
}));

const fetchMock = vi.fn();
const CHALLENGE_REGEX = /(\d+)\s*[x×*]\s*(\d+)/;
const WHITESPACE_REGEX = /\s+/g;

describe("ParentGateModal — khoá tin cậy tách theo mode (Task #260 C2)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      challenge_id: "srv-1",
      factor_a: 3,
      factor_b: 4,
      challenge_payload: "server_payload",
    });
    (globalThis as { $fetch?: unknown }).$fetch = fetchMock;
  });

  it("đường clientOnly ghi trust vào khoá riêng `pg_client_trusted_until`", async () => {
    const wrapper = mount(ParentGateModal, {
      props: { clientOnly: true },
      attachTo: document.body,
      global: { stubs: { UIcon: true } },
    });
    await wrapper.vm.$nextTick();

    // Đố toán sinh tại client: đọc luôn hai thừa số đang hiện để trả lời đúng.
    const text = wrapper.text();
    const match = CHALLENGE_REGEX.exec(text.replace(WHITESPACE_REGEX, " "));
    expect(match, `không tìm thấy đố toán trong: ${text}`).not.toBeNull();
    const expected = Number(match?.[1]) * Number(match?.[2]);

    const input = wrapper.find("input");
    await input.setValue(String(expected));
    await input.trigger("keyup.enter");
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("verified")).toBeTruthy();
    expect(sessionStorage.getItem("pg_client_trusted_until")).not.toBeNull();
    expect(sessionStorage.getItem("pg_server_trusted_until")).toBeNull();
    wrapper.unmount();
  });

  it("Ca âm: trust của client đã có + clientOnly=false → Cấm — NEVER đi tắt, vẫn gọi challenge server", async () => {
    sessionStorage.setItem(
      "pg_client_trusted_until",
      String(Date.now() + 5 * 60 * 1000)
    );

    const wrapper = mount(ParentGateModal, {
      props: { clientOnly: false },
      attachTo: document.body,
      global: { stubs: { UIcon: true } },
    });
    await wrapper.vm.$nextTick();
    await Promise.resolve();

    expect(wrapper.emitted("verified")).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/parent-gate/challenge",
      expect.objectContaining({ method: "POST" })
    );
    wrapper.unmount();
  });

  it("Ca âm: trust của CHÍNH đường server cũng Cấm — NEVER đi tắt (token HMAC không tự sinh được)", async () => {
    sessionStorage.setItem(
      "pg_server_trusted_until",
      String(Date.now() + 5 * 60 * 1000)
    );

    const wrapper = mount(ParentGateModal, {
      props: { clientOnly: false },
      attachTo: document.body,
      global: { stubs: { UIcon: true } },
    });
    await wrapper.vm.$nextTick();
    await Promise.resolve();

    expect(wrapper.emitted("verified")).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("Ca âm: sai 3 lần thì khoá, đóng rồi mở lại VẪN khoá (spec §5, BR-PGT-03)", async () => {
    const wrapper = mount(ParentGateModal, {
      props: { clientOnly: true },
      attachTo: document.body,
      global: { stubs: { UIcon: true } },
    });
    await wrapper.vm.$nextTick();

    const input = wrapper.find("input");
    for (let i = 0; i < 3; i++) {
      // 1 luôn sai: đố toán là tích hai thừa số trong [2, 9].
      await input.setValue("1");
      await input.trigger("keyup.enter");
      await wrapper.vm.$nextTick();
    }

    const failures = wrapper.emitted("parent_gate_failed") ?? [];
    expect(failures).toHaveLength(3);
    expect(failures.at(-1)).toEqual(["locked_3_attempts"]);

    const lockUntil = Number(sessionStorage.getItem("pg_client_lock_until"));
    expect(lockUntil).toBeGreaterThan(Date.now());
    wrapper.unmount();

    // Mở lại: khoá sống trong sessionStorage nên vẫn còn hiệu lực.
    const reopened = mount(ParentGateModal, {
      props: { clientOnly: true },
      attachTo: document.body,
      global: { stubs: { UIcon: true } },
    });
    await reopened.vm.$nextTick();
    expect(reopened.text()).toContain("giây");
    reopened.unmount();
  });

  it("phát parent_gate_shown khi mở", async () => {
    const wrapper = mount(ParentGateModal, {
      props: { clientOnly: true },
      attachTo: document.body,
      global: { stubs: { UIcon: true } },
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("parent_gate_shown")).toHaveLength(1);
    wrapper.unmount();
  });
});
