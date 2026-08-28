/**
 * Pure TypeScript Vector PDF Renderer for Lesson Plans (Task P4.2 / Task #63)
 *
 * Conforms to:
 * - BR-PDF-04: Watermark strictly in footer only, never obscuring content.
 * - BR-PDF-05: Page limit constraint (<= 20 pages).
 * - BR-PDF-06: Absolute prohibition of child PII or progress leakage in exports.
 * - BR-PDF-07: Full Vietnamese Unicode support (Identity-H / UTF-16BE encoding).
 */

const FORBIDDEN_CHILD_DATA_KEYS: readonly string[] = [
  "child_id",
  "child_uuid",
  "child_name",
  "child_profile",
  "birth_date",
  "date_of_birth",
  "p_learn",
  "mastery_state",
  "ema_correct",
  "telemetry",
];

const NEWLINE_REGEX = /\r\n/g;
const WHITESPACE_REGEX = /\s+/;

export interface LessonPlanExportItemSnapshot {
  title?: string;
  duration_minutes?: number;
  description?: string;
  instructions?: string;
  child_prompts?: string[];
  materials?: string[];
}

export interface LessonPlanExportItemDTO {
  position: number;
  item_type: "activity" | "game_level" | "custom_note";
  item_code?: string;
  custom_instruction?: string;
  snapshot?: LessonPlanExportItemSnapshot;
}

export interface LessonPlanExportDTO {
  uuid?: string;
  title: string;
  target_age?: number;
  estimated_minutes?: number;
  notes?: string;
  version?: number;
  items?: LessonPlanExportItemDTO[];
}

export interface PdfRenderResult {
  pdfBuffer: Buffer;
  pageCount: number;
  kind: string;
  title: string;
}

function assertKeyAllowed(key: string, path: string): void {
  const lowerKey = key.toLowerCase();
  for (const forbidden of FORBIDDEN_CHILD_DATA_KEYS) {
    if (lowerKey === forbidden || lowerKey.includes(forbidden)) {
      throw new Error(
        `BR-PDF-06 Violation: Chứa dữ liệu trẻ hoặc tiến độ cá nhân tại '${path}.${key}'`
      );
    }
  }
}

/**
 * Validates that no child data or progress metrics exist in export payload (BR-PDF-06).
 */
export function assertNoChildDataInExport(dto: Record<string, unknown>): void {
  function scan(obj: unknown, path = ""): void {
    if (!obj || typeof obj !== "object") {
      return;
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        scan(obj[i], `${path}[${i}]`);
      }
      return;
    }

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      assertKeyAllowed(key, path);
      scan(value, path ? `${path}.${key}` : key);
    }
  }

  scan(dto);
}

/**
 * Converts text to Unicode UTF-16BE hex format for standard PDF Identity-H encoding (BR-PDF-07)
 */
export function toUtf16BeHex(text: string): string {
  const buf = Buffer.alloc(text.length * 2);
  for (let i = 0; i < text.length; i++) {
    buf.writeUInt16BE(text.charCodeAt(i), i * 2);
  }
  return buf.toString("hex");
}

function escapePdfText(text: string): string {
  return `<${toUtf16BeHex(text)}>`;
}

function wrapText(text: string, maxChars = 75): string[] {
  if (!text) {
    return [];
  }
  const words = text.replace(NEWLINE_REGEX, "\n").split(WHITESPACE_REGEX);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!word) {
      continue;
    }
    if (currentLine.length + word.length + 1 <= maxChars) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

interface RenderLine {
  text: string;
  fontSize: number;
  font: "F1" | "F2";
  color?: [number, number, number];
  indent?: number;
  spaceAfter?: number;
}

