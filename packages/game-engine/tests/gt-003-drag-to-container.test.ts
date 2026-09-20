import { describe, expect, it } from "vitest";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures";
import { GT003Session } from "#src/templates/GT-003/session";
import {
  type GT003Content,
  GT003ContentSchema,
  type GT003Difficulty,
  validateGT003Consistency,
} from "#src/templates/GT-003/template";

const FIXTURE = GT003_FIXTURES[0];
if (!FIXTURE) {
  throw new Error("GT003_FIXTURES[0] must exist");
}
const CONTENT: GT003Content = FIXTURE.content;
const DIFFICULTY: GT003Difficulty = FIXTURE.difficulty;

function openSession(
  layoutSeed = 0,
  difficulty: GT003Difficulty = DIFFICULTY
): GT003Session {
  const session = new GT003Session(CONTENT, difficulty, layoutSeed);
  session.prepareRound("3-4");
  return session;
}

function dropAt(
  session: GT003Session,
  index: number,
  toX: number,
  toY: number
) {
  const slot = session.sourceSlots[index];
  if (!slot) {
    throw new Error(`source slot ${index} must exist`);
  }
  return session.dispatch({
    type: "drop",
    fromX: slot.x,
    fromY: slot.y,
    toX,
    toY,
    timeMs: 100,
  });
}

function firstCorrectIndex(session: GT003Session): number {
  return session.displayItems.findIndex((i) => i.is_correct);
}

function countDropEvents(session: GT003Session): number {
  return session
    .getTelemetry()
    .events.filter((e) => e.event_name === "item_dropped").length;
}

