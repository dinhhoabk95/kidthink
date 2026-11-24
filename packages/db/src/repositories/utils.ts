import { type AnyColumn, and, gte, lte, or, type SQL, sql } from "drizzle-orm";

const LIKE_METACHARS_REGEX = /([%_\\])/g;

export interface PaginatedResult<TItem> {
  readonly items: readonly TItem[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasMore: boolean;
}

export interface CursorPaginatedResult<
  TItem,
  TCursor extends string | number = number,
> {
  readonly items: readonly TItem[];
  readonly nextCursor: TCursor | null;
  readonly hasMore: boolean;
  readonly limit: number;
}

export interface OffsetPaginationOptions<TItem> {
  readonly page?: number;
  readonly limit?: number;
  readonly defaultLimit: number;
  readonly maxLimit: number;
  readonly countQuery: () => Promise<number>;
  readonly rowsQuery: (
    limit: number,
    offset: number
  ) => Promise<readonly TItem[]>;
}

export interface CursorPaginationOptions<
  TItem,
  TCursor extends string | number,
> {
  readonly limit?: number;
  readonly defaultLimit: number;
  readonly maxLimit: number;
  readonly rowsQuery: (limitPlusOne: number) => Promise<readonly TItem[]>;
  readonly getCursor: (last: TItem) => TCursor;
}

export function uniq<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

export function toIdArray(value: number | readonly number[]): number[] {
  return typeof value === "number" ? [value] : uniq(value);
}

export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

export function toNullableDate(
  value: Date | string | number | null | undefined
): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = toDate(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function andConditions(
  conditions: readonly (SQL | null | undefined)[]
): SQL | undefined {
  const valid: SQL[] = [];
  for (const cond of conditions) {
    if (cond !== null && cond !== undefined) {
      valid.push(cond);
    }
  }
  return valid.length > 0 ? and(...valid) : undefined;
}

export function dateRangeConditions(
  column: AnyColumn,
  from?: Date | string,
  to?: Date | string
): SQL[] {
  const conditions: SQL[] = [];
  const fromDate = toNullableDate(from);
  if (fromDate) {
    conditions.push(gte(column, fromDate));
  }
  const toDateVal = toNullableDate(to);
  if (toDateVal) {
    conditions.push(lte(column, toDateVal));
  }
  return conditions;
}

export function escapeLike(raw: string): string {
  return raw.replace(LIKE_METACHARS_REGEX, "\\$1");
}

export function ciLike(column: AnyColumn, pattern: string): SQL {
  return sql`LOWER(CAST(${column} AS TEXT)) LIKE LOWER(${pattern}) ESCAPE '\\'`;
}

export function ciContains(column: AnyColumn, searchTerm: string): SQL {
  return ciLike(column, `%${escapeLike(searchTerm.trim())}%`);
}

export function ciEquals(column: AnyColumn, value: string): SQL {
  return sql`LOWER(CAST(${column} AS TEXT)) = LOWER(${value.trim()})`;
}

export function ciSearchAny(
  columns: readonly AnyColumn[],
  term: string | undefined
): SQL | undefined {
  const trimmed = term?.trim();
  if (!trimmed || columns.length === 0) {
    return undefined;
  }
  const clauses = columns.map((col) => ciContains(col, trimmed));
  return or(...clauses) ?? undefined;
}

export function clampLimit(
  limit: number | undefined,
  defaultLimit: number,
  maxLimit: number
): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return defaultLimit;
  }
  return Math.min(Math.max(Math.trunc(limit), 1), maxLimit);
}

export function clampPage(page: number | undefined): number {
  if (page === undefined || !Number.isFinite(page)) {
    return 1;
  }
  return Math.max(Math.trunc(page), 1);
}

export function buildPaginatedResult<TItem>(
  items: readonly TItem[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<TItem> {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    items: [...items],
    total,
    page,
    limit,
    totalPages,
    hasMore: page * limit < total,
  };
}

export function buildCursorPage<TItem, TCursor extends string | number>(
  rowsWithExtra: readonly TItem[],
  limit: number,
  getCursor: (last: TItem) => TCursor
): CursorPaginatedResult<TItem, TCursor> {
  const hasMore = rowsWithExtra.length > limit;
  const items = hasMore ? rowsWithExtra.slice(0, limit) : [...rowsWithExtra];
  const last = items.at(-1);
  const nextCursor = hasMore && last !== undefined ? getCursor(last) : null;
  return {
    items,
    nextCursor,
    hasMore,
    limit,
  };
}

export async function runOffsetPagination<TItem>(
  options: OffsetPaginationOptions<TItem>
): Promise<PaginatedResult<TItem>> {
  const page = clampPage(options.page);
  const limit = clampLimit(
    options.limit,
    options.defaultLimit,
    options.maxLimit
  );
  const offset = (page - 1) * limit;
  const [total, items] = await Promise.all([
    options.countQuery(),
    options.rowsQuery(limit, offset),
  ]);
  return buildPaginatedResult(items, total, page, limit);
}

export async function runCursorPagination<
  TItem,
  TCursor extends string | number,
>(
  options: CursorPaginationOptions<TItem, TCursor>
): Promise<CursorPaginatedResult<TItem, TCursor>> {
  const limit = clampLimit(
    options.limit,
    options.defaultLimit,
    options.maxLimit
  );
  const rows = await options.rowsQuery(limit + 1);
  return buildCursorPage(rows, limit, options.getCursor);
}

export async function firstOrNull<TRow>(
  query: Promise<readonly TRow[]>
): Promise<TRow | null> {
  const rows = await query;
  return rows[0] ?? null;
}

export async function requireFirst<TRow>(
  query: Promise<readonly TRow[]>,
  errorMessage: string
): Promise<TRow> {
  const found = await firstOrNull(query);
  if (!found) {
    throw new Error(errorMessage);
  }
  return found;
}
