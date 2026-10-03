import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
} from "#src/index";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones, type StageZones } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { RenderSystem } from "#src/systems/render-system";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures";
import { GT030Session } from "#src/templates/GT-030/session";
import { GT031_FIXTURES } from "#src/templates/GT-031/fixtures";
import { GT031Session } from "#src/templates/GT-031/session";
import { GT033_FIXTURES } from "#src/templates/GT-033/fixtures";
import { GT033Session } from "#src/templates/GT-033/session";
import { FIXTURES_BY_CODE, type FixturePayload } from "../fixtures-map.ts";
import {
  GT030LegacyLayoutSession,
  GT031LegacyLayoutSession,
  GT033LegacyLayoutSession,
} from "./fixtures/b6-legacy-layout.ts";
import {
  findDrawsOutsideStage,
  findHitPairViolations,
  findSlotsOutsideStage,
} from "./stage-checks.ts";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  // Nền cảnh phủ cả canvas là lớp 1 của khung, không phải phần engine vẽ.
  return { ...actual, drawSceneBackground: vi.fn() };
});

/**
 * Lô B6 của Task #283: ba engine xây, đo, đong (GT-030, 031, 033) vào khung năm
 * vùng — vật nguồn trong `zones.tray`, đích trong `zones.stage` (`BR-PSZ-01`),
 * vùng chạm không chồng (`BR-LAY-05`), kéo từ khay và chạm-chạm (`BR-ENG-06`)
 * đều chơi hết vòng. Cả ba `needsCommit = false`: đáp án chốt bằng chính cú chạm
 * (GT-030 chạm đáp án, GT-031 tổng đủ, GT-033 lưới đủ) — xem phiếu engine mục 4.
 */
interface Viewport {
  readonly name: string;
  readonly cssW: number;
  readonly cssH: number;
}

const VIEWPORTS: readonly Viewport[] = [
  { name: "portrait 330x697", cssW: 330, cssH: 697 },
  { name: "điện thoại ngang 610x350", cssW: 610, cssH: 350 },
  { name: "máy tính 964x628", cssW: 964, cssH: 628 },
];

/** Cả ba engine chỉ chơi ở band 5-6 (`banned_age_bands`). */
const BAND: AgeBand = "5-6";

/**
 * Nợ đã đo (Task #283 B6): số ca (mẫu + seed) có slot ra ngoài vùng của nó,
 * hai vùng chạm cách nhau dưới `SLOT_GAP_PX`, hoặc lệnh vẽ ngoài sân khấu và
 * khay, theo `mã|khung`. Cặp không có tên ở đây phải bằng 0. Số chỉ được giảm.
 */
const KNOWN_LAYOUT_DEBT_CASES: Readonly<Record<string, number>> = {
  // Số đo sau khi khay nhiều hàng, không phân trang và cột lời dẫn bên trái
  // (`play-stage-zones.md` `BR-PSZ-13`). Còn lại là giới hạn vật lý: sàn chạm của
  // band ở canvas thấp làm số ô cần xếp lớn hơn diện tích sân khấu. Chỉ được giảm.
  "GT-030|máy tính 964x628": 43,
  "GT-030|portrait 330x697": 6,
  "GT-030|điện thoại ngang 610x350": 6,
  "GT-033|máy tính 964x628": 5,
  "GT-033|điện thoại ngang 610x350": 2,
};

const B6_CODES: readonly string[] = ["GT-030", "GT-031", "GT-033"];

const PLAY_TIME_MS = 0;
const MAX_MOVES = 64;

type B6Session = GT030Session | GT031Session | GT033Session;

interface B6Case {
  readonly name: string;
  readonly create: () => B6Session;
}

function isFixturePayload(val: unknown): val is FixturePayload {
  return typeof val === "object" && val !== null;
}

function configFor(
  code: string,
  content: unknown,
  difficulty: unknown
): EngineConfig {
  return {
    level_code: `${code}-LV1`,
    content_version: 1,
    template_code: code,
    content_pack: isFixturePayload(content) ? content : {},
    difficulty_params: isFixturePayload(difficulty) ? difficulty : {},
    theme_id: "default",
    age_band: BAND,
    reduced_motion: false,
    audio_enabled: true,
  };
}

function narrow(code: string, session: unknown): B6Session {
  if (
    session instanceof GT030Session ||
    session instanceof GT031Session ||
    session instanceof GT033Session
  ) {
    return session;
  }
  throw new Error(`${code} không phải session B6`);
}

