import {
  GT001_STORY_LINE,
  GT001_THEME_STORIES,
} from "#src/labels/gt001-story-lines.js";
import { GT000_STORY_LINE } from "#src/templates/GT-000/session.js";
import {
  GT002_ALL_STORY_LINES,
  GT002_DEFAULT_STORY_LINE,
  GT002_THEME_STORIES,
} from "#src/templates/GT-002/gt002-story-lines.js";
import { GT003_STORY_LINE } from "#src/templates/GT-003/session.js";
import { GT004_STORY_LINE } from "#src/templates/GT-004/session.js";
import { GT005_STORY_LINE } from "#src/templates/GT-005/session.js";
import { GT006_STORY_LINE } from "#src/templates/GT-006/session.js";
import { GT007_STORY_LINE } from "#src/templates/GT-007/session.js";
import { GT008_STORY_LINE } from "#src/templates/GT-008/session.js";
import { GT009_STORY_LINE } from "#src/templates/GT-009/session.js";
import { GT010_STORY_LINE } from "#src/templates/GT-010/session.js";
import { GT011_STORY_LINE } from "#src/templates/GT-011/session.js";
import { GT012_STORY_LINE } from "#src/templates/GT-012/session.js";
import { GT013_STORY_LINE } from "#src/templates/GT-013/session.js";
import { GT014_STORY_LINE } from "#src/templates/GT-014/template.js";
import { GT015_STORY_LINE } from "#src/templates/GT-015/session.js";
import { GT016_STORY_LINES } from "#src/templates/GT-016/session.js";
import { GT017_STORY_LINES } from "#src/templates/GT-017/session.js";
import { GT018_STORY_LINE } from "#src/templates/GT-018/session.js";
import { GT019_STORY_LINE } from "#src/templates/GT-019/session.js";
import { GT020_STORY_LINE } from "#src/templates/GT-020/session.js";
import { GT021_STORY_LINE } from "#src/templates/GT-021/session.js";
import { GT022_STORY_LINE } from "#src/templates/GT-022/session.js";
import { GT023_STORY_LINE } from "#src/templates/GT-023/session.js";
import { GT024_STORY_LINE } from "#src/templates/GT-024/session.js";
import { GT025_STORY_LINE } from "#src/templates/GT-025/session.js";
import { GT026_STORY_LINE } from "#src/templates/GT-026/session.js";
import { GT027_STORY_LINE } from "#src/templates/GT-027/session.js";
import { GT028_STORY_LINE } from "#src/templates/GT-028/session.js";
import { GT029_STORY_LINE } from "#src/templates/GT-029/session.js";
import { GT030_STORY_LINE } from "#src/templates/GT-030/session.js";
import { GT031_STORY_LINE } from "#src/templates/GT-031/session.js";
import {
  GT032_STORY_LINE_PICK,
  GT032_STORY_LINE_POUR,
} from "#src/templates/GT-032/session.js";
import { GT033_STORY_LINE } from "#src/templates/GT-033/session.js";
import { GT034_STORY_LINE } from "#src/templates/GT-034/session.js";
import { GT035_STORY_LINE } from "#src/templates/GT-035/session.js";
import { GT036_STORY_LINE } from "#src/templates/GT-036/session.js";
import { GT037_STORY_LINE } from "#src/templates/GT-037/session.js";

/**
 * Nguồn duy nhất liệt kê mọi câu khung chuyện (`storyLine()`) của 38 engine.
 * Catalog giọng (`BR-PNR-05`) và cổng `story-voice-coverage` đều duyệt bảng này.
 * `hook_line` do nội dung scene GT-000 cấp nằm ngoài bảng (đã đi theo catalog nội dung).
 */
export const ENGINE_STORY_LINES: readonly string[] = Array.from(
  new Set<string>([
    GT000_STORY_LINE,
    GT001_STORY_LINE,
    ...Object.values(GT001_THEME_STORIES),
    GT002_DEFAULT_STORY_LINE,
    ...Object.values(GT002_THEME_STORIES),
    ...GT002_ALL_STORY_LINES,
    ...Object.values(GT014_STORY_LINE),
    ...Object.values(GT016_STORY_LINES),
    ...Object.values(GT017_STORY_LINES),
    GT032_STORY_LINE_PICK,
    GT032_STORY_LINE_POUR,
    GT003_STORY_LINE,
    GT004_STORY_LINE,
    GT005_STORY_LINE,
    GT006_STORY_LINE,
    GT007_STORY_LINE,
    GT008_STORY_LINE,
    GT009_STORY_LINE,
    GT010_STORY_LINE,
    GT011_STORY_LINE,
    GT012_STORY_LINE,
    GT013_STORY_LINE,
    GT015_STORY_LINE,
    GT018_STORY_LINE,
    GT019_STORY_LINE,
    GT020_STORY_LINE,
    GT021_STORY_LINE,
    GT022_STORY_LINE,
    GT023_STORY_LINE,
    GT024_STORY_LINE,
    GT025_STORY_LINE,
    GT026_STORY_LINE,
    GT027_STORY_LINE,
    GT028_STORY_LINE,
    GT029_STORY_LINE,
    GT030_STORY_LINE,
    GT031_STORY_LINE,
    GT033_STORY_LINE,
    GT034_STORY_LINE,
    GT035_STORY_LINE,
    GT036_STORY_LINE,
    GT037_STORY_LINE,
  ])
);
