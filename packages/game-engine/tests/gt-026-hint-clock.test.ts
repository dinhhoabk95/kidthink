import { describe, expect, it } from "vitest";
import { GameEngine } from "#src/index";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures";
import { GT026Session } from "#src/templates/GT-026/session";

/** BR-E026-10 — thang hạ độ khó đi theo đồng hồ trợ giúp chung và `hint_after_ms` của vòng. */
function missing(): never {
  throw new Error("Thiếu fixture GT-026");
}
const fixture = GT026_FIXTURES[0] ?? missing();

type TrialKind = "go" | "nogo";

function engineWith(
  hintAfterMs: number,
  kinds: readonly TrialKind[] = Array.from({ length: 12 }, () => "go")
): {
  engine: GameEngine;
  session: GT026Session;
} {
  const difficulty = { ...fixture.difficulty, hint_after_ms: hintAfterMs };
  const session = new GT026Session(
    {
      ...fixture.content,
      trials: kinds.map((kind, i) => ({ id: `t${i}`, kind })),
    },
    difficulty
  );
  const engine = new GameEngine();
  engine.load(
    {
      level_code: "LVL-026",
      content_version: 1,
      template_code: "GT-026",
      content_pack: session.content,
      difficulty_params: difficulty,
      theme_id: "default",
      age_band: "4-5",
      reduced_motion: false,
      audio_enabled: false,
    },
    () => session
  );
  return { engine, session };
}

describe("GT-026: thang hạ độ khó theo hint_after_ms", () => {
  it("chưa tới hint_after_ms thì cửa sổ giữ nguyên dù đã bỏ sót nhiều lượt go", () => {
    const { engine, session } = engineWith(12_000);
    for (let i = 0; i < 10; i++) {
      engine.advanceFrame(1000);
    }
    expect(session.getWindowMs()).toBe(fixture.difficulty.stimulus_window_ms);
    engine.destroy();
  });

  it("quá hint_after_ms không phản ứng thì cửa sổ được nới (L1)", () => {
    const { engine, session } = engineWith(6000);
    for (let i = 0; i < 8; i++) {
      engine.advanceFrame(1000);
    }
    expect(session.getWindowMs()).toBeGreaterThan(
      fixture.difficulty.stimulus_window_ms
    );
    engine.destroy();
  });

  it("trẻ thụ động ở luồng go/nogo trộn vẫn tới L1: kìm được nogo không đặt lại đồng hồ", () => {
    // Mỗi lượt ~ stimulus_window_ms + isi_ms; lượt nogo hết giờ là "đúng" nhưng
    // không phải phản ứng — đặt lại đồng hồ thì thang không bao giờ leo.
    const kinds: TrialKind[] = Array.from({ length: 12 }, (_, i) =>
      i % 2 === 0 ? "go" : "nogo"
    );
    const { engine, session } = engineWith(6000, kinds);
    for (let i = 0; i < 8; i++) {
      engine.advanceFrame(1000);
    }
    expect(session.getWindowMs()).toBeGreaterThan(
      fixture.difficulty.stimulus_window_ms
    );
    engine.destroy();
  });

  it("hook onScaffoldEscalated được gọi đúng một lần mỗi lần leo", () => {
    const { engine, session } = engineWith(3000);
    const levels: number[] = [];
    const original = session.onScaffoldEscalated.bind(session);
    session.onScaffoldEscalated = (level, trigger): void => {
      levels.push(level);
      original(level, trigger);
    };
    for (let i = 0; i < 60; i++) {
      engine.advanceFrame(500);
    }
    expect(levels.length).toBeGreaterThan(0);
    expect(new Set(levels).size).toBe(levels.length);
    expect([...levels].sort()).toEqual(levels);
    engine.destroy();
  });
});
