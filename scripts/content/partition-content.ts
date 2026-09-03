import fs from "node:fs";
import path from "node:path";
import { ALL_SEED_ACTIVITIES } from "../../packages/db/src/seed-content/activities/index.ts";
import { ALL_SEED_LESSONS } from "../../packages/db/src/seed-content/lessons/index.ts";

export function partitionActivities(
  outDir = "packages/content/src/activities"
): void {
  fs.mkdirSync(outDir, { recursive: true });
  const compMap: Record<string, typeof ALL_SEED_ACTIVITIES> = {
    c1: [],
    c2: [],
    c3: [],
    c4: [],
    c5: [],
    c6: [],
  };

  for (const act of ALL_SEED_ACTIVITIES) {
    const compKey = act.header.skill_codes[0]?.slice(0, 2).toLowerCase();
    if (!(compKey && compMap[compKey])) {
      throw new Error(
        `Unknown competency for activity ${act.header.code}: ${act.header.skill_codes}`
      );
    }
    compMap[compKey].push(act);
  }

  for (const [compKey, acts] of Object.entries(compMap)) {
    const varName = `${compKey.toUpperCase()}_ACTIVITIES`;
    const content = `import type { ActivitySeed } from "../types.js";

/**
 * Activities for competency ${compKey.toUpperCase()} (${acts.length} activities).
 * Partitioned automatically by competency (Task #208 / G4).
 */
export const ${varName}: readonly ActivitySeed[] = ${JSON.stringify(acts, null, 2)};
`;
    const filePath = path.join(outDir, `${compKey}.ts`);
    fs.writeFileSync(filePath, content, "utf8");
    console.log(
      `[partition-content] Wrote ${filePath} (${acts.length} activities)`
    );
  }

  // index.ts
  const indexContent = `import type { ActivitySeed } from "../types.js";
import { C1_ACTIVITIES } from "./c1.js";
import { C2_ACTIVITIES } from "./c2.js";
import { C3_ACTIVITIES } from "./c3.js";
import { C4_ACTIVITIES } from "./c4.js";
import { C5_ACTIVITIES } from "./c5.js";
import { C6_ACTIVITIES } from "./c6.js";

export {
  C1_ACTIVITIES,
  C2_ACTIVITIES,
  C3_ACTIVITIES,
  C4_ACTIVITIES,
  C5_ACTIVITIES,
  C6_ACTIVITIES,
};

export const ALL_ACTIVITIES: readonly ActivitySeed[] = [
  ...C1_ACTIVITIES,
  ...C2_ACTIVITIES,
  ...C3_ACTIVITIES,
  ...C4_ACTIVITIES,
  ...C5_ACTIVITIES,
  ...C6_ACTIVITIES,
];
`;
  fs.writeFileSync(path.join(outDir, "index.ts"), indexContent, "utf8");
  console.log(`[partition-content] Wrote ${path.join(outDir, "index.ts")}`);
}

export function partitionLessons(
  outDir = "packages/content/src/lessons"
): void {
  fs.mkdirSync(outDir, { recursive: true });
  const compMap: Record<string, typeof ALL_SEED_LESSONS> = {
    c1: [],
    c2: [],
    c3: [],
    c4: [],
    c5: [],
    c6: [],
  };

  for (const les of ALL_SEED_LESSONS) {
    const compKey = les.header.skill_codes[0]?.slice(0, 2).toLowerCase();
    if (!(compKey && compMap[compKey])) {
      throw new Error(
        `Unknown competency for lesson ${les.header.code}: ${les.header.skill_codes}`
      );
    }
    compMap[compKey].push(les);
  }

  for (const [compKey, lessons] of Object.entries(compMap)) {
    const varName = `${compKey.toUpperCase()}_LESSONS`;
    const content = `import type { LessonSeed } from "../types.js";

/**
 * Lessons for competency ${compKey.toUpperCase()} (${lessons.length} lessons).
 * Partitioned automatically by competency (Task #208 / G4).
 */
export const ${varName}: readonly LessonSeed[] = ${JSON.stringify(lessons, null, 2)};
`;
    const filePath = path.join(outDir, `${compKey}.ts`);
    fs.writeFileSync(filePath, content, "utf8");
    console.log(
      `[partition-content] Wrote ${filePath} (${lessons.length} lessons)`
    );
  }

  // index.ts
  const indexContent = `import type { LessonSeed } from "../types.js";
import { C1_LESSONS } from "./c1.js";
import { C2_LESSONS } from "./c2.js";
import { C3_LESSONS } from "./c3.js";
import { C4_LESSONS } from "./c4.js";
import { C5_LESSONS } from "./c5.js";
import { C6_LESSONS } from "./c6.js";

export {
  C1_LESSONS,
  C2_LESSONS,
  C3_LESSONS,
  C4_LESSONS,
  C5_LESSONS,
  C6_LESSONS,
};

export const ALL_LESSONS: readonly LessonSeed[] = [
  ...C1_LESSONS,
  ...C2_LESSONS,
  ...C3_LESSONS,
  ...C4_LESSONS,
  ...C5_LESSONS,
  ...C6_LESSONS,
];
`;
  fs.writeFileSync(path.join(outDir, "index.ts"), indexContent, "utf8");
  console.log(`[partition-content] Wrote ${path.join(outDir, "index.ts")}`);
}

if (process.argv[1]?.endsWith("partition-content.ts")) {
  partitionActivities();
  partitionLessons();
}
