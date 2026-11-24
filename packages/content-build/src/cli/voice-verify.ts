import fs from "node:fs";
import path from "node:path";
import {
  readCatalogDocumentFromDisk,
  resolveDefaultCatalogPath,
  resolvePublicWebDir,
} from "#src/voice/catalog-extractor";
import { verifyAudioBufferOnDisk } from "#src/voice/ffmpeg-normalizer";
import { VOICE_CATEGORIES, type VoiceCategory } from "#src/voice/types";

const LEADING_SLASH_RE = /^\//;

export interface VoiceVerifyFailure {
  readonly hash: string;
  readonly relative_audio_path: string;
  readonly category: VoiceCategory;
  readonly raw_text: string;
  readonly reason: string;
}

export interface VoiceVerifyResult {
  readonly totalChecked: number;
  readonly validCount: number;
  readonly failures: readonly VoiceVerifyFailure[];
}

function isVoiceCategory(val: string): val is VoiceCategory {
  return VOICE_CATEGORIES.some((c) => c === val);
}

export function runVoiceVerify(options?: {
  readonly catalogPath?: string;
  readonly publicWebDir?: string;
  readonly category?: VoiceCategory;
}): VoiceVerifyResult {
  const catalogPath = options?.catalogPath ?? resolveDefaultCatalogPath();
  const publicWebDir = options?.publicWebDir ?? resolvePublicWebDir();

  const catalog = readCatalogDocumentFromDisk(catalogPath, publicWebDir);
  const entries = options?.category
    ? catalog.entries.filter((e) => e.category === options.category)
    : catalog.entries;

  const failures: VoiceVerifyFailure[] = [];
  let validCount = 0;

  for (const entry of entries) {
    const diskPath = path.join(
      publicWebDir,
      entry.relative_audio_path.replace(LEADING_SLASH_RE, "")
    );
    if (!fs.existsSync(diskPath)) {
      failures.push({
        hash: entry.hash,
        relative_audio_path: entry.relative_audio_path,
        category: entry.category,
        raw_text: entry.raw_text,
        reason: "MISSING_FILE",
      });
      continue;
    }

    try {
      verifyAudioBufferOnDisk(diskPath);
      validCount += 1;
    } catch (err) {
      failures.push({
        hash: entry.hash,
        relative_audio_path: entry.relative_audio_path,
        category: entry.category,
        raw_text: entry.raw_text,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log(
    `🔍 [voice:verify] Đã kiểm tra ${entries.length} câu: đạt=${validCount}, thiếu/lỗi=${failures.length}`
  );
  if (failures.length > 0) {
    for (const fail of failures.slice(0, 10)) {
      console.warn(
        `   ⚠️ [${fail.reason}] ${fail.relative_audio_path} — "${fail.raw_text}"`
      );
    }
    if (failures.length > 10) {
      console.warn(`   ... và ${failures.length - 10} mục khác.`);
    }
  }

  return {
    totalChecked: entries.length,
    validCount,
    failures,
  };
}

if (process.argv[1]?.endsWith("voice-verify.ts")) {
  const catArg = process.argv.find((a) => a.startsWith("--category="));
  const rawCat = catArg ? catArg.slice("--category=".length) : undefined;
  const category = rawCat && isVoiceCategory(rawCat) ? rawCat : undefined;

  const res = runVoiceVerify({ category });
  process.exit(res.failures.length === 0 ? 0 : 1);
}
