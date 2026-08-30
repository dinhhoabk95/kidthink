/**
 * Sửa lại đích của 20 mã kỹ năng "ma" — lần đầu chọn theo nghĩa, lần này
 * **giữ nguyên năng lực**.
 *
 * `BR-LTV-04` cho một bước chơi khớp bài học khi cùng mã kỹ năng *hoặc* cùng
 * năng lực. Bảng đầu tiên đưa `C3.PAT.01` → `C1.PAT.01` và `C4.LEN.01` →
 * `C1.MEAS.01`: đúng về nghĩa đo lường, nhưng kéo bài học sang năng lực khác
 * với chính các bước chơi của nó — 40 vi phạm `BR-LTV-04`.
 *
 * Không thể remap lần hai trực tiếp trên file hiện tại vì nhiều đích đã trùng
 * với mã dùng thật (`C1.PAT.01` có 2 lượt dùng gốc, `C1.CMP.04` có 6). Nên
 * script tính lại `skill_codes` / `learning_objective_codes` từ **bản sao lưu
 * trước mọi codemod**, neo theo mã nội dung.
/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: one-off codemod script */
/* biome-ignore-all lint/performance/useTopLevelRegex: one-off codemod script */

import fs from "node:fs";
import path from "node:path";

/** Đích mới — mỗi mã ma ở lại năng lực của chính nó khi taxonomy có chỗ. */
export const PHANTOM_SKILL_REMAP_V2: Record<string, string> = {
  "C1.MSR.01": "C1.MEAS.01", // dài ngắn
  "C1.MSR.04": "C1.MEAS.04", // nhiều ít
  "C2.2D.01": "C2.GEO.01", // hình phẳng cơ bản
  "C2.2D.02": "C2.GEO.02",
  "C2.3D.01": "C2.CON.04", // ghép khối 3D
  "C2.POS.01": "C2.ORI.03", // vị trí trên
  "C2.POS.02": "C2.ORI.04", // vị trí dưới
  "C3.LOG.01": "C3.DED.01", // loại trừ để tìm đáp án
  "C3.PAT.01": "C3.SEQ.01", // chuỗi hình — giữ C3
  "C3.PAT.02": "C3.RULE.02", // hoàn thành quy luật — giữ C3
  "C4.DAT.01": "C4.DET.03", // đọc biểu đồ = quan sát kích thước cột — giữ C4
  "C4.LEN.01": "C4.DET.03", // độ dài = quan sát kích thước — giữ C4
  "C4.TIM.01": "C4.MEM.02", // trình tự thời gian = nhớ chuỗi — giữ C4
  "C4.WGT.01": "C4.SEN.03", // nặng nhẹ = phân biệt xúc giác — giữ C4
  "C5.MEM.01": "C5.STO.01", // nhớ chuyện vừa nghe — giữ C5
  "C5.RSN.01": "C5.DES.04", // giải thích lý do chọn
  "C5.SPL.01": "C5.DES.01", // miêu tả một vật
  "C6.EXC.01": "C6.PLN.02", // trao đổi = chọn phương án tối ưu — giữ C6
  "C6.SAV.01": "C6.PLN.01", // tiết kiệm = lập kế hoạch
  "C6.VAL.01": "C6.PLN.03", // giá trị = thử trong đầu trước khi quyết — giữ C6
};

const CONTENT_CODE_REGEX = /"?code"?:\s*"((?:GL|ACT|LES)-[A-Z0-9.-]+)"/;
const ARRAY_OPEN_REGEX =
  /^(\s*)"?(skill_codes|learning_objective_codes)"?:\s*\[/;
const QUOTED_REGEX = /"([^"]+)"/g;
/** `digital-game-activities.ts` giữ một mã đơn thay vì mảng. */
const SCALAR_FIELD_REGEX = /^(\s*)(skillCode|loCode):\s*"([^"]+)",?$/;

interface CodeLists {
  skill_codes: string[];
  learning_objective_codes: string[];
  skillCode?: string;
  loCode?: string;
}

/** Đọc một cây seed-content: mã nội dung → hai mảng mã. */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one-off codemod script
function readLists(root: string): Map<string, CodeLists> {
  const result = new Map<string, CodeLists>();
  for (const file of walk(root)) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");
    let currentCode: string | null = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string;
      const codeHit = CONTENT_CODE_REGEX.exec(line);
      if (codeHit?.[1]) {
        currentCode = codeHit[1];
        continue;
      }
      const scalar = SCALAR_FIELD_REGEX.exec(line);
      if (scalar?.[2] && scalar[3] && currentCode) {
        const entry = result.get(currentCode) ?? {
          skill_codes: [],
          learning_objective_codes: [],
        };
        if (scalar[2] === "skillCode") {
          entry.skillCode = scalar[3];
        } else {
          entry.loCode = scalar[3];
        }
        result.set(currentCode, entry);
        continue;
      }
      const open = ARRAY_OPEN_REGEX.exec(line);
      if (!(open && currentCode)) {
        continue;
      }
      const field = open[2] as keyof CodeLists;
      const { values, end } = readArray(lines, i);
      i = end;
      const entry = result.get(currentCode) ?? {
        skill_codes: [],
        learning_objective_codes: [],
      };
      entry[field] = values;
      result.set(currentCode, entry);
    }
  }
  return result;
}

