import { describe, expect, it } from "vitest";
import { GT037Session } from "#src/templates/GT-037/session";
import type { GT037Content } from "#src/templates/GT-037/template";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const CONTENT: GT037Content = {
  prompt: "Con tìm hết số 3 nhé",
  symbols: [
    { id: "sym-target", asset: { kind: "text", text: "3" } },
    { id: "sym-confusable", asset: { kind: "text", text: "8" } },
    { id: "sym-distractor", asset: { kind: "text", text: "5" } },
  ],
  target_ids: ["sym-target"],
  target_copies: 3,
  item_count: 8,
  confusable_ids: ["sym-confusable"],
};

const CHEER_MS = 1200;

function openSession(): GT037Session {
  const session = new GT037Session(CONTENT, {}, 7);
  session.prepareRound("5-6");
  return session;
}

function indicesWhere(session: GT037Session, isTarget: boolean): number[] {
  const found: number[] = [];
  session.boardSymbols.forEach((sym, index) => {
    if (session.targetSet.has(sym.id) === isTarget) {
      found.push(index);
    }
  });
  return found;
}

function tap(session: GT037Session, slotIndex: number): void {
  const symbolId = session.boardSymbols[slotIndex]?.id ?? "";
  session.commit({ type: "tap_symbol", data: { slotIndex, symbolId } });
}

describe("GT-037: khung chuyện, tiếng leng keng, mascot reo ngắn (BR-E037-10)", () => {
  it("storyLine nhắc Gấu Con và việc nhặt đồ bỏ vào lọ", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Gấu Con");
    expect(story).toContain("lọ");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.some((t) => t.includes("Gấu Con"))).toBe(false);
  });

  it("ô đích mới tìm ra xếp một cue star_collect", () => {
    const session = openSession();
    const [target] = indicesWhere(session, true);
    tap(session, target ?? -1);

    expect(session.takeSfxCues()).toEqual(["star_collect"]);
  });

  it("chạm ô sai hoặc ô đã tìm không có cue", () => {
    const session = openSession();
    const [target] = indicesWhere(session, true);
    const [wrong] = indicesWhere(session, false);
    tap(session, target ?? -1);
    session.takeSfxCues();

    tap(session, target ?? -1);
    tap(session, wrong ?? -1);

    expect(session.takeSfxCues()).toEqual([]);
  });

  it("mascot: null → cheer sau ô đích → null sau 1200 ms", () => {
    const session = openSession();
    expect(session.mascotMood()).toBeNull();

    const [target] = indicesWhere(session, true);
    tap(session, target ?? -1);
    expect(session.mascotMood()).toBe("cheer");

    session.update(CHEER_MS - 100);
    expect(session.mascotMood()).toBe("cheer");

    session.update(200);
    expect(session.mascotMood()).toBeNull();
  });

  it("chạm sai không làm mascot reo", () => {
    const session = openSession();
    const [wrong] = indicesWhere(session, false);
    tap(session, wrong ?? -1);

    expect(session.mascotMood()).toBeNull();
  });

  it("tìm đủ thì mascot về null để lớp phủ chung ăn mừng", () => {
    const session = openSession();
    for (const index of indicesWhere(session, true)) {
      tap(session, index);
    }

    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
