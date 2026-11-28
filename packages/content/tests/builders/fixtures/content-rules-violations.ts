import type {
  RoleUse,
  RuleAsset,
  TrialKind,
} from "#src/builders/content-rules";

/** Vi phạm BR-E005-06: 5 con vịt (nhóm lặp) ghép với 1 con vịt. */
export const PAIR_FIVE_DUCKS_VS_ONE: { left: RuleAsset; right: RuleAsset } = {
  left: { kind: "text", text: "🦆🦆🦆🦆🦆" },
  right: { kind: "emoji", ref: "🦆" },
};

/** Vi phạm BR-E025-08: hai vật khác hẳn (bát cháo và mặt trời mọc). */
export const SPOT_DIFF_TWO_DIFFERENT_OBJECTS: {
  left: RuleAsset;
  right: RuleAsset;
} = {
  left: { kind: "emoji", ref: "🥣" },
  right: { kind: "emoji", ref: "🌅" },
};

/** Vi phạm BR-E026-14: 6 lượt, 4 go = 0,67 (dưới 0,70). */
export const TRIALS_RATIO_067: readonly TrialKind[] = [
  { kind: "go" },
  { kind: "go" },
  { kind: "go" },
  { kind: "go" },
  { kind: "nogo" },
  { kind: "nogo" },
];

/** Vi phạm BR-E026-14: 5 lượt, 3 go = 0,6. */
export const TRIALS_RATIO_060: readonly TrialKind[] = [
  { kind: "go" },
  { kind: "go" },
  { kind: "go" },
  { kind: "nogo" },
  { kind: "nogo" },
];

/** Vi phạm BR-E026-13: "vạch qua đường" vừa go vừa nogo. */
export const ROLE_USES_TWO_MEANINGS: readonly RoleUse[] = [
  { level: "LV-A", goLabel: "vạch qua đường", nogoLabel: "chạy qua đường" },
  { level: "LV-B", goLabel: "nắm tay mẹ", nogoLabel: "vạch qua đường" },
];

/** Vi phạm BR-E030-13: nhãn đơn vị lạ/ghép số. */
export const FORBIDDEN_UNIT_LABELS: readonly string[] = [
  "bút chì hai gang",
  "hộp bút ba gang",
  "kẹp giấy một gang",
  "sải tay",
  "ba lần cái cốc",
];
