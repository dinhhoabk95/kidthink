import type { ContentSeed } from "#src/types";
import { VALID_GAME_LEVEL_SEED } from "./eight-gates-fixtures.js";

/**
 * Fixture: Chủ đề bịa đặt ngoài từ vựng đóng (BR-CTR-01, BR-CTR-02)
 */
export const FIXTURE_THEME_FABRICATED: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-FAB-THEME-0001",
    theme_tag: "banh_trung_thu_2026",
  },
};

/**
 * Fixture: Thiếu theme_tag hoặc theme_tag rỗng (BR-CTR-03)
 */
export const FIXTURE_THEME_EMPTY: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-EMPTY-THEME-0001",
    theme_tag: "",
  },
};

/**
 * Fixture: Chủ đề dưới sàn tuổi age_floor (BR-CTR-09)
 * space có age_floor: 5, gán cho level 3-4 tuổi (age_min: 3, age_max: 4)
 */
export const FIXTURE_THEME_AGE_FLOOR_VIOLATION: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-SPACE-UNDERAGE-0001",
    age_min: 3,
    age_max: 4,
    theme_tag: "space",
  },
};
