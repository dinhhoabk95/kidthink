import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  computeVoiceHash,
  resolveTeacherVoicePath,
  TEACHER_VOICE_PROFILE,
  toSpokenVietnameseScript,
} from "@mindkid/shared/voice-path";
import { afterEach, describe, expect, it } from "vitest";
import {
  parseVoiceGenerateArgs,
  runVoiceGenerate,
} from "#src/cli/voice-generate";
import { runVoiceVerify } from "#src/cli/voice-verify";
import { renderAuditionHtmlPage } from "#src/voice/audition-html";
import { AUDITION_SAMPLES_12 } from "#src/voice/audition-samples";
import {
  extractVoiceCatalog,
  readCatalogDocumentFromDisk,
  serializeCompactCatalogJson,
} from "#src/voice/catalog-extractor";
import {
  buildTeacherAudioFilterChain,
  FFMPEG_PATH,
  normalizeTeacherAudioToMp3,
} from "#src/voice/ffmpeg-normalizer";
import type {
  AuditionReportDocument,
  VoiceCatalogDocument,
} from "#src/voice/types";

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir && fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("Voice Pipeline — Catalog, FFmpeg Normalizer & CLI", () => {
  it("quét đầy đủ 6 nhóm ngữ liệu bài học & UI mầm non với > 6000 câu duy nhất", () => {
    const tmpPublic = makeTempDir("mindkid-voice-pub-");
    const catalog = extractVoiceCatalog({ publicWebDir: tmpPublic });

    expect(catalog.profile).toBe(TEACHER_VOICE_PROFILE);
    expect(catalog.total_entries).toBeGreaterThan(6000);
    expect(catalog.missing_entries).toBe(catalog.total_entries);
    expect(catalog.cached_entries).toBe(0);

    expect(catalog.by_category.round_instruction.total).toBeGreaterThan(1500);
    expect(catalog.by_category.gt000_step.total).toBeGreaterThan(1500);
    expect(catalog.by_category.skill_item.total).toBeGreaterThan(1500);
    expect(catalog.by_category.encouragement.total).toBeGreaterThan(50);
    expect(catalog.by_category.koguma_guide.total).toBeGreaterThanOrEqual(100);
    expect(catalog.by_category.kid_ui.total).toBeGreaterThan(30);

    const sampleDir = makeTempDir("mindkid-voice-cat-");
    const catalogPath = path.join(sampleDir, "voice-catalog.json");
    fs.writeFileSync(catalogPath, serializeCompactCatalogJson(catalog), "utf8");

    const restored = readCatalogDocumentFromDisk(catalogPath, tmpPublic);
    expect(restored.total_entries).toBe(catalog.total_entries);
    expect(restored.entries[0]?.hash).toBe(catalog.entries[0]?.hash);
    expect(restored.entries[0]?.spoken_script_vi).toBe(
      catalog.entries[0]?.spoken_script_vi
    );
  });

  it("chuẩn hoá âm thanh qua FFmpeg về 44100 Hz, mono, MP3 64k, -16 LUFS và đạt normalizeAudioAsset", async () => {
    const workDir = makeTempDir("mindkid-ffmpeg-test-");
    const rawWav = path.join(workDir, "sine.wav");
    const outMp3 = path.join(workDir, "out", "normalized.mp3");

    execFileSync(FFMPEG_PATH, [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:sample_rate=24000:duration=1.2",
      "-ac",
      "2",
      rawWav,
      "-loglevel",
      "error",
    ]);

    const chain = buildTeacherAudioFilterChain({
      speed: 0.92,
      pitchShiftFactor: 1.02,
    });
    expect(chain).toContain("loudnorm=I=-16:TP=-1.0:LRA=11");
    expect(chain).toContain("afade=t=in:st=0:d=0.02");
    expect(chain).toContain("afade=t=in:st=0:d=0.04");

    const result = await normalizeTeacherAudioToMp3({
      inputPath: rawWav,
      outputPath: outMp3,
      speed: 0.92,
      pitchShiftFactor: 1.02,
    });

    expect(fs.existsSync(outMp3)).toBe(true);
    expect(result.probed.sampleRate).toBe(44_100);
    expect(result.probed.channels).toBe(1);
    expect(result.probed.durationSec).toBeGreaterThan(0.8);
    expect(result.asset.detectedMimeType).toBe("audio/mpeg");
    expect(result.asset.outputExtension).toBe("mp3");
    expect(result.asset.sampleRate).toBe(44_100);
    expect(result.asset.channels).toBe(1);
  });

  it("parse tham số CLI voice-generate và kiểm chứng incremental skip + voice-verify", async () => {
    const parsed = parseVoiceGenerateArgs([
      "--engine=piper-vais1000",
      "--speed=0.9",
      "--shard=2/4",
      "--concurrency=3",
      "--category=encouragement",
      "--limit=5",
      "--dry-run",
    ]);
    expect(parsed.engine).toBe("piper-vais1000");
    expect(parsed.speed).toBe(0.9);
    expect(parsed.shardIndex).toBe(2);
    expect(parsed.shardTotal).toBe(4);
    expect(parsed.concurrency).toBe(3);
    expect(parsed.category).toBe("encouragement");
    expect(parsed.limit).toBe(5);
    expect(parsed.dryRun).toBe(true);

    const tmpRoot = makeTempDir("mindkid-verify-gen-");
    const pubDir = path.join(tmpRoot, "public");
    const catPath = path.join(tmpRoot, "catalog.json");
    const manPath = path.join(tmpRoot, "manifest.json");

    const text = "Dung dăng dung dẻ, bé giỏi quá nè!";
    const hash = computeVoiceHash(text);
    const relPath = resolveTeacherVoicePath(text) ?? "";

    const miniDoc: VoiceCatalogDocument = {
      profile: TEACHER_VOICE_PROFILE,
      generated_at: new Date().toISOString(),
      total_entries: 1,
      cached_entries: 0,
      missing_entries: 1,
      by_category: {
        round_instruction: { total: 0, cached: 0, missing: 0 },
        gt000_step: { total: 0, cached: 0, missing: 0 },
        skill_item: { total: 0, cached: 0, missing: 0 },
        encouragement: { total: 1, cached: 0, missing: 1 },
        koguma_guide: { total: 0, cached: 0, missing: 0 },
        kid_ui: { total: 0, cached: 0, missing: 0 },
      },
      entries: [
        {
          hash,
          lookup_key: text.toLowerCase(),
          raw_text: text,
          spoken_script_vi: toSpokenVietnameseScript(text),
          relative_audio_path: relPath,
          category: "encouragement",
          sources: ["unit_test"],
          occurrence_count: 1,
          status: "missing",
        },
      ],
    };
    fs.writeFileSync(catPath, serializeCompactCatalogJson(miniDoc), "utf8");

    const beforeVerify = runVoiceVerify({
      catalogPath: catPath,
      publicWebDir: pubDir,
    });
    expect(beforeVerify.validCount).toBe(0);
    expect(beforeVerify.failures).toHaveLength(1);
    expect(beforeVerify.failures[0]?.reason).toBe("MISSING_FILE");

    const firstGen = await runVoiceGenerate({
      engine: "piper-vais1000",
      shardIndex: 1,
      shardTotal: 1,
      concurrency: 1,
      force: false,
      dryRun: false,
      catalogPath: catPath,
      manifestPath: manPath,
      publicWebDir: pubDir,
    });
    expect(firstGen.generatedCount).toBe(1);
    expect(firstGen.failedCount).toBe(0);

    const afterVerify = runVoiceVerify({
      catalogPath: catPath,
      publicWebDir: pubDir,
    });
    expect(afterVerify.validCount).toBe(1);
    expect(afterVerify.failures).toHaveLength(0);

    const secondGenIncremental = await runVoiceGenerate({
      engine: "piper-vais1000",
      shardIndex: 1,
      shardTotal: 1,
      concurrency: 1,
      force: false,
      dryRun: false,
      catalogPath: catPath,
      manifestPath: manPath,
      publicWebDir: pubDir,
    });
    expect(secondGenIncremental.skippedCached).toBe(1);
    expect(secondGenIncremental.generatedCount).toBe(0);
  });

  it("render trang HTML phòng nghe thử đầy đủ 12 câu chuẩn mầm non S01..S12", () => {
    expect(AUDITION_SAMPLES_12).toHaveLength(12);
    const mockReport: AuditionReportDocument = {
      generated_at: "2026-11-17T14:00:00.000Z",
      hardware_summary: "darwin x64 · Intel Core i7",
      catalog_total_entries: 7587,
      samples: AUDITION_SAMPLES_12.map((s) => ({
        id: s.id,
        category: s.category,
        note_vi: s.note_vi,
        raw_text: s.raw_text,
        spoken_script_vi: toSpokenVietnameseScript(s.raw_text),
      })),
      engines: [
        {
          engine_id: "piper-vais1000",
          label_vi: "Piper ONNX · VAIS-1000",
          badge_vi: "Offline",
          description_vi: "Test",
          is_offline: true,
          available: true,
          warmup_ms: 800,
          avg_synth_ms: 420,
          avg_total_ms: 610,
          recommended_concurrency: 4,
          estimated_catalog_minutes: 23.5,
          clips: AUDITION_SAMPLES_12.map((s) => ({
            sample_id: s.id,
            category: s.category,
            raw_text: s.raw_text,
            spoken_script_vi: toSpokenVietnameseScript(s.raw_text),
            audio_url: `/audio/audition/piper-vais1000/${s.id}.mp3`,
            synth_ms: 420,
            normalize_ms: 190,
            total_ms: 610,
            duration_sec: 2.4,
            file_size_bytes: 19_200,
            sample_rate: 44_100,
            channels: 1,
          })),
        },
      ],
    };
    const html = renderAuditionHtmlPage(mockReport);
    expect(html).toContain("S01");
    expect(html).toContain("S12");
    expect(html).toContain("VAIS-1000");
    expect(html).toContain("7.587");
  });
});
