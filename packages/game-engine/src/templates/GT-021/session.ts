import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import { MirrorSystem } from "#src/systems/mirror-system";
import type { GT021Content, GT021Difficulty } from "./template.js";

export class GT021Session extends TemplateGameSession<
  GT021Content,
  GT021Difficulty
> {
  readonly mirrorSystem = new MirrorSystem();
  private readonly placementMechanic = new PlacementMechanic();

  setupEntities(): void {
    this.isWon = false;
    this.placementMechanic.reset();

    const symmetricPairs = this.content.target_slots.map((t, idx) => ({
      referenceSlotId:
        this.content.reference_pattern[idx]?.slot_id ?? `ref-${idx}`,
      targetSlotId: t.slot_id,
      expectedAssetRef: t.expected_asset_ref,
    }));

    this.mirrorSystem.init(symmetricPairs);

    this.recordEvent("round_started", {
      round_index: 0,
      axis: this.content.axis,
      target_count: this.content.target_slots.length,
      option_count: this.content.options.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const data = action.data as
        | { item_id?: string; target_id?: string }
        | undefined;
      const itemId = data?.item_id;
      const targetId = data?.target_id;

      if (!(itemId && targetId)) {
        return ACTION_IGNORED;
      }

      const opt = this.content.options.find((o) => o.item_id === itemId);
      const target = this.content.target_slots.find(
        (t) => t.slot_id === targetId
      );

      if (!(opt && target)) {
        return ACTION_IGNORED;
      }

      return opt.asset_ref === target.expected_asset_ref
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  onPlaceOption(itemId: string, targetSlotId: string): ActionResult {
    const opt = this.content.options.find((o) => o.item_id === itemId);
    const target = this.content.target_slots.find(
      (t) => t.slot_id === targetSlotId
    );

    if (!(opt && target)) {
      return ACTION_IGNORED;
    }

    this.placementMechanic.place(itemId, targetSlotId);
    const isCorrect = this.mirrorSystem.place(targetSlotId, opt.asset_ref);

    this.recordEvent("item_placed", {
      item_id: itemId,
      target_slot_id: targetSlotId,
      asset_ref: opt.asset_ref,
      is_correct: isCorrect,
    });

    if (this.checkWinCondition()) {
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    return isCorrect ? ACTION_CORRECT : ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    return this.mirrorSystem.isComplete();
  }
}

export default GT021Session;
