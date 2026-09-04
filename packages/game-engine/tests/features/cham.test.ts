import { describe, expect, it } from "vitest";
import {
  type ClientPoint,
  type ElementRect,
  toLogicPoint,
} from "#src/interaction";
import { RoundRunner } from "#src/round-runner";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures";
import { GT001Session } from "#src/templates/GT-001/session";
import type {
  GT001Content,
  GT001Difficulty,
} from "#src/templates/GT-001/template";

describe("Feature: Hành vi chạm (tap) của họ engine tap — cham.feature", () => {
  const canvasRect: ElementRect = {
    left: 0,
    top: 0,
    width: 960,
    height: 540,
  };

  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("GT001_FIXTURES[0] must exist");
  }

  describe("Scenario Outline: Chạm nền thì không method nào chạy (Examples: GT-001)", () => {
    it("GT-001: khi chạm ngoài vùng slot, không commit action và state không đổi", () => {
      const session = new GT001Session(fixture.content, fixture.difficulty);
      session.prepareRound("3-4");

      const pointer: ClientPoint = { x: 50, y: 50 };
      const logicPt = toLogicPoint(pointer, canvasRect);

      const eventsBefore = session.getTelemetry().events.length;
      const result = session.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 100,
      });

      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(session.selectedItemId).toBeNull();
      expect(session.getTelemetry().events.length).toBe(eventsBefore);
    });
  });

  describe("Scenario Outline: Chạm lại vào đích đã chọn thì giữ (Examples: GT-001)", () => {
    it("GT-001: chạm lại vào slot đã chọn thì giữ nguyên lựa chọn", () => {
      const session = new GT001Session(fixture.content, fixture.difficulty);
      session.prepareRound("3-4");

      const firstSlot = session.slots[0];
      if (!firstSlot) {
        throw new Error("firstSlot must exist");
      }

      const pointer1: ClientPoint = { x: firstSlot.x, y: firstSlot.y };
      const logicPt1 = toLogicPoint(pointer1, canvasRect);

      // Chạm lần 1
      session.dispatch({
        type: "tap",
        x: logicPt1.x,
        y: logicPt1.y,
        timeMs: 100,
      });

      const selectedId = session.selectedItemId;
      expect(selectedId).toBeTruthy();

      // Chạm lần 2 vào cùng toạ độ
      session.dispatch({
        type: "tap",
        x: logicPt1.x,
        y: logicPt1.y,
        timeMs: 200,
      });

      expect(session.selectedItemId).toBe(selectedId);
    });
  });

  describe("Scenario Outline: Vòng hai dùng hình học vòng hai (Examples: GT-001)", () => {
    it("GT-001: vòng hai n=4 có ô thứ 4 nhận diện đúng toạ độ mà vòng 1 không có", () => {
      const round1Content: GT001Content = {
        ...fixture.content,
        options: fixture.content.options.slice(0, 3),
      };
      const round2Content: GT001Content = {
        ...fixture.content,
        options: [
          ...fixture.content.options.slice(0, 3),
          {
            item_id: "extra_opt_4",
            asset: { kind: "emoji", ref: "🍇" },
            is_correct: false,
          },
        ],
      };

      const difficultyNoShuffle: GT001Difficulty = {
        ...fixture.difficulty,
        shuffle_items: false,
      };

      const runner = new RoundRunner({
        ageBand: "3-4",
        rounds: [
          {
            round_index: 0,
            content_pack: round1Content,
            difficulty_params: difficultyNoShuffle,
          },
          {
            round_index: 1,
            content_pack: round2Content,
            difficulty_params: difficultyNoShuffle,
          },
        ],
        sessionFactory: (content, difficulty, seed) => {
          return new GT001Session(
            content as GT001Content,
            difficulty as GT001Difficulty,
            seed
          );
        },
        layoutSeed: 42,
      });

      runner.startFirstRound();
      const session1 = runner.getCurrentSession() as GT001Session;
      expect(session1.slots.length).toBe(3);

      // Hoàn thành vòng 1 để chuyển sang vòng 2
      session1.onItemLocked("apple_opt");
      runner.completeCurrentRound();

      const session2 = runner.getCurrentSession() as GT001Session;
      expect(session2.slots.length).toBe(4);

      // Slot thứ tư của vòng 2
      const slot4 = session2.slots[3];
      if (!slot4) {
        throw new Error("slot4 must exist");
      }

      const pointer: ClientPoint = { x: slot4.x, y: slot4.y };
      const logicPt = toLogicPoint(pointer, canvasRect);

      session2.dispatch({
        type: "tap",
        x: logicPt.x,
        y: logicPt.y,
        timeMs: 300,
      });

      expect(session2.selectedItemId).toBe("extra_opt_4");
    });
  });
});
