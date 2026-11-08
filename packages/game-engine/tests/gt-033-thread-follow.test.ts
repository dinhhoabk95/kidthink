import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { describe, expect, it, vi } from "vitest";
import { ACTION_IGNORED, TemplateGameSession } from "#src/game-session";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  clampYarnThreadTip,
  drawYarnThread,
  YARN_TIP_INSET_PX,
  type YarnThread,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT033_FIXTURES } from "#src/templates/GT-033/fixtures.js";
import {
  GT033_THREAD_RETRACT_MS,
  GT033Session,
} from "#src/templates/GT-033/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";
import { findDrawsOutsideStage } from "./layout/stage-checks.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, drawYarnThread: vi.fn(actual.drawYarnThread) };
});

/** Sợi chỉ kéo dài theo ngón tay (`BR-E033-07`, hook con trỏ `BR-ENG-18`). */
const FIXTURE = GT033_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-033");
}

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

interface Opened {
  readonly session: GT033Session;
  readonly stage: Rect;
  readonly tray: Rect | undefined;
}

function open(cssW = 960, cssH = 540): Opened {
  const session = new GT033Session(FIXTURE.content, FIXTURE.difficulty, 0);
  const space = deriveLogicSpace(cssW, cssH);
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "5-6",
    cssPerLogic: 1,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    trayLabels: session.trayHasLabels,
    stageRows: session.stageRowCount,
    needsCommit: session.needsCommit,
  });
  session.prepareRound("5-6", space, zones.stage, zones.tray ?? undefined, 1);
  return { session, stage: zones.stage, tray: zones.tray ?? undefined };
}

function blank(): number {
  return FIXTURE.content.cells.indexOf(null);
}

function paletteCenter(session: GT033Session, colorId: string) {
  const total = FIXTURE.content.grid.rows * FIXTURE.content.grid.cols;
  const index = FIXTURE.content.palette.findIndex(
    (p) => p.color_id === colorId
  );
  const slot = session.slots[total + index];
  if (!slot) {
    throw new Error("Thiếu slot palette");
  }
  return { x: slot.x, y: slot.y };
}

function cellCenter(session: GT033Session, index: number) {
  const slot = session.slots[index];
  if (!slot) {
    throw new Error("Thiếu slot ô");
  }
  return { x: slot.x, y: slot.y };
}

function eventsOf(session: GT033Session) {
  return session.getTelemetry().events.map((e) => [e.event_name, e.data]);
}

function render(session: GT033Session, reduced: boolean): void {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const rs = new RenderSystem();
  rs.reducedMotion = reduced;
  session.render(ctx as CanvasRenderingContext2D, rs, 0);
}

describe("hook con trỏ mặc định không làm gì (BR-ENG-18)", () => {
  it("TemplateGameSession có hai hook, trả undefined và không đổi trạng thái", () => {
    const { session } = open();
    const base = TemplateGameSession.prototype;
    expect(typeof base.onPointerMove).toBe("function");
    expect(typeof base.onPointerRelease).toBe("function");
    expect(
      base.onPointerMove.call(session, { x: 1, y: 1 }, { x: 0, y: 0 })
    ).toBeUndefined();
    expect(base.onPointerRelease.call(session)).toBeUndefined();
    expect(session.getYarnThread(false)).toBeNull();
  });

  it("chỉ GT-033 ghi đè hook; 36 engine khác thừa kế mặc định", () => {
    const dir = resolve(
      REPO_ROOT,
      "packages",
      "game-engine",
      "src",
      "templates"
    );
    const overriding = readdirSync(dir)
      .filter((name) => name.startsWith("GT-"))
      .filter((name) => {
        const text = readFileSync(resolve(dir, name, "session.ts"), "utf8");
        return (
          text.includes("onPointerMove") || text.includes("onPointerRelease")
        );
      });
    expect(overriding).toEqual(["GT-033"]);
  });
});

