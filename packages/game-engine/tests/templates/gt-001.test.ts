import { getByGlyph } from "@mindkid/emoji";
import { describe, expect, it } from "vitest";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures";
import { GT001Session } from "#src/templates/GT-001/session";
import { GT001ContentSchema } from "#src/templates/GT-001/template";

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

    const targetEntity = view.entities.find((e) => e.role === "neutral");
    expect(targetEntity).toBeDefined();
    expect(targetEntity?.id).toBe(`prompt:${content.target_item.item_id}`);

    const expected =
      content.target_item.asset.kind === "emoji"
        ? getByGlyph(content.target_item.asset.ref)?.name
        : undefined;
    expect(targetEntity?.spokenLabel).toBe(expected);
  });

  it("id thẻ đề Cấm — NEVER trùng id lựa chọn, kể cả khi content dùng chung item_id (Task #274, E1)", () => {
    // Dạng của 2.976/2.976 vòng GT-001 trong DB (đo 2026-09-19): bộ sinh
    // level đặt `target_item.item_id` bằng đúng id của lựa chọn đúng.
    const correct = content.options.find((o) => o.is_correct);
    if (!correct) {
      throw new Error("Fixture thiếu lựa chọn đúng");
    }
    const session = new GT001Session(
      {
        ...content,
        target_item: { ...content.target_item, item_id: correct.item_id },
      },
      difficulty,
      1
    );
    session.prepareRound("4-5");

    const ids = session.getView().entities.map((e) => e.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(correct.item_id);
  });

  it("chạm vào thẻ đề Cấm — NEVER tính là lượt trả lời (nằm ngoài this.slots)", () => {
    const session = buildSession();
    const view = session.getView();
    const targetEntity = view.entities.find((e) => e.role === "neutral");
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

/**
 * Từ khoá có mp3 riêng thì đọc bằng mp3 trước TTS (`play-narration.md` §7,
 * Task #274 S7b): `audio_path` tuỳ chọn trên asset `emoji`/`text`.
 */
describe("GT-001 — mp3 của từ khoá (Task #274 S7b)", () => {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-001 not found");
  }
  const KEYWORD_MP3 = "/audio/voice/fixture/qua-tao.mp3";

  it("hợp đồng nhận audio_path tuỳ chọn trên asset, từ chối chuỗi rỗng", () => {
    const withAudio = {
      ...fixture.content,
      target_item: {
        ...fixture.content.target_item,
        asset: { kind: "emoji", ref: "🍎", audio_path: KEYWORD_MP3 },
      },
    };
    expect(GT001ContentSchema.safeParse(withAudio).success).toBe(true);

    const emptyAudio = {
      ...withAudio,
      target_item: {
        ...withAudio.target_item,
        asset: { kind: "emoji", ref: "🍎", audio_path: "" },
      },
    };
    expect(GT001ContentSchema.safeParse(emptyAudio).success).toBe(false);
  });

  it("getView() mang spokenAudioPath của thẻ đề và của lựa chọn", () => {
    const session = new GT001Session(
      {
        ...fixture.content,
        target_item: {
          ...fixture.content.target_item,
          asset: { kind: "emoji", ref: "🍎", audio_path: KEYWORD_MP3 },
        },
      },
      fixture.difficulty,
      1
    );
    session.prepareRound("4-5");

    const promptCard = session
      .getView()
      .entities.find((e) => e.role === "neutral");
    expect(promptCard?.spokenAudioPath).toBe(KEYWORD_MP3);
    const options = session
      .getView()
      .entities.filter((e) => e.role !== "neutral");
    expect(options.every((e) => e.spokenAudioPath === undefined)).toBe(true);
  });
});
