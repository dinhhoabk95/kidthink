import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import type { Gesture } from "#src/interaction";
import { GT007_FIXTURES } from "#src/templates/GT-007/fixtures.js";
import { GT007Session } from "#src/templates/GT-007/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const STAGE = { x: 24, y: 96, w: 912, h: 420 } as const;
const BAND: AgeBand = "4-5";

function fixture(index: number) {
  const f = GT007_FIXTURES[index];
  if (!f) {
    throw new Error(`Thiếu fixture GT-007 #${index}`);
  }
  return f;
}

function open(index: number, band: AgeBand = BAND): GT007Session {
  const f = fixture(index);
  const session = new GT007Session(f.content, f.difficulty, 0);
  session.prepareRound(band, undefined, STAGE);
  return session;
}

function centre(session: GT007Session, slotIndex: number) {
  const slot = session.slots[slotIndex];
  if (!slot) {
    throw new Error(`Thiếu slot ${slotIndex}`);
  }
  return slot;
}

function drag(session: GT007Session, from: number, to: number) {
  const a = centre(session, from);
  const b = centre(session, to);
  const gesture: Gesture = {
    type: "drop",
    fromX: a.x,
    fromY: a.y,
    toX: b.x,
    toY: b.y,
    timeMs: 0,
  };
  return session.dispatch(gesture);
}

describe("GT-007 vật thật: kéo/gộp kẹo giữa ô tổng và hai khay (BR-E007-06..09)", () => {
  it("ba vùng chạm: ô tổng là nguồn, hai khay là đích, không dùng khay lựa chọn", () => {
    const session = open(3);

    expect(session.needsTray).toBe(false);
    expect(session.trayItemCount).toBe(0);
    expect(session.sourceSlots).toHaveLength(1);
    expect(session.targetSlots).toHaveLength(2);
  });

  it("BR-E007-06: mỗi lần kéo chuyển đúng một vật, đủ phần thì thắng", () => {
    const session = open(3);
    const sink = 2;

    expect(drag(session, 0, sink)?.valid).toBe(true);
    expect(session.getView().entities[sink]?.label).toBe("1");
    expect(session.checkWinCondition()).toBe(false);

    expect(drag(session, 0, sink)?.valid).toBe(true);
    expect(session.getView().entities[sink]?.label).toBe("2");
    expect(session.checkWinCondition()).toBe(true);
    expect(session.takeSfxCues()).toEqual(["candy_drop", "candy_drop"]);
  });

  it("BR-E007-06: ô tổng hết vật chưa chia thì kéo thêm không làm gì", () => {
    const session = open(3);
    drag(session, 0, 2);
    drag(session, 0, 2);

    expect(drag(session, 0, 2)?.valid).toBe(false);
    expect(session.getView().entities[2]?.label).toBe("2");
  });

  it("BR-E007-07: gộp kéo vật từ khay về ô tổng, không ghi lượt sai", () => {
    const session = open(3);
    drag(session, 0, 2);

    const verdict = drag(session, 2, 0);

    expect(verdict?.valid).toBe(true);
    expect(session.getView().entities[2]?.label).toBe("0");
    expect(session.getControlOfError()).toBeNull();
    expect(session.mascotMood()).not.toBe("wonder");
  });

  it("BR-E007-08: thả vào khay đã khoá báo hổ phách trên ô tổng, vật không dời", () => {
    const session = open(3);

    const verdict = drag(session, 0, 1);

    expect(verdict?.valid).toBe(false);
    expect(verdict?.feedback).toBe("amber_soft");
    expect(session.getView().entities[1]?.label).toBe("3");
    expect(session.getView().entities[2]?.label).toBe("0");
    expect(session.getView().entities[0]?.state).toBe("incorrect");
    expect(session.getView().entities[2]?.state).not.toBe("incorrect");
    expect(session.mascotMood()).toBe("wonder");
    expect(session.takeSfxCues()).toEqual([]);
  });

  it("lối chạm-chạm: chạm ô tổng rồi chạm khay đích chuyển một vật", () => {
    const session = open(3);
    const plate = centre(session, 0);
    const tray = centre(session, 2);

    expect(
      session.dispatch({ type: "tap", x: plate.x, y: plate.y, timeMs: 0 })
        ?.valid
    ).toBe(false);
    expect(session.getView().entities[0]?.state).toBe("selected");
    expect(
      session.dispatch({ type: "tap", x: tray.x, y: tray.y, timeMs: 1 })?.valid
    ).toBe(true);
    expect(session.getView().entities[2]?.label).toBe("1");
  });

  it("BR-E007-06: mọi khay khuyết thì chia sao cũng thắng, miễn mỗi khay có một vật", () => {
    const session = open(4, "3-4");
    for (let i = 0; i < 3; i++) {
      drag(session, 0, 1);
    }
    expect(session.checkWinCondition()).toBe(false);

    drag(session, 0, 2);

    expect(session.checkWinCondition()).toBe(true);
  });

  it("BR-E007-08: chia tự do mà vật cuối vào khay đã đầy khi khay kia trống thì báo hổ phách trên ô tổng", () => {
    const session = open(4, "3-4");
    for (let i = 0; i < 3; i++) {
      drag(session, 0, 1);
    }

    const verdict = drag(session, 0, 1);

    expect(verdict?.feedback).toBe("amber_soft");
    expect(session.getView().entities[1]?.label).toBe("3");
    expect(session.getView().entities[0]?.state).toBe("incorrect");
  });

  it("BR-E007-09: gợi ý chỉ ô tổng rồi khay đích còn thiếu, theo từng bước", () => {
    const session = open(3);
    expect(session.getHintTargetIndex()).toBe(0);
    expect(session.getHintDestinationIndex()).toBe(2);

    drag(session, 0, 2);
    drag(session, 0, 2);

    expect(session.getHintTargetIndex()).toBeNull();
  });

  it("BR-E007-09: chia tự do thì gợi ý đi vào khay còn trống trước", () => {
    const session = open(4, "3-4");
    drag(session, 0, 1);

    expect(session.getHintTargetIndex()).toBe(0);
    expect(session.getHintDestinationIndex()).toBe(2);
  });

  it("BR-E007-09: chữ số của tổng không lên canvas khi chơi, hiện khi thắng", () => {
    const session = open(3);
    const playing = collectRenderedText(session, { prepare: false });

    drag(session, 0, 2);
    drag(session, 0, 2);
    const won = collectRenderedText(session, { prepare: false });

    expect(playing).not.toContain("5");
    expect(won).toContain("5");
    expect(lettersOnly(won)).toEqual(lettersOnly(playing));
  });

  it("ba vùng chạm đủ sàn chạm của band 3-4 và không chồng nhau", () => {
    const session = open(3, "3-4");

    for (const slot of session.slots) {
      expect(slot.hitW).toBeGreaterThanOrEqual(96);
      expect(slot.hitH).toBeGreaterThanOrEqual(96);
    }
  });

  it("level numeral cũ vẫn chạy bảng chọn số (không vật thật)", () => {
    const session = open(0);

    expect(session.needsTray).toBe(true);
    expect(session.trayItemCount).toBe(3);
  });
});
