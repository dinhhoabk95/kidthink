import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoPath } from "@mindkid/config/paths";

export interface EngineTurnViolation {
  readonly templateCode?: string;
  readonly file?: string;
  readonly rule: string;
  readonly message: string;
}

export interface EngineTurnGateResult {
  readonly totalSpecs: number;
  readonly violations: readonly EngineTurnViolation[];
}

export interface ScanEngineTurnGateOptions {
  readonly specsDir?: string;
  /** Danh sách mã engine phải có phiếu. Cổng đối chiếu với nó nên thư mục rỗng là ĐỎ. */
  readonly readyCodesPath?: string;
}

const SECTION_4_HEADER_REGEX = /##\s*4\.\s*Main flow/i;
const SECTION_5_HEADER_REGEX = /##\s*5\.\s*Alternative flows/i;
const SECTION_6_HEADER_REGEX = /##\s*6\.\s*Business rules/i;

const TEMPLATE_CODE_REGEX = /GT-\d{3}/;
const N_INVALID_BEATS_REGEX = /\bN([8-9]|\d{2,})\b/g;
const N_BEATS_REGEX = /\bN([1-7])\b/g;
const L1_REGEX = /\bL1\b/;
const L2_REGEX = /\bL2\b/;
const L3_REGEX = /\bL3\b/;
/** Trường lời đọc còn sống sau khi `prompt_audio_ref` bị khai tử (`BR-ETS-04`). */
const LIVE_NARRATION_FIELD = "instruction_audio_path";
const LIVE_NARRATION_FIELD_REGEX = /instruction_audio_path/;
/**
 * Các trường lời đọc đã khai tử — phiếu trỏ vào đây là dẫn người soạn vào chỗ câm.
 * So khớp theo **định danh trọn vẹn**: `instruction_audio_url` của payload không
 * phải là `audio_url` của `content_pack`.
 */
const DEAD_NARRATION_FIELDS = [
  {
    name: "prompt_audio_ref",
    pattern: /(?<![A-Za-z0-9_])prompt_audio_ref(?![A-Za-z0-9_])/,
  },
  { name: "audio_url", pattern: /(?<![A-Za-z0-9_])audio_url(?![A-Za-z0-9_])/ },
] as const;
const VISUAL_CHANNEL_REGEX = /kênh hình|thị giác|\bhình ảnh\b|\bkhung hình\b/i;
const HINH_WORD_REGEX = /\bhình\b/i;
const MAN_HINH_REGEX = /màn hình/i;
const CHANGE_WORD_REGEX = /đổi|khác|seed|mới|làm mới/i;
const KEEP_WORD_REGEX = /giữ|nguyên|bằng|cố định/i;

const BANNED_BOILERPLATE_SUBSTRINGS = [
  "Trẻ tương tác theo cơ chế",
  "Phản hồi thị giác theo trạng thái",
  "setupEntities() khởi tạo trạng thái",
] as const;

const REQUIRED_M5_BRANCHES = [
  {
    id: 1,
    name: "Thao tác sai, còn lượt",
    pattern: /thao tác sai.*còn lượt/i,
  },
  {
    id: 2,
    name: "Thao tác sai, hết lượt",
    pattern: /thao tác sai.*hết lượt/i,
  },
  {
    id: 3,
    name: "Trẻ dừng lại, không thao tác",
    pattern: /trẻ dừng lại/i,
  },
  {
    id: 4,
    name: "Không nghe được lời đọc",
    pattern: /không nghe được lời đọc/i,
  },
  {
    id: 5,
    name: "Asset hỏng",
    pattern: /asset hỏng/i,
  },
  {
    id: 6,
    name: "Thiết bị yếu hoặc prefers-reduced-motion",
    pattern: /thiết bị yếu|prefers-reduced-motion/i,
  },
  {
    id: 7,
    name: "Bỏ dở giữa lượt",
    pattern: /bỏ dở/i,
  },
  {
    id: 8,
    name: "Chơi lại lần thứ n",
    pattern: /chơi lại lần thứ n/i,
  },
] as const;

const MIN_BEAT_LENGTH = 30;
const MD_EXTENSION_REGEX = /\.md$/;

interface SpecSections {
  readonly m4Content: string;
  readonly m5Content: string;
}

