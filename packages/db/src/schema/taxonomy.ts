import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  check,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns.ts";

/**
 * Bậc tiến triển trong strand.
 *
 * Thay cho `skill_status` cũ. Cột trạng thái đó luôn bằng `"seeded"` vì seeder
 * ghi cứng, nên nó không mô tả gì; bậc thì suy được từ độ khó và dùng được cho
 * lộ trình học.
 */
export const skillTierEnum = pgEnum("skill_tier", [
  "basic",
  "core",
  "advanced",
]);

export const competencies = pgTable(
  "competencies",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    colorToken: varchar("color_token", { length: 50 }).notNull(),
    icon: varchar("icon", { length: 50 }).notNull(),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    check("check_competencies_code_format", sql`${table.code} ~ '^C[1-6]$'`),
  ]
);

export const strands = pgTable(
  "strands",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 30 }).notNull().unique(),
    competencyId: bigint("competency_id", { mode: "number" })
      .notNull()
      .references(() => competencies.id, { onDelete: "cascade" }),
    parentStrandId: bigint("parent_strand_id", { mode: "number" }).references(
      (): AnyPgColumn => strands.id
    ),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    check(
      "check_strands_code_format",
      sql`${table.code} ~ '^C[1-6]\\.[A-Z]{2,5}$'`
    ),
  ]
);

export const skills = pgTable(
  "skills",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 40 }).notNull().unique(),
    strandId: bigint("strand_id", { mode: "number" })
      .notNull()
      .references(() => strands.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    ageMin: smallint("age_min").notNull(),
    ageMax: smallint("age_max").notNull(),
    difficulty: smallint("difficulty").notNull(),
    thinkingProcesses: text("thinking_processes").array(),
    whatAxis: text("what_axis").array(),
    tier: skillTierEnum("tier").notNull().default("basic"),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    check(
      "check_skills_code_format",
      sql`${table.code} ~ '^C[1-6]\\.[A-Z]{2,5}\\.\\d{2}$'`
    ),
    check(
      "check_skills_age_min",
      sql`${table.ageMin} >= 3 AND ${table.ageMin} <= 7`
    ),
    check(
      "check_skills_age_max",
      sql`${table.ageMax} >= 3 AND ${table.ageMax} <= 7`
    ),
    check("check_skills_age_range", sql`${table.ageMin} <= ${table.ageMax}`),
    check(
      "check_skills_difficulty",
      sql`${table.difficulty} >= 1 AND ${table.difficulty} <= 5`
    ),
  ]
);

export const skillPrerequisites = pgTable(
  "skill_prerequisites",
  {
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    prerequisiteId: bigint("prerequisite_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    strength: numeric("strength", { precision: 3, scale: 2 })
      .notNull()
      .default("1.00"),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.skillId, table.prerequisiteId] }),
    check(
      "check_skill_prerequisites_strength",
      sql`${table.strength} >= 0 AND ${table.strength} <= 1`
    ),
  ]
);

export const learningObjectives = pgTable(
  "learning_objectives",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    behaviour: text("behaviour").notNull(),
    observableCriteria: text("observable_criteria"),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    check(
      "check_learning_objectives_code_format",
      sql`${table.code} ~ '^LO-C[1-6]\\.[A-Z]{2,5}\\.\\d{2}-\\d{2}$'`
    ),
  ]
);

export const skillDatasetSurfaceEnum = pgEnum("skill_dataset_surface", [
  "game",
  "worksheet",
]);

export const skillDatasets = pgTable(
  "skill_datasets",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    contentVersion: integer("content_version").notNull().default(1),
    conceptLabel: varchar("concept_label", { length: 200 }).notNull(),
    surface: skillDatasetSurfaceEnum("surface").notNull().default("game"),
    items: jsonb("items").notNull(),
    relations: jsonb("relations"),
    ordering: jsonb("ordering"),
    axes: jsonb("axes"),
    ladder: jsonb("ladder"),
    phrasing: jsonb("phrasing"),
    extendsSkillCode: varchar("extends_skill_code", { length: 50 }),
    status: varchar("status", { length: 50 }).notNull().default("draft"),
    seedBatchId: bigint("seed_batch_id", { mode: "number" }),
    origin: varchar("origin", { length: 50 }).notNull().default("human"),
    authoredIn: varchar("authored_in", { length: 50 })
      .notNull()
      .default("repo_seed"),
    ...timestamps(),
  },
  (table) => [
    check(
      "check_skill_datasets_code_format",
      sql`${table.code} ~ '^C[1-6]\\.[A-Z]{2,5}\\.\\d{2}$'`
    ),
  ]
);
