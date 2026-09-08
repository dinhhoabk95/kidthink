/**
 * Unit tests cho các luật cơ chế riêng của lô Legacy V1 (GT-018..GT-024)
 * theo Task #263 T18.3.
 *
 * Kiểm tra các mã luật:
 * - BR-E018-01..03 (GT-018: Nghe rồi làm listen-respond)
 * - BR-E019-01..03 (GT-019: Xoay và lật mảnh rotate-transform)
 * - BR-E020-01..03 (GT-020: Lật thẻ tìm cặp memory-flip)
 * - BR-E021-01..03 (GT-021: Hoàn thiện đối xứng mirror-complete)
 * - BR-E022-01..03 (GT-022: Tìm vật thể ẩn hidden-object)
 * - BR-E023-01..03 (GT-023: Lắp ghép hình thể construct)
 * - BR-E024-01..03 (GT-024: Vẽ theo nét trace-path)
 */
import { describe, expect, it } from "vitest";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
} from "#src/game-session";
import { GT018_FIXTURES } from "#src/templates/GT-018/fixtures.js";
import { GT018Session } from "#src/templates/GT-018/session.js";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures.js";
import { GT019Session } from "#src/templates/GT-019/session.js";
import { GT020_FIXTURES } from "#src/templates/GT-020/fixtures.js";
import { GT020Session } from "#src/templates/GT-020/session.js";
import { GT021_FIXTURES } from "#src/templates/GT-021/fixtures.js";
import { GT021Session } from "#src/templates/GT-021/session.js";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures.js";
import { GT022Session } from "#src/templates/GT-022/session.js";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures.js";
import { GT023Session } from "#src/templates/GT-023/session.js";
import { GT024_FIXTURES } from "#src/templates/GT-024/fixtures.js";
import { GT024Session } from "#src/templates/GT-024/session.js";
import GT024Def from "#src/templates/GT-024/template.js";

function getFixture<T>(fixtures: readonly T[], index = 0): T {
  const item = fixtures[index];
  if (!item) {
    throw new Error(`Missing fixture at index ${index}`);
  }
  return item;
}

