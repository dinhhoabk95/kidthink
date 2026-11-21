import {
  type AnyPgColumn,
  bigint,
  index,
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
import { idPk, timestamps } from "./columns.ts";

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

export const competencies = pgTable("competencies", {
  id: idPk(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  colorToken: varchar("color_token", { length: 50 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  position: integer("position").notNull().default(0),
  ...timestamps(),
});

export const strands = pgTable(
  "strands",
  {
    id: idPk(),
    code: varchar("code", { length: 30 }).notNull().unique(),
    competencyId: bigint("competency_id", { mode: "number" })
      .notNull()
      .references(() => competencies.id, { onDelete: "cascade" }),
    parentStrandId: bigint("parent_strand_id", { mode: "number" }).references(
      (): AnyPgColumn => strands.id,
      { onDelete: "restrict" }
    ),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    index("idx_strands_competency_id").on(table.competencyId),
    index("idx_strands_parent_strand_id").on(table.parentStrandId),
  ]
);

export const skills = pgTable(
  "skills",
  {
    id: idPk(),
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
  (table) => [index("idx_skills_strand_id").on(table.strandId)]
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
    index("idx_skill_prerequisites_prerequisite_id").on(table.prerequisiteId),
  ]
);

export const learningObjectives = pgTable(
  "learning_objectives",
  {
    id: idPk(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    behaviour: text("behaviour").notNull(),
    observableCriteria: text("observable_criteria"),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [index("idx_learning_objectives_skill_id").on(table.skillId)]
);

export const skillDatasets = pgTable(
  "skill_datasets",
  {
    id: idPk(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    conceptLabel: varchar("concept_label", { length: 200 }).notNull(),
    items: jsonb("items").notNull(),
    relations: jsonb("relations"),
    ordering: jsonb("ordering"),
    axes: jsonb("axes"),
    ladder: jsonb("ladder"),
    phrasing: jsonb("phrasing"),
    extendsSkillCode: varchar("extends_skill_code", { length: 50 }),
    ...timestamps(),
  },
  (table) => [index("idx_skill_datasets_skill_id").on(table.skillId)]
);
