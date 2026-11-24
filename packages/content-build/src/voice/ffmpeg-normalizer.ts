import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  type NormalizedAudioAsset,
  normalizeAudioAsset,
} from "@mindkid/storage";
import { z } from "zod";

const execFileAsync = promisify(execFile);

const FfprobeOutputSchema = z.object({
  streams: z
    .array(
      z.object({
        codec_name: z.string().optional(),
        sample_rate: z.string().optional(),
        channels: z.number().optional(),
      })
    )
    .default([]),
  format: z
    .object({
      duration: z.string().optional(),
      size: z.string().optional(),
    })
    .optional(),
});

export interface ProbedAudioMetadata {
  readonly codecName: string;
  readonly sampleRate: number;
  readonly channels: number;
  readonly durationSec: number;
  readonly fileSizeBytes: number;
}

export interface NormalizeTeacherAudioOptions {
  readonly inputPath: string;
  readonly outputPath: string;
  readonly speed?: number;
  readonly pitchShiftFactor?: number;
}

export interface NormalizedTeacherAudioResult {
  readonly outputPath: string;
  readonly probed: ProbedAudioMetadata;
  readonly asset: NormalizedAudioAsset;
  readonly normalizeMs: number;
}

export function resolveBinaryPath(preferred: string, fallback: string): string {
  return fs.existsSync(preferred) ? preferred : fallback;
}

export const FFMPEG_PATH = resolveBinaryPath("/usr/local/bin/ffmpeg", "ffmpeg");
export const FFPROBE_PATH = resolveBinaryPath(
  "/usr/local/bin/ffprobe",
  "ffprobe"
);

function clampTempo(value: number): number {
  return Math.min(2, Math.max(0.5, value));
}

export function buildTeacherAudioFilterChain(options?: {
  readonly speed?: number;
  readonly pitchShiftFactor?: number;
}): string {
  const speed = clampTempo(options?.speed ?? 0.92);
  const pitch = Math.min(1.25, Math.max(0.8, options?.pitchShiftFactor ?? 1));

  const filters: string[] = [
    "aresample=44100",
    "aformat=sample_fmts=fltp:channel_layouts=mono",
    "silenceremove=start_periods=1:start_silence=0.025:start_threshold=-46dB",
    "areverse",
    "silenceremove=start_periods=1:start_silence=0.055:start_threshold=-46dB",
    "areverse",
  ];

  if (Math.abs(pitch - 1) > 0.001) {
    const shiftedRate = Math.round(44_100 * pitch);
    const compensatedTempo = clampTempo(speed / pitch);
    filters.push(`asetrate=${shiftedRate}`);
    filters.push("aresample=44100");
    filters.push(`atempo=${compensatedTempo.toFixed(5)}`);
  } else if (Math.abs(speed - 1) > 0.001) {
    filters.push(`atempo=${speed.toFixed(4)}`);
  }

  filters.push("loudnorm=I=-16:TP=-1.0:LRA=11");
  filters.push("afade=t=in:st=0:d=0.02");
  filters.push("areverse");
  filters.push("afade=t=in:st=0:d=0.04");
  filters.push("areverse");
  filters.push("aresample=44100");

  return filters.join(",");
}

export async function probeAudioFile(
  filePath: string
): Promise<ProbedAudioMetadata> {
  const { stdout } = await execFileAsync(FFPROBE_PATH, [
    "-v",
    "error",
    "-select_streams",
    "a:0",
    "-show_entries",
    "stream=codec_name,sample_rate,channels:format=duration,size",
    "-of",
    "json",
    filePath,
  ]);
  const parsed = FfprobeOutputSchema.parse(JSON.parse(stdout));
  const stream = parsed.streams[0];
  const sampleRate = Number(stream?.sample_rate ?? "0");
  const channels = stream?.channels ?? 0;
  const durationSec = Number(parsed.format?.duration ?? "0");
  const statSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  const fileSizeBytes = Number(parsed.format?.size ?? String(statSize));

  return {
    codecName: stream?.codec_name ?? "unknown",
    sampleRate: Number.isFinite(sampleRate) ? sampleRate : 0,
    channels,
    durationSec: Number.isFinite(durationSec) ? durationSec : 0,
    fileSizeBytes: Number.isFinite(fileSizeBytes) ? fileSizeBytes : statSize,
  };
}

export function verifyAudioBufferOnDisk(
  filePath: string,
  declaredDurationMs?: number
): NormalizedAudioAsset {
  const buffer = fs.readFileSync(filePath);
  return normalizeAudioAsset(buffer, { declaredDurationMs });
}

export async function normalizeTeacherAudioToMp3(
  options: NormalizeTeacherAudioOptions
): Promise<NormalizedTeacherAudioResult> {
  const startedAt = performance.now();
  const outDir = path.dirname(options.outputPath);
  fs.mkdirSync(outDir, { recursive: true });

  const uniqueTag = `${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const tmpOutputPath = `${options.outputPath}.${uniqueTag}.tmp.mp3`;
  const filterChain = buildTeacherAudioFilterChain({
    speed: options.speed,
    pitchShiftFactor: options.pitchShiftFactor,
  });

  try {
    await execFileAsync(FFMPEG_PATH, [
      "-y",
      "-i",
      options.inputPath,
      "-vn",
      "-af",
      filterChain,
      "-ar",
      "44100",
      "-ac",
      "1",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "64k",
      "-write_xing",
      "1",
      "-loglevel",
      "error",
      tmpOutputPath,
    ]);

    const probed = await probeAudioFile(tmpOutputPath);
    if (
      probed.sampleRate !== 44_100 ||
      probed.channels !== 1 ||
      probed.durationSec <= 0.05
    ) {
      throw new Error(
        `MP3 đầu ra sai chuẩn kỹ thuật: sr=${probed.sampleRate}, ch=${probed.channels}, dur=${probed.durationSec}s`
      );
    }

    const asset = verifyAudioBufferOnDisk(
      tmpOutputPath,
      Math.max(100, Math.round(probed.durationSec * 1000))
    );

    fs.renameSync(tmpOutputPath, options.outputPath);

    return {
      outputPath: options.outputPath,
      probed,
      asset,
      normalizeMs: Math.round((performance.now() - startedAt) * 100) / 100,
    };
  } catch (err) {
    if (fs.existsSync(tmpOutputPath)) {
      fs.rmSync(tmpOutputPath, { force: true });
    }
    throw err;
  }
}
