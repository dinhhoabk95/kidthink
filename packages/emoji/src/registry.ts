/**
 * @mindkid/emoji — Registry
 * Aggregate 36 canonical data files, derive category/theme/group maps without duplication.
 */

import {
  ALL_CATEGORIES,
  CURRICULUM_THEME_CATEGORIES,
  EMOJI_GROUPS,
} from "#src/constants";
import { ANIMAL_BIRD_EMOJIS } from "#src/data/animal-bird";
import { ANIMAL_FARM_EMOJIS } from "#src/data/animal-farm";
import { ANIMAL_INSECT_EMOJIS } from "#src/data/animal-insect";
import { ANIMAL_PREHISTORIC_EMOJIS } from "#src/data/animal-prehistoric";
import { ANIMAL_WATER_EMOJIS } from "#src/data/animal-water";
import { ANIMAL_WILD_EMOJIS } from "#src/data/animal-wild";
import { BODY_EMOJIS } from "#src/data/body";
import { CLOTHING_EMOJIS } from "#src/data/clothing";
import { FACE_EMOTION_EMOJIS } from "#src/data/face-emotion";
import { FAMILY_EMOJIS } from "#src/data/family";
import { FESTIVAL_EMOJIS } from "#src/data/festival";
import { FLAG_SYMBOL_EMOJIS } from "#src/data/flag-symbol";
import { FLOWER_TREE_EMOJIS } from "#src/data/flower-tree";
import { FOOD_EMOJIS } from "#src/data/food";
import { FRUIT_EMOJIS } from "#src/data/fruit";
import { HAND_GESTURE_EMOJIS } from "#src/data/hand-gesture";
import { HOUSEHOLD_EMOJIS } from "#src/data/household";
import { MUSIC_ART_EMOJIS } from "#src/data/music-art";
import { NATURE_LANDSCAPE_EMOJIS } from "#src/data/nature-landscape";
import { NUMBER_SYMBOL_EMOJIS } from "#src/data/number-symbol";
import { PROFESSION_EMOJIS } from "#src/data/profession";
import { SCHOOL_EMOJIS } from "#src/data/school";
import { SCIENCE_LAB_EMOJIS } from "#src/data/science-lab";
import { SHAPE_COLOR_EMOJIS } from "#src/data/shape-color";
import { SKY_SPACE_EMOJIS } from "#src/data/sky-space";
import { SPORT_GAME_EMOJIS } from "#src/data/sport-game";
import { TIME_EMOJIS } from "#src/data/time";
import { TOOL_EMOJIS } from "#src/data/tool";
import { TOY_EMOJIS } from "#src/data/toy";
import { VEGETABLE_EMOJIS } from "#src/data/vegetable";
import { VEHICLE_AIR_EMOJIS } from "#src/data/vehicle-air";
import { VEHICLE_RAIL_EMOJIS } from "#src/data/vehicle-rail";
import { VEHICLE_ROAD_EMOJIS } from "#src/data/vehicle-road";
import { VEHICLE_WATER_EMOJIS } from "#src/data/vehicle-water";
import { VN_CULTURE_EMOJIS } from "#src/data/vn-culture";
import { WEATHER_SEASON_EMOJIS } from "#src/data/weather-season";
import { normalizeGlyph } from "#src/glyph-utils";
import type {
  CurriculumTheme,
  EmojiCategory,
  EmojiEntry,
  EmojiGroup,
} from "#src/types";

export const RAW_EMOJI_DATA_SOURCES: Readonly<
  Record<EmojiCategory, readonly EmojiEntry[]>
> = {
  "animal-bird": ANIMAL_BIRD_EMOJIS,
  "animal-farm": ANIMAL_FARM_EMOJIS,
  "animal-insect": ANIMAL_INSECT_EMOJIS,
  "animal-prehistoric": ANIMAL_PREHISTORIC_EMOJIS,
  "animal-water": ANIMAL_WATER_EMOJIS,
  "animal-wild": ANIMAL_WILD_EMOJIS,
  body: BODY_EMOJIS,
  clothing: CLOTHING_EMOJIS,
  "face-emotion": FACE_EMOTION_EMOJIS,
  family: FAMILY_EMOJIS,
  festival: FESTIVAL_EMOJIS,
  "flag-symbol": FLAG_SYMBOL_EMOJIS,
  "flower-tree": FLOWER_TREE_EMOJIS,
  food: FOOD_EMOJIS,
  fruit: FRUIT_EMOJIS,
  "hand-gesture": HAND_GESTURE_EMOJIS,
  household: HOUSEHOLD_EMOJIS,
  "music-art": MUSIC_ART_EMOJIS,
  "nature-landscape": NATURE_LANDSCAPE_EMOJIS,
  "number-symbol": NUMBER_SYMBOL_EMOJIS,
  profession: PROFESSION_EMOJIS,
  school: SCHOOL_EMOJIS,
  "science-lab": SCIENCE_LAB_EMOJIS,
  "shape-color": SHAPE_COLOR_EMOJIS,
  "sky-space": SKY_SPACE_EMOJIS,
  "sport-game": SPORT_GAME_EMOJIS,
  time: TIME_EMOJIS,
  tool: TOOL_EMOJIS,
  toy: TOY_EMOJIS,
  vegetable: VEGETABLE_EMOJIS,
  "vehicle-air": VEHICLE_AIR_EMOJIS,
  "vehicle-rail": VEHICLE_RAIL_EMOJIS,
  "vehicle-road": VEHICLE_ROAD_EMOJIS,
  "vehicle-water": VEHICLE_WATER_EMOJIS,
  "vn-culture": VN_CULTURE_EMOJIS,
  "weather-season": WEATHER_SEASON_EMOJIS,
};

export const ALL_EMOJIS: EmojiEntry[] = /* @__PURE__ */ (() => {
  const seen = new Map<string, EmojiEntry>();
  for (const list of Object.values(RAW_EMOJI_DATA_SOURCES)) {
    for (const entry of list) {
      const key = normalizeGlyph(entry.emoji);
      if (!seen.has(key)) {
        seen.set(key, entry);
      }
    }
  }
  return Array.from(seen.values());
})();

export const EMOJI_CATEGORIES: Record<EmojiCategory, EmojiEntry[]> =
  /* @__PURE__ */ (() => {
    const map = {} as Record<EmojiCategory, EmojiEntry[]>;
    for (const category of ALL_CATEGORIES) {
      map[category] = [];
    }
    for (const entry of ALL_EMOJIS) {
      for (const category of entry.categories) {
        map[category]?.push(entry);
      }
    }
    return map;
  })();

function buildMergedCategoryMap<K extends string>(
  mapping: Readonly<Record<K, readonly EmojiCategory[]>>
): Record<K, EmojiEntry[]> {
  const result = {} as Record<K, EmojiEntry[]>;
  for (const key of Object.keys(mapping) as K[]) {
    const seen = new Set<string>();
    const entries: EmojiEntry[] = [];
    for (const cat of mapping[key]) {
      for (const entry of EMOJI_CATEGORIES[cat] ?? []) {
        if (!seen.has(entry.emoji)) {
          seen.add(entry.emoji);
          entries.push(entry);
        }
      }
    }
    result[key] = entries;
  }
  return result;
}

export const CURRICULUM_EMOJI_MAP: Record<CurriculumTheme, EmojiEntry[]> =
  /* @__PURE__ */ buildMergedCategoryMap(CURRICULUM_THEME_CATEGORIES);

export const GROUP_EMOJI_MAP: Record<EmojiGroup, EmojiEntry[]> =
  /* @__PURE__ */ buildMergedCategoryMap(EMOJI_GROUPS);
