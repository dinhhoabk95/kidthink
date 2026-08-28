import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { timestamps } from "./columns.ts";
import { activities, lessons } from "./content.ts";
import { users } from "./identity.ts";

export const lessonRunStatusEnum = pgEnum("lesson_run_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

export const lessonStepKindEnum = pgEnum("lesson_step_kind", [
  "warm_up",
  "off_screen",
  "digital_game",
  "reflection",
  "assessment",
]);

export const lessonStepOutcomeEnum = pgEnum("lesson_step_outcome", [
  "pending",
  "done",
  "skipped",
]);

export const observationLevelEnum = pgEnum("observation_level", [
  "did_it",
  "with_help",
  "not_yet",
]);

export const lessonRuns = pgTable(
  "lesson_runs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    uuid: varchar("uuid", { length: 36 })
      .notNull()
      .unique()
      .default(sql`gen_random_uuid()`),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    lessonId: bigint("lesson_id", { mode: "number" })
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    contentVersion: integer("content_version").notNull().default(1),
    status: lessonRunStatusEnum("status").notNull().default("in_progress"),
    currentStep: integer("current_step").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("idx_lesson_runs_user_child").on(table.userId, table.childProfileId),
    index("idx_lesson_runs_lesson").on(table.lessonId),
    index("idx_lesson_runs_status").on(table.status),
  ]
);

export const lessonRunSteps = pgTable(
  "lesson_run_steps",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    lessonRunId: bigint("lesson_run_id", { mode: "number" })
      .notNull()
      .references(() => lessonRuns.id, { onDelete: "cascade" }),
    stepIndex: integer("step_index").notNull(),
    activityId: bigint("activity_id", { mode: "number" }).references(
      () => activities.id
    ),
    kind: lessonStepKindEnum("kind").notNull(),
    outcome: lessonStepOutcomeEnum("outcome").notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    unique("lesson_run_steps_run_step_unique").on(
      table.lessonRunId,
      table.stepIndex
    ),
  ]
);

export const lessonRunObservations = pgTable(
  "lesson_run_observations",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    lessonRunId: bigint("lesson_run_id", { mode: "number" })
      .notNull()
      .references(() => lessonRuns.id, { onDelete: "cascade" }),
    objectiveCode: varchar("objective_code", { length: 50 }).notNull(),
    level: observationLevelEnum("level").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("lesson_run_obs_run_obj_unique").on(
      table.lessonRunId,
      table.objectiveCode
    ),
  ]
);
