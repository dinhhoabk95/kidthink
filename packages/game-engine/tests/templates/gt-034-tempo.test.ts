import { describe, expect, it } from "vitest";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures";
import { GT034Session } from "#src/templates/GT-034/session";

/**
 * Task #313 — GT-034: `difficulty_params.tempo_bpm` có tác dụng thật
 * (`BR-E034-11`). Fixture 0: content 80 BPM (một phách 750 ms), dung sai 160 ms.
 */
const found = GT034_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;
const RIGHT = ["drum", "cymbal", "drum", "cymbal"];

function build(tempo?: number): GT034Session {
  const difficulty =
    tempo === undefined ? f.difficulty : { ...f.difficulty, tempo_bpm: tempo };
  const session = new GT034Session(f.content, difficulty);
  session.prepareRound("5-6");
  return session;
}

function playWithGap(session: GT034Session, gapMs: number) {
  let last: ReturnType<GT034Session["dispatch"]>;
  RIGHT.forEach((id, i) => {
    const e = session.getView().entities.find((v) => v.id === id);
    if (!e) {
      throw new Error(`Thiếu ${id}`);
    }
    last = session.dispatch({
      type: "tap",
      x: e.x,
      y: e.y,
      timeMs: 1000 + i * gapMs,
    });
  });
  return last;
}

describe("GT-034 — tempo_bpm của độ khó (BR-E034-11)", () => {
  it("không khai ở độ khó thì theo content (80 BPM, phách 750 ms)", () => {
    expect(f.content.tempo_bpm).toBe(80);
    expect(playWithGap(build(), 750)?.valid).toBe(true);
    expect(playWithGap(build(), 500)?.valid).toBe(false);
  });

  it("độ khó 120 BPM thì phách 500 ms: gõ cách 500 ms thắng, cách 750 ms trượt nhịp", () => {
    const fast = build(120);
    expect(playWithGap(fast, 500)?.valid).toBe(true);
    expect(playWithGap(build(120), 750)?.valid).toBe(false);
  });

  it("sự kiện pattern_played ghi nhịp thực dùng", () => {
    const session = build(120);
    session.commit({ type: "play_pattern", data: {} });
    const played = session
      .getTelemetry()
      .events.find((e) => e.event_name === "pattern_played");
    expect(played?.data.tempo_bpm).toBe(120);
  });
});