function casesFor(code: string): B6Case[] {
  const make = (config: EngineConfig): B6Session =>
    narrow(code, createGameSessionSync(code, config));
  const fromFixtures = (FIXTURES_BY_CODE[code] ?? []).map((f, i) => ({
    name: `mẫu ${i}`,
    create: () => make(configFor(code, f.content, f.difficulty)),
  }));
  const fromSeeds = ALL_SEED_LEVELS.filter(
    (level) => level.header.template_code === code
  ).map((level) => ({
    name: `seed ${level.header.code}`,
    create: () =>
      make(configFor(code, level.content_pack, level.difficulty_params)),
  }));
  return [...fromFixtures, ...fromSeeds];
}

interface Frame {
  readonly zones: StageZones;
  readonly space: { w: number; h: number };
  readonly cssPerLogic: number;
}

interface TrayFlags {
  readonly needsTray: boolean;
  readonly trayItemCount: number;
  readonly trayHasLabels?: boolean;
}

function frameFor(viewport: Viewport, tray: TrayFlags): Frame {
  const space = deriveLogicSpace(viewport.cssW, viewport.cssH);
  // Cùng phép của `RenderSystem.setupCanvas`: tỉ lệ chặn bởi cạnh chật hơn.
  const cssPerLogic = Math.min(
    viewport.cssW / space.w,
    viewport.cssH / space.h
  );
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: BAND,
    cssPerLogic,
    needsTray: tray.needsTray,
    trayItems: tray.trayItemCount,
    trayLabels: tray.trayHasLabels,
    needsCommit: false,
  });
  return { zones, space, cssPerLogic };
}

function prepare(session: B6Session, frame: Frame): void {
  session.prepareRound(
    BAND,
    frame.space,
    frame.zones.stage,
    frame.zones.tray ?? undefined,
    frame.cssPerLogic
  );
}

/** Slot nguồn nằm trong khay, mọi slot khác trong sân khấu. */
function findSlotsOutsideTheirZone(
  session: B6Session,
  zones: StageZones
): string[] {
  const tray = zones.tray;
  return session.slots.flatMap((slot) => {
    const zone = slot.role === "source" ? tray : zones.stage;
    if (!zone) {
      return [`slot ${slot.index} cần khay mà khung không có`];
    }
    return findSlotsOutsideStage([slot], zone);
  });
}

/** Lệnh vẽ nằm ngoài cả sân khấu lẫn khay. */
function findDrawsOutsideZones(
  session: B6Session,
  zones: StageZones,
  rs: RenderSystem
): string[] {
  const draw = (ctx: CanvasRenderingContext2D) => session.render(ctx, rs, 0);
  const outsideStage = findDrawsOutsideStage(zones.stage, draw);
  if (!zones.tray) {
    return outsideStage;
  }
  const outsideTray = new Set(findDrawsOutsideStage(zones.tray, draw));
  return outsideStage.filter((line) => outsideTray.has(line));
}

/** Một nước đi: kéo `drag.from → drag.to`, hoặc chạm lần lượt `taps`. */
interface Move {
  readonly drag: { readonly from: Slot; readonly to: Slot };
  readonly taps: readonly Slot[];
}

function slotAt(slots: readonly Slot[], index: number): Slot | null {
  return slots[index] ?? null;
}

function move(
  from: Slot | null,
  to: Slot | null,
  taps: readonly (Slot | null)[]
): Move | null {
  const real = taps.filter((s): s is Slot => s !== null);
  return from && to && real.length === taps.length
    ? { drag: { from, to }, taps: real }
    : null;
}

function nextMove030(s: GT030Session): Move | null {
  const n = s.content.object.length_in_units;
  const source = slotAt(s.slots, 1 + n);
  if (s.getPlacedUnitsCount() < n) {
    const next = slotAt(s.slots, 1 + s.getPlacedUnitsCount());
    return move(source, next, [source]);
  }
  const index = s.content.answer_options.findIndex((o) => o.is_correct);
  const option = slotAt(s.slots, 2 + n + index);
  return move(option, option, [option]);
}

/** Chọn tập xu có tổng đúng bằng `target_amount` (quy hoạch động nhỏ). */
function pickCoinSubset(values: readonly number[], target: number): number[] {
  const reach = new Map<number, number[]>([[0, []]]);
  values.forEach((value, i) => {
    for (const [sum, picked] of [...reach]) {
      if (sum + value <= target && !reach.has(sum + value)) {
        reach.set(sum + value, [...picked, i]);
      }
    }
  });
  return reach.get(target) ?? [];
}

