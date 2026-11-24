import { describe, expect, it, vi } from "vitest";
import {
  ACTION_CORRECT,
  AudioController,
  BaseGameSession,
  drawSceneBackground,
  FeedbackOverlay,
  type GameAction,
  MILESTONE_BANNER_HOLD_MS,
  RenderSystem,
  type RoundConfig,
  RoundRunner,
  SCENE_PAINTERS,
  type SFXType,
} from "#src/index";
import { createFakeCanvas, type FakeContext } from "#tests/gates/fake-canvas";

const CANONICAL_16_THEMES: readonly string[] = [
  "school",
  "farm",
  "home",
  "animal",
  "nature",
  "ocean",
  "food",
  "vehicle",
  "art",
  "space",
  "family",
  "body",
  "weather",
  "festival",
  "job",
  "homeland",
];

const MOET_10_THEMES: readonly string[] = [
  "mam_non",
  "ban_than",
  "gia_dinh",
  "nghe_nghiep",
  "thuc_vat",
  "dong_vat",
  "giao_thong",
  "hien_tuong_tu_nhien",
  "que_huong",
  "tieu_hoc",
];

function isCanvas2DContext(
  ctx: FakeContext | null
): ctx is FakeContext & CanvasRenderingContext2D {
  return ctx !== null && typeof ctx.save === "function";
}

function getStrictFakeContext(
  w = 960,
  h = 540
): FakeContext & CanvasRenderingContext2D {
  const canvas = createFakeCanvas(w, h);
  const raw = canvas.getContext("2d");
  if (!isCanvas2DContext(raw)) {
    throw new Error("Expected 2D context from fake canvas");
  }
  return raw;
}

class StubWinSession extends BaseGameSession {
  private won = false;

  setupEntities(): void {
    this.won = false;
  }

  validateAction(_action: GameAction) {
    this.won = true;
    return ACTION_CORRECT;
  }

  checkWinCondition(): boolean {
    return this.won;
  }
}