describe("GT-033: sợi theo ngón tay (BR-E033-07)", () => {
  it("kéo từ cuộn: sợi đi từ tâm cuộn tới ngón tay, màu cuộn đang kéo", () => {
    const { session } = open();
    const origin = paletteCenter(session, "blue");
    const finger = cellCenter(session, blank());
    session.onPointerMove(finger, origin);

    const thread = session.getYarnThread(false);
    expect(thread?.from).toEqual(origin);
    expect(thread?.to).toEqual(finger);
    expect(thread?.colorId).toBe("blue");
    expect(thread?.straight).toBe(false);
  });

  it("sợi theo toạ độ: điểm mới thì đầu sợi di chuyển theo", () => {
    const { session } = open();
    const origin = paletteCenter(session, "red");
    const a = cellCenter(session, blank());
    session.onPointerMove(a, origin);
    session.onPointerMove({ x: a.x + 10, y: a.y - 6 }, origin);
    expect(session.getYarnThread(false)?.to).toEqual({
      x: a.x + 10,
      y: a.y - 6,
    });
  });

  it("đầu sợi kẹp trong stageRect", () => {
    const { session, stage } = open();
    const origin = paletteCenter(session, "red");
    session.onPointerMove({ x: -500, y: 5000 }, origin);
    const tip = session.getYarnThread(false)?.to;
    expect(tip).toBeDefined();
    expect(tip?.x).toBeGreaterThanOrEqual(stage.x);
    expect(tip?.x).toBeLessThanOrEqual(stage.x + stage.w);
    expect(tip?.y).toBeGreaterThanOrEqual(stage.y);
    expect(tip?.y).toBeLessThanOrEqual(stage.y + stage.h);
    // Nút đầu sợi kể cả viền nằm trọn trong sân khấu.
    expect(clampYarnThreadTip({ x: 1e6, y: -1e6 }, stage)).toEqual({
      x: stage.x + stage.w - YARN_TIP_INSET_PX,
      y: stage.y + YARN_TIP_INSET_PX,
    });
  });

  it("nhấn không trúng cuộn (ô, khoảng trống) thì không có sợi", () => {
    const { session } = open();
    session.onPointerMove({ x: 5, y: 5 }, { x: 5, y: 5 });
    expect(session.getYarnThread(false)).toBeNull();
    session.onPointerMove(cellCenter(session, blank()), cellCenter(session, 0));
    expect(session.getYarnThread(false)).toBeNull();
  });

  it("sợi không lộ đáp án: cùng cuộn thì cùng màu dù ngón tay ở ô nào", () => {
    const { session } = open();
    const origin = paletteCenter(session, "red");
    const keys = new Set<string>();
    for (let i = 0; i < 4; i++) {
      session.onPointerMove(cellCenter(session, i), origin);
      const thread = session.getYarnThread(false);
      keys.add(`${thread?.colorId}|${Object.keys(thread ?? {}).join(",")}`);
    }
    expect(keys.size).toBe(1);
    expect([...keys][0]).toBe("red|from,to,colorId,straight,clip");
  });

  it("render gọi drawYarnThread với đúng sợi khi đang kéo, không gọi khi không kéo", () => {
    const { session } = open();
    vi.mocked(drawYarnThread).mockClear();
    render(session, false);
    expect(drawYarnThread).not.toHaveBeenCalled();

    session.onPointerMove(
      cellCenter(session, blank()),
      paletteCenter(session, "blue")
    );
    render(session, false);
    expect(drawYarnThread).toHaveBeenCalledTimes(1);
    const thread = vi.mocked(drawYarnThread).mock.calls[0]?.[1] as YarnThread;
    expect(thread.colorId).toBe("blue");
  });
});

