import { describe, expect, it, vi } from "vitest";
import {
  GT001_STORY_LINE,
  GT001_THEME_STORIES,
  resolveGT001StoryLine,
} from "#src/labels/gt001-story-lines";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures";
import { GT001Session } from "#src/templates/GT-001/session";
import { GT001ContentSchema } from "#src/templates/GT-001/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return {
    ...actual,
    drawSceneBackground: vi.fn(),
  };
});

function recordCanvasCalls(
  fn: (ctx: CanvasRenderingContext2D) => void
): string[] {
  const fake = createFakeCanvas(960, 540);
  const rawCtx = fake.getContext("2d");
  if (!rawCtx) {
    throw new Error("Fake canvas missing 2d context");
  }
  const calls: string[] = [];
  vi.spyOn(rawCtx, "stroke").mockImplementation(() => {
    calls.push(
      `stroke(${String(rawCtx.strokeStyle)},${rawCtx.lineWidth.toFixed(1)})`
    );
  });
  vi.spyOn(rawCtx, "fill").mockImplementation(() => {
    calls.push(`fill(${String(rawCtx.fillStyle)})`);
  });
  fn(rawCtx as CanvasRenderingContext2D);
  return calls;
}

describe("GT-001 — Cuốn Sách Gỗ Pop-up 3 Chương, Thẻ Ngữ Cảnh & CPA (BR-E001-05..08)", () => {
  const fixture = GT001_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-001 not found");
  }

  it("BR-E001-05: storyLine() khớp đúng 16 chủ đề, fallback an toàn và xếp wood_tap mỗi lần chọn", () => {
    expect(Object.keys(GT001_THEME_STORIES).length).toBe(16);
    const spaceSession = new GT001Session(
      fixture.content,
      fixture.difficulty,
      1,
      "space"
    );
    expect(spaceSession.storyLine()).toBe(GT001_THEME_STORIES.space);

    const fallbackSession = new GT001Session(
      fixture.content,
      fixture.difficulty,
      1,
      "unknown_theme"
    );
    expect(fallbackSession.storyLine()).toBe(GT001_STORY_LINE);
    expect(resolveGT001StoryLine("farm", "ocean")).toBe(
      GT001_THEME_STORIES.ocean
    );

    spaceSession.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    spaceSession.commit({
      type: "select_item",
      data: { item_id: "apple_opt" },
    });
    expect(spaceSession.takeSfxCues()).toEqual(["wood_tap"]);
  });

  it("BR-E001-06: GT001ContentSchema chặn showcase.cue_asset trùng đáp án đúng (trừ silhouette_clue)", () => {
    const leakedStoryRiddle = {
      ...fixture.content,
      showcase: {
        mode: "story_riddle" as const,
        cue_asset: { kind: "emoji" as const, ref: "🍎" },
      },
    };
    expect(GT001ContentSchema.safeParse(leakedStoryRiddle).success).toBe(false);

    const validSilhouette = {
      ...fixture.content,
      showcase: {
        mode: "silhouette_clue" as const,
        cue_asset: { kind: "emoji" as const, ref: "🍎" },
      },
    };
    expect(GT001ContentSchema.safeParse(validSilhouette).success).toBe(true);

    const validCpaBridge = {
      ...fixture.content,
      showcase: {
        mode: "cpa_bridge" as const,
        representation: { kind: "dot-pattern" as const, count: 3, max: 10 },
        bridge_badge_vi: "= 3",
      },
    };
    expect(GT001ContentSchema.safeParse(validCpaBridge).success).toBe(true);
  });

  it("BR-E001-07: vẽ Sách Gỗ Pop-up 2 trang, đường bay parabol đồng xu và giáo cụ CPA nằm trọn trong zones.stage", () => {
    const cpaContent = {
      prompt: "Đố bé tìm đúng số 4 nhé!",
      target_item: {
        item_id: "num_4",
        asset: { kind: "text" as const, text: "4" },
      },
      showcase: {
        mode: "cpa_bridge" as const,
        representation: { kind: "dot-pattern" as const, count: 4, max: 10 },
        bridge_badge_vi: "= 4",
      },
      options: [
        {
          item_id: "num_4",
          asset: { kind: "text" as const, text: "4" },
          is_correct: true,
          label: "số bốn",
        },
        {
          item_id: "num_2",
          asset: { kind: "text" as const, text: "2" },
          is_correct: false,
          label: "số hai",
        },
        {
          item_id: "num_5",
          asset: { kind: "text" as const, text: "5" },
          is_correct: false,
          label: "số năm",
        },
      ],
    };
    const zones = computeStageZones({
      logicW: 960,
      logicH: 540,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });
    const session = new GT001Session(
      cpaContent,
      fixture.difficulty,
      1,
      "school"
    );
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);

    const rs = new RenderSystem();
    expect(
      findDrawsOutsideStage(zones.stage, (ctx) => session.render(ctx, rs, 120))
    ).toEqual([]);

    session.commit({ type: "select_item", data: { item_id: "num_4" } });
    expect(
      findDrawsOutsideStage(zones.stage, (ctx) => session.render(ctx, rs, 180))
    ).toEqual([]);
    expect(
      findDrawsOutsideStage(zones.stage, (ctx) => session.render(ctx, rs, 700))
    ).toEqual([]);
  });

  it("BR-E001-08: thang trợ giúp sư phạm 3 bậc riêng L1 -> L2 -> L3 và dọn trạng thái khi onHintCleared", () => {
    const session = new GT001Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    const correctIdx = session.displayOptions.findIndex((o) => o.is_correct);

    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["storybook-showcase"],
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "slot",
      index: correctIdx,
    });
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: correctIdx,
    });

    session.onScaffoldEscalated(1);
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    const callsL1 = recordCanvasCalls((ctx) => session.render(ctx, rs, 500));

    session.onHintCleared();
    const callsL0 = recordCanvasCalls((ctx) => session.render(ctx, rs, 500));
    expect(callsL1).not.toEqual(callsL0);
  });
});
