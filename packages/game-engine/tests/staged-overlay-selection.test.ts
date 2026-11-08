import { describe, expect, it } from "vitest";
import type { EngineView, ViewEntity } from "#src/interaction";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
import { GT001Session } from "#src/templates/GT-001/session.js";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures.js";
import { GT027Session } from "#src/templates/GT-027/session.js";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures.js";
import { GT028Session } from "#src/templates/GT-028/session.js";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures.js";
import { GT032Session } from "#src/templates/GT-032/session.js";
import { GT032ContentSchema } from "#src/templates/GT-032/template.js";

/**
 * Phase 24 mục 10: lớp phủ "nguồn đang chờ thả" của shell
 * (`use-play-gesture.getGestureVisualState`) lấy **mọi** entity `role: "source"` +
 * `state: "selected"` làm vật nguồn đã nhấc, rồi nâng nó lên và vẽ vòng vàng quanh
 * mọi ô khác. Engine chỉ dùng `selected` để đánh dấu "đang chọn" (chạm chọn, đang
 * rót) thì không được khai vai `source`: đó là lỗi GT-020 đã sửa ở phase 23
 * (`BR-E020-09`).
 */
function shellStagedSource(view: EngineView): ViewEntity | undefined {
  return view.entities.find(
    (e) => e.role === "source" && e.state === "selected"
  );
}

/**
 * Shell (`use-play-gesture.isTwoStepSurface`) coi view có **bất kỳ** entity `target`
 * là bề mặt kéo-thả hai bước: phím Enter trên một `source` thì nhấc vật lên chờ
 * thả, không gửi `tap`. Engine chạm-chọn mà trộn `source` với `target` (chỉ đổi
 * vật đang chọn sang `target`) thì sau lần chọn đầu, bàn phím không đếm/rót được
 * vật thứ hai nữa. Vai phải đồng nhất trên mọi entity.
 */
function mixesSourceAndTarget(view: EngineView): boolean {
  return (
    view.entities.some((e) => e.role === "source") &&
    view.entities.some((e) => e.role === "target")
  );
}

describe("lớp phủ nguồn đang chờ thả: engine chạm-chọn không kích hoạt", () => {
  it("GT-028 (BR-E028-11): chọn vật để đếm nhảy không nâng vật lên hay vẽ vòng quanh vật khác", () => {
    for (const fx of GT028_FIXTURES) {
      const session = new GT028Session(fx.content, fx.difficulty, 1);
      session.prepareRound("5-6");
      const first = session.getView().entities[0];
      if (!first) {
        throw new Error("Thiếu vật");
      }
      session.dispatch({ type: "tap", x: first.x, y: first.y, timeMs: 10 });
      const view = session.getView();
      expect(view.entities.some((e) => e.state === "selected")).toBe(true);
      expect(shellStagedSource(view)).toBeUndefined();
      expect(
        mixesSourceAndTarget(view),
        "bàn phím thành kéo-thả hai bước"
      ).toBe(false);
    }
  });

  it("GT-032 (BR-E032-15): cốc đang rót không bị coi là nguồn đang chờ thả", () => {
    const content = GT032ContentSchema.parse({
      prompt: "Bé hãy rót nước đến vạch 4 cho chiếc cốc nhé!",
      question_type: "pour_to_mark",
      conservation_trap: false,
      cups: [
        {
          cup_id: "cup_pour",
          shape: "standard",
          capacity_units: 6,
          fill_units: 2,
          target_units: 4,
          color: "sky",
        },
        {
          cup_id: "cup_ref",
          shape: "narrow_tall",
          capacity_units: 6,
          fill_units: 4,
          target_units: 4,
          color: "sky",
        },
      ],
    });
    const fixture = GT032_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture");
    }
    const session = new GT032Session(content, fixture.difficulty, 0);
    session.prepareRound("5-6");
    session.commit({
      type: "adjust_cup",
      data: { cup_id: "cup_pour", delta: 1 },
    });
    const view = session.getView();
    expect(view.entities.some((e) => e.state === "selected")).toBe(true);
    expect(shellStagedSource(view)).toBeUndefined();
    expect(mixesSourceAndTarget(view), "bàn phím thành kéo-thả hai bước").toBe(
      false
    );
  });

  it("GT-001, GT-027 (đã xác minh, không đổi): chạm từng vật không bao giờ để lại source + selected", () => {
    const builders = [
      () => {
        const fx = GT001_FIXTURES[0];
        if (!fx) {
          throw new Error("Thiếu fixture");
        }
        const s = new GT001Session(fx.content, fx.difficulty, 1);
        s.prepareRound("4-5");
        return s;
      },
      () => {
        const fx = GT027_FIXTURES[0];
        if (!fx) {
          throw new Error("Thiếu fixture");
        }
        const s = new GT027Session(fx.content, fx.difficulty, 1);
        s.prepareRound("4-5");
        return s;
      },
    ];
    for (const build of builders) {
      const count = build().getView().entities.length;
      for (let i = 0; i < count; i++) {
        const session = build();
        const e = session.getView().entities[i];
        if (!e) {
          continue;
        }
        session.dispatch({ type: "tap", x: e.x, y: e.y, timeMs: 10 });
        expect(shellStagedSource(session.getView())).toBeUndefined();
      }
    }
  });
});
