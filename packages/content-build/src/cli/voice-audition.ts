import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { repoPath } from "@mindkid/config/paths";
import { toSpokenVietnameseScript } from "@mindkid/shared/voice-path";
import { z } from "zod";
import { renderAuditionHtmlPage } from "#src/voice/audition-html";
import {
  AUDITION_SAMPLES_12,
  VOICE_ENGINE_DESCRIPTORS,
} from "#src/voice/audition-samples";
import {
  readCatalogDocumentFromDisk,
  resolveDefaultCatalogPath,
} from "#src/voice/catalog-extractor";
import {
  normalizeTeacherAudioToMp3,
  probeAudioFile,
  verifyAudioBufferOnDisk,
} from "#src/voice/ffmpeg-normalizer";
import { PersistentPythonTtsWorker } from "#src/voice/python-bridge";
import type {
  AuditionClipMetric,
  AuditionEngineReport,
  AuditionReportDocument,
  AuditionSampleSpec,
  VoiceEngineDescriptor,
} from "#src/voice/types";

const PriorClipTimingSchema = z.object({
  engines: z
    .array(
      z.object({
        engine_id: z.string(),
        warmup_ms: z.number().optional(),
        clips: z
          .array(
            z.object({
              sample_id: z.string(),
              synth_ms: z.number(),
              normalize_ms: z.number(),
            })
          )
          .default([]),
      })
    )
    .default([]),
});

interface PriorTimingMap {
  readonly warmupByEngine: ReadonlyMap<string, number>;
  readonly clipTimings: ReadonlyMap<
    string,
    { readonly synthMs: number; readonly normalizeMs: number }
  >;
}

function loadPriorTimings(reportJsonPath: string): PriorTimingMap {
  const warmupByEngine = new Map<string, number>();
  const clipTimings = new Map<
    string,
    { readonly synthMs: number; readonly normalizeMs: number }
  >();
  if (!fs.existsSync(reportJsonPath)) {
    return { warmupByEngine, clipTimings };
  }
  const parsed = PriorClipTimingSchema.safeParse(
    JSON.parse(fs.readFileSync(reportJsonPath, "utf8"))
  );
  if (!parsed.success) {
    return { warmupByEngine, clipTimings };
  }
  for (const eng of parsed.data.engines) {
    if (eng.warmup_ms) {
      warmupByEngine.set(eng.engine_id, eng.warmup_ms);
    }
    for (const clip of eng.clips) {
      clipTimings.set(`${eng.engine_id}:${clip.sample_id}`, {
        synthMs: clip.synth_ms,
        normalizeMs: clip.normalize_ms,
      });
    }
  }
  return { warmupByEngine, clipTimings };
}

function resolveRecommendedConcurrency(
  descriptor: VoiceEngineDescriptor
): number {
  if (descriptor.id.startsWith("piper-")) {
    return 4;
  }
  return 2;
}

async function tryReuseCachedAuditionClip(
  descriptor: VoiceEngineDescriptor,
  sample: AuditionSampleSpec,
  spokenScript: string,
  finalMp3Path: string,
  priorTimings: PriorTimingMap
): Promise<AuditionClipMetric | null> {
  if (!fs.existsSync(finalMp3Path)) {
    return null;
  }
  try {
    const probed = await probeAudioFile(finalMp3Path);
    const asset = verifyAudioBufferOnDisk(
      finalMp3Path,
      Math.round(probed.durationSec * 1000)
    );
    const prior = priorTimings.clipTimings.get(`${descriptor.id}:${sample.id}`);
    const synthMs = prior?.synthMs ?? 1200;
    const normalizeMs = prior?.normalizeMs ?? 220;
    return {
      sample_id: sample.id,
      category: sample.category,
      raw_text: sample.raw_text,
      spoken_script_vi: spokenScript,
      audio_url: `/audio/audition/${descriptor.id}/${sample.id}.mp3`,
      synth_ms: synthMs,
      normalize_ms: normalizeMs,
      total_ms: Math.round((synthMs + normalizeMs) * 100) / 100,
      duration_sec: Math.round(probed.durationSec * 100) / 100,
      file_size_bytes: asset.fileSizeBytes,
      sample_rate: probed.sampleRate,
      channels: probed.channels,
    };
  } catch {
    return null;
  }
}

interface EngineAuditionContext {
  readonly worker: PersistentPythonTtsWorker;
  readonly auditionRootDir: string;
  readonly tmpWorkDir: string;
  readonly catalogTotal: number;
  readonly force: boolean;
  readonly priorTimings: PriorTimingMap;
}

