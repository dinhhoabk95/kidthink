import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  type ItemVisualState,
  type RenderAsset,
  type RenderItem,
  updateParticles,
} from "../shared-render.js";
import type {
  GT000Asset,
  GT000Content,
  GT000Difficulty,
  GT000Step,
} from "./template.js";

function resolveRenderAsset(asset: GT000Asset): RenderAsset | null {
  if (!asset.image_ref) {
    return null;
  }
  if (asset.image_ref.kind === "emoji") {
    return { kind: "emoji", ref: asset.image_ref.ref };
  }
  if (asset.image_ref.kind === "text") {
    return { kind: "text", text: asset.image_ref.text };
  }
  return { kind: "image", path: asset.image_ref.path };
}

function createRenderItem(
  asset: GT000Asset,
  state: ItemVisualState = "idle"
): RenderItem {
  return {
    id: asset.asset_id,
    label: asset.label,
    text: asset.glyph ?? asset.text,
    asset: resolveRenderAsset(asset),
    state,
  };
}

function getStepPeriod(action: GT000Step["action"]): 1 | 2 | 3 {
  if (action === "present") {
    return 1;
  }
  if (action === "recall") {
    return 3;
  }
  return 2;
}

function getStepItemCount(step: GT000Step): number {
  if (step.action === "recognise") {
    return 1 + step.distractor_asset_ids.length;
  }
  if (step.action === "link") {
    return 2;
  }
  if (step.action === "recall") {
    return step.option_asset_ids.length;
  }
  return 1;
}

export class GT000Session extends TemplateGameSession<
  GT000Content,
  GT000Difficulty