/** Đọc phần thân một mảng chuỗi, một hoặc nhiều dòng. */
function readArray(
  lines: string[],
  start: number
): { values: string[]; end: number } {
  const values: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i] as string;
    const body = i === start ? line.slice(line.indexOf("[") + 1) : line;
    QUOTED_REGEX.lastIndex = 0;
    let hit = QUOTED_REGEX.exec(body);
    while (hit !== null) {
      values.push(hit[1] as string);
      hit = QUOTED_REGEX.exec(body);
    }
    if (body.includes("]")) {
      return { values, end: i };
    }
  }
  return { values, end: lines.length - 1 };
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out.sort();
}

function remap(codes: string[]): string[] {
  return codes.map((code) => {
    const direct = PHANTOM_SKILL_REMAP_V2[code];
    if (direct) {
      return direct;
    }
    const lo = /^LO-(.+)-\d+$/.exec(code);
    const skill = lo?.[1] ? PHANTOM_SKILL_REMAP_V2[lo[1]] : undefined;
    return skill ? `LO-${skill}-01` : code;
  });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one-off codemod script
function rewriteFile(
  file: string,
  wanted: Map<string, CodeLists>
): { text: string; hits: number } {
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  const out: string[] = [];
  let currentCode: string | null = null;
  let hits = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const codeHit = CONTENT_CODE_REGEX.exec(line);
    if (codeHit?.[1]) {
      currentCode = codeHit[1];
      out.push(line);
      continue;
    }
    const target = currentCode ? wanted.get(currentCode) : undefined;
    const scalar = SCALAR_FIELD_REGEX.exec(line);
    if (scalar?.[2] && target) {
      const desiredScalar =
        scalar[2] === "skillCode" ? target.skillCode : target.loCode;
      if (desiredScalar && desiredScalar !== scalar[3]) {
        out.push(`${scalar[1]}${scalar[2]}: "${desiredScalar}",`);
        hits++;
        continue;
      }
      out.push(line);
      continue;
    }
    const open = ARRAY_OPEN_REGEX.exec(line);
    if (!(open && target)) {
      out.push(line);
      continue;
    }
    const field = open[2] as keyof CodeLists;
    const indent = open[1] as string;
    const { values, end } = readArray(lines, i);
    const desired = target[field];
    if (desired.length === 0 || values.join("|") === desired.join("|")) {
      for (let k = i; k <= end; k++) {
        out.push(lines[k] as string);
      }
      i = end;
      continue;
    }
    const quoted = desired.map((value) => `"${value}"`).join(", ");
    out.push(`${indent}"${field}": [${quoted}],`);
    hits++;
    i = end;
  }

  return { text: out.join("\n"), hits };
}

function main(): void {
  const backup = process.argv
    .find((arg) => arg.startsWith("--backup="))
    ?.slice("--backup=".length);
  if (!backup) {
    throw new Error("Thiếu --backup=<đường dẫn seed-content trước codemod>");
  }
  const write = process.argv.includes("--write");
  const baseline = readLists(backup);
  const wanted = new Map<string, CodeLists>();
  for (const [code, lists] of baseline) {
    wanted.set(code, {
      skill_codes: remap(lists.skill_codes),
      learning_objective_codes: remap(lists.learning_objective_codes),
      skillCode: lists.skillCode ? remap([lists.skillCode])[0] : undefined,
      loCode: lists.loCode ? remap([lists.loCode])[0] : undefined,
    });
  }
  console.log(`bản sao lưu: ${wanted.size} mã nội dung`);

  const root = path.resolve(import.meta.dirname, "../src/seed-content");
  let total = 0;
  for (const file of walk(root)) {
    const { text, hits } = rewriteFile(file, wanted);
    if (hits === 0) {
      continue;
    }
    total += hits;
    console.log(`${path.relative(root, file).padEnd(46)} ${hits}`);
    if (write) {
      fs.writeFileSync(file, text, "utf-8");
    }
  }
  console.log(`\n${total} mảng mã ghi lại`);
  console.log(write ? "✅ đã ghi" : "ℹ️  thêm --write để ghi");
}

main();
