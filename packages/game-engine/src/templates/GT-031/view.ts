import {
  formatNumberWord,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import type { GameAction } from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import type { Slot } from "#src/layout/types";
import type { GT031Coin } from "#src/templates/GT-031/layout";
import type { GT031Content } from "#src/templates/GT-031/template";

const RE_DIGITS = /^[0-9]+$/;

export function resolveGT031DisplayAsset(
  content: GT031Content
): NonNullable<GT031Content["item_to_buy"]>["asset"] {
  const asset = content.item_to_buy?.asset ?? {
    kind: "emoji" as const,
    ref: "🪙",
  };
  if (asset.kind === "emoji" && RE_DIGITS.test(asset.ref)) {
    return { kind: "emoji" as const, ref: "🎁" };
  }
  if (asset.kind === "text" && RE_DIGITS.test(asset.text)) {
    return { kind: "emoji" as const, ref: "🎁" };
  }
  return asset;
}

function buildTargetEntity(
  content: GT031Content,
  targetSlot: Slot,
  isWin: boolean,
  isWrong: boolean
): ViewEntity {
  let state: EntityVisual = "idle";
  if (isWin) {
    state = "correct";
  } else if (isWrong) {
    state = "incorrect";
  }
  const itemToBuy = content.item_to_buy;
  const targetAsset = itemToBuy?.asset ?? { kind: "emoji" as const, ref: "🪙" };
  const targetLabels = resolveAssetLabels(targetAsset);
  const targetWord = formatNumberWord(content.target_amount);
  const targetSpoken = itemToBuy?.label
    ? formatSpokenLabel(`${itemToBuy.label} ${targetWord} đồng`)
    : formatSpokenLabel(`cần trả ${targetWord} đồng`);
  const targetId = content.coins.some((c) => c.coin_id === "payment_target")
    ? "target:payment_target"
    : "payment_target";
  return {
    id: targetId,
    slotIndex: 0,
    role: "target",
    state,
    x: targetSlot.x,
    y: targetSlot.y,
    w: targetSlot.w,
    h: targetSlot.h,
    hitW: targetSlot.hitW,
    hitH: targetSlot.hitH,
    hitShape: "square",
    glyph: targetLabels.glyph,
    label: String(content.target_amount),
    spokenLabel: targetSpoken ?? targetLabels.spokenLabel,
    spokenAudioPath: targetLabels.spokenAudioPath,
  };
}

function resolveCoinVisualState(
  isDeposited: boolean,
  isWin: boolean,
  isHovered: boolean
): EntityVisual {
  if (isDeposited) {
    return isWin ? "correct" : "selected";
  }
  return isHovered ? "active" : "idle";
}

export function buildGT031EngineView(params: {
  content: GT031Content;
  coins: readonly GT031Coin[];
  slots: readonly Slot[];
  depositedCoinIds: readonly string[];
  hoveredCoinId: string | null;
  isWin: boolean;
  isWrong: boolean;
}): EngineView {
  const entities: ViewEntity[] = [];
  const targetSlot = params.slots[0];
  if (targetSlot) {
    entities.push(
      buildTargetEntity(
        params.content,
        targetSlot,
        params.isWin,
        params.isWrong
      )
    );
  }

  for (let i = 0; i < params.coins.length; i++) {
    const coin = params.coins[i];
    const slot = params.slots[1 + i];
    if (!(coin && slot)) {
      continue;
    }
    const isDeposited = params.depositedCoinIds.includes(coin.coin_id);
    const isHovered = params.hoveredCoinId === coin.coin_id;
    const coinLabels = resolveAssetLabels(coin.asset);
    const coinSpoken =
      formatSpokenLabel(`${formatNumberWord(coin.value)} đồng`) ??
      coinLabels.spokenLabel;
    entities.push({
      id: coin.coin_id,
      slotIndex: 1 + i,
      role: "source",
      state: resolveCoinVisualState(isDeposited, params.isWin, isHovered),
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitW: slot.hitW,
      hitH: slot.hitH,
      hitShape: "circle",
      glyph: coinLabels.glyph,
      label: String(coin.value),
      spokenLabel: coinSpoken,
      spokenAudioPath: coinLabels.spokenAudioPath,
    });
  }

  return { activePrompt: params.content.prompt, entities };
}

function isOnSlot(slot: Slot, x: number, y: number): boolean {
  return isPointInSlot(slot, x, y, "square", TAP_TOLERANCE_PX);
}

export function resolveGT031DropAction(params: {
  gesture: Extract<Gesture, { type: "drop" }>;
  coins: readonly GT031Coin[];
  slots: readonly Slot[];
  depositedCoinIds: readonly string[];
}): GameAction | null {
  const { gesture, coins, slots, depositedCoinIds } = params;
  const target = slots[0];
  if (!target) {
    return null;
  }

  const depositedIndex = coins.findIndex((coin, i) => {
    const slot = slots[1 + i];
    return (
      slot !== undefined &&
      depositedCoinIds.includes(coin.coin_id) &&
      isOnSlot(slot, gesture.fromX, gesture.fromY)
    );
  });
  if (depositedIndex >= 0) {
    const coin = coins[depositedIndex];
    if (coin) {
      return { type: "remove_coin", data: { coin_id: coin.coin_id } };
    }
  }

  if (
    isOnSlot(target, gesture.fromX, gesture.fromY) &&
    !isOnSlot(target, gesture.toX, gesture.toY)
  ) {
    const lastId = depositedCoinIds.at(-1);
    if (lastId) {
      return { type: "remove_coin", data: { coin_id: lastId } };
    }
  }

  if (isOnSlot(target, gesture.toX, gesture.toY)) {
    const index = coins.findIndex((coin, i) => {
      const slot = slots[1 + i];
      return (
        slot !== undefined &&
        !depositedCoinIds.includes(coin.coin_id) &&
        isOnSlot(slot, gesture.fromX, gesture.fromY)
      );
    });
    const coin = coins[index];
    return coin
      ? { type: "deposit_coin", data: { coin_id: coin.coin_id } }
      : null;
  }
  return null;
}
