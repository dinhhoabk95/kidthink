import { GT001Generator } from "./gt001.js";
import { GT002Generator } from "./gt002.js";
import { GT003Generator } from "./gt003.js";
import { GT004Generator } from "./gt004.js";
import { GT005Generator } from "./gt005.js";
import { GT006Generator } from "./gt006.js";
import { GT007Generator } from "./gt007.js";
import { GT008Generator } from "./gt008.js";
import { GT010Generator } from "./gt010.js";
import { GT011Generator } from "./gt011.js";
import { GT012Generator } from "./gt012.js";
import { GT018Generator } from "./gt018.js";
import { GT019Generator } from "./gt019.js";
import { GT020Generator } from "./gt020.js";
import { GT022Generator } from "./gt022.js";
import { GT023Generator } from "./gt023.js";
import { GT025Generator } from "./gt025.js";
import { GT026Generator } from "./gt026.js";
import { GT027Generator } from "./gt027.js";
import { GT028Generator } from "./gt028.js";
import { GT029Generator } from "./gt029.js";
import { GT030Generator } from "./gt030.js";
import { GT031Generator } from "./gt031.js";
import { GT032Generator } from "./gt032.js";
import { GT033Generator } from "./gt033.js";
import type { LevelGenerator } from "./types.js";

export type {
  GeneratedLevel,
  GeneratorInput,
  LevelGenerator,
  ThemeVocabulary,
  VocabularyEntry,
} from "./types.js";

export const ALL_LEVEL_GENERATORS: Record<string, LevelGenerator> = {
  "GT-001": GT001Generator,
  "GT-002": GT002Generator,
  "GT-003": GT003Generator,
  "GT-004": GT004Generator,
  "GT-005": GT005Generator,
  "GT-006": GT006Generator,
  "GT-007": GT007Generator,
  "GT-008": GT008Generator,
  "GT-010": GT010Generator,
  "GT-011": GT011Generator,
  "GT-012": GT012Generator,
  "GT-018": GT018Generator,
  "GT-019": GT019Generator,
  "GT-020": GT020Generator,
  "GT-022": GT022Generator,
  "GT-023": GT023Generator,
  "GT-025": GT025Generator,
  "GT-026": GT026Generator,
  "GT-027": GT027Generator,
  "GT-028": GT028Generator,
  "GT-029": GT029Generator,
  "GT-030": GT030Generator,
  "GT-031": GT031Generator,
  "GT-032": GT032Generator,
  "GT-033": GT033Generator,
};

export function getLevelGenerator(code: string): LevelGenerator | undefined {
  return ALL_LEVEL_GENERATORS[code];
}
