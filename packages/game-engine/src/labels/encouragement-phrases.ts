/**
 * Kho câu khích lệ đồng dao & lời cô giáo mầm non Việt Nam (3–6 tuổi) cho HUD
 * Canvas và dẫn chuyện ("Tuổi thơ Việt × Giấy Gỗ Mộc").
 *
 * Bất biến giọng điệu (`06-voice.md` & `BR-FBK-08`):
 * - Ấm áp, giàu nhịp vần đồng dao, ngắn gọn vừa hơi thở trẻ mầm non.
 * - Tuyệt đối không phán xét, không so sánh ("hơn", "kém"), không phủ định
 *   nặng ("sai rồi", "không đúng", "bé chưa giỏi").
 */

import type { AgeBand } from "#src/contracts/types";

export type EncouragementMoment =
  | "praise"
  | "retry"
  | "scaffold_nudge"
  | "level_complete";

/** Câu vần đồng dao mừng hoàn thành màn chơi — gieo vần lưng trong sáng. */
export const DONG_DAO_CELEBRATION_CHANTS = Object.freeze([
  "Dung dăng dung dẻ, bé giỏi quá nè!",
  "Tập tầm vông, bé làm thành công!",
  "Nu na nu nống, bé tìm rất đúng!",
  "Rồng rắn lên mây, bé khéo đôi tay!",
  "Chi chi chành chành, bé tinh mắt nhanh!",
  "Tinh mắt khéo tay, Gấu khen bé tài!",
  "Một hai ba bốn, xếp gọn thật xinh!",
] as const);

export const PRESCHOOL_ENCOURAGEMENT_BY_BAND: Readonly<
  Record<AgeBand, Readonly<Record<EncouragementMoment, readonly string[]>>>
> = Object.freeze({
  "3-4": {
    praise: [
      "Giỏi quá bé ơi!",
      "Hoan hô bé ngoan!",
      "Đúng rồi, yêu quá!",
      "Khéo tay quá nha!",
    ],
    retry: [
      "Thử lại cùng cô nhé!",
      "Chậm rãi chạm lại nha!",
      "Bé nhìn kỹ chỗ này xem?",
    ],
    scaffold_nudge: [
      "Cô chỉ nhẹ chỗ này nhé!",
      "Mình nhìn vào ô sáng nha!",
      "Chạm thử vào đây nào bé!",
    ],
    level_complete: [
      "Dung dăng dung dẻ, bé giỏi quá nè!",
      "Tập tầm vông, bé làm thành công!",
    ],
  },
  "4-5": {
    praise: [
      "Mắt tinh quá ta!",
      "Khéo tay hay làm!",
      "Bé tìm trúng phóc rồi!",
      "Hay quá bé ơi!",
    ],
    retry: [
      "Gần ra rồi bé ơi!",
      "Gần đúng rồi đó, mình ngắm lại chút nha!",
      "Bình tĩnh thử cách khác nhé!",
      "Mình quan sát lại một chút nha!",
    ],
    scaffold_nudge: [
      "Gợi ý nhỏ đang nhấp nháy kìa!",
      "Bé thử ghép vào ô đang sáng xem!",
      "Nhìn dấu sáng dẫn đường nhé!",
    ],
    level_complete: [
      "Nu na nu nống, bé tìm rất đúng!",
      "Rồng rắn lên mây, bé khéo đôi tay!",
    ],
  },
  "5-6": {
    praise: [
      "Suy nghĩ sắc bén quá!",
      "Bé giải đố thật khéo!",
      "Trọn vẹn từng bước luôn!",
      "Tập trung đáng khen lắm!",
    ],
    retry: [
      "Thử kiểm tra lại quy luật nhé!",
      "Chậm rãi đối chiếu từng ô nha!",
      "Sắp tìm ra chìa khóa rồi!",
    ],
    scaffold_nudge: [
      "Quan sát mối liên hệ ở ô sáng nhé!",
      "Thử bắt đầu từ manh mối này xem!",
      "Nhìn kỹ điểm chung của nhóm nha!",
    ],
    level_complete: [
      "Chi chi chành chành, bé tinh mắt nhanh!",
      "Rồng rắn lên mây, bé khéo đôi tay!",
    ],
  },
});

/**
 * Chọn câu khích lệ thuần định định (pure, deterministic) theo band tuổi và
 * thời điểm tương tác, xoay vòng theo `stepIndex`.
 */
export function pickEncouragementPhrase(
  moment: EncouragementMoment,
  ageBand: AgeBand = "4-5",
  stepIndex = 0
): string {
  const bandTable = PRESCHOOL_ENCOURAGEMENT_BY_BAND[ageBand];
  const list = bandTable[moment];
  const safeIdx = Math.abs(Math.trunc(stepIndex)) % list.length;
  return list[safeIdx] ?? list[0] ?? "Giỏi quá!";
}
