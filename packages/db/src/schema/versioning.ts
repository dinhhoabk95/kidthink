import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { unique, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Bộ ba ràng buộc "content có version": nhiều dòng cùng khoá tự nhiên
 * (code/slug), một dòng mỗi contentVersion, tối đa một dòng published mỗi
 * khoá. Tên truyền tường minh — không suy ra — vì các bảng gọi không theo
 * một quy ước đặt tên chung (code vs slug), và tên suy sai sẽ sinh migration
 * đổi tên giả.
 */
export function versioningConstraints(params: {
  uniqueName: string;
  publishedIndexName: string;
  keyColumn: AnyPgColumn;
  versionColumn: AnyPgColumn;
  statusColumn: AnyPgColumn;
}) {
  return [
    unique(params.uniqueName).on(params.keyColumn, params.versionColumn),
    uniqueIndex(params.publishedIndexName)
      .on(params.keyColumn)
      .where(sql`${params.statusColumn} = 'published'`),
  ];
}
