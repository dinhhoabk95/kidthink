import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import type { AgeBand } from "#src/contracts/types";
import { TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  type EngineConfig,
  TEMPLATE_SEED_ENTRIES,
} from "#src/index";
import { computeStageZones, type StageZones } from "#src/layout/stage-zones";
import { touchFloorOf } from "#src/layout/touch-floor";
import type { Slot } from "#src/layout/types";
import { deriveCanvasViewport } from "#src/systems/render-system";
import { FIXTURES_BY_CODE, type FixturePayload } from "../../fixtures-map.ts";

/**
 * Khung thật mà shell đưa cho engine (`BR-LAY-13`).
 *
 * Test cũ dựng khung logic từ **viewport** rồi lấy `cssPerLogic = w / logic.w`.
 * Hai chỗ lệch so với shell: (1) shell không đưa cả viewport cho canvas, trang
 * chơi trừ HUD, đệm arena và khung gỗ; (2) test chỉ hỏi "ô có giao nút hành
 * động không", nên ô nằm ngoài đáy canvas (y > logicH) vẫn xanh. Helper này đi
 * qua cùng `deriveCanvasViewport` mà `RenderSystem.setupCanvas` dùng, và đo cả
 * việc ô nằm trong canvas.
 */

export interface ShellViewport {
  readonly name: string;
  readonly w: number;
  readonly h: number;
}

/** Hai viewport điện thoại dọc mà QA chụp (360x640 là khung nhỏ nhất, `BR-LAY-12`). */
export const SHELL_VIEWPORTS: readonly ShellViewport[] = [
  { name: "360x640", w: 360, h: 640 },
  { name: "390x844", w: 390, h: 844 },
];

export type ShellSurface = "preview" | "play";

export interface CanvasBox {
  readonly w: number;
  readonly h: number;
}

/**
 * Hộp CSS của canvas trong viewport dọc.
 * - `preview`: `preview-sandbox.vue?fit=fill` — canvas lấp cả viewport.
 * - `play`: `play/[code].vue` + `play-surface.css` — trừ HUD (`.top-hud-bar`:
 *   cao `max(4.5rem, sàn chạm + 16)` cộng viền 3), arena (đệm 8 trên, 16 dưới,
 *   16 hai bên) và khung gỗ (đệm 10 + viền 4 mỗi cạnh). Đã đo trên Chromium ở
 *   trang chơi thật (Phase 26), khớp từng px. Giả định HUD **một hàng**: level
 *   nhiều vòng (band 3-4, 360 px, từ 4 vòng) làm hạt tiến độ xuống dòng và
 *   canvas thấp hơn số ở đây.
 */
export function canvasBoxOf(
  viewport: ShellViewport,
  band: AgeBand,
  surface: ShellSurface
): CanvasBox {
  if (surface === "preview") {
    return { w: viewport.w, h: viewport.h };
  }
  const hud = Math.max(72, touchFloorOf(band) + 16) + 3;
  const chromeX = 2 * 16 + 2 * (10 + 4);
  const chromeY = hud + 8 + 16 + 2 * (10 + 4);
  return { w: viewport.w - chromeX, h: viewport.h - chromeY };
}

export type SeedPayload = (typeof ALL_SEED_LEVELS)[number]["content_pack"];

function asPayload(val: SeedPayload): FixturePayload {
  return typeof val === "object" && val !== null && !Array.isArray(val)
    ? { ...val }
    : {};
}

export function configFor(
  code: string,
  band: AgeBand,
  content: FixturePayload,
  difficulty: FixturePayload
): EngineConfig {
  return {
    level_code: `${code}-LV1`,
    content_version: 1,
    template_code: code,
    content_pack: content,
    difficulty_params: difficulty,
    theme_id: "default",
    age_band: band,
    reduced_motion: false,
    audio_enabled: true,
  };
}

export interface LevelCase {
  readonly config: EngineConfig;
  readonly name: string;
}

/**
 * Fixture của engine cộng **từng vòng** của mọi level seed dùng engine đó.
 *
 * Trang chơi đọc `rounds[]` của level (`loadRoundSet`); chỉ khi level không có
 * vòng nào mới dùng `content_pack` cấp level. Đo mỗi `content_pack` cấp level
 * thì vòng 2, 3 (biến thể khác của bộ dựng) không bao giờ được đo.
 */
