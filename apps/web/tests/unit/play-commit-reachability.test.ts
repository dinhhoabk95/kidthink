import {
  createGameSessionSync,
  type EngineConfig,
  type GameSession,
  type GT028Content,
  type GT028Difficulty,
  preloadGameSession,
  RoundRunner,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Task #277 S0, hiện trạng H3 — GT-028 chỉ nộp bài qua gesture `commit`
 * (`GT-028/session.ts` `toAction`), còn trang chơi chỉ gửi `commit` từ ba nút
 * intro của GT-000 (`pages/play/[code].vue` `handleEcho*`, `handleIntroPrev`).
 * Mọi đường còn lại của bề mặt web là `tap` tại một toạ độ canvas. Test quét
 * `tap` trên toàn không gian logic sau khi chạm đủ số: nếu không toạ độ nào
 * thắng được vòng thì trẻ kẹt.
 *
 * `it.fails` giữ test này xanh trong `check:test-ratchet` khi lỗi còn đó.
 * S4 (`BR-PSZ-05` — nút hành động do shell đổi thành `commit`) phải đổi
 * `it.fails` thành `it`; ca âm của S4 là gỡ nhánh đổi chạm thì test đỏ lại.
 */

const GT028_CONTENT: GT028Content = {
  prompt: "Bé hãy chạm từng quả táo để đếm nhảy cóc 2 cho đủ 8 nhé!",
  step: 2,
  target_total: 8,
  items: [
    { item_id: "apple_1", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "apple_2", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "apple_3", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "apple_4", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "apple_5", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "apple_6", asset: { kind: "emoji", ref: "🍎" } },
  ],
};

const GT028_DIFFICULTY: GT028Difficulty = {
  step: 2,
  item_count: 6,
  allow_undo: true,
  hint_after_ms: 8000,
  shuffle_items: false,
};

const GT028_ENGINE_CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT028",
  content_version: 1,
  template_code: "GT-028",
  content_pack: GT028_CONTENT,
  difficulty_params: GT028_DIFFICULTY,
  theme_id: "default",
  age_band: "4-5",
  reduced_motion: false,
  audio_enabled: false,
};

const LOGIC_W = 960;
const LOGIC_H = 540;
const SWEEP_STEP_PX = 12;

function countSelected(session: GameSession): number {
  const entities = session.getView?.().entities ?? [];
  return entities.filter((e) => e.state === "selected").length;
}

function makeRunner(): RoundRunner {
  return new RoundRunner({
    rounds: [
      {
        round_index: 0,
        content_pack: GT028_CONTENT,
        difficulty_params: GT028_DIFFICULTY,
      },
    ],
    ageBand: "4-5",
    layoutSeed: 1,
    sessionFactory: (contentPack, difficultyParams, roundSeed) =>
      createGameSessionSync("GT-028", {
        ...GT028_ENGINE_CONFIG,
        content_pack: contentPack,
        difficulty_params: difficultyParams,
        layout_seed: roundSeed,
      }),
    onPlayNarration: () => undefined,
  });
}

/**
 * Chạm một điểm. Nếu chạm đó bật/tắt một vật (đổi số vật đang chọn) thì chạm
 * lại đúng chỗ để trả bàn về trạng thái cũ — quét chỉ đi tìm đường nộp bài,
 * không được làm lệch số đã đếm.
 */
function probeTap(session: GameSession, x: number, y: number): void {
  const before = countSelected(session);
  session.dispatch?.({ type: "tap", x, y, timeMs: 0 });
  if (countSelected(session) !== before && !session.checkWinCondition()) {
    session.dispatch?.({ type: "tap", x, y, timeMs: 0 });
  }
}

describe("Task #277 S0 — H3: GT-028 nộp bài từ bề mặt web", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-028");
  });

  it("chạm đủ số đúng rồi dispatch commit thì thắng — engine đúng, lỗi nằm ở đường tới", () => {
    const runner = makeRunner();
    runner.startFirstRound();
    const session = runner.getCurrentSession();
    if (!session) {
      throw new Error("Thiếu session GT-028");
    }
    const needed = GT028_CONTENT.target_total / GT028_CONTENT.step;
    for (const entity of (session.getView?.().entities ?? []).slice(
      0,
      needed
    )) {
      session.dispatch?.({ type: "tap", x: entity.x, y: entity.y, timeMs: 0 });
    }
    expect(countSelected(session)).toBe(needed);

    session.dispatch?.({ type: "commit", timeMs: 0 });

    expect(session.checkWinCondition()).toBe(true);
  });

  it.fails("BR-PSZ-05 — chạm đủ số rồi chỉ dùng tap trên canvas vẫn thắng được vòng", () => {
    const runner = makeRunner();
    runner.startFirstRound();
    const session = runner.getCurrentSession();
    if (!session) {
      throw new Error("Thiếu session GT-028");
    }
    const needed = GT028_CONTENT.target_total / GT028_CONTENT.step;
    for (const entity of (session.getView?.().entities ?? []).slice(
      0,
      needed
    )) {
      session.dispatch?.({ type: "tap", x: entity.x, y: entity.y, timeMs: 0 });
    }
    expect(countSelected(session)).toBe(needed);

    for (
      let y = 0;
      y <= LOGIC_H && !session.checkWinCondition();
      y += SWEEP_STEP_PX
    ) {
      for (
        let x = 0;
        x <= LOGIC_W && !session.checkWinCondition();
        x += SWEEP_STEP_PX
      ) {
        probeTap(session, x, y);
      }
    }

    expect(session.checkWinCondition()).toBe(true);
  });
});