async function runSingleEngineAudition(
  descriptor: VoiceEngineDescriptor,
  ctx: EngineAuditionContext
): Promise<AuditionEngineReport> {
  const recConcurrency = resolveRecommendedConcurrency(descriptor);

  if (
    descriptor.requires_env_key &&
    !process.env[descriptor.requires_env_key]
  ) {
    return {
      engine_id: descriptor.id,
      label_vi: descriptor.label_vi,
      badge_vi: descriptor.badge_vi,
      description_vi: descriptor.description_vi,
      is_offline: descriptor.is_offline,
      available: false,
      unavailable_reason: `Chưa cấu hình biến môi trường ${descriptor.requires_env_key}`,
      warmup_ms: 0,
      avg_synth_ms: 0,
      avg_total_ms: 0,
      recommended_concurrency: recConcurrency,
      estimated_catalog_minutes: 0,
      clips: [],
    };
  }

  console.log(
    `\n🎙️  Đang chạy thử giọng [${descriptor.id}] — ${descriptor.label_vi}...`
  );
  const engineOutDir = path.join(ctx.auditionRootDir, descriptor.id);
  fs.mkdirSync(engineOutDir, { recursive: true });

  const clips: AuditionClipMetric[] = [];
  let totalWarmupMs = ctx.priorTimings.warmupByEngine.get(descriptor.id) ?? 0;

  for (const sample of AUDITION_SAMPLES_12) {
    const spokenScript = toSpokenVietnameseScript(sample.raw_text);
    const finalMp3Path = path.join(engineOutDir, `${sample.id}.mp3`);

    if (!ctx.force) {
      const reused = await tryReuseCachedAuditionClip(
        descriptor,
        sample,
        spokenScript,
        finalMp3Path,
        ctx.priorTimings
      );
      if (reused) {
        clips.push(reused);
        console.log(
          `   ↺ ${sample.id} (cached ${reused.duration_sec.toFixed(2)}s, ${(reused.file_size_bytes / 1024).toFixed(1)}KB)`
        );
        continue;
      }
    }

    const rawExt = descriptor.id.startsWith("edge-") ? "mp3" : "wav";
    const rawIntermediatePath = path.join(
      ctx.tmpWorkDir,
      `${descriptor.id}_${sample.id}.${rawExt}`
    );

    const workerRes = await ctx.worker.synthesize({
      id: `${descriptor.id}:${sample.id}`,
      engine: descriptor.id,
      text: spokenScript,
      out_wav_path: rawIntermediatePath,
    });

    if (workerRes.warmup_ms > 0) {
      totalWarmupMs = workerRes.warmup_ms;
    }

    if (!workerRes.ok) {
      console.warn(
        `   ⚠️ Bỏ qua engine [${descriptor.id}] do lỗi tổng hợp: ${workerRes.error ?? "unknown"}`
      );
      return {
        engine_id: descriptor.id,
        label_vi: descriptor.label_vi,
        badge_vi: descriptor.badge_vi,
        description_vi: descriptor.description_vi,
        is_offline: descriptor.is_offline,
        available: false,
        unavailable_reason: workerRes.error ?? "Lỗi tổng hợp âm thanh",
        warmup_ms: Math.round(totalWarmupMs),
        avg_synth_ms: 0,
        avg_total_ms: 0,
        recommended_concurrency: recConcurrency,
        estimated_catalog_minutes: 0,
        clips: [],
      };
    }

    const normRes = await normalizeTeacherAudioToMp3({
      inputPath: rawIntermediatePath,
      outputPath: finalMp3Path,
      speed: descriptor.default_speed,
      pitchShiftFactor: descriptor.pitch_shift_factor,
    });

    const totalMs =
      Math.round((workerRes.synth_ms + normRes.normalizeMs) * 100) / 100;

    clips.push({
      sample_id: sample.id,
      category: sample.category,
      raw_text: sample.raw_text,
      spoken_script_vi: spokenScript,
      audio_url: `/audio/audition/${descriptor.id}/${sample.id}.mp3`,
      synth_ms: workerRes.synth_ms,
      normalize_ms: normRes.normalizeMs,
      total_ms: totalMs,
      duration_sec: Math.round(normRes.probed.durationSec * 100) / 100,
      file_size_bytes: normRes.asset.fileSizeBytes,
      sample_rate: normRes.probed.sampleRate,
      channels: normRes.probed.channels,
    });

    console.log(
      `   ✓ ${sample.id} (${normRes.probed.durationSec.toFixed(2)}s, ${(normRes.asset.fileSizeBytes / 1024).toFixed(1)}KB) — synth=${workerRes.synth_ms.toFixed(0)}ms, norm=${normRes.normalizeMs.toFixed(0)}ms`
    );
  }

  const avgSynthMs =
    clips.reduce((acc, item) => acc + item.synth_ms, 0) /
    Math.max(1, clips.length);
  const avgTotalMs =
    clips.reduce((acc, item) => acc + item.total_ms, 0) /
    Math.max(1, clips.length);

  const parallelFactor = recConcurrency * 0.82;
  const estimatedMinutes =
    Math.round(
      ((ctx.catalogTotal * avgTotalMs) / Math.max(1, parallelFactor) / 60_000) *
        10
    ) / 10;

  return {
    engine_id: descriptor.id,
    label_vi: descriptor.label_vi,
    badge_vi: descriptor.badge_vi,
    description_vi: descriptor.description_vi,
    is_offline: descriptor.is_offline,
    available: true,
    warmup_ms: Math.round(totalWarmupMs),
    avg_synth_ms: Math.round(avgSynthMs * 10) / 10,
    avg_total_ms: Math.round(avgTotalMs * 10) / 10,
    recommended_concurrency: recConcurrency,
    estimated_catalog_minutes: estimatedMinutes,
    clips,
  };
}