describe("GT-003 — drag-to-container", () => {
  describe("BR-E003-06 — §4 N7 / §5 nhánh 8: vị trí xuất phát đổi theo seed", () => {
    it("hai seed khác nhau cho hai thứ tự vật khác nhau", () => {
      const orders = new Set(
        [1, 2, 3, 4, 5, 6, 7, 8].map((seed) =>
          openSession(seed)
            .displayItems.map((i) => i.item_id)
            .join(",")
        )
      );
      expect(orders.size).toBeGreaterThan(1);
    });

    it("cùng một seed luôn dựng lại đúng một thứ tự (BR-RNG-06)", () => {
      expect(openSession(42).displayItems.map((i) => i.item_id)).toEqual(
        openSession(42).displayItems.map((i) => i.item_id)
      );
    });

    it("`shuffle_items: false` giữ nguyên thứ tự của content_pack", () => {
      const session = openSession(7, { ...DIFFICULTY, shuffle_items: false });
      expect(session.displayItems.map((i) => i.item_id)).toEqual(
        CONTENT.items.map((i) => i.item_id)
      );
    });
  });

  describe("BR-E003-07 — vật đã bỏ vào rổ không nhận thêm một lượt trả lời nào", () => {
    it("thả lại vật đã đặt: không event thứ hai, không verdict đúng thứ hai", () => {
      const session = openSession(3);
      const index = firstCorrectIndex(session);
      const box = session.getContainerBox();
      if (!box) {
        throw new Error("container box must exist");
      }

      expect(dropAt(session, index, box.x, box.y)?.valid).toBe(true);
      expect(countDropEvents(session)).toBe(1);

      const second = dropAt(session, index, box.x, box.y);
      expect(second).toEqual({ valid: false, feedback: "none" });
      expect(countDropEvents(session)).toBe(1);
    });

    it("vật đã đặt không còn là mục tiêu của trợ giúp", () => {
      const session = openSession(3);
      const index = firstCorrectIndex(session);
      const box = session.getContainerBox();
      if (!box) {
        throw new Error("container box must exist");
      }
      dropAt(session, index, box.x, box.y);
      expect(session.getHintTargetIndex()).not.toBe(index);
    });
  });

  describe("§4 N4 — dấu sai không ở lại trên màn", () => {
    it("thả nhầm vật nhiễu rồi hết nhịp thì vật về trung tính", () => {
      const session = openSession(3);
      const wrongIndex = session.displayItems.findIndex((i) => !i.is_correct);
      const wrongId = session.displayItems[wrongIndex]?.item_id;
      const box = session.getContainerBox();
      if (!(box && wrongId)) {
        throw new Error("fixture must have a distractor");
      }

      expect(dropAt(session, wrongIndex, box.x, box.y)?.feedback).toBe(
        "amber_soft"
      );
      expect(session.getItemState(wrongId)).toBe("wrong");

      session.update(300);
      expect(session.getItemState(wrongId)).toBe("idle");
      expect(session.getPlacements().has(wrongId)).toBe(false);
    });
  });

  describe("§10 / §14 — đích chứa lớn hơn vật rõ ràng", () => {
    it("hộp đích rộng và cao hơn vật được kéo", () => {
      const session = openSession(1);
      const box = session.getContainerBox();
      const itemSlot = session.sourceSlots[0];
      if (!(box && itemSlot)) {
        throw new Error("slots must exist");
      }
      expect(box.w).toBeGreaterThan(itemSlot.w);
      expect(box.h).toBeGreaterThan(itemSlot.h);
    });

    it("hộp đích nằm trong vùng an toàn và không chạm vùng nguồn", () => {
      const session = openSession(1);
      const box = session.getContainerBox();
      if (!box) {
        throw new Error("container box must exist");
      }
      const sourceBottom = Math.max(
        ...session.sourceSlots.map((s) => s.y + s.h / 2)
      );
      expect(box.y - box.h / 2).toBeGreaterThanOrEqual(sourceBottom);
      expect(box.y + box.h / 2).toBeLessThanOrEqual(540 - 32);
      expect(box.x - box.w / 2).toBeGreaterThanOrEqual(32);
    });
  });

  describe("BR-E003-02 — vùng thả khớp hình vẽ", () => {
    it("thả ngoài hộp đích không sinh action và không tính sai", () => {
      const session = openSession(1);
      const box = session.getContainerBox();
      if (!box) {
        throw new Error("container box must exist");
      }
      const result = dropAt(
        session,
        firstCorrectIndex(session),
        box.x + box.w / 2 + 60,
        box.y
      );
      expect(result).toEqual({ valid: false, feedback: "none" });
      expect(countDropEvents(session)).toBe(0);
    });

    it("thả sát mép trong của hộp vẫn tính là vào rổ", () => {
      const session = openSession(1);
      const box = session.getContainerBox();
      if (!box) {
        throw new Error("container box must exist");
      }
      const result = dropAt(
        session,
        firstCorrectIndex(session),
        box.x + box.w / 2 - 4,
        box.y
      );
      expect(result?.valid).toBe(true);
    });
  });

  describe("§12 — trạng thái đích đang nhận", () => {
    it("chạm vật lần 1 bật trạng thái nhận trên đích", () => {
      const session = openSession(1);
      const slot = session.sourceSlots[firstCorrectIndex(session)];
      if (!slot) {
        throw new Error("source slot must exist");
      }
      expect(session.hoveredContainer).toBe(false);

      session.dispatch({ type: "tap", x: slot.x, y: slot.y, timeMs: 10 });
      expect(session.hoveredContainer).toBe(true);

      const target = session
        .getView()
        .entities.find((e) => e.role === "target");
      expect(target?.state).toBe("selected");
    });

    it("ngón tay đi ngang qua đích khi kéo cũng bật trạng thái nhận", () => {
      const session = openSession(1);
      const box = session.getContainerBox();
      if (!box) {
        throw new Error("container box must exist");
      }
      session.setPointerOver(box.x, box.y);
      expect(session.hoveredContainer).toBe(true);

      session.setPointerOver(box.x, 0);
      expect(session.hoveredContainer).toBe(false);
    });
  });

  describe("BR-PNR-02 — bề mặt đọc được tên vật và chạm đúng hình", () => {
    it("vật mang nhãn đọc, ký tự emoji và hộp chạm tròn", () => {
      const session = openSession(1);
      const item = session.displayItems[0];
      const entity = session
        .getView()
        .entities.find((e) => e.id === item?.item_id);
      expect(entity?.glyph).toBe(
        item?.asset.kind === "emoji" ? item.asset.ref : undefined
      );
      expect(entity?.hitShape).toBeUndefined();
    });

    it("đích khai hộp chạm vuông đúng bằng hộp vẽ", () => {
      const session = openSession(1);
      const box = session.getContainerBox();
      const target = session
        .getView()
        .entities.find((e) => e.role === "target");
      expect(target?.hitShape).toBe("square");
      expect(target?.w).toBe(box?.w);
      expect(target?.h).toBe(box?.h);
      expect(target?.spokenLabel).toBe(CONTENT.container.label);
    });
  });

  describe("bố cục chọn theo khung nhìn", () => {
    it("màn dọc dùng bố cục nguồn-trái/đích-phải", () => {
      const session = new GT003Session(CONTENT, DIFFICULTY, 1);
      session.prepareRound("3-4", { w: 540, h: 960 });
      const target = session.targetSlots[0];
      const sourceRight = Math.max(
        ...session.sourceSlots.map((s) => s.x + s.w / 2)
      );
      if (!target) {
        throw new Error("target slot must exist");
      }
      expect(target.x).toBeGreaterThan(sourceRight);
    });
  });

  describe("BR-E003-04 / BR-E003-05 — hợp đồng nội dung và liên hợp đồng", () => {
    it("ba fixture đều hợp lệ và khớp difficulty_params", () => {
      for (const fixture of GT003_FIXTURES) {
        expect(GT003ContentSchema.safeParse(fixture.content).success).toBe(
          true
        );
        expect(
          validateGT003Consistency(fixture.content, fixture.difficulty)
        ).toEqual([]);
      }
    });

    it("ca âm: vật nhiễu mang đúng thuộc tính rổ nhận bị từ chối", () => {
      const broken = {
        ...CONTENT,
        items: CONTENT.items.map((item) =>
          item.is_correct ? item : { ...item, attribute: "trash" }
        ),
      };
      expect(GT003ContentSchema.safeParse(broken).success).toBe(false);
    });

    it("ca âm: không có vật đúng nào thì lượt chơi không thắng được", () => {
      const broken = {
        ...CONTENT,
        items: CONTENT.items.map((item) => ({
          ...item,
          attribute: "study",
          is_correct: false,
        })),
      };
      expect(GT003ContentSchema.safeParse(broken).success).toBe(false);
    });

    it("ca âm: target_count lệch số vật đúng thì số trên rổ nói dối", () => {
      expect(
        validateGT003Consistency(CONTENT, { ...DIFFICULTY, target_count: 1 })
      ).toHaveLength(1);
    });

    it("ca âm: distractor_count và item_count lệch content_pack", () => {
      expect(
        validateGT003Consistency(CONTENT, {
          ...DIFFICULTY,
          distractor_count: 3,
          item_count: 5,
        })
      ).toHaveLength(2);
    });
  });
});