function buildHeaderLines(dto: LessonPlanExportDTO): RenderLine[] {
  const lines: RenderLine[] = [];

  lines.push({
    text: `KẾ HOẠCH BÀI DẠY: ${dto.title.toUpperCase()}`,
    fontSize: 16,
    font: "F1",
    color: [0.15, 0.2, 0.45],
    spaceAfter: 12,
  });

  const targetAgeText = dto.target_age
    ? `Độ tuổi: ${dto.target_age} - ${dto.target_age + 1} tuổi`
    : "Độ tuổi: 3 - 6 tuổi";
  const durationText = dto.estimated_minutes
    ? `Thời lượng: ${dto.estimated_minutes} phút`
    : "Thời lượng: 30 phút";
  const versionText = `Phiên bản giáo án: v${dto.version || 1}`;

  lines.push({
    text: `• ${targetAgeText}    |    • ${durationText}    |    • ${versionText}`,
    fontSize: 10,
    font: "F2",
    color: [0.3, 0.35, 0.4],
    spaceAfter: 14,
  });

  if (dto.notes) {
    lines.push({
      text: "GHI CHÚ CHUNG:",
      fontSize: 11,
      font: "F1",
      color: [0.2, 0.2, 0.2],
      spaceAfter: 4,
    });
    for (const noteLine of wrapText(dto.notes, 80)) {
      lines.push({
        text: noteLine,
        fontSize: 10,
        font: "F2",
        indent: 10,
        spaceAfter: 2,
      });
    }
    lines.push({ text: "", fontSize: 6, font: "F2", spaceAfter: 8 });
  }

  return lines;
}

function getItemTypeLabel(
  itemType: "activity" | "game_level" | "custom_note"
): string {
  if (itemType === "activity") {
    return "Hoạt động thực hành";
  }
  if (itemType === "game_level") {
    return "Trò chơi tư duy";
  }
  return "Ghi chú hướng dẫn";
}

function buildItemInstructionsLines(instructions: string): RenderLine[] {
  const lines: RenderLine[] = [];
  lines.push({
    text: "Các bước tiến hành:",
    fontSize: 9.5,
    font: "F1",
    indent: 14,
    spaceAfter: 2,
  });
  for (const stepLine of wrapText(instructions, 70)) {
    lines.push({
      text: stepLine,
      fontSize: 9,
      font: "F2",
      indent: 20,
      spaceAfter: 2,
    });
  }
  return lines;
}

function buildItemPromptsLines(prompts: string[]): RenderLine[] {
  const lines: RenderLine[] = [];
  lines.push({
    text: "Câu hỏi / gợi ý tương tác với trẻ:",
    fontSize: 9.5,
    font: "F1",
    indent: 14,
    spaceAfter: 2,
  });
  for (const prompt of prompts) {
    for (const promptLine of wrapText(`• "${prompt}"`, 70)) {
      lines.push({
        text: promptLine,
        fontSize: 9,
        font: "F2",
        indent: 20,
        color: [0.35, 0.25, 0.1],
        spaceAfter: 2,
      });
    }
  }
  return lines;
}

function buildItemDetailLines(
  item: LessonPlanExportItemDTO,
  idx: number
): RenderLine[] {
  const lines: RenderLine[] = [];
  const itemTitle =
    item.snapshot?.title || item.item_code || `Hoạt động #${idx + 1}`;
  const itemTypeLabel = getItemTypeLabel(item.item_type);
  const durationLabel = item.snapshot?.duration_minutes
    ? ` (${item.snapshot.duration_minutes} phút)`
    : "";

  lines.push({
    text: `${idx + 1}. [${itemTypeLabel}] ${itemTitle}${durationLabel}`,
    fontSize: 11,
    font: "F1",
    color: [0.1, 0.15, 0.35],
    spaceAfter: 4,
  });

  if (item.snapshot?.description) {
    for (const descLine of wrapText(item.snapshot.description, 75)) {
      lines.push({
        text: descLine,
        fontSize: 9.5,
        font: "F2",
        indent: 14,
        spaceAfter: 2,
      });
    }
  }

  if (item.custom_instruction) {
    lines.push({
      text: `Hướng dẫn thực hiện: ${item.custom_instruction}`,
      fontSize: 9.5,
      font: "F2",
      indent: 14,
      color: [0.2, 0.3, 0.2],
      spaceAfter: 3,
    });
  }

  if (item.snapshot?.instructions) {
    lines.push(...buildItemInstructionsLines(item.snapshot.instructions));
  }

  if (
    Array.isArray(item.snapshot?.child_prompts) &&
    item.snapshot.child_prompts.length > 0
  ) {
    lines.push(...buildItemPromptsLines(item.snapshot.child_prompts));
  }

  if (
    Array.isArray(item.snapshot?.materials) &&
    item.snapshot.materials.length > 0
  ) {
    const matStr = item.snapshot.materials.join(", ");
    lines.push({
      text: `Đồ dùng / Học cụ cần chuẩn bị: ${matStr}`,
      fontSize: 9,
      font: "F2",
      indent: 14,
      color: [0.4, 0.4, 0.4],
      spaceAfter: 4,
    });
  }

  lines.push({ text: "", fontSize: 4, font: "F2", spaceAfter: 6 });
  return lines;
}

