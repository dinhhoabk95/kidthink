import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { contentTags } from "../schema/tagging.js";

export interface TagSeedItem {
  code: string;
  axis: "what" | "thinking" | "mechanic" | "theme";
  label: string;
}

export const SEED_CONTENT_TAGS: TagSeedItem[] = [
  // What Axis (14 tags)
  { code: "cnt", axis: "what", label: "Đếm & Nhận biết số" },
  { code: "cmp", axis: "what", label: "So sánh & Thứ tự" },
  { code: "ops", axis: "what", label: "Phép tính cơ bản" },
  { code: "shp", axis: "what", label: "Hình học phẳng & Khối" },
  { code: "spt", axis: "what", label: "Không gian & Vị trí" },
  { code: "msr", axis: "what", label: "Đo lường & Kích thước" },
  { code: "pat", axis: "what", label: "Quy luật & Dãy số" },
  { code: "cls", axis: "what", label: "Phân loại & Nhóm" },
  { code: "log", axis: "what", label: "Suy luận & Logic" },
  { code: "mem", axis: "what", label: "Ghi nhớ & Nhận dạng" },
  { code: "voc", axis: "what", label: "Từ vựng & Khái niệm" },
  { code: "lst", axis: "what", label: "Nghe & Làm theo" },
  { code: "flw", axis: "what", label: "Luồng & Thứ tự các bước" },
  { code: "fnc", axis: "what", label: "Kiểm soát vi tế & Điều hành" },

  // Thinking Axis (12 tags)
  { code: "visual", axis: "thinking", label: "Thị giác" },
  { code: "auditory", axis: "thinking", label: "Thính giác" },
  { code: "spatial", axis: "thinking", label: "Không gian" },
  { code: "analytical", axis: "thinking", label: "Phân tích" },
  { code: "abstract", axis: "thinking", label: "Trừu tượng" },
  { code: "deductive", axis: "thinking", label: "Diễn dịch" },
  { code: "inductive", axis: "thinking", label: "Quy nạp" },
  { code: "sequential", axis: "thinking", label: "Tuần tự" },
  { code: "associative", axis: "thinking", label: "Liên tưởng" },
  { code: "critical", axis: "thinking", label: "Phản biện" },
  { code: "flexible", axis: "thinking", label: "Linh hoạt" },
  { code: "inhibitory", axis: "thinking", label: "Ức chế & Tập trung" },

  // Mechanic Axis (6 tags)
  { code: "drag_drop", axis: "mechanic", label: "Kéo thả" },
  { code: "tap_select", axis: "mechanic", label: "Tap chọn" },
  { code: "sequence_order", axis: "mechanic", label: "Sắp xếp thứ tự" },
  { code: "matching", axis: "mechanic", label: "Nối cặp & Ghép" },
  { code: "tracing", axis: "mechanic", label: "Tô & Vẽ nét" },
  { code: "memory_flip", axis: "mechanic", label: "Lật hình ghi nhớ" },

  // Theme Axis (12 tags)
  { code: "farm", axis: "theme", label: "Nông trại" },
  { code: "jungle", axis: "theme", label: "Rừng xanh" },
  { code: "ocean", axis: "theme", label: "Đại dương" },
  { code: "space", axis: "theme", label: "Vũ trụ" },
  { code: "school", axis: "theme", label: "Trường học" },
  { code: "home", axis: "theme", label: "Gia đình & Nhà bếp" },
  { code: "park", axis: "theme", label: "Công viên & Sân chơi" },
  { code: "vehicles", axis: "theme", label: "Phương tiện giao thông" },
  { code: "food", axis: "theme", label: "Món ăn & Hoa quả" },
  { code: "dino", axis: "theme", label: "Khủng long" },
  { code: "fairytale", axis: "theme", label: "Cổ tích & Phép thuật" },
  { code: "seasons", axis: "theme", label: "Thời tiết & Bốn mùa" },
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
        label: tag.label,
        status: "active",
      })
      .onConflictDoUpdate({
        target: contentTags.code,
        set: {
          axis: tag.axis,
          label: tag.label,
          status: "active",
        },
      });
  }
}
