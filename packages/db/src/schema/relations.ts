import { defineRelations } from "drizzle-orm";
import { buildBillingOpsRelations } from "./billing-ops-relations.ts";
import { buildIdentityRelations } from "./identity-relations.ts";
import { buildPlayChildRelations } from "./play-child-relations.ts";
import { dbTables } from "./tables.ts";
import { buildTaxonomyContentRelations } from "./taxonomy-content-relations.ts";

export const dbRelations = defineRelations(dbTables, (r) => ({
  ...buildIdentityRelations(r),
  ...buildBillingOpsRelations(r),
  ...buildPlayChildRelations(r),
  ...buildTaxonomyContentRelations(r),
}));
