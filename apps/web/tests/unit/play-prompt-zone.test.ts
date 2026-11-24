import {
  type ActionResult,
  createGameSessionSync,
  type EngineConfig,
  type EngineView,
  type GT028Content,
  type GT028Difficulty,
  preloadGameSession,
  type Slot,
  TemplateGameSession,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it } from "vitest";
import { resolveZonePromptText } from "~/composables/play/play-prompt-zone";
import {
  createLegacySession,
  LEGACY_PROMPT,
  legacyShellPromptText,
} from "./fixtures/play-prompt-zone-sessions";

/**
 * Task #283 N0 — shell chỉ vẽ `drawPromptZone` cho session khai `usesPromptZone`.
 * Engine chưa dời tự vẽ lời dẫn, nên shell vẽ thêm là lời dẫn hiện hai lần.
 */
const GT028_PROMPT = "Bé hãy chạm từng quả táo để đếm nhảy cóc 2 cho đủ 4 nhé!";

const GT028_CONTENT: GT028Content = {
  prompt: GT028_PROMPT,
  step: 2,
  target_total: 4,
  items: [
    { item_id: "a1", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "a2", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "a3", asset: { kind: "emoji", ref: "🍎" } },
  ],
};

const GT028_DIFFICULTY: GT028Difficulty = {
  step: 2,
  item_count: 3,
  allow_undo: true,
  hint_after_ms: 8000,
  shuffle_items: false,
};

const GT028_CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT028",
  content_version: 1,
  template_code: "GT-028",
  content_pack: GT028_CONTENT,
  difficulty_params: GT028_DIFFICULTY,
  theme_id: "default",
  age_band: "4-5",
  reduced_motion: false,
  audio_enabled: false,
};

describe("Task #283 N0 — shell chỉ vẽ lời dẫn khi session khai usesPromptZone", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-028");
  });

  it("engine đã dời (GT-028): shell vẽ lời dẫn của session", () => {
    const session = createGameSessionSync("GT-028", GT028_CONFIG);
    if (session instanceof TemplateGameSession) {
      session.prepareRound("4-5");
    }

    expect(resolveZonePromptText(session)).toBe(GT028_PROMPT);
  });

  it("engine chưa dời (GT-009): shell không vẽ lời dẫn", async () => {
    const session = await createLegacySession();

    expect(resolveZonePromptText(session)).toBeUndefined();
  });

  it("không có session thì shell không vẽ", () => {
    expect(resolveZonePromptText(null)).toBeUndefined();
    expect(resolveZonePromptText(undefined)).toBeUndefined();
  });

  it("ca âm: luật cũ (mọi session có activePrompt) vẽ lời dẫn cho engine chưa dời", async () => {
    const session = await createLegacySession();

    expect(legacyShellPromptText(session)).toBe(LEGACY_PROMPT);
    expect(resolveZonePromptText(session)).not.toBe(
      legacyShellPromptText(session)
    );
  });

  it("session dạy học theo bước (GT-000): ưu tiên activePrompt động của từng bước thay vì kẹt ở content.prompt tĩnh", () => {
    interface StepPromptContent {
      readonly prompt: string;
    }
    class DynamicStepPromptSession extends TemplateGameSession<
      StepPromptContent,
      Record<string, number>
    > {
      override readonly usesPromptZone = true;
      currentStepPrompt = "Đây là quả táo đỏ";

      override setupEntities(): void {
        /* noop */
      }
      override validateAction(): ActionResult {
        return { valid: true, feedback: "none" };
      }
      override checkWinCondition(): boolean {
        return false;
      }
      protected override computeSlots(): readonly Slot[] {
        return [];
      }
      override getView(): EngineView {
        return {
          entities: [],
          activePrompt: this.currentStepPrompt || undefined,
        };
      }
    }

    const session = new DynamicStepPromptSession(
      { prompt: "Làm quen quả táo" },
      {}
    );

    expect(resolveZonePromptText(session)).toBe("Đây là quả táo đỏ");

    session.currentStepPrompt = "Đố bé tìm quả táo đỏ ở đâu nào?";
    expect(resolveZonePromptText(session)).toBe(
      "Đố bé tìm quả táo đỏ ở đâu nào?"
    );

    session.currentStepPrompt = "";
    expect(resolveZonePromptText(session)).toBe("Làm quen quả táo");
  });
});
