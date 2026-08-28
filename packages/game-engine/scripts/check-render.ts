/**
 * Cổng kiểm tra hợp đồng vẽ `render()` của game engine.
 *
 * Quy tắc: `BR-ERC-01`, `BR-ERC-03`, `BR-ERC-05`
 * Contract: docs/specs/01-platform/engine-render-contract.md
 *
 * Chạy: pnpm --filter @mindkid/game-engine check:render
 */
import { repoPath } from "@mindkid/config/paths";
import { formatRenderReport, scanRenderGate } from "../tests/gates/render.js";

function main(): void {
  const templatesDir = repoPath("packages/game-engine/src/templates");
  const configPath = repoPath(
    "packages/game-engine/config/render-implemented.json"
  );

  const result = scanRenderGate(templatesDir, configPath);
  const report = formatRenderReport(result);

  console.log("check:render");
  console.log(report);

  if (result.violations.length > 0) {
    process.exit(1);
  }
}

main();
