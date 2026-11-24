import type {
  GT000SceneBoardMode,
  GT000StoryContext,
} from "@mindkid/game-engine/contracts";
import { pickAgeBandPrompt, sanitizeChildPrompt } from "./utils.js";

export function buildGT000StoryContext(
  conceptLabel: string,
  themeCode: string,
  mode: GT000SceneBoardMode,
  band?: string
): GT000StoryContext {
  const cleanTheme =
    themeCode && themeCode.trim().length > 0 ? themeCode : "school";
  const shortLabel = conceptLabel.trim().replace(/\bsố\s+không\b/gi, "số 0");

  const hookLine = pickAgeBandPrompt(
    band,
    {
      mam: "Mở sổ giấy dó, nghe Cô Cú kể chuyện nhé!",
      choi: "Cô Cú mở sổ kể chuyện mới cho bé nghe!",
      la: "Cùng Cô Cú mở trang sách khám phá điều mới!",
    },
    "Cô Cú mở sổ kể chuyện cho bé nghe nhé!"
  );

  const resolutionByMode: Readonly<Record<GT000SceneBoardMode, string>> = {
    cpa_bridge: "Đếm từng bạn nhỏ, gắn đúng lượng với số!",
    part_whole: "Gộp lại đủ đầy, tách ra hai phần thật khéo!",
    spatial_stage: "Nhìn mốc thật tinh, nhớ ngay vị trí quanh mình!",
    sequence_strip: "Nhịp nhàng nối tiếp, quy luật hiện ra thật vui!",
    sorting_baskets: "Cùng màu cùng nhóm, cất gọn vào hai chiếc rổ!",
    cause_effect: "Có trước có sau, nối đúng đôi bạn kỳ diệu!",
    word_phonics_box: "Lắng tai nghe tiếng, ngân vang vần điệu tiếng Việt!",
    rule_memory_stage: "Mắt tinh tai thính, làm đúng hiệu lệnh của cô!",
    single_card: "Hoan hô, bé đã làm quen trọn bài học rồi!",
  };

  const rawResolution =
    resolutionByMode[mode] ?? `Hoan hô, bé nhớ bài ${shortLabel} thật giỏi!`;
  const resolutionLine = sanitizeChildPrompt(
    rawResolution,
    "Hoan hô, bé đã hoàn thành bài làm quen!"
  );

  return {
    theme_code: cleanTheme,
    guide_character: "co_cu",
    hook_line: hookLine,
    resolution_line: resolutionLine,
  };
}

export function buildSegmentSceneCue(
  mode: GT000SceneBoardMode,
  segIndex: number,
  isReview: boolean,
  band?: string
): string {
  if (isReview) {
    return pickAgeBandPrompt(
      band,
      {
        mam: "Trang cuối rồi, mình cùng ngắm lại nhé!",
        choi: "Tới trang ôn tập, bé trổ tài giúp cô nhé!",
        la: "Trang tổng kết mở ra, cùng ôn lại toàn bài!",
      },
      "Mình cùng ôn lại các bạn vừa gặp nhé!"
    );
  }

  if (segIndex === 0) {
    const firstCueByMode: Readonly<Record<GT000SceneBoardMode, string>> = {
      cpa_bridge: "Chạm từng vật nhỏ, đếm vang cùng Cô Cú nhé!",
      part_whole: "Hai nhánh gộp chung, cùng xem giỏ quả biến đổi!",
      spatial_stage: "Nhìn vật làm mốc, đoán xem bạn đứng phía nào!",
      sequence_strip: "Đoàn tàu nối đuôi, lắng nghe nhịp lặp vui tai!",
      sorting_baskets: "Hai chiếc rổ mây chờ đón bạn cùng một nhóm!",
      cause_effect: "Điều gì xảy ra, mình nối đôi bạn tương ứng!",
      word_phonics_box: "Nghe Cô Cú đọc, vỗ tay tách từng tiếng nhé!",
      rule_memory_stage: "Nhìn kỹ tín hiệu, sẵn sàng làm theo lời cô!",
      single_card: "Trang đầu mở ra, mình ngắm từng hình mới nhé!",
    };
    return sanitizeChildPrompt(
      firstCueByMode[mode],
      "Trang mới mở ra, mình cùng khám phá nhé!"
    );
  }

  return sanitizeChildPrompt(
    `Lật sang trang ${segIndex + 1}, khám phá thêm điều mới nhé!`,
    "Lật trang tiếp theo, cùng xem điều mới nhé!"
  );
}

export function buildSegmentMilestoneLine(
  segIndex: number,
  isReview: boolean,
  band?: string
): string {
  if (isReview) {
    return pickAgeBandPrompt(
      band,
      {
        mam: "Giỏi lắm, bé đã nhớ hết bài hôm nay!",
        choi: "Tuyệt vời, cuốn sổ sáng bừng hoa sen hồng!",
        la: "Xuất sắc, bé sẵn sàng bước vào thử thách mới!",
      },
      "Giỏi lắm, bé đã đi hết bài làm quen!"
    );
  }

  return sanitizeChildPrompt(
    `Xong trang ${segIndex + 1} rồi, hoa sen nở thêm một cánh!`,
    "Tuyệt quá, mình lật sang trang kế tiếp nhé!"
  );
}
