import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { PairingMechanic } from "#src/mechanics/pairing-mechanic";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawMatchLine,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  updateParticles,
} from "../shared-render.js";
import type { GT005Content, GT005Difficulty } from "./template.js";

type LeftItem = GT005Content["pairs"][number]["left"];
type RightItem = GT005Content["pairs"][number]["right"];

export class GT005Session extends TemplateGameSession<
  GT005Content,
  GT005Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  displayLeft: readonly LeftItem[] = [];
  displayRight: readonly RightItem[] = [];
  private readonly mechanic = new PairingMechanic();

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;

    const lefts = this.content.pairs.map((p) => p.left);
    const rights = this.content.pairs.map((p) => p.right);

    if (this.difficulty.shuffle_sides === false) {
      this.displayLeft = [...lefts];
      this.displayRight = [...rights];
    } else {
      const rng = deriveStream(this.layoutSeed, "sides");
      this.displayLeft = shuffle(lefts, rng);
      this.displayRight = shuffle(rights, rng);
    }
  }

  private findPair(leftItemId: string, rightItemId: string) {
    return this.content.pairs.find(
      (p) => p.left.item_id === leftItemId && p.right.item_id === rightItemId
    );
  }

  validateAction(action: GameAction): ActionResult {
    const validPairs = this.content.pairs.map((p) => ({
      leftId: p.left.item_id,
      rightId: p.right.item_id,
    }));
    return this.mechanic.validate(action, validPairs);
  }

  onPairMatched(leftItemId: string, rightItemId: string): void {
    const pair = this.findPair(leftItemId, rightItemId);
    if (!pair) {
      return;
    }

    this.mechanic.match(leftItemId, rightItemId);
    this.recordEvent("pair_matched", {
      pair_id: pair.pair_id,
      left_item_id: leftItemId,
      right_item_id: rightItemId,
    });

    if (this.checkWinCondition()) {
      this.winSession();
    }
  }

  override checkWinCondition(): boolean {
    const validPairs = this.content.pairs.map((p) => ({
      leftId: p.left.item_id,
      rightId: p.right.item_id,
    }));
    return this.mechanic.isPairingComplete(validPairs);
  }

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("two-column-matching");
    this.slots = layoutFn({
      slotCount: this.displayLeft.length,
      targetCount: this.displayRight.length,
      ageBand,
    });
  }

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getRenderItemState(itemId: string): ItemVisualState {
    return this.renderItemStates.get(itemId) ?? "idle";
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    const sources = this.slots.filter((s) => s.role === "source");
    const targets = this.slots.filter((s) => s.role === "target");
    const matched = this.mechanic.getMatchedPairs();
    const stagedLeftId = this.mechanic.getStagedLeftId();

    this.displayLeft.forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const isMatched = this.mechanic.isLeftMatched(item.item_id);
      let state = this.getRenderItemState(item.item_id);
      if (isMatched) {
        state = "correct";
      } else if (item.item_id === stagedLeftId) {
        state = "selected";
      }
      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
        state,
      });
    });

    this.displayRight.forEach((item, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const state = this.mechanic.isRightMatched(item.item_id)
        ? "correct"
        : this.getRenderItemState(item.item_id);
      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
        state,
      });
    });

    // Nối cặp đã ghép — trẻ thấy việc mình vừa làm còn nguyên trên màn.
    for (const [leftId, rightId] of matched) {
      const li = this.displayLeft.findIndex((x) => x.item_id === leftId);
      const ri = this.displayRight.findIndex((x) => x.item_id === rightId);
      const ls = sources[li];
      const rslot = targets[ri];
      if (ls && rslot) {
        drawMatchLine(ctx, ls.x, ls.y, rslot.x, rslot.y);
      }
    }
    this.drawRenderFeedback(rs, ctx);
  }

  private drawRenderFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    this.renderParticles = updateParticles(this.renderParticles);
    rs.drawParticles(ctx, this.renderParticles);
  }
}

export default GT005Session;
