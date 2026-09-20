import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatDisplayLabel, formatPluralNoun } from "@mindkid/shared";
import {
  createRng,
  resolveItemAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

const WHITESPACE_RUN = /\s+/;
/** Nhãn dài hơn ba từ không còn là danh từ để ghép vào câu đề (`BR-GLM-04`). */
const MAX_NOUN_WORDS = 3;

export const projectGT003: Projection<"GT-003"> = {
  template: "GT-003",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-003 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));

    type DatasetItem = (typeof dataset.items)[number];
    const byCategory = (item: DatasetItem): string =>
      item.category?.type ?? item.label;
    const byLabel = (item: DatasetItem): string => item.label;
    const isShortNoun = (attr: string): boolean =>
      attr.trim().split(WHITESPACE_RUN).length <= MAX_NOUN_WORDS;

    // Dataset chỉ có một loại (mọi vật đều là "trái cây") thì trục phân loại
    // hạ xuống mức tên vật — "giỏ táo", nhiễu là chuối và cam. Giữ trục
    // `category.type` ở đó thì không còn vật nhiễu hợp lệ nào và bàn chơi tụt
    // số vật so với bảng tra độ khó. Nhưng tên vật chỉ dùng được khi nó là
    // danh từ ngắn: nhãn kiểu "xếp sách lên kệ gọn gàng" đẩy câu đề vượt trần
    // 12 từ của `BR-GLM-04`, và một câu đề trẻ không nghe hết tệ hơn một bàn
    // chơi thiếu vật nhiễu.
    const hasManyCategories = new Set(dataset.items.map(byCategory)).size > 1;
    const attrOf = hasManyCategories ? byCategory : byLabel;

    // Vật đích phải có anh em khác thuộc tính, nếu không thì không còn vật
    // nhiễu hợp lệ nào và bàn chơi tụt số vật so với bảng tra độ khó.
    const eligibleTargets = dataset.items.filter((item) =>
      dataset.items.some((other) => attrOf(other) !== attrOf(item))
    );
    const targetPool = eligibleTargets.length ? eligibleTargets : dataset.items;
    const targetItem = safeGetItem(targetPool, rng.nextInt(targetPool.length));
    const targetAttr = attrOf(targetItem);

    // Thuộc tính là khoá nội bộ, còn danh từ hiển thị đi vào câu đề và nhãn
    // rổ — nó phải đọc được. Nhãn dài kiểu "xếp sách lên kệ gọn gàng" đẩy câu
    // đề vượt trần 12 từ của `BR-GLM-04`, nên lúc đó lấy tên loại thay thế.
    const displayNoun = isShortNoun(targetAttr)
      ? targetAttr
      : byCategory(targetItem);

    const params = getEngineDifficultyParams("GT-003", opts.difficulty);
    const targetCount = params.target_count ?? 2;

    // Vật nhiễu BẮT BUỘC khác vật đích cả ở `id` lẫn ở thuộc tính. Lọc riêng
    // theo `id` để lọt vật cùng `category.type` — một quả cam trong rổ trái
    // cây, đúng theo mắt trẻ nhưng engine từ chối. Lọc riêng theo thuộc tính
    // lại để lọt vật trùng `id` (dataset có hai nhãn chung một `id`), và hai
    // vật cùng `id` sinh ra `item_id` trùng nhau.
    const otherItems = dataset.items.filter(
      (i) => i.id !== targetItem.id && attrOf(i) !== targetAttr
    );
    const distractorCount = Math.min(
      params.distractor_count ?? 0,
      otherItems.length
    );
    const chosenDistractors = shuffleDeterministic(otherItems, rng).slice(
      0,
      distractorCount
    );

    const items = [
      ...Array.from({ length: targetCount }, (_, i) => ({
        item_id: `${targetItem.id}_${i + 1}`,
        attribute: targetAttr,
        label: targetItem.label,
        asset: resolveItemAsset(targetItem, true),
        is_correct: true,
      })),
      ...chosenDistractors.map((d, i) => ({
        item_id: `${d.id}_${i + 1}`,
        attribute: attrOf(d),
        label: d.label,
        asset: resolveItemAsset(d, true),
        is_correct: false,
      })),
    ];

    return {
      content_pack: {
        prompt: `Bé hãy kéo ${formatPluralNoun(displayNoun)} vào giỏ nhé!`,
        container: {
          container_id: "basket_1",
          label: `Giỏ ${formatDisplayLabel(displayNoun)}`,
          accepts_attribute: targetAttr,
        },
        items: shuffleDeterministic(items, rng),
      },
      difficulty_params: {
        item_count: items.length,
        distractor_count: chosenDistractors.length,
        target_count: targetCount,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
