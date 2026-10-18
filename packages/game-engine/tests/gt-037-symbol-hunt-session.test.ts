import { describe, expect, it } from "vitest";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
} from "#src/game-session";
import { resolveTouchFloor, SLOT_GAP_PX } from "#src/layout/constants";
import { GT037Session } from "#src/templates/GT-037/session";
import type { GT037Content } from "#src/templates/GT-037/template";

function requireDefined<T>(
  val: T | undefined | null,
  msg = "expected defined"
): T {
  if (val === undefined || val === null) {
    throw new Error(msg);
  }
  return val;
}

describe("GT-037 Session (Task #278 S3)", () => {
  const baseSymbols = [
    { id: "sym-target-1", asset: { kind: "text" as const, text: "3" } },
    { id: "sym-target-2", asset: { kind: "text" as const, text: "E" } },
    { id: "sym-confusable-1", asset: { kind: "text" as const, text: "8" } },
    { id: "sym-confusable-2", asset: { kind: "text" as const, text: "B" } },
    { id: "sym-distractor-1", asset: { kind: "text" as const, text: "5" } },
    {
      id: "sym-distractor-star",
      asset: { kind: "emoji" as const, ref: "⭐" },
      orientation_free: true,
    },
  ];

  const singleTargetContent: GT037Content = {
    prompt: "Con tìm hết số 3 nhé",
    symbols: baseSymbols,
    target_ids: ["sym-target-1"],
    target_copies: 5,
    item_count: 18,
    confusable_ids: ["sym-confusable-1", "sym-confusable-2"],
  };

  const twoTargetsContent: GT037Content = {
    prompt: "Con tìm hết số 3 và chữ E nhé",
    symbols: baseSymbols,
    target_ids: ["sym-target-1", "sym-target-2"],
    target_copies: 6,
    item_count: 20,
    confusable_ids: ["sym-confusable-1"],
  };

  describe("BR-E037-01 — Chỉ thắng khi tìm hết", () => {
    it("chưa thắng khi mới tìm một phần và thắng khi chạm đủ mọi bản sao đích", () => {
      const session = new GT037Session(singleTargetContent, {}, 101);
      session.prepareRound("5-6");

      const targetIndices: number[] = [];
      for (let i = 0; i < session.boardSymbols.length; i++) {
        if (session.boardSymbols[i]?.id === "sym-target-1") {
          targetIndices.push(i);
        }
      }
      expect(targetIndices.length).toBe(5);

      // Chạm đúng 4 bản sao đầu
      for (let k = 0; k < 4; k++) {
        const slotIdx = requireDefined(targetIndices[k]);
        const slot = requireDefined(session.slots[slotIdx]);
        const res = session.dispatch({
          type: "tap",
          x: slot.x,
          y: slot.y,
          timeMs: 1000 + k * 500,
        });
        expect(res?.valid).toBe(true);
        expect(res?.feedback).toBe(ACTION_CORRECT.feedback);
        expect(session.checkWinCondition()).toBe(false);
      }

      // Chạm bản sao thứ 5 (cuối cùng)
      const lastSlotIdx = requireDefined(targetIndices[4]);
      const lastSlot = requireDefined(session.slots[lastSlotIdx]);
      const finalRes = session.dispatch({
        type: "tap",
        x: lastSlot.x,
        y: lastSlot.y,
        timeMs: 3500,
      });
      expect(finalRes?.valid).toBe(true);
      expect(finalRes?.feedback).toBe("level_celebrate");
      expect(session.checkWinCondition()).toBe(true);
    });

    it("chế độ finish_mode: declare — chỉ thắng khi bấm commit và tìm đủ", () => {
      const session = new GT037Session(
        singleTargetContent,
        { finish_mode: "declare" },
        202
      );
      session.prepareRound("5-6");
      expect(session.needsCommit).toBe(true);

      const targetIndices: number[] = [];
      for (let i = 0; i < session.boardSymbols.length; i++) {
        if (session.boardSymbols[i]?.id === "sym-target-1") {
          targetIndices.push(i);
        }
      }

      // Chỉ chạm 3 bản sao
      for (let k = 0; k < 3; k++) {
        const slot = requireDefined(
          session.slots[requireDefined(targetIndices[k])]
        );
        session.dispatch({
          type: "tap",
          x: slot.x,
          y: slot.y,
          timeMs: 1000 + k * 400,
        });
      }

      // Bấm nút Con xong rồi khi còn thiếu
      const earlyCommit = session.dispatch({
        type: "commit",
        timeMs: 2500,
      });
      expect(earlyCommit?.valid).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Chạm nốt 2 bản sao còn lại
      for (let k = 3; k < 5; k++) {
        const slot = requireDefined(
          session.slots[requireDefined(targetIndices[k])]
        );
        session.dispatch({
          type: "tap",
          x: slot.x,
          y: slot.y,
          timeMs: 3000 + k * 400,
        });
      }

      // Bấm nút Con xong rồi khi đã đủ
      const finalCommit = session.dispatch({
        type: "commit",
        timeMs: 5000,
      });
      expect(finalCommit?.valid).toBe(true);
      expect(finalCommit?.feedback).toBe("level_celebrate");
      expect(session.checkWinCondition()).toBe(true);
    });
  });

  describe("BR-E037-02 — Chạm sai không bị phạt", () => {
    it("trả về ACTION_RETRY, ghi commission, không trừ điểm và phiên vẫn tiếp tục", () => {
      const session = new GT037Session(
        singleTargetContent,
        { allow_retry: true },
        303
      );
      session.prepareRound("5-6");

      const distractorIndex = session.boardSymbols.findIndex(
        (s) => s.id !== "sym-target-1"
      );
      expect(distractorIndex).toBeGreaterThanOrEqual(0);

      const slot = requireDefined(session.slots[distractorIndex]);
      const verdict = session.validateAction({
        type: "tap_symbol",
        data: {
          slotIndex: distractorIndex,
          symbolId: requireDefined(session.boardSymbols[distractorIndex]).id,
        },
      });
      expect(verdict).toEqual(ACTION_RETRY);

      const res = session.dispatch({
        type: "tap",
        x: slot.x,
        y: slot.y,
        timeMs: 1200,
      });
      expect(res).toEqual(ACTION_RETRY);
      expect(session.commissions.length).toBe(1);
      expect(session.commissions[0]?.slotIndex).toBe(distractorIndex);
      expect(session.checkWinCondition()).toBe(false);

      const telemetry = session.getTelemetry();
      const hasCommissionEvent = telemetry.events.some(
        (e) => e.event_name === "item_selected" && e.data?.commission === true
      );
      expect(hasCommissionEvent).toBe(true);
    });

    it("BR-E037-10 — chạm lại ký hiệu đã khoanh bị bỏ qua (ACTION_IGNORED)", () => {
      const session = new GT037Session(singleTargetContent, {}, 404);
      session.prepareRound("5-6");

      const targetIdx = session.boardSymbols.findIndex(
        (s) => s.id === "sym-target-1"
      );
      const slot = requireDefined(session.slots[targetIdx]);

      // Chạm lần 1
      const res1 = session.dispatch({
        type: "tap",
        x: slot.x,
        y: slot.y,
        timeMs: 1000,
      });
      expect(res1?.valid).toBe(true);

      // Chạm lần 2 trên cùng ô
      const res2 = session.dispatch({
        type: "tap",
        x: slot.x,
        y: slot.y,
        timeMs: 1500,
      });
      expect(res2).toEqual(ACTION_IGNORED);
      expect(session.commissions.length).toBe(0);
    });
  });

  describe("BR-E037-03 — Không chồng sau khi lệch (Property Test 1.000 seeds)", () => {
    it("mọi cặp vùng chạm cách nhau ít nhất SLOT_GAP_PX và đạt sàn chạm sau jitter", () => {
      const band = "5-6";
      const expectedTouchFloor = resolveTouchFloor(band);

      for (let seed = 1; seed <= 1000; seed++) {
        const session = new GT037Session(singleTargetContent, {}, seed);
        session.prepareRound(band);

        const slots = session.slots;
        expect(slots.length).toBe(singleTargetContent.item_count);

        for (let i = 0; i < slots.length; i++) {
          const slotA = requireDefined(slots[i]);
          expect(slotA.hitW).toBeGreaterThanOrEqual(expectedTouchFloor);
          expect(slotA.hitH).toBeGreaterThanOrEqual(expectedTouchFloor);

          for (let j = i + 1; j < slots.length; j++) {
            const slotB = requireDefined(slots[j]);
            const dx = Math.abs(slotA.x - slotB.x);
            const dy = Math.abs(slotA.y - slotB.y);
            const centerDist = Math.hypot(dx, dy);

            // Bán kính vùng chạm
            const rA = slotA.hitW / 2;
            const rB = slotB.hitW / 2;
            const edgeGap = centerDist - (rA + rB);

            expect(edgeGap).toBeGreaterThanOrEqual(SLOT_GAP_PX - 1e-4);
          }
        }
      }
    });
  });

  describe("BR-E037-04 — Cùng seed dựng cùng bảng", () => {
    it("hai phiên cùng seed sinh toạ độ và ký hiệu từng ô giống hệt nhau", () => {
      const seed = 54_321;
      const session1 = new GT037Session(twoTargetsContent, {}, seed);
      const session2 = new GT037Session(twoTargetsContent, {}, seed);

      session1.prepareRound("5-6");
      session2.prepareRound("5-6");

      expect(session1.slots.length).toBe(session2.slots.length);
      for (let i = 0; i < session1.slots.length; i++) {
        const s1 = requireDefined(session1.slots[i]);
        const s2 = requireDefined(session2.slots[i]);
        expect(s1.x).toBe(s2.x);
        expect(s1.y).toBe(s2.y);
        expect(session1.boardSymbols[i]?.id).toBe(session2.boardSymbols[i]?.id);
        expect(session1.rotations[i]).toBe(session2.rotations[i]);
      }
    });
  });

  describe("BR-E037-05 — Thành phần bất biến qua seed (Property Test 1.000 seeds)", () => {
    it("số bản sao đích, tổng số ký hiệu và tập confusable bất biến qua các seed khác nhau", () => {
      const content = twoTargetsContent;
      const refSession = new GT037Session(content, {}, 1);
      refSession.prepareRound("5-6");

      const refTargetCopies = refSession.boardSymbols.filter((s) =>
        content.target_ids.includes(s.id)
      ).length;
      expect(refTargetCopies).toBe(content.target_copies);

      for (let seed = 2; seed <= 1000; seed++) {
        const session = new GT037Session(content, {}, seed);
        session.prepareRound("5-6");

        // 1. Tổng số ký hiệu bằng nhau
        expect(session.boardSymbols.length).toBe(content.item_count);

        // 2. Số bản sao đích bằng nhau
        const targetCount = session.boardSymbols.filter((s) =>
          content.target_ids.includes(s.id)
        ).length;
        expect(targetCount).toBe(content.target_copies);

        // 3. Mọi confusable_ids có mặt
        for (const cId of content.confusable_ids) {
          const hasConfusable = session.boardSymbols.some((s) => s.id === cId);
          expect(hasConfusable).toBe(true);
        }
      }
    });

    it("toạ độ phân bố đích khác nhau giữa 2 seed khác nhau", () => {
      const sessionA = new GT037Session(singleTargetContent, {}, 111);
      const sessionB = new GT037Session(singleTargetContent, {}, 999);
      sessionA.prepareRound("5-6");
      sessionB.prepareRound("5-6");

      const targetsA = sessionA.boardSymbols
        .map((s, idx) => ({ s, slot: requireDefined(sessionA.slots[idx]) }))
        .filter((item) => item.s.id === "sym-target-1");
      const targetsB = sessionB.boardSymbols
        .map((s, idx) => ({ s, slot: requireDefined(sessionB.slots[idx]) }))
        .filter((item) => item.s.id === "sym-target-1");

      const sameCoords = targetsA.every((tA, i) => {
        const tB = targetsB[i];
        return tB && tA.slot.x === tB.slot.x && tA.slot.y === tB.slot.y;
      });
      expect(sameCoords).toBe(false);
    });
  });

  describe("BR-E037-06 — Chữ số và chữ cái không bị xoay", () => {
    it("góc xoay của mọi ô mang chữ số hoặc chữ cái luôn bằng 0", () => {
      for (let seed = 10; seed <= 30; seed++) {
        const session = new GT037Session(singleTargetContent, {}, seed);
        session.prepareRound("5-6");

        for (let i = 0; i < session.boardSymbols.length; i++) {
          const sym = requireDefined(session.boardSymbols[i]);
          if (sym.asset.kind === "text") {
            expect(session.rotations[i]).toBe(0);
          }
        }
      }
    });

    it("cho phép xoay đối với ký hiệu khai orientation_free: true", () => {
      let foundNonZeroRotation = false;
      for (let seed = 1; seed <= 50; seed++) {
        const session = new GT037Session(singleTargetContent, {}, seed);
        session.prepareRound("5-6");

        for (let i = 0; i < session.boardSymbols.length; i++) {
          const sym = requireDefined(session.boardSymbols[i]);
          if (sym.orientation_free) {
            const rot = session.rotations[i] ?? 0;
            if (rot > 0) {
              foundNonZeroRotation = true;
              break;
            }
          }
        }
        if (foundNonZeroRotation) {
          break;
        }
      }
      expect(foundNonZeroRotation).toBe(true);
    });
  });

  describe("Trợ giúp (Scaffolding) & Telemetry", () => {
    it("getHintTargetIndex trả về slot đích chưa tìm và null khi đã tìm hết", () => {
      const session = new GT037Session(singleTargetContent, {}, 555);
      session.prepareRound("5-6");

      const targetIndices: number[] = [];
      for (let i = 0; i < session.boardSymbols.length; i++) {
        if (session.boardSymbols[i]?.id === "sym-target-1") {
          targetIndices.push(i);
        }
      }

      // Lúc đầu chưa tìm ô nào: trả về ô đích đầu tiên
      const hint1 = session.getHintTargetIndex();
      expect(targetIndices.includes(hint1 ?? -1)).toBe(true);

      // Chạm hết các đích
      for (const tIdx of targetIndices) {
        const slot = requireDefined(session.slots[tIdx]);
        session.dispatch({
          type: "tap",
          x: slot.x,
          y: slot.y,
          timeMs: 1000,
        });
      }

      expect(session.getHintTargetIndex()).toBeNull();
    });

    it("ghi nhận chuỗi order và sự kiện round_completed khi hoàn thành", () => {
      const session = new GT037Session(singleTargetContent, {}, 777);
      session.prepareRound("5-6");

      const targetIdx = session.boardSymbols.findIndex(
        (s) => s.id === "sym-target-1"
      );
      const distractorIdx = session.boardSymbols.findIndex(
        (s) => s.id !== "sym-target-1"
      );

      // 1 chạm đúng, 1 chạm sai
      session.dispatch({
        type: "tap",
        x: requireDefined(session.slots[targetIdx]).x,
        y: requireDefined(session.slots[targetIdx]).y,
        timeMs: 1000,
      });
      session.dispatch({
        type: "tap",
        x: requireDefined(session.slots[distractorIdx]).x,
        y: requireDefined(session.slots[distractorIdx]).y,
        timeMs: 1500,
      });

      expect(session.order.length).toBe(2);
      expect(session.order[0]?.isTarget).toBe(true);
      expect(session.order[1]?.isTarget).toBe(false);

      session.completeSession();
      const telemetry = session.getTelemetry();
      const summary = telemetry.events.find(
        (e) => e.event_name === "round_completed"
      );
      expect(summary).toBeDefined();
      expect(summary?.data?.commissions).toBe(1);
      expect(summary?.data?.omissions).toBe(4);
      expect(summary?.data?.order).toEqual([targetIdx, distractorIdx]);
    });

    it("getView trả về danh sách view entities đúng chuẩn", () => {
      const session = new GT037Session(singleTargetContent, {}, 888);
      session.prepareRound("5-6");

      const view = session.getView();
      expect(view.entities.length).toBe(singleTargetContent.item_count);
      expect(view.activePrompt).toBe(singleTargetContent.prompt);

      const targetEntity = view.entities.find((e) => e.role === "target");
      expect(targetEntity).toBeDefined();
      expect(targetEntity?.hitShape).toBe("circle");
      expect(targetEntity?.state).toBe("idle");
    });
  });
});
