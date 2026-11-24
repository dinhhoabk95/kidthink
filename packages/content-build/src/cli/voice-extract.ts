import fs from "node:fs";
import path from "node:path";
import {
  extractVoiceCatalog,
  formatCatalogSummaryTable,
  resolveDefaultCatalogPath,
  serializeCompactCatalogJson,
} from "#src/voice/catalog-extractor";

export interface RunVoiceExtractOptions {
  readonly outputPath?: string;
  readonly profile?: string;
}

export function runVoiceExtract(options?: RunVoiceExtractOptions): {
  readonly outputPath: string;
  readonly totalEntries: number;
  readonly cachedEntries: number;
  readonly missingEntries: number;
} {
  const outputPath = options?.outputPath ?? resolveDefaultCatalogPath();
  const catalog = extractVoiceCatalog({ profile: options?.profile });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serializeCompactCatalogJson(catalog), "utf8");

  console.log(formatCatalogSummaryTable(catalog));
  console.log(`💾 Đã lưu catalog tại: ${outputPath}`);

  return {
    outputPath,
    totalEntries: catalog.total_entries,
    cachedEntries: catalog.cached_entries,
    missingEntries: catalog.missing_entries,
  };
}

if (process.argv[1]?.endsWith("voice-extract.ts")) {
  const outArg = process.argv.find((arg) => arg.startsWith("--out="));
  const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
  runVoiceExtract({
    outputPath: outArg ? outArg.slice("--out=".length) : undefined,
    profile: profileArg ? profileArg.slice("--profile=".length) : undefined,
  });
}
