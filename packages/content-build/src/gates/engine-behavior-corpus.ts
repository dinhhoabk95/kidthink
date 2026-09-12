/**
 * Cổng MIỀN HÀNH VI × CORPUS — nửa corpus của `BR-EBD-04`.
 *
 * `check:engine-behavior` (packages/game-engine) đo miền theo **registry**: engine
 * nào không cấm band nào. Nhưng `BR-EBD-04` đòi engine vừa không cấm band đó
 * **vừa có ≥1 level published**. Một miền không có bài để chơi không phải một
 * miền đối với đứa trẻ — nó chỉ là một hàng trong bảng cấu hình.
 *
 * Cổng này đóng nửa còn lại: đếm miền theo engine **có nội dung thật** ở từng band.
 *
 *   pnpm --filter @mindkid/content-build check:engine-behavior-corpus
 */
import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { AGE_BANDS } from "@mindkid/shared";
import { z } from "zod";
import { ALL_SEED_LEVELS } from "../catalog.js";

const BANDS = AGE_BANDS;
type Band = (typeof BANDS)[number];

const BAND_PROBE_AGE: Record<Band, number> = { "3-4": 3, "4-5": 4, "5-6": 5 };

const BehaviorConfigSchema = z.object({
  engines: z.record(
    z.string(),
    z.object({ mien: z.string(), mien_phu: z.string().nullable() })
  ),
});

const BaselineSchema = z.object({
  min_domains_per_band: z.object({
    "3-4": z.number().int().positive(),
    "4-5": z.number().int().positive(),
    "5-6": z.number().int().positive(),
  }),
});

export interface CorpusBandSummary {
  readonly band: Band;
  readonly enginesWithContent: number;
  readonly domains: readonly string[];
  readonly target: number;
  readonly passed: boolean;
}

export interface EngineBehaviorCorpusResult {
  readonly bandSummaries: readonly CorpusBandSummary[];
  readonly violations: readonly string[];
}

interface TemplateAges {
  readonly age_min: number;
  readonly age_max: number;
  readonly banned_age_bands?: readonly string[];
}

function readJson<T>(path: string, schema: z.ZodType<T>): T {
  if (!fs.existsSync(path)) {
    throw new Error(`Không tìm thấy tệp bắt buộc: ${path}`);
  }
  const parsed: unknown = JSON.parse(fs.readFileSync(path, "utf-8"));
  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Tệp ${path} sai schema: ${result.error.message}`);
  }
  return result.data;
}

function isActiveForBand(template: TemplateAges, band: Band): boolean {
  if (template.banned_age_bands?.includes(band)) {
    return false;
  }
  const age = BAND_PROBE_AGE[band];
  return template.age_min <= age && template.age_max >= age;
}

/** Engine → các band mà corpus thật sự có level phủ. */
export function measureSeedBandCoverage(): Map<string, Set<Band>> {
  const coverage = new Map<string, Set<Band>>();
  for (const level of ALL_SEED_LEVELS) {
    const { template_code: code, age_min: min, age_max: max } = level.header;
    if (!code || Number.isNaN(min) || Number.isNaN(max)) {
      continue;
    }
    const bands = coverage.get(code) ?? new Set<Band>();
    for (const band of BANDS) {
      const age = BAND_PROBE_AGE[band];
      if (min <= age && max >= age) {
        bands.add(band);
      }
    }
    coverage.set(code, bands);
  }
  return coverage;
}

export interface RunCorpusGateOptions {
  /** Tiêm phủ sóng band để dựng ca âm; mặc định đo từ corpus seed thật. */
  readonly coverage?: Map<string, Set<Band>>;
}

export function runEngineBehaviorCorpusGate(
  options: RunCorpusGateOptions = {}
): EngineBehaviorCorpusResult {
  const config = readJson(
    repoPath("packages/game-engine/config/engine-behavior-domain.json"),
    BehaviorConfigSchema
  );
  const baseline = readJson(
    repoPath("scripts/engine-behavior-baseline.json"),
    BaselineSchema
  );

  const coverage = options.coverage ?? measureSeedBandCoverage();
  const templates = ALL_TEMPLATES as unknown as Record<string, TemplateAges>;
  const violations: string[] = [];
  const bandSummaries: CorpusBandSummary[] = [];

  for (const band of BANDS) {
    const domains = new Set<string>();
    let enginesWithContent = 0;

    for (const [code, template] of Object.entries(templates)) {
      if (!isActiveForBand(template, band)) {
        continue;
      }
      if (!coverage.get(code)?.has(band)) {
        continue;
      }
      enginesWithContent++;
      const mien = config.engines[code]?.mien;
      if (mien) {
        domains.add(mien);
      } else {
        violations.push(
          `${code} có level ở band ${band} nhưng không có hàng miền trong engine-behavior-domain.json`
        );
      }
    }

    const target = baseline.min_domains_per_band[band];
    const domainList = [...domains].sort();
    const passed = domainList.length >= target;
    bandSummaries.push({
      band,
      enginesWithContent,
      domains: domainList,
      target,
      passed,
    });

    if (!passed) {
      violations.push(
        `Band ${band}: chỉ ${domainList.length} miền có nội dung thật (${domainList.join(", ")}), dưới sàn ${target}`
      );
    }
  }

  return { bandSummaries, violations };
}

export function reportEngineBehaviorCorpus(): boolean {
  try {
    const result = runEngineBehaviorCorpusGate();
    console.log("check:engine-behavior-corpus  (BR-EBD-04 nửa corpus)");
    for (const s of result.bandSummaries) {
      console.log(
        `  • Band ${s.band}: ${s.domains.length}/6 miền có nội dung (${s.domains.join(" · ")}) — ${s.enginesWithContent} engine — sàn ≥${s.target} [${s.passed ? "✓ ĐẠT" : "✗ DƯỚI SÀN"}]`
      );
    }
    if (result.violations.length > 0) {
      console.error(`  ✗ ${result.violations.length} vi phạm:`);
      for (const v of result.violations) {
        console.error(`    - ${v}`);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error("Lỗi khi chạy check:engine-behavior-corpus:", err);
    return false;
  }
}

if (
  process.env.NODE_ENV !== "test" &&
  process.argv[1]?.includes("engine-behavior-corpus.ts") &&
  !reportEngineBehaviorCorpus()
) {
  process.exit(1);
}
