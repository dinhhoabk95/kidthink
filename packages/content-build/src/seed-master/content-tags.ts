import { contentTags, normalizeMechanicTagCode } from "@mindkid/db";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { CONTENT_THEMES } from "@mindkid/shared";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { TAG_VOCABULARY } from "../vocabulary.js";

export interface TagSeedItem {
  code: string;
  axis: "what" | "thinking" | "mechanic" | "theme";
  label: string;
}

/**
 * Trục `mechanic` phải phủ **mọi** engine đang đăng ký, nếu không thì gieo
 * nội dung của engine mới sẽ chết ở `BR-TAG-01`.
 *
 * Sáu tag viết tay bên dưới có từ thế hệ 6 template đầu; `MECHANIC_TAG_MAP`
 * gộp cơ chế của chúng về đúng sáu mã đó. 21 engine thêm sau (GT-007..GT-027)
 * không nằm trong bản đồ nên `normalizeMechanicTagCode` chỉ đổi `-` thành `_`
 * — và những mã ấy chưa từng có trong từ vựng. Suy thẳng từ `ALL_TEMPLATES`
 * để hai bên Cấm — NEVER lệch nhau lần nữa.
 */
const BUILT_IN_MECHANIC_CODES = new Set([
  "drag_drop",
  "tap_select",
  "sequence_order",
  "matching",
  "tracing",
  "memory_flip",
]);

const MECHANIC_TAGS_FROM_ENGINE: TagSeedItem[] = Object.values(ALL_TEMPLATES)
  .map((template) => ({
    code: normalizeMechanicTagCode(template.mechanic) ?? template.mechanic,
    axis: "mechanic" as const,
    label: template.name,
  }))
  .filter(
    (tag, index, list) =>
      !BUILT_IN_MECHANIC_CODES.has(tag.code) &&
      list.findIndex((other) => other.code === tag.code) === index
  );

/**
 * Mã trong `TAG_VOCABULARY` chưa được liệt kê tay ở `SEED_CONTENT_TAGS`.
 *
 * Nhãn lấy chính mã: chúng là mã kỹ thuật do nội dung sinh ra, người biên tập
 * đặt nhãn đẹp sau. Điều quan trọng là **trục** đúng — sai trục thì
 * `BR-TAG-02` chặn publish, và trước task 162 nó chặn đúng như vậy.
 */
const HAND_LABELLED_CODES = new Set([
  "cnt",
  "cmp",
  "ops",
  "shp",
  "spt",
  "msr",
  "pat",
  "cls",
  "log",
  "mem",
  "voc",
  "lst",
  "flw",
  "fnc",
  "visual",
  "auditory",
  "spatial",
  "analytical",
  "logical",
  "creative",
  "critical",
  "sequential",
  "associative",
  "abstract",
  "practical",
  "reflective",
]);

/**
 * 13 mã nằm trong **cả** `TAG_VOCABULARY.what` lẫn `.thinking`.
 *
 * `content_tags.code` là khoá duy nhất toàn bảng nên một mã chỉ mang được một
 * trục. Trục chốt dưới đây theo **cách corpus dùng thật** (đếm 2026-08-30,
 * 560 hạt); mã không hạt nào dùng thì theo nghĩa của từ.
 */
const AXIS_TIEBREAK: Record<string, "what" | "thinking"> = {
  sequence: "thinking", // 17 lượt thinking · 2 lượt what
  observation: "thinking", // 6 · 1
  comparison: "what", // 10 what · 4 thinking
  order: "what", // 12 · 2
  classification: "what", // 4 · 1
  working_memory: "what", // 2 · 1
  pattern: "what", // 2 · 2 — hoà; `pattern` là chủ đề nội dung
  space: "what", // chưa hạt nào dùng
  deductive: "thinking",
  inductive: "thinking",
  inhibitory: "thinking",
  flexible: "thinking",
  matching: "thinking", // trục `mechanic` giành lại ở bước hợp nhất bên dưới
};

const VOCABULARY_TAIL_TAGS: TagSeedItem[] = (
  ["what", "thinking"] as const
).flatMap((axis) =>
  TAG_VOCABULARY[axis]
    .filter((code: string) => !HAND_LABELLED_CODES.has(code))
    .filter((code: string) => (AXIS_TIEBREAK[code] ?? axis) === axis)
    .map((code: string) => ({ code, axis, label: code }))
);

/**
 * Hợp nhất theo thứ tự ưu tiên: `mechanic` > `theme` > trục đã chốt.
 *
 * Cơ chế chơi là thuộc tính **cấu trúc** do engine quyết định, không phải
 * nhãn biên tập — `matching` vừa là cơ chế `pair-match` vừa nằm trong từ vựng
 * `thinking`, và nếu `thinking` thắng thì 11 level ghép cặp mất trục
 * `mechanic` và trượt `BR-TAG-02`.
 */
const AXIS_PRIORITY: Record<TagSeedItem["axis"], number> = {
  mechanic: 3,
  theme: 2,
  thinking: 1,
  what: 1,
};

function dedupeByAxisPriority(tags: TagSeedItem[]): TagSeedItem[] {
  const byCode = new Map<string, TagSeedItem>();
  for (const tag of tags) {
    const current = byCode.get(tag.code);
    if (!current || AXIS_PRIORITY[tag.axis] > AXIS_PRIORITY[current.axis]) {
      byCode.set(tag.code, tag);
    }
  }
  return [...byCode.values()];
}

const RAW_CONTENT_TAGS: TagSeedItem[] = [
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

  // Mechanic Axis — 6 tag gốc, phần còn lại suy từ registry engine bên dưới
  { code: "drag_drop", axis: "mechanic", label: "Kéo thả" },
  { code: "tap_select", axis: "mechanic", label: "Tap chọn" },
  { code: "sequence_order", axis: "mechanic", label: "Sắp xếp thứ tự" },
  { code: "matching", axis: "mechanic", label: "Nối cặp & Ghép" },
  { code: "tracing", axis: "mechanic", label: "Tô & Vẽ nét" },
  { code: "memory_flip", axis: "mechanic", label: "Lật hình ghi nhớ" },
  ...MECHANIC_TAGS_FROM_ENGINE,

  // Theme Axis (14 canonical themes from @mindkid/shared - BR-CTR-12)
  ...CONTENT_THEMES.map((t) => ({
    code: t.code,
    axis: "theme" as const,
    label: t.label,
  })),

  // Phần đuôi của trục `what` và `thinking`: mọi mã mà cổng 5 công nhận nhưng
  // chưa có nhãn viết tay ở trên. Không có phần này thì DB và cổng lệch nhau.
  ...VOCABULARY_TAIL_TAGS,
];

export const SEED_CONTENT_TAGS: TagSeedItem[] =
  dedupeByAxisPriority(RAW_CONTENT_TAGS);

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
