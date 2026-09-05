import type { AgeBand } from "@mindkid/game-engine/contracts";
import { getThemeVocabulary } from "./themes.js";

export interface EnginePhrases {
  readonly title_template: string;
  readonly instruction_by_band: Readonly<Record<AgeBand, string>>;
}

export const ENGINE_PHRASES: Readonly<Record<string, EnginePhrases>> = {
  "GT-000": {
    title_template: "Làm quen với {noun}",
    instruction_by_band: {
      "3-4": "Bé chạm vào {noun} để khám phá nhé!",
      "4-5": "Bé quan sát {noun} và làm quen nhé!",
      "5-6": "Bé tìm hiểu đặc điểm của {noun} nhé!",
    },
  },
  "GT-001": {
    title_template: "Tìm {noun} giống mẫu",
    instruction_by_band: {
      "3-4": "Bé chạm vào {noun} giống mẫu nhé!",
      "4-5": "Bé tìm {noun} giống hình mẫu nhé!",
      "5-6": "Bé quan sát và chọn {noun} giống mẫu nhé!",
    },
  },
  "GT-002": {
    title_template: "Đếm số lượng {noun}",
    instruction_by_band: {
      "3-4": "Bé đếm xem có mấy {noun} nhé!",
      "4-5": "Bé đếm số {noun} rồi chọn số đúng!",
      "5-6": "Bé đếm số lượng {noun} và chọn số đúng!",
    },
  },
  "GT-003": {
    title_template: "So sánh nhóm {noun}",
    instruction_by_band: {
      "3-4": "Bé chọn nhóm nhiều {noun} hơn nhé!",
      "4-5": "Bé chọn nhóm có nhiều {noun} hơn nhé!",
      "5-6": "Bé so sánh số lượng {noun} giữa các nhóm!",
    },
  },
  "GT-004": {
    title_template: "Ghép đôi {noun} tương ứng",
    instruction_by_band: {
      "3-4": "Bé nối {noun} với bạn tương ứng nhé!",
      "4-5": "Bé ghép đôi các {noun} tương ứng nhé!",
      "5-6": "Bé ghép các cặp {noun} tương ứng với nhau!",
    },
  },
  "GT-005": {
    title_template: "Xếp {noun} theo quy luật",
    instruction_by_band: {
      "3-4": "Bé chọn {noun} tiếp theo theo quy luật!",
      "4-5": "Bé tìm {noun} còn thiếu trong dãy quy luật!",
      "5-6": "Bé quan sát quy luật và điền {noun} thích hợp!",
    },
  },
  "GT-006": {
    title_template: "Phân loại {noun} theo nhóm",
    instruction_by_band: {
      "3-4": "Bé xếp {noun} vào đúng nhóm nhé!",
      "4-5": "Bé phân loại {noun} vào đúng nhóm nhé!",
      "5-6": "Bé phân loại {noun} theo đặc điểm phù hợp!",
    },
  },
  "GT-007": {
    title_template: "Tìm bóng của {noun}",
    instruction_by_band: {
      "3-4": "Bé tìm bóng của {noun} nhé!",
      "4-5": "Bé tìm chiếc bóng đúng của {noun} nhé!",
      "5-6": "Bé quan sát và chọn bóng đúng của {noun}!",
    },
  },
  "GT-008": {
    title_template: "Kéo {noun} vào đúng ô",
    instruction_by_band: {
      "3-4": "Bé kéo {noun} vào đúng ô nhé!",
      "4-5": "Bé kéo {noun} vào vị trí tương ứng nhé!",
      "5-6": "Bé kéo thả từng {noun} vào đúng ô nhé!",
    },
  },
  "GT-009": {
    title_template: "Xếp {noun} theo kích thước",
    instruction_by_band: {
      "3-4": "Bé xếp {noun} từ bé đến lớn nhé!",
      "4-5": "Bé sắp xếp {noun} theo kích thước nhé!",
      "5-6": "Bé sắp xếp các {noun} từ nhỏ đến lớn!",
    },
  },
  "GT-010": {
    title_template: "Ghép hình {noun} hoàn chỉnh",
    instruction_by_band: {
      "3-4": "Bé ghép mảnh thành hình {noun} nhé!",
      "4-5": "Bé ghép các mảnh thành hình {noun} nhé!",
      "5-6": "Bé ghép các mảnh thành tranh {noun} hoàn chỉnh!",
    },
  },
  "GT-011": {
    title_template: "Nối điểm vẽ hình {noun}",
    instruction_by_band: {
      "3-4": "Bé nối điểm vẽ hình {noun} nhé!",
      "4-5": "Bé nối các chấm tròn theo thứ tự số!",
      "5-6": "Bé nối các điểm theo thứ tự để hoàn thành!",
    },
  },
  "GT-012": {
    title_template: "Tìm cặp thẻ {noun} giống nhau",
    instruction_by_band: {
      "3-4": "Bé lật mở cặp {noun} giống nhau nhé!",
      "4-5": "Bé tìm cặp thẻ {noun} giống nhau nhé!",
      "5-6": "Bé lật mở các cặp thẻ {noun} trùng khớp!",
    },
  },
  "GT-013": {
    title_template: "Dẫn đường qua mê cung",
    instruction_by_band: {
      "3-4": "Bé vẽ đường vượt qua mê cung nhé!",
      "4-5": "Bé vẽ đường đi an toàn qua mê cung!",
      "5-6": "Bé chọn hướng đi vượt qua mê cung tới đích!",
    },
  },
  "GT-014": {
    title_template: "Tìm điểm khác biệt của {noun}",
    instruction_by_band: {
      "3-4": "Bé chạm điểm khác nhau giữa hai hình!",
      "4-5": "Bé tìm điểm khác biệt giữa hai bức tranh!",
      "5-6": "Bé quan sát kỹ và chỉ ra điểm khác biệt!",
    },
  },
  "GT-015": {
    title_template: "Tìm {noun} đang ẩn nấp",
    instruction_by_band: {
      "3-4": "Bé tìm {noun} đang trốn trong tranh nhé!",
      "4-5": "Bé tìm bạn {noun} đang trốn trong hình!",
      "5-6": "Bé tinh mắt tìm đủ {noun} giấu trong tranh!",
    },
  },
  "GT-016": {
    title_template: "Cân thăng bằng với {noun}",
    instruction_by_band: {
      "3-4": "Bé đặt {noun} để cân thăng bằng nhé!",
      "4-5": "Bé thêm {noun} để hai đĩa cân bằng nhau!",
      "5-6": "Bé tính toán để hai đĩa cân bằng nhau nhé!",
    },
  },
  "GT-017": {
    title_template: "Đếm khối hình không gian",
    instruction_by_band: {
      "3-4": "Bé đếm xem có bao nhiêu khối nhé!",
      "4-5": "Bé đếm số khối lập phương trong hình nhé!",
      "5-6": "Bé quan sát phối cảnh đếm đúng số khối nhé!",
    },
  },
  "GT-018": {
    title_template: "Tách và gộp số lượng {noun}",
    instruction_by_band: {
      "3-4": "Bé tách các bạn {noun} vào hai nhóm!",
      "4-5": "Bé tách gộp số lượng {noun} chính xác nhé!",
      "5-6": "Bé hoàn thành sơ đồ tách gộp số {noun}!",
    },
  },
  "GT-019": {
    title_template: "Xếp {noun} vào khung mười ô",
    instruction_by_band: {
      "3-4": "Bé đặt {noun} vào khung mười ô nhé!",
      "4-5": "Bé đặt đủ số lượng {noun} vào khung mười!",
      "5-6": "Bé điền {noun} vào khung mười biểu diễn số!",
    },
  },
  "GT-020": {
    title_template: "Bảng lưới logic với {noun}",
    instruction_by_band: {
      "3-4": "Bé xếp {noun} vào ô phù hợp nhé!",
      "4-5": "Bé điền {noun} vào ô giao nhau tương ứng!",
      "5-6": "Bé quan sát hai trục đặt {noun} vào ô đúng!",
    },
  },
  "GT-021": {
    title_template: "Ghép hình Tangram",
    instruction_by_band: {
      "3-4": "Bé ghép miếng gỗ thành hình mẫu nhé!",
      "4-5": "Bé xoay ghép mảnh tangram thành hình nhé!",
      "5-6": "Bé ghép các mảnh tangram tạo thành hình mẫu!",
    },
  },
  "GT-022": {
    title_template: "Gấp đối xứng hình {noun}",
    instruction_by_band: {
      "3-4": "Bé tìm nửa đối xứng của {noun} nhé!",
      "4-5": "Bé chọn nửa hình đối xứng qua trục nhé!",
      "5-6": "Bé chọn phần đối xứng hoàn chỉnh của hình!",
    },
  },
  "GT-023": {
    title_template: "Ma trận quy luật logic",
    instruction_by_band: {
      "3-4": "Bé chọn hình còn thiếu trong bảng nhé!",
      "4-5": "Bé tìm hình đúng điền vào ma trận logic!",
      "5-6": "Bé phân tích quy luật và chọn hình đúng!",
    },
  },
  "GT-024": {
    title_template: "Vẽ theo nét đường viền",
    instruction_by_band: {
      "3-4": "Bé vẽ theo nét đứt tạo hình nhé!",
      "4-5": "Bé rê tay nối các điểm tạo hình nhé!",
      "5-6": "Bé vẽ theo đường nét hoàn thành bức tranh!",
    },
  },
  "GT-025": {
    title_template: "Xếp que tính thành hình",
    instruction_by_band: {
      "3-4": "Bé xếp que tính thành hình mẫu nhé!",
      "4-5": "Bé di chuyển que tính tạo thành hình mới!",
      "5-6": "Bé sắp xếp que tính giải câu đố hình học!",
    },
  },
  "GT-026": {
    title_template: "Phép cộng trực quan với {noun}",
    instruction_by_band: {
      "3-4": "Bé gộp lại xem có mấy {noun} nhé!",
      "4-5": "Bé tính tổng số {noun} của hai nhóm nhé!",
      "5-6": "Bé làm phép cộng và chọn kết quả đúng nhé!",
    },
  },
  "GT-027": {
    title_template: "Phép trừ trực quan với {noun}",
    instruction_by_band: {
      "3-4": "Bé bớt đi xem còn mấy {noun} nhé!",
      "4-5": "Bé tính số {noun} còn lại sau khi bớt!",
      "5-6": "Bé làm phép trừ và chọn kết quả đúng nhé!",
    },
  },
  "GT-028": {
    title_template: "Đo chiều dài của {noun}",
    instruction_by_band: {
      "3-4": "Bé đo xem {noun} dài mấy ô nhé!",
      "4-5": "Bé dùng thước đo chiều dài của {noun} nhé!",
      "5-6": "Bé đo và so sánh chiều dài các vật thể!",
    },
  },
  "GT-029": {
    title_template: "Xem giờ trên đồng hồ",
    instruction_by_band: {
      "3-4": "Bé chỉ đồng hồ chỉ đúng giờ nhé!",
      "4-5": "Bé xem đồng hồ và chọn giờ đúng nhé!",
      "5-6": "Bé quan sát kim giờ phút đọc thời gian nhé!",
    },
  },
  "GT-030": {
    title_template: "Đếm tiền xu mua {noun}",
    instruction_by_band: {
      "3-4": "Bé đếm tiền xu mua {noun} nhé!",
      "4-5": "Bé gom đủ số tiền xu theo giá tiền nhé!",
      "5-6": "Bé tính tổng mệnh giá các đồng xu cho đúng!",
    },
  },
  "GT-031": {
    title_template: "Biểu đồ tranh {noun}",
    instruction_by_band: {
      "3-4": "Bé xem biểu đồ đếm số {noun} nhé!",
      "4-5": "Bé đọc biểu đồ tranh trả lời câu hỏi nhé!",
      "5-6": "Bé phân tích biểu đồ tranh để chọn đáp án!",
    },
  },
  "GT-032": {
    title_template: "Biểu đồ Venn phân loại {noun}",
    instruction_by_band: {
      "3-4": "Bé đặt {noun} vào đúng vòng tròn nhé!",
      "4-5": "Bé xếp {noun} vào vùng biểu đồ Venn đúng!",
      "5-6": "Bé phân loại vào phần giao của biểu đồ Venn!",
    },
  },
  "GT-033": {
    title_template: "Lập trình chuỗi lệnh di chuyển",
    instruction_by_band: {
      "3-4": "Bé chọn mũi tên chỉ đường cho bạn nhé!",
      "4-5": "Bé sắp xếp chuỗi lệnh giúp bạn tới đích!",
      "5-6": "Bé lập trình chuỗi hành động vượt chướng ngại!",
    },
  },
  "GT-034": {
    title_template: "Bánh xe phân số hình tròn",
    instruction_by_band: {
      "3-4": "Bé ghép miếng bánh thành hình tròn nhé!",
      "4-5": "Bé chọn phần bánh xe phân số tương ứng nhé!",
      "5-6": "Bé nhận biết và so sánh phân số trực quan!",
    },
  },
  "GT-035": {
    title_template: "Bàn tính Soroban gạt hạt",
    instruction_by_band: {
      "3-4": "Bé gạt hạt bàn tính theo số lượng nhé!",
      "4-5": "Bé gạt hạt bàn tính Soroban biểu diễn số!",
      "5-6": "Bé thực hiện tính toán trên bàn tính Soroban!",
    },
  },
  "GT-036": {
    title_template: "Gấp giấy Origami từng bước",
    instruction_by_band: {
      "3-4": "Bé gấp giấy theo các nét chỉ dẫn nhé!",
      "4-5": "Bé làm theo từng bước gấp giấy Origami nhé!",
      "5-6": "Bé gấp giấy tạo hình đồ vật xinh xắn nhé!",
    },
  },
};

export function resolveEnginePhrases(
  engineCode: string,
  themeCode: string,
  ageBand: AgeBand,
  nounOverride?: string
): { title: string; instruction: string } {
  const phrases = ENGINE_PHRASES[engineCode];
  if (!phrases) {
    throw new Error(`Engine ${engineCode} không có khai báo ENGINE_PHRASES`);
  }

  let noun = nounOverride;
  if (!noun) {
    const vocab = getThemeVocabulary(themeCode);
    noun = vocab.nouns[0]?.label_vi || "đồ vật";
  }

  const title = phrases.title_template.replace(/\{noun\}/g, noun);
  const rawInstruction = phrases.instruction_by_band[ageBand];
  const instruction = rawInstruction.replace(/\{noun\}/g, noun);

  return { title, instruction };
}
