import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { generateLevelAllocationPlan } from "#src/seed-content/gates/level-allocation";

function main(): void {
  const plan = generateLevelAllocationPlan();
  const outputPath = repoPath("packages/db/config/level-allocation.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

  console.log(`Đã sinh ${outputPath}:`);
  console.log(`- Tổng số level phân bổ: ${plan.target_total_levels}`);
  console.log(`- Tổng số skill: ${plan.total_skills}`);
  console.log(`- Tổng số dòng phân bổ: ${plan.total_allocations}`);
  console.log(
    `- Tổng số cặp phân biệt (skill, khuôn): ${plan.distinct_pairs_count}`
  );
  console.log("- Phân bố chủ đề:");
  for (const [theme, count] of Object.entries(plan.theme_distribution)) {
    const pct = ((count / plan.target_total_levels) * 100).toFixed(1);
    console.log(`  • ${theme}: ${count} (${pct}%)`);
  }
}

main();
