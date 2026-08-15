/**
 * Seed manifest mappings for D-KJ and BR-CRQ-05.
 * Maps level/lesson code patterns to the canonical seeder file path in repo.
 */

export const SEED_MANIFEST_MAP: Record<string, string> = {
  C1: "packages/db/src/seed-content/c1/levels.ts",
  C2: "packages/db/src/seed-content/c2/levels.ts",
  C3: "packages/db/src/seed-content/c3/levels.ts",
  C4: "packages/db/src/seed-content/c4/levels.ts",
  C5: "packages/db/src/seed-content/c5/levels.ts",
  C6: "packages/db/src/seed-content/c6/levels.ts",
};

const LEVEL_COMPETENCY_REGEX = /^GL-(C[1-6])-/;

/**
 * Returns the seeder file path from seed manifest for a given content code.
 * Returns null if the code is not recognized in the manifest (D-KJ).
 */
export function getSeederFilePathForCode(code: string): string | null {
  if (!code || typeof code !== "string") {
    return null;
  }

  const match = code.match(LEVEL_COMPETENCY_REGEX);
  if (match?.[1] && SEED_MANIFEST_MAP[match[1]]) {
    return SEED_MANIFEST_MAP[match[1]];
  }

  return null;
}

/**
 * Formats the warning label for repo_seed content drift (BR-CRQ-05, D-KJ).
 */
export function getSeederDriftWarning(code: string): {
  isKnown: boolean;
  filePath: string | null;
  message: string;
} {
  const filePath = getSeederFilePathForCode(code);
  if (filePath) {
    return {
      isKnown: true,
      filePath,
      message: `Bản này tách khỏi seeder — vui lòng cập nhật lại file '${filePath}' trong repo (BR-CRQ-05)`,
    };
  }

  return {
    isKnown: false,
    filePath: null,
    message:
      "Không xác định được file seeder — kiểm tay trước khi publish (D-KJ)",
  };
}
