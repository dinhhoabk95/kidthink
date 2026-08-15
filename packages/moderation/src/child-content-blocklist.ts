import type { ModerationCategory } from "./types.js";

export interface BlocklistEntry {
  term: string;
  category: ModerationCategory;
  messageVi: string;
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
    messageVi: "Chứa từ ngữ bạo lực",
    severity: "block",
  },
  {
    term: "bắn súng",
    category: "violence",
    messageVi: "Chứa từ ngữ bạo lực / vũ khí",
    severity: "block",
  },
  {
    term: "giết",
    category: "violence",
    messageVi: "Chứa từ ngữ bạo lực nguy hiểm",
    severity: "block",
  },
  {
    term: "chém",
    category: "violence",
    messageVi: "Chứa từ ngữ bạo lực nguy hiểm",
    severity: "block",
  },
  {
    term: "đâm",
    category: "violence",
    messageVi: "Chứa từ ngữ bạo lực nguy hiểm",
    severity: "block",
  },
  {
    term: "đấm",
    category: "violence",
    messageVi: "Chứa hành vi bạo lực",
    severity: "block",
  },
  {
    term: "đá",
    category: "violence",
    messageVi: "Chứa hành vi bạo lực",
    severity: "warn",
  },
  {
    term: "tra tấn",
    category: "violence",
    messageVi: "Chứa từ ngữ bạo lực nghiêm trọng",
    severity: "block",
  },
  {
    term: "vũ khí",
    category: "violence",
    messageVi: "Chứa từ ngữ liên quan đến vũ khí",
    severity: "block",
  },
  {
    term: "súng",
    category: "violence",
    messageVi: "Chứa từ ngữ liên quan đến vũ khí",
    severity: "block",
  },
  {
    term: "dao",
    category: "violence",
    messageVi: "Chứa vật sắc nhọn nguy hiểm",
    severity: "warn",
  },
  {
    term: "bom",
    category: "violence",
    messageVi: "Chứa từ ngữ chất nổ / nguy hiểm",
    severity: "block",
  },
  {
    term: "máu",
    category: "violence",
    messageVi: "Chứa hình ảnh tổn thương / máu me",
    severity: "block",
  },
  {
    term: "chảy máu",
    category: "violence",
    messageVi: "Chứa hình ảnh tổn thương",
    severity: "block",
  },
  {
    term: "gãy tay",
    category: "violence",
    messageVi: "Chứa thương tích thể xác",
    severity: "block",
  },
  {
    term: "gãy chân",
    category: "violence",
    messageVi: "Chứa thương tích thể xác",
    severity: "block",
  },

  // 2. Sợ hãi / Ma quỷ (Fear)
  {
    term: "con ma",
    category: "fear",
    messageVi: "Nội dung gây sợ hãi cho trẻ nhỏ",
    severity: "block",
  },
  {
    term: "ma quỷ",
    category: "fear",
    messageVi: "Nội dung gây sợ hãi cho trẻ nhỏ",
    severity: "block",
  },
  {
    term: "ác quỷ",
    category: "fear",
    messageVi: "Nội dung gây sợ hãi cho trẻ nhỏ",
    severity: "block",
  },
  {
    term: "quái vật",
    category: "fear",
    messageVi: "Nội dung gây sợ hãi cho trẻ nhỏ",
    severity: "block",
  },
  {
    term: "đầu lâu",
    category: "fear",
    messageVi: "Hình ảnh rùng rợn, không phù hợp với trẻ",
    severity: "block",
  },
  {
    term: "bóng ma",
    category: "fear",
    messageVi: "Nội dung gây sợ hãi",
    severity: "block",
  },
  {
    term: "kinh dị",
    category: "fear",
    messageVi: "Nội dung kinh dị không phù hợp",
    severity: "block",
  },
  {
    term: "rùng rợn",
    category: "fear",
    messageVi: "Nội dung gây sợ hãi",
    severity: "block",
  },

  // 3. Chết chóc (Death)
  {
    term: "chết",
    category: "death",
    messageVi: "Từ ngữ chết chóc không phù hợp lứa tuổi 3-6",
    severity: "block",
  },
  {
    term: "qua đời",
    category: "death",
    messageVi: "Chủ đề mất mát không phù hợp",
    severity: "block",
  },
  {
    term: "tử vong",
    category: "death",
    messageVi: "Thuật ngữ chết chóc không phù hợp",
    severity: "block",
  },
  {
    term: "quan tài",
    category: "death",
    messageVi: "Hình ảnh tang tóc không phù hợp",
    severity: "block",
  },
  {
    term: "nghĩa địa",
    category: "death",
    messageVi: "Địa điểm tang tóc không phù hợp",
    severity: "block",
  },
  {
    term: "ngôi mộ",
    category: "death",
    messageVi: "Địa điểm tang tóc không phù hợp",
    severity: "block",
  },
  {
    term: "mai táng",
    category: "death",
    messageVi: "Chủ đề tang lễ không phù hợp",
    severity: "block",
  },

  // 4. Bệnh tật / Nguy hiểm (Disease)
  {
    term: "dịch bệnh",
    category: "disease",
    messageVi: "Chủ đề bệnh tật tiêu cực",
    severity: "block",
  },
  {
    term: "ung thư",
    category: "disease",
    messageVi: "Chủ đề bệnh lý nghiêm trọng",
    severity: "block",
  },
  {
    term: "lây nhiễm",
    category: "disease",
    messageVi: "Chủ đề lây nhiễm nguy hiểm",
    severity: "block",
  },
  {
    term: "truyền nhiễm",
    category: "disease",
    messageVi: "Chủ đề bệnh tật truyền nhiễm",
    severity: "block",
  },
  {
    term: "thuốc độc",
    category: "disease",
    messageVi: "Chất độc hại nguy hiểm",
    severity: "block",
  },
  {
    term: "ngộ độc",
    category: "disease",
    messageVi: "Chủ đề ngộ độc nguy hiểm",
    severity: "block",
  },

  // 5. Phân biệt / Xúc phạm vùng miền & giới tính (Discrimination)
  {
    term: "bắc kỳ",
    category: "discrimination",
    messageVi: "Từ ngữ miệt thị phân biệt vùng miền",
    severity: "block",
  },
  {
    term: "nam kỳ",
    category: "discrimination",
    messageVi: "Từ ngữ miệt thị phân biệt vùng miền",
    severity: "block",
  },
  {
    term: "trung kỳ",
    category: "discrimination",
    messageVi: "Từ ngữ miệt thị phân biệt vùng miền",
    severity: "block",
  },
  {
    term: "đồ nhà quê",
    category: "discrimination",
    messageVi: "Từ ngữ xúc phạm, phân biệt",
    severity: "block",
  },
  {
    term: "khinh thường",
    category: "discrimination",
    messageVi: "Thái độ phân biệt tiêu cực",
    severity: "block",
  },
  {
    term: "dân tộc thiểu số dốt",
    category: "discrimination",
    messageVi: "Từ ngữ miệt thị dân tộc",
    severity: "block",
  },

  // 6. Thương hiệu / Bản quyền thương mại (Trademark)
  {
    term: "disney",
    category: "trademark",
    messageVi: "Thương hiệu thương mại / bản quyền bên thứ ba",
    severity: "block",
  },
  {
    term: "marvel",
    category: "trademark",
    messageVi: "Nhân vật bản quyền thương mại",
    severity: "block",
  },
  {
    term: "spiderman",
    category: "trademark",
    messageVi: "Nhân vật bản quyền thương mại",
    severity: "block",
  },
  {
    term: "batman",
    category: "trademark",
    messageVi: "Nhân vật bản quyền thương mại",
    severity: "block",
  },
  {
    term: "pokemon",
    category: "trademark",
    messageVi: "Thương hiệu / nhân vật có bản quyền",
    severity: "block",
  },
  {
    term: "elsa",
    category: "trademark",
    messageVi: "Nhân vật hoạt hình bản quyền",
    severity: "block",
  },
  {
    term: "barbie",
    category: "trademark",
    messageVi: "Nhãn hiệu thương mại có bản quyền",
    severity: "block",
  },
  {
    term: "mcdonalds",
    category: "trademark",
    messageVi: "Nhãn hiệu thương mại",
    severity: "block",
  },
  {
    term: "pepsi",
    category: "trademark",
    messageVi: "Nhãn hiệu thương mại",
    severity: "block",
  },
  {
    term: "coca cola",
    category: "trademark",
    messageVi: "Nhãn hiệu thương mại",
    severity: "block",
  },

  // 7. Chính trị / Tôn giáo (Politics / Religion)
  {
    term: "chính trị",
    category: "politics_religion",
    messageVi: "Nội dung chính trị ngoài phạm vi mầm non",
    severity: "block",
  },
  {
    term: "biểu tình",
    category: "politics_religion",
    messageVi: "Nội dung chính trị / xã hội",
    severity: "block",
  },
  {
    term: "đảng phái",
    category: "politics_religion",
    messageVi: "Nội dung chính trị",
    severity: "block",
  },
  {
    term: "mê tín",
    category: "politics_religion",
    messageVi: "Chủ đề mê tín dị đoan",
    severity: "block",
  },
  {
    term: "bùa ngải",
    category: "politics_religion",
    messageVi: "Chủ đề mê tín không phù hợp",
    severity: "block",
  },

  // 8. So sánh hơn kém / Từ mang tính trừng phạt (Shaming & Punishment)
  {
    term: "sai rồi",
    category: "shaming_punishment",
    messageVi: "Từ ngữ mang tính phủ định/trừng phạt sư phạm",
    severity: "block",
  },
  {
    term: "dốt",
    category: "shaming_punishment",
    messageVi: "Từ ngữ miệt thị, hạ thấp năng lực trẻ",
    severity: "block",
  },
  {
    term: "ngu",
    category: "shaming_punishment",
    messageVi: "Từ ngữ xúc phạm trẻ",
    severity: "block",
  },
  {
    term: "kém cỏi",
    category: "shaming_punishment",
    messageVi: "Từ ngữ so sánh, hạ thấp trẻ",
    severity: "block",
  },
  {
    term: "vô dụng",
    category: "shaming_punishment",
    messageVi: "Từ ngữ mang tính nhục mạ",
    severity: "block",
  },
  {
    term: "đồ ngốc",
    category: "shaming_punishment",
    messageVi: "Từ ngữ xúc phạm, giễu cợt",
    severity: "block",
  },
  {
    term: "thua cuộc",
    category: "shaming_punishment",
    messageVi: "Tạo áp lực thắng/thua tiêu cực",
    severity: "block",
  },
  {
    term: "phạt đòn",
    category: "shaming_punishment",
    messageVi: "Hành vi trừng phạt thân thể",
    severity: "block",
  },
  {
    term: "hư đốn",
    category: "shaming_punishment",
    messageVi: "Định kiến nhãn mác tiêu cực",
    severity: "block",
  },
  {
    term: "bị phạt",
    category: "shaming_punishment",
    messageVi: "Từ ngữ trừng phạt",
    severity: "block",
  },

  // 9. Tục tĩu / Chửi thề (Profanity)
  {
    term: "đĩ",
    category: "profanity",
    messageVi: "Từ ngữ thô tục",
    severity: "block",
  },
  {
    term: "đụ",
    category: "profanity",
    messageVi: "Từ ngữ thô tục",
    severity: "block",
  },
  {
    term: "đéo",
    category: "profanity",
    messageVi: "Từ ngữ thô tục",
    severity: "block",
  },
  {
    term: "vãi",
    category: "profanity",
    messageVi: "Từ ngữ lóng thô tục",
    severity: "block",
  },
  {
    term: "chết tiệt",
    category: "profanity",
    messageVi: "Từ ngữ chửi thề",
    severity: "block",
  },
  {
    term: "mẹ kiếp",
    category: "profanity",
    messageVi: "Từ ngữ chửi thề",
    severity: "block",
  },
  {
    term: "khốn nạn",
    category: "profanity",
    messageVi: "Từ ngữ xúc phạm, thô tục",
    severity: "block",
  },

  // 10. Phủ định trong chỉ dẫn trẻ mầm non (BR-GLM-05, BR-CGB-10)
  {
    term: "đừng",
    category: "negative_assertion",
    messageVi: "Chỉ dẫn không được dùng thể phủ định ('đừng') cho trẻ 3-6 tuổi",
    severity: "block",
  },
  {
    term: "chớ",
    category: "negative_assertion",
    messageVi: "Chỉ dẫn không được dùng thể phủ định ('chớ')",
    severity: "block",
  },
  {
    term: "cấm",
    category: "negative_assertion",
    messageVi: "Chỉ dẫn không được dùng thể cấm đoán ('cấm')",
    severity: "block",
  },
  {
    term: "không được",
    category: "negative_assertion",
    messageVi: "Chỉ dẫn không được dùng thể phủ định ('không được')",
    severity: "block",
  },
  {
    term: "không chọn",
    category: "negative_assertion",
    messageVi: "Chỉ dẫn không được dùng thể phủ định ('không chọn')",
    severity: "block",
  },
];
