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
import { GT004_FIXTURES } from "#src/templates/GT-004/fixtures";
import { GT004Session } from "#src/templates/GT-004/session";
import { GT007Session } from "#src/templates/GT-007/session";
import { GT008Session } from "#src/templates/GT-008/session";
import { SudokuMiniSession } from "#src/templates/GT-015/session";
import { GT021Session } from "#src/templates/GT-021/session";
import { GT023Session } from "#src/templates/GT-023/session";
import { FIXTURES_BY_CODE, type FixturePayload } from "../fixtures-map.ts";
import { GT004LegacyTrayCoordsSession } from "./fixtures/gt-004-legacy-tray-coords.ts";
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
 * Lô B3 của Task #283: sáu engine kéo-thả có khay nguồn (GT-004, 007, 008, 015,
 * 021, 023) vào khung năm vùng — nguồn trong `zones.tray`, đích trong
 * `zones.stage` (`BR-PSZ-01`), vùng chạm không chồng (`BR-LAY-05`), kéo từ khay
 * lên sân khấu và đường chạm-chạm (`BR-ENG-06`) đều chơi hết vòng.
 */
interface Viewport {
  readonly name: string;
  readonly cssW: number;
  readonly cssH: number;
}

const VIEWPORTS: readonly Viewport[] = [
  { name: "portrait 330x697", cssW: 330, cssH: 697 },
  { name: "điện thoại ngang 784x250", cssW: 784, cssH: 250 },
  { name: "máy tính 964x628", cssW: 964, cssH: 628 },
];

/** Band thấp nhất mỗi engine được chơi — sàn chạm cao nhất nên chật nhất. */
const LOWEST_BAND: Readonly<Record<string, AgeBand>> = {
  "GT-004": "4-5",
  "GT-007": "3-4",
  "GT-008": "3-4",
  "GT-015": "5-6",
  "GT-021": "4-5",
  "GT-023": "4-5",
};

/**
 * Nợ đã đo (Task #283 B3): số ca (mẫu + seed) có slot ra ngoài vùng của nó, hai
 * vùng chạm cách nhau dưới `SLOT_GAP_PX`, hoặc lệnh vẽ ngoài sân khấu và khay,
 * theo `mã|khung`. Khay cao một hàng nên portrait chứa tối đa bốn nguồn ở sàn
 * 64 px CSS; điện thoại ngang chỉ có sân khấu 228 logic px cao. Cặp không có tên
 * ở đây phải bằng 0. Số chỉ được giảm.
 */
const KNOWN_LAYOUT_DEBT_CASES: Readonly<Record<string, number>> = {
  // Số đo sau khi khay nhiều hàng, không phân trang và cột lời dẫn bên trái
  // (`play-stage-zones.md` `BR-PSZ-13`). Còn lại là giới hạn vật lý: sàn chạm của
  // band ở canvas thấp làm số ô cần xếp lớn hơn diện tích sân khấu. Chỉ được giảm.
  "GT-004|điện thoại ngang 784x250|4-5": 468,
  "GT-004|điện thoại ngang 784x250|5-6": 31,
  "GT-007|portrait 330x697|3-4": 88,
  "GT-007|điện thoại ngang 784x250|3-4": 424,
  "GT-008|máy tính 964x628|3-4": 1,
  "GT-008|portrait 330x697|3-4": 227,
  "GT-008|điện thoại ngang 784x250|3-4": 227,
  "GT-008|điện thoại ngang 784x250|5-6": 4,
  "GT-015|máy tính 964x628|5-6": 7,
  "GT-015|điện thoại ngang 784x250|5-6": 7,
  "GT-021|portrait 330x697|4-5": 13,
  "GT-021|portrait 330x697|5-6": 1,
  "GT-021|điện thoại ngang 784x250|4-5": 25,
  "GT-021|điện thoại ngang 784x250|5-6": 13,
  "GT-023|điện thoại ngang 784x250|4-5": 2,
};

/** Sáu engine của lô B3 — cũng nằm trong `MIGRATED_CODES`. */
const B3_CODES: readonly string[] = [
  "GT-004",
  "GT-007",
  "GT-008",
  "GT-015",
  "GT-021",
  "GT-023",
];

const PLAY_TIME_MS = 0;

function isFixturePayload(val: unknown): val is FixturePayload {
  return typeof val === "object" && val !== null;
}

function configFor(
  code: string,
  band: AgeBand,
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
    age_band: band,
    reduced_motion: false,
    audio_enabled: true,
  };
}

