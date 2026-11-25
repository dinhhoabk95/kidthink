import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { pickAgeBandPrompt, resolveItemAsset, safeGetItem } from "./utils.js";

type Direction = "up" | "down" | null;

/** Dãy giá trị tăng hẳn / giảm hẳn; thiếu giá trị số hoặc lẫn lộn thì `null`. */
function sequenceDirection(values: readonly (number | undefined)[]): Direction {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length !== values.length || nums.length < 2) {
    return null;
  }
  const pairs = nums.slice(1).map((v, i) => v - (nums[i] ?? v));
  if (pairs.every((d) => d > 0)) {
    return "up";
  }
  if (pairs.every((d) => d < 0)) {
    return "down";
  }
  return null;
}

/**
 * Đề nói rõ chiều của dãy số (`BR-E006-08`): đáp án 10, 9, 8 mà đề chỉ nói
 * "theo đúng trình tự" thì trẻ xếp 8, 9, 10 cũng hợp lý mà bị chấm sai.
 */
function sequencePrompt(band: ProjectOptions["band"], dir: Direction): string {
  if (dir === null) {
    return pickAgeBandPrompt(
      band,
      {
        mam: "Bé xếp hàng lần lượt từ đầu nhé!",
        choi: "Bé thử xếp nối đuôi đúng thứ tự nhé!",
        la: "Đố bé sắp xếp dãy theo đúng trình tự!",
      },
      "Bé sắp xếp theo đúng thứ tự nhé!"
    );
  }
  const way = dir === "up" ? "từ bé đến lớn" : "từ lớn đến bé";
  return pickAgeBandPrompt(
    band,
    {
      mam: `Bé xếp ${way} nhé!`,
      choi: `Bé thử xếp ${way} nhé!`,
      la: `Đố bé xếp dãy ${way}!`,
    },
    `Bé sắp xếp ${way} nhé!`
  );
}

export const projectGT006: Projection<"GT-006"> = {
  template: "GT-006",
  requires: { min_items: 3, max_items: 5 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 3) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-006 đòi hỏi tối thiểu 3 vật`
      );
    }

    const params = getEngineDifficultyParams("GT-006", opts.difficulty);
    const expectedItemCount = params.item_count;

    // If ordering specified, use it; otherwise sort by item.ordering / item.value if present
    const sortedByItemOrder = dataset.items.some(
      (i) => typeof i.ordering === "number" || typeof i.value === "number"
    )
      ? dataset.items
          .slice()
          .sort(
            (a, b) =>
              (a.ordering ?? a.value ?? 0) - (b.ordering ?? b.value ?? 0)
          )
          .map((i) => i.id)
      : dataset.items.map((i) => i.id);
    let orderedIds = dataset.ordering ?? sortedByItemOrder;
    if (orderedIds.length < expectedItemCount) {
      orderedIds = sortedByItemOrder;
    }

    const roundIndex = opts.round_index ?? 0;
    const itemMap = new Map(dataset.items.map((i) => [i.id, i]));
    const pickIds = (source: readonly string[]): string[] => {
      const maxOffset = Math.max(0, source.length - expectedItemCount);
      const startOffset = maxOffset > 0 ? roundIndex % (maxOffset + 1) : 0;
      const ids: string[] = [];
      for (let i = 0; i < expectedItemCount; i++) {
        const idx = startOffset + i;
        if (idx < source.length) {
          ids.push(safeGetItem(source, idx));
        } else {
          const fallback = safeGetItem(
            dataset.items,
            (startOffset + i) % dataset.items.length
          );
          ids.push(fallback.id);
        }
      }
      return ids;
    };
    let selectedIds = pickIds(orderedIds);

    // Dataset có ký hiệu thì bàn chơi phải cho trẻ thấy ký hiệu đó (`BR-SDS-03`).
    // Chuỗi đủ cả hai loại vật thì chỉ đổi khi không có vật nào mang ký hiệu.
    const glyphIds = dataset.items.filter((i) => i.glyph).map((i) => i.id);
    const showsGlyph = selectedIds.some((id) => itemMap.get(id)?.glyph);
    if (glyphIds.length >= expectedItemCount && !showsGlyph) {
      selectedIds = pickIds(glyphIds);
    }

    const sequence = selectedIds.map((id, index) => {
      const item = itemMap.get(id);
      if (!item) {
        throw new Error(
          `[BR-SDS-02] Item ${id} trong ordering không tìm thấy trong items của dataset ${dataset.skill_code}`
        );
      }
      return {
        step_id: `step-${item.id}-${roundIndex * 10 + index + 1}`,
        order_index: index,
        asset: resolveItemAsset(item, true),
        label: item.label,
      };
    });

    const rep =
      opts.representation === "number-line" ? "number-line" : undefined;

    const prompt = sequencePrompt(
      opts.band,
      sequenceDirection(selectedIds.map((id) => itemMap.get(id)?.value))
    );

    return {
      content_pack: {
        prompt,
        sequence,
        ...(rep ? { representation: rep } : {}),
      },
      difficulty_params: {
        item_count: expectedItemCount,
        target_count: expectedItemCount,
        hint_after_ms: params.hint_after_ms ?? 15_000,
        allow_retry: params.allow_retry ?? true,
        shuffle_initial: true,
      },
    };
  },
};