describe("GT-033: thả sợi (BR-E033-07)", () => {
  it("kéo rồi thả trên ô: kết quả, sự kiện và cue giống hệt chạm-chọn", () => {
    const wrongOrRight = ["red", "blue"] as const;
    for (const color of wrongOrRight) {
      const dragged = open().session;
      const tapped = open().session;
      const origin = paletteCenter(dragged, color);
      const target = cellCenter(dragged, blank());

      dragged.onPointerMove(target, origin);
      const dragVerdict = dragged.dispatch({
        type: "drop",
        fromX: origin.x,
        fromY: origin.y,
        toX: target.x,
        toY: target.y,
        timeMs: 0,
      });
      dragged.onPointerRelease();

      tapped.dispatch({
        type: "tap",
        ...paletteCenter(tapped, color),
        timeMs: 0,
      });
      const tapVerdict = tapped.dispatch({
        type: "tap",
        ...cellCenter(tapped, blank()),
        timeMs: 1,
      });

      expect(dragVerdict).toEqual(tapVerdict);
      expect(dragged.getPlacedCells()).toEqual(tapped.getPlacedCells());
      expect(eventsOf(dragged)).toEqual(eventsOf(tapped));
      expect(dragged.takeSfxCues()).toEqual(tapped.takeSfxCues());
      expect(dragged.mascotMood()).toBe(tapped.mascotMood());
      expect(dragged.getYarnThread(false)).toBeNull();
    }
  });

  it("thả ngoài ô: không đặt, không sự kiện, không cue, không lượt sai; sợi co về trong 200 ms", () => {
    const { session, stage } = open();
    const origin = paletteCenter(session, "red");
    const away = { x: origin.x, y: origin.y - 5 };
    const before = [...session.getPlacedCells()];
    const eventsBefore = eventsOf(session).length;

    session.onPointerMove(away, origin);
    const verdict = session.dispatch({
      type: "drop",
      fromX: origin.x,
      fromY: origin.y,
      toX: 2,
      toY: 2,
      timeMs: 0,
    });
    session.onPointerRelease();

    expect(verdict).toBe(ACTION_IGNORED);
    expect(session.getPlacedCells()).toEqual(before);
    expect(eventsOf(session)).toHaveLength(eventsBefore);
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();

    expect(session.getYarnThread(false)?.to).toEqual(
      clampYarnThreadTip(away, stage)
    );
    session.update(GT033_THREAD_RETRACT_MS / 2);
    expect(session.getYarnThread(false)).not.toBeNull();
    session.update(GT033_THREAD_RETRACT_MS);
    expect(session.getYarnThread(false)).toBeNull();
  });

  it("thả ngoài ô khi sợi dài: đầu sợi co dần về cuộn theo đồng hồ khung", () => {
    const { session } = open();
    const origin = paletteCenter(session, "blue");
    const far = cellCenter(session, blank());
    session.onPointerMove(far, origin);
    session.onPointerRelease();
    const d0 = Math.hypot(far.x - origin.x, far.y - origin.y);
    session.update(GT033_THREAD_RETRACT_MS / 2);
    const mid = session.getYarnThread(false);
    const dMid = Math.hypot(
      (mid?.to.x ?? 0) - origin.x,
      (mid?.to.y ?? 0) - origin.y
    );
    expect(dMid).toBeGreaterThan(0);
    expect(dMid).toBeLessThan(d0);
  });

  it("chạm-chọn cũ vẫn chạy và không vẽ sợi", () => {
    const { session } = open();
    const expected = session.getExpectedColorAt(blank()) ?? "";
    const p = paletteCenter(session, expected);
    session.dispatch({ type: "tap", x: p.x, y: p.y, timeMs: 0 });
    const c = cellCenter(session, blank());
    const verdict = session.dispatch({
      type: "tap",
      x: c.x,
      y: c.y,
      timeMs: 1,
    });
    expect(verdict?.valid).toBe(true);
    expect(session.getPlacedCells()[blank()]).toBe(expected);
    expect(session.getYarnThread(false)).toBeNull();
  });
});

describe("GT-033: reduced_motion (BR-E033-07)", () => {
  it("đang kéo: sợi vẽ thẳng", () => {
    const { session } = open();
    session.onPointerMove(
      cellCenter(session, blank()),
      paletteCenter(session, "red")
    );
    expect(session.getYarnThread(true)?.straight).toBe(true);
    vi.mocked(drawYarnThread).mockClear();
    render(session, true);
    const thread = vi.mocked(drawYarnThread).mock.calls[0]?.[1] as YarnThread;
    expect(thread.straight).toBe(true);
  });

  it("nhả ngoài ô: sợi biến mất ngay, không co", () => {
    const { session } = open();
    session.onPointerMove(
      cellCenter(session, blank()),
      paletteCenter(session, "red")
    );
    session.onPointerRelease();
    expect(session.getYarnThread(true)).toBeNull();
    vi.mocked(drawYarnThread).mockClear();
    render(session, true);
    expect(drawYarnThread).not.toHaveBeenCalled();
  });
});

