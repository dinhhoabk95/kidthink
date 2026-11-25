import type {
  DatasetAsset,
  DatasetItem,
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, safeGetItem } from "./utils.js";

/** Vật đếm dự phòng khi dataset không có vật nào vẽ được thành một vật đơn. */
export const GT028_FALLBACK_TOKEN = { kind: "emoji", ref: "🍎" } as const;

const GRAPHEMES = new Intl.Segmenter("vi", { granularity: "grapheme" });
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** Chuỗi là đúng **một** hình (một grapheme) và không phải chữ/số. */
function isSingleObject(text: string): boolean {
  const t = text.trim();
  return (
    t.length > 0 &&
    [...GRAPHEMES.segment(t)].length === 1 &&
    !LETTER_OR_DIGIT.test(t)
  );
}

/**
 * Vật đếm của GT-028 (`BR-E028-13`): mỗi ô là **một** vật để chạm đếm. Chữ số
 * trên ô ("7", "9") hay cụm nhiều vật ("🌸🌸🌸") làm đề "đếm cách 2" vô nghĩa —
 * con số trẻ cần thấy là dãy 2, 4, 6… engine vẽ lên vật đã chọn (`BR-E028-05`).
 */
function singleObjectGlyph(item: DatasetItem): DatasetAsset | null {
  return item.glyph && isSingleObject(item.glyph)
    ? { kind: "text", text: item.glyph.trim() }
    : null;
}

function singleObjectImage(item: DatasetItem): DatasetAsset | null {
  const img = item.image;
  if (img?.kind === "image") {
    return img;
  }
  if (img?.kind === "emoji" && isSingleObject(img.ref)) {
    return img;
  }
  if (img?.kind === "text" && isSingleObject(img.text)) {
    return { kind: "emoji", ref: img.text.trim() };
  }
  return null;
}

export const projectGT028: Projection<"GT-028"> = {
  template: "GT-028",
  requires: { min_items: 1, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-028`
      );
    }

    const roundIdx = opts.round_index ?? 0;
    const step = 2; // đếm bước 2
    const totalSteps = Math.min(
      Math.max(2, opts.difficulty + 1 + (roundIdx % 2)),
      5
    );
    const target_total = totalSteps * step;
    const itemCount = Math.max(4, totalSteps + 1);

    const baseIdx = createRng(opts.seed).nextInt(dataset.items.length);
    const baseItem = safeGetItem(
      dataset.items,
      (baseIdx + roundIdx) % dataset.items.length
    );
    const ordered = [baseItem, ...dataset.items.filter((i) => i !== baseItem)];
    // Glyph một-vật ("🍎") trước: đó là khái niệm của kỹ năng, giữ dạng `text`
    // để nó hiện ra (`BR-SDS-03`); không có thì ảnh một-vật.
    const token = [singleObjectGlyph, singleObjectImage]
      .flatMap((pick) => ordered.map((item) => ({ item, asset: pick(item) })))
      .find((c) => c.asset !== null);
    const tokenId = token?.item.id ?? baseItem.id;
    const tokenAsset: DatasetAsset = token?.asset ?? GT028_FALLBACK_TOKEN;
    const items = Array.from({ length: itemCount }, (_, i) => ({
      item_id: `${tokenId}_${i + 1}`,
      asset: tokenAsset,
    }));

    let rep: "tally" | "rekenrek" | "discrete-object" | undefined;
    if (opts.representation === "tally" || opts.representation === "rekenrek") {
      rep = opts.representation;
    } else if (opts.representation === "discrete-object") {
      rep = "discrete-object";
    }

    return {
      content_pack: {
        prompt: `Bé gom từng đôi đếm cách 2 tới ${target_total} nhé!`,
        step: 2 as const,
        items,
        target_total,
        ...(rep ? { representation: rep } : {}),
      },
      difficulty_params: {
        step: 2 as const,
        item_count: itemCount,
        allow_undo: true,
        hint_after_ms: 8000,
        shuffle_items: true,
      },
    };
  },
};
