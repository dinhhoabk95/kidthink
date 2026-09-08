import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALLOWED_EVENT_NAMES, EVENT_PAYLOAD_FIELDS } from "#src/events/catalog";

/**
 * Cổng hợp đồng event của game engine (Task #260 I2/I3).
 *
 * `GameEngine.emitEvent` và `GameSession.recordEvent` nhận tên event dạng chuỗi
 * tự do. Cổng `event-catalog` chỉ đối chiếu `template.events` khai báo trong
 * manifest, nên tên/field phát THẬT trong mã engine không có ai đo:
 *  - tên ngoài `ALLOWED_EVENT_NAMES` -> `validateBatchPayload` throw, cả lô
 *    50 event bị 400 và mất.
 *  - field thiếu -> `.partial()` của `cleanEventPayload` che.
 *  - field lạ -> `cleanEventPayload` bỏ im lặng.
 */

const ENGINE_SRC = path.resolve(
  import.meta.dirname,
  "../../../game-engine/src"
);

const EMIT_EVENT_NAME_REGEX = /event_name:\s*"([a-z0-9_]+)"/g;
const RECORD_EVENT_REGEX = /recordEvent\(\s*"([a-z0-9_]+)"/g;
const PAYLOAD_KEY_REGEX = /^\s*([a-z0-9_]+)\s*(?::|,\s*$|$)/;

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

function collectEmittedNames(): Map<string, string[]> {
  const byName = new Map<string, string[]>();
  for (const file of listSourceFiles(ENGINE_SRC)) {
    const src = fs.readFileSync(file, "utf8");
    const rel = path.relative(ENGINE_SRC, file);
    for (const regex of [EMIT_EVENT_NAME_REGEX, RECORD_EVENT_REGEX]) {
      regex.lastIndex = 0;
      let match = regex.exec(src);
      while (match) {
        const name = match[1] ?? "";
        byName.set(name, [...(byName.get(name) ?? []), rel]);
        match = regex.exec(src);
      }
    }
  }
  return byName;
}

/** Cắt object literal của `data:` ngay sau một `event_name` đã tìm thấy. */
function extractDataKeys(src: string, fromIndex: number): string[] | null {
  const dataAt = src.indexOf("data:", fromIndex);
  if (dataAt < 0) {
    return null;
  }
  // `data:` phải nằm trong cùng object literal — chặn ở dấu `}` gần nhất.
  const closeAt = src.indexOf("});", fromIndex);
  if (closeAt >= 0 && dataAt > closeAt) {
    return null;
  }
  const open = src.indexOf("{", dataAt);
  if (open < 0) {
    return null;
  }
  let depth = 0;
  let end = src.length;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") {
      depth += 1;
    } else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = src.slice(open + 1, end);
  // Bắt cả `key: value` và shorthand `key,` — bỏ shorthand thì cổng báo thiếu
  // field ảo, và ca âm mất giá trị.
  return body
    .split("\n")
    .map((line) => PAYLOAD_KEY_REGEX.exec(line)?.[1] ?? "")
    .filter((key) => key.length > 0);
}

describe("Hợp đồng event của game engine (Task #260)", () => {
  it("mọi event_name/recordEvent trong engine đều nằm trong ALLOWED_EVENT_NAMES", () => {
    const emitted = collectEmittedNames();
    expect(emitted.size).toBeGreaterThan(5);

    const unknown = [...emitted.entries()]
      .filter(([name]) => !ALLOWED_EVENT_NAMES.has(name))
      .map(([name, files]) => `${name} (${files.join(", ")})`);

    expect(
      unknown,
      `Engine phát event ngoài catalog — validateBatchPayload sẽ throw và mất cả lô: ${unknown.join("; ")}`
    ).toEqual([]);
  });

  it("Ca âm: tên lạ Cấm — NEVER lọt qua allowlist", () => {
    expect(ALLOWED_EVENT_NAMES.has("hint_escalated")).toBe(false);
    expect(ALLOWED_EVENT_NAMES.has("skip_suggested")).toBe(false);
  });

  it("payload của emitEvent trong core.ts dùng đúng tập field của catalog", () => {
    const corePath = path.join(ENGINE_SRC, "core.ts");
    const src = fs.readFileSync(corePath, "utf8");
    const problems: string[] = [];

    EMIT_EVENT_NAME_REGEX.lastIndex = 0;
    let match = EMIT_EVENT_NAME_REGEX.exec(src);
    while (match) {
      const name = match[1] ?? "";
      const allowed = EVENT_PAYLOAD_FIELDS[name];
      const keys = extractDataKeys(src, match.index);
      if (allowed && keys) {
        for (const key of keys) {
          if (!allowed.has(key)) {
            problems.push(`${name}: field lạ \`${key}\` sẽ bị bỏ im lặng`);
          }
        }
        for (const required of allowed) {
          if (!keys.includes(required)) {
            problems.push(`${name}: thiếu field \`${required}\``);
          }
        }
      }
      match = EMIT_EVENT_NAME_REGEX.exec(src);
    }

    expect(problems, problems.join("; ")).toEqual([]);
  });
});
