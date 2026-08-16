export interface FieldDictionaryEntry {
  label: string;
  help?: string;
  placeholder?: string;
}

export const CONFIG_DICTIONARY: Record<string, FieldDictionaryEntry> = {
  // Common / Top-level
  prompt: {
    label: "Câu hỏi / lời nhắc cho bé",
    help: "Ngắn gọn, dưới 12 từ, đọc thành tiếng được.",
  },
  prompt_audio_ref: {
    label: "Âm thanh đọc câu hỏi",
    help: "File ghi âm đọc câu hỏi tiếng Việt cho bé.",
  },
  title: {
    label: "Tiêu đề bài học",
    help: "Tiêu đề ngắn gọn hiển thị trong danh mục.",
  },
  instruction: {
    label: "Hướng dẫn thực hiện",
    help: "Chỉ dẫn thao tác cho bé hoặc người lớn.",
  },
  access_tier: {
    label: "Gói quyền truy cập",
    help: "Bậc quyền tối thiểu để chơi level này (free/login/standard/premium).",
  },
  theme_id: {
    label: "Chủ đề giao diện",
    help: "Bộ hình nền và chủ đề thẩm mỹ của màn chơi.",
  },

  // Item / Asset / Options
  item_id: {
    label: "Mã định danh vật phẩm",
    help: "Mã định danh duy nhất của vật phẩm trong bài học.",
  },
  target_item: {
    label: "Vật phẩm mục tiêu",
    help: "Vật phẩm mẫu mà bé cần tìm hoặc so khớp.",
  },
  asset: {
    label: "Tài nguyên hiển thị",
    help: "Emoji hoặc hình ảnh minh họa cho vật phẩm.",
  },
  options: {
    label: "Danh sách lựa chọn",
    help: "Các phương án hiển thị để bé chọn.",
  },
  items: {
    label: "Danh sách vật phẩm",
    help: "Các đối tượng tương tác trong màn chơi.",
  },
  is_correct: {
    label: "Đáp án đúng",
    help: "Bật nếu đây là lựa chọn chính xác.",
  },
  target_criterion: {
    label: "Tiêu chí chọn mục tiêu",
    help: "Đặc điểm hoặc thuộc tính cần bé nhận diện.",
  },
  container: {
    label: "Vùng chứa / Đích đến",
    help: "Khu vực thả vật phẩm vào.",
  },
  container_id: {
    label: "Mã vùng chứa",
    help: "Mã định danh vùng chứa đích.",
  },
  accepts_attribute: {
    label: "Thuộc tính chấp nhận",
    help: "Thuộc tính hợp lệ để thả vào vùng chứa này.",
  },
  attribute: {
    label: "Thuộc tính vật phẩm",
    help: "Thuộc tính phân loại của vật phẩm (màu sắc, hình dạng, loại).",
  },
  groups: {
    label: "Danh sách nhóm",
    help: "Các nhóm phân loại đối tượng.",
  },
  group_id: {
    label: "Mã nhóm",
    help: "Mã định danh nhóm (ví dụ g1, g2).",
  },
  label: {
    label: "Nhãn hiển thị",
    help: "Tên nhãn ngắn gọn của nhóm hoặc bước.",
  },
  label_emoji: {
    label: "Emoji đại diện cho nhóm",
    help: "Biểu tượng emoji đại diện cho nhãn nhóm.",
  },
  correct_group_id: {
    label: "Nhóm đích đúng",
    help: "Mã nhóm mà vật phẩm này thuộc về.",
  },
  pairs: {
    label: "Danh sách các cặp ghép",
    help: "Các cặp đối tượng tương ứng cần nối với nhau.",
  },
  pair_id: {
    label: "Mã cặp ghép",
    help: "Mã định danh của cặp đối tượng.",
  },
  left: {
    label: "Đối tượng bên trái",
    help: "Vật phẩm phía nguồn / bên trái.",
  },
  right: {
    label: "Đối tượng bên phải",
    help: "Vật phẩm phía đích / bên phải.",
  },
  sequence: {
    label: "Chuỗi thứ tự",
    help: "Các bước cần sắp xếp theo đúng trình tự.",
  },
  step_id: {
    label: "Mã bước",
    help: "Mã định danh bước trong chuỗi.",
  },
  order_index: {
    label: "Thứ tự chính xác",
    help: "Vị trí số thứ tự bắt đầu từ 0.",
  },

  // Difficulty parameters
  distractor_count: {
    label: "Số vật gây nhiễu",
    help: "Số lượng vật phẩm không đúng đưa vào để tăng độ khó (0 là dễ nhất).",
  },
  target_count: {
    label: "Số lượng mục tiêu",
    help: "Số lượng đáp án đúng bé cần tìm.",
  },
  hint_after_ms: {
    label: "Thời gian gợi ý (mili-giây)",
    help: "Thời gian chờ trước khi kích hoạt gợi ý tự động.",
  },
  allow_retry: {
    label: "Cho phép thử lại",
    help: "Bé được chọn lại khi trả lời chưa đúng mà không bị phạt.",
  },
  shuffle_items: {
    label: "Xáo trộn vị trí vật phẩm",
    help: "Tự động đảo thứ tự hiển thị mỗi lượt chơi.",
  },
  shuffle_sides: {
    label: "Xáo trộn hai cột",
    help: "Đảo ngẫu nhiên vị trí các thẻ ở hai bên.",
  },
  shuffle_initial: {
    label: "Xáo trộn vị trí ban đầu",
    help: "Đảo lộn thứ tự ban đầu để bé sắp xếp lại.",
  },
};

/**
 * D-JT: Allowlist for fields falling into 'text' without ending in '_vi'.
 * Every entry must have a clear documented rationale.
 */
export const TEXT_FALLBACK_ALLOWLIST: Record<string, string> = {
  prompt: "Câu hỏi chính của bài học, dạng văn bản ngắn đọc cho bé.",
  item_id: "Mã định danh kỹ thuật của vật phẩm trong content pack.",
  container_id: "Mã định danh vùng chứa / đích đến.",
  group_id: "Mã định danh nhóm phân loại (g0, g1...).",
  pair_id: "Mã định danh cặp liên kết ghép đôi.",
  step_id: "Mã định danh bước trong chuỗi thứ tự.",
  label: "Nhãn chữ hiển thị cho nhóm hoặc bước.",
  target_criterion: "Tiêu chí mô tả thuộc tính mục tiêu cần chọn.",
  accepts_attribute: "Tên thuộc tính mà container chấp nhận.",
  attribute: "Tên thuộc tính của vật phẩm dùng để phân loại.",
  correct_group_id: "Mã nhóm đúng mà item thuộc về.",
  order_index: "Chỉ số thứ tự số nguyên.",
  title: "Tiêu đề bài học ngắn gọn.",
  instruction: "Hướng dẫn thực hiện bài học.",
  theme_id: "Mã chủ đề giao diện.",
};

export function getFieldDictionaryEntry(
  fieldName: string
): FieldDictionaryEntry | undefined {
  return CONFIG_DICTIONARY[fieldName];
}