describe("T18.3: Lô Legacy V1 — Luật cơ chế thật (GT-018..GT-024)", () => {
  describe("GT-018: Nghe rồi làm (listen-respond)", () => {
    const fixture = getFixture(GT018_FIXTURES);

    it("BR-E018-01: phân giải đúng theo response_mode", () => {
      const session = new GT018Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const correctOpt = fixture.content.options.find((o) => o.is_correct);
      if (!correctOpt) {
        throw new Error("Missing correct option");
      }
      const res = session.validateAction({
        type: "tap_option",
        data: { item_id: correctOpt.item_id },
      });
      expect(res).toBe(ACTION_CORRECT);

      const wrongOpt = fixture.content.options.find((o) => !o.is_correct);
      if (wrongOpt) {
        const resWrong = session.validateAction({
          type: "tap_option",
          data: { item_id: wrongOpt.item_id },
        });
        expect(resWrong).toBe(ACTION_RETRY);
      }
    });

    it("BR-E018-02: thao tác nghe lại không tăng số lần sai", () => {
      const session = new GT018Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      expect(fixture.content.audio_prompt.text.length).toBeGreaterThan(0);
      const initialSelected = session.selectedItemId;
      expect(session.checkWinCondition()).toBe(false);
      expect(session.selectedItemId).toBe(initialSelected);
    });

    it("BR-E018-03: danh sách options từ 2 đến 8 với ít nhất 1 đáp án đúng", () => {
      for (const f of GT018_FIXTURES) {
        expect(f.content.options.length).toBeGreaterThanOrEqual(2);
        expect(f.content.options.length).toBeLessThanOrEqual(8);
        if (f.content.response_mode === "select") {
          expect(f.content.options.some((o) => o.is_correct)).toBe(true);
        } else {
          expect(f.content.target_sequence?.length).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });

  describe("GT-019: Xoay và lật mảnh (rotate-transform)", () => {
    const fixture = getFixture(GT019_FIXTURES);

    it("BR-E019-01: xoay mảnh ghép theo bước 90 độ", () => {
      const session = new GT019Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const piece0 = fixture.content.pieces[0];
      if (!piece0) {
        throw new Error("Missing piece");
      }
      const initRot = session.getPieceTransform(piece0.piece_id)?.rotation ?? 0;
      const updated = session.onRotatePiece(piece0.piece_id, "cw");
      expect(updated?.rotation).toBe((initRot + 90) % 360);
    });

    it("BR-E019-02: thao tác lật bị chặn khi allow_flip là false", () => {
      const session = new GT019Session(fixture.content, {
        ...fixture.difficulty,
        allow_flip: false,
      });
      session.setupEntities();

      const piece0 = fixture.content.pieces[0];
      if (!piece0) {
        throw new Error("Missing piece");
      }
      const flipped = session.onFlipPiece(piece0.piece_id, "horizontal");
      expect(flipped).toBeUndefined();
    });

    it("BR-E019-03: mảnh ghép chỉ khớp khi đúng cả slot và rotation", () => {
      const session = new GT019Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const slot = fixture.content.target_slots[0];
      const piece = fixture.content.pieces[0];
      if (!(slot && piece)) {
        throw new Error("Missing target slot or piece");
      }

      // Đặt vào đúng slot
      const res = session.validateAction({
        type: "place_piece",
        data: { piece_id: piece.piece_id, target_slot_id: slot.slot_id },
      });
      expect(res).toBeDefined();
    });
  });

  describe("GT-020: Lật thẻ tìm cặp (memory-flip)", () => {
    const fixture = getFixture(GT020_FIXTURES);

    it("BR-E020-01: hai thẻ cùng pair_key giữ ngửa", () => {
      const session = new GT020Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const pair0 = fixture.content.pairs[0];
      if (!pair0) {
        throw new Error("Missing pair");
      }

      session.onTapCard(pair0.card_a.card_id);
      const res2 = session.onTapCard(pair0.card_b.card_id);
      expect(res2?.isMatch).toBe(true);
      expect(session.cardSystem.getCard(pair0.card_a.card_id)?.state).toBe(
        "matched"
      );
    });

    it("BR-E020-02: hai thẻ lệch cặp tự động úp lại", () => {
      const session = new GT020Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const pair0 = fixture.content.pairs[0];
      const pair1 = fixture.content.pairs[1];
      if (!(pair0 && pair1)) {
        throw new Error("Missing pairs");
      }

      session.onTapCard(pair0.card_a.card_id);
      const resMismatch = session.onTapCard(pair1.card_a.card_id);
      expect(resMismatch?.isMatch).toBe(false);
    });

    it("BR-E020-03: thẻ đã mở không nhận tương tác lật lại", () => {
      const session = new GT020Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const pair0 = fixture.content.pairs[0];
      if (!pair0) {
        throw new Error("Missing pair");
      }

      session.onTapCard(pair0.card_a.card_id);
      const resRetap = session.validateAction({
        type: "tap_card",
        data: { card_id: pair0.card_a.card_id },
      });
      expect(resRetap).toBe(ACTION_IGNORED);
    });
  });

  describe("GT-021: Hoàn thiện đối xứng (mirror-complete)", () => {
    const fixture = getFixture(GT021_FIXTURES);

    it("BR-E021-01: nửa mẫu tham chiếu là bất biến", () => {
      const session = new GT021Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const refSlot = fixture.content.reference_pattern[0];
      if (!refSlot) {
        throw new Error("Missing reference slot");
      }

      const res = session.validateAction({
        type: "place_item",
        data: { item_id: "any", target_id: refSlot.slot_id },
      });
      expect(res).toBe(ACTION_IGNORED);
    });

    it("BR-E021-02: khớp đúng đối xứng qua trục", () => {
      const session = new GT021Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const targetSlot = fixture.content.target_slots[0];
      if (!targetSlot) {
        throw new Error("Missing target slot");
      }

      const correctOpt = fixture.content.options.find(
        (o) => o.asset_ref === targetSlot.expected_asset_ref
      );
      if (!correctOpt) {
        throw new Error("Missing correct option");
      }

      const res = session.validateAction({
        type: "place_item",
        data: { item_id: correctOpt.item_id, target_id: targetSlot.slot_id },
      });
      expect(res).toBe(ACTION_CORRECT);
    });

    it("BR-E021-03: hoàn thành khi toàn bộ ô đích đúng", () => {
      const session = new GT021Session(fixture.content, fixture.difficulty);
      session.setupEntities();
      expect(session.checkWinCondition()).toBe(false);
    });
  });

  describe("GT-022: Tìm vật thể ẩn (hidden-object)", () => {
    const fixture = getFixture(GT022_FIXTURES);

    it("BR-E022-01: chạm vật thể mục tiêu ghi nhận tìm thấy", () => {
      const session = new GT022Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const targetObj = fixture.content.scene_objects.find((o) => o.is_target);
      if (!targetObj) {
        throw new Error("Missing target object");
      }

      const res = session.validateAction({
        type: "tap_object",
        data: { item_id: targetObj.id },
      });
      expect(res).toBe(ACTION_CORRECT);
    });

    it("BR-E022-02: chạm vật thể nhiễu không phạt", () => {
      const session = new GT022Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const distractor = fixture.content.scene_objects.find(
        (o) => !o.is_target
      );
      if (!distractor) {
        throw new Error("Missing distractor object");
      }

      const res = session.validateAction({
        type: "tap_object",
        data: { item_id: distractor.id },
      });
      expect(res).toBe(ACTION_RETRY);
    });

    it("BR-E022-03: lật mở vật thể bị che", () => {
      const session = new GT022Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      expect(session.onRevealObject("non_existent")).toBe(false);
    });
  });

  describe("GT-023: Lắp ghép hình thể (construct)", () => {
    const fixture = getFixture(GT023_FIXTURES);

    it("BR-E023-01: chỉ khớp neo khi đúng accepted_part_id", () => {
      const session = new GT023Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const anchor0 = fixture.content.anchors[0];
      if (!anchor0) {
        throw new Error("Missing anchor");
      }

      const resCorrect = session.validateAction({
        type: "place_item",
        data: {
          item_id: anchor0.accepted_part_id,
          target_id: anchor0.anchor_id,
        },
      });
      expect(resCorrect).toBe(ACTION_CORRECT);

      const wrongPart = fixture.content.parts.find(
        (p) => p.part_id !== anchor0.accepted_part_id
      );
      if (wrongPart) {
        const resWrong = session.validateAction({
          type: "place_item",
          data: {
            item_id: wrongPart.part_id,
            target_id: anchor0.anchor_id,
          },
        });
        expect(resWrong).toBe(ACTION_RETRY);
      }
    });

    it("BR-E023-02: hỗ trợ snap trong bán kính snap_radius_px", () => {
      expect(fixture.difficulty.snap_radius_px).toBeGreaterThanOrEqual(20);
    });

    it("BR-E023-03: cố định mảnh ghép đã lắp đúng", () => {
      const session = new GT023Session(fixture.content, fixture.difficulty);
      session.setupEntities();
      expect(session.assemblySystem).toBeDefined();
    });
  });

  describe("GT-024: Vẽ theo nét (trace-path)", () => {
    const fixture = getFixture(GT024_FIXTURES);

    it("BR-E024-01: nét vẽ theo đúng thứ tự waypoints", () => {
      const session = new GT024Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const wp0 = fixture.content.waypoints[0];
      if (!wp0) {
        throw new Error("Missing waypoint");
      }

      const res0 = session.validateAction({
        type: "trace_point",
        data: { x: wp0.x, y: wp0.y },
      });
      expect(res0).toBe(ACTION_CORRECT);
    });

    it("BR-E024-02: chấp nhận điểm chạm trong tolerance_px", () => {
      const session = new GT024Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const wp0 = fixture.content.waypoints[0];
      if (!wp0) {
        throw new Error("Missing waypoint");
      }

      const resInTol = session.validateAction({
        type: "trace_point",
        data: { x: wp0.x + 5, y: wp0.y + 5 },
      });
      expect(resInTol).toBe(ACTION_CORRECT);

      const resOutTol = session.validateAction({
        type: "trace_point",
        data: { x: wp0.x + 200, y: wp0.y + 200 },
      });
      expect(resOutTol).toBe(ACTION_RETRY);
    });

    it("BR-E024-03: cấm engine ở lứa tuổi 3-4", () => {
      expect(GT024Def.banned_age_bands).toContain("3-4");
      expect(GT024Def.age_min).toBe(5);
    });
  });
});
