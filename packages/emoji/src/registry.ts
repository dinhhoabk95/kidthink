/**
 * @kidthink/emoji — Registry
 * Aggregate tất cả data files, build lookup maps.
 */

import { CURRICULUM_THEME_CATEGORIES, EMOJI_GROUPS } from "./constants";
import { ANIMAL_BIRD_EMOJIS } from "./data/animal-bird";
import { ANIMAL_FARM_EMOJIS } from "./data/animal-farm";
import { ANIMAL_INSECT_EMOJIS } from "./data/animal-insect";
import { ANIMAL_WATER_EMOJIS } from "./data/animal-water";
import { ANIMAL_WILD_EMOJIS } from "./data/animal-wild";
// ── Import all data ──────────────────────────────────────────────
import { BODY_EMOJIS } from "./data/body";
import { CLOTHING_EMOJIS } from "./data/clothing";
import { FACE_EMOTION_EMOJIS } from "./data/face-emotion";
import { FAMILY_EMOJIS } from "./data/family";
import { FESTIVAL_EMOJIS } from "./data/festival";
import { FLAG_SYMBOL_EMOJIS } from "./data/flag-symbol";
import { FLOWER_TREE_EMOJIS } from "./data/flower-tree";
import { FOOD_EMOJIS } from "./data/food";
import { FRUIT_EMOJIS } from "./data/fruit";
import { HAND_GESTURE_EMOJIS } from "./data/hand-gesture";
import { HOUSEHOLD_EMOJIS } from "./data/household";
import { MUSIC_ART_EMOJIS } from "./data/music-art";
import { NATURE_LANDSCAPE_EMOJIS } from "./data/nature-landscape";
import { NUMBER_SYMBOL_EMOJIS } from "./data/number-symbol";
import { PROFESSION_EMOJIS } from "./data/profession";
import { SCHOOL_EMOJIS } from "./data/school";
import { SHAPE_COLOR_EMOJIS } from "./data/shape-color";
import { SKY_SPACE_EMOJIS } from "./data/sky-space";
import { SPORT_GAME_EMOJIS } from "./data/sport-game";
import { TIME_EMOJIS } from "./data/time";
import { TOOL_EMOJIS } from "./data/tool";
import { VEGETABLE_EMOJIS } from "./data/vegetable";
import { VEHICLE_AIR_EMOJIS } from "./data/vehicle-air";
import { VEHICLE_RAIL_EMOJIS } from "./data/vehicle-rail";
import { VEHICLE_ROAD_EMOJIS } from "./data/vehicle-road";
import { VEHICLE_WATER_EMOJIS } from "./data/vehicle-water";
import { WEATHER_SEASON_EMOJIS } from "./data/weather-season";
import type {
  CurriculumTheme,
  EmojiCategory,
  EmojiEntry,
  EmojiGroup,
} from "./types";

// ── Category → emoji entries map ─────────────────────────────────
export const EMOJI_CATEGORIES: Record<EmojiCategory, EmojiEntry[]> = {
  "animal-bird": ANIMAL_BIRD_EMOJIS,
  "animal-farm": ANIMAL_FARM_EMOJIS,
  "animal-insect": ANIMAL_INSECT_EMOJIS,
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
  "shape-color": SHAPE_COLOR_EMOJIS,
  "sky-space": SKY_SPACE_EMOJIS,
  "sport-game": SPORT_GAME_EMOJIS,
  time: TIME_EMOJIS,
  tool: TOOL_EMOJIS,
  vegetable: VEGETABLE_EMOJIS,
  "vehicle-air": VEHICLE_AIR_EMOJIS,
  "vehicle-rail": VEHICLE_RAIL_EMOJIS,
  "vehicle-road": VEHICLE_ROAD_EMOJIS,
  "vehicle-water": VEHICLE_WATER_EMOJIS,
  "weather-season": WEATHER_SEASON_EMOJIS,
};

// ── All emojis flat array ────────────────────────────────────────
export const ALL_EMOJIS: EmojiEntry[] = Object.values(EMOJI_CATEGORIES).flat();

// ── Curriculum theme → emoji entries map ─────────────────────────
export const CURRICULUM_EMOJI_MAP: Record<CurriculumTheme, EmojiEntry[]> =
  (() => {
    const map = {} as Record<CurriculumTheme, EmojiEntry[]>;
    for (const theme of Object.keys(
      CURRICULUM_THEME_CATEGORIES
    ) as CurriculumTheme[]) {
      const categories = CURRICULUM_THEME_CATEGORIES[theme];
      map[theme] = categories.flatMap((cat) => EMOJI_CATEGORIES[cat] ?? []);
    }
    return map;
  })();

// ── Group → emoji entries ────────────────────────────────────────
export const GROUP_EMOJI_MAP: Record<EmojiGroup, EmojiEntry[]> = (() => {
  const map = {} as Record<EmojiGroup, EmojiEntry[]>;
  for (const group of Object.keys(EMOJI_GROUPS) as EmojiGroup[]) {
    const categories = EMOJI_GROUPS[group];
    map[group] = categories.flatMap((cat) => EMOJI_CATEGORIES[cat] ?? []);
  }
  return map;
})();