type B3Session =
  | GT004Session
  | GT007Session
  | GT008Session
  | SudokuMiniSession
  | GT021Session
  | GT023Session;

interface B3Case {
  readonly name: string;
  readonly create: () => B3Session;
}

function narrow(code: string, session: unknown): B3Session {
  if (
    session instanceof GT004Session ||
    session instanceof GT007Session ||
    session instanceof GT008Session ||
    session instanceof SudokuMiniSession ||
    session instanceof GT021Session ||
    session instanceof GT023Session
  ) {
    return session;
  }
  throw new Error(`${code} không phải session B3`);
}

function casesFor(code: string, band: AgeBand): B3Case[] {
  const make = (config: EngineConfig): B3Session =>
    narrow(code, createGameSessionSync(code, config));
  const fromFixtures = (FIXTURES_BY_CODE[code] ?? []).map((f, i) => ({
    name: `mẫu ${i}`,
    create: () => make(configFor(code, band, f.content, f.difficulty)),
  }));
  const fromSeeds = ALL_SEED_LEVELS.filter(
    (level) => level.header.template_code === code
  ).map((level) => ({
    name: `seed ${level.header.code}`,
    create: () =>
      make(configFor(code, band, level.content_pack, level.difficulty_params)),
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

function frameFor(viewport: Viewport, band: AgeBand, tray: TrayFlags): Frame {
  const space = deriveLogicSpace(viewport.cssW, viewport.cssH);
  // Cùng phép của `RenderSystem.setupCanvas`: tỉ lệ chặn bởi cạnh chật hơn.
  const cssPerLogic = Math.min(
    viewport.cssW / space.w,
    viewport.cssH / space.h
  );
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray: tray.needsTray,
    trayItems: tray.trayItemCount,
    trayLabels: tray.trayHasLabels,
    needsCommit: false,
  });
  return { zones, space, cssPerLogic };
}

function prepare(session: B3Session, band: AgeBand, frame: Frame): void {
  session.prepareRound(
    band,
    frame.space,
    frame.zones.stage,
    frame.zones.tray ?? undefined,
    frame.cssPerLogic
  );
}

/** Slot nguồn nằm trong khay, mọi slot khác trong sân khấu. */
function findSlotsOutsideTheirZone(
  session: B3Session | GT004LegacyTrayCoordsSession,
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
  session: B3Session,
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

interface Move {
  readonly from: Slot;
  readonly to: Slot;
}

function slotAt(slots: readonly Slot[], index: number): Slot | null {
  return slots[index] ?? null;
}

function pair(from: Slot | null, to: Slot | null): Move | null {
  return from && to ? { from, to } : null;
}

function nextMove004(s: GT004Session): Move | null {
  const placed = s.getPlacements();
  const index = s.displayItems.findIndex((it) => !placed.has(it.item_id));
  const item = s.displayItems[index];
  if (!item) {
    return null;
  }
  const group = s.content.groups.findIndex(
    (g) => g.group_id === item.correct_group_id
  );
  return pair(slotAt(s.sourceSlots, index), slotAt(s.targetSlots, group));
}

function nextMove007(s: GT007Session): Move | null {
  const partIndex = s.content.parts.findIndex(
    (p) => p.is_target && !s.filledParts.has(p.id)
  );
  const part = s.content.parts[partIndex];
  if (!part) {
    return null;
  }
  const option = s.content.options.findIndex(
    (o) => o.is_correct && o.value === part.value
  );
  return pair(
    slotAt(s.sourceSlots, option),
    slotAt(s.targetSlots, partIndex + 1)
  );
}

function nextMove008(s: GT008Session): Move | null {
  const target = s.content.slots.findIndex(
    (d) => !s.placedSlots.has(d.slot_id)
  );
  const def = s.content.slots[target];
  if (!def) {
    return null;
  }
  const item = s.content.items.findIndex(
    (it) => it.item_id === def.expected_item_id
  );
  return pair(slotAt(s.sourceSlots, item), slotAt(s.targetSlots, target));
}

function nextMove021(s: GT021Session): Move | null {
  const target = s.content.target_slots.findIndex(
    (t) => s.mirrorSystem.getPlacement(t.slot_id) !== t.expected_asset_ref
  );
  const def = s.content.target_slots[target];
  if (!def) {
    return null;
  }
  const option = s.content.options.findIndex(
    (o) => o.asset_ref === def.expected_asset_ref
  );
  return pair(slotAt(s.sourceSlots, option), slotAt(s.targetSlots, target));
}

function nextMove023(s: GT023Session): Move | null {
  const placed = new Set(s.getPlacements().keys());
  const anchor = s.content.anchors.findIndex((a) => !placed.has(a.anchor_id));
  const def = s.content.anchors[anchor];
  if (!def) {
    return null;
  }
  const part = s.content.parts.findIndex(
    (p) => p.part_id === def.accepted_part_id
  );
  return pair(slotAt(s.sourceSlots, part), slotAt(s.targetSlots, anchor));
}

/**
 * Sudoku: thử từng ô trống với từng ký hiệu; ô nào `validateAction` nhận thì đi.
 * Lưới nhỏ và có đúng một nghiệm, nên đi tham lam theo luật vẫn tới đích khi
 * mỗi nước đi hợp lệ; nước dẫn vào ngõ cụt thì nhận ký hiệu khác ở ô khác.
 */
function nextMove015(s: SudokuMiniSession): Move | null {
  const size = s.getGridSize();
  const cellCount = size * size;
  for (const cell of s.getAllCellStates()) {
    if (cell.value !== null) {
      continue;
    }
    for (let i = 0; i < s.getSymbols().length; i++) {
      const symbol = s.getSymbols()[i];
      if (!symbol) {
        continue;
      }
      const verdict = s.validateAction({
        type: "fill_cell",
        data: { row: cell.row, col: cell.col, symbol_id: symbol.symbol_id },
      });
      if (verdict.valid) {
        return pair(
          slotAt(s.slots, cellCount + i),
          slotAt(s.slots, cell.row * size + cell.col)
        );
      }
    }
  }
  return null;
}

function nextMove(session: B3Session): Move | null {
  if (session instanceof GT004Session) {
    return nextMove004(session);
  }
  if (session instanceof GT007Session) {
    return nextMove007(session);
  }
  if (session instanceof GT008Session) {
    return nextMove008(session);
  }
  if (session instanceof SudokuMiniSession) {
    return nextMove015(session);
  }
  if (session instanceof GT021Session) {
    return nextMove021(session);
  }
  return nextMove023(session);
}

function drag(session: B3Session, move: Move): void {
  session.dispatch({
    type: "drop",
    fromX: move.from.x,
    fromY: move.from.y,
    toX: move.to.x,
    toY: move.to.y,
    timeMs: PLAY_TIME_MS,
  });
}

function tapTap(session: B3Session, move: Move): void {
  session.dispatch({
    type: "tap",
    x: move.from.x,
    y: move.from.y,
    timeMs: PLAY_TIME_MS,
  });
  session.dispatch({
    type: "tap",
    x: move.to.x,
    y: move.to.y,
    timeMs: PLAY_TIME_MS,
  });
}

/** Chơi tối đa `limit` nước; trả số nước đã đi. */
function play(
  session: B3Session,
  how: (s: B3Session, m: Move) => void,
  limit: number
): number {
  let played = 0;
  while (played < limit && !session.checkWinCondition()) {
    const move = nextMove(session);
    if (!move) {
      break;
    }
    how(session, move);
    played += 1;
  }
  return played;
}

const MAX_MOVES = 64;

describe.each(B3_CODES)("%s lô B3 — khay nguồn, đích trên sân khấu", (code) => {
  beforeAll(async () => {
    await preloadGameSession(code);
  });

  const lowest = LOWEST_BAND[code] ?? "5-6";
  const bands: readonly AgeBand[] =
    lowest === "5-6" ? ["5-6"] : [lowest, "5-6"];

  it("khai needsTray và usesPromptZone (BR-PSZ-01, BR-PSZ-08)", () => {
    const first = casesFor(code, lowest)[0];
    const session = first?.create();
    expect(session?.needsTray).toBe(true);
    expect(session?.usesPromptZone).toBe(true);
  });

  it("có level đã seed để chạy lại, không chỉ level mẫu (BR-LAY-10)", () => {
    expect(
      ALL_SEED_LEVELS.filter((l) => l.header.template_code === code).length
    ).toBeGreaterThan(0);
  });

  for (const band of bands) {
    for (const viewport of VIEWPORTS) {
      it(`${viewport.name} band ${band}: slot trong vùng của nó, vùng chạm không chồng, vẽ trong sân khấu và khay — đầu vòng và giữa vòng`, () => {
        const rs = new RenderSystem();
        const failing: string[] = [];
        const samples: string[] = [];
        for (const { name, create } of casesFor(code, band)) {
          const session = create();
          const frame = frameFor(viewport, band, session);
          prepare(session, band, frame);
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
            failing.push(name);
            samples.push(...[...opening, ...mid].slice(0, 2));
          }
        }
        const debt =
          KNOWN_LAYOUT_DEBT_CASES[`${code}|${viewport.name}|${band}`] ?? 0;
        expect(
          failing.length,
          `${failing.length} ca vi phạm, đầu tiên: ${failing.slice(0, 3).join(", ")} | ${samples.slice(0, 4).join(" | ")}`
        ).toBeLessThanOrEqual(debt);
      });
    }
  }

  it("kéo từ khay lên sân khấu chơi hết vòng (BR-ENG-06 đường kéo)", () => {
    for (const band of bands) {
      for (const viewport of VIEWPORTS) {
        for (const { name, create } of casesFor(code, band)) {
          const session = create();
          const frame = frameFor(viewport, band, session);
          prepare(session, band, frame);

          play(session, drag, MAX_MOVES);

          expect(
            session.checkWinCondition(),
            `${name} ${viewport.name} band ${band}`
          ).toBe(true);
        }
      }
    }
  });

  it("chạm vật rồi chạm đích chơi hết vòng (BR-ENG-06 đường chạm-chạm)", () => {
    for (const band of bands) {
      for (const viewport of VIEWPORTS) {
        for (const { name, create } of casesFor(code, band)) {
          const session = create();
          const frame = frameFor(viewport, band, session);
          prepare(session, band, frame);

          play(session, tapTap, MAX_MOVES);

          expect(
            session.checkWinCondition(),
            `${name} ${viewport.name} band ${band}`
          ).toBe(true);
        }
      }
    }
  });

  it("đổi viewport giữa vòng: tính lại slot, nước đi tiếp vẫn đúng (BR-PSZ-12)", () => {
    const [portrait, phone, desktop] = VIEWPORTS;
    if (!(portrait && phone && desktop)) {
      throw new Error("Thiếu viewport");
    }
    for (const { name, create } of casesFor(code, lowest)) {
      const session = create();
      prepare(session, lowest, frameFor(portrait, lowest, session));
      play(session, drag, 1);
      prepare(session, lowest, frameFor(desktop, lowest, session));
      play(session, tapTap, 1);
      prepare(session, lowest, frameFor(portrait, lowest, session));

      play(session, drag, MAX_MOVES);

      expect(session.checkWinCondition(), name).toBe(true);
    }
  });

  it("getHintTargetIndex trỏ vào một slot có thật khi vòng chưa xong", () => {
    for (const { name, create } of casesFor(code, lowest)) {
      const session = create();
      const first = VIEWPORTS[0];
      if (!first) {
        throw new Error("Thiếu viewport");
      }
      prepare(session, lowest, frameFor(first, lowest, session));

      const hint = session.getHintTargetIndex();

      expect(hint, name).not.toBeNull();
      expect(session.slots[hint ?? -1], name).toBeDefined();
    }
  });
});

describe("Ca âm: GT-004 với khay vẽ ở toạ độ cũ (Task #283 B3)", () => {
  const band: AgeBand = "4-5";

  it("portrait 330x697: nguồn và đích cũ nằm ngoài khay và sân khấu", () => {
    const [portrait] = VIEWPORTS;
    const f = GT004_FIXTURES[0];
    if (!(portrait && f)) {
      throw new Error("Thiếu fixture hoặc viewport GT-004");
    }
    const session = new GT004LegacyTrayCoordsSession(f.content, f.difficulty);
    const frame = frameFor(portrait, band, {
      needsTray: true,
      trayItemCount: 0,
    });

    session.prepareRound(
      band,
      frame.space,
      frame.zones.stage,
      frame.zones.tray ?? undefined,
      frame.cssPerLogic
    );

    expect(
      findSlotsOutsideTheirZone(session, frame.zones).length
    ).toBeGreaterThan(0);
  });
});

describe("khung B3 dùng chung danh sách khai báo", () => {
  it("mọi mã B3 là TemplateGameSession", async () => {
    for (const code of B3_CODES) {
      await preloadGameSession(code);
      const first = casesFor(code, LOWEST_BAND[code] ?? "5-6")[0];
      expect(first?.create()).toBeInstanceOf(TemplateGameSession);
    }
  });
});
