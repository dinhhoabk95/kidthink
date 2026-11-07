import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures";
import { GT029Session } from "#src/templates/GT-029/session";
import type { GT029Content } from "#src/templates/GT-029/template";

/**
 * GT-029 `BR-E029-09`: vật đã bớt luôn có dock riêng, tách khỏi nhóm còn lại,
 * kể cả khi lưới lẻ cột (hàng cuối của nhóm không chia sẻ với vật bớt).
 */
const VIEWPORTS: readonly { w: number; h: number }[] = [
  { w: 964, h: 628 },
  { w: 390, h: 760 },
  { w: 1280, h: 720 },
];

function contentOf(total: number, remove: number): GT029Content {
  const fixture = GT029_FIXTURES[0];
  if (!fixture) {
    throw new Error("Thiếu fixture");
  }
  return {
    prompt: fixture.content.prompt,
    initial_items: Array.from({ length: total }, (_, i) => ({
      item_id: `it_${i}`,
      asset: { kind: "emoji" as const, ref: "🍎" },
    })),
    remove_count: remove,
    answer_options: [
      { option_id: "o_a", value: total - remove, is_correct: true },
      { option_id: "o_b", value: total - remove + 1, is_correct: false },
    ],
  };
}

function build(
  total: number,
  remove: number,
  vp: { w: number; h: number }
): GT029Session {
  const fixture = GT029_FIXTURES[0];
  if (!fixture) {
    throw new Error("Thiếu fixture");
  }
  const session = new GT029Session(
    contentOf(total, remove),
    { ...fixture.difficulty, initial_count: total, remove_count: remove },
    1
  );
  const space = deriveLogicSpace(vp.w, vp.h);
  const cssPerLogic = vp.w / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "4-5",
    cssPerLogic,
    needsTray: false,
    needsCommit: false,
  });
  session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
  return session;
}

/** Khe tối thiểu giữa vật trong nhóm và mép dock (nửa `SLOT_GAP_PX`). */
const MIN_GAP_PX = 4;

describe("GT-029 — vật bớt luôn có dock riêng (BR-E029-09)", () => {
  it("lưới 4 cột, 9 vật bớt 4: đi thật đường tách dock (hàng chia ô + khối riêng)", () => {
    // Không có ca nào tách dock thì các ca dưới không đo được phần cắt quanh nhóm.
    const session = build(9, 4, { w: 964, h: 628 });
    for (let k = 0; k < 4; k++) {
      session.commit({ type: "remove_item", data: { item_id: `it_${k}` } });
    }
    expect(session.getRemovedDockRects()).toHaveLength(2);
  });
  for (const vp of VIEWPORTS) {
    for (const [total, remove] of [
      [5, 2],
      [7, 3],
      [6, 1],
      [9, 4],
      [8, 5],
    ] as const) {
      it(`${total} vật bớt ${remove} ở ${vp.w}x${vp.h}: mỗi bước bớt có dock, không đè nhóm`, () => {
        const session = build(total, remove, vp);
        for (let k = 0; k < remove; k++) {
          session.commit({ type: "remove_item", data: { item_id: `it_${k}` } });
          const docks = session.getRemovedDockRects();
          expect(docks.length, `bước ${k + 1}`).toBeGreaterThan(0);
          for (const d of docks) {
            expect(d.w, "dock có bề rộng dương").toBeGreaterThan(0);
            expect(d.h, "dock có bề cao dương").toBeGreaterThan(0);
          }
          // Hai dock tách nhau, không chồng.
          for (const [a, d1] of docks.entries()) {
            for (const d2 of docks.slice(a + 1)) {
              const dockOverlap =
                d1.x < d2.x + d2.w &&
                d2.x < d1.x + d1.w &&
                d1.y < d2.y + d2.h &&
                d2.y < d1.y + d1.h;
              expect(dockOverlap, "hai dock không chồng").toBe(false);
            }
          }
          const entities = session.getView().entities;
          const removedIds = new Set(
            Array.from({ length: k + 1 }, (_, i) => `it_${i}`)
          );
          for (const e of entities) {
            if (!e.id.startsWith("it_")) {
              continue;
            }
            if (removedIds.has(e.id)) {
              const inside = docks.some(
                (d) =>
                  e.x - e.w / 2 >= d.x &&
                  e.x + e.w / 2 <= d.x + d.w &&
                  e.y - e.h / 2 >= d.y &&
                  e.y + e.h / 2 <= d.y + d.h
              );
              expect(inside, `${e.id} nằm trong một dock`).toBe(true);
              continue;
            }
            for (const d of docks) {
              // Còn khe thấy được giữa vật trong nhóm và mép dock.
              const gapX = Math.max(
                d.x - (e.x + e.w / 2),
                e.x - e.w / 2 - (d.x + d.w)
              );
              const gapY = Math.max(
                d.y - (e.y + e.h / 2),
                e.y - e.h / 2 - (d.y + d.h)
              );
              expect(
                Math.max(gapX, gapY),
                `${e.id} cách dock một khe`
              ).toBeGreaterThanOrEqual(MIN_GAP_PX);
            }
          }
        }
      });
    }
  }
});
