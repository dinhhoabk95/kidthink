import { describe, it } from "vitest";
import {
  ActivityCodeSchema,
  CompetencyCodeSchema,
  CurriculumCodeSchema,
  EmojiEntryCodeSchema,
  EntitlementKeySchema,
  GameLevelCodeSchema,
  GameTemplateCodeSchema,
  LearningObjectiveCodeSchema,
  LessonCodeSchema,
  PackageCodeSchema,
  SkillCodeSchema,
  StrandCodeSchema,
  ThemeCodeSchema,
  WorksheetCodeSchema,
} from "../src/index.js";

// Helper: assert parse succeeds — returns void, throws on failure
function ok(schema: { parse: (v: string) => unknown }, value: string) {
  schema.parse(value); // throws ZodError if invalid
}

// Helper: assert parse fails — returns void, throws if parse succeeds
function fail(schema: { parse: (v: string) => unknown }, value: string) {
  let threw = false;
  try {
    schema.parse(value);
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error(`Expected parse to fail for: ${value}`);
  }
}

// ─── CompetencyCode ──────────────────────────────────────────────────

describe("BR-ID-05: CompetencyCodeSchema", () => {
  it.each(["C1", "C2", "C3", "C4", "C5", "C6"])("accepts %s", (v) => {
    ok(CompetencyCodeSchema, v);
  });

  it.each(["C0", "C7", "C10", "c1", "CC1", "", "C"])("rejects %s", (v) => {
    fail(CompetencyCodeSchema, v);
  });
});

// ─── StrandCode ──────────────────────────────────────────────────────

describe("StrandCodeSchema", () => {
  it.each(["C1.CNT", "C2.ORI", "C6.PLN", "C1.NCOMP", "C3.RULE"])(
    "accepts %s",
    (v) => {
      ok(StrandCodeSchema, v);
    }
  );

  it.each(["C1.c", "C1.A", "C1.ABCDEF", "C0.CNT", "C7.CNT", "CNT", ""])(
    "rejects %s",
    (v) => {
      fail(StrandCodeSchema, v);
    }
  );
});

// ─── SkillCode ───────────────────────────────────────────────────────

describe("SkillCodeSchema", () => {
  it.each(["C1.CNT.01", "C1.CNT.03", "C6.MON.99", "C1.NCOMP.12"])(
    "accepts %s",
    (v) => {
      ok(SkillCodeSchema, v);
    }
  );

  it.each([
    "C1.CNT.1", // single digit
    "C1.CNT.100", // three digits
    "c1.cnt.03", // lowercase
    "C1.CNT", // no skill number
    "C1.cnt.03", // lowercase strand
  ])("rejects %s", (v) => {
    fail(SkillCodeSchema, v);
  });
});

// ─── LearningObjectiveCode ───────────────────────────────────────────

describe("LearningObjectiveCodeSchema", () => {
  it.each(["LO-C1.CNT.03-01", "LO-C6.MON.01-99"])("accepts %s", (v) => {
    ok(LearningObjectiveCodeSchema, v);
  });

  it.each(["LO-C1.CNT.03", "C1.CNT.03-01", "LO-C0.CNT.03-01"])(
    "rejects %s",
    (v) => {
      fail(LearningObjectiveCodeSchema, v);
    }
  );
});

// ─── GameTemplateCode ────────────────────────────────────────────────

describe("GameTemplateCodeSchema", () => {
  it.each(["GT-001", "GT-003", "GT-999"])("accepts %s", (v) => {
    ok(GameTemplateCodeSchema, v);
  });

  it.each(["GT-01", "GT-0001", "GT001", "gt-001"])("rejects %s", (v) => {
    fail(GameTemplateCodeSchema, v);
  });
});

// ─── GameLevelCode ───────────────────────────────────────────────────

