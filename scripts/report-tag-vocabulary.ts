/**
 * report-tag-vocabulary — đo khoảng cách giữa từ vựng ba trục và tag thật trong seed.
 *
 * Vì sao là báo cáo, không phải cổng: `isValidTagForAxis` hiện có nhánh dự phòng
 * nhận mọi slug, nên không ai từng thấy độ lệch này. Bỏ nhánh đó ngay lập tức làm
 * gần như toàn bộ nội dung đã seed đỏ — con số ở dưới cho biết chính xác bao nhiêu.
 * Biến báo cáo này thành cổng là việc của lần sau, sau khi chốt từ vựng nào thắng:
 * `content-tagging.md` §7.1 và `seed-master/content-tags.ts` đang khai hai bộ khác
 * hẳn nhau, không trùng một giá trị nào ở trục `thinking` lẫn trục `what`.
 *
 * Chạy: pnpm report:tags
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SEED_CONTENT_DIR = join(ROOT, "packages/db/src/seed-content");
const CONTENT_TAGS_FILE = join(
  ROOT,
  "packages/db/src/seed-master/content-tags.ts"
);

type Axis = "what" | "thinking";

const AXIS_FIELD: Record<Axis, string> = {
  what: "what_tags",
  thinking: "thinking_tags",
};

/** Đọc từ vựng Lớp 1 thẳng từ file seed-master, không chép giá trị vào đây. */
function readVocabulary(axis: Axis): Set<string> {
  const source = readFileSync(CONTENT_TAGS_FILE, "utf-8");
  const entry = new RegExp(
    `\\{\\s*code:\\s*"([^"]+)",\\s*axis:\\s*"${axis}"`,
    "g"
  );
  const codes = new Set<string>();
  let match = entry.exec(source);
  while (match !== null) {
    codes.add(match[1] as string);
    match = entry.exec(source);
  }
  return codes;
}

function collectSeedFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...collectSeedFiles(full));
    } else if (name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

interface Usage {
  /** tag -> số lần xuất hiện */
  counts: Map<string, number>;
  /** tag -> tập file dùng nó */
  files: Map<string, Set<string>>;
}

function collectUsage(files: string[], axis: Axis): Usage {
  const field = AXIS_FIELD[axis];
  const arrayLiteral = new RegExp(`${field}:\\s*\\[([^\\]]*)\\]`, "g");
  const counts = new Map<string, number>();
  const byFile = new Map<string, Set<string>>();

  for (const file of files) {
    const source = readFileSync(file, "utf-8");
    let match = arrayLiteral.exec(source);
    while (match !== null) {
      for (const raw of (match[1] as string).split(",")) {
        const tag = raw.trim().replace(/^["']|["']$/g, "");
        if (tag.length === 0) {
          continue;
        }
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
        const seen = byFile.get(tag) ?? new Set<string>();
        seen.add(relative(ROOT, file));
        byFile.set(tag, seen);
      }
      match = arrayLiteral.exec(source);
    }
  }

  return { counts, files: byFile };
}

function reportAxis(axis: Axis, files: string[]): number {
  const vocabulary = readVocabulary(axis);
  const { counts } = collectUsage(files, axis);

  const outside = [...counts.entries()]
    .filter(([tag]) => !vocabulary.has(tag))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const usedTotal = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const outsideTotal = outside.reduce((sum, [, n]) => sum + n, 0);

  process.stdout.write(`\nTrục '${axis}'\n`);
  process.stdout.write(`  từ vựng Lớp 1        : ${vocabulary.size} giá trị\n`);
  process.stdout.write(`  giá trị khác nhau    : ${counts.size}\n`);
  process.stdout.write(`  ngoài từ vựng        : ${outside.length}\n`);
  process.stdout.write(
    `  lượt gắn ngoài/tổng  : ${outsideTotal} / ${usedTotal}\n`
  );

  if (outside.length > 0) {
    const head = outside.slice(0, 10);
    process.stdout.write("  hay gặp nhất         :\n");
    for (const [tag, n] of head) {
      process.stdout.write(`    ${String(n).padStart(4)}x  ${tag}\n`);
    }
    if (outside.length > head.length) {
      process.stdout.write(
        `    ... còn ${outside.length - head.length} giá trị\n`
      );
    }
  }

  return outside.length;
}

const seedFiles = collectSeedFiles(SEED_CONTENT_DIR);
process.stdout.write(
  `report:tags — quét ${seedFiles.length} file dưới packages/db/src/seed-content\n`
);

const offenders =
  reportAxis("what", seedFiles) + reportAxis("thinking", seedFiles);

process.stdout.write(
  `\nTổng giá trị ngoài từ vựng trên hai trục sư phạm: ${offenders}\n`
);
process.stdout.write(
  "Báo cáo, không phải cổng. Xem docs/tasks/89-game-engine-scale-out-plan.md §2.4.\n"
);
