import type { DbConnectionName as ConfigDbConnectionName } from "@mindkid/config";
import {
  booleanFromInteger,
  bufferFromBinaryIfAvailable,
  castToText,
  dateFromStoredMilliseconds,
  dateFromStoredSeconds,
  refineSqliteCodecs,
} from "drizzle-orm/sqlite-core";
import type { SQLiteAsyncDatabase } from "drizzle-orm/sqlite-core/async";
import type { dbRelations } from "#src/schema/relations";
import type { DbTables } from "#src/schema/tables";

export const SQLITE_DRIZZLE_CODECS = refineSqliteCodecs({
  "integer:boolean": { normalize: booleanFromInteger },
  "integer:timestamp": { normalize: dateFromStoredSeconds },
  "integer:timestamp_ms": { normalize: dateFromStoredMilliseconds },
  "text:json": { normalize: JSON.parse },
  blob: { normalize: bufferFromBinaryIfAvailable },
  "blob:json": { cast: castToText, normalize: JSON.parse },
  "blob:bigint": { cast: castToText, normalize: BigInt },
  numeric: { cast: castToText, normalize: String },
  "numeric:number": { normalize: Number },
  "numeric:bigint": { cast: castToText, normalize: BigInt },
});

export type DbConnectionName = ConfigDbConnectionName;

export type SqliteParamValue =
  | string
  | number
  | boolean
  | bigint
  | Date
  | Uint8Array
  | null
  | undefined;

export type SqliteCellValue = string | number | Uint8Array | null;

export interface SqliteRunResult {
  readonly changes: number;
  readonly lastInsertRowid: number;
}

export type DbSchema = DbTables;
export type DbRelations = typeof dbRelations;
export type AppDb = SQLiteAsyncDatabase<"async", SqliteRunResult, DbRelations>;
export type OwnerDb = AppDb;
export type DbExecutor = AppDb;

export interface SqliteDriverOptions {
  readonly dataDir?: string;
}

export interface SqliteDatabasePath {
  readonly isMemory: boolean;
  readonly dataDir: string;
  readonly dbPath: string;
}

export interface D1DriverOptions {
  readonly binding?: import("#src/d1/types").D1BindingInput;
}

export interface DatabaseDriver {
  readonly name: DbConnectionName;
  getAppDb(): AppDb;
  getOwnerDb(): OwnerDb;
  disconnect(): Promise<void>;
}
