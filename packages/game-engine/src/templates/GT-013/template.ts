import { z } from "zod";
import { promptFields } from "#src/contracts/shared-fields";
import type { AgeBand } from "#src/contracts/types";
import { defineTemplate } from "#src/contracts/types";
import { findRouteThrough, type MazeCell } from "#src/systems/maze-system";

/** Lưới tối đa 7×7 nên chỉ số ô chạy từ 0 tới 6. */
const cellSchema = () =>
  z.object({
    row: z.number().int().min(0).max(6),
    col: z.number().int().min(0).max(6),
  });

/** Số cạnh trong của lưới 7×7 — không lưới nào cần nhiều tường hơn thế. */
const MAX_WALLS = 84;

export const GT013BaseSchema = z.object({
  ...promptFields(),
  grid: z.object({
    rows: z.number().int().min(3).max(7),
    cols: z.number().int().min(3).max(7),
    walls: z
      .array(
        z.object({
          row: z.number().int().min(0).max(6),
          col: z.number().int().min(0).max(6),
          side: z.enum(["n", "e", "s", "w"]),
        })
      )
      .max(MAX_WALLS),
    start: cellSchema(),
    goal: cellSchema(),
  }),
  required_cells: z.array(cellSchema()).min(0).max(2),
  /**
   * Câu hỏi mở số 7 của spec khuôn đóng bằng `D-RY`: giữ **cả hai** dạng đầu vào và
   * khai chúng trong `content_pack`. Nguồn workbook 09 có cả hai, và ép một dạng
   * làm mất một nửa dạng bài.
   */
  input_mode: z.enum(["draw", "arrows"]),
});

type GT013Shape = z.infer<typeof GT013BaseSchema>;

function isInside(grid: GT013Shape["grid"], cell: MazeCell): boolean {
  return (
    cell.row >= 0 &&
    cell.row < grid.rows &&
    cell.col >= 0 &&
    cell.col < grid.cols
  );
}

function everyCellInsideGrid(content: GT013Shape): boolean {
  const { grid } = content;
  return (
    isInside(grid, grid.start) &&
    isInside(grid, grid.goal) &&
    grid.walls.every((wall) => isInside(grid, wall)) &&
    content.required_cells.every((cell) => isInside(grid, cell))
  );
}

export const GT013ContentSchema = GT013BaseSchema.refine(everyCellInsideGrid, {
  message: "Ô đầu, ô đích, tường và ô bắt buộc đều phải nằm trong lưới.",
  path: ["grid"],
})
  .refine(
    (content) =>
      !(
        content.grid.start.row === content.grid.goal.row &&
        content.grid.start.col === content.grid.goal.col
      ),
    {
      message:
        "Ô đầu và ô đích phải khác nhau, nếu không thì không có đường nào để tìm.",
      path: ["grid", "goal"],
    }
  )
  .refine(
    (content) =>
      findRouteThrough(content.grid, content.required_cells) !== null,
    {
      message:
        "Phải tồn tại ít nhất một đường hợp lệ từ ô đầu tới ô đích đi qua đủ mọi ô bắt buộc.",
      path: ["grid", "walls"],
    }
  );

export const GT013DifficultySchema = z.object({
  dead_end_count: z.number().int().min(0).max(6),
  required_cell_count: z.number().int().min(0).max(2),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT013Content = z.infer<typeof GT013ContentSchema>;
export type GT013Difficulty = z.infer<typeof GT013DifficultySchema>;

/**
 * Mặc định theo band (`D-RY`): band 4-5 vẽ một cử chỉ liên tục, band 5-6 bấm mũi
 * tên — lập kế hoạch trước khi chạy, đúng phần `C6.PLN` mà workbook 09 nhắm tới.
 * Đây là **mặc định của người soạn nội dung**, không phải khoá cứng: `content_pack`
 * vẫn khai giá trị cuối cùng.
 */
export function defaultInputModeForBand(band: AgeBand): "draw" | "arrows" {
  return band === "5-6" ? "arrows" : "draw";
}

export default defineTemplate({
  code: "GT-013",
  name: "Tìm đường mê cung",
  mechanic: "maze-route",
  layouts: ["grid"],
  content_contract: GT013ContentSchema,
  difficulty_contract: GT013DifficultySchema,
  limits: {
    item_count: [1, 1],
    distractor_count: [0, 6],
    target_count: [1, 1],
  },
  age_min: 4,
  age_max: 6,
  requires_tap_fallback: true,
  /**
   * Lưới, tường và nét vẽ đều vẽ bằng canvas trong Session class (`D-RL`), nên
   * `content_pack` không mang emoji hay ảnh nào. Asset duy nhất nó mang là
   * `prompt_audio_ref`.
   */
  asset_kinds: ["audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: [
    "game_started",
    "path_step",
    "path_blocked",
    "path_submitted",
    "game_completed",
  ],
  engine_session: "MazeRouteSession",
  status: "published",
  version: 1,
});
