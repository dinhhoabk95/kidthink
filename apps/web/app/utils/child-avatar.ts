import { AVATAR_PRESET_IDS } from "@mindkid/shared/client";

/**
 * Biểu tượng cho 12 avatar preset — `avatar-preset-01` .. `avatar-preset-12`,
 * là tập giá trị duy nhất mà `parseChildProfileInput` chấp nhận
 * (`packages/shared/src/child-data.ts`).
 *
 * Bản cũ trong `me/index.vue` map theo tên con vật (`bear`, `cat`, ...) — từ
 * vựng không tồn tại ở đâu khác trong hệ thống, nên mọi hồ sơ bé đều rơi về
 * biểu tượng dự phòng.
 */
const PRESET_EMOJI = [
  "🐻",
  "🐰",
  "🐱",
  "🐶",
  "🦊",
  "🐼",
  "🦁",
  "🐯",
  "🐨",
  "🐧",
  "🐢",
  "🦉",
] as const;

export const FALLBACK_AVATAR_EMOJI = "⭐";

export interface AvatarPreset {
  readonly id: string;
  readonly emoji: string;
}

export const AVATAR_PRESETS: readonly AvatarPreset[] = AVATAR_PRESET_IDS.map(
  (id, index) => ({
    id,
    emoji: PRESET_EMOJI[index] ?? FALLBACK_AVATAR_EMOJI,
  })
);

export function resolveAvatarEmoji(avatarId?: string | null): string {
  if (!avatarId) {
    return FALLBACK_AVATAR_EMOJI;
  }
  return (
    AVATAR_PRESETS.find((preset) => preset.id === avatarId)?.emoji ??
    FALLBACK_AVATAR_EMOJI
  );
}
