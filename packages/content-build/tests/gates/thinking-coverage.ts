import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import {
  DEFAULT_CONFIG,
  evaluateThinkingCoverage,
  formatCoverageReport,
  type ThinkingCoverageConfig,
} from "#src/gates/thinking-coverage";
import { loadItemsFromSeedCorpus } from "./thinking-coverage-source.ts";

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const runCli = async (): Promise<void> => {
    const { items, unresolved } = await loadItemsFromSeedCorpus();
    if (unresolved.length > 0) {
      for (const u of unresolved) {
        process.stderr.write(`✗ [BR-TCM-03] ${u.code}: ${u.reason}\n`);
      }
      process.exit(1);
    }

    const configPath = repoPath(
      "packages/content-build/tests/gates/thinking-coverage-config.json"
    );
    const config: ThinkingCoverageConfig = {
      ...DEFAULT_CONFIG,
      ...(JSON.parse(
        readFileSync(configPath, "utf8")
      ) as Partial<ThinkingCoverageConfig>),
    };

    const result = evaluateThinkingCoverage(items, config);
    process.stdout.write(`${formatCoverageReport(result, config)}\n`);
    if (!result.passed) {
      process.exit(1);
    }
  };

  runCli().catch((err: Error) => {
    process.stderr.write(`✗ thinking-coverage error: ${err.message}\n`);
    process.exit(1);
  });
}
