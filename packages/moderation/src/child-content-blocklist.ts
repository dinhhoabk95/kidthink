import type { ModerationCategory } from "./types.js";

export interface BlocklistEntry {
  term: string;
  category: ModerationCategory;
  message: string;
  severity: "block" | "warn";
}

/**
 * Child Content Blocklist - Danh sách từ ngữ cấm và hạn chế trong nội dung cho trẻ mầm non.
 * Spec: content-seed-authoring.md §7.5 & custom-game-builder.md BR-CGB-09, BR-GLM-05
 */
export const CHILD_CONTENT_BLOCKLIST: BlocklistEntry[] = [
  // 1. Bạo lực (Violence)
  {
    term: "đánh nhau",
    category: "violence",
    message: "Chứa từ ngữ bạo lực",
    severity: "block",
  },
  {
    term: "bắn súng",
    category: "violence",
    message: "Chứa từ ngữ bạo lực / vũ khí",
    severity: "block",
  },
  {
    term: "giết",
    category: "violence",
    message: "Chứa từ ngữ bạo lực nguy hiểm",
    severity: "block",
  },
  {
    term: "chém",
    category: "violence",
    message: "Chứa từ ngữ bạo lực nguy hiểm",
    severity: "block",
  },
  {
    term: "đâm",
    category: "violence",
    message: "Chứa từ ngữ bạo lực nguy hiểm",
    severity: "block",
  },
  {
    term: "đấm",
    category: "violence",
    message: "Chứa hành vi bạo lực",
    severity: "block",
  },
  {
    term: "đá",
    category: "violence",
    message: "Chứa hành vi bạo lực",
    severity: "warn",
  },
  {
    term: "tra tấn",
    category: "violence",
    message: "Chứa từ ngữ bạo lực nghiêm trọng",
    severity: "block",
  },
  {
    term: "vũ khí",
    category: "violence",
    message: "Chứa từ ngữ liên quan đến vũ khí",
    severity: "block",
  },
  {
    term: "súng",
    category: "violence",
    message: "Chứa từ ngữ liên quan đến vũ khí",
    severity: "block",
  },
  {
    term: "dao",
    category: "violence",
    message: "Chứa vật sắc nhọn nguy hiểm",
    severity: "warn",
  },
  {
    term: "bom",
    category: "violence",
    message: "Chứa từ ngữ chất nổ / nguy hiểm",
    severity: "block",
  },
  {
    term: "máu",
    category: "violence",
    message: "Chứa hình ảnh tổn thương / máu me",
    severity: "block",
  },
  {
    term: "chảy máu",
    category: "violence",
    message: "Chứa hình ảnh tổn thương",
    severity: "block",
  },
  {
    term: "gãy tay",
    category: "violence",
    message: "Chứa thương tích thể xác",
    severity: "block",
  },
  {
    term: "gãy chân",
    category: "violence",
    message: "Chứa thương tích thể xác",
    severity: "block",
  },

  // 2. Sợ hãi / Ma quỷ (Fear)
  {
    term: "con ma",
    category: "fear",
    message: "Nội dung gây sợ hãi cho trẻ nhỏ",
    severity: "block",
  },
  {
    term: "ma quỷ",
    category: "fear",
    message: "Nội dung gây sợ hãi cho trẻ nhỏ",
    severity: "block",
  },
  {
    term: "ác quỷ",
    category: "fear",
    message: "Nội dung gây sợ hãi cho trẻ nhỏ",
    severity: "block",
  },
  {
    term: "quái vật",
    category: "fear",
    message: "Nội dung gây sợ hãi cho trẻ nhỏ",
    severity: "block",
  },
  {
    term: "đầu lâu",
    category: "fear",
    message: "Hình ảnh rùng rợn, không phù hợp với trẻ",
    severity: "block",
  },
  {
    term: "bóng ma",
    category: "fear",
    message: "Nội dung gây sợ hãi",
    severity: "block",
  },
  {
    term: "kinh dị",
    category: "fear",
    message: "Nội dung kinh dị không phù hợp",
    severity: "block",
  },
  {
    term: "rùng rợn",
    category: "fear",
    message: "Nội dung gây sợ hãi",
    severity: "block",
  },

  // 3. Chết chóc (Death)
  {
    term: "chết",
    category: "death",
    message: "Từ ngữ chết chóc không phù hợp lứa tuổi 3-6",
    severity: "block",
  },
  {
    term: "qua đời",
    category: "death",
    message: "Chủ đề mất mát không phù hợp",
    severity: "block",
  },
  {
    term: "tử vong",
    category: "death",
    message: "Thuật ngữ chết chóc không phù hợp",
    severity: "block",
  },
  {
    term: "quan tài",
    category: "death",
    message: "Hình ảnh tang tóc không phù hợp",
    severity: "block",
  },
  {
    term: "nghĩa địa",
    category: "death",
    message: "Địa điểm tang tóc không phù hợp",
    severity: "block",
  },
  {
    term: "ngôi mộ",
    category: "death",
    message: "Địa điểm tang tóc không phù hợp",
    severity: "block",
  },
  {
    term: "mai táng",
    category: "death",
    message: "Chủ đề tang lễ không phù hợp",
    severity: "block",
  },

  // 4. Bệnh tật / Nguy hiểm (Disease)
  {
    term: "dịch bệnh",
    category: "disease",
    message: "Chủ đề bệnh tật tiêu cực",
    severity: "block",
  },
  {
    term: "ung thư",
    category: "disease",
    message: "Chủ đề bệnh lý nghiêm trọng",
    severity: "block",
  },
  {
    term: "lây nhiễm",
    category: "disease",
    message: "Chủ đề lây nhiễm nguy hiểm",
    severity: "block",
  },
  {
    term: "truyền nhiễm",
    category: "disease",
    message: "Chủ đề bệnh tật truyền nhiễm",
    severity: "block",
  },
  {
    term: "thuốc độc",
    category: "disease",
    message: "Chất độc hại nguy hiểm",
    severity: "block",
  },
  {
    term: "ngộ độc",
    category: "disease",
    message: "Chủ đề ngộ độc nguy hiểm",
    severity: "block",
  },

  // 5. Phân biệt / Xúc phạm vùng miền & giới tính (Discrimination)
  {
    term: "bắc kỳ",
    category: "discrimination",
    message: "Từ ngữ miệt thị phân biệt vùng miền",
    severity: "block",
  },
  {
    term: "nam kỳ",
    category: "discrimination",
    message: "Từ ngữ miệt thị phân biệt vùng miền",
    severity: "block",
  },
  {
    term: "trung kỳ",
    category: "discrimination",
    message: "Từ ngữ miệt thị phân biệt vùng miền",
    severity: "block",
  },
  {
    term: "đồ nhà quê",
    category: "discrimination",
    message: "Từ ngữ xúc phạm, phân biệt",
    severity: "block",
  },
  {
    term: "khinh thường",
    category: "discrimination",
    message: "Thái độ phân biệt tiêu cực",
    severity: "block",
  },
  {
    term: "dân tộc thiểu số dốt",
    category: "discrimination",
    message: "Từ ngữ miệt thị dân tộc",
    severity: "block",
  },

  // 6. Thương hiệu / Bản quyền thương mại (Trademark)
  {
    term: "disney",
    category: "trademark",
    message: "Thương hiệu thương mại / bản quyền bên thứ ba",
    severity: "block",
  },
  {
    term: "marvel",
    category: "trademark",
    message: "Nhân vật bản quyền thương mại",
    severity: "block",
  },
  {
    term: "spiderman",
    category: "trademark",
    message: "Nhân vật bản quyền thương mại",
    severity: "block",
  },
  {
    term: "batman",
    category: "trademark",
    message: "Nhân vật bản quyền thương mại",
    severity: "block",
  },
  {
    term: "pokemon",
    category: "trademark",
    message: "Thương hiệu / nhân vật có bản quyền",
    severity: "block",
  },
  {
    term: "elsa",
    category: "trademark",
    message: "Nhân vật hoạt hình bản quyền",
    severity: "block",
  },
  {
    term: "barbie",
    category: "trademark",
    message: "Nhãn hiệu thương mại có bản quyền",
    severity: "block",
  },
  {
    term: "mcdonalds",
    category: "trademark",
    message: "Nhãn hiệu thương mại",
    severity: "block",
  },
  {
    term: "pepsi",
    category: "trademark",
    message: "Nhãn hiệu thương mại",
    severity: "block",
  },
  {
    term: "coca cola",
    category: "trademark",
    message: "Nhãn hiệu thương mại",
    severity: "block",
  },

  // 7. Chính trị / Tôn giáo (Politics / Religion)
  {
    term: "chính trị",
    category: "politics_religion",
    message: "Nội dung chính trị ngoài phạm vi mầm non",
    severity: "block",
  },
  {
    term: "biểu tình",
    category: "politics_religion",
    message: "Nội dung chính trị / xã hội",
    severity: "block",
  },
  {
    term: "đảng phái",
    category: "politics_religion",
    message: "Nội dung chính trị",
    severity: "block",
  },
  {
    term: "mê tín",
    category: "politics_religion",
    message: "Chủ đề mê tín dị đoan",
    severity: "block",
  },
  {
    term: "bùa ngải",
    category: "politics_religion",
    message: "Chủ đề mê tín không phù hợp",
    severity: "block",
  },

  // 8. So sánh hơn kém / Từ mang tính trừng phạt (Shaming & Punishment)
  {
    term: "sai rồi",
    category: "shaming_punishment",
    message: "Từ ngữ mang tính phủ định/trừng phạt sư phạm",
    severity: "block",
  },
  {
    term: "dốt",
    category: "shaming_punishment",
    message: "Từ ngữ miệt thị, hạ thấp năng lực trẻ",
    severity: "block",
  },
  {
    term: "ngu",
    category: "shaming_punishment",
    message: "Từ ngữ xúc phạm trẻ",
    severity: "block",
  },
  {
    term: "kém cỏi",
    category: "shaming_punishment",
    message: "Từ ngữ so sánh, hạ thấp trẻ",
    severity: "block",
  },
  {
    term: "vô dụng",
    category: "shaming_punishment",
    message: "Từ ngữ mang tính nhục mạ",
    severity: "block",
  },
  {
    term: "đồ ngốc",
    category: "shaming_punishment",
    message: "Từ ngữ xúc phạm, giễu cợt",
    severity: "block",
  },
  {
    term: "thua cuộc",
    category: "shaming_punishment",
    message: "Tạo áp lực thắng/thua tiêu cực",
    severity: "block",
  },
  {
    term: "phạt đòn",
    category: "shaming_punishment",
    message: "Hành vi trừng phạt thân thể",
    severity: "block",
  },
  {
    term: "hư đốn",
    category: "shaming_punishment",
    message: "Định kiến nhãn mác tiêu cực",
    severity: "block",
  },
  {
    term: "bị phạt",
    category: "shaming_punishment",
    message: "Từ ngữ trừng phạt",
    severity: "block",
  },

  // 9. Tục tĩu / Chửi thề (Profanity)
  {
    term: "đĩ",
    category: "profanity",
    message: "Từ ngữ thô tục",
    severity: "block",
  },
  {
    term: "đụ",
    category: "profanity",
    message: "Từ ngữ thô tục",
    severity: "block",
  },
  {
    term: "đéo",
    category: "profanity",
    message: "Từ ngữ thô tục",
    severity: "block",
  },
  {
    term: "vãi",
    category: "profanity",
    message: "Từ ngữ lóng thô tục",
    severity: "block",
  },
  {
    term: "chết tiệt",
    category: "profanity",
    message: "Từ ngữ chửi thề",
    severity: "block",
  },
  {
    term: "mẹ kiếp",
    category: "profanity",
    message: "Từ ngữ chửi thề",
    severity: "block",
  },
  {
    term: "khốn nạn",
    category: "profanity",
    message: "Từ ngữ xúc phạm, thô tục",
    severity: "block",
  },

  // 10. Phủ định trong chỉ dẫn trẻ mầm non (BR-GLM-05, BR-CGB-10)
  {
    term: "đừng",
    category: "negative_assertion",
    message: "Chỉ dẫn không được dùng thể phủ định ('đừng') cho trẻ 3-6 tuổi",
    severity: "block",
  },
  {
    term: "chớ",
    category: "negative_assertion",
    message: "Chỉ dẫn không được dùng thể phủ định ('chớ')",
    severity: "block",
  },
  {
    term: "cấm",
    category: "negative_assertion",
    message: "Chỉ dẫn không được dùng thể cấm đoán ('cấm')",
    severity: "block",
  },
  {
    term: "không được",
    category: "negative_assertion",
    message: "Chỉ dẫn không được dùng thể phủ định ('không được')",
    severity: "block",
  },
  {
    term: "không chọn",
    category: "negative_assertion",
    message: "Chỉ dẫn không được dùng thể phủ định ('không chọn')",
    severity: "block",
  },
];
