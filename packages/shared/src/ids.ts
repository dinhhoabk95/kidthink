/**
 * ID validators — Zod schemas + branded types for all business codes.
 *
 * Source of truth: `docs/specs/00-foundation/id-conventions.md` §7.1
 * Rule: BR-ID-05 — every code validated by regex at both Zod and DB CHECK.
 *
 * Each ID type exports:
 * - `*_REGEX`  — RegExp constant (reusable for DB CHECK constraints)
 * - `*Schema`  — Zod schema (`.brand()` for nominal typing)
 * - type `*`   — Inferred branded TypeScript type
 */

import { z } from "zod";

// ─── Competency ──────────────────────────────────────────────────────
export const COMPETENCY_CODE_REGEX = /^C[1-6]$/;
export const CompetencyCodeSchema = z
  .string()
  .regex(COMPETENCY_CODE_REGEX)
  .brand("CompetencyCode");
export type CompetencyCode = z.infer<typeof CompetencyCodeSchema>;

// ─── Strand ──────────────────────────────────────────────────────────
export const STRAND_CODE_REGEX = /^C[1-6]\.[A-Z]{2,5}$/;
export const StrandCodeSchema = z
  .string()
  .regex(STRAND_CODE_REGEX)
  .brand("StrandCode");
export type StrandCode = z.infer<typeof StrandCodeSchema>;

// ─── Skill ───────────────────────────────────────────────────────────
export const SKILL_CODE_REGEX = /^C[1-6]\.[A-Z]{2,5}\.\d{2}$/;
export const SkillCodeSchema = z
  .string()
  .regex(SKILL_CODE_REGEX)
  .brand("SkillCode");
export type SkillCode = z.infer<typeof SkillCodeSchema>;

// ─── Learning Objective ──────────────────────────────────────────────
export const LEARNING_OBJECTIVE_CODE_REGEX =
  /^LO-C[1-6]\.[A-Z]{2,5}\.\d{2}-\d{2}$/;
export const LearningObjectiveCodeSchema = z
  .string()
  .regex(LEARNING_OBJECTIVE_CODE_REGEX)
  .brand("LearningObjectiveCode");
export type LearningObjectiveCode = z.infer<typeof LearningObjectiveCodeSchema>;

// ─── Game Template ───────────────────────────────────────────────────
export const GAME_TEMPLATE_CODE_REGEX = /^GT-\d{3}$/;
export const GameTemplateCodeSchema = z
  .string()
  .regex(GAME_TEMPLATE_CODE_REGEX)
  .brand("GameTemplateCode");
export type GameTemplateCode = z.infer<typeof GameTemplateCodeSchema>;

// ─── Game Level ──────────────────────────────────────────────────────
// Format: GL-{competency}-{strand}-{template}-{seq4}
// Open Q1+Q2 closed 2026-08-06: includes template_code, 4-digit seq.
export const GAME_LEVEL_CODE_REGEX = /^GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\d{4}$/;
export const GameLevelCodeSchema = z
  .string()
  .regex(GAME_LEVEL_CODE_REGEX)
  .brand("GameLevelCode");
export type GameLevelCode = z.infer<typeof GameLevelCodeSchema>;

// ─── Lesson ──────────────────────────────────────────────────────────
export const LESSON_CODE_REGEX = /^LES-\d{4}$/;
export const LessonCodeSchema = z
  .string()
  .regex(LESSON_CODE_REGEX)
  .brand("LessonCode");
export type LessonCode = z.infer<typeof LessonCodeSchema>;

// ─── Activity ────────────────────────────────────────────────────────
export const ACTIVITY_CODE_REGEX = /^ACT-\d{4}$/;
export const ActivityCodeSchema = z
  .string()
  .regex(ACTIVITY_CODE_REGEX)
  .brand("ActivityCode");
export type ActivityCode = z.infer<typeof ActivityCodeSchema>;

// ─── Curriculum ──────────────────────────────────────────────────────
export const CURRICULUM_CODE_REGEX = /^CUR-\d{3}$/;
export const CurriculumCodeSchema = z
  .string()
  .regex(CURRICULUM_CODE_REGEX)
  .brand("CurriculumCode");
export type CurriculumCode = z.infer<typeof CurriculumCodeSchema>;

// ─── Worksheet ───────────────────────────────────────────────────────
export const WORKSHEET_CODE_REGEX = /^WS-\d{4}$/;
export const WorksheetCodeSchema = z
  .string()
  .regex(WORKSHEET_CODE_REGEX)
  .brand("WorksheetCode");
export type WorksheetCode = z.infer<typeof WorksheetCodeSchema>;

// ─── Package ─────────────────────────────────────────────────────────
export const PACKAGE_CODE_REGEX = /^PKG-[a-z_]{3,24}$/;
export const PackageCodeSchema = z
  .string()
  .regex(PACKAGE_CODE_REGEX)
  .brand("PackageCode");
export type PackageCode = z.infer<typeof PackageCodeSchema>;

// ─── Entitlement Key ─────────────────────────────────────────────────
export const ENTITLEMENT_KEY_REGEX = /^[a-z][a-z0-9_]{4,40}$/;
export const EntitlementKeySchema = z
  .string()
  .regex(ENTITLEMENT_KEY_REGEX)
  .brand("EntitlementKey");

// ─── Theme ───────────────────────────────────────────────────────────
export const THEME_CODE_REGEX = /^[a-z][a-z0-9-]{2,24}$/;
export const ThemeCodeSchema = z
  .string()
  .regex(THEME_CODE_REGEX)
  .brand("ThemeCode");
export type ThemeCode = z.infer<typeof ThemeCodeSchema>;

// ─── Emoji Ref (Task #202 D-EB, D-EC) ────────────────────────────────
export const EmojiRefSchema = z.string().min(1).brand("EmojiRef");
export type EmojiRef = z.infer<typeof EmojiRefSchema>;
