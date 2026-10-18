const MAX_SUBSET_GLYPH_ID = 8240;

export const FONT_NAME_BOLD = "MindKidSans-Bold";
export const FONT_NAME_REGULAR = "MindKidSans-Regular";

interface SfntTableEntry {
  tag: string;
  data: Buffer;
}

function isPunctuationCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x21 && codePoint <= 0x2f) ||
    (codePoint >= 0x3a && codePoint <= 0x40) ||
    (codePoint >= 0x20_13 && codePoint <= 0x20_26)
  );
}

function isVietnameseCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x00_c0 && codePoint <= 0x01_b0) ||
    (codePoint >= 0x1e_a0 && codePoint <= 0x1e_f9)
  );
}

export function getGlyphAdvanceWidth(codePoint: number, bold: boolean): number {
  const boldOffset = bold ? 40 : 0;
  if (codePoint === 0x20) {
    return 280;
  }
  if (codePoint >= 0x30 && codePoint <= 0x39) {
    return 560;
  }
  if (isPunctuationCodePoint(codePoint)) {
    return 380 + boldOffset;
  }
  if (codePoint >= 0x41 && codePoint <= 0x5a) {
    return 640 + boldOffset;
  }
  if (codePoint >= 0x61 && codePoint <= 0x7a) {
    return 540 + boldOffset;
  }
  if (isVietnameseCodePoint(codePoint)) {
    return 560 + boldOffset;
  }
  return bold ? 600 : 550;
}

export function buildCidWidthArray(bold: boolean): string {
  const spaceW = getGlyphAdvanceWidth(0x20, bold);
  const punctW = getGlyphAdvanceWidth(0x21, bold);
  const digitW = getGlyphAdvanceWidth(0x30, bold);
  const upperW = getGlyphAdvanceWidth(0x41, bold);
  const lowerW = getGlyphAdvanceWidth(0x61, bold);
  const vietW = getGlyphAdvanceWidth(0x1e_a0, bold);

  return [
    "[",
    `32 [ ${spaceW} ]`,
    `33 47 ${punctW}`,
    `48 57 ${digitW}`,
    `58 64 ${punctW}`,
    `65 90 ${upperW}`,
    `91 96 ${punctW}`,
    `97 122 ${lowerW}`,
    `123 126 ${punctW}`,
    `160 432 ${vietW}`,
    `7840 7929 ${vietW}`,
    `8211 8230 ${punctW}`,
    "]",
  ].join(" ");
}

function alignToFourBytes(byteLength: number): number {
  return Math.ceil(byteLength / 4) * 4;
}

function computeSfntChecksum(buf: Buffer): number {
  const paddedLen = alignToFourBytes(buf.length);
  const padded = Buffer.alloc(paddedLen);
  buf.copy(padded);
  let sum = 0;
  for (let i = 0; i < paddedLen; i += 4) {
    sum = (sum + padded.readUInt32BE(i)) % 4_294_967_296;
  }
  return sum;
}

function buildHeadTable(): Buffer {
  const head = Buffer.alloc(54);
  head.writeUInt32BE(0x00_01_00_00, 0);
  head.writeUInt32BE(0x00_01_00_00, 4);
  head.writeUInt32BE(0x5f_0f_3c_f5, 12);
  head.writeUInt16BE(0x00_0b, 16);
  head.writeUInt16BE(1000, 18);
  head.writeInt16BE(0, 36);
  head.writeInt16BE(-200, 38);
  head.writeInt16BE(700, 40);
  head.writeInt16BE(800, 42);
  head.writeInt16BE(1, 50);
  return head;
}

function buildHheaTable(bold: boolean): Buffer {
  const hhea = Buffer.alloc(36);
  hhea.writeUInt32BE(0x00_01_00_00, 0);
  hhea.writeInt16BE(800, 4);
  hhea.writeInt16BE(-200, 6);
  hhea.writeUInt16BE(bold ? 680 : 640, 10);
  hhea.writeInt16BE(620, 16);
  hhea.writeInt16BE(1, 18);
  hhea.writeUInt16BE(MAX_SUBSET_GLYPH_ID, 34);
  return hhea;
}

function buildMaxpTable(): Buffer {
  const maxp = Buffer.alloc(32);
  maxp.writeUInt32BE(0x00_01_00_00, 0);
  maxp.writeUInt16BE(MAX_SUBSET_GLYPH_ID, 4);
  maxp.writeUInt16BE(4, 6);
  maxp.writeUInt16BE(1, 8);
  return maxp;
}

