import { repoPath } from "@mindkid/config/paths";
import { evaluateSkillQuota } from "#src/seed-content/gates/skill-quota";
import { ALL_SEED_LEVELS } from "#src/seed-content/index";

function main(): void {
  const report = evaluateSkillQuota(ALL_SEED_LEVELS, repoPath("docs/taxonomy"));

  console.log("=== CỔNG HẠN NGẠCH VÀ ĐA DẠNG SKILL (check:skill-quota) ===");
  console.log(`- Tổng số skill: ${report.totalSkills}`);
  console.log(`- Số level hợp lệ (qua contract): ${report.totalValidLevels}`);
  console.log(
    `- Số cặp (skill, khuôn) phân biệt: ${report.totalDistinctPairs}`
  );
  console.log(
    `- Skills đạt hạn ngạch level: ${report.skillsMeetingQuotaCount}/${report.totalSkills}`
  );
  console.log(
    `- Skills đạt đa dạng khuôn: ${report.skillsMeetingDiversityCount}/${report.totalSkills}`
  );
  console.log(`- Skills trắng (0 level): ${report.skillsWithZeroLevelsCount}`);
  console.log(`- Skills 1 khuôn duy nhất: ${report.skillsSingleTemplateCount}`);
  console.log(`- Vi phạm tổng cộng: ${report.violations.length}`);

  if (report.passed) {
    console.log(
      "\n✅ CỔNG XANH: Toàn bộ 230 skill đạt hạn ngạch và đa dạng khuôn!"
    );
    process.exit(0);
  } else {
    console.log(
      `\n❌ CỔNG ĐỎ: Còn ${report.deficits.length} skill chưa đạt hạn ngạch hoặc vi phạm trần/đa dạng.`
    );
    process.exit(1);
  }
}

main();
