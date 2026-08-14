/**
 * Spec sở hữu: content-versioning.md §7.2 & §7.3
 * Rule sở hữu: BR-VER-07, BR-VER-08
 */

export type VersionableEntityType = "game_level" | "lesson" | "curriculum";

export const BUMP_FIELDS: Record<VersionableEntityType, readonly string[]> = {
  game_level: [
    "templateId",
    "template_id",
    "contentPack",
    "content_pack",
    "difficultyParams",
    "difficulty_params",
    "skillIds",
    "skill_ids",
    "learningObjectiveIds",
    "learning_objective_ids",
    "ageMin",
    "age_min",
    "ageMax",
    "age_max",
    "difficulty",
    "accessTier",
    "access_tier",
  ],
  lesson: [
    "activities",
    "activityIds",
    "learningObjectiveIds",
    "learning_objective_ids",
    "targetAge",
    "target_age",
    "targetAgeMin",
    "target_age_min",
    "targetAgeMax",
    "target_age_max",
    "accessTier",
    "access_tier",
  ],
  curriculum: [
    "curriculumItems",
    "curriculum_items",
    "itemOrder",
    "item_order",
    "accessTier",
    "access_tier",
  ],
} as const;

export const NO_BUMP_FIELDS: Record<VersionableEntityType, readonly string[]> =
  {
    game_level: [
      "title",
      "description",
      "instruction",
      "instructionAudioPath",
      "instruction_audio_path",
      "themeId",
      "theme_id",
      "tags",
      "thumbnailEmoji",
      "thumbnail_emoji",
      "isFeatured",
      "is_featured",
      "origin",
      "authoredIn",
      "seedBatchId",
    ],
    lesson: [
      "title",
      "description",
      "guide",
      "materials",
      "warmUp",
      "warm_up",
      "reflection",
      "assessment",
      "extension",
      "tags",
      "thumbnailEmoji",
      "thumbnail_emoji",
      "origin",
      "authoredIn",
      "seedBatchId",
    ],
    curriculum: [
      "title",
      "description",
      "tags",
      "thumbnailEmoji",
      "thumbnail_emoji",
      "origin",
      "authoredIn",
      "seedBatchId",
    ],
  } as const;

export function requiresVersionBump(
  entityType: VersionableEntityType,
  changedFields: string[]
): boolean {
  const bumpList = BUMP_FIELDS[entityType];
  const noBumpList = NO_BUMP_FIELDS[entityType];

  if (!(bumpList && noBumpList)) {
    throw new Error(`Unknown versionable entity type: ${entityType}`);
  }

  // Validate all changed fields are recognized
  for (const field of changedFields) {
    const isBump = bumpList.includes(field);
    const isNoBump = noBumpList.includes(field);

    if (!(isBump || isNoBump)) {
      throw new Error(
        `BR-VER-08: Unknown field '${field}' for entity type '${entityType}'. Field classification must be explicitly closed.`
      );
    }
  }

  // If any field is a bump field, version bump is required
  return changedFields.some((field) => bumpList.includes(field));
}
