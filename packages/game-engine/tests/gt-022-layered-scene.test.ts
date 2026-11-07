import { describe, expect, it } from "vitest";
import { SLOT_GAP_PX } from "#src/layout/constants";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures.js";
import {
  type LayerUnit,
  layoutLayeredScene,
  type PlacedLayer,
} from "#src/templates/GT-022/layered-scene.js";
import { GT022Session } from "#src/templates/GT-022/session.js";
import type { GT022Content } from "#src/templates/GT-022/template.js";

const AREA = { x: 24, y: 120, w: 880, h: 330 } as const;
const FIXTURE = GT022_FIXTURES[3];
const BANDS = ["4-5", "5-6"] as const;

function fixtureContent(): GT022Content {
  if (!FIXTURE) {
    throw new Error("Thiếu fixture GT-022 #3");
  }
  return FIXTURE.content;
}

function open(
  band: (typeof BANDS)[number],
  stage = { x: 24, y: 96, w: 912, h: 420 },
  content: GT022Content = fixtureContent()
): GT022Session {
  const session = new GT022Session(
    content,
    GT022_FIXTURES[3]?.difficulty ?? {
      hint_after_ms: 8000,
      allow_retry: true,
      show_target_counter: true,
    },
    3
  );
  session.prepareRound(band, undefined, stage);
  return session;
}

function box(layer: PlacedLayer) {
  return {
    left: layer.hit.x - layer.hit.w / 2,
    right: layer.hit.x + layer.hit.w / 2,
    top: layer.hit.y - layer.hit.h / 2,
    bottom: layer.hit.y + layer.hit.h / 2,
  };
}

describe("GT-022 lớp che thật: hình học cặp che–nấp (BR-E022-08)", () => {
  const units: LayerUnit[] = [
    { index: 0, hiddenIndex: 1, side: "right" },
    { index: 2, hiddenIndex: 3, side: "left" },
    { index: 4 },
  ];

  it("vật nấp lộ một dải ≥ sàn chạm, vật che đè lên phần còn lại", () => {
    const u = 84;
    const placed = layoutLayeredScene(AREA, units, u, SLOT_GAP_PX);
    expect(placed).not.toBeNull();
    for (const [occ, hid] of [
      [0, 1],
      [2, 3],
    ] as const) {
      const occluder = placed?.find((p) => p.index === occ);
      const hidden = placed?.find((p) => p.index === hid);
      if (!(occluder && hidden)) {
        throw new Error("Thiếu cặp");
      }
      expect(occluder.layer).toBeGreaterThan(hidden.layer);
      // Hộp vẽ chồng nhau thật: khoảng cách tâm nhỏ hơn tổng bán kính.
      const dx = Math.abs(occluder.draw.x - hidden.draw.x);
      expect(dx).toBeLessThan((occluder.draw.size + hidden.draw.size) / 2);
      // Dải nhìn thấy (vùng chạm) rộng đúng một đơn vị, ≥ sàn chạm.
      expect(hidden.hit.w).toBeGreaterThanOrEqual(u);
      expect(hidden.hit.h).toBeGreaterThanOrEqual(u);
      expect(occluder.hit.w).toBeGreaterThanOrEqual(u);
      // Nhìn thấy hơn một nửa bề ngang vật nấp.
      expect(hidden.hit.w / hidden.draw.size).toBeGreaterThan(0.5);
    }
  });

  it("mọi vùng chạm cách nhau ≥ SLOT_GAP_PX và nằm trong vùng cảnh", () => {
    const placed = layoutLayeredScene(AREA, units, 84, SLOT_GAP_PX) ?? [];
    for (const p of placed) {
      const b = box(p);
      expect(b.left).toBeGreaterThanOrEqual(AREA.x);
      expect(b.right).toBeLessThanOrEqual(AREA.x + AREA.w);
      expect(b.top).toBeGreaterThanOrEqual(AREA.y);
      expect(b.bottom).toBeLessThanOrEqual(AREA.y + AREA.h);
    }
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const c = placed[j];
        if (!(a && c)) {
          continue;
        }
        const ba = box(a);
        const bc = box(c);
        const gap = Math.max(
          bc.left - ba.right,
          ba.left - bc.right,
          bc.top - ba.bottom,
          ba.top - bc.bottom
        );
        expect(gap).toBeGreaterThanOrEqual(SLOT_GAP_PX);
      }
    }
  });

  it("không vừa thì trả null", () => {
    expect(
      layoutLayeredScene({ x: 0, y: 0, w: 200, h: 120 }, units, 84, SLOT_GAP_PX)
    ).toBeNull();
  });
});

