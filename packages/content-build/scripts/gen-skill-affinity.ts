import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { buildSkillTemplateAffinityMatrix } from "../src/gates/skill-template-affinity.js";

function main(): void {
  const matrix = buildSkillTemplateAffinityMatrix();
  const outputPath = repoPath(
    "packages/content-build/src/thresholds/skill-template-affinity.json"
  );
  fs.writeFileSync(outputPath, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");

  console.log(`Đã sinh ${outputPath}:`);
  console.log(`- Tổng skills: ${matrix.total_skills}`);
  console.log(`- Tổng templates: ${matrix.total_templates}`);
  console.log(`- Skills band 3-4: ${matrix.metrics.band_3_4_skills_count}`);
  console.log(
    `- Skills C1 < 4 khuôn: ${matrix.metrics.c1_skills_below_4_count}`
  );
  console.log(`- Skills < 2 khuôn: ${matrix.metrics.all_skills_below_2_count}`);
  console.log(
    `- Skills 1 khuôn: ${matrix.metrics.single_template_skills_count}`
  );
  console.log(`- Skills 0 khuôn: ${matrix.metrics.zero_template_skills_count}`);
}

main();
