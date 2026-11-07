import { describe, expect, it } from "vitest";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures";
import {
  GT036_INVITE_LINE,
  GT036_LIGHT_STEP_MS,
  GT036Session,
} from "#src/templates/GT-036/session";

/**
 * Task #313 — GT-036: mô-típ sáng lần lượt kèm lời mời bằng giọng nói
 * (`BR-E036-11`). Fixture 0: sao/trăng, dải 6, lặp ≥3.
 */
const RAW_OR_DIGIT = /star|moon|\[|\d/;
const found = GT036_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;

function build(): GT036Session {
  const session = new GT036Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

function fill(session: GT036Session, ids: readonly string[]): void {
  ids.forEach((elementId, slotIndex) => {
    session.commit({ type: "place_element", data: { slotIndex, elementId } });
  });
}

function litIds(session: GT036Session): string[] {
  return session
    .getView()
    .entities.filter((e) => e.id.startsWith("track_") && e.state === "active")
    .map((e) => e.id);
}

describe("GT-036 — mô-típ sáng lần lượt (BR-E036-11)", () => {
  it("mô-típ hai ô (sao, trăng) sáng từng ô theo nhịp rồi giữ sáng", () => {
    const session = build();
    fill(session, ["star", "moon", "star", "moon", "star", "moon"]);
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(litIds(session)).toEqual(["track_0"]);
    session.update(GT036_LIGHT_STEP_MS);
    expect(litIds(session)).toEqual(["track_0", "track_1"]);
    session.update(GT036_LIGHT_STEP_MS * 10);
    expect(litIds(session)).toEqual(["track_0", "track_1"]);
  });

  it("chưa có luật: các ô đã đặt sáng lần lượt, theo thứ tự trên dải", () => {
    const session = build();
    fill(session, ["star", "star", "star", "star", "star", "star"]);
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(litIds(session)).toEqual(["track_0"]);
    session.update(GT036_LIGHT_STEP_MS * 2);
    expect(litIds(session)).toEqual(["track_0", "track_1", "track_2"]);
    session.update(GT036_LIGHT_STEP_MS * 10);
    expect(litIds(session)).toHaveLength(6);
  });
});

describe("GT-036 — lời mời bằng giọng nói (BR-E036-11)", () => {
  it("chốt mà chưa có luật: đọc lời mời đúng một lần", () => {
    const session = build();
    fill(session, ["star", "star", "star", "star", "star", "star"]);
    expect(session.takeSpokenInvitation()).toBeNull();
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(session.takeSpokenInvitation()).toBe(GT036_INVITE_LINE);
    expect(session.takeSpokenInvitation()).toBeNull();
  });

  it("chốt đã có luật hoặc đặt thêm hạt: không có lời mời", () => {
    const session = build();
    fill(session, ["star", "moon", "star", "moon", "star", "moon"]);
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(session.takeSpokenInvitation()).toBeNull();
  });

  it("lời mời không in mã thô và không có chữ số", () => {
    expect(GT036_INVITE_LINE).not.toMatch(RAW_OR_DIGIT);
  });
});
