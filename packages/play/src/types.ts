import type { getOwnerDb } from "@mindkid/db";

export type DbClient = ReturnType<typeof getOwnerDb>;
export type DbTransaction = Parameters<
  Parameters<DbClient["transaction"]>[0]
>[0];
export type DbOrTx = DbClient | DbTransaction;

export type { EventPayload, EventPayloadValue } from "./events/validate.js";