> {
  slots: readonly Slot[] = [];
  currentStepIndex = 0;
  selectedAssetId: string | null = null;
  readonly missCounts = new Map<string, number>();
  readonly deferredAssetIds: string[] = [];
  readonly recallAnswers: { asset_id: string; correct: boolean }[] = [];

  private renderParticles: Particle[] = [];
  private readonly renderItemStates = new Map<string, ItemVisualState>();
  private activePeriod: 1 | 2 | 3 = 1;

  setupEntities(): void {
    this.isWon = false;
    this.currentStepIndex = 0;
    this.selectedAssetId = null;
    this.missCounts.clear();
    this.deferredAssetIds.length = 0;
    this.recallAnswers.length = 0;
    this.renderItemStates.clear();
    this.activePeriod = 1;

    this.recordEvent("game_started", {
      template_code: "GT-000",
      concept: this.content.concept,
      total_steps: this.content.steps.length,
    });

    this.updateCurrentStepLayout();
  }

  private getCurrentStep(): GT000Step | undefined {
    return this.content.steps[this.currentStepIndex];
  }

  private getAsset(assetId: string): GT000Asset | undefined {
    return this.content.assets.find((a) => a.asset_id === assetId);
  }

  private updateCurrentStepLayout(): void {
    const step = this.getCurrentStep();
    if (!step) {
      return;
    }

    const nextPeriod = getStepPeriod(step.action);
    if (nextPeriod !== this.activePeriod) {
      this.activePeriod = nextPeriod;
      this.recordEvent("intro_period_started", {
        period: this.activePeriod,
        step_index: this.currentStepIndex,
      });
    }

    const itemCount = getStepItemCount(step);
    const layoutId = itemCount <= 1 ? "single-focus" : "grid";
    this.slots = resolveLayout(layoutId)({
      slotCount: itemCount,
      ageBand: "3-4",
    });

    if (step.action === "present") {
      this.recordEvent("intro_item_presented", {
        item_id: step.target_asset_id,
        period: 1,
        tts_used: true,
      });
    }
  }

  validateAction(action: GameAction): ActionResult {
    const step = this.getCurrentStep();
    if (!step) {
      return ACTION_IGNORED;
    }

    const payload =
      typeof action.data === "object" && action.data !== null
        ? (action.data as Record<string, string | boolean | number>)
        : {};

    switch (step.action) {
      case "present":
        return this.handlePresentAction(payload, step);
      case "recognise":
        return this.handleRecogniseAction(payload, step);
      case "link":
        return this.handleLinkAction(payload, step);
      case "recall":
        return this.handleRecallAction(payload, step);
      default:
        return ACTION_IGNORED;
    }
  }

  private handlePresentAction(
    _payload: Record<string, string | boolean | number>,
    step: GT000Step & { action: "present" }
  ): ActionResult {
    this.recordEvent("intro_item_acknowledged", {
      item_id: step.target_asset_id,
    });
    this.advanceStep();
    return ACTION_CORRECT;
  }

  private handleRecogniseAction(
    payload: Record<string, string | boolean | number>,
    step: GT000Step & { action: "recognise" }
  ): ActionResult {
    const selectedId = String(payload.item_id ?? payload.asset_id ?? "");
    const isCorrect = selectedId === step.target_asset_id;

    if (!isCorrect) {
      const misses = (this.missCounts.get(step.target_asset_id) ?? 0) + 1;
      this.missCounts.set(step.target_asset_id, misses);

      this.renderItemStates.set(selectedId, "wrong");
      this.recordEvent("intro_item_missed", {
        item_id: step.target_asset_id,
        selected_id: selectedId,
        miss_count: misses,
      });

      if (
        misses >= 3 &&
        this.content.requires_reintro &&
        !this.deferredAssetIds.includes(step.target_asset_id)
      ) {
        this.deferredAssetIds.push(step.target_asset_id);
        this.recordEvent("intro_item_deferred", {
          item_id: step.target_asset_id,
        });
      }
      return ACTION_RETRY;
    }

    this.renderItemStates.set(selectedId, "correct");
    this.recordEvent("intro_recognise_succeeded", {
      item_id: step.target_asset_id,
    });
    this.advanceStep();
    return ACTION_CORRECT;
  }

  private handleLinkAction(
    payload: Record<string, string | boolean | number>,
    step: GT000Step & { action: "link" }
  ): ActionResult {
    const sourceId = String(payload.source_id ?? "");
    const targetId = String(payload.target_id ?? "");

    const isMatch =
      (sourceId === step.source_asset_id &&
        targetId === step.target_asset_id) ||
      (sourceId === step.target_asset_id && targetId === step.source_asset_id);

    if (!isMatch) {
      return ACTION_RETRY;
    }

    this.recordEvent("intro_link_completed", {
      source_id: step.source_asset_id,
      target_id: step.target_asset_id,
    });
    this.advanceStep();
    return ACTION_CORRECT;
  }

  private handleRecallAction(
    payload: Record<string, string | boolean | number>,
    step: GT000Step & { action: "recall" }
  ): ActionResult {
    const isPeriod3 = this.activePeriod === 3;
    if (!isPeriod3) {
      return ACTION_IGNORED;
    }

    const selectedId = String(payload.item_id ?? payload.asset_id ?? "");
    const isCorrect = selectedId === step.target_asset_id;

    this.recallAnswers.push({
      asset_id: step.target_asset_id,
      correct: isCorrect,
    });

    this.recordEvent("intro_recall_answered", {
      item_id: step.target_asset_id,
      answer_correct: isCorrect,
    });

    this.advanceStep();
    return ACTION_CORRECT;
  }

  private advanceStep(): void {
    this.currentStepIndex += 1;
    if (this.currentStepIndex >= this.content.steps.length) {
      this.isWon = true;
      this.recordEvent("game_completed", {
        completed: true,
        total_steps: this.content.steps.length,
        deferred_count: this.deferredAssetIds.length,
        recall_correct_count: this.recallAnswers.filter((a) => a.correct)
          .length,
      });
    } else {
      this.updateCurrentStepLayout();
    }
  }

  override checkWinCondition(): boolean {
    return this.isWon || this.currentStepIndex >= this.content.steps.length;
  }

  private getStepPromptText(step: GT000Step): string {
    if (step.action === "present") {
      const label = this.getAsset(step.target_asset_id)?.label ?? "";
      return step.narration_line ?? `Đây là ${label}`;
    }
    if (step.action === "recognise") {
      const label = this.getAsset(step.target_asset_id)?.label ?? "";
      return step.prompt_line ?? `Bé hãy chỉ cho cô ${label}`;
    }
    if (step.action === "link") {
      return step.prompt_line ?? "Nối đối tượng tương ứng";
    }
    return step.prompt_line ?? "Đây là gì?";
  }

  private getStepAssetIds(step: GT000Step): string[] {
    if (step.action === "recognise") {
      return [step.target_asset_id, ...step.distractor_asset_ids];
    }
    if (step.action === "recall") {
      return step.option_asset_ids;
    }
    if (step.action === "link") {
      return [step.target_asset_id, step.source_asset_id];
    }
    return [];
  }

  private collectRenderItems(step: GT000Step): RenderItem[] {
    const renderItems: RenderItem[] = [];

    if (step.action === "present") {
      const asset = this.getAsset(step.target_asset_id);
      if (asset) {
        renderItems.push(createRenderItem(asset, "idle"));
      }
      return renderItems;
    }

    const assetIds = this.getStepAssetIds(step);
    for (const id of assetIds) {
      const asset = this.getAsset(id);
      if (asset) {
        const state = this.renderItemStates.get(id) ?? "idle";
        renderItems.push(createRenderItem(asset, state));
      }
    }

    return renderItems;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs);

    const step = this.getCurrentStep();
    if (!step) {
      drawPromptText(ctx, rs, "Bé đã hoàn thành bài làm quen!");
      return;
    }

    drawPromptText(ctx, rs, this.getStepPromptText(step));
    drawSubPromptText(ctx, rs, `Khái niệm: ${this.content.concept.label}`);

    const renderItems = this.collectRenderItems(step);
    for (let i = 0; i < renderItems.length; i++) {
      const item = renderItems[i];
      const slot = this.slots[i];
      if (item && slot) {
        drawSlotItem(ctx, rs, slot, item);
      }
    }

    this.renderParticles = updateParticles(this.renderParticles);
  }
}
