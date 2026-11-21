import { bigint, timestamp } from "drizzle-orm/pg-core";

export function idPk() {
  return bigint("id", { mode: "number" })
    .primaryKey()
    .generatedAlwaysAsIdentity();
}

export function timestamps() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  };
}

/**
 * Timestamps cho bảng INSERT-only (`audit_logs`, `consent_logs`, `telemetry_events`):
 * giữ đủ `created_at` và `updated_at` theo `BR-DM-08`, nhưng không gắn `$onUpdate`
 * để tác vụ ẩn danh hoá cột được phép (`telemetry_events.child_uuid = NULL`) không
 * tự động chạm `updated_at`.
 */
export function insertOnlyTimestamps() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  };
}
