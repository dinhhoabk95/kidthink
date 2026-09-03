import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_TEMPLATES } from "@mindkid/game-engine";
import { ALL_SEED_LEVELS } from "../packages/db/src/seed-content/index.js";

interface BaselineData {
  uncovered_skills_count: number;
}

const BASELINE_PATH = join(import.meta.dirname, "intro-coverage-baseline.json");

export function measureIntroCoverageDebt(): {
  totalAssessSkills: number;
  coveredSkills: number;
  uncoveredSkillsCount: number;
  uncoveredSkillCodes: string[];
} {
  const assessSkills = new Set<string>();
  const teachSkills = new Set<string>();

  for (const level of ALL_SEED_LEVELS) {
    const tmplCode = level.header.template_code;
    const tmpl = ALL_TEMPLATES[tmplCode];
    const kind = tmpl?.kind ?? "assess";

    for (const sc of level.header.skill_codes) {
      if (kind === "teach") {
        teachSkills.add(sc);
      } else {
        assessSkills.add(sc);
      }
    }
  }

  const uncoveredSkillCodes: string[] = [];
  for (const code of assessSkills) {
    if (!teachSkills.has(code)) {
      uncoveredSkillCodes.push(code);
    }
  }

  return {
    totalAssessSkills: assessSkills.size,
    coveredSkills: assessSkills.size - uncoveredSkillCodes.length,
    uncoveredSkillsCount: uncoveredSkillCodes.length,
    uncoveredSkillCodes,
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const isUpdate = args.includes("--update");

  let baseline: BaselineData = { uncovered_skills_count: 408 };
  if (existsSync(BASELINE_PATH)) {
    try {
      baseline = JSON.parse(
        readFileSync(BASELINE_PATH, "utf-8")
      ) as BaselineData;
    } catch {
      // fallback to default
    }
  }

  const { totalAssessSkills, coveredSkills, uncoveredSkillsCount } =
    measureIntroCoverageDebt();

  console.log("📊 [check-intro-coverage] Đo độ phủ bài làm quen khái niệm:");
  console.log(`   - Tổng số kỹ năng có game assess: ${totalAssessSkills}`);
  console.log(`   - Đã có bài làm quen (teach): ${coveredSkills}`);
  console.log(`   - Chưa có bài làm quen (nợ): ${uncoveredSkillsCount}`);
  console.log(`   - Baseline hiện tại: ${baseline.uncovered_skills_count}`);

  if (isUpdate) {
    if (uncoveredSkillsCount > baseline.uncovered_skills_count) {
      console.error(
        `❌ Không thể cập nhật baseline: nợ tăng từ ${baseline.uncovered_skills_count} lên ${uncoveredSkillsCount}.`
      );
      process.exit(1);
    }
    const nextData: BaselineData = {
      uncovered_skills_count: uncoveredSkillsCount,
    };
    writeFileSync(
      BASELINE_PATH,
      `${JSON.stringify(nextData, null, 2)}\n`,
      "utf-8"
    );
    console.log(
      `✅ Đã cập nhật baseline độ phủ thành ${uncoveredSkillsCount}.`
    );
    process.exit(0);
  }

  if (uncoveredSkillsCount > baseline.uncovered_skills_count) {
    console.error(
      `❌ Cổng đỏ (BR-CIG-13): Nợ độ phủ bài làm quen tăng từ ${baseline.uncovered_skills_count} lên ${uncoveredSkillsCount}.`
    );
    process.exit(1);
  }

  if (uncoveredSkillsCount < baseline.uncovered_skills_count) {
    console.log(
      `🎉 Độ phủ bài làm quen tăng! Nợ giảm từ ${baseline.uncovered_skills_count} xuống ${uncoveredSkillsCount}. Hãy chạy với --update để hạ baseline.`
    );
  } else {
    console.log("✅ Cổng xanh: Nợ độ phủ bài làm quen đạt yêu cầu baseline.");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