function nextMove031(s: GT031Session): Move | null {
  const wanted = pickCoinSubset(
    s.content.coins.map((c) => c.value),
    s.content.target_amount
  );
  const index = wanted.find((i) => {
    const coin = s.content.coins[i];
    return (
      coin !== undefined && !s.getDepositedCoinIds().includes(coin.coin_id)
    );
  });
  if (index === undefined) {
    return null;
  }
  const coin = slotAt(s.slots, 1 + index);
  return move(coin, slotAt(s.slots, 0), [coin]);
}

function nextMove033(s: GT033Session): Move | null {
  const cols = s.content.grid.cols;
  const total = s.content.grid.rows * cols;
  const placed = s.getPlacedCells();
  const cell = placed.findIndex((c, i) => c === null && i < total);
  if (cell < 0) {
    return null;
  }
  const colorId = s.content.solution?.[cell] ?? s.content.palette[0]?.color_id;
  const palette = s.content.palette.findIndex((p) => p.color_id === colorId);
  const from = slotAt(s.slots, total + palette);
  const to = slotAt(s.slots, cell);
  return move(from, to, [from, to]);
}

function nextMove(session: B6Session): Move | null {
  if (session instanceof GT030Session) {
    return nextMove030(session);
  }
  if (session instanceof GT031Session) {
    return nextMove031(session);
  }
  return nextMove033(session);
}

function drag(session: B6Session, m: Move): void {
  session.dispatch({
    type: "drop",
    fromX: m.drag.from.x,
    fromY: m.drag.from.y,
    toX: m.drag.to.x,
    toY: m.drag.to.y,
    timeMs: PLAY_TIME_MS,
  });
}

function tapTap(session: B6Session, m: Move): void {
  for (const slot of m.taps) {
    session.dispatch({
      type: "tap",
      x: slot.x,
      y: slot.y,
      timeMs: PLAY_TIME_MS,
    });
  }
}

/** GT-030 chốt đáp án bằng chạm, kể cả khi các đơn vị được kéo lên. */
function dragThenTapOptions(session: B6Session, m: Move): void {
  if (session instanceof GT030Session && m.drag.from === m.drag.to) {
    tapTap(session, m);
    return;
  }
  drag(session, m);
}

/** Chơi tối đa `limit` nước; trả số nước đã đi. */
function play(
  session: B6Session,
  how: (s: B6Session, m: Move) => void,
  limit: number
): number {
  let played = 0;
  while (played < limit && !session.checkWinCondition()) {
    const m = nextMove(session);
    if (!m) {
      break;
    }
    how(session, m);
    played += 1;
  }
  return played;
}

function legacySession030(index: number): B6Session | null {
  const f = GT030_FIXTURES[index];
  return f ? new GT030LegacyLayoutSession(f.content, f.difficulty) : null;
}

function legacySession031(index: number): B6Session | null {
  const f = GT031_FIXTURES[index];
  return f ? new GT031LegacyLayoutSession(f.content, f.difficulty) : null;
}

function legacySession033(index: number): B6Session | null {
  const f = GT033_FIXTURES[index];
  return f ? new GT033LegacyLayoutSession(f.content, f.difficulty) : null;
}

