import { describe, expect, it, vi } from "vitest";
import { CARD_FLIP_MS, cardFlipPose } from "#src/render/flashcard";
import { RenderSystem } from "#src/systems/render-system";
import { GT020_FIXTURES } from "#src/templates/GT-020/fixtures.js";
import { GT020Session } from "#src/templates/GT-020/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Thẻ lật giả 3D bằng co scaleX (`BR-E020-08`). */
const FIXTURE = GT020_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-020");
}

function openSession(): GT020Session {
  const session = new GT020Session(FIXTURE.content, FIXTURE.difficulty);
  session.prepareRound("3-4");
  session.update(FIXTURE.difficulty.peek_all_initial_ms + 1);
  return session;
}

/** Các giá trị scaleX mà một khung vẽ đã áp lên canvas. */
function scalesAt(
  session: GT020Session,
  rs: RenderSystem,
  timeMs: number
): number[] {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const scales: number[] = [];
  vi.spyOn(ctx, "scale").mockImplementation((x: number) => {
    scales.push(x);
  });
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return scales;
}

/** Các chuỗi mà một khung vẽ đã `fillText` lên canvas (emoji của asset nằm ở đây). */
function textsAt(
  session: GT020Session,
  rs: RenderSystem,
  timeMs: number
): string[] {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const texts: string[] = [];
  vi.spyOn(ctx, "fillText").mockImplementation((text: string) => {
    texts.push(text);
  });
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return texts;
}

function flipFirstCard(session: GT020Session): void {
  const card = session.displayCards[0];
  session.commit({ type: "tap_card", data: { card_id: card?.cardId ?? "" } });
}

describe("cardFlipPose (hàm thuần)", () => {
  it("bắt đầu đầy đủ chiều ngang, mỏng nhất ở giữa, mặt mới sau nửa vòng", () => {
    expect(cardFlipPose(0, false)).toEqual({ scaleX: 1, showsNewFace: false });

    const mid = cardFlipPose(CARD_FLIP_MS / 2, false);
    expect(mid.scaleX).toBeLessThan(0.1);
    expect(mid.showsNewFace).toBe(true);

    expect(cardFlipPose(CARD_FLIP_MS * 0.25, false).showsNewFace).toBe(false);
  });

  it("hết thời gian hoặc reduced-motion là trạng thái cuối: mặt mới, không co", () => {
    expect(cardFlipPose(CARD_FLIP_MS, false)).toEqual({
      scaleX: 1,
      showsNewFace: true,
    });
    expect(cardFlipPose(30, true)).toEqual({ scaleX: 1, showsNewFace: true });
  });

  it("không bao giờ co về 0 (tránh ma trận suy biến)", () => {
    for (let ms = 0; ms <= CARD_FLIP_MS; ms += 5) {
      expect(cardFlipPose(ms, false).scaleX).toBeGreaterThan(0);
    }
  });
});

describe("GT-020: session vẽ thẻ lật (BR-E020-08)", () => {
  it("thẻ đứng yên thì không co", () => {
    const session = openSession();
    expect(scalesAt(session, new RenderSystem(), 1000)).toEqual([]);
  });

  it("lật thẻ: giữa nhịp lật co mỏng, hết nhịp trả về không co", () => {
    const session = openSession();
    const rs = new RenderSystem();
    scalesAt(session, rs, 1000);
    flipFirstCard(session);
    scalesAt(session, rs, 1100);

    const mid = scalesAt(session, rs, 1100 + CARD_FLIP_MS / 2);
    expect(Math.min(...mid)).toBeLessThan(0.1);

    expect(scalesAt(session, rs, 1100 + CARD_FLIP_MS + 20)).toEqual([]);
  });

  it("nửa đầu nhịp lật vẫn vẽ mặt úp: không lộ asset trước khi bung mặt ngửa", () => {
    const session = openSession();
    const rs = new RenderSystem();
    scalesAt(session, rs, 1000);
    flipFirstCard(session);
    const cardAsset = session.displayCards[0]?.asset;
    if (cardAsset?.kind !== "emoji") {
      throw new Error("Fixture GT-020 đầu phải là thẻ emoji");
    }
    const asset = cardAsset.ref;
    expect(textsAt(session, rs, 1100)).not.toContain(asset);
    expect(textsAt(session, rs, 1100 + CARD_FLIP_MS / 4)).not.toContain(asset);
    expect(textsAt(session, rs, 1100 + CARD_FLIP_MS + 20)).toContain(asset);
  });

  it("reduced-motion: không bao giờ co thẻ", () => {
    const session = openSession();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    scalesAt(session, rs, 1000);
    flipFirstCard(session);
    scalesAt(session, rs, 1100);

    const during = scalesAt(session, rs, 1100 + CARD_FLIP_MS / 2);
    expect(during.every((x) => x === 1)).toBe(true);
  });

  it("lật không đổi luật: thẻ vẫn chuyển sang ngửa ngay khi chạm", () => {
    const session = openSession();
    flipFirstCard(session);
    const card = session.displayCards[0];
    expect(session.cardSystem.getCard(card?.cardId ?? "")?.state).toBe(
      "face_up"
    );
  });
});
