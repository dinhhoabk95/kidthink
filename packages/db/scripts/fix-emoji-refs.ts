/**
 * Đổi mọi `ref` / `emoji_ref` còn là glyph thô sang mã `EMJ-<slug>`.
 *
 * `packages/emoji/src/query.ts:getByCode` chỉ tra theo mã, nên một glyph thô
 * resolve ra `not_found` lúc render — trẻ thấy ô trống. Bậc thang nợ ở
 * `packages/db/tests/gates/emoji-ref-debt.test.ts` đo đúng khoản này.
 */
import fs from "node:fs";
import path from "node:path";
import { ALL_EMOJIS, getEmojiCode } from "@mindkid/emoji";

const GLYPH_TO_REF = new Map<string, string>();
for (const entry of ALL_EMOJIS) {
  const code = getEmojiCode(entry);
  if (!GLYPH_TO_REF.has(entry.emoji)) {
    GLYPH_TO_REF.set(entry.emoji, code);
  }
  const stripped = entry.emoji.replace(/️/g, "");
  if (!GLYPH_TO_REF.has(stripped)) {
    GLYPH_TO_REF.set(stripped, code);
  }
}

const KNOWN_CODES = new Set(ALL_EMOJIS.map((entry) => getEmojiCode(entry)));

// Chặn `asset_ref` / `expected_asset_ref` — đó là trường khác, bậc thang nợ
// cũng không đếm chúng.
const REF_FIELD_REGEX = /(?<![A-Za-z_])("?(?:ref|emoji_ref)"?:\s*)"([^"]+)"/g;

function walk(dir: string, out: string[]): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full, out);
    } else if (name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

function main(): void {
  const root = path.resolve(import.meta.dirname, "../src/seed-content");
  const write = process.argv.includes("--write");
  const unresolved = new Map<string, number>();
  let replaced = 0;
  let touched = 0;

  for (const file of walk(root, [])) {
    const source = fs.readFileSync(file, "utf-8");
    let fileHits = 0;
    const next = source.replace(REF_FIELD_REGEX, (whole, prefix, value) => {
      if (value.startsWith("EMJ-")) {
        return whole;
      }
      // Một số ref đã là slug nhưng thiếu tiền tố — `"star"` thay vì
      // `"EMJ-star"`. Chúng resolve ra `not_found` y như glyph thô.
      const code =
        GLYPH_TO_REF.get(value) ??
        GLYPH_TO_REF.get(value.replace(/️/g, "")) ??
        (KNOWN_CODES.has(`EMJ-${value}`) ? `EMJ-${value}` : undefined);
      if (!code) {
        unresolved.set(value, (unresolved.get(value) ?? 0) + 1);
        return whole;
      }
      fileHits++;
      replaced++;
      return `${prefix}"${code}"`;
    });
    if (fileHits > 0) {
      touched++;
      console.log(
        `${path.relative(root, file).padEnd(46)} ${String(fileHits).padStart(4)}`
      );
      if (write) {
        fs.writeFileSync(file, next, "utf-8");
      }
    }
  }

  console.log(`\n${replaced} ref đổi sang mã EMJ trên ${touched} file`);
  if (unresolved.size > 0) {
    console.log(`còn ${unresolved.size} glyph chưa có trong registry:`);
    for (const [glyph, count] of unresolved) {
      console.log(`  ${count} × ${glyph}`);
    }
  }
  console.log(write ? "✅ đã ghi" : "ℹ️  thêm --write để ghi");
}

main();