function extractSections(specContent: string): SpecSections | null {
  const s4Idx = specContent.search(SECTION_4_HEADER_REGEX);
  const s5Idx = specContent.search(SECTION_5_HEADER_REGEX);
  const s6Idx = specContent.search(SECTION_6_HEADER_REGEX);

  if (s4Idx === -1 || s5Idx === -1 || s5Idx <= s4Idx) {
    return null;
  }

  const m4Content = specContent.slice(s4Idx, s5Idx);
  const m5Content =
    s6Idx !== -1 && s6Idx > s5Idx
      ? specContent.slice(s5Idx, s6Idx)
      : specContent.slice(s5Idx);

  return { m4Content, m5Content };
}

function checkBoilerplateAndInvalidBeats(
  m4Content: string,
  filename: string,
  templateCode?: string
): EngineTurnViolation[] {
  const violations: EngineTurnViolation[] = [];

  for (const banned of BANNED_BOILERPLATE_SUBSTRINGS) {
    if (m4Content.includes(banned)) {
      violations.push({
        templateCode,
        file: filename,
        rule: "BR-ETS-01",
        message: `Mục 4 còn chứa chuỗi bản sao bị cấm: "${banned}"`,
      });
    }
  }

  const invalidBeatsMatch = m4Content.match(N_INVALID_BEATS_REGEX);
  if (invalidBeatsMatch && invalidBeatsMatch.length > 0) {
    violations.push({
      templateCode,
      file: filename,
      rule: "BR-ETS-01",
      message: `Mục 4 cấm đặt nhịp thứ 8 trở lên: ${[...new Set(invalidBeatsMatch)].join(", ")}`,
    });
  }

  return violations;
}

interface FoundBeat {
  readonly beatNum: number;
  readonly index: number;
}

function collectFoundBeats(m4Content: string): FoundBeat[] {
  const beats: FoundBeat[] = [];
  const matches = m4Content.matchAll(N_BEATS_REGEX);
  for (const match of matches) {
    const rawNum = match[1];
    if (rawNum !== undefined && match.index !== undefined) {
      beats.push({
        beatNum: Number.parseInt(rawNum, 10),
        index: match.index,
      });
    }
  }
  return beats;
}

function checkBeatPresenceAndOrder(
  foundBeats: readonly FoundBeat[],
  filename: string,
  templateCode?: string
): EngineTurnViolation[] {
  const violations: EngineTurnViolation[] = [];
  const presentNums = new Set(foundBeats.map((b) => b.beatNum));

  for (let i = 1; i <= 7; i++) {
    if (!presentNums.has(i)) {
      violations.push({
        templateCode,
        file: filename,
        rule: "BR-ETS-01",
        message: `Mục 4 thiếu nhịp bắt buộc: N${i}`,
      });
    }
  }

  // Chỉ lần xuất hiện ĐẦU TIÊN của mỗi nhịp mới định thứ tự. Nhắc lại `N3` trong
  // thân `N5` là văn xuôi hợp lệ, không phải nhịp đặt sai chỗ.
  const firstOccurrences: number[] = [];
  const seen = new Set<number>();
  for (const beat of foundBeats) {
    if (!seen.has(beat.beatNum)) {
      seen.add(beat.beatNum);
      firstOccurrences.push(beat.beatNum);
    }
  }

  let orderCorrect = true;
  for (let i = 0; i < firstOccurrences.length; i++) {
    if (firstOccurrences[i] !== i + 1) {
      orderCorrect = false;
      break;
    }
  }

  if (firstOccurrences.length > 0 && !orderCorrect) {
    violations.push({
      templateCode,
      file: filename,
      rule: "BR-ETS-01",
      message:
        "Bảy nhịp N1..N7 trong Mục 4 không xuất hiện đúng thứ tự từ 1 đến 7",
    });
  }

  return violations;
}

function validateBeat2(
  beatText: string,
  filename: string,
  templateCode?: string
): EngineTurnViolation[] {
  const violations: EngineTurnViolation[] = [];
  const hasLiveNarrationField = LIVE_NARRATION_FIELD_REGEX.test(beatText);
  const hasVisual =
    VISUAL_CHANNEL_REGEX.test(beatText) ||
    (HINH_WORD_REGEX.test(beatText) && !MAN_HINH_REGEX.test(beatText));
  if (!hasLiveNarrationField) {
    violations.push({
      templateCode,
      file: filename,
      rule: "BR-PNR-04",
      message: `Nhịp N2 phải phát câu dẫn ở nhịp mở vòng qua trường lời đọc \`${LIVE_NARRATION_FIELD}\``,
    });
  }
  if (!hasVisual) {
    violations.push({
      templateCode,
      file: filename,
      rule: "BR-ETS-04",
      message: "Nhịp N2 phải nêu kênh hình song song cho lời đọc",
    });
  }
  return violations;
}

