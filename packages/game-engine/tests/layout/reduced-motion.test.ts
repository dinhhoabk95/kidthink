import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { AgeBand } from "#src/contracts/types";
import type { EngineConfig } from "#src/core";
import { type GameSession, TemplateGameSession } from "#src/game-session";
import { createGameSessionSync, preloadGameSession } from "#src/index";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import { drawCommitButton } from "#src/render/commit-button";
import { MASCOT_POSES, mascotMotion } from "#src/render/mascot";
import { RenderSystem } from "#src/systems/render-system";
import { FIXTURES_BY_CODE } from "../fixtures-map.ts";
import { createFakeCanvas } from "../gates/fake-canvas.ts";
import { MIGRATED_CODES } from "./migrated-codes.ts";

/**
 * Reduced-motion (`BR-FBK`, `accessibility.md`): khi `prefers-reduced-motion` bật,
 * khung hình đứng yên của mọi engine đã dời **không đổi theo thời gian** — không
 * tween, không nhấp nháy, không hạt trôi. Kiểm bằng cách vẽ hai khung cách nhau
 * 1,5 giây (cả `timeMs` lẫn `Date.now`) và so toàn bộ lệnh vẽ.
 */
const BAND: AgeBand = "5-6";
const SPACE = deriveLogicSpace(330, 697);
const CSS_PER_LOGIC = Math.min(330 / SPACE.w, 697 / SPACE.h);
const FRAME_GAP_MS = 1500;
const START_TIME_MS = 1_000_000;
const COORD_DIGITS = 2;

const RECORDED_METHODS = [
  "moveTo",
  "lineTo",
  "arc",
  "arcTo",
  "ellipse",
  "bezierCurveTo",
  "quadraticCurveTo",
  "roundRect",
  "rect",
  "fillRect",
  "strokeRect",
  "fillText",
  "strokeText",
  "translate",
  "rotate",
  "scale",
  "drawImage",
] as const;

function round(value: unknown): unknown {
  return typeof value === "number" ? value.toFixed(COORD_DIGITS) : value;
}

/** Phần của session mà phép so khung hình cần. */
type FrameSession = GameSession &
  Pick<
    TemplateGameSession<never, never>,
    | "prepareRound"
    | "trayItemCount"
    | "trayHasLabels"
    | "needsTray"
    | "needsCommit"
  >;

function recordFrame(
  session: FrameSession,
  rs: RenderSystem,
  timeMs: number
): string[] {
  const ctx = createFakeCanvas(SPACE.w, SPACE.h).getContext("2d");
  if (!ctx) {
    throw new Error("không có context");
  }
  const calls: string[] = [];
  for (const method of RECORDED_METHODS) {
    const target = ctx as unknown as Record<string, unknown>;
    if (typeof target[method] !== "function") {
      continue;
    }
    vi.spyOn(
      target as Record<string, (...args: unknown[]) => void>,
      method
    ).mockImplementation((...args: unknown[]) => {
      calls.push(`${method}(${args.map(round).join(",")})`);
    });
  }
  vi.setSystemTime(START_TIME_MS + timeMs);
  session.render?.(ctx as CanvasRenderingContext2D, rs, timeMs);
  return calls;
}

function firstFrameDiff(a: readonly string[], b: readonly string[]): string {
  const index = a.findIndex((call, i) => call !== b[i]);
  return index < 0
    ? `độ dài ${a.length} ≠ ${b.length}`
    : `lệnh ${index}: ${a[index]} ≠ ${b[index]}`;
}

function makeSession(code: string): FrameSession {
  const fixture = FIXTURES_BY_CODE[code]?.[0];
  if (!fixture) {
    throw new Error(`thiếu fixture ${code}`);
  }
  const config: EngineConfig = {
    level_code: `${code}-LV1`,
    content_version: 1,
    template_code: code,
    content_pack: fixture.content,
    difficulty_params: fixture.difficulty,
    theme_id: "default",
    age_band: BAND,
    reduced_motion: true,
    audio_enabled: true,
  };
  const session = createGameSessionSync(code, config);
  if (!(session instanceof TemplateGameSession)) {
    throw new Error(`${code} không phải TemplateGameSession`);
  }
  return session;
}

beforeAll(async () => {
  await Promise.all(MIGRATED_CODES.map((code) => preloadGameSession(code)));
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("reduced-motion — khung hình đứng yên không đổi theo thời gian", () => {
  it.each(MIGRATED_CODES)("%s", (code) => {
    const session = makeSession(code);
    const zones = computeZonesForSession(
      {
        logicW: SPACE.w,
        logicH: SPACE.h,
        ageBand: BAND,
        cssPerLogic: CSS_PER_LOGIC,
      },
      session
    );
    session.prepareRound(
      BAND,
      SPACE,
      zones.stage,
      zones.tray ?? undefined,
      CSS_PER_LOGIC
    );
    const rs = new RenderSystem();
    rs.logicSpace = SPACE;
    rs.reducedMotion = true;
    // Bỏ một khung đầu: vài engine khởi tạo cache ở lần vẽ đầu tiên.
    recordFrame(session, rs, 0);

    const first = recordFrame(session, rs, 0);
    const later = recordFrame(session, rs, FRAME_GAP_MS);

    expect(first.length).toBeGreaterThan(0);
    expect(later, firstFrameDiff(first, later)).toEqual(first);
  });

  it("ca âm: khung có chuyển động theo thời gian bị so sánh báo khác", () => {
    const moving = (timeMs: number): string[] => [
      `arc(${round(100 + timeMs / 10)},50)`,
    ];

    expect(moving(FRAME_GAP_MS)).not.toEqual(moving(0));
  });
});

describe("reduced-motion — primitive dùng chung của shell", () => {
  const MOTION_SAMPLE_MS = 700;
  const BUTTON_RECT = { x: 400, y: 300, w: 96, h: 96 } as const;

  function hintAlphas(reducedMotion: boolean, timeMs: number): string[] {
    const fake = createFakeCanvas(SPACE.w, SPACE.h).getContext("2d");
    if (!fake) {
      throw new Error("không có context");
    }
    const alphas: string[] = [];
    const ctx = new Proxy(fake, {
      set(target, prop, value) {
        if (prop === "globalAlpha") {
          alphas.push(String(round(value)));
        }
        Reflect.set(target, prop, value);
        return true;
      },
    });
    drawCommitButton(
      ctx as unknown as CanvasRenderingContext2D,
      new RenderSystem(),
      BUTTON_RECT,
      {
        enabled: true,
        origin: "top-left",
        hint: { timeMs, reducedMotion },
      }
    );
    return alphas;
  }

  it("mascot đứng yên ở mọi dáng khi reduced-motion", () => {
    for (const pose of MASCOT_POSES) {
      expect(mascotMotion(pose, MOTION_SAMPLE_MS, true)).toEqual(
        mascotMotion(pose, 0, true)
      );
    }
  });

  it("ca âm: không reduced-motion thì có dáng mascot chuyển động theo thời gian", () => {
    const moves = MASCOT_POSES.some(
      (pose) =>
        JSON.stringify(mascotMotion(pose, MOTION_SAMPLE_MS, false)) !==
        JSON.stringify(mascotMotion(pose, 0, false))
    );

    expect(moves).toBe(true);
  });

  it("vòng gợi ý nút hành động không nháy khi reduced-motion", () => {
    expect(hintAlphas(true, 0)).toEqual(hintAlphas(true, 250));
  });

  it("ca âm: vòng gợi ý nháy khi không reduced-motion", () => {
    expect(hintAlphas(false, 0)).not.toEqual(hintAlphas(false, 250));
  });
});
