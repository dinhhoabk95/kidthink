import { describe, expect, it } from "vitest";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures";
import { GT006Session } from "#src/templates/GT-006/session";

const PILL_REASON = /toa|thứ tự|nhịp/i;

describe("TemplateGameSession.takePillNarration (BR-PNR-12)", () => {
  it("GT-006: nộp sai dãy thì lý do trên pill được đọc đúng một lần", () => {
    const fixture = GT006_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-006");
    }
    const session = new GT006Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5");
    const submit = session.toAction({ type: "commit", timeMs: 0 });
    expect(submit).not.toBeNull();
    if (!submit) {
      return;
    }
    session.dispatch({ type: "commit", timeMs: 0 });
    const line = session.takePillNarration();
    expect(line).toMatch(PILL_REASON);
    expect(session.takePillNarration()).toBeNull();
  });
});
