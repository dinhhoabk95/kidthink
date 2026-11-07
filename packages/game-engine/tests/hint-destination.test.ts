import { describe, expect, it } from "vitest";
import {
  createGameSessionSync,
  type EngineConfig,
  type GameSession,
  type Gesture,
  preloadGameSession,
  TemplateGameSession,
} from "#src/index";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT019Session } from "#src/templates/GT-019/session.js";
import { FIXTURES_BY_CODE } from "./fixtures-map.js";

/**
 * Task #313 Phase 2 — mọi template kéo/đặt khai `getHintDestinationIndex()`:
 * bước đúng kế tiếp là một cú kéo từ slot nguồn tới slot đích. Oracle là chính
 * session: thả ngón tay từ tâm slot nguồn tới tâm slot đích của hint phải ra
 * action hợp lệ, và làm theo hint tới cùng thì thắng.
 */

const BANDS = ["3-4", "4-5", "5-6"] as const;
type Band = (typeof BANDS)[number];

interface HintFixture {
  readonly content: EngineConfig["content_pack"];
  readonly difficulty: EngineConfig["difficulty_params"];
  readonly band?: string;
}

function toBand(raw: string | undefined): Band {
  return BANDS.find((b) => b === raw) ?? "4-5";
}

async function buildSession(
  code: string,
  fixture: HintFixture,
  index: number
): Promise<TemplateGameSession> {
  await preloadGameSession(code);
  const band = toBand(fixture.band);
  const session = createGameSessionSync(code, {
    level_code: `HINT-${code}-${index}`,
    content_version: 1,
    template_code: code,
    content_pack: fixture.content,
    difficulty_params: fixture.difficulty,
    theme_id: "default",
    age_band: band,
    reduced_motion: false,
    audio_enabled: false,
    layout_seed: 1,
  });
  if (!(session instanceof TemplateGameSession)) {
    throw new Error(`${code}: không dựng được TemplateGameSession`);
  }
  // Shell thật luôn cấp khung năm vùng; bố cục cũ không còn là đường chơi.
  const zones = computeStageZones({
    logicW: 960,
    logicH: 540,
    ageBand: band,
    cssPerLogic: 1,
    needsTray: session.needsTray,
    needsCommit: session.needsCommit,
  });
  session.prepareRound(
    band,
    { w: 960, h: 540 },
    zones.stage,
    zones.tray ?? undefined
  );
  return session;
}

interface FollowResult {
  readonly drags: number;
  /** Lỗi gặp dọc đường (rỗng khi mọi bước đều đúng). */
  readonly problems: readonly string[];
}

/** Một nhịp chạy chương trình của robot (GT-035). */
const RUN_BEAT_MS = 600;

/** Làm theo hint (kéo nguồn -> đích) tới khi thắng. */
function followHint(session: TemplateGameSession): FollowResult {
  const problems: string[] = [];
  let drags = 0;
  for (let step = 0; step < 60 && !session.checkWinCondition(); step++) {
    const hint = session.getHintTarget();
    if (hint?.kind === "action") {
      // Hết bước kéo, bước kế là bấm nút nộp (GT-006, GT-035).
      const commit = session.toAction?.({ type: "commit", timeMs: step });
      if (!commit) {
        problems.push(`bước ${step}: nút nộp không ra action`);
        break;
      }
      session.commit?.(commit);
      // GT-035: bấm chạy chỉ bắt đầu, robot đi từng bước qua update() rồi mới thắng.
      for (let beat = 0; beat < 60 && !session.checkWinCondition(); beat++) {
        (session as GameSession).update?.(RUN_BEAT_MS);
      }
      continue;
    }
    if (hint?.kind !== "slot") {
      break;
    }
    const from = session.slots[hint.index];
    const to =
      hint.toIndex === undefined ? undefined : session.slots[hint.toIndex];
    if (!(from && to)) {
      problems.push(`bước ${step}: thiếu slot nguồn hoặc đích`);
      break;
    }
    if (hint.toIndex === hint.index) {
      problems.push(`bước ${step}: đích trùng nguồn`);
      break;
    }
    const gesture: Gesture = {
      type: "drop",
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
      timeMs: step,
    };
    const action = session.toAction?.(gesture);
    if (!action) {
      problems.push(`bước ${step}: drop không ra action`);
      break;
    }
    if (!session.validateAction(action).valid) {
      problems.push(`bước ${step}: action không hợp lệ`);
      break;
    }
    session.commit?.(action);
    drags++;
  }
  return { drags, problems };
}

/** [mã template, chỉ số fixture có bước kéo] */
const CASES: readonly (readonly [string, number])[] = [
  ["GT-004", 0],
  ["GT-005", 0],
  ["GT-006", 0],
  ["GT-007", 0],
  ["GT-008", 0],
  ["GT-014", 1],
  ["GT-015", 0],
  ["GT-015", 1],
  ["GT-015", 2],
  ["GT-019", 0],
  ["GT-021", 0],
  ["GT-023", 0],
  ["GT-031", 0],
  ["GT-035", 0],
];

/** GT-019: mảnh phải xoay khớp ô trước thì mới có cú kéo đúng. */
function rotatePiecesToTarget(session: TemplateGameSession): void {
  if (!(session instanceof GT019Session)) {
    throw new Error("GT-019: sai lớp session");
  }
  for (const piece of session.content.pieces) {
    const target = session.content.target_slots.find(
      (s) => s.slot_id === piece.target_slot_id
    );
    for (let i = 0; i < 4; i++) {
      if (
        session.getPieceTransform(piece.piece_id)?.rotation ===
        (target?.target_rotation ?? 0)
      ) {
        break;
      }
      session.onRotatePiece(piece.piece_id);
    }
  }
}

function fixtureOf(code: string, index: number): HintFixture {
  const fixtures = (FIXTURES_BY_CODE[code] ?? []) as readonly HintFixture[];
  const fixture = fixtures[index];
  if (!fixture) {
    throw new Error(`${code}: thiếu fixture #${index}`);
  }
  return fixture;
}

describe("getHintDestinationIndex — bàn tay ma kéo tới đích", () => {
  for (const [code, fixtureIndex] of CASES) {
    it(`${code}: làm theo hint kéo-thả thì thắng`, async () => {
      const session = await buildSession(
        code,
        fixtureOf(code, fixtureIndex),
        fixtureIndex
      );
      if (code === "GT-019") {
        rotatePiecesToTarget(session);
      }
      const result = followHint(session);
      expect(result.problems).toEqual([]);
      expect(result.drags).toBeGreaterThan(0);
      expect(session.checkWinCondition()).toBe(true);
    });
  }

  // Bước đúng ở các ca dưới không phải cú kéo tới một slot đích, nên hint
  // không có `toIndex` (bàn tay ma chỉ chạm).
  const TAP_ONLY: readonly (readonly [string, number, string])[] = [
    ["GT-014", 0, "mục chọn nặng/nhẹ chỉ là chạm"],
    ["GT-029", 0, "kéo vật ra ngoài nhóm, không có slot đích"],
    ["GT-036", 0, "phần tử đã được cầm sẵn, bước đúng là chạm ô dải"],
  ];
  for (const [code, fixtureIndex, why] of TAP_ONLY) {
    it(`${code}: ${why} nên hint không có đích`, async () => {
      const session = await buildSession(
        code,
        fixtureOf(code, fixtureIndex),
        fixtureIndex
      );
      const hint = session.getHintTarget();
      expect(hint?.kind).toBe("slot");
      expect(hint?.kind === "slot" ? hint.toIndex : "x").toBeUndefined();
    });
  }
});