describe("GameLevelCodeSchema", () => {
  it.each([
    "GL-C1-CNT-MATCH-0007",
    "GL-C2-ORI-DRAG-0001",
    "GL-C6-PLN-MAZE-9999",
    "GL-C1-NCOMP-PAIR-0042",
  ])("accepts %s", (v) => {
    ok(GameLevelCodeSchema, v);
  });

  it.each([
    "GL-C1-CNT-007", // missing template segment
    "GL-C1-CNT-MATCH-007", // 3 digits
    "GL-C0-CNT-MATCH-0007", // C0 invalid
    "G-C1-CNT-MATCH-0007", // wrong prefix
    "GL-C1-cnt-MATCH-0007", // lowercase strand
  ])("rejects %s", (v) => {
    fail(GameLevelCodeSchema, v);
  });
});

// ─── LessonCode ──────────────────────────────────────────────────────

describe("LessonCodeSchema", () => {
  it.each(["LES-0001", "LES-0042", "LES-9999"])("accepts %s", (v) => {
    ok(LessonCodeSchema, v);
  });

  it.each(["LES-001", "LES-00001", "les-0001"])("rejects %s", (v) => {
    fail(LessonCodeSchema, v);
  });
});

// ─── ActivityCode ────────────────────────────────────────────────────

describe("ActivityCodeSchema", () => {
  it.each(["ACT-0001", "ACT-0117", "ACT-9999"])("accepts %s", (v) => {
    ok(ActivityCodeSchema, v);
  });

  it.each(["ACT-001", "ACT-00001", "act-0001"])("rejects %s", (v) => {
    fail(ActivityCodeSchema, v);
  });
});

// ─── CurriculumCode ──────────────────────────────────────────────────

describe("CurriculumCodeSchema", () => {
  it.each(["CUR-001", "CUR-999"])("accepts %s", (v) => {
    ok(CurriculumCodeSchema, v);
  });

  it.each(["CUR-01", "CUR-0001", "cur-001"])("rejects %s", (v) => {
    fail(CurriculumCodeSchema, v);
  });
});

// ─── WorksheetCode ───────────────────────────────────────────────────

describe("WorksheetCodeSchema", () => {
  it.each(["WS-0001", "WS-0009", "WS-9999"])("accepts %s", (v) => {
    ok(WorksheetCodeSchema, v);
  });

  it.each(["WS-001", "WS-00001", "ws-0001"])("rejects %s", (v) => {
    fail(WorksheetCodeSchema, v);
  });
});

// ─── PackageCode ─────────────────────────────────────────────────────

describe("PackageCodeSchema", () => {
  it.each(["PKG-premium", "PKG-free_tier", "PKG-abc"])("accepts %s", (v) => {
    ok(PackageCodeSchema, v);
  });

  it.each([
    "PKG-ab", // too short (2 chars after PKG-)
    "PKG-Premium", // uppercase
    "PKG-a".padEnd(29, "a"), // too long (>24 after PKG-)
    "PKG-free-tier", // hyphen not allowed
  ])("rejects %s", (v) => {
    fail(PackageCodeSchema, v);
  });
});

// ─── EntitlementKey ──────────────────────────────────────────────────

describe("EntitlementKeySchema", () => {
  it.each(["play_premium_games", "access_reports", "a1234"])(
    "accepts %s",
    (v) => {
      ok(EntitlementKeySchema, v);
    }
  );

  it.each([
    "ab", // too short (total 2, need 5+)
    "1play", // starts with digit
    "Play_Games", // uppercase
  ])("rejects %s", (v) => {
    fail(EntitlementKeySchema, v);
  });
});

// ─── ThemeCode ───────────────────────────────────────────────────────

describe("ThemeCodeSchema", () => {
  it.each(["farm", "ocean", "winter-land"])("accepts %s", (v) => {
    ok(ThemeCodeSchema, v);
  });

  it.each(["ab", "Farm", "a_b", "a".padEnd(30, "a")])("rejects %s", (v) => {
    fail(ThemeCodeSchema, v);
  });
});

// ─── EmojiEntryCode ──────────────────────────────────────────────────

describe("EmojiEntryCodeSchema", () => {
  it.each(["EMJ-apple-red", "EMJ-ab", "EMJ-123"])("accepts %s", (v) => {
    ok(EmojiEntryCodeSchema, v);
  });

  it.each(["EMJ-a", "EMJ-Apple", "emj-apple"])("rejects %s", (v) => {
    fail(EmojiEntryCodeSchema, v);
  });
});
