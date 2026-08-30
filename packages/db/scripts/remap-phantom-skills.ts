/**
 * Codemod một lần: đưa 20 mã kỹ năng "ma" trong corpus về mã có thật trong
 * `docs/taxonomy/`.
 *
 * Các mã này (`C4.LEN.01`, `C2.POS.01`, `C3.PAT.01`, …) chưa từng tồn tại
 * trong bất kỳ file taxonomy nào — tác giả nội dung tự đặt. `linkGameLevelSkills`
 * ném khi tra không ra, nên 228 trên 560 hạt kéo cả lô seed chết.
 *
 * Đích chọn theo **nghĩa của strand**, không theo chuỗi ký tự gần giống.
 * Bảng nằm trong `docs/tasks/162-...-plan.md`.
 */
import fs from "node:fs";
import path from "node:path";

export const PHANTOM_SKILL_REMAP: Record<string, string> = {
  "C1.MSR.01": "C1.MEAS.01", // đo dài ngắn
  "C1.MSR.04": "C1.MEAS.04", // nhiều ít
  "C2.2D.01": "C2.GEO.01", // hình phẳng cơ bản
  "C2.2D.02": "C2.GEO.02",
  "C2.3D.01": "C2.CON.04", // ghép khối 3D
  "C2.POS.01": "C2.ORI.03", // vị trí trên
  "C2.POS.02": "C2.ORI.04", // vị trí dưới
  "C3.LOG.01": "C3.DED.01", // loại trừ để tìm đáp án
  "C3.PAT.01": "C1.PAT.01", // quy luật AB
  "C3.PAT.02": "C1.PAT.02", // quy luật ABB
  "C4.DAT.01": "C1.CMP.04", // đọc biểu đồ = so sánh nhiều hơn
  "C4.LEN.01": "C1.MEAS.01", // độ dài
  "C4.TIM.01": "C1.MEAS.10", // thời gian trước/sau
  "C4.WGT.01": "C1.MEAS.03", // nặng nhẹ
  "C5.MEM.01": "C4.MEM.04", // nhớ chuỗi âm thanh
  "C5.RSN.01": "C5.DES.04", // giải thích lý do chọn
  "C5.SPL.01": "C5.DES.01", // miêu tả một vật
  "C6.EXC.01": "C1.MEAS.14", // trao đổi — tiền xu đơn giản
  "C6.SAV.01": "C6.PLN.01", // tiết kiệm — lập kế hoạch
  "C6.VAL.01": "C1.MEAS.14", // giá trị — tiền xu đơn giản
};

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

function escapeCode(code: string): string {
  return code.replace(/\./g, "\\.");
}

export function remapFile(source: string): { text: string; hits: number } {
  let text = source;
  let hits = 0;
  for (const [phantom, real] of Object.entries(PHANTOM_SKILL_REMAP)) {
    // Chỉ thay chuỗi được trích dẫn trọn vẹn — không đụng vào chuỗi dài hơn.
    const skillPattern = new RegExp(`"${escapeCode(phantom)}"`, "g");
    const loPattern = new RegExp(`"LO-${escapeCode(phantom)}-\\d+"`, "g");
    text = text.replace(skillPattern, () => {
      hits++;
      return `"${real}"`;
    });
    text = text.replace(loPattern, () => {
      hits++;
      return `"LO-${real}-01"`;
    });
  }
  return { text, hits };
}

if (process.argv[1]?.endsWith("remap-phantom-skills.ts")) {
  const root = path.resolve(import.meta.dirname, "../src/seed-content");
  const write = process.argv.includes("--write");
  let totalHits = 0;
  let touched = 0;
  for (const file of walk(root, [])) {
    const source = fs.readFileSync(file, "utf-8");
    const { text, hits } = remapFile(source);
    if (hits === 0) {
      continue;
    }
    totalHits += hits;
    touched++;
    console.log(
      `${path.relative(root, file).padEnd(46)} ${String(hits).padStart(4)} lượt thay`
    );
    if (write) {
      fs.writeFileSync(file, text, "utf-8");
    }
  }
  console.log(`\nTổng ${totalHits} lượt thay trên ${touched} file`);
  console.log(write ? "✅ đã ghi" : "ℹ️  thêm --write để ghi");
}
