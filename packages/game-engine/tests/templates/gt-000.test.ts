import { describe, expect, it, vi } from "vitest";
import type { Gesture } from "#src/interaction";
import { GT000_FIXTURES } from "#src/templates/GT-000/fixtures";
import { GT000Session } from "#src/templates/GT-000/session";
import type { GT000Content } from "#src/templates/GT-000/template";

describe("GT-000 Concept Intro Session (M0 & M1 Acceptance)", () => {
  const fixture = GT000_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-000 not found");
  }

  it("M0: getView() returns entities with matching slots and prompt", () => {
    const session = new GT000Session(fixture.content, fixture.difficulty);
    session.prepareRound("3-4");

    const view = session.getView();
    expect(view.entities.length).toBeGreaterThan(0);
    expect(view.activePrompt).toContain("Đây là số một");
    const targetEntity = view.entities[0];
    expect(targetEntity).toBeDefined();
    expect(targetEntity?.id).toBe("num_1");
  });

  it("M0: toAction() maps tap on target slot to tap_item action and advances currentStepIndex on dispatch", () => {
    const session = new GT000Session(fixture.content, fixture.difficulty);
    session.prepareRound("3-4");

    const initialStep = session.currentStepIndex;
    const view = session.getView();
    const entity = view.entities[0];
    if (!entity) {
      throw new Error("Entity not found");
    }

    // Chạm vào đúng ô của mục tiêu
    const gesture: Gesture = {
      type: "tap",
      x: entity.x,
      y: entity.y,
      timeMs: 0,
    };

    const action = session.toAction(gesture);
    expect(action).not.toBeNull();
    expect(action?.type).toBe("tap_item");

    // Dispatch gesture qua session
    session.dispatch(gesture);
    expect(session.currentStepIndex).toBe(initialStep + 1);
  });

  it("M0 Ca âm: chạm vào ô trống không đổi currentStepIndex", () => {
    const session = new GT000Session(fixture.content, fixture.difficulty);
    session.prepareRound("3-4");

    const initialStep = session.currentStepIndex;

    // Chạm vào góc xa màn hình nơi không có slot nào
    const emptyGesture: Gesture = {
      type: "tap",
      x: 9999,
      y: 9999,
      timeMs: 0,
    };

    const action = session.toAction(emptyGesture);
    expect(action).toBeNull();

    session.dispatch(emptyGesture);
    expect(session.currentStepIndex).toBe(initialStep);
  });

  it("M1: Chặn chạm trước khi lệnh phát audio được gọi (audioPromptCalled = false)", () => {
    const session = new GT000Session(fixture.content, fixture.difficulty);
    session.prepareRound("3-4");

    const view = session.getView();
    const entity = view.entities[0];
    if (!entity) {
      throw new Error("Entity not found");
    }

    // Giả lập trước khi lệnh phát được gọi
    session.audioPromptCalled = false;

    const gesture: Gesture = {
      type: "tap",
      x: entity.x,
      y: entity.y,
      timeMs: 0,
    };

    // Khi chưa gọi lệnh phát -> chạm bị chặn (toAction trả null)
    const action = session.toAction(gesture);
    expect(action).toBeNull();
  });

  it("M1: Bước present ưu tiên audio_path nếu có", () => {
    const contentWithAudio: GT000Content = {
      ...fixture.content,
      assets: fixture.content.assets.map((a) =>
        a.asset_id === "num_1"
          ? { ...a, audio_path: "/audio/numbers/1.mp3" }
          : a
      ),
    };

    const session = new GT000Session(contentWithAudio, fixture.difficulty);
    const playPromptSpy = vi.spyOn(session.audio, "playPromptAudio");
    const speakSpy = vi.spyOn(session.audio, "speakPrompt");

    session.prepareRound("3-4");

    expect(playPromptSpy).toHaveBeenCalledWith("/audio/numbers/1.mp3");
    expect(speakSpy).not.toHaveBeenCalled();
    expect(session.lastTtsUsed).toBe(false);
  });

  it("M1: Bước present không có audio_path gọi TTS vi-VN; không có giọng thì tts_used = false và phát tts_unavailable", () => {
    const contentWithoutAudio: GT000Content = {
      ...fixture.content,
      assets: fixture.content.assets.map((a) => ({
        ...a,
        audio_path: undefined,
      })),
    };

    const session = new GT000Session(contentWithoutAudio, fixture.difficulty);
    // Giả lập môi trường không có giọng vi-VN
    vi.spyOn(session.audio, "speakPrompt").mockReturnValue(false);

    session.prepareRound("3-4");

    expect(session.lastTtsUsed).toBe(false);
    const events = session.getTelemetry().events;
    const unavailable = events.find((e) => e.event_name === "tts_unavailable");
    expect(unavailable).toBeDefined();
    expect(unavailable?.data).toMatchObject({
      lang: "vi-VN",
      asset_id: "num_1",
    });
  });

  it("M1: Khi có giọng vi-VN, tts_used phản ánh đúng giá trị true", () => {
    const contentWithoutAudio: GT000Content = {
      ...fixture.content,
      assets: fixture.content.assets.map((a) => ({
        ...a,
        audio_path: undefined,
      })),
    };

    const session = new GT000Session(contentWithoutAudio, fixture.difficulty);
    vi.spyOn(session.audio, "speakPrompt").mockReturnValue(true);

    session.prepareRound("3-4");

    expect(session.lastTtsUsed).toBe(true);
  });

  describe("M3 Contract Validation (BR-E000-02..04 & Strict Difficulty)", () => {
    const validAsset = {
      asset_id: "a1",
      kind: "glyph" as const,
      label: "Số 1",
      glyph: "1",
      contrast_group: "g1",
    };
    const validAsset2 = {
      asset_id: "a2",
      kind: "glyph" as const,
      label: "Số 2",
      glyph: "2",
      contrast_group: "g1",
    };

    const validSegment = {
      segment_id: "seg_1",
      asset_ids: ["a1", "a2"],
      steps: [
        { action: "present" as const, target_asset_id: "a1" },
        {
          action: "recognise" as const,
          target_asset_id: "a1",
          distractor_asset_ids: ["a2"],
        },
        {
          action: "recall" as const,
          target_asset_id: "a1",
          option_asset_ids: ["a1", "a2"],
        },
      ],
      is_review: true,
    };

    it("Ca âm BR-E000-03: phân đoạn 7 chất liệu bị từ chối", async () => {
      const { GT000SegmentSchema } = await import(
        "#src/templates/GT-000/template"
      );
      const badSegment = {
        ...validSegment,
        asset_ids: ["a1", "a2", "a3", "a4", "a5", "a6", "a7"],
      };
      const res = GT000SegmentSchema.safeParse(badSegment);
      expect(res.success).toBe(false);
    });

    it("Ca âm BR-E000-03: một bài 22 chất liệu bị từ chối", async () => {
      const { GT000ContentSchema } = await import(
        "#src/templates/GT-000/template"
      );
      const manyAssets = Array.from({ length: 22 }, (_, i) => ({
        asset_id: `asset_${i}`,
        kind: "glyph" as const,
        label: `Số ${i}`,
        glyph: `${i}`,
        contrast_group: "numbers",
      }));
      const res = GT000ContentSchema.safeParse({
        concept: { skill_code: "C1.NREC.13", label: "Số" },
        assets: manyAssets,
        segments: [validSegment],
      });
      expect(res.success).toBe(false);
    });

    it("Ca âm BR-E000-04: phân đoạn không kết thúc bằng recall bị từ chối", async () => {
      const { GT000SegmentSchema } = await import(
        "#src/templates/GT-000/template"
      );
      const noRecallSegment = {
        ...validSegment,
        steps: [
          { action: "present" as const, target_asset_id: "a1" },
          {
            action: "recognise" as const,
            target_asset_id: "a1",
            distractor_asset_ids: ["a2"],
          },
        ],
      };
      const res = GT000SegmentSchema.safeParse(noRecallSegment);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.message).toContain("recall");
      }
    });

    it("Ca âm BR-E000-04: bài không có phân đoạn ôn (is_review = true) bị từ chối", async () => {
      const { GT000ContentSchema } = await import(
        "#src/templates/GT-000/template"
      );
      const nonReviewSegment = {
        ...validSegment,
        is_review: false,
      };
      const res = GT000ContentSchema.safeParse({
        concept: { skill_code: "C1.NREC.13", label: "Số" },
        assets: [validAsset, validAsset2],
        segments: [nonReviewSegment],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.message).toContain("phân đoạn ôn");
      }
    });

    it("Ca âm BR-E000-02: chất liệu không có hình minh hoạ (thiếu cả glyph lẫn image_ref) bị từ chối", async () => {
      const { GT000AssetSchema } = await import(
        "#src/templates/GT-000/template"
      );
      const noImageAsset = {
        asset_id: "a_none",
        kind: "word" as const,
        label: "Từ không hình",
        contrast_group: "words",
      };
      const res = GT000AssetSchema.safeParse(noImageAsset);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.message).toContain("hình minh hoạ");
      }
    });

    it("Ca âm: bốn khoá cũ của difficulty_params bị từ chối thay vì nuốt im", async () => {
      const { GT000DifficultySchema } = await import(
        "#src/templates/GT-000/template"
      );
      const legacyDifficulty = {
        pacing: "standard",
        max_errors_before_remediation: 2,
        interaction_timeout_ms: 15_000,
        show_scaffolding: true,
      };
      const res = GT000DifficultySchema.safeParse(legacyDifficulty);
      expect(res.success).toBe(false);
    });

    it("Ca dương: content_pack có segments và difficulty hợp lệ parse thành công", async () => {
      const { GT000ContentSchema, GT000DifficultySchema } = await import(
        "#src/templates/GT-000/template"
      );
      const validContent = {
        concept: { pre_skill_code: "C1.NREC.13", label: "Số 0 đến 5" },
        assets: [validAsset, validAsset2],
        segments: [validSegment],
      };
      const validDiff = {
        hint_after_ms: 12_000,
        allow_retry: true,
        auto_play_audio: true,
      };
      expect(GT000ContentSchema.safeParse(validContent).success).toBe(true);
      expect(GT000DifficultySchema.safeParse(validDiff).success).toBe(true);
    });
  });
});
