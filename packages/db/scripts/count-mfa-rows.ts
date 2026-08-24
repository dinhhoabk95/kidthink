/**
 * Task #106 — Phép đo trước deploy.
 *
 * Đọc bảng mfa_settings, in số hàng theo account_type và số hàng đã
 * confirmed. Chỉ đọc, không ghi.
 *
 * Chạy: npx tsx packages/db/scripts/count-mfa-rows.ts
 */
import { sql } from "drizzle-orm";
import { getOwnerDb } from "#src/index";

const db = getOwnerDb();

const rows = await db.execute<{
  account_type: string;
  total: string;
  confirmed: string;
}>(sql`
  SELECT
    account_type,
    count(*)::text AS total,
    count(confirmed_at)::text AS confirmed
  FROM mfa_settings
  GROUP BY account_type
  ORDER BY account_type
`);

console.log("\n┌─────────────────────────────────────────────┐");
console.log("│  MFA Settings — count-mfa-rows (Task #106)  │");
console.log("├──────────────┬─────────┬────────────────────┤");
console.log("│ account_type │  total  │  confirmed_at ≠ ∅  │");
console.log("├──────────────┼─────────┼────────────────────┤");

if (rows.length === 0) {
  console.log("│  (no rows)   │    0    │         0          │");
} else {
  for (const row of rows) {
    const type = String(row.account_type).padEnd(12);
    const tot = String(row.total).padStart(5);
    const conf = String(row.confirmed).padStart(8);
    console.log(`│ ${type} │ ${tot}   │ ${conf}            │`);
  }
}

console.log("└──────────────┴─────────┴────────────────────┘\n");
process.exit(0);
