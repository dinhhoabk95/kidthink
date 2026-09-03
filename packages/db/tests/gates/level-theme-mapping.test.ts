import { describe, expect, it } from "vitest";
import { runEightGates } from "#src/seed-content/gates/runner";
import type { ContentSeed } from "#src/seed-content/types";

describe("Theme mapping & Cổng 3 Asset validation — Task #191 & Task #202 (BR-CSA-13)", () => {
  it("Cổng 3 từ chối level chứa emoji ref rỗng", () => {
    const fakeSeed: ContentSeed = {
      header: {
        code: "GL-C1-CNT-TAP-9999",
        template_code: "GT-001",
        title: "Bài test emoji giả",
        instruction: "Bé chạm vào quả táo nhé",
        theme_tag: "school",
        what_tags: ["number"],
        thinking_tags: ["observe"],
        skill_codes: ["C1.CNT.01"],
        learning_objective_codes: ["LO-C1.CNT.01-01"],
        difficulty: 1,
        age_min: 3,
        age_max: 4,
        access_tier: "free",
        content_version: 1,
        authored_in: "repo_seed",
        origin: "ai_assisted",
      },
      content_pack: {
        prompt: "Bé chạm vào hình nhé",
        target_item: {
          item_id: "item_fake",
          asset: { kind: "emoji", ref: "" },
        },
        options: [
          {
            item_id: "opt_1",
            asset: { kind: "emoji", ref: "" },
            is_correct: true,
          },
        ],
      },
      difficulty_params: {
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };

    const results = runEightGates(fakeSeed, new Set());
    const gate3 = results.find((r) => r.gate === 3);

    expect(gate3).toBeDefined();
    expect(gate3?.passed).toBe(false);
    expect(gate3?.issues.some((i) => i.code === "ASSET_REF_INVALID")).toBe(
      true
    );
  });

  it("Cổng 3 chấp nhận level chứa emoji ref hợp lệ", () => {
    const validSeed: ContentSeed = {
      header: {
        code: "GL-C1-CNT-TAP-9998",
        template_code: "GT-001",
        title: "Bài test emoji chuẩn",
        instruction: "Bé chạm vào quả táo nhé",
        theme_tag: "school",
        what_tags: ["number"],
        thinking_tags: ["observe"],
        skill_codes: ["C1.CNT.01"],
        learning_objective_codes: ["LO-C1.CNT.01-01"],
        difficulty: 1,
        age_min: 3,
        age_max: 4,
        access_tier: "free",
        content_version: 1,
        authored_in: "repo_seed",
        origin: "ai_assisted",
      },
      content_pack: {
        prompt: "Bé chạm vào hình nhé",
        target_item: {
          item_id: "item_apple",
          asset: { kind: "emoji", ref: "🍎" },
        },
        options: [
          {
            item_id: "opt_1",
            asset: { kind: "emoji", ref: "🍎" },
            is_correct: true,
          },
        ],
      },
      difficulty_params: {
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };

    const results = runEightGates(validSeed, new Set());
    const gate3 = results.find((r) => r.gate === 3);

    expect(gate3).toBeDefined();
    expect(gate3?.passed).toBe(true);
  });
});