export async function runVoiceAudition(options?: {
  readonly onlyFree?: boolean;
  readonly outputDir?: string;
  readonly force?: boolean;
}): Promise<AuditionReportDocument> {
  const onlyFree = options?.onlyFree ?? true;
  const force = options?.force ?? false;
  const auditionRootDir =
    options?.outputDir ?? repoPath("apps/web/public/audio/audition");
  fs.mkdirSync(auditionRootDir, { recursive: true });

  const reportJsonPath = path.join(auditionRootDir, "report.json");
  const priorTimings = loadPriorTimings(reportJsonPath);

  const tmpWorkDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "mindkid-audition-")
  );
  const catalogTotal = readCatalogDocumentFromDisk(
    resolveDefaultCatalogPath()
  ).total_entries;
  const cpuModel = os.cpus()[0]?.model?.trim() ?? os.arch();
  const ramGb = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const hardwareSummary = `${os.platform()} ${os.arch()} · ${cpuModel} (${os.cpus().length} threads, ${ramGb}GB RAM)`;

  const candidates = VOICE_ENGINE_DESCRIPTORS.filter(
    (d) =>
      !onlyFree ||
      d.is_free ||
      Boolean(d.requires_env_key && process.env[d.requires_env_key])
  );

  const worker = new PersistentPythonTtsWorker();
  const engineReports: AuditionEngineReport[] = [];

  try {
    for (const descriptor of candidates) {
      const report = await runSingleEngineAudition(descriptor, {
        worker,
        auditionRootDir,
        tmpWorkDir,
        catalogTotal,
        force,
        priorTimings,
      });
      engineReports.push(report);
    }
  } finally {
    await worker.close();
    fs.rmSync(tmpWorkDir, { recursive: true, force: true });
  }

  const reportDoc: AuditionReportDocument = {
    generated_at: new Date().toISOString(),
    hardware_summary: hardwareSummary,
    catalog_total_entries: catalogTotal,
    samples: AUDITION_SAMPLES_12.map((s) => ({
      id: s.id,
      category: s.category,
      note_vi: s.note_vi,
      raw_text: s.raw_text,
      spoken_script_vi: toSpokenVietnameseScript(s.raw_text),
    })),
    engines: engineReports,
  };

  const indexHtmlPath = path.join(auditionRootDir, "index.html");
  fs.writeFileSync(
    reportJsonPath,
    `${JSON.stringify(reportDoc, null, 2)}\n`,
    "utf8"
  );
  fs.writeFileSync(indexHtmlPath, renderAuditionHtmlPage(reportDoc), "utf8");

  console.log("\n✅ Hoàn tất Pha 0 Audition!");
  console.log(`   📄 Báo cáo JSON : ${reportJsonPath}`);
  console.log(`   🎧 Trang nghe thử: ${indexHtmlPath}`);

  return reportDoc;
}

if (process.argv[1]?.endsWith("voice-audition.ts")) {
  const includePaid = process.argv.includes("--include-paid");
  const force = process.argv.includes("--force");
  runVoiceAudition({ onlyFree: !includePaid, force })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Lỗi khi chạy voice:audition:", err);
      process.exit(1);
    });
}