describe("Task #315 Wave 2 — Live Gameplay Wiring (Ngũ cung + Cảnh Việt + Đồng dao)", () => {
  it("playSnapSound leo thang ngũ cung Hò-Xự-Xang-Xê-Cống kèm tiếng phách tre và reset khi mở vòng", () => {
    const audio = new AudioController(true);
    const played: SFXType[] = [];
    vi.spyOn(audio, "play").mockImplementation((cue: SFXType) => {
      played.push(cue);
    });

    for (let i = 0; i < 6; i++) {
      audio.playSnapSound();
    }

    expect(played).toEqual([
      "snap_item",
      "bamboo_clack",
      "marimba_1",
      "snap_item",
      "bamboo_clack",
      "marimba_2",
      "snap_item",
      "bamboo_clack",
      "marimba_3",
      "snap_item",
      "bamboo_clack",
      "marimba_4",
      "snap_item",
      "bamboo_clack",
      "marimba_5",
      "snap_item",
      "bamboo_clack",
      "marimba_1",
    ]);
    expect(audio.getPentatonicStep()).toBe(1);

    audio.playStartSound();
    expect(audio.getPentatonicStep()).toBe(0);
  });

  it("RoundRunner.completeCurrentRound phát tiếng đàn T'rưng (trung_chime) và hoàn thành màn phát đàn tranh (dan_tranh_pluck)", () => {
    const audio = new AudioController(true);
    const played: SFXType[] = [];
    vi.spyOn(audio, "play").mockImplementation((cue: SFXType) => {
      played.push(cue);
    });

    const rounds: RoundConfig[] = [
      {
        round_index: 0,
        content_pack: {},
        difficulty_params: { item_count: 2 },
        instruction: "Chạm vào quả khế",
      },
      {
        round_index: 1,
        content_pack: {},
        difficulty_params: { item_count: 2 },
        instruction: "Chạm vào bông sen",
      },
    ];

    const runner = new RoundRunner({
      rounds,
      sessionFactory: () => new StubWinSession(),
      audioController: audio,
      onPlayNarration: () => {
        // Test stub narration
      },
    });
    runner.startFirstRound();

    const hasNext = runner.completeCurrentRound();
    expect(hasNext).toBe(true);
    expect(played).toContain("trung_chime");

    audio.playLevelCelebrateSound();
    expect(played).toContain("level_celebrate");
    expect(played).toContain("dan_tranh_pluck");

    runner.destroy();
  });

  it("SCENE_PAINTERS ánh xạ trọn vẹn 16 chủ đề chuẩn và 10 chủ đề Bộ GD&ĐT sang họa sĩ cảnh Việt với cache gradient cố định", () => {
    for (const theme of [...CANONICAL_16_THEMES, ...MOET_10_THEMES]) {
      expect(SCENE_PAINTERS.has(theme)).toBe(true);

      const rs = new RenderSystem();
      const ctx = getStrictFakeContext(960, 540);
      rs.setupCanvas(ctx.canvas);
      rs.ambientMotionEnabled = true;
      rs.reducedMotion = false;

      for (let f = 0; f < 20; f++) {
        drawSceneBackground(ctx, rs, theme, f * 16.67);
      }
      expect(ctx.gradientCalls.length).toBe(2);
    }
  });

  it("ambientMotionEnabled = false đóng băng chuyển động họa tiết nền về trạng thái tĩnh an toàn 60fps", () => {
    const rs = new RenderSystem();
    rs.ambientMotionEnabled = false;
    rs.reducedMotion = false;

    const ctxA = getStrictFakeContext(960, 540);
    const ctxB = getStrictFakeContext(960, 540);
    const curvesA: number[][] = [];
    const curvesB: number[][] = [];
    vi.spyOn(ctxA, "quadraticCurveTo").mockImplementation((cpx, cpy, x, y) => {
      curvesA.push([cpx, cpy, x, y]);
    });
    vi.spyOn(ctxB, "quadraticCurveTo").mockImplementation((cpx, cpy, x, y) => {
      curvesB.push([cpx, cpy, x, y]);
    });

    drawSceneBackground(ctxA, rs, "que_huong", 500);
    drawSceneBackground(ctxB, rs, "que_huong", 3500);

    expect(curvesA.length).toBeGreaterThan(0);
    expect(curvesA).toEqual(curvesB);
  });

  it("FeedbackOverlay phát và vẽ bảng đồng dao theo band tuổi trên cột mốc, tự ẩn khi hết hạn và giữ nguyên khi bật reducedMotion", () => {
    const overlay = new FeedbackOverlay();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    const ctx = getStrictFakeContext(960, 540);
    const fillTextSpy = vi.spyOn(ctx, "fillText");

    const phrase = overlay.triggerMilestone("praise", "3-4", 1000);
    expect(phrase.length).toBeGreaterThan(4);
    expect(overlay.hasActiveMilestoneBanner(1050)).toBe(true);
    expect(overlay.getMilestoneBannerText(1050)).toBe(phrase);

    overlay.drawMilestoneBanner(ctx, rs, 1050, {
      x: 40,
      y: 96,
      w: 880,
      h: 400,
    });
    expect(fillTextSpy).toHaveBeenCalledTimes(1);
    expect(fillTextSpy.mock.calls[0]?.[0]).toBe(phrase);

    expect(
      overlay.hasActiveMilestoneBanner(1000 + MILESTONE_BANNER_HOLD_MS + 1)
    ).toBe(false);

    overlay.celebrate("5-6", 5000);
    expect(overlay.frame(5016).mascotPose).toBe("celebrate");
    expect(overlay.getMilestoneBannerText(5016)).toBeTruthy();

    overlay.reset();
    expect(overlay.hasActiveMilestoneBanner(5020)).toBe(false);
  });
});
