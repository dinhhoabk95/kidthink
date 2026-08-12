import fs from "node:fs";
import path from "node:path";

export interface FileItem {
  filePath: string;
  content: string;
}

function isKidSurfaceFile(filePath: string): boolean {
  return (
    filePath.includes("pages/play") ||
    filePath.includes("pages/play/") ||
    filePath.includes("components/play/") ||
    filePath.includes("components/play") ||
    filePath.includes("templates/GT-")
  );
}

function checkGrowthLoops(file: FileItem, violations: string[]): void {
  const contentLower = file.content.toLowerCase();
  if (
    contentLower.includes("chơi thêm") ||
    contentLower.includes("play_more") ||
    contentLower.includes("play-more")
  ) {
    violations.push(
      `BR-HPL-05 VIOLATION: "${file.filePath}" contains prohibited 'play more' button or text on kid surface.`
    );
  }
  if (
    contentLower.includes("streak_bonus") ||
    contentLower.includes("forced_streak") ||
    contentLower.includes("daily_streak_count")
  ) {
    violations.push(
      `BR-HPL-05 VIOLATION: "${file.filePath}" contains forced streak pressure on kid surface.`
    );
  }
  if (
    contentLower.includes("countdown_ms") ||
    contentLower.includes("pressure_timer") ||
    contentLower.includes("time_remaining_sec")
  ) {
    violations.push(
      `BR-HPL-05 VIOLATION: "${file.filePath}" contains countdown pressure timer on kid surface.`
    );
  }
  if (
    contentLower.includes("quay lại chơi") ||
    contentLower.includes("come_back_and_play")
  ) {
    violations.push(
      `BR-HPL-05 VIOLATION: "${file.filePath}" contains return-bait notification text.`
    );
  }
}

function checkPaymentAndScores(file: FileItem, violations: string[]): void {
  const contentLower = file.content.toLowerCase();
  if (
    contentLower.includes("package_price") ||
    contentLower.includes("billing_amount") ||
    contentLower.includes("checkout_button") ||
    contentLower.includes("subscription_plan_fee")
  ) {
    violations.push(
      `BR-PGT-05 VIOLATION: "${file.filePath}" contains payment or subscription data on kid play surface.`
    );
  }
  if (
    contentLower.includes("score_points_number") ||
    contentLower.includes("display_numeric_score")
  ) {
    violations.push(
      `BR-SCO-02 VIOLATION: "${file.filePath}" contains raw numeric score display on kid surface.`
    );
  }
}

function checkTokensAndPhrases(file: FileItem, violations: string[]): void {
  const contentLower = file.content.toLowerCase();
  if (
    contentLower.includes("danger") &&
    (contentLower.includes("token") ||
      contentLower.includes("color") ||
      contentLower.includes("bg-") ||
      contentLower.includes("text-"))
  ) {
    violations.push(
      `BR-FBK-01 VIOLATION: "${file.filePath}" uses danger/red token on kid play surface.`
    );
  }
  if (
    file.content.includes("Sai rồi") ||
    file.content.includes("Không đúng") ||
    file.content.includes("Bé chưa giỏi")
  ) {
    violations.push(
      `BR-FBK-08 VIOLATION: "${file.filePath}" contains reprimanding phrase on kid play surface.`
    );
  }
}

function checkKidCatalogRules(file: FileItem, violations: string[]): void {
  const contentLower = file.content.toLowerCase();
  if (
    contentLower.includes("search_input_text") ||
    contentLower.includes("filter_dropdown_text") ||
    contentLower.includes("text_search_query")
  ) {
    violations.push(
      `BR-PEN-03 VIOLATION: "${file.filePath}" contains text search input or filter dropdown on kid surface.`
    );
  }
  if (
    contentLower.includes("upgrade_plan_button") ||
    contentLower.includes("plan_price_tag") ||
    contentLower.includes("commercial_price_display")
  ) {
    violations.push(
      `BR-PEN-04 VIOLATION: "${file.filePath}" contains pricing, plan details, or upgrade button on kid surface.`
    );
  }
}

export function scanKidSurfaceRules(files: FileItem[]): void {
  const violations: string[] = [];

  for (const file of files) {
    if (isKidSurfaceFile(file.filePath)) {
      checkGrowthLoops(file, violations);
      checkPaymentAndScores(file, violations);
      checkTokensAndPhrases(file, violations);
      checkKidCatalogRules(file, violations);
    }
  }

  if (violations.length > 0) {
    throw new Error(violations.join("\n"));
  }
}

export function readCodebaseFiles(rootDir: string): FileItem[] {
  const results: FileItem[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) {
      return;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        entry.name !== ".output"
      ) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") ||
          entry.name.endsWith(".js") ||
          entry.name.endsWith(".vue"))
      ) {
        const relPath = path.relative(rootDir, fullPath);
        const content = fs.readFileSync(fullPath, "utf-8");
        results.push({ filePath: relPath, content });
      }
    }
  }

  walk(path.join(rootDir, "apps"));
  walk(path.join(rootDir, "packages"));
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const files = readCodebaseFiles(process.cwd());
    scanKidSurfaceRules(files);
    console.log(
      "✅ [lint:kid-surface] D-GQ kid surface prohibition checks passed cleanly."
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ [lint:kid-surface] Failure:\n${message}`);
    process.exit(1);
  }
}
