import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { GT012Generator } from "#src/generators/gt012";
import type { Gesture } from "#src/interaction";
import { createRng } from "#src/rng/mulberry32";
import {
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "#src/templates/GT-012/fixtures";
import { FlashRecallSession } from "#src/templates/GT-012/session";
import {
  FLASH_ITEM_CAP_BY_BAND,
  GT012ContentSchema,
} from "#src/templates/GT-012/template";

/**
 * Task #313 Phase 3 — GT-012: trẻ tự bấm bắt đầu (cấm tự đếm ngược) và số vật
 * chớp không vượt trần trí nhớ thị giác theo band (`BR-E012-03`, `BR-E012-04`).
 */
function build(): FlashRecallSession {
  const session = new FlashRecallSession(
    SAMPLE_LEVEL_1.content_pack,
    SAMPLE_LEVEL_1.difficulty_params
  );
  session.prepareRound("3-4");
  return session;
}

function tapStart(session: FlashRecallSession): Gesture {
  const e = session.getView().entities.find((x) => x.id === "cloche-plate");
  if (!e) {
    throw new Error("Thiếu nút bắt đầu");
  }
  return { type: "tap", x: e.x, y: e.y, timeMs: 0 };
}

describe("GT-012 — nút bắt đầu do trẻ bấm (BR-E012-04)", () => {
  it("mở màn: chưa chớp, đồng hồ không chạy dù thời gian trôi", () => {
    const session = build();
    expect(session.isAwaitingStart()).toBe(true);
    expect(session.isFlashVisible()).toBe(false);
    session.update(60_000);
    expect(session.isFlashVisible()).toBe(false);
    expect(session.isAwaitingStart()).toBe(true);
    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(names).not.toContain("flash_shown");
  });

  it("chờ bắt đầu chỉ có nút bắt đầu, phương án chưa chạm được", () => {
    const session = build();
    const ids = session.getView().entities.map((e) => e.id);
    expect(ids).toEqual(["cloche-plate"]);
    expect(
      session.dispatch({ type: "tap", x: 5, y: 5, timeMs: 0 })?.valid
    ).toBe(false);
    expect(session.getSelectedValue()).toBeNull();
  });

  it("trẻ bấm bắt đầu: vật hiện đúng flash_ms rồi tắt, phương án mở", () => {
    const session = build();
    const verdict = session.dispatch(tapStart(session));
    expect(verdict?.valid).toBe(true);
    expect(session.isAwaitingStart()).toBe(false);
    expect(session.isFlashVisible()).toBe(true);
    session.update(SAMPLE_LEVEL_1.difficulty_params.flash_ms - 1);
    expect(session.isFlashVisible()).toBe(true);
    session.update(1);
    expect(session.isFlashVisible()).toBe(false);
    expect(session.getView().entities.some((e) => e.id === "opt-3")).toBe(true);
    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(names.filter((n) => n === "flash_shown")).toHaveLength(1);
  });

  it("gợi ý lúc chờ bắt đầu chỉ vào nút bắt đầu, không lộ đáp án", () => {
    const session = build();
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["cloche-plate"],
    });
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "region",
      ids: ["cloche-plate"],
    });
  });
});

describe("GT-012 — số vật chớp không vượt trần theo band (BR-E012-03)", () => {
  it("level mẫu giữ trần của band khai báo", () => {
    const cases: [AgeBand, number][] = [
      ["3-4", SAMPLE_LEVEL_1.content_pack.flash_items.length],
      ["4-5", SAMPLE_LEVEL_2.content_pack.flash_items.length],
      ["5-6", SAMPLE_LEVEL_3.content_pack.flash_items.length],
    ];
    for (const [band, count] of cases) {
      expect(count).toBeLessThanOrEqual(FLASH_ITEM_CAP_BY_BAND[band]);
    }
  });

  it("bộ sinh không vượt trần ở mọi band và mọi seed", () => {
    const bands: AgeBand[] = ["3-4", "4-5", "5-6"];
    for (const band of bands) {
      for (let seed = 1; seed <= 40; seed++) {
        const level = GT012Generator.generate({
          rng: createRng(seed),
          age_band: band,
          theme: "school",
          vocabulary: {
            theme: "school",
            nouns: [
              { emoji_ref: "🍎", label_vi: "quả táo" },
              { emoji_ref: "🍌", label_vi: "quả chuối" },
              { emoji_ref: "🐻", label_vi: "con gấu" },
              { emoji_ref: "⭐", label_vi: "ngôi sao" },
              { emoji_ref: "🚗", label_vi: "ô tô" },
              { emoji_ref: "🐟", label_vi: "con cá" },
            ],
          },
        });
        const parsed = GT012ContentSchema.parse(level.content_pack);
        expect(parsed.flash_items.length).toBeLessThanOrEqual(
          FLASH_ITEM_CAP_BY_BAND[band]
        );
      }
    }
  });
});
