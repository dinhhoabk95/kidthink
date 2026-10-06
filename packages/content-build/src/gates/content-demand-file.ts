import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { AGE_BANDS } from "@mindkid/shared/age-bands";
import { z } from "zod";
import type { ContentDemandLedger } from "./content-demand.js";

export const CONTENT_DEMAND_PATH =
  "packages/content/src/roadmaps/content-demand.json";

const DemandCellSchema = z.object({
  roadmap_code: z.string().min(1),
  band: z.enum(AGE_BANDS),
  week_no: z.number().int().min(1),
  session_no: z.number().int().min(1),
  role: z.enum(["introduce", "practice", "review", "offscreen"]),
  skill_code: z.string().min(1),
  topic_code: z.string().min(1).nullable(),
  template_codes: z.array(z.string().min(1)),
  level_quota: z.number().int().min(1),
  filled_by: z.array(z.string().min(1)),
});

const DemandSummarySchema = z.object({
  roadmap_code: z.string().min(1),
  roadmap_version: z.number().int().min(1),
  band: z.enum(AGE_BANDS),
  cells: z.number().int().min(0),
  filled_cells: z.number().int().min(0),
  debt_cells: z.number().int().min(0),
});

const ContentDemandLedgerSchema = z.object({
  ledger_version: z.literal(1),
  summary: z.array(DemandSummarySchema),
  cells: z.array(DemandCellSchema),
});

export function parseContentDemand(raw: string): ContentDemandLedger {
  return ContentDemandLedgerSchema.parse(JSON.parse(raw));
}

export function loadContentDemandLedger(): ContentDemandLedger {
  return parseContentDemand(
    fs.readFileSync(repoPath(CONTENT_DEMAND_PATH), "utf8")
  );
}