describe("GT-033: vòng đời sợi (BR-E033-07)", () => {
  it("prepareRound giữa lúc kéo xoá sợi", () => {
    const { session, stage, tray } = open();
    session.onPointerMove(
      cellCenter(session, blank()),
      paletteCenter(session, "red")
    );
    expect(session.getYarnThread(false)).not.toBeNull();
    session.prepareRound("5-6", deriveLogicSpace(960, 540), stage, tray, 1);
    expect(session.getYarnThread(false)).toBeNull();
  });

  it("đổi khung giữa lúc kéo: sợi đi từ tâm cuộn ở bố cục mới, đầu sợi kẹp sân khấu mới", () => {
    const { session } = open();
    const finger = cellCenter(session, blank());
    session.onPointerMove(finger, paletteCenter(session, "blue"));
    const space = deriveLogicSpace(844, 390);
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "5-6",
      cssPerLogic: 1,
      needsTray: session.needsTray,
      trayItems: session.trayItemCount,
      trayLabels: session.trayHasLabels,
      stageRows: session.stageRowCount,
      needsCommit: session.needsCommit,
    });
    session.resolveSlots("5-6", space, zones.stage, zones.tray ?? undefined, 1);
    const thread = session.getYarnThread(false);
    expect(thread?.from).toEqual(paletteCenter(session, "blue"));
    expect(thread?.to).toEqual(clampYarnThreadTip(finger, zones.stage));
  });

  it("đã thắng thì kéo không vẽ sợi", () => {
    const { session } = open();
    for (const [i, cell] of FIXTURE.content.cells.entries()) {
      if (cell !== null) {
        continue;
      }
      const color = session.getExpectedColorAt(i) ?? "";
      const from = paletteCenter(session, color);
      const to = cellCenter(session, i);
      session.dispatch({
        type: "drop",
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        timeMs: 0,
      });
    }
    expect(session.checkWinCondition()).toBe(true);
    session.onPointerMove(
      cellCenter(session, 0),
      paletteCenter(session, "red")
    );
    expect(session.getYarnThread(false)).toBeNull();
  });
});

describe("GT-033: kéo-thả khi chưa cầm màu (BR-E033-07, BR-E033-08)", () => {
  it("chưa chọn màu: kéo cuộn thả vào ô vẫn đặt sợi và cuộn đó thành màu đang cầm", () => {
    const { session } = open();
    expect(session.getSelectedColorId()).toBeNull();
    const origin = paletteCenter(session, "blue");
    const target = cellCenter(session, blank());
    session.dispatch({
      type: "drop",
      fromX: origin.x,
      fromY: origin.y,
      toX: target.x,
      toY: target.y,
      timeMs: 0,
    });
    expect(session.getPlacedCells()[blank()]).toBe("blue");
    expect(session.getSelectedColorId()).toBe("blue");
  });
});

describe("GT-033: sợi chỉ vẽ trong sân khấu và khay (BR-PSZ-01)", () => {
  for (const [cssW, cssH] of [
    [960, 540],
    [390, 844],
    [844, 390],
  ] as const) {
    it(`${cssW}x${cssH}: ngón tay ra ngoài mọi phía, mọi điểm vẽ của sợi vẫn trong sân khấu hoặc khay`, () => {
      const { session, stage, tray } = open(cssW, cssH);
      expect(tray).toBeDefined();
      const origin = paletteCenter(session, "red");
      for (const finger of [
        { x: -1e4, y: -1e4 },
        { x: 1e4, y: 1e4 },
        { x: -1e4, y: 1e4 },
        { x: 1e4, y: -1e4 },
      ]) {
        session.onPointerMove(finger, origin);
        const thread = session.getYarnThread(false);
        if (!(thread && tray)) {
          throw new Error("Thiếu sợi hoặc khay");
        }
        expect(thread.clip).toEqual([stage, tray]);
        const draw = (ctx: CanvasRenderingContext2D): void =>
          drawYarnThread(ctx, thread);
        const outStage = findDrawsOutsideStage(stage, draw);
        const outTray = new Set(findDrawsOutsideStage(tray, draw));
        expect(outStage.filter((v) => outTray.has(v))).toEqual([]);
      }
    });
  }
});
