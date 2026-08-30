import fs from "node:fs";
import path from "node:path";

/**
 * Database riêng cho test — tách khỏi database dev.
 *
 * Bộ integration test ghi thật vào PostgreSQL (`BR-TST-02`) và trước đây dùng
 * đúng database mà `pnpm dev` đang phục vụ. Hệ quả đo được 2026-08-30: sau một
 * lượt `pnpm test`, `game_levels` có 1.283 dòng trong khi seed chỉ tạo 166 —
 * 1.117 dòng còn lại là fixture của test, và trang `/games` hiển thị chúng cho
 * người dùng. Việc dọn thì có (`truncateAllTestTables`) nhưng nằm sau cờ
 * `DB_TRUNCATE_ON_SETUP` mặc định tắt, vì bật lên sẽ xoá luôn dữ liệu dev.
 *
 * Có database riêng thì cả hai vấn đề biến mất cùng lúc: test không thấy dữ
 * liệu dev, và dọn sạch trước mỗi lượt chạy là chuyện đương nhiên.
 *
 * Tên suy ra bằng cách thêm hậu tố vào database hiện tại, không thêm biến môi
 * trường mới: một tên nữa trong `env-contract.ts` là một chỗ nữa để quên khai
 * lúc lên máy chủ.
 */
export const TEST_DATABASE_SUFFIX = "_test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const LEADING_SLASH = /^\//;
const SURROUNDING_QUOTES = /^["']|["']$/g;

const DEV_FALLBACK_OWNER_URL =
  "postgresql://postgres:postgres@localhost:5433/mindkid";
const DEV_FALLBACK_APP_URL =
  "postgresql://mindkid_app:mindkid_app_password@localhost:5433/mindkid";

/** Đổi tên database trong một URL, giữ nguyên mọi thứ còn lại. */
export function withDatabaseName(url: string, name: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${name}`;
  return parsed.toString();
}

export function databaseNameOf(url: string): string {
  return new URL(url).pathname.replace(LEADING_SLASH, "");
}

/** `mindkid` → `mindkid_test`; đã có hậu tố thì giữ nguyên. */
export function toTestDatabaseUrl(url: string): string {
  const name = databaseNameOf(url);
  if (name.endsWith(TEST_DATABASE_SUFFIX)) {
    return url;
  }
  return withDatabaseName(url, `${name}${TEST_DATABASE_SUFFIX}`);
}

/** Đọc một biến từ `.env` ở gốc repo mà không nạp cả file vào `process.env`. */
function readRepoEnv(name: string): string | undefined {
  const envPath = path.join(REPO_ROOT, ".env");
  if (!fs.existsSync(envPath)) {
    return undefined;
  }
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1 || trimmed.slice(0, eq).trim() !== name) {
      continue;
    }
    return trimmed
      .slice(eq + 1)
      .trim()
      .replace(SURROUNDING_QUOTES, "");
  }
  return undefined;
}

export interface TestDatabaseUrls {
  readonly owner: string;
  readonly app: string;
}

export function testDatabaseUrls(): TestDatabaseUrls {
  const owner =
    process.env.DATABASE_URL ??
    readRepoEnv("DATABASE_URL") ??
    DEV_FALLBACK_OWNER_URL;
  const app =
    process.env.DATABASE_URL_APP ??
    readRepoEnv("DATABASE_URL_APP") ??
    DEV_FALLBACK_APP_URL;
  return {
    owner: toTestDatabaseUrl(owner),
    app: toTestDatabaseUrl(app),
  };
}

/** URL tới database bảo trì `postgres` cùng máy chủ — để `CREATE DATABASE`. */
export function maintenanceDatabaseUrl(ownerUrl: string): string {
  return withDatabaseName(ownerUrl, "postgres");
}
