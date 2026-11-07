import { describe, expect, it } from "vitest";
import {
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "#src/templates/GT-016/fixtures";
import { ClockHandsSession } from "#src/templates/GT-016/session";
import template, {
  GT016ContentSchema,
  GT016DifficultySchema,
} from "#src/templates/GT-016/template";

const RE_MATCH_TIME = /khớp với target_time/;

describe("GT-016: Xoay kim đồng hồ (clock-hands)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-016");
      expect(template.mechanic).toBe("clock-hands");
      expect(template.layouts).toContain("grid");
      expect(template.age_min).toBe(5);
      expect(template.age_max).toBe(6);
      expect(template.requires_tap_fallback).toBe(true);
      expect(template.events).toEqual([
        "game_started",
        "hand_rotated",
        "time_submitted",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation (BR-MTB-06, BR-TAK-04)", () => {
    it("parses all sample levels successfully", () => {
      for (const sample of [SAMPLE_LEVEL_1, SAMPLE_LEVEL_2, SAMPLE_LEVEL_3]) {
        const parsedContent = GT016ContentSchema.parse(sample.content_pack);
        const parsedDiff = GT016DifficultySchema.parse(
          sample.difficulty_params
        );
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects read mode without options matching target time", () => {
      const wrongTargetPack = {
        prompt: "Đọc giờ không có đáp án đúng",
        mode: "read" as const,
        target_time: { hour: 8, minute: 0 as const },
        options: [
          { hour: 7, minute: 0 as const, is_correct: false },
          { hour: 9, minute: 0 as const, is_correct: true },
        ],
      };
      expect(() => GT016ContentSchema.parse(wrongTargetPack)).toThrow(
        RE_MATCH_TIME
      );
    });
  });

  describe("Session Gameplay & Self-Correction (BR-MTB-14)", () => {
    it("runs complete gameplay loop on Sample Level 1 (Read Mode)", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();

      expect(session.getMode()).toBe("read");
      expect(session.getCurrentTime()).toEqual({ hour: 8, minute: 0 });
      expect(session.checkWinCondition()).toBe(false);

      // Select wrong option (index 0: 7:00)
      const wrong = session.selectOption(0);
      expect(wrong).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Select correct option (index 1: 8:00)
      const correct = session.selectOption(1);
      expect(correct).toBe(true);
      expect(session.checkWinCondition()).toBe(true);

      // Calling checkWinCondition 100 times has no side effects
      for (let i = 0; i < 100; i++) {
        expect(session.checkWinCondition()).toBe(true);
      }

      session.completeSession();
      const telemetry = session.getTelemetry();
      expect(telemetry.events.map((e) => e.event_name)).toEqual([
        "game_started",
        "control_of_error",
        "time_submitted",
        "time_submitted",
        "game_completed",
      ]);
    });

    it("supports Montessori 2-Phase (Explore -> Challenge), Day Period labels, Control of Error, and Micro-Sandbox Retry", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.setupEntities();
      session.startExplorePhase();

      expect(session.getExploreTracker().getPhase()).toBe("explore");
      expect(session.getDayPeriodLabel()).toBe("Buổi trưa");

      // Xoay kim lần 1
      session.adjustTime(1);
      expect(session.getExploreTracker().getPhase()).toBe("explore");

      // Xoay kim lần 2 -> đủ ngưỡng 2 thao tác, chuyển sang challenge
      session.adjustTime(1);
      expect(session.getExploreTracker().getPhase()).toBe("challenge");
      expect(session.getDayPeriodLabel()).toBe("Buổi chiều");

      session.setHour(8);
      expect(session.getDayPeriodLabel()).toBe("Buổi sáng");

      // Đặt giờ sai (4:00 thay vì 4:30) và nộp sai lần 1
      session.setHour(4);
      session.setMinute(0);
      expect(session.submitTime()).toBe(false);
      expect(session.getControlOfError()?.reasonVi).toBe(
        "Đồng hồ chỉ 04:00, mục tiêu là 04:30"
      );
      expect(session.isMicroSandboxActive()).toBe(false);

      // Nộp sai lần 2 liên tiếp -> bật Micro-Sandbox
      expect(session.submitTime()).toBe(false);
      expect(session.isMicroSandboxActive()).toBe(true);

      // Chỉnh đúng 4:30 và nộp -> tắt Micro-Sandbox và thắng
      session.setMinute(30);
      expect(session.submitTime()).toBe(true);
      expect(session.isMicroSandboxActive()).toBe(false);
      expect(session.getControlOfError()).toBeNull();
      expect(session.checkWinCondition()).toBe(true);
    });

    it("runs complete gameplay loop on Sample Level 2 (Set Mode)", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.setupEntities();

      expect(session.getMode()).toBe("set");
      expect(session.checkWinCondition()).toBe(false);

      // Rotate hour to 4 and minute to 30
      session.setHour(4);
      session.setMinute(30);
      expect(session.getCurrentTime()).toEqual({ hour: 4, minute: 30 });
      // Kim đúng giờ chưa đủ: chỉ `commit` mới nộp giờ (`GT-016.md` N3, `BR-PSZ-05`).
      expect(session.checkWinCondition()).toBe(false);
      session.dispatch({ type: "commit", timeMs: 0 });
      expect(session.checkWinCondition()).toBe(true);
    });

    it("runs complete gameplay loop on Sample Level 3 (Match Mode)", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_3.content_pack,
        SAMPLE_LEVEL_3.difficulty_params
      );
      session.setupEntities();

      expect(session.getMode()).toBe("match");
      expect(session.checkWinCondition()).toBe(false);
      expect(session.getHintTargetIndex()).toBe(0); // breakfast

      // Thử match card sai (sleep: 9:00, đồng hồ 7:00)
      const wrongMatch = session.matchCard("sleep");
      expect(wrongMatch).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Match card đúng (breakfast: 7:00)
      const correctMatch = session.matchCard("breakfast");
      expect(correctMatch).toBe(true);
      expect(session.checkWinCondition()).toBe(true);
    });

    it("handles retry flow: submit incorrect time, adjust and submit correct time", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.setupEntities();
      // Đặt 4:00 (sai vì target là 4:30)
      session.setHour(4);
      session.setMinute(0);
      expect(session.checkWinCondition()).toBe(false);

      // Commit lần 1: nộp sai
      const verdict1 = session.dispatch({ type: "commit", timeMs: 0 });
      expect(verdict1?.valid).toBe(false);
      expect(verdict1?.feedback).toBe("amber_soft");
      expect(session.checkWinCondition()).toBe(false);

      // Chỉnh thêm 30 phút
      session.applyTimeDelta(30);
      expect(session.getCurrentTime()).toEqual({ hour: 4, minute: 30 });
      // Vừa chỉnh xong chưa bấm commit -> checkWinCondition vẫn false
      expect(session.checkWinCondition()).toBe(false);

      // Commit lần 2: nộp đúng -> thắng
      const verdict2 = session.dispatch({ type: "commit", timeMs: 0 });
      expect(verdict2?.valid).toBe(true);
      expect(verdict2?.feedback).toBe("pop_celebrate");
      expect(session.checkWinCondition()).toBe(true);
    });

    it("bước giờ quay vòng qua 12 giờ theo cả hai chiều", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        GT016DifficultySchema.parse({
          ...SAMPLE_LEVEL_2.difficulty_params,
          minute_step: 30,
        })
      );
      session.setupEntities();
      session.setHour(12);
      session.setMinute(30);
      session.applyTimeDelta(1);
      expect(session.getCurrentTime()).toEqual({ hour: 1, minute: 0 });

      session.setHour(12);
      session.setMinute(0);
      session.applyTimeDelta(-1);
      expect(session.getCurrentTime()).toEqual({ hour: 11, minute: 30 });
    });

    it("bước 15 phút đi qua :15 và :45", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        GT016DifficultySchema.parse({
          ...SAMPLE_LEVEL_2.difficulty_params,
          minute_step: 15,
        })
      );
      session.setupEntities();
      session.setHour(3);
      session.setMinute(0);
      const seen: number[] = [];
      for (let i = 0; i < 4; i++) {
        session.applyTimeDelta(1);
        seen.push(session.getCurrentTime().minute);
      }
      expect(seen).toEqual([15, 30, 45, 0]);
      expect(session.getCurrentTime().hour).toBe(4);
    });

    it("gợi ý mode set trỏ nút Xong khi kim đã đúng giờ", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.setupEntities();
      session.setHour(4);
      session.setMinute(0);
      expect(session.getHintTarget()).toEqual({ kind: "slot", index: 0 });

      session.setMinute(30);
      expect(session.getHintTarget()).toEqual({ kind: "action" });
    });

    it("tap lên mặt đồng hồ không nộp giờ ở mode set", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.setupEntities();
      session.setHour(4);
      session.setMinute(30);

      expect(session.toAction({ type: "tap", x: 480, y: 180, timeMs: 0 })).toBe(
        null
      );
      expect(session.needsCommit).toBe(true);
    });

    it("provides Vietnamese spokenLabel on entities across read, set, and match modes and supports 24px tap tolerance", () => {
      for (const sample of [SAMPLE_LEVEL_1, SAMPLE_LEVEL_2, SAMPLE_LEVEL_3]) {
        const session = new ClockHandsSession(
          sample.content_pack,
          sample.difficulty_params
        );
        session.prepareRound("5-6");
        const view = session.getView();
        const ids = view.entities.map((e) => e.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const entity of view.entities) {
          expect(entity.spokenLabel).toContain("giờ");
        }
      }

      const readSession = new ClockHandsSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      readSession.prepareRound("5-6");
      const correctSlot = readSession.slots[1];
      expect(correctSlot).toBeDefined();
      if (!correctSlot) {
        return;
      }
      const r =
        Math.min(
          correctSlot.hitW ?? correctSlot.w,
          correctSlot.hitH ?? correctSlot.h
        ) / 2;
      const verdict = readSession.dispatch({
        type: "tap",
        x: correctSlot.x,
        y: correctSlot.y + r + 18,
        timeMs: 10,
      });
      expect(verdict?.valid).toBe(true);
      expect(readSession.checkWinCondition()).toBe(true);
    });
  });
});
