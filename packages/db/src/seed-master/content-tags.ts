import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { contentTags } from "../schema/tagging.js";

export interface TagSeedItem {
  code: string;
  axis: "what" | "thinking" | "mechanic" | "theme";
  labelVi: string;
}

export const SEED_CONTENT_TAGS: TagSeedItem[] = [
  // What Axis (14 tags)
  { code: "cnt", axis: "what", labelVi: "Đếm & Nhận biết số" },
  { code: "cmp", axis: "what", labelVi: "So sánh & Thứ tự" },
  { code: "ops", axis: "what", labelVi: "Phép tính cơ bản" },
  { code: "shp", axis: "what", labelVi: "Hình học phẳng & Khối" },
  { code: "spt", axis: "what", labelVi: "Không gian & Vị trí" },
  { code: "msr", axis: "what", labelVi: "Đo lường & Kích thước" },
  { code: "pat", axis: "what", labelVi: "Quy luật & Dãy số" },
  { code: "cls", axis: "what", labelVi: "Phân loại & Nhóm" },
  { code: "log", axis: "what", labelVi: "Suy luận & Logic" },
  { code: "mem", axis: "what", labelVi: "Ghi nhớ & Nhận dạng" },
  { code: "voc", axis: "what", labelVi: "Từ vựng & Khái niệm" },
  { code: "lst", axis: "what", labelVi: "Nghe & Làm theo" },
  { code: "flw", axis: "what", labelVi: "Luồng & Thứ tự các bước" },
  { code: "fnc", axis: "what", labelVi: "Kiểm soát vi tế & Điều hành" },

  // Thinking Axis (12 tags)
  { code: "visual", axis: "thinking", labelVi: "Thị giác" },
  { code: "auditory", axis: "thinking", labelVi: "Thính giác" },
  { code: "spatial", axis: "thinking", labelVi: "Không gian" },
  { code: "analytical", axis: "thinking", labelVi: "Phân tích" },
  { code: "abstract", axis: "thinking", labelVi: "Trừu tượng" },
  { code: "deductive", axis: "thinking", labelVi: "Diễn dịch" },
  { code: "inductive", axis: "thinking", labelVi: "Quy nạp" },
  { code: "sequential", axis: "thinking", labelVi: "Tuần tự" },
  { code: "associative", axis: "thinking", labelVi: "Liên tưởng" },
  { code: "critical", axis: "thinking", labelVi: "Phản biện" },
  { code: "flexible", axis: "thinking", labelVi: "Linh hoạt" },
  { code: "inhibitory", axis: "thinking", labelVi: "Ức chế & Tập trung" },

  // Mechanic Axis (6 tags)
  { code: "drag_drop", axis: "mechanic", labelVi: "Kéo thả" },
  { code: "tap_select", axis: "mechanic", labelVi: "Tap chọn" },
  { code: "sequence_order", axis: "mechanic", labelVi: "Sắp xếp thứ tự" },
  { code: "matching", axis: "mechanic", labelVi: "Nối cặp & Ghép" },
  { code: "tracing", axis: "mechanic", labelVi: "Tô & Vẽ nét" },
  { code: "memory_flip", axis: "mechanic", labelVi: "Lật hình ghi nhớ" },

  // Theme Axis (12 tags)
  { code: "farm", axis: "theme", labelVi: "Nông trại" },
  { code: "jungle", axis: "theme", labelVi: "Rừng xanh" },
  { code: "ocean", axis: "theme", labelVi: "Đại dương" },
  { code: "space", axis: "theme", labelVi: "Vũ trụ" },
  { code: "school", axis: "theme", labelVi: "Trường học" },
  { code: "home", axis: "theme", labelVi: "Gia đình & Nhà bếp" },
  { code: "park", axis: "theme", labelVi: "Công viên & Sân chơi" },
  { code: "vehicles", axis: "theme", labelVi: "Phương tiện giao thông" },
  { code: "food", axis: "theme", labelVi: "Món ăn & Hoa quả" },
  { code: "dino", axis: "theme", labelVi: "Khủng long" },
  { code: "fairytale", axis: "theme", labelVi: "Cổ tích & Phép thuật" },
  { code: "seasons", axis: "theme", labelVi: "Thời tiết & Bốn mùa" },
];

export async function seedContentTags(
  db: NodePgDatabase<Record<string, unknown>>
) {
  for (const tag of SEED_CONTENT_TAGS) {
    await db
      .insert(contentTags)
      .values({
        code: tag.code,
        axis: tag.axis,
        labelVi: tag.labelVi,
        status: "active",
      })
      .onConflictDoUpdate({
        target: contentTags.code,
        set: {
          axis: tag.axis,
          labelVi: tag.labelVi,
          status: "active",
        },
      });
  }
}
