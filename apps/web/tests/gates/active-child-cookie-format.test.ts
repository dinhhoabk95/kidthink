import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  scanActiveChildCookieAssignments,
  scanAppDirectoryForActiveChildCookieMutations,
  validateActiveChildCookieValue,
} from "./active-child-cookie-format.ts";

const ERR_COOKIE_MUTATION = /BR-PEN-01 VIOLATION/;

describe("Active Child Cookie Format & Gate Suite (T.5)", () => {
  it("validateActiveChildCookieValue chấp nhận UUID hợp lệ và từ chối số ID hoặc chuỗi bậy", () => {
    // Valid UUIDs
    expect(
      validateActiveChildCookieValue("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
    ).toBe(true);
    expect(
      validateActiveChildCookieValue("550E8400-E29B-41D4-A716-446655440000")
    ).toBe(true);

    // Negative cases: numeric id, empty, invalid format
    expect(validateActiveChildCookieValue("123")).toBe(false);
    expect(validateActiveChildCookieValue("1")).toBe(false);
    expect(validateActiveChildCookieValue("")).toBe(false);
    expect(validateActiveChildCookieValue(null)).toBe(false);
    expect(validateActiveChildCookieValue(undefined)).toBe(false);
    expect(validateActiveChildCookieValue("not-a-uuid")).toBe(false);
    expect(validateActiveChildCookieValue("bear")).toBe(false);
  });

  it("scanActiveChildCookieAssignments phát hiện và chặn khi có component client gán trực tiếp cookie active_child_id", () => {
    const cleanFiles = [
      {
        filePath: "apps/web/app/pages/me/index.vue",
        content: "const cookie = useCookie('active_child_id');",
      },
      {
        filePath: "apps/web/app/pages/me/children/index.vue",
        content:
          "$fetch('/api/users/children/' + uuid + '/activate', { method: 'POST' });",
      },
    ];

    expect(() => scanActiveChildCookieAssignments(cleanFiles)).not.toThrow();

    // RED negative fixture: direct cookie mutation
    const dirtyFiles = [
      {
        filePath: "apps/web/app/pages/me/index.vue",
        content: "useCookie('active_child_id').value = String(childId);",
      },
    ];

    expect(() => scanActiveChildCookieAssignments(dirtyFiles)).toThrowError(
      ERR_COOKIE_MUTATION
    );
  });

  it("toàn bộ thư mục apps/web/app không chứa lệnh ghi trực tiếp active_child_id cookie", () => {
    const appDir = path.resolve(import.meta.dirname, "../../app");
    expect(() =>
      scanAppDirectoryForActiveChildCookieMutations(appDir)
    ).not.toThrow();
  });
});
