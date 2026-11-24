import type { DbConnectionName } from "@mindkid/config";
import { getDb, getOwnerDb } from "@mindkid/db";
import { DB } from "@mindkid/db/manager";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";

export function useRepositories(
  connectionName?: DbConnectionName
): MindKidRepositories {
  const executor =
    connectionName === undefined ? getDb() : DB.connection(connectionName);
  return createRepositories(executor);
}

export function useOwnerRepositories(
  connectionName?: DbConnectionName
): MindKidRepositories {
  const executor =
    connectionName === undefined
      ? getOwnerDb()
      : DB.ownerConnection(connectionName);
  return createRepositories(executor);
}
