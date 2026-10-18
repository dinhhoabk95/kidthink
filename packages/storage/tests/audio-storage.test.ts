import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  AUDIO_LOUDNESS_TARGET_LUFS,
  AUDIO_RAMP_IN_MS,
  AUDIO_RAMP_OUT_MS,
  AUDIO_TRUE_PEAK_DBTP,
  buildRelativeAudioPath,
  deletePublicAudio,
  detectAudioMimeType,
  getPublicAudio,
  MAX_AUDIO_DURATION_MS,
  MAX_AUDIO_FILE_SIZE_BYTES,
  normalizeAudioAsset,
  uploadPublicAudio,
  url,
} from "#src/index";

const BASE_URL = "https://assets.example.test";
const ROOT_DIR = path.resolve(import.meta.dirname, "../../..");

beforeAll(() => {
  process.env.STORAGE_BASE_URL = BASE_URL;
});

function audioHeader(bytes: number[], totalLength = 64): Buffer {
  return Buffer.concat([
    Buffer.from(bytes),
    Buffer.alloc(Math.max(0, totalLength - bytes.length)),
  ]);
}

describe("detectAudioMimeType (BR-AST-07)", () => {
  it("nhận Ogg Opus/Vorbis theo magic bytes OggS (4F 67 67 53)", () => {
    const ogg = audioHeader([0x4f, 0x67, 0x67, 0x53]);
    expect(detectAudioMimeType(ogg)).toBe("audio/ogg");
  });

  it("nhận MP3 theo header ID3 (49 44 33) và MPEG sync (FF FB)", () => {
    const mp3Id3 = audioHeader([0x49, 0x44, 0x33, 0x04, 0x00]);
    const mp3Sync = audioHeader([0xff, 0xfb, 0x90, 0x64]);
    expect(detectAudioMimeType(mp3Id3)).toBe("audio/mpeg");
    expect(detectAudioMimeType(mp3Sync)).toBe("audio/mpeg");
  });

  it("nhận WAV theo RIFF....WAVE", () => {
    const wav = audioHeader([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x08, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);
    expect(detectAudioMimeType(wav)).toBe("audio/wav");
  });

  it("nhận WebM theo EBML header 1A 45 DF A3", () => {
    const webm = audioHeader([0x1a, 0x45, 0xdf, 0xa3]);
    expect(detectAudioMimeType(webm)).toBe("audio/webm");
  });

  it("nhận MP4/M4A theo ftyp ở offset 4..7", () => {
    const mp4 = audioHeader([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20,
    ]);
    expect(detectAudioMimeType(mp4)).toBe("audio/mp4");
  });

  it("từ chối file thực thi, script, SVG hoặc payload quá ngắn", () => {
    const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const sh = Buffer.from("#!/bin/sh\necho pwned\n");
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const shortBuf = Buffer.from([0x4f, 0x67]);

    expect(detectAudioMimeType(exe)).toBeNull();
    expect(detectAudioMimeType(sh)).toBeNull();
    expect(detectAudioMimeType(svg)).toBeNull();
    expect(detectAudioMimeType(shortBuf)).toBeNull();
  });
});

describe("normalizeAudioAsset (BR-AST-01, BR-AST-02, BR-AST-03)", () => {
  it("chuẩn hoá file âm thanh hợp lệ với thông số -16 LUFS, -1 dBTP và ramp 20ms/40ms", () => {
    const ogg = audioHeader([0x4f, 0x67, 0x67, 0x53], 16_000);
    const normalized = normalizeAudioAsset(ogg, { declaredDurationMs: 2500 });

    expect(normalized.detectedMimeType).toBe("audio/ogg");
    expect(normalized.outputMimeType).toBe("audio/ogg");
    expect(normalized.outputExtension).toBe("ogg");
    expect(normalized.durationMs).toBe(2500);
    expect(normalized.fileSizeBytes).toBe(16_000);
    expect(normalized.sampleRate).toBe(44_100);
    expect(normalized.channels).toBe(1);
    expect(normalized.targetLufs).toBe(AUDIO_LOUDNESS_TARGET_LUFS);
    expect(normalized.truePeakDbtp).toBe(AUDIO_TRUE_PEAK_DBTP);
    expect(normalized.rampInMs).toBe(AUDIO_RAMP_IN_MS);
    expect(normalized.rampOutMs).toBe(AUDIO_RAMP_OUT_MS);
  });

  it("BR-AST-01: từ chối file vượt quá 500 KB (AUDIO_SIZE_LIMIT_EXCEEDED)", () => {
    const oversized = audioHeader(
      [0x4f, 0x67, 0x67, 0x53],
      MAX_AUDIO_FILE_SIZE_BYTES + 1
    );
    expect(() => normalizeAudioAsset(oversized)).toThrow(
      "AUDIO_SIZE_LIMIT_EXCEEDED"
    );
  });

  it("BR-AST-01: từ chối file có thời lượng vượt quá 30 giây (AUDIO_DURATION_EXCEEDED)", () => {
    const ogg = audioHeader([0x4f, 0x67, 0x67, 0x53], 8000);
    expect(() =>
      normalizeAudioAsset(ogg, {
        declaredDurationMs: MAX_AUDIO_DURATION_MS + 1,
      })
    ).toThrow("AUDIO_DURATION_EXCEEDED");
  });

  it("BR-AST-07: từ chối file giả mạo đuôi .mp3 nhưng sai magic bytes (AUDIO_FORMAT_INVALID)", () => {
    const fakeMp3 = Buffer.from("<!DOCTYPE html><script>alert(1)</script>");
    expect(() => normalizeAudioAsset(fakeMp3)).toThrow("AUDIO_FORMAT_INVALID");
  });
});

describe("buildRelativeAudioPath & uploadPublicAudio (BR-AST-05, BR-AST-06)", () => {
  it("BR-AST-05: sinh đường dẫn tương đối audio/{year}/{month}/{hash}_{suffix}.{ext} và dựng URL qua storage.url()", () => {
    const relPath = buildRelativeAudioPath(
      "abcdef0123456789abcdef0123456789",
      "11223344-5566",
      "ogg",
      new Date("2026-10-18T00:00:00.000Z")
    );
    expect(relPath).toBe("audio/2026/10/abcdef0123456789_11223344.ogg");
    expect(relPath.startsWith("http://")).toBe(false);
    expect(relPath.startsWith("https://")).toBe(false);
    expect(url(relPath)).toBe(
      `${BASE_URL}/audio/2026/10/abcdef0123456789_11223344.ogg`
    );
  });

  it("BR-AST-05 & BR-AST-06: lưu và xoá file audio trong kho public, cấm ghi đè key đã tồn tại và cấm URL tuyệt đối", async () => {
    const key = "audio/2026/10/test_unique_01.ogg";
    const body = audioHeader([0x4f, 0x67, 0x67, 0x53], 32);

    await uploadPublicAudio({
      key,
      body,
      contentType: "audio/ogg",
    });

    const stored = getPublicAudio(key);
    expect(stored?.contentType).toBe("audio/ogg");
    expect(Buffer.from(stored?.body ?? []).equals(body)).toBe(true);

    // BR-AST-06: Cấm ghi đè file âm thanh đã tồn tại
    await expect(
      uploadPublicAudio({
        key,
        body,
        contentType: "audio/ogg",
      })
    ).rejects.toThrow("BR-AST-06");

    // BR-AST-05: Cấm lưu URL tuyệt đối
    await expect(
      uploadPublicAudio({
        key: "https://cdn.example.test/audio/bad.ogg",
        body,
        contentType: "audio/ogg",
      })
    ).rejects.toThrow("BR-AST-05");

    expect(deletePublicAudio(key)).toBe(true);
    expect(getPublicAudio(key)).toBeUndefined();
  });

  it("BR-AST-08 (#306): xác nhận schema content_audio và các route /api/managers/audio tuân thủ writeAudit + CONTENT_IN_USE", () => {
    const schemaSource = fs.readFileSync(
      path.join(ROOT_DIR, "packages/db/src/schema/assets.ts"),
      "utf-8"
    );
    expect(schemaSource).toContain('pgTable(\n  "content_audio"');
    expect(schemaSource).toContain("duration_ms");
    expect(schemaSource).toContain("file_size_bytes");

    const postRoute = fs.readFileSync(
      path.join(ROOT_DIR, "apps/web/server/api/managers/audio/index.post.ts"),
      "utf-8"
    );
    expect(postRoute).toContain("AudioSizeLimitExceededError");
    expect(postRoute).toContain("AudioFormatInvalidError");
    expect(postRoute).toContain("writeAudit");

    const deleteRoute = fs.readFileSync(
      path.join(ROOT_DIR, "apps/web/server/api/managers/audio/[id].delete.ts"),
      "utf-8"
    );
    expect(deleteRoute).toContain("ContentInUseError");
    expect(deleteRoute).toContain("writeAudit");
  });
});