export function casesFor(code: string, band: AgeBand): LevelCase[] {
  const fixtures = (FIXTURES_BY_CODE[code] ?? []).map((f, i) => ({
    name: `mẫu ${i}`,
    config: configFor(code, band, f.content, f.difficulty),
  }));
  const seeds = ALL_SEED_LEVELS.filter(
    (level) => level.header.template_code === code
  ).flatMap((level) => {
    const rounds = level.rounds ?? [];
    const packs =
      rounds.length > 0
        ? rounds
        : [
            {
              content_pack: level.content_pack,
              difficulty_params: level.difficulty_params,
            },
          ];
    return packs.map((round, i) => ({
      name: `seed ${level.header.code} vòng ${i}`,
      config: configFor(
        code,
        band,
        asPayload(round.content_pack),
        asPayload(round.difficulty_params)
      ),
    }));
  });
  return [...fixtures, ...seeds];
}

export function bandsOf(code: string, all: readonly AgeBand[]): AgeBand[] {
  const banned: readonly string[] =
    TEMPLATE_SEED_ENTRIES.find((e) => e.templateCode === code)
      ?.bannedAgeBands ?? [];
  return all.filter((b) => !banned.includes(b));
}

export interface PlacedRound {
  readonly scale: number;
  readonly slots: readonly Slot[];
  readonly space: { readonly w: number; readonly h: number };
  readonly zones: StageZones;
}

/** Dựng vòng đúng như shell: viewport -> khung logic -> vùng -> `prepareRound`. */
export function placeRound(
  session: TemplateGameSession,
  band: AgeBand,
  box: CanvasBox
): PlacedRound {
  const vp = deriveCanvasViewport(box.w, box.h);
  const space = vp.logicSpace;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic: vp.scale,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    trayLabels: session.trayHasLabels,
    needsCommit: session.needsCommit,
    stageRows: session.stageRowCount,
  });
  session.prepareRound(
    band,
    space,
    zones.stage,
    zones.tray ?? undefined,
    vp.scale
  );
  return { scale: vp.scale, slots: session.slots, space, zones };
}

/** Đạt khi hai hình chữ nhật giao nhau với phần chung dương. */
function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

const EDGE_EPSILON = 0.5;

/**
 * Lý do một vòng không vừa khung: ô chạm ra ngoài canvas, hoặc đè nút hành
 * động. Rỗng nghĩa là vừa.
 */
export function overflowReasons(
  round: PlacedRound,
  needsCommit: boolean
): string[] {
  const reasons: string[] = [];
  const bounds = { x: 0, y: 0, w: round.space.w, h: round.space.h };
  const outside = round.slots.some((s) => {
    const rect = {
      x: s.x - s.hitW / 2,
      y: s.y - s.hitH / 2,
      w: s.hitW,
      h: s.hitH,
    };
    return (
      rect.x < bounds.x - EDGE_EPSILON ||
      rect.y < bounds.y - EDGE_EPSILON ||
      rect.x + rect.w > bounds.w + EDGE_EPSILON ||
      rect.y + rect.h > bounds.h + EDGE_EPSILON
    );
  });
  if (outside) {
    reasons.push("ngoài canvas");
  }
  if (
    needsCommit &&
    round.slots.some((s) =>
      overlaps(
        { x: s.x - s.hitW / 2, y: s.y - s.hitH / 2, w: s.hitW, h: s.hitH },
        round.zones.action
      )
    )
  ) {
    reasons.push("đè nút hành động");
  }
  return reasons;
}

export function createSession(
  code: string,
  config: EngineConfig
): TemplateGameSession | null {
  const session = createGameSessionSync(code, config);
  return session instanceof TemplateGameSession ? session : null;
}

/**
 * Đo một ca ở một khung: lý do tràn, rỗng nghĩa là vừa. Layout ném
 * `LAYOUT_CAPACITY_EXCEEDED` (scatter-board, `BR-LAY-11`) cũng là tràn.
 */
export function measureOverflow(
  code: string,
  config: EngineConfig,
  band: AgeBand,
  box: CanvasBox
): string[] {
  const session = createSession(code, config);
  if (!session) {
    // Trả rỗng ở đây là xanh giả: engine không dựng được thì không đo được.
    throw new Error(`${code}: không phải TemplateGameSession, không đo được`);
  }
  try {
    return overflowReasons(placeRound(session, band, box), session.needsCommit);
  } catch (error) {
    // Chỉ lỗi sức chứa của layout là "tràn"; lỗi khác là bug, không vào sổ nợ.
    if (
      error instanceof Error &&
      error.message.startsWith(LAYOUT_CAPACITY_EXCEEDED)
    ) {
      return [LAYOUT_CAPACITY_EXCEEDED];
    }
    throw error;
  }
}

const LAYOUT_CAPACITY_EXCEEDED = "LAYOUT_CAPACITY_EXCEEDED";