describe.each(B6_CODES)("%s lô B6 — khay nguồn, đích trên sân khấu", (code) => {
  beforeAll(async () => {
    await preloadGameSession(code);
  });

  it("khai needsTray, usesPromptZone, không needsCommit (BR-PSZ-01, BR-PSZ-08)", () => {
    const session = casesFor(code)[0]?.create();
    expect(session?.needsTray).toBe(true);
    expect(session?.usesPromptZone).toBe(true);
    expect(session?.needsCommit).toBe(false);
  });

  it("có level đã seed để chạy lại, không chỉ level mẫu (BR-LAY-10)", () => {
    expect(
      ALL_SEED_LEVELS.filter((l) => l.header.template_code === code).length
    ).toBeGreaterThan(0);
  });

  for (const viewport of VIEWPORTS) {
    it(`${viewport.name}: slot trong vùng của nó, vùng chạm không chồng, vẽ trong sân khấu và khay — đầu vòng và giữa vòng`, () => {
      const rs = new RenderSystem();
      const failing: string[] = [];
      for (const { name, create } of casesFor(code)) {
        const session = create();
        const frame = frameFor(viewport, session);
        prepare(session, frame);
        const check = (when: string): string[] => [
          ...findSlotsOutsideTheirZone(session, frame.zones).map(
            (v) => `${name} ${when}: ${v}`
          ),
          ...findHitPairViolations(session.slots).map(
            (v) => `${name} ${when}: ${v}`
          ),
          ...findDrawsOutsideZones(session, frame.zones, rs).map(
            (v) => `${name} ${when}: vẽ ${v}`
          ),
        ];
        const opening = check("đầu vòng");
        play(session, drag, 1);
        const mid = check("giữa vòng");
        if (opening.length + mid.length > 0) {
          failing.push(
            `${name} → ${[...opening, ...mid].slice(0, 3).join(" | ")}`
          );
        }
      }
      const debt = KNOWN_LAYOUT_DEBT_CASES[`${code}|${viewport.name}`] ?? 0;
      expect(
        failing.length,
        `${failing.length} ca vi phạm, đầu tiên: ${failing.slice(0, 3).join(", ")}`
      ).toBeLessThanOrEqual(debt);
    });
  }

  it("kéo từ khay lên sân khấu chơi hết vòng (BR-ENG-06 đường kéo)", () => {
    for (const viewport of VIEWPORTS) {
      for (const { name, create } of casesFor(code)) {
        const session = create();
        prepare(session, frameFor(viewport, session));

        play(session, dragThenTapOptions, MAX_MOVES);

        expect(session.checkWinCondition(), `${name} ${viewport.name}`).toBe(
          true
        );
      }
    }
  });

  it("chạm vật rồi chạm đích chơi hết vòng (BR-ENG-06 đường chạm-chạm)", () => {
    for (const viewport of VIEWPORTS) {
      for (const { name, create } of casesFor(code)) {
        const session = create();
        prepare(session, frameFor(viewport, session));

        play(session, tapTap, MAX_MOVES);

        expect(session.checkWinCondition(), `${name} ${viewport.name}`).toBe(
          true
        );
      }
    }
  });

  it("đổi viewport giữa vòng: tính lại slot, nước đi tiếp vẫn đúng (BR-PSZ-12)", () => {
    const [portrait, , desktop] = VIEWPORTS;
    if (!(portrait && desktop)) {
      throw new Error("Thiếu viewport");
    }
    for (const { name, create } of casesFor(code)) {
      const session = create();
      prepare(session, frameFor(portrait, session));
      play(session, dragThenTapOptions, 1);
      prepare(session, frameFor(desktop, session));
      play(session, tapTap, 1);
      prepare(session, frameFor(portrait, session));

      play(session, dragThenTapOptions, MAX_MOVES);

      expect(session.checkWinCondition(), name).toBe(true);
    }
  });

  it("getHintTargetIndex trỏ vào một slot có thật khi vòng chưa xong", () => {
    for (const { name, create } of casesFor(code)) {
      const session = create();
      const first = VIEWPORTS[0];
      if (!first) {
        throw new Error("Thiếu viewport");
      }
      prepare(session, frameFor(first, session));

      const hint = session.getHintTargetIndex();

      expect(hint, name).not.toBeNull();
      expect(session.slots[hint ?? -1], name).toBeDefined();
    }
  });
});

describe("Ca âm: bố cục cũ chạy trên cả canvas (Task #283 B6)", () => {
  const legacy: readonly [string, (index: number) => B6Session | null][] = [
    ["GT-030", legacySession030],
    ["GT-031", legacySession031],
    ["GT-033", legacySession033],
  ];

  it.each(legacy)(
    "%s: slot đặt theo bố cục cũ nằm ngoài sân khấu hoặc khay ở portrait",
    (code, make) => {
      const [portrait] = VIEWPORTS;
      const session = make(0);
      if (!(portrait && session)) {
        throw new Error(`Thiếu fixture hoặc viewport ${code}`);
      }
      const frame = frameFor(portrait, { needsTray: true, trayItemCount: 0 });
      prepare(session, frame);

      expect(
        findSlotsOutsideTheirZone(session, frame.zones).length
      ).toBeGreaterThan(0);
    }
  );
});

describe("khung B6 dùng chung danh sách khai báo", () => {
  it("mọi mã B6 là TemplateGameSession", async () => {
    for (const code of B6_CODES) {
      await preloadGameSession(code);
      expect(casesFor(code)[0]?.create()).toBeInstanceOf(TemplateGameSession);
    }
  });
});
