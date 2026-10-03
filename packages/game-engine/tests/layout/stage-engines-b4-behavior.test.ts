import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones, type StageZones } from "#src/layout/stage-zones";
import { GT005_FIXTURES } from "#src/templates/GT-005/fixtures";
import { GT005Session } from "#src/templates/GT-005/session";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures";
import { GT006Session } from "#src/templates/GT-006/session";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures";
import { GT013Session } from "#src/templates/GT-013/session";
import { GT020_FIXTURES } from "#src/templates/GT-020/fixtures";
import { GT020Session } from "#src/templates/GT-020/session";
import { GT024_FIXTURES } from "#src/templates/GT-024/fixtures";
import { GT024Session } from "#src/templates/GT-024/session";

/**
 * Hành vi riêng của lô B4 (Task #283) trong khung năm vùng: nút xong của GT-006,
 * cử chỉ GT-013/GT-024 bị giới hạn trong stage, thẻ GT-020 giữ trạng thái khi
 * stage đổi, ghép cặp GT-005 ở cột con. Kiểm bố cục chung nằm ở
 * `stage-engines-b4.test.ts`.
 */
const BAND: AgeBand = "5-6";
const PORTRAIT = { w: 330, h: 697 } as const;
const LANDSCAPE_PHONE = { w: 784, h: 250 } as const;

interface Frame {
  readonly zones: StageZones;
  readonly space: { w: number; h: number };
  readonly cssPerLogic: number;
}

function frameFor(
  viewport: { w: number; h: number },
  needsCommit: boolean
): Frame {
  const space = deriveLogicSpace(viewport.w, viewport.h);
  const cssPerLogic = viewport.w / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: BAND,
    cssPerLogic,
    needsTray: false,
    needsCommit,
  });
  return { zones, space, cssPerLogic };
}

function first<T>(items: readonly T[], what: string): T {
  const item = items[0];
  if (item === undefined) {
    throw new Error(`Thiếu ${what}`);
  }
  return item;
}

function centerOf(rect: { x: number; y: number; w: number; h: number }) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

