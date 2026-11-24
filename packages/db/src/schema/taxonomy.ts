import {
  type AnySQLiteColumn,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import type { JsonRecord, JsonValue } from "#src/constants/json";
import { SKILL_TIER, type SkillTier } from "#src/constants/learning-enums";
import { idPk, timestamps } from "./columns.ts";

export const competencies = sqliteTable("competencies", {
  id: idPk(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  colorToken: text("color_token").notNull(),
  icon: text("icon").notNull(),
  position: integer("position").notNull().default(0),
  ...timestamps(),
});

export const strands = sqliteTable(
  "strands",
  {
    id: idPk(),
    code: text("code").notNull().unique(),
    competencyId: integer("competency_id")
      .notNull()
      .references(() => competencies.id, { onDelete: "cascade" }),
    parentStrandId: integer("parent_strand_id").references(
      (): AnySQLiteColumn => strands.id,
      { onDelete: "restrict" }
    ),
    name: text("name").notNull(),
    description: text("description"),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    index("idx_strands_competency_id").on(table.competencyId),
    index("idx_strands_parent_strand_id").on(table.parentStrandId),
  ]
);

export const skills = sqliteTable(
  "skills",
  {
    id: idPk(),
    code: text("code").notNull().unique(),
    strandId: integer("strand_id")
      .notNull()
      .references(() => strands.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    ageMin: integer("age_min").notNull(),
    ageMax: integer("age_max").notNull(),
    difficulty: integer("difficulty").notNull(),
    thinkingProcesses: text("thinking_processes", { mode: "json" }).$type<
      string[]
    >(),
    whatAxis: text("what_axis", { mode: "json" }).$type<string[]>(),
    tier: integer("tier")
      .$type<SkillTier>()
      .notNull()
      .default(SKILL_TIER.BASIC),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [index("idx_skills_strand_id").on(table.strandId)]
);

export const skillPrerequisites = sqliteTable(
  "skill_prerequisites",
  {
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    prerequisiteId: integer("prerequisite_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    strength: text("strength").notNull().default("1.00"),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.skillId, table.prerequisiteId] }),
    index("idx_skill_prerequisites_prerequisite_id").on(table.prerequisiteId),
  ]
);

export const learningObjectives = sqliteTable(
  "learning_objectives",
  {
    id: idPk(),
    code: text("code").notNull().unique(),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    behaviour: text("behaviour").notNull(),
    observableCriteria: text("observable_criteria"),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [index("idx_learning_objectives_skill_id").on(table.skillId)]
);

export const skillDatasets = sqliteTable(
  "skill_datasets",
  {
    id: idPk(),
    code: text("code").notNull().unique(),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    conceptLabel: text("concept_label").notNull(),
    items: text("items", { mode: "json" }).$type<JsonValue>().notNull(),
    relations: text("relations", { mode: "json" }).$type<JsonValue>(),
    ordering: text("ordering", { mode: "json" }).$type<JsonValue>(),
    axes: text("axes", { mode: "json" }).$type<JsonRecord>(),
    ladder: text("ladder", { mode: "json" }).$type<JsonValue>(),
    phrasing: text("phrasing", { mode: "json" }).$type<JsonRecord>(),
    extendsSkillCode: text("extends_skill_code"),
    ...timestamps(),
  },
  (table) => [index("idx_skill_datasets_skill_id").on(table.skillId)]
);
