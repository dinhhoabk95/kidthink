import type { AgeBand } from "#src/contracts/types";
import type { RenderAsset } from "#src/render/types";
import type { GT001Content, GT001Showcase } from "./template.js";

const DIGITS_ONLY_RE = /^\d{1,2}$/;

const THEME_PROP_EMOJI_BY_CODE: Readonly<Record<string, string>> =
  Object.freeze({
    school: "🏫",
    farm: "🚜",
    home: "🏠",
    animal: "🌳",
    nature: "🌻",
    ocean: "🐚",
    food: "🧺",
    vehicle: "🚦",
    art: "🎨",
    space: "🪐",
    family: "🏡",
    body: "🪞",
    weather: "🌈",
    festival: "🏮",
    job: "🧰",
    homeland: "🪷",
  });

export function resolveThemePropAsset(themeId?: string | null): RenderAsset {
  const emoji = (themeId && THEME_PROP_EMOJI_BY_CODE[themeId]) || "🧺";
  return { kind: "emoji", ref: emoji };
}

function parseSmallNumberText(asset: RenderAsset): number | null {
  if (asset.kind !== "text") {
    return null;
  }
  const trimmed = asset.text.trim();
  if (!DIGITS_ONLY_RE.test(trimmed)) {
    return null;
  }
  const num = Number.parseInt(trimmed, 10);
  if (Number.isNaN(num) || num < 0 || num > 20) {
    return null;
  }
  return num;
}

/**
 * Suy diễn cấu hình Thẻ Ngữ Cảnh Thông Minh (`GT001Showcase`) cho trang trái
 * Cuốn Sách Gỗ Pop-up (`BR-E001-06`).
 *
 * - Khi level từ seeder đã khai `content.showcase`: dùng trực tiếp.
 * - Khi fixture cũ / custom game chỉ khai `target_item`: tự chuyển sang
 *   `cpa_bridge` (với số nguyên 1..20) hoặc `silhouette_clue` (khuôn bóng gỗ)
 *   để không lộ trần hình màu của đáp án ở `L0`.
 */
export function resolveEffectiveShowcase(
  content: GT001Content,
  themeId: string | undefined,
  ageBand: AgeBand
): GT001Showcase {
  if (content.showcase) {
    return content.showcase;
  }

  const targetAsset = content.target_item.asset;
  const parsedNumber = parseSmallNumberText(targetAsset);
  if (parsedNumber !== null) {
    if (parsedNumber === 0) {
      return {
        mode: "story_riddle",
        cue_asset: resolveThemePropAsset(themeId),
        bridge_badge_vi: "= 0",
      };
    }
    if (parsedNumber <= 6) {
      return {
        mode: "cpa_bridge",
        representation: {
          kind: ageBand === "3-4" ? "number-rod" : "dot-pattern",
          count: parsedNumber,
          max: 10,
        },
        bridge_badge_vi: `= ${parsedNumber}`,
      };
    }
    return {
      mode: "cpa_bridge",
      representation: {
        kind: "ten-frame",
        count: parsedNumber,
        max: parsedNumber <= 10 ? 10 : 20,
      },
      bridge_badge_vi: `= ${parsedNumber}`,
    };
  }

  return {
    mode: "silhouette_clue",
    cue_asset: targetAsset,
  };
}

/**
 * Ở bậc trợ giúp `L2`, làm dịu nhẹ độ nổi viền của các phương án nhiễu xa nhất
 * (giữ nguyên ít nhất 2 ứng viên sáng rõ gồm đáp án đúng + 1 nhiễu gần để không
 * làm hộ trẻ trước `L3`, `BR-E001-08`).
 */
export function resolveDimmedOptionIdsAtL2(
  displayOptions: readonly GT001Content["options"][number][]
): ReadonlySet<string> {
  if (displayOptions.length < 3) {
    return new Set<string>();
  }
  const distractors = displayOptions.filter((opt) => !opt.is_correct);
  const dimmed = distractors.slice(1).map((opt) => opt.item_id);
  return new Set<string>(dimmed);
}