describe("GT-006 — nút xong ở zones.action (BR-PSZ-05)", () => {
  function makeSession(): { session: GT006Session; frame: Frame } {
    const f = first(GT006_FIXTURES, "fixture GT-006");
    const session = new GT006Session(f.content, f.difficulty);
    const frame = frameFor(PORTRAIT, true);
    session.prepareRound(
      BAND,
      frame.space,
      frame.zones.stage,
      undefined,
      frame.cssPerLogic
    );
    return { session, frame };
  }

  function solve(session: GT006Session): void {
    const target = session.content.sequence
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);
    for (let guard = 0; guard < 20; guard++) {
      const current = session.getCurrentSequence();
      const wrong = target.findIndex((id, i) => current[i] !== id);
      if (wrong < 0) {
        return;
      }
      session.reorderSteps(current.indexOf(target[wrong] ?? ""), wrong);
    }
  }

  it("khai needsCommit và luôn sáng nút", () => {
    const { session } = makeSession();

    expect(session.needsCommit).toBe(true);
    expect(session.canCommit()).toBe(true);
    expect(session.commitIcon).toBeUndefined();
  });

  it("commit khi dãy đã đúng thì thắng; commit khi dãy sai thì không", () => {
    const { session } = makeSession();
    const unsolved = session.getCurrentSequence();
    solve(session);
    expect(session.getCurrentSequence()).not.toEqual(unsolved);

    expect(session.dispatch({ type: "commit", timeMs: 0 })?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("commit khi dãy sai ghi sequence_submitted và không thắng", () => {
    const { session } = makeSession();
    session.dispatch({ type: "commit", timeMs: 0 });

    expect(session.checkWinCondition()).toBe(false);
    const submitted = session
      .getTelemetry()
      .events.filter((event) => event.event_name === "sequence_submitted");
    expect(submitted).toHaveLength(1);
  });
});

describe("GT-013 — chạm chỉ trúng ô trong stage", () => {
  it("chạm ở vùng hành động hoặc ngoài stage không thành bước đi", () => {
    const f = first(GT013_FIXTURES, "fixture GT-013");
    const session = new GT013Session(f.content, f.difficulty);
    const frame = frameFor(PORTRAIT, true);
    session.prepareRound(
      BAND,
      frame.space,
      frame.zones.stage,
      undefined,
      frame.cssPerLogic
    );
    const action = centerOf(frame.zones.action);
    const cell = first(session.slots, "ô mê cung");

    expect(session.toAction({ type: "tap", ...action, timeMs: 0 })).toBeNull();
    expect(
      session.toAction({ type: "tap", x: cell.x, y: cell.y, timeMs: 1 })
    ).not.toBeNull();
  });
});

describe("GT-024 — nét vẽ giới hạn trong stage", () => {
  function makeSession(): { session: GT024Session; frame: Frame } {
    const f = first(GT024_FIXTURES, "fixture GT-024");
    const session = new GT024Session(f.content, f.difficulty);
    const frame = frameFor(PORTRAIT, true);
    session.prepareRound(
      BAND,
      frame.space,
      frame.zones.stage,
      undefined,
      frame.cssPerLogic
    );
    return { session, frame };
  }

  it("nét bắt đầu ở vùng hành động bị bỏ dù đi qua waypoint", () => {
    const { session, frame } = makeSession();
    const target = first(session.getView().entities, "waypoint");
    const outside = centerOf(frame.zones.action);

    const fromOutside = session.toAction({
      type: "stroke",
      points: [outside, { x: target.x, y: target.y }],
      timeMs: 0,
    });
    const fromInside = session.toAction({
      type: "stroke",
      points: [{ x: target.x, y: target.y }],
      timeMs: 1,
    });

    expect(fromOutside).toBeNull();
    expect(fromInside?.type).toBe("trace_point");
  });

  it("chạm ở vùng hành động không nối được điểm", () => {
    const { session, frame } = makeSession();

    expect(
      session.toAction({
        type: "tap",
        ...centerOf(frame.zones.action),
        timeMs: 0,
      })
    ).toBeNull();
  });

  it("đổi stage giữa vòng giữ checkpoint đã nối và dời waypoint theo stage mới", () => {
    const { session, frame } = makeSession();
    const target = first(session.getView().entities, "waypoint");
    session.dispatch({ type: "tap", x: target.x, y: target.y, timeMs: 0 });
    const before = session.traceSystem.getCurrentOrderIndex();
    const landscape = frameFor(LANDSCAPE_PHONE, true);

    session.resolveSlots(
      BAND,
      landscape.space,
      landscape.zones.stage,
      undefined,
      landscape.cssPerLogic
    );

    expect(before).toBe(1);
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(before);
    const moved = first(session.getView().entities, "waypoint");
    expect(moved.x).not.toBe(target.x);
    expect(frame.zones.stage.x).toBeLessThanOrEqual(moved.x);
  });
});

describe("GT-020 — thẻ giữ trạng thái khi stage đổi", () => {
  it("lật sai hai thẻ rồi đổi stage: thẻ vẫn ngửa và đóng được sau đó", () => {
    const f = first(GT020_FIXTURES, "fixture GT-020");
    const session = new GT020Session(f.content, f.difficulty);
    const portrait = frameFor(PORTRAIT, false);
    session.prepareRound(
      BAND,
      portrait.space,
      portrait.zones.stage,
      undefined,
      portrait.cssPerLogic
    );
    const firstCard = first(session.displayCards, "thẻ");
    const other = session.displayCards.find(
      (card) => card.pairKey !== firstCard.pairKey
    );
    if (!other) {
      throw new Error("Thiếu thẻ khác cặp");
    }
    session.onTapCard(firstCard.cardId);
    session.onTapCard(other.cardId);

    const landscape = frameFor(LANDSCAPE_PHONE, false);
    session.resolveSlots(
      BAND,
      landscape.space,
      landscape.zones.stage,
      undefined,
      landscape.cssPerLogic
    );

    expect(session.cardSystem.getCard(firstCard.cardId)?.state).toBe("face_up");
    session.closeMismatch();
    expect(session.cardSystem.getCard(firstCard.cardId)?.state).toBe(
      "face_down"
    );
  });
});

describe("GT-005 — ghép cặp khi mỗi bên tách cột con", () => {
  it("điện thoại ngang: chạm nguồn rồi đích đúng cặp thì ghép được", () => {
    const f = first(GT005_FIXTURES, "fixture GT-005");
    const session = new GT005Session(f.content, f.difficulty);
    const frame = frameFor(LANDSCAPE_PHONE, false);
    session.prepareRound(
      BAND,
      frame.space,
      frame.zones.stage,
      undefined,
      frame.cssPerLogic
    );
    const pair = first(f.content.pairs, "cặp");
    const leftIdx = session.displayLeft.findIndex(
      (item) => item.item_id === pair.left.item_id
    );
    const rightIdx = session.displayRight.findIndex(
      (item) => item.item_id === pair.right.item_id
    );
    const left = session.slots[leftIdx];
    const right = session.slots[session.displayLeft.length + rightIdx];
    if (!(left && right)) {
      throw new Error("Thiếu slot");
    }

    session.dispatch({ type: "tap", x: left.x, y: left.y, timeMs: 0 });
    session.dispatch({ type: "tap", x: right.x, y: right.y, timeMs: 1 });

    expect(session.getMatchedPairs().get(pair.left.item_id)).toBe(
      pair.right.item_id
    );
  });
});
