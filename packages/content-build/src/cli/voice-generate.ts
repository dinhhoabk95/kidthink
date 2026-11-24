import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { TEACHER_VOICE_PROFILE } from "@mindkid/shared/voice-path";
import { z } from "zod";
import {
  findVoiceEngineDescriptor,
  isVoiceEngineId,
} from "#src/voice/audition-samples";
import {
  readCatalogDocumentFromDisk,
  resolveDefaultCatalogPath,
  resolveDefaultManifestPath,
  resolvePublicWebDir,
} from "#src/voice/catalog-extractor";
import {
  normalizeTeacherAudioToMp3,
  verifyAudioBufferOnDisk,
} from "#src/voice/ffmpeg-normalizer";
import { PythonTtsWorkerPool } from "#src/voice/python-bridge";
import {
  VOICE_CATEGORIES,
  type VoiceCatalogEntry,
  type VoiceCategory,
  type VoiceEngineId,
  type VoiceManifestDocument,
  type VoiceManifestEntry,
} from "#src/voice/types";

const LEADING_SLASH_RE = /^\//;

export interface VoiceGenerateCliOptions {
  readonly engine: VoiceEngineId;
  readonly speed?: number;
  readonly shardIndex: number;
  readonly shardTotal: number;
  readonly concurrency: number;
  readonly category?: VoiceCategory;
  readonly limit?: number;
  readonly force: boolean;
  readonly dryRun: boolean;
  readonly catalogPath?: string;
  readonly manifestPath?: string;
  readonly publicWebDir?: string;
}

export interface VoiceGenerateSummary {
  readonly totalCandidates: number;
  readonly skippedCached: number;
  readonly generatedCount: number;
  readonly failedCount: number;
}

const ManifestSchema = z.object({
  profile: z.string(),
  updated_at: z.string(),
  total_generated: z.number(),
  entries: z.record(
    z.string(),
    z.object({
      hash: z.string(),
      relative_audio_path: z.string(),
      category: z.enum(VOICE_CATEGORIES),
      spoken_script_vi: z.string(),
      engine_id: z.string(),
      speed: z.number(),
      duration_ms: z.number(),
      file_size_bytes: z.number(),
      updated_at: z.string(),
    })
  ),
});

function isVoiceCategory(val: string): val is VoiceCategory {
  return VOICE_CATEGORIES.some((c) => c === val);
}

function parseShardSpec(shardRaw: string | undefined): {
  readonly shardIndex: number;
  readonly shardTotal: number;
} {
  if (!shardRaw) {
    return { shardIndex: 1, shardTotal: 1 };
  }
  const parts = shardRaw.split("/");
  const shardIndex = Number(parts[0]);
  const shardTotal = Number(parts[1]);
  const isValid =
    Number.isInteger(shardIndex) &&
    Number.isInteger(shardTotal) &&
    shardTotal >= 1 &&
    shardIndex >= 1 &&
    shardIndex <= shardTotal;
  if (!isValid) {
    throw new Error(
      `Giá trị --shard phải có dạng K/N (ví dụ 1/4): ${shardRaw}`
    );
  }
  return { shardIndex, shardTotal };
}

export function parseVoiceGenerateArgs(
  argv: readonly string[]
): VoiceGenerateCliOptions {
  const getArg = (prefix: string): string | undefined => {
    const hit = argv.find((a) => a.startsWith(prefix));
    return hit ? hit.slice(prefix.length) : undefined;
  };

  const rawEngine = getArg("--engine=") ?? "edge-hoaimy-teacher";
  if (!isVoiceEngineId(rawEngine)) {
    throw new Error(`Engine không hợp lệ: ${rawEngine}`);
  }

  const speedRaw = getArg("--speed=");
  const speed = speedRaw === undefined ? undefined : Number(speedRaw);
  if (
    speed !== undefined &&
    (!Number.isFinite(speed) || speed < 0.5 || speed > 2)
  ) {
    throw new Error(`Giá trị --speed không hợp lệ: ${String(speedRaw)}`);
  }

  const { shardIndex, shardTotal } = parseShardSpec(getArg("--shard="));

  const concurrencyRaw = Number(getArg("--concurrency=") ?? "4");
  const concurrency = Math.max(
    1,
    Math.min(
      8,
      Number.isFinite(concurrencyRaw) ? Math.trunc(concurrencyRaw) : 4
    )
  );

  const catRaw = getArg("--category=");
  if (catRaw !== undefined && !isVoiceCategory(catRaw)) {
    throw new Error(`Giá trị --category không hợp lệ: ${catRaw}`);
  }

  const limitRaw = getArg("--limit=");
  const limit =
    limitRaw !== undefined && Number(limitRaw) > 0
      ? Math.trunc(Number(limitRaw))
      : undefined;

  return {
    engine: rawEngine,
    speed,
    shardIndex,
    shardTotal,
    concurrency,
    category: catRaw,
    limit,
    force: argv.includes("--force"),
    dryRun: argv.includes("--dry-run"),
  };
}

