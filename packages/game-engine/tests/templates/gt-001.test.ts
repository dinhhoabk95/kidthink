import { getByGlyph } from "@mindkid/emoji";
import { describe, expect, it } from "vitest";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures";
import { GT001Session } from "#src/templates/GT-001/session";

/**
 * `GT-001/template.ts` khai `input.tolerance_px: 24` — dung sai chạm hợp
 * đồng của cả 37 engine tap. `toAction()` phải dùng đúng số này, không phải
 * một hằng số khác tự chọn (Task #273 — chạm bị nuốt oan khi dung sai co lại).
 */
describe("GT-001 — dung sai chạm (BR-E001, tolerance_px hợp đồng)", () => {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-001 not found");
  }
  const { content, difficulty } = fixture;

  function buildSession(): GT001Session {
    const session = new GT001Session(content, difficulty, 1);
    session.prepareRound("4-5");
    return session;
  }

  it("chạm đúng tâm thẻ luôn trúng", () => {
    const session = buildSession();
    const slot = session.slots[0];
    if (!slot) {
      throw new Error("Thiếu slot đầu tiên");
    }

    const action = session.toAction({
      type: "tap",
      x: slot.x,
      y: slot.y,
      timeMs: 0,
    });

    expect(action).not.toBeNull();
  });

  it("chạm lệch tâm 68px theo chiều dọc (trong dung sai 24px) vẫn trúng", () => {
    const session = buildSession();
    const slot = session.slots[0];
    if (!slot) {
      throw new Error("Thiếu slot đầu tiên");
    }
    const radius = Math.min(slot.hitW, slot.hitH) / 2;

    // Lệch theo TRỤC DỌC (không lệch x) để không vô tình lại gần thẻ bên
    // cạnh — các thẻ nằm cùng hàng ngang. 68px = bán kính thẻ (52px) + 16px,
    // nằm trong dung sai 24px của hợp đồng nhưng NGOÀI dung sai 8px cũ.
    const offset = radius + 16;
    const action = session.toAction({
      type: "tap",
      x: slot.x,
      y: slot.y + offset,
      timeMs: 0,
    });

    expect(action).not.toBeNull();
  });

  it("chạm ra ngoài mọi thẻ, quá xa mọi dung sai, không trúng slot nào", () => {
    const session = buildSession();

    const action = session.toAction({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });

    expect(action).toBeNull();
  });

  it("chạm ra ngoài slot bị nuốt, Cấm — NEVER tính là chạm sai (BR-ETS-02)", () => {
    const session = buildSession();

    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });

    expect(verdict?.feedback).toBe("none");
    expect(verdict?.valid).toBe(false);
  });
});

/**
 * Chạm lại vào hình minh hoạ (thẻ đề giữa màn) phải đọc lại được từ khoá —
 * yêu cầu trực tiếp của người đặt việc (Task #273). Thẻ đề không phải một
 * lựa chọn để chấm đúng/sai, nên nó là một `ViewEntity` role `neutral`,
 * không nằm trong `this.slots` (danh sách chấm điểm).
 */
describe("GT-001 — chạm lại thẻ đề để nghe lại từ khoá (Task #273)", () => {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-001 not found");
  }
  const { content, difficulty } = fixture;

  function buildSession(): GT001Session {
    const session = new GT001Session(content, difficulty, 1);
    session.prepareRound("4-5");
    return session;
  }

  it("getView() có entity cho thẻ đề, role neutral, spokenLabel đúng từ khoá", () => {
    const session = buildSession();
    const view = session.getView();

    const targetEntity = view.entities.find(
      (e) => e.id === content.target_item.item_id
    );
    expect(targetEntity).toBeDefined();
    expect(targetEntity?.role).toBe("neutral");

    const expected =
      content.target_item.asset.kind === "emoji"
        ? getByGlyph(content.target_item.asset.ref)?.name
        : undefined;
    expect(targetEntity?.spokenLabel).toBe(expected);
  });

  it("chạm vào thẻ đề Cấm — NEVER tính là lượt trả lời (nằm ngoài this.slots)", () => {
    const session = buildSession();
    const view = session.getView();
    const targetEntity = view.entities.find(
      (e) => e.id === content.target_item.item_id
    );
    if (!targetEntity) {
      throw new Error("Thiếu entity thẻ đề");
    }

    const action = session.toAction({
      type: "tap",
      x: targetEntity.x,
      y: targetEntity.y,
      timeMs: 0,
    });

    expect(action).toBeNull();
  });
});
