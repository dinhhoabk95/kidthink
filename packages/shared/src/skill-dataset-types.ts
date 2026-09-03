/**
 * Type definitions for SkillDataset & Projections (Task #207).
 * Spec: `docs/specs/05-content/skill-dataset-model.md` §7.1 & §7.3
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

export type SkillDatasetSurface = "game" | "worksheet";

export type DatasetAsset =
  | { readonly kind: "emoji"; readonly ref: string }
  | { readonly kind: "image"; readonly path: string }
  | { readonly kind: "text"; readonly text: string };

export interface DatasetItem {
  readonly id: string;
  readonly label: string;
  readonly glyph?: string;
  readonly image?: DatasetAsset;
  readonly value?: number;
  readonly category?: Readonly<Record<string, string>>;
  readonly audio_path?: string;
  readonly contrast_group?: string;
}

export type DatasetRelationType = "pair" | "contrast" | "sequence" | "subset";

export interface DatasetRelation {
  readonly type: DatasetRelationType;
  readonly source_id: string;
  readonly target_id: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface DifficultyRung {
  readonly rung: number;
  readonly dimension: string;
  readonly description: string;
}

export interface SkillPhrasing {
  readonly prompt_template: string;
  readonly narration_template?: string;
  readonly success_message?: string;
  readonly hint_message?: string;
}

export interface SkillDataset {
  readonly skill_code: string;
  readonly concept_label: string;
  readonly surface: SkillDatasetSurface;
  readonly items: readonly DatasetItem[];
  readonly relations?: readonly DatasetRelation[];
  readonly ordering?: readonly string[];
  readonly axes?: Readonly<Record<string, readonly string[]>>;
  readonly ladder: readonly DifficultyRung[];
  readonly phrasing: SkillPhrasing;
  readonly extends?: string;
}

export type ItemFacet =
  | "glyph"
  | "value"
  | "category"
  | "audio"
  | "contrast_group";

export type AgeBandString = "3-4" | "4-5" | "5-6" | "3-5" | "4-6";

export interface ProjectOptions {
  readonly band: AgeBandString;
  readonly difficulty: number;
  readonly theme: string;
  readonly seed: number;
  readonly round_index?: number;
}

export interface ProjectionRequires {
  readonly min_items: number;
  readonly max_items: number;
  readonly needs?: readonly ItemFacet[];
}

export interface ProjectedPack<
  TPack extends object = Record<
    string,
    string | number | boolean | object | null
  >,
  TParams extends object = Record<
    string,
    string | number | boolean | object | null
  >,
> {
  readonly content_pack: TPack;
  readonly difficulty_params: TParams;
}

export interface Projection<
  TCode extends string = string,
  TPack extends object = Record<
    string,
    string | number | boolean | object | null
  >,
  TParams extends object = Record<
    string,
    string | number | boolean | object | null
  >,
> {
  readonly template: TCode;
  readonly requires: ProjectionRequires;
  project(
    dataset: SkillDataset,
    opts: ProjectOptions
  ): ProjectedPack<TPack, TParams>;
}

export interface SkillLevelPlan {
  readonly template: string;
  readonly band: AgeBandString;
  readonly difficulty: number;
  readonly theme: string;
  readonly rounds?: number;
}

export interface SkillSeed {
  readonly dataset: SkillDataset;
  readonly levels: readonly SkillLevelPlan[];
}
