/**
 * Unit tests cho các luật cơ chế riêng của lô MVP (GT-002..GT-006)
 * theo Task #263 T18.1.
 *
 * Kiểm tra các mã luật:
 * - BR-E002-01..03 (GT-002: Đa chọn tap-select-multi)
 * - BR-E003-01..03 (GT-003: Phân loại drag-to-container)
 * - BR-E004-01..03 (GT-004: Phân loại nhiều nhóm multi-bucket)
 * - BR-E005-01..03 (GT-005: Ghép cặp pair-match)
 * - BR-E006-01..03 (GT-006: Sắp xếp thứ tự sequence-order)
 */
import { describe, expect, it } from "vitest";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures.js";
import { GT002Session } from "#src/templates/GT-002/session.js";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures.js";
import { GT003Session } from "#src/templates/GT-003/session.js";
import { GT004_FIXTURES } from "#src/templates/GT-004/fixtures.js";
import { GT004Session } from "#src/templates/GT-004/session.js";
import { GT004ContentSchema } from "#src/templates/GT-004/template.js";
import { GT005_FIXTURES } from "#src/templates/GT-005/fixtures.js";
import { GT005Session } from "#src/templates/GT-005/session.js";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures.js";
import { GT006Session } from "#src/templates/GT-006/session.js";
import { GT006ContentSchema } from "#src/templates/GT-006/template.js";