function validateBeatContent(
  beatNum: number,
  beatText: string,
  filename: string,
  templateCode?: string
): EngineTurnViolation[] {
  const violations: EngineTurnViolation[] = [];

  if (beatText.length < MIN_BEAT_LENGTH) {
    violations.push({
      templateCode,
      file: filename,
      rule: "BR-ETS-01",
      message: `Nhịp N${beatNum} quá ngắn (${beatText.length} ký tự, tối thiểu ${MIN_BEAT_LENGTH})`,
    });
  }

  if (beatNum === 2) {
    violations.push(...validateBeat2(beatText, filename, templateCode));
  }

  if (beatNum === 5) {
    const hasAllLevels =
      L1_REGEX.test(beatText) &&
      L2_REGEX.test(beatText) &&
      L3_REGEX.test(beatText);
    if (!hasAllLevels) {
      violations.push({
        templateCode,
        file: filename,
        rule: "BR-ETS-08",
        message:
          "Nhịp N5 phải nêu đầy đủ cả ba cấp trợ giúp L1, L2, L3 cụ thể của engine",
      });
    }
  }

  if (beatNum === 7) {
    const hasChangeAndKeep =
      CHANGE_WORD_REGEX.test(beatText) && KEEP_WORD_REGEX.test(beatText);
    if (!hasChangeAndKeep) {
      violations.push({
        templateCode,
        file: filename,
        rule: "BR-ETS-10",
        message:
          "Nhịp N7 phải nêu rõ cái gì đổi theo seed mới và cái gì giữ nguyên",
      });
    }
  }

  return violations;
}

function checkM5AlternativeFlows(
  m5Content: string,
  filename: string,
  templateCode?: string
): EngineTurnViolation[] {
  const violations: EngineTurnViolation[] = [];
  const rows = m5Content
    .trim()
    .split("\n")
    .filter(
      (line) =>
        line.trim().startsWith("|") &&
        !line.includes("---") &&
        !line.includes("Nhánh")
    );

  if (rows.length < 8) {
    violations.push({
      templateCode,
      file: filename,
      rule: "BR-ETS-11",
      message: `Mục 5 phải có ít nhất 8 hàng đánh số cho các nhánh (hiện có ${rows.length})`,
    });
  }

  for (const branch of REQUIRED_M5_BRANCHES) {
    if (!branch.pattern.test(m5Content)) {
      violations.push({
        templateCode,
        file: filename,
        rule: "BR-ETS-11",
        message: `Mục 5 thiếu nhánh bắt buộc: "${branch.name}"`,
      });
    }
  }

  return violations;
}

export function lintSingleTurnSpec(
  specContent: string,
  filename = "unknown"
): readonly EngineTurnViolation[] {
  const templateCodeMatch = filename.match(TEMPLATE_CODE_REGEX);
  const templateCode = templateCodeMatch ? templateCodeMatch[0] : undefined;

  const sections = extractSections(specContent);
  if (!sections) {
    return [
      {
        templateCode,
        file: filename,
        rule: "BR-ETS-01",
        message: "Không tìm thấy cấu trúc Mục 4 (Main flow) hợp lệ",
      },
    ];
  }

  const { m4Content, m5Content } = sections;
  const violations: EngineTurnViolation[] = [];

  violations.push(
    ...checkBoilerplateAndInvalidBeats(m4Content, filename, templateCode)
  );

  const foundBeats = collectFoundBeats(m4Content);
  violations.push(
    ...checkBeatPresenceAndOrder(foundBeats, filename, templateCode)
  );

  // Một nhịp được chấm theo lần xuất hiện đầu tiên của nó, kéo dài tới lần xuất
  // hiện đầu tiên của nhịp kế tiếp. Nhắc lại nhịp cũ giữa văn xuôi không cắt đoạn.
  const firstIndexByBeat = new Map<number, number>();
  for (const beat of foundBeats) {
    if (!firstIndexByBeat.has(beat.beatNum)) {
      firstIndexByBeat.set(beat.beatNum, beat.index);
    }
  }
  const orderedBeats = [...firstIndexByBeat.entries()].sort(
    (a, b) => a[1] - b[1]
  );

  for (let i = 0; i < orderedBeats.length; i++) {
    const cur = orderedBeats[i];
    if (!cur) {
      continue;
    }
    const next = orderedBeats[i + 1];
    const beatText = m4Content
      .slice(cur[1], next ? next[1] : m4Content.length)
      .trim();

    violations.push(
      ...validateBeatContent(cur[0], beatText, filename, templateCode)
    );
  }

  violations.push(
    ...checkM5AlternativeFlows(m5Content, filename, templateCode)
  );

  for (const dead of DEAD_NARRATION_FIELDS) {
    if (dead.pattern.test(specContent)) {
      violations.push({
        templateCode,
        file: filename,
        rule: "BR-PNR-03",
        message: `Phiếu còn trỏ vào trường lời đọc song song hoặc đã khai tử \`${dead.name}\`; câu dẫn của vòng chỉ lấy từ đúng một trường \`${LIVE_NARRATION_FIELD}\` (BR-PNR-03)`,
      });
    }
  }

  return violations;
}