function loadExistingManifest(
  manifestPath: string
): Record<string, VoiceManifestEntry> {
  if (!fs.existsSync(manifestPath)) {
    return {};
  }
  const parsed = ManifestSchema.safeParse(
    JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  );
  if (!parsed.success) {
    return {};
  }
  const out: Record<string, VoiceManifestEntry> = {};
  for (const [key, val] of Object.entries(parsed.data.entries)) {
    if (isVoiceEngineId(val.engine_id)) {
      out[key] = { ...val, engine_id: val.engine_id };
    }
  }
  return out;
}

function saveManifestAtomic(
  manifestPath: string,
  entries: Record<string, VoiceManifestEntry>
): void {
  const doc: VoiceManifestDocument = {
    profile: TEACHER_VOICE_PROFILE,
    updated_at: new Date().toISOString(),
    total_generated: Object.keys(entries).length,
    entries,
  };
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  const tmpPath = `${manifestPath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  fs.renameSync(tmpPath, manifestPath);
}

function isAlreadyValidOnDisk(mp3Path: string): boolean {
  if (!fs.existsSync(mp3Path)) {
    return false;
  }
  try {
    verifyAudioBufferOnDisk(mp3Path);
    return true;
  } catch {
    return false;
  }
}

function filterShardAndSlice(
  entries: readonly VoiceCatalogEntry[],
  options: VoiceGenerateCliOptions
): VoiceCatalogEntry[] {
  const byCat = options.category
    ? entries.filter((e) => e.category === options.category)
    : [...entries];

  const sharded = byCat.filter(
    (_, idx) => idx % options.shardTotal === options.shardIndex - 1
  );

  return options.limit === undefined
    ? sharded
    : sharded.slice(0, options.limit);
}

interface SingleGenerateContext {
  readonly pool: PythonTtsWorkerPool;
  readonly engine: VoiceEngineId;
  readonly effectiveSpeed: number;
  readonly pitchFactor: number;
  readonly tmpWorkDir: string;
  readonly publicWebDir: string;
}

async function generateOneEntry(
  entry: VoiceCatalogEntry,
  ctx: SingleGenerateContext
): Promise<VoiceManifestEntry> {
  const rawExt = ctx.engine.startsWith("edge-") ? "mp3" : "wav";
  const rawTempPath = path.join(ctx.tmpWorkDir, `${entry.hash}.${rawExt}`);
  const outMp3Path = path.join(
    ctx.publicWebDir,
    entry.relative_audio_path.replace(LEADING_SLASH_RE, "")
  );

  try {
    const res = await ctx.pool.synthesize(
      entry.hash,
      ctx.engine,
      entry.spoken_script_vi,
      rawTempPath
    );
    if (!res.ok) {
      throw new Error(res.error ?? "TTS synthesis failed");
    }

    const norm = await normalizeTeacherAudioToMp3({
      inputPath: rawTempPath,
      outputPath: outMp3Path,
      speed: ctx.effectiveSpeed,
      pitchShiftFactor: ctx.pitchFactor,
    });

    return {
      hash: entry.hash,
      relative_audio_path: entry.relative_audio_path,
      category: entry.category,
      spoken_script_vi: entry.spoken_script_vi,
      engine_id: ctx.engine,
      speed: ctx.effectiveSpeed,
      duration_ms: norm.asset.durationMs,
      file_size_bytes: norm.asset.fileSizeBytes,
      updated_at: new Date().toISOString(),
    };
  } finally {
    if (fs.existsSync(rawTempPath)) {
      fs.rmSync(rawTempPath, { force: true });
    }
  }
}

export async function runVoiceGenerate(
  options: VoiceGenerateCliOptions
): Promise<VoiceGenerateSummary> {
  const catalogPath = options.catalogPath ?? resolveDefaultCatalogPath();
  const manifestPath = options.manifestPath ?? resolveDefaultManifestPath();
  const publicWebDir = options.publicWebDir ?? resolvePublicWebDir();
  const descriptor = findVoiceEngineDescriptor(options.engine);
  const effectiveSpeed = options.speed ?? descriptor?.default_speed ?? 0.92;
  const pitchFactor = descriptor?.pitch_shift_factor ?? 1;

  const catalog = readCatalogDocumentFromDisk(catalogPath, publicWebDir);
  const selected = filterShardAndSlice(catalog.entries, options);

  let skippedCached = 0;
  const toSynthesize: VoiceCatalogEntry[] = [];
  for (const item of selected) {
    const outPath = path.join(
      publicWebDir,
      item.relative_audio_path.replace(LEADING_SLASH_RE, "")
    );
    if (!options.force && isAlreadyValidOnDisk(outPath)) {
      skippedCached += 1;
    } else {
      toSynthesize.push(item);
    }
  }

  console.log(
    `🎙️  [voice:generate] engine=${options.engine}, speed=${effectiveSpeed}, shard=${options.shardIndex}/${options.shardTotal}, concurrency=${options.concurrency}`
  );
  console.log(
    `   Ứng viên: ${selected.length} | Đã có hợp lệ (skip): ${skippedCached} | Cần sinh mới: ${toSynthesize.length}`
  );

  if (options.dryRun || toSynthesize.length === 0) {
    return {
      totalCandidates: selected.length,
      skippedCached,
      generatedCount: 0,
      failedCount: 0,
    };
  }

  const manifestEntries = loadExistingManifest(manifestPath);
  const tmpWorkDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "mindkid-voice-gen-")
  );
  const pool = new PythonTtsWorkerPool(options.concurrency);
  const ctx: SingleGenerateContext = {
    pool,
    engine: options.engine,
    effectiveSpeed,
    pitchFactor,
    tmpWorkDir,
    publicWebDir,
  };
  let generatedCount = 0;
  let failedCount = 0;
  let nextIdx = 0;

  const runWorkerSlot = async (): Promise<void> => {
    while (nextIdx < toSynthesize.length) {
      const entry = toSynthesize[nextIdx];
      nextIdx += 1;
      if (!entry) {
        continue;
      }
      try {
        manifestEntries[entry.hash] = await generateOneEntry(entry, ctx);
        generatedCount += 1;
      } catch (err) {
        failedCount += 1;
        console.error(
          `   ❌ [${entry.hash}] "${entry.raw_text}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  };

  try {
    await Promise.all(
      Array.from({ length: options.concurrency }, () => runWorkerSlot())
    );
  } finally {
    await pool.closeAll();
    fs.rmSync(tmpWorkDir, { recursive: true, force: true });
  }

  saveManifestAtomic(manifestPath, manifestEntries);
  console.log(
    `✅ Hoàn tất [voice:generate]: generated=${generatedCount}, skipped=${skippedCached}, failed=${failedCount}`
  );

  return {
    totalCandidates: selected.length,
    skippedCached,
    generatedCount,
    failedCount,
  };
}

if (process.argv[1]?.endsWith("voice-generate.ts")) {
  const cliOpts = parseVoiceGenerateArgs(process.argv.slice(2));
  runVoiceGenerate(cliOpts)
    .then((summary) => {
      process.exit(summary.failedCount > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error("❌ Lỗi khi chạy voice:generate:", err);
      process.exit(1);
    });
}
