import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  check,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const skillStatusEnum = pgEnum("skill_status", ["seeded", "deprecated"]);

export const competencies = pgTable(
  "competencies",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    nameVi: varchar("name_vi", { length: 100 }).notNull(),
    descriptionVi: text("description_vi"),
    colorToken: varchar("color_token", { length: 50 }).notNull(),
    icon: varchar("icon", { length: 50 }).notNull(),
    position: integer("position").notNull().default(0),
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
    nameVi: varchar("name_vi", { length: 100 }).notNull(),
    descriptionVi: text("description_vi"),
    position: integer("position").notNull().default(0),
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
    nameVi: varchar("name_vi", { length: 100 }).notNull(),
    descriptionVi: text("description_vi"),
    ageMin: smallint("age_min").notNull(),
    ageMax: smallint("age_max").notNull(),
    difficulty: smallint("difficulty").notNull(),
    thinkingProcesses: text("thinking_processes").array(),
    whatAxis: text("what_axis").array(),
    status: skillStatusEnum("status").notNull().default("seeded"),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    check(
      "check_skills_code_format",
      sql`${table.code} ~ '^C[1-6]\\.[A-Z]{2,5}\\.\\d{2}$'`
    ),
    check(
      "check_skills_age_min",
      sql`${table.ageMin} >= 3 AND ${table.ageMin} <= 6`
    ),
    check(
      "check_skills_age_max",
      sql`${table.ageMax} >= 3 AND ${table.ageMax} <= 6`
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
    behaviourVi: text("behaviour_vi").notNull(),
    observableCriteriaVi: text("observable_criteria_vi"),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    check(
      "check_learning_objectives_code_format",
      sql`${table.code} ~ '^LO-C[1-6]\\.[A-Z]{2,5}\\.\\d{2}-\\d{2}$'`
    ),
  ]
);

export const emojiAgeSuitabilityEnum = pgEnum("emoji_age_suitability", [
  "all",
  "4plus",
  "blocked",
]);

export const emojiStatusEnum = pgEnum("emoji_status", ["active", "deprecated"]);

export const emojiRegistry = pgTable(
  "emoji_registry",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    unicode: varchar("unicode", { length: 20 }).notNull(),
    nameVi: varchar("name_vi", { length: 100 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    searchKeywordsVi: text("search_keywords_vi").array(),
    ageSuitability: emojiAgeSuitabilityEnum("age_suitability")
      .notNull()
      .default("all"),
    whatAxis: varchar("what_axis", { length: 50 }),
    status: emojiStatusEnum("status").notNull().default("active"),
  },
  (table) => [
    check(
      "check_emoji_registry_code_format",
      sql`${table.code} ~ '^EMJ-[a-z0-9-]+$'`
    ),
  ]
);
