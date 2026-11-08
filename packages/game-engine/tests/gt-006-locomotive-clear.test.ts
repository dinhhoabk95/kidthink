import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace, SLOT_GAP_PX } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import { drawLocomotive } from "#src/render/index";
import { RenderSystem } from "#src/systems/render-system";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures.js";
import { GT006Session } from "#src/templates/GT-006/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#src/render/index")>();
  return { ...actual, drawLocomotive: vi.fn(actual.drawLocomotive) };
});

/**
 * Đầu tàu GT-006 không được giao với ô chạm (`BR-E006-07`). Trước đó
 * `x = max(80, ...)` kẹp đầu tàu vào trong ô đầu ở điện thoại hẹp.
 */
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
const FRAMES = [
  { name: "360x640", w: 360, h: 640 },
  { name: "390x844", w: 390, h: 844 },
  { name: "330x697", w: 330, h: 697 },
  { name: "610x350", w: 610, h: 350 },
  { name: "964x628", w: 964, h: 628 },
] as const;

describe("GT-006: đầu tàu tránh ô chạm (BR-E006-07)", () => {
  it("mọi fixture, band và khung: thân đầu tàu cách mọi ô chạm >= SLOT_GAP_PX", () => {
    const problems: string[] = [];
    let drawn = 0;
    const fixtures = GT006_FIXTURES;
    for (const fixture of fixtures) {
      for (const band of BANDS) {
        for (const frame of FRAMES) {
          const space = deriveLogicSpace(frame.w, frame.h);
          const cssPerLogic = frame.w / space.w;
          const content = {
            ...fixture.content,
            representation: "sequence" as const,
          };
          const session = new GT006Session(content, fixture.difficulty, 0);
          const zones = computeZonesForSession(
            { logicW: space.w, logicH: space.h, ageBand: band, cssPerLogic },
            session
          );
          session.prepareRound(
            band,
            space,
            zones.stage,
            zones.tray ?? undefined,
            cssPerLogic
          );
          vi.mocked(drawLocomotive).mockClear();
          const ctx = createFakeCanvas(space.w, space.h).getContext("2d");
          if (!ctx) {
            throw new Error("Không lấy được context");
          }
          session.render(
            ctx as CanvasRenderingContext2D,
            new RenderSystem(),
            0
          );
          for (const call of vi.mocked(drawLocomotive).mock.calls) {
            drawn += 1;
            const [, x, y, w, h] = call;
            for (const s of session.slots) {
              const gapX = Math.max(
                x - w / 2 - (s.x + s.hitW / 2),
                s.x - s.hitW / 2 - (x + w / 2)
              );
              const gapY = Math.max(
                y - h / 2 - (s.y + s.hitH / 2),
                s.y - s.hitH / 2 - (y + h / 2)
              );
              if (Math.max(gapX, gapY) < SLOT_GAP_PX) {
                problems.push(
                  `${fixtures.indexOf(fixture)} ${band} ${frame.name} slot ${s.index}`
                );
                break;
              }
            }
          }
        }
      }
    }
    expect(problems, problems.slice(0, 5).join("; ")).toEqual([]);
    // Có khung đủ chỗ thì đầu tàu vẫn được vẽ (không "sửa" bằng cách bỏ hẳn).
    expect(drawn).toBeGreaterThan(0);
  });
});