describe("GT-022 lớp che thật: session (BR-E022-08)", () => {
  it.each(BANDS)(
    "band %s: vật che vẽ sau vật nấp, vùng chạm đủ sàn và không chồng",
    (band) => {
      const session = open(band);
      const order = session.getLayerDrawIds();

      expect(order.length).toBe(6);
      expect(order.indexOf("target-rabbit")).toBeLessThan(
        order.indexOf("bush")
      );
      expect(order.indexOf("target-mouse")).toBeLessThan(order.indexOf("rock"));
      expect(session.slots.length).toBeGreaterThan(0);
      for (const slot of session.slots) {
        expect(slot.hitW).toBeGreaterThanOrEqual(64);
        expect(slot.hitH).toBeGreaterThanOrEqual(64);
      }
    }
  );

  it("chạm dải thỏ lộ ra tìm thấy thỏ; chạm bụi là lượt nhầm không phạt", () => {
    const session = open("4-5");
    const view = session.getView().entities;
    const rabbit = view.find((e) => e.id === "target-rabbit");
    const bush = view.find((e) => e.id === "bush");
    if (!(rabbit && bush)) {
      throw new Error("Thiếu entity");
    }

    const wrong = session.dispatch({
      type: "tap",
      x: bush.x,
      y: bush.y,
      timeMs: 0,
    });
    expect(wrong?.valid).toBe(false);
    expect(session.checkWinCondition()).toBe(false);

    const right = session.dispatch({
      type: "tap",
      x: rabbit.x,
      y: rabbit.y,
      timeMs: 1,
    });
    expect(right?.valid).toBe(true);
    // Thỏ đã tìm ra được kéo lên trên bụi.
    const order = session.getLayerDrawIds();
    expect(order.indexOf("target-rabbit")).toBeGreaterThan(
      order.indexOf("bush")
    );
  });

  it("giữ hàng hình mẫu ghim (BR-E022-05) cùng cảnh lớp che", () => {
    const session = open("5-6");

    expect(
      session.getView().entities.filter((e) => e.id.startsWith("ref-")).length
    ).toBe(2);
  });

  it("sân khấu quá chật: cảnh xếp phẳng, không lớp, vẫn tìm được mọi đích", () => {
    const session = open("4-5", { x: 24, y: 96, w: 300, h: 160 });

    expect(session.getLayerDrawIds()).toEqual([]);
    for (const e of session
      .getView()
      .entities.filter((x) => x.id.startsWith("target-"))) {
      expect(
        session.dispatch({ type: "tap", x: e.x, y: e.y, timeMs: 0 })?.valid
      ).toBe(true);
    }
    expect(session.checkWinCondition()).toBe(true);
  });

  it("occluded_by không hợp lệ bị bỏ qua (vật che không tồn tại, tự che, bị che lại)", () => {
    const base = fixtureContent();
    const breakOcclusion = (o: GT022Content["scene_objects"][number]) => {
      if (o.id === "target-rabbit") {
        return { ...o, occluded_by: "khong-co" };
      }
      return o.id === "target-mouse" ? { ...o, occluded_by: o.id } : o;
    };
    const broken: GT022Content = {
      ...base,
      scene_objects: base.scene_objects.map(breakOcclusion),
    };

    expect(open("4-5", undefined, broken).getLayerDrawIds()).toEqual([]);
  });
});
