import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import { AppError } from "#src/base";
import { ERROR_CODES } from "#src/codes";
import { ModelNotFoundError } from "#src/model";
import {
  ERROR_REGISTRY,
  errorCodes,
  MODEL_ERROR_REGISTRY,
} from "#src/registry";

/**
 * Cổng `BR-ERR-01` — "mã lỗi đăng ký ở §7 **trước khi dùng**".
 *
 * Đây là bản cưỡng chế duy nhất của quy tắc đó. Trước bản này, 18 mã đang chạy
 * trong production KHÔNG có dòng nào trong spec; cổng nào cũng xanh.
 */

const SPEC_PATH = "docs/specs/00-foundation/error-codes.md";
const SPEC_ROW = /^\|\s*`([A-Z][A-Z0-9_]*)`\s*\|\s*(\d{3})\s*\|/gm;

function specCodes(): ReadonlyMap<string, number> {
  const markdown = fs.readFileSync(repoPath(SPEC_PATH), "utf8");
  return new Map(
    [...markdown.matchAll(SPEC_ROW)].map((row) => [
      String(row[1]),
      Number(row[2]),
    ])
  );
}

/**
 * Mã đã có trong spec §7 nhưng **chưa cài lớp**. Đây là tồn đọng có chủ đích:
 * spec chốt trước, code theo sau. Danh sách phải khớp **chính xác** — mã mới rơi
 * vào đây phải là một quyết định nhìn thấy được, ❌ NEVER trôi vào im lặng.
 */
const PENDING_SPEC_CODES: readonly string[] = [];

/**
 * Lệch status giữa code và spec. Toàn bộ mã đã khớp.
 */
const KNOWN_STATUS_MISMATCH: readonly string[] = [];

describe("registry mã lỗi ↔ spec §7", () => {
  it("BR-ERR-01: mọi mã đã cài đều có dòng trong bảng §7", () => {
    const spec = specCodes();
    const unregistered = errorCodes().filter((code) => !spec.has(code));

    expect(unregistered).toEqual([]);
  });

  it("mã có trong spec nhưng chưa cài khớp đúng danh sách tồn đọng", () => {
    const implemented = new Set(errorCodes());
    const pending = [...specCodes().keys()]
      .filter((code) => !implemented.has(code))
      .sort();

    expect(pending).toEqual([...PENDING_SPEC_CODES].sort());
  });

  it("HTTP status của code khớp spec, trừ danh sách lệch đã biết", () => {
    const spec = specCodes();
    const mismatched = [...ERROR_REGISTRY.values()]
      .filter((definition) => {
        const specStatus = spec.get(definition.code);
        return specStatus !== undefined && specStatus !== definition.status;
      })
      .map((definition) => definition.code)
      .sort();

    expect(mismatched).toEqual([...KNOWN_STATUS_MISMATCH].sort());
  });

  it("ERROR_CODES (union kiểu) khớp registry chạy động", () => {
    expect([...ERROR_CODES].sort()).toEqual([...errorCodes()].sort());
  });

  it("không mã nào khai ở hai domain (import registry đã ném nếu trùng)", () => {
    expect(ERROR_REGISTRY.size).toBe(errorCodes().length);
  });

  it("mọi lớp gắn model tham chiếu một mã đã đăng ký", () => {
    const orphan = MODEL_ERROR_REGISTRY.filter(
      (model) => !ERROR_REGISTRY.has(model.code)
    );

    expect(orphan).toEqual([]);
  });

  it("mọi mã có thông báo tiếng Việt không rỗng (BR-ERR-04)", () => {
    const blank = [...ERROR_REGISTRY.values()]
      .filter((definition) => definition.message.trim().length === 0)
      .map((definition) => definition.code);

    expect(blank).toEqual([]);
  });

  it("mọi status nằm trong dải HTTP lỗi hợp lệ", () => {
    const outOfRange = [...ERROR_REGISTRY.values()]
      .filter(
        (definition) =>
          definition.code !== "EVENT_DUPLICATE" &&
          (definition.status < 400 || definition.status > 599)
      )
      .map((definition) => `${definition.code}=${definition.status}`);

    expect(outOfRange).toEqual([]);
  });
});

describe("hình dạng lớp trong file domain", () => {
  it("mọi mã dựng được và là AppError", async () => {
    const domains = await import("#src/index");
    const constructed = [...ERROR_REGISTRY.values()].map((definition) => {
      const exported = Reflect.get(domains, definition.className);
      expect(typeof exported).toBe("function");
      return exported;
    });

    expect(constructed.length).toBe(ERROR_REGISTRY.size);
  });

  it("lớp gắn model dựng ra ModelNotFoundError với đúng model", async () => {
    const domains = await import("#src/index");

    for (const model of MODEL_ERROR_REGISTRY) {
      const Ctor = Reflect.get(domains, model.className);
      expect(typeof Ctor).toBe("function");
      if (typeof Ctor !== "function") {
        continue;
      }
      const instance: unknown = Reflect.construct(Ctor, ["key-1"]);
      expect(instance).toBeInstanceOf(ModelNotFoundError);
      expect(instance).toBeInstanceOf(AppError);
      if (instance instanceof ModelNotFoundError) {
        expect(instance.model).toBe(model.model);
        expect(instance.status).toBe(404);
        expect(JSON.stringify(instance.toResponse())).not.toContain(
          model.model
        );
      }
    }
  });
});