function buildLessonPlanLines(dto: LessonPlanExportDTO): RenderLine[] {
  const lines: RenderLine[] = [...buildHeaderLines(dto)];

  lines.push({
    text: "NỘI DUNG VÀ HOẠT ĐỘNG CHI TIẾT:",
    fontSize: 12,
    font: "F1",
    color: [0.15, 0.2, 0.45],
    spaceAfter: 10,
  });

  const sortedItems = [...(dto.items || [])].sort(
    (a, b) => a.position - b.position
  );

  if (sortedItems.length === 0) {
    lines.push({
      text: "(Chưa có hoạt động nào trong giáo án này)",
      fontSize: 10,
      font: "F2",
      color: [0.5, 0.5, 0.5],
      spaceAfter: 10,
    });
    return lines;
  }

  for (let idx = 0; idx < sortedItems.length; idx++) {
    const item = sortedItems[idx];
    if (item) {
      lines.push(...buildItemDetailLines(item, idx));
    }
  }

  return lines;
}

function paginateLines(
  lines: RenderLine[],
  usableHeight: number
): RenderLine[][] {
  const pages: RenderLine[][] = [];
  let currentPageLines: RenderLine[] = [];
  let currentY = 0;

  for (const line of lines) {
    const lineHeight = line.fontSize * 1.35 + (line.spaceAfter || 0);
    if (currentY + lineHeight > usableHeight && currentPageLines.length > 0) {
      pages.push(currentPageLines);
      currentPageLines = [];
      currentY = 0;
    }
    currentPageLines.push(line);
    currentY += lineHeight;
  }

  if (currentPageLines.length > 0) {
    pages.push(currentPageLines);
  }
  return pages;
}

/**
 * Pure TypeScript vector PDF generator for lesson plans.
 */
export function renderLessonPlanPdf(
  dto: LessonPlanExportDTO,
  options?: { exportDateIct?: string; maxPages?: number }
): PdfRenderResult {
  assertNoChildDataInExport(dto as unknown as Record<string, unknown>);

  const maxPages = options?.maxPages ?? 20;
  const exportDateStr =
    options?.exportDateIct ||
    new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

  const lines = buildLessonPlanLines(dto);
  const usableHeight = 790 - 70;
  const pages = paginateLines(lines, usableHeight);
  const pageCount = pages.length;

  if (pageCount > maxPages) {
    const err = new Error(
      `BR-PDF-05 Violation: Vượt quá giới hạn tối đa ${maxPages} trang (tài liệu hiện tại có ${pageCount} trang).`
    );
    err.name = "PAGE_LIMIT_EXCEEDED";
    throw err;
  }

  const pdfBuffer = generatePdfBinary(pages, {
    documentTitle: dto.title,
    exportDate: exportDateStr,
    pageCount,
  });

  return {
    pdfBuffer,
    pageCount,
    kind: "lesson_plan",
    title: dto.title,
  };
}

