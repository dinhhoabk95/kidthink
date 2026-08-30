import { requireEnv } from "@mindkid/config";
import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import {
  assertDisposableDatabaseUrl,
  TABLES,
  truncateAllTestTables,
} from "./global-setup.ts";

const DUPLICATE_KEY_ERROR = /duplicate key/i;

/**
 * Ca âm cho D-BX. Không mock — nối Postgres thật.
 *
 * Dùng một bảng scratch riêng (`_test_truncate_probe`), không đụng 47 bảng chia sẻ với
 * các integration test khác — tránh TRUNCATE bảng thật giữa lúc file khác đang chạy
 * song song (Vitest chạy nhiều file test cùng lúc theo mặc định).
 */
describe("global-setup: truncateAllTestTables", () => {
  const url = requireEnv("DATABASE_URL");
  const sql = postgres(url);
  const probeTable = `_test_truncate_probe_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

  it("BR-TST-05: refuses to truncate a non-loopback database", () => {
    expect(() =>
      assertDisposableDatabaseUrl(
        "postgres://postgres:postgres@db.example.invalid:5432/mindkid"
      )
    ).toThrow("loopback");
  });

  afterAll(async () => {
    await sql`drop table if exists ${sql(probeTable)}`;
    await sql.end();
  });

  it("ca âm — dữ liệu sót từ lần trước làm insert lặp lại dính duplicate key", async () => {
    await sql`create table if not exists ${sql(probeTable)} (
      id bigint generated always as identity primary key,
      code varchar(50) not null unique
    )`;
    await sql`insert into ${sql(probeTable)} (code) values ('DUP-CODE') on conflict do nothing`;

    // Mô phỏng đúng lỗi đã đo 2026-08-09: dòng "lần chạy trước" chưa dọn còn nằm đó.
    await expect(
      sql`insert into ${sql(probeTable)} (code) values ('DUP-CODE')`
    ).rejects.toThrow(DUPLICATE_KEY_ERROR);
  });

  /**
   * Cổng chống lệch cho D-BX. Danh sách TABLES viết tay từng đứng yên ở 56 tên
   * trong khi schema đã lên 78 — 22 bảng thêm sau không bao giờ được dọn và rác
   * cứ cộng dồn im lặng. Đối chiếu với `pg_tables` biến "quên thêm tên" thành
   * test đỏ ngay lần chạy đầu tiên sau khi thêm bảng.
   */
  it("TABLES phủ đúng mọi bảng trong schema public", async () => {
    const rows = await sql<{ tablename: string }[]>`
      select tablename from pg_tables
      where schemaname = 'public' and tablename not like '\\_test\\_%'
    `;
    const inDatabase = rows.map((row) => row.tablename).sort();
    const listed = [...TABLES].sort();

    expect(listed).toEqual(inDatabase);
  });

  it("sau truncateAllTestTables, bảng rỗng và identity reset về 1", async () => {
    await truncateAllTestTables(url, [probeTable]);

    const before = await sql`select count(*) c from ${sql(probeTable)}`;
    expect(Number(before[0]?.c)).toBe(0);

    // Cùng code vừa gây duplicate key ở test trên giờ insert được — chứng minh dọn thật.
    const [row] =
      await sql`insert into ${sql(probeTable)} (code) values ('DUP-CODE') returning id`;
    expect(Number(row?.id)).toBe(1);
  });
});
