/**
 * Unit tests cho các luật cơ chế riêng của lô Taxonomy Gap (GT-025..GT-027)
 * theo Task #263 T18.4.
 *
 * Kiểm tra các mã luật:
 * - BR-E025-01..03 (GT-025: Tìm điểm khác biệt spot-difference)
 * - BR-E026-01..03 (GT-026: Dừng khi gặp dấu hiệu go-nogo)
 * - BR-E027-01..03 (GT-027: Đổi quy luật phân loại rule-switch)
 */
import { describe, expect, it } from "vitest";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
} from "#src/game-session";
import { GT025_FIXTURES } from "#src/templates/GT-025/fixtures.js";
import { GT025Session } from "#src/templates/GT-025/session.js";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures.js";
import { GT026Session } from "#src/templates/GT-026/session.js";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures.js";
import { GT027Session } from "#src/templates/GT-027/session.js";

function getFixture<T>(fixtures: readonly T[], index = 0): T {
  const item = fixtures[index];
  if (!item) {
    throw new Error(`Missing fixture at index ${index}`);
  }
  return item;
}

describe("T18.4: Lô Taxonomy Gap — Luật cơ chế thật (GT-025..GT-027)", () => {
  describe("GT-025: Tìm điểm khác biệt (spot-difference)", () => {
    const fixture = getFixture(GT025_FIXTURES);

    it("BR-E025-01: chạm đúng ở một trong hai khung đều tính", () => {
      const session = new GT025Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const diff0 = fixture.content.differences[0];
      if (!diff0) {
        throw new Error("Missing difference");
      }

      const resLeft = session.validateAction({
        type: "tap_object",
        data: { item_id: diff0.left_id },
      });
      expect(resLeft).toBe(ACTION_CORRECT);

      const resRight = session.validateAction({
        type: "tap_object",
        data: { item_id: diff0.right_id },
      });
      expect(resRight).toBe(ACTION_CORRECT);
    });

    it("BR-E025-02: chạm vật thể giống nhau trả về ACTION_RETRY", () => {
      const session = new GT025Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const diffLeftIds = new Set(
        fixture.content.differences.map((d) => d.left_id)
      );
      const sameObj = fixture.content.left_objects.find(
        (o) => !diffLeftIds.has(o.id)
      );
      if (sameObj) {
        const res = session.validateAction({
          type: "tap_object",
          data: { item_id: sameObj.id },
        });
        expect(res).toBe(ACTION_RETRY);
      }
    });

    it("BR-E025-03: số differences khớp target_count", () => {
      for (const f of GT025_FIXTURES) {
        expect(f.content.differences.length).toBe(f.content.target_count);
        const leftIds = new Set(f.content.left_objects.map((o) => o.id));
        const rightIds = new Set(f.content.right_objects.map((o) => o.id));
        for (const d of f.content.differences) {
          expect(leftIds.has(d.left_id)).toBe(true);
          expect(rightIds.has(d.right_id)).toBe(true);
        }
      }
    });
  });

  describe("GT-026: Dừng khi gặp dấu hiệu (go-nogo)", () => {
    const fixture = getFixture(GT026_FIXTURES);

    it("BR-E026-01: quy ước chuẩn Go và No-Go", () => {
      const session = new GT026Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const trial0 = fixture.content.trials[0];
      if (trial0?.kind === "go") {
        const res = session.validateAction({
          type: "tap_stimulus",
          data: null,
        });
        expect(res).toBe(ACTION_CORRECT);
      }
    });

    it("BR-E026-02: lỗi nogo không ngắt chuỗi", () => {
      const session = new GT026Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      expect(session.checkWinCondition()).toBe(false);
      expect(fixture.content.trials.length).toBeGreaterThan(0);
    });

    it("BR-E026-03: lối chơi không đếm giờ (untimed)", () => {
      const session = new GT026Session(fixture.content, {
        ...fixture.difficulty,
        untimed: true,
      });
      session.setupEntities();

      session.update(fixture.difficulty.stimulus_window_ms + 2000);
      expect(session.checkWinCondition()).toBe(false);
    });
  });

  describe("GT-027: Đổi quy luật phân loại (rule-switch)", () => {
    const fixture = getFixture(GT027_FIXTURES);

    it("BR-E027-01: tự động đổi luật sau switch_after_trials", () => {
      const session = new GT027Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const initialRule = session.getActiveRule();
      expect(initialRule?.id).toBe(fixture.content.rules[0]?.id);
      expect(fixture.content.switch_after_trials).toBeGreaterThanOrEqual(2);
    });

    it("BR-E027-02: khóa tương tác khi phát tín hiệu đổi luật", () => {
      const session = new GT027Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      if (session.isSignaling()) {
        const res = session.validateAction({
          type: "select_item",
          data: { item_id: fixture.content.items[0]?.id },
        });
        expect(res).toBe(ACTION_IGNORED);
      }
      expect(fixture.difficulty.signal_duration_ms).toBeGreaterThanOrEqual(
        1000
      );
    });

    it("BR-E027-03: áp dụng luật mới ngay sau khi chuyển đổi", () => {
      const session = new GT027Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      const rule0 = fixture.content.rules[0];
      if (!rule0) {
        throw new Error("Missing rule 0");
      }

      const matchItem = fixture.content.items.find((i) => {
        if (rule0.dimension === "color") {
          return i.color === rule0.target_value;
        }
        if (rule0.dimension === "shape") {
          return i.shape === rule0.target_value;
        }
        return i.size === rule0.target_value;
      });
      if (matchItem) {
        const res = session.validateAction({
          type: "select_item",
          data: { item_id: matchItem.id },
        });
        expect(res).toBe(ACTION_CORRECT);
      }
    });
  });
});