function buildOs2Table(bold: boolean): Buffer {
  const os2 = Buffer.alloc(78);
  os2.writeUInt16BE(1, 0);
  os2.writeInt16BE(bold ? 600 : 550, 2);
  os2.writeUInt16BE(bold ? 700 : 400, 4);
  os2.writeUInt16BE(5, 6);
  os2.writeUInt16BE(bold ? 0x00_20 : 0x00_40, 62);
  os2.writeUInt16BE(0x00_20, 64);
  os2.writeUInt16BE(0x20_26, 66);
  os2.writeInt16BE(800, 68);
  os2.writeInt16BE(-200, 70);
  os2.writeUInt16BE(800, 74);
  os2.writeUInt16BE(200, 76);
  return os2;
}

function buildCmapTable(): Buffer {
  const cmap = Buffer.alloc(36);
  cmap.writeUInt16BE(0, 0);
  cmap.writeUInt16BE(1, 2);
  cmap.writeUInt16BE(3, 4);
  cmap.writeUInt16BE(1, 6);
  cmap.writeUInt32BE(12, 8);
  cmap.writeUInt16BE(4, 12);
  cmap.writeUInt16BE(24, 14);
  cmap.writeUInt16BE(0, 16);
  cmap.writeUInt16BE(4, 18);
  cmap.writeUInt16BE(2, 20);
  cmap.writeUInt16BE(1, 22);
  cmap.writeUInt16BE(0, 24);
  cmap.writeUInt16BE(0x20_2f, 26);
  cmap.writeUInt16BE(0xff_ff, 28);
  cmap.writeUInt16BE(0, 30);
  cmap.writeUInt16BE(0x00_00, 32);
  cmap.writeUInt16BE(0xff_ff, 34);
  return cmap;
}

function buildGlyfAndLocaTables(): { glyf: Buffer; loca: Buffer } {
  const glyf = Buffer.alloc(20);
  glyf.writeInt16BE(1, 0);
  glyf.writeInt16BE(40, 2);
  glyf.writeInt16BE(0, 4);
  glyf.writeInt16BE(520, 6);
  glyf.writeInt16BE(700, 8);
  glyf.writeUInt16BE(3, 10);
  glyf.writeUInt16BE(0, 12);
  glyf.writeUInt8(0x37, 14);
  glyf.writeUInt8(0x37, 15);

  const loca = Buffer.alloc((MAX_SUBSET_GLYPH_ID + 1) * 4);
  loca.writeUInt32BE(0, 0);
  for (let gid = 1; gid <= MAX_SUBSET_GLYPH_ID; gid++) {
    loca.writeUInt32BE(glyf.length, gid * 4);
  }
  return { glyf, loca };
}

function buildHmtxTable(bold: boolean): Buffer {
  const hmtx = Buffer.alloc(MAX_SUBSET_GLYPH_ID * 4);
  for (let gid = 0; gid < MAX_SUBSET_GLYPH_ID; gid++) {
    const advanceWidth = getGlyphAdvanceWidth(gid, bold);
    const lsb = gid === 0x20 ? 0 : 40;
    hmtx.writeUInt16BE(advanceWidth, gid * 4);
    hmtx.writeInt16BE(lsb, gid * 4 + 2);
  }
  return hmtx;
}

function buildNameAndPostTables(bold: boolean): { name: Buffer; post: Buffer } {
  const fontFamily = bold ? FONT_NAME_BOLD : FONT_NAME_REGULAR;
  const strBytes = Buffer.from(fontFamily, "utf16le");
  for (let i = 0; i < strBytes.length; i += 2) {
    const lo = strBytes[i] ?? 0;
    strBytes[i] = strBytes[i + 1] ?? 0;
    strBytes[i + 1] = lo;
  }
  const name = Buffer.alloc(18 + strBytes.length);
  name.writeUInt16BE(0, 0);
  name.writeUInt16BE(1, 2);
  name.writeUInt16BE(18, 4);
  name.writeUInt16BE(3, 6);
  name.writeUInt16BE(1, 8);
  name.writeUInt16BE(0x04_09, 10);
  name.writeUInt16BE(6, 12);
  name.writeUInt16BE(strBytes.length, 14);
  name.writeUInt16BE(0, 16);
  strBytes.copy(name, 18);

  const post = Buffer.alloc(32);
  post.writeUInt32BE(0x00_03_00_00, 0);
  return { name, post };
}