function generatePdfBinary(
  pages: RenderLine[][],
  meta: { documentTitle: string; exportDate: string; pageCount: number }
): Buffer {
  const objects: string[] = [];

  function addObject(content: string): number {
    objects.push(content);
    return objects.length;
  }

  const catalogObjId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesObjId = addObject("");
  const font1ObjId = addObject(
    "<< /Type /Font /Subtype /Type0 /BaseFont /Helvetica-Bold /Encoding /Identity-H /ToUnicode 5 0 R /DescendantFonts [6 0 R] >>"
  );
  const font2ObjId = addObject(
    "<< /Type /Font /Subtype /Type0 /BaseFont /Helvetica /Encoding /Identity-H /ToUnicode 5 0 R /DescendantFonts [7 0 R] >>"
  );

  const toUnicodeCMap =
    "/CIDInit /ProcSet findresource begin\n" +
    "12 dict begin\n" +
    "begincmap\n" +
    "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n" +
    "/CMapName /Custom-ToUnicode def\n" +
    "/CMapType 2 def\n" +
    "1 begincodespacerange\n" +
    "<0000> <FFFF>\n" +
    "endcodespacerange\n" +
    "1 beginbfrange\n" +
    "<0000> <FFFF> <0000>\n" +
    "endbfrange\n" +
    "endcmap\n" +
    "CMapName currentdict /CMap defineresource pop\n" +
    "end\n" +
    "end";
  addObject(
    `<< /Length ${Buffer.byteLength(toUnicodeCMap)} >>\nstream\n${toUnicodeCMap}\nendstream`
  );

  addObject(
    "<< /Type /Font /Subtype /CIDFontType2 /BaseFont /Helvetica-Bold /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor 8 0 R /DW 1000 /W [ 0 65535 600 ] >>"
  );
  addObject(
    "<< /Type /Font /Subtype /CIDFontType2 /BaseFont /Helvetica /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor 9 0 R /DW 1000 /W [ 0 65535 550 ] >>"
  );
  addObject(
    "<< /Type /FontDescriptor /FontName /Helvetica-Bold /Flags 32 /FontBBox [-500 -300 1200 1000] /ItalicAngle 0 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 120 >>"
  );
  addObject(
    "<< /Type /FontDescriptor /FontName /Helvetica /Flags 32 /FontBBox [-500 -300 1200 1000] /ItalicAngle 0 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 70 >>"
  );

  const pageObjectIds: number[] = [];

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageLines = pages[pageIdx];
    if (!pageLines) {
      continue;
    }
    const streamCommands: string[] = [];

    streamCommands.push("0.2 0.35 0.75 RG");
    streamCommands.push("2 w");
    streamCommands.push("40 805 m 555 805 l S");

    let yPos = 780;
    for (const line of pageLines) {
      const indent = 40 + (line.indent || 0);
      const color = line.color || [0.1, 0.1, 0.1];

      streamCommands.push(`${color[0]} ${color[1]} ${color[2]} rg`);
      streamCommands.push("BT");
      streamCommands.push(`/${line.font} ${line.fontSize} Tf`);
      streamCommands.push(`${indent} ${yPos} Td`);
      streamCommands.push(`${escapePdfText(line.text)} Tj`);
      streamCommands.push("ET");

      yPos -= line.fontSize * 1.35 + (line.spaceAfter || 0);
    }

    streamCommands.push("0.75 0.78 0.82 RG");
    streamCommands.push("0.75 w");
    streamCommands.push("40 45 m 555 45 l S");

    streamCommands.push("0.45 0.5 0.58 rg");
    streamCommands.push("BT");
    streamCommands.push("/F2 8 Tf");
    streamCommands.push("40 32 Td");
    streamCommands.push(
      `${escapePdfText("MindKid — Thư viện tư duy qua trò chơi cho trẻ mầm non")} Tj`
    );
    streamCommands.push("ET");

    streamCommands.push("0.45 0.5 0.58 rg");
    streamCommands.push("BT");
    streamCommands.push("/F2 8 Tf");
    streamCommands.push("380 32 Td");
    const footerMeta = `Trang ${pageIdx + 1}/${meta.pageCount}  |  ${meta.exportDate}`;
    streamCommands.push(`${escapePdfText(footerMeta)} Tj`);
    streamCommands.push("ET");

    const contentStream = streamCommands.join("\n");
    const contentObjId = addObject(
      `<< /Length ${Buffer.byteLength(contentStream)} >>\nstream\n${contentStream}\nendstream`
    );

    const pageObjId = addObject(
      `<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 ${font1ObjId} 0 R /F2 ${font2ObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>`
    );
    pageObjectIds.push(pageObjId);
  }

  const kidsStr = pageObjectIds.map((id) => `${id} 0 R`).join(" ");
  objects[pagesObjId - 1] =
    `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjectIds.length} >>`;

  let body = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(body));
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, "0");
    body += `${offsetStr} 00000 n \n`;
  }

  body += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjId} 0 R >>\n`;
  body += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body, "binary");
}
