import { describe, expect, it } from "vitest";
import { EMOJI_REF_PATTERN, EmojiRef } from "#src/contracts/shared-fields";
import { GT010Generator } from "#src/generators/gt010";
import { getNouns } from "#src/generators/helpers";
import type { ThemeVocabulary } from "#src/generators/types";
import { createRng } from "#src/rng/mulberry32";

const SHORT_POOL_RE = /thiếu danh từ/;
const THEME_RE = /school/;
const HAVE_RE = /5/;
const NEED_RE = /10/;

function vocab(count: number): ThemeVocabulary {
  return {
    theme: "school",
    nouns: Array.from({ length: count }, (_, i) => ({
      emoji_ref: `EMJ-noun-${i}`,
      label_vi: `Danh từ ${i}`,
    })),
  };
}

describe("getNouns — kho từ thiếu là lỗi dữ liệu, không phải điều kiện runtime", () => {
  it("trả đúng kho khi đủ số lượng", () => {
    expect(getNouns(vocab(10), 6)).toHaveLength(10);
  });

  it("ca âm: kho ngắn hơn yêu cầu thì NÉM, Cấm — NEVER độn thêm từ ngoài chủ đề", () => {
    // Bản cũ độn từ `FALLBACK_NOUNS` (toàn hoa quả). Vì mọi chủ đề chỉ có 5
    // danh từ còn generator xin 6–10, nhánh độn là đường đi MẶC ĐỊNH: cả 21
    // file sinh ra đều dính emoji lạc chủ đề, trong khi header vẫn đóng dấu
    // `theme_tag` của chủ đề gốc.
    expect(() => getNouns(vocab(5), 10)).toThrow(SHORT_POOL_RE);
  });

  it("thông điệp lỗi nêu đủ chủ đề, số có và số cần", () => {
    expect(() => getNouns(vocab(5), 10)).toThrow(THEME_RE);
    expect(() => getNouns(vocab(5), 10)).toThrow(HAVE_RE);
    expect(() => getNouns(vocab(5), 10)).toThrow(NEED_RE);
  });
});

describe("EMOJI_REF_PATTERN — mã, không phải glyph (BR-CTR-08)", () => {
  it("nhận mã EMJ-*", () => {
    expect(EMOJI_REF_PATTERN.test("EMJ-red-apple")).toBe(true);
    expect(EMOJI_REF_PATTERN.test("EMJ-jack-o-lantern")).toBe(true);
  });

  it("ca âm: glyph thô và mã sai khuôn đều bị từ chối", () => {
    // `packages/emoji/src/query.ts` chỉ tra theo mã `EMJ-*`, nên một glyph thô
    // resolve ra `not_found` lúc render — quá muộn để ai đó nhìn thấy.
    expect(EMOJI_REF_PATTERN.test("🍎")).toBe(false);
    expect(EMOJI_REF_PATTERN.test("emj-red-apple")).toBe(false);
    expect(EMOJI_REF_PATTERN.test("EMJ-")).toBe(false);
  });

  it("contract CHƯA siết — nợ 57 level đang được đo ở packages/db, không bị bỏ qua", () => {
    // Siết `EmojiRef` ngay làm 57 trên 228 level seed trượt `content_contract`.
    // Nợ đó là thật nhưng dọn được nó là việc nội dung (7 glyph chưa có trong
    // registry), nên nó được ĐO ở `tests/gates/emoji-ref-debt.test.ts` với bậc
    // thang chỉ đi xuống, thay vì siết ở đây rồi phải nâng baseline cổng 1.
    expect(EmojiRef.safeParse("🍎").success).toBe(true);
  });
});

describe("GT-010 — đáp án phải phân biệt được (BR-ECD-01)", () => {
  const themeVocab = vocab(10);

  it("ca âm: Cấm — NEVER có hai lựa chọn cùng giá trị", () => {
    // Bản cũ rút `valA` và `valB` từ hai khoảng chồng nhau mà không loại trừ,
    // nên 7 trên 9 level đã commit có hai ô hiện cùng một số và chỉ một ô được
    // chấm đúng. Trẻ chạm ô kia là sai, dù nhìn y hệt.
    for (let seed = 1; seed <= 200; seed++) {
      const { content_pack } = GT010Generator.generate({
        rng: createRng(seed),
        age_band: "4-5",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: { options: { value: number }[] } };

      const values = content_pack.options.map((o) => o.value);
      expect(
        new Set(values).size,
        `seed ${seed} sinh lựa chọn trùng: ${values.join(",")}`
      ).toBe(values.length);
    }
  });

  it("luôn có đúng một đáp án đúng", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { content_pack } = GT010Generator.generate({
        rng: createRng(seed),
        age_band: "4-5",
        theme: "school",
        vocabulary: themeVocab,
      }) as { content_pack: { options: { is_correct: boolean }[] } };

      expect(content_pack.options.filter((o) => o.is_correct)).toHaveLength(1);
    }
  });
});