export function buildEmbeddedTrueTypeSubsetFont(bold: boolean): Buffer {
  const { glyf, loca } = buildGlyfAndLocaTables();
  const { name, post } = buildNameAndPostTables(bold);
  const tables: SfntTableEntry[] = [
    { tag: "OS/2", data: buildOs2Table(bold) },
    { tag: "cmap", data: buildCmapTable() },
    { tag: "glyf", data: glyf },
    { tag: "head", data: buildHeadTable() },
    { tag: "hhea", data: buildHheaTable(bold) },
    { tag: "hmtx", data: buildHmtxTable(bold) },
    { tag: "loca", data: loca },
    { tag: "maxp", data: buildMaxpTable() },
    { tag: "name", data: name },
    { tag: "post", data: post },
  ];

  const headerSize = 12 + tables.length * 16;
  let totalSize = headerSize;
  for (const tbl of tables) {
    totalSize += alignToFourBytes(tbl.data.length);
  }

  const out = Buffer.alloc(totalSize);
  out.writeUInt32BE(0x00_01_00_00, 0);
  out.writeUInt16BE(tables.length, 4);
  out.writeUInt16BE(128, 6);
  out.writeUInt16BE(3, 8);
  out.writeUInt16BE(tables.length * 16 - 128, 10);

  let currentOffset = headerSize;
  for (let i = 0; i < tables.length; i++) {
    const tbl = tables[i];
    if (!tbl) {
      continue;
    }
    const dirOffset = 12 + i * 16;
    out.write(tbl.tag, dirOffset, 4, "ascii");
    out.writeUInt32BE(computeSfntChecksum(tbl.data), dirOffset + 4);
    out.writeUInt32BE(currentOffset, dirOffset + 8);
    out.writeUInt32BE(tbl.data.length, dirOffset + 12);
    tbl.data.copy(out, currentOffset);
    currentOffset += alignToFourBytes(tbl.data.length);
  }

  return out;
}

export function buildVietnameseToUnicodeCMap(texts: string[]): string {
  const uniqueCodePoints = new Set<number>();
  for (const text of texts) {
    for (let i = 0; i < text.length; i++) {
      uniqueCodePoints.add(text.charCodeAt(i));
    }
  }
  const sortedPoints = [...uniqueCodePoints]
    .filter((cp) => cp >= 0x20 && cp <= 0xff_ff)
    .sort((a, b) => a - b);

  const bfCharChunks: string[] = [];
  for (let i = 0; i < sortedPoints.length; i += 100) {
    const slice = sortedPoints.slice(i, i + 100);
    const lines = slice.map((cp) => {
      const hex = cp.toString(16).toUpperCase().padStart(4, "0");
      return `<${hex}> <${hex}>`;
    });
    bfCharChunks.push(`${slice.length} beginbfchar`, ...lines, "endbfchar");
  }

  return [
    "/CIDInit /ProcSet findresource begin",
    "12 dict begin",
    "begincmap",
    "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
    "/CMapName /MindKid-Vietnamese-UCS def",
    "/CMapType 2 def",
    "1 begincodespacerange",
    "<0000> <FFFF>",
    "endcodespacerange",
    "6 beginbfrange",
    "<0020> <007E> <0020>",
    "<00A0> <00FF> <00A0>",
    "<0100> <017F> <0100>",
    "<01A0> <01B0> <01A0>",
    "<1EA0> <1EF9> <1EA0>",
    "<2013> <2026> <2013>",
    "endbfrange",
    ...bfCharChunks,
    "endcmap",
    "CMapName currentdict /CMap defineresource pop",
    "end",
    "end",
  ].join("\n");
}

function parseToUnicodeMap(pdfText: string): Map<number, number> {
  const mapping = new Map<number, number>();
  const rangeRegex =
    /<([0-9A-Fa-f]{4})>\s+<([0-9A-Fa-f]{4})>\s+<([0-9A-Fa-f]{4})>/g;
  for (const match of pdfText.matchAll(rangeRegex)) {
    const start = Number.parseInt(match[1] ?? "0", 16);
    const end = Number.parseInt(match[2] ?? "0", 16);
    const dstStart = Number.parseInt(match[3] ?? "0", 16);
    for (let cid = start; cid <= end; cid++) {
      mapping.set(cid, dstStart + (cid - start));
    }
  }
  const charRegex = /<([0-9A-Fa-f]{4})>\s+<([0-9A-Fa-f]{4})>/g;
  for (const match of pdfText.matchAll(charRegex)) {
    const cid = Number.parseInt(match[1] ?? "0", 16);
    const unicode = Number.parseInt(match[2] ?? "0", 16);
    mapping.set(cid, unicode);
  }
  return mapping;
}

export function extractTextFromPdf(pdfBuffer: Buffer): string {
  const pdfText = pdfBuffer.toString("latin1");
  const unicodeMap = parseToUnicodeMap(pdfText);
  const tjRegex = /<([0-9A-Fa-f]+)>\s*Tj/g;
  const decodedLines: string[] = [];

  for (const match of pdfText.matchAll(tjRegex)) {
    const hex = match[1] ?? "";
    let decoded = "";
    for (let i = 0; i + 3 < hex.length; i += 4) {
      const cid = Number.parseInt(hex.slice(i, i + 4), 16);
      const codePoint = unicodeMap.get(cid) ?? cid;
      decoded += String.fromCharCode(codePoint);
    }
    if (decoded.length > 0) {
      decodedLines.push(decoded);
    }
  }

  return decodedLines.join("\n");
}