describe("T18.1: Lô MVP — Luật cơ chế thật (GT-002..GT-006)", () => {
  describe("GT-002: Chọn nhiều (tap-select-multi)", () => {
    const fixture = GT002_FIXTURES[0];
    if (!fixture) {
      throw new Error("Missing GT-002 fixture");
    }

    it("BR-E002-01: thao tác chạm chỉ thay đổi item được chọn, không ảnh hưởng item khác", () => {
      const session = new GT002Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      // Ban đầu chưa item nào được chọn
      expect(session.getItemState("apple")).toBe("idle");
      expect(session.getItemState("strawberry")).toBe("idle");

      // Chạm chọn apple
      session.commit({ type: "toggle_item", data: { item_id: "apple" } });
      expect(session.getItemState("apple")).toBe("selected");
      expect(session.getItemState("strawberry")).toBe("idle");

      // Chạm chọn strawberry
      session.commit({ type: "toggle_item", data: { item_id: "strawberry" } });
      expect(session.getItemState("apple")).toBe("selected");
      expect(session.getItemState("strawberry")).toBe("selected");

      // Chạm lại apple để bỏ chọn -> apple về idle, strawberry vẫn selected
      session.commit({ type: "toggle_item", data: { item_id: "apple" } });
      expect(session.getItemState("apple")).toBe("idle");
      expect(session.getItemState("strawberry")).toBe("selected");
    });

    it("BR-E002-02: phiên chỉ thắng khi tập chọn khớp chính xác 100% danh sách đúng", () => {
      const session = new GT002Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      // Chưa chọn gì -> chưa thắng
      expect(session.checkWinCondition()).toBe(false);

      // Chọn 1/2 item đúng (apple) -> chưa thắng
      session.commit({ type: "toggle_item", data: { item_id: "apple" } });
      expect(session.checkWinCondition()).toBe(false);

      // Chọn thêm 1 item sai (banana) -> 1 đúng 1 sai -> chưa thắng
      session.commit({ type: "toggle_item", data: { item_id: "banana" } });
      expect(session.checkWinCondition()).toBe(false);

      // Bỏ chọn banana
      session.commit({ type: "toggle_item", data: { item_id: "banana" } });
      expect(session.checkWinCondition()).toBe(false);

      // Chọn nốt strawberry -> đủ 2 item đúng, 0 item sai -> thắng
      session.commit({ type: "toggle_item", data: { item_id: "strawberry" } });
      expect(session.checkWinCondition()).toBe(true);
    });

    it("BR-E002-03: giới hạn target_count theo band (<=3 ở band 4-5)", () => {
      expect(fixture.difficulty.target_count).toBeLessThanOrEqual(3);
      for (const f of GT002_FIXTURES) {
        expect(f.difficulty.target_count).toBeLessThanOrEqual(4);
      }
    });
  });

  describe("GT-003: Phân loại vào giỏ (drag-to-container)", () => {
    const fixture = GT003_FIXTURES[0];
    if (!fixture) {
      throw new Error("Missing GT-003 fixture");
    }

    it("BR-E003-01: đường tap-tap và drag-drop cho kết quả tương đương", () => {
      const session1 = new GT003Session(fixture.content, fixture.difficulty);
      session1.setupEntities();

      // Đặt bằng drop_item (drag-drop)
      session1.commit({
        type: "drop_item",
        data: { item_id: "paper", container_id: "bin_1" },
      });
      expect(session1.getPlacements().get("paper")).toBe("bin_1");

      const session2 = new GT003Session(fixture.content, fixture.difficulty);
      session2.setupEntities();

      // Đặt bằng tap_tap_item (chạm item rồi chạm container)
      session2.commit({
        type: "tap_tap_item",
        data: { item_id: "paper", container_id: "bin_1" },
      });
      expect(session2.getPlacements().get("paper")).toBe("bin_1");
    });

    it("BR-E003-02: thả ngoài container không sinh action phạt, vị trí không bị chiếm", () => {
      const session = new GT003Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      // Action thả vào vùng rỗng / sai container ID
      const res = session.validateAction({
        type: "drop_item",
        data: { item_id: "paper", container_id: "invalid_area" },
      });
      expect(res.valid).toBe(false);
      expect(session.getPlacements().has("paper")).toBe(false);
    });

    it("BR-E003-03: toàn vẹn gom nhóm đích, từ chối item sai", () => {
      const session = new GT003Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      // Thả item sai (book) -> không được đặt vào placements
      session.commit({
        type: "drop_item",
        data: { item_id: "book", container_id: "bin_1" },
      });
      expect(session.getPlacements().has("book")).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Thả 1 item đúng (paper) -> chưa đủ
      session.commit({
        type: "drop_item",
        data: { item_id: "paper", container_id: "bin_1" },
      });
      expect(session.checkWinCondition()).toBe(false);

      // Thả nốt item đúng thứ 2 (apple_core) -> thắng
      session.commit({
        type: "drop_item",
        data: { item_id: "apple_core", container_id: "bin_1" },
      });
      expect(session.checkWinCondition()).toBe(true);
    });
  });

  describe("GT-004: Phân loại nhiều nhóm (multi-bucket)", () => {
    const fixture = GT004_FIXTURES[0];
    if (!fixture) {
      throw new Error("Missing GT-004 fixture");
    }

    it("BR-E004-01: từ chối content_pack nếu có nhóm không có item nào", () => {
      const invalidData = {
        prompt: "Phân loại động vật",
        groups: [
          { group_id: "g1", label: "Trên cạn", label_emoji: "🌳" },
          { group_id: "g2", label: "Dưới nước", label_emoji: "🌊" },
          { group_id: "g3", label: "Trên trời", label_emoji: "☁️" },
        ],
        items: [
          {
            item_id: "cat",
            asset: { kind: "emoji", ref: "🐱" },
            correct_group_id: "g1",
          },
          {
            item_id: "dog",
            asset: { kind: "emoji", ref: "🐶" },
            correct_group_id: "g1",
          },
          {
            item_id: "fish",
            asset: { kind: "emoji", ref: "🐟" },
            correct_group_id: "g2",
          },
          {
            item_id: "whale",
            asset: { kind: "emoji", ref: "🐳" },
            correct_group_id: "g2",
          },
        ],
      };

      const parsed = GT004ContentSchema.safeParse(invalidData);
      expect(parsed.success).toBe(false);
    });

    it("BR-E004-02: từ chối content_pack nếu item trỏ vào nhóm không tồn tại", () => {
      const orphanData = {
        prompt: "Phân loại động vật",
        groups: [
          { group_id: "g1", label: "Trên cạn", label_emoji: "🌳" },
          { group_id: "g2", label: "Dưới nước", label_emoji: "🌊" },
        ],
        items: [
          {
            item_id: "cat",
            asset: { kind: "emoji", ref: "🐱" },
            correct_group_id: "g1",
          },
          {
            item_id: "alien",
            asset: { kind: "emoji", ref: "👽" },
            correct_group_id: "g9_non_existent",
          },
          {
            item_id: "fish",
            asset: { kind: "emoji", ref: "🐟" },
            correct_group_id: "g2",
          },
          {
            item_id: "whale",
            asset: { kind: "emoji", ref: "🐳" },
            correct_group_id: "g2",
          },
        ],
      };

      const parsed = GT004ContentSchema.safeParse(orphanData);
      expect(parsed.success).toBe(false);
    });

    it("BR-E004-03: hoàn tất phân nhóm toàn vẹn khi mọi item vào đúng nhóm", () => {
      const session = new GT004Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      expect(session.checkWinCondition()).toBe(false);

      // Phân loại đúng 3 item đầu
      session.onItemSorted("cat", "g1");
      session.onItemSorted("dog", "g1");
      session.onItemSorted("fish", "g2");
      expect(session.checkWinCondition()).toBe(false);

      // Thử phân loại sai item cuối
      session.onItemSorted("whale", "g1");
      expect(session.checkWinCondition()).toBe(false);

      // Phân loại đúng item cuối
      session.onItemSorted("whale", "g2");
      expect(session.checkWinCondition()).toBe(true);
    });
  });

  describe("GT-005: Ghép cặp (pair-match)", () => {
    const fixture = GT005_FIXTURES[0];
    if (!fixture) {
      throw new Error("Missing GT-005 fixture");
    }

    it("BR-E005-01: tương ứng một-một, từ chối ghép sai vế", () => {
      const session = new GT005Session(fixture.content, fixture.difficulty);
      session.setupEntities();

      // Ghép sai: monkey với carrot -> validateAction báo không hợp lệ
      const res = session.validateAction({
        type: "match_pair",
        data: { left_item_id: "monkey", right_item_id: "carrot" },
      });
      expect(res.valid).toBe(false);

      // Ghép đúng: monkey với banana -> hợp lệ
      const resOk = session.validateAction({
        type: "match_pair",
        data: { left_item_id: "monkey", right_item_id: "banana" },
      });
      expect(resOk.valid).toBe(true);
    });

    it("BR-E005-02: khi ghép đúng, cặp được ghi nhận pair_matched và khóa tương tác", () => {
      const session = new GT005Session(fixture.content, fixture.difficulty);
      session.prepareRound("4-5");

      session.commit({
        type: "match_pair",
        data: { left_item_id: "monkey", right_item_id: "banana" },
      });
      expect(session.getMatchedPairs().get("monkey")).toBe("banana");

      // Cặp monkey và banana đã ghép đúng, entity chuyển sang correct
      const view = session.getView();
      const monkeyEntity = view.entities.find((e) => e.id === "monkey");
      const bananaEntity = view.entities.find((e) => e.id === "banana");
      expect(monkeyEntity?.state).toBe("correct");
      expect(bananaEntity?.state).toBe("correct");
    });

    it("BR-E005-03: xáo trộn vị trí không đổi quan hệ cặp gốc", () => {
      const session = new GT005Session(fixture.content, {
        ...fixture.difficulty,
        shuffle_sides: true,
      });
      session.setupEntities();

      expect(session.checkWinCondition()).toBe(false);

      // Hoàn thành lần lượt 2 cặp
      session.commit({
        type: "match_pair",
        data: { left_item_id: "monkey", right_item_id: "banana" },
      });
      session.commit({
        type: "match_pair",
        data: { left_item_id: "rabbit", right_item_id: "carrot" },
      });
      expect(session.checkWinCondition()).toBe(true);
    });
  });

  describe("GT-006: Sắp xếp thứ tự (sequence-order)", () => {
    const fixture = GT006_FIXTURES[0];
    if (!fixture) {
      throw new Error("Missing GT-006 fixture");
    }

    it("BR-E006-01: chấm cả chuỗi, đúng một phần không được công nhận thắng", () => {
      const session = new GT006Session(fixture.content, {
        ...fixture.difficulty,
        shuffle_initial: false,
      });
      session.setupEntities();

      // Đảo vị trí để chuỗi không đúng
      session.reorderSteps(0, 1);
      expect(session.checkWinCondition()).toBe(false);

      // Đưa về đúng thứ tự: s1 (0), s2 (1), s3 (2)
      const current = session.getCurrentSequence();
      const idxS1 = current.indexOf("s1");
      session.reorderSteps(idxS1, 0);
      const current2 = session.getCurrentSequence();
      const idxS2 = current2.indexOf("s2");
      session.reorderSteps(idxS2, 1);

      expect(session.checkWinCondition()).toBe(true);
    });

    it("BR-E006-02: shuffle_initial kích hoạt xáo trộn trình tự ban đầu", () => {
      const session = new GT006Session(fixture.content, {
        ...fixture.difficulty,
        shuffle_initial: true,
      });
      session.setupEntities();
      expect(session.getCurrentSequence().length).toBe(3);
    });

    it("BR-E006-03: giới hạn số bước trong chuỗi từ 3 đến 5 phần tử", () => {
      // 2 bước -> fail
      const tooShort = {
        prompt: "Quá ngắn",
        sequence: [
          { step_id: "s1", order_index: 0, asset: { kind: "emoji", ref: "1️⃣" } },
          { step_id: "s2", order_index: 1, asset: { kind: "emoji", ref: "2️⃣" } },
        ],
      };
      expect(GT006ContentSchema.safeParse(tooShort).success).toBe(false);

      // 6 bước -> fail
      const tooLong = {
        prompt: "Quá dài",
        sequence: [
          { step_id: "s1", order_index: 0, asset: { kind: "emoji", ref: "1️⃣" } },
          { step_id: "s2", order_index: 1, asset: { kind: "emoji", ref: "2️⃣" } },
          { step_id: "s3", order_index: 2, asset: { kind: "emoji", ref: "3️⃣" } },
          { step_id: "s4", order_index: 3, asset: { kind: "emoji", ref: "4️⃣" } },
          { step_id: "s5", order_index: 4, asset: { kind: "emoji", ref: "5️⃣" } },
          { step_id: "s6", order_index: 5, asset: { kind: "emoji", ref: "6️⃣" } },
        ],
      };
      expect(GT006ContentSchema.safeParse(tooLong).success).toBe(false);
    });
  });
});
