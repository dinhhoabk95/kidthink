import { describe, expect, it } from "vitest";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ALL_TEMPLATES } from "#src/generated/template-registry";
import { CONTENT_PACK_WITH_SECOND_NARRATION_SOURCE } from "./fixtures/turn-script-violations.js";

/**
 * Bậc thang của `BR-ETS-04`: **lời đọc đề** đến từ một trường duy nhất, và
 * trường đó là `game_levels.instruction_audio_path` ở cấp vòng.
 *
 * `content_pack` cấm — NEVER khai lại một đường âm thanh **cho chính lời đề**.
 * Một trường soạn được mà không ai đọc là một trường luôn rỗng: người soạn nội
 * dung điền vào đó thì trẻ không nghe thấy gì và không có gì báo cho họ biết.
 * Đó là cách `prompt_audio_ref` (36/37 contract, 0 nơi đọc) và
 * `audio_prompt.audio_url` của `GT-018` đã tồn tại trước Task #262.
 *
 * KHÔNG thuộc luật này: âm thanh **của từng chất liệu** — `GT-000` đọc tên vật
 * qua `assets[].audio_path` và `GT000Session` thật sự phát nó. Đó là kênh khác
 * với lời đọc đề, và nó có người đọc.
 */
const DEAD_NARRATION_FIELDS = ["prompt_audio_ref", "audio_url"] as const;
/**
 * Trường bị cấm là trường **trỏ tới một tệp âm** cho lời đề: tên vừa mang
 * `prompt`/`instruction`, vừa mang `audio`, vừa mang `ref`/`url`/`path`/`src`.
 * `GT-018.audio_prompt` chỉ mang **chữ** của lời nghe nên không thuộc luật này.
 */
const NARRATION_FILE_FIELD_REGEX =
  /(?=.*(?:prompt|instruction))(?=.*audio)(?=.*(?:ref|url|path|src|file))/i;

function isBannedNarrationField(field: string): boolean {
  return (
    DEAD_NARRATION_FIELDS.includes(
      field as (typeof DEAD_NARRATION_FIELDS)[number]
    ) || NARRATION_FILE_FIELD_REGEX.test(field)
  );
}

function collectPropertyNames(node: unknown, acc: Set<string>): void {
  if (!node || typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      collectPropertyNames(child, acc);
    }
    return;
  }
  const record = node as Record<string, unknown>;
  const properties = record.properties;
  if (properties && typeof properties === "object") {
    for (const key of Object.keys(properties as Record<string, unknown>)) {
      acc.add(key);
    }
  }
  for (const value of Object.values(record)) {
    collectPropertyNames(value, acc);
  }
}

function contentPackFields(code: string): Set<string> {
  const template = ALL_TEMPLATES[code];
  if (!template) {
    throw new Error(`Không có engine ${code} trong registry`);
  }
  const jsonSchema = zodToJsonSchema(template.content_contract, {
    $refStrategy: "none",
  });
  const fields = new Set<string>();
  collectPropertyNames(jsonSchema, fields);
  return fields;
}

describe("BR-ETS-04 — một nguồn lời đọc duy nhất", () => {
  it("không contract nội dung nào của 37 engine khai thêm một trường lời đọc thứ hai", () => {
    const codes = Object.keys(ALL_TEMPLATES);
    expect(codes.length).toBe(37);

    const offenders: string[] = [];
    for (const code of codes) {
      for (const field of contentPackFields(code)) {
        if (isBannedNarrationField(field)) {
          offenders.push(`${code}.${field}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("âm thanh của từng chất liệu vẫn hợp lệ: GT-000 giữ assets[].audio_path", () => {
    expect(contentPackFields("GT-000").has("audio_path")).toBe(true);
    expect(isBannedNarrationField("audio_path")).toBe(false);
  });

  it("ca âm: contract khai lại trường lời đọc thứ hai thì phép kiểm đỏ", () => {
    const fields = new Set<string>();
    collectPropertyNames(CONTENT_PACK_WITH_SECOND_NARRATION_SOURCE, fields);

    const offenders = [...fields].filter(isBannedNarrationField).sort();

    expect(offenders).toEqual([
      "audio_url",
      "instruction_audio_ref",
      "prompt_audio_ref",
    ]);
  });
});
