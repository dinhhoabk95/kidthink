import { describe, expect, it } from "vitest";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures.js";
import { GT036Session } from "#src/templates/GT-036/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const DIGITS = /^\d+$/;

function makeSession(): GT036Session {
  const fixture = GT036_FIXTURES[0];
  if (!fixture) {
    throw new Error("Thiếu fixture GT-036");
  }
  const session = new GT036Session(fixture.content, fixture.difficulty);
  session.prepareRound("5-6");
  return session;
}

function fillAlternating(session: GT036Session): void {
  ["star", "moon", "star", "moon", "star", "moon"].forEach(
    (elementId, slotIndex) => {
      session.commit({ type: "place_element", data: { slotIndex, elementId } });
    }
  );
}

describe("GT-036: không chữ phải đọc (BR-E036-09)", () => {
  it("canvas không vẽ chữ cái nào, kể cả sau khi chốt và có luật", () => {
    const session = makeSession();
    expect(
      lettersOnly(collectRenderedText(session, { prepare: false }))
    ).toEqual([]);
    fillAlternating(session);
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.ruleOverlayText()).not.toBeNull();
    expect(
      lettersOnly(collectRenderedText(session, { prepare: false }))
    ).toEqual([]);
  });

  it("view không có label chữ, mọi entity có spokenLabel", () => {
    const session = makeSession();
    fillAlternating(session);
    const { entities } = session.getView();
    expect(entities.length).toBeGreaterThan(0);
    for (const entity of entities) {
      expect(entity.label ?? "0").toMatch(DIGITS);
      expect(entity.spokenLabel).toBeTruthy();
    }
  });
});
