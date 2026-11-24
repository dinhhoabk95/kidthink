import type { D1BindingInput } from "#src/d1/types";
import type { AppDb, OwnerDb } from "#src/drivers/types";
import { DB } from "#src/manager";

export type {
  AppDb,
  DbExecutor,
  DbRelations,
  DbSchema,
  OwnerDb,
} from "#src/drivers/types";
export { dbRelations } from "#src/schema/relations";

export function registerCloudflareD1Bindings(binding: D1BindingInput): AppDb {
  DB.registerD1Bindings(binding);
  return DB.connection("d1");
}

export function enterCloudflareD1Binding(binding: D1BindingInput): void {
  DB.enterCloudflareD1Binding(binding);
}

export function clearCloudflareD1Bindings(): void {
  DB.clearD1Bindings();
}

export function getOwnerDb(): OwnerDb {
  return DB.ownerConnection();
}

export function getAppDb(): AppDb {
  return DB.connection();
}

export const getDb = getAppDb;