/**
 * Mã engine phải có phiếu. Cổng đọc danh sách này thay vì tin thư mục: thư mục
 * đổi tên hay rỗng thì cổng phải ĐỎ, không được xanh vì không quét được gì.
 */
function readRequiredCodes(readyCodesPath: string): readonly string[] {
  if (!existsSync(readyCodesPath)) {
    return [];
  }
  const parsed: unknown = JSON.parse(readFileSync(readyCodesPath, "utf-8"));
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter((code): code is string => typeof code === "string");
}

export function scanEngineTurnGate(
  options: ScanEngineTurnGateOptions = {}
): EngineTurnGateResult {
  const specsDir =
    options.specsDir ?? repoPath("docs/specs/01-platform/engines");
  const readyCodesPath =
    options.readyCodesPath ??
    repoPath("packages/game-engine/config/engine-spec-ready.json");

  const files = readdirSync(specsDir)
    .filter((f) => f.startsWith("GT-") && f.endsWith(".md"))
    .sort();

  const allViolations: EngineTurnViolation[] = [];

  const requiredCodes = readRequiredCodes(readyCodesPath);
  if (requiredCodes.length === 0) {
    allViolations.push({
      file: readyCodesPath,
      rule: "BR-ETS-01",
      message:
        "Không đọc được danh sách mã engine bắt buộc; cổng từ chối chạy trên tập rỗng",
    });
  }

  const scannedCodes = new Set(
    files
      .map((f) => f.replace(MD_EXTENSION_REGEX, ""))
      .filter((c) => c !== "TEMPLATE")
  );
  for (const code of requiredCodes) {
    if (!scannedCodes.has(code)) {
      allViolations.push({
        templateCode: code,
        file: `${code}.md`,
        rule: "BR-ETS-01",
        message: `Mã ${code} có trong engine-spec-ready.json nhưng không quét được phiếu trong ${specsDir}`,
      });
    }
  }

  for (const file of files) {
    const fullPath = join(specsDir, file);
    const content = readFileSync(fullPath, "utf-8");
    const violations = lintSingleTurnSpec(content, file);
    allViolations.push(...violations);
  }

  return {
    totalSpecs: files.length,
    violations: allViolations,
  };
}

export function formatEngineTurnReport(result: EngineTurnGateResult): string {
  const lines: string[] = [];
  lines.push("=== CỔNG CHECK:ENGINE-TURN (Task #262) ===");
  lines.push(`Tổng số spec đã quét: ${result.totalSpecs}`);
  lines.push(`Số vi phạm: ${result.violations.length}`);

  if (result.violations.length === 0) {
    lines.push(
      `✓ Tất cả ${result.totalSpecs} phiếu engine đạt chuẩn kịch bản lượt chơi (N1..N7, 8 nhánh).`
    );
  } else {
    lines.push("\nDanh sách vi phạm:");
    for (const v of result.violations) {
      lines.push(
        `  - [${v.rule}] ${v.file || v.templateCode || "spec"}: ${v.message}`
      );
    }
  }

  return lines.join("\n");
}
