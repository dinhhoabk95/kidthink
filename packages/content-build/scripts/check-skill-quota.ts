import { repoPath } from "@mindkid/config/paths";
import {
  evaluateSkillQuota,
  evaluateSkillQuotaWithDebt,
  readCoverageRatchet,
  readSkillQuotaDebt,
} from "#src/gates/skill-quota";
import { ALL_SEED_LEVELS } from "#src/index";

function main(): void {
  const isStrict = process.argv.includes("--strict");
  const report = evaluateSkillQuota(ALL_SEED_LEVELS, repoPath("docs/taxonomy"));
  const debt = readSkillQuotaDebt();
  const debtEval = evaluateSkillQuotaWithDebt(report, debt);

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
    `- Trần bậc thang kỹ năng chưa có nội dung (BR-SKQ-06): ${report.skillsWithZeroLevelsCount}/${readCoverageRatchet().max_skills_without_levels}`
  );
  console.log(
    `- Skills đạt đa dạng khuôn: ${report.skillsMeetingDiversityCount}/${report.totalSkills}`
  );
  console.log(`- Skills trắng (0 level): ${report.skillsWithZeroLevelsCount}`);
  console.log(`- Skills 1 khuôn duy nhất: ${report.skillsSingleTemplateCount}`);
  console.log(`- Vi phạm tổng cộng (raw): ${report.violations.length}`);
  console.log(
    `- Vi phạm trong sổ nợ bậc thang (BR-SKQ-02/03): ${debtEval.debtViolations.length}/${debtEval.maxViolations}`
  );
  console.log(
    `- Vi phạm mới ngoài sổ nợ: ${debtEval.unexcusedViolations.length}`
  );

  const passed = isStrict ? report.passed : debtEval.passed;

  if (passed) {
    console.log(
      `\n✅ CỔNG XANH: ${report.skillsMeetingQuotaCount}/${report.totalSkills} skill đạt hạn ngạch, ${debtEval.debtViolations.length}/${debtEval.maxViolations} vi phạm nằm trong trần sổ nợ chỉ giảm (BR-SKQ-02/03), 0 vi phạm mới.`
    );
    process.exit(0);
  } else {
    console.log(
      `\n❌ CỔNG ĐỎ: Phát hiện ${debtEval.unexcusedViolations.length} vi phạm ngoài sổ nợ và ${debtEval.staleEntries.length} mục nợ đã trả cần thu gọn.`
    );
    const toPrint = isStrict
      ? report.violations.map((v) => `[${v.ruleId}] ${v.message}`)
      : [
          ...debtEval.unexcusedViolations.map(
            (v) => `[${v.ruleId}] ${v.message}`
          ),
          ...debtEval.staleEntries,
        ];
    console.log("Chi tiết vi phạm:");
    for (const line of toPrint) {
      console.log(`  - ${line}`);
    }
    process.exit(1);
  }
}

main();
