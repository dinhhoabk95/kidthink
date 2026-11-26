import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  computeVoiceHash,
  formatVietnameseCardinal,
  normalizeVoiceLookupKey,
  resolveTeacherVoicePath,
  sha256HexSync,
  TEACHER_VOICE_PROFILE,
  toSpokenVietnameseScript,
  VOICE_FILE_STEM_MAX_CHARS,
  voiceFileStem,
} from "#src/voice-path";

function nodeSha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

describe("voice-path — SHA-256, lookup key, deterministic path & spoken Vietnamese (#316)", () => {
  describe("sha256HexSync — matches node:crypto byte-for-byte", () => {
    it("matches node:crypto on empty, ASCII, complex Vietnamese diacritics, and multi-block UTF-8 (>64 bytes)", () => {
      const vectors: readonly string[] = [
        "",
        "abc",
        "Dung dăng dung dẻ, bé giỏi quá nè!",
        "Tìm tiếng có thanh ngã: cái đĩa, quyển vở",
        "teacher-v1:bé hãy chọn tất cả các hình tròn màu đỏ nhé!",
        // Boundary cases around 55/56/64/128 UTF-8 bytes
        "a".repeat(55),
        "a".repeat(56),
        "a".repeat(64),
        "a".repeat(128),
        "Nuôi dưỡng tư duy sáng tạo mầm non Việt Nam — Giấy dó, chiếu cói, nan tre ngà, đàn T'rưng âm vang khắp bản làng thân thương!",
      ];

      for (const sample of vectors) {
        expect(sha256HexSync(sample)).toBe(nodeSha256(sample));
      }
    });
  });

  describe("normalizeVoiceLookupKey — canonical deduplication", () => {
    it("normalizes NFC/NFD, zero-width chars, casing, whitespace, trailing dots, and 'số không' -> 'số 0'", () => {
      const nfd = "Ch\u006F\u0323n s\u006F\u0302\u0301 kh\u006F\u0302ng.";
      expect(normalizeVoiceLookupKey(nfd)).toBe("chọn số 0");
      expect(normalizeVoiceLookupKey("  Chọn   SỐ KHÔNG...  ")).toBe(
        "chọn số 0"
      );
      expect(normalizeVoiceLookupKey("chọn\u200B số\uFEFF 0.")).toBe(
        "chọn số 0"
      );
    });

    it("preserves '?' and '!' for interrogative and exclamatory intonation", () => {
      expect(normalizeVoiceLookupKey("Đâu là số không?")).toBe("đâu là số 0?");
      expect(normalizeVoiceLookupKey("Bé giỏi quá!")).toBe("bé giỏi quá!");
      expect(normalizeVoiceLookupKey("   ")).toBe("");
    });
  });

  describe("computeVoiceHash & resolveTeacherVoicePath", () => {
    it("resolves identical deterministic path for equivalent Vietnamese strings", () => {
      expect(TEACHER_VOICE_PROFILE).toBe("teacher-v1");

      const pathWord = resolveTeacherVoicePath("Chọn số không.");
      const pathDigit = resolveTeacherVoicePath("  chọn   SỐ 0  ");
      expect(pathWord).not.toBeNull();
      expect(pathWord).toBe(pathDigit);

      const expectedHash = nodeSha256("teacher-v1:chọn số 0").slice(0, 16);
      expect(computeVoiceHash("Chọn số không.")).toBe(expectedHash);
      expect(pathWord).toBe("/audio/voice/chọn-số-0.mp3");
    });

    it("returns empty hash and null path for blank or whitespace-only text", () => {
      expect(computeVoiceHash("")).toBe("");
      expect(computeVoiceHash("   \u200B  ")).toBe("");
      expect(resolveTeacherVoicePath("")).toBeNull();
      expect(resolveTeacherVoicePath("...")).toBeNull();
    });

    it("names the flat file after the text, keeping Vietnamese diacritics (BR-PNR-05)", () => {
      expect(resolveTeacherVoicePath("Bớt 1 bạn ra nhé!")).toBe(
        "/audio/voice/bớt-1-bạn-ra-nhé.mp3"
      );
      expect(voiceFileStem("ba")).not.toBe(voiceFileStem("bà"));
      expect(voiceFileStem("Xe ô-tô con")).toBe(voiceFileStem("xe ô tô con"));
      expect(resolveTeacherVoicePath("Số ba")).not.toContain("teacher-v1");
    });

    it("truncates long stems at a word boundary and appends hash8", () => {
      const long = "Góc ba mẹ chơi cùng bé. ".repeat(6);
      const stem = voiceFileStem(long);
      const hash8 = computeVoiceHash(long).slice(0, 8);
      expect(stem.endsWith(`-${hash8}`)).toBe(true);
      expect(Array.from(stem).length).toBeLessThanOrEqual(
        VOICE_FILE_STEM_MAX_CHARS + 9
      );
      expect(stem.startsWith("góc-ba-mẹ-chơi-cùng-bé")).toBe(true);
    });
  });

  describe("formatVietnameseCardinal — Northern preschool standard (0..999)", () => {
    it("formats key cardinal milestones accurately", () => {
      const expectedPairs: readonly (readonly [number, string])[] = [
        [0, "không"],
        [4, "bốn"],
        [5, "năm"],
        [10, "mười"],
        [11, "mười một"],
        [14, "mười bốn"],
        [15, "mười lăm"],
        [20, "hai mươi"],
        [21, "hai mươi mốt"],
        [24, "hai mươi tư"],
        [25, "hai mươi lăm"],
        [100, "một trăm"],
        [105, "một trăm linh năm"],
        [115, "một trăm mười lăm"],
        [224, "hai trăm hai mươi tư"],
        [999, "chín trăm chín mươi chín"],
      ];

      for (const [num, word] of expectedPairs) {
        expect(formatVietnameseCardinal(num)).toBe(word);
      }
    });

    it("returns String(n) for out-of-range or non-integer numbers", () => {
      expect(formatVietnameseCardinal(-1)).toBe("-1");
      expect(formatVietnameseCardinal(1000)).toBe("1000");
      expect(formatVietnameseCardinal(2.5)).toBe("2.5");
    });
  });

  describe("toSpokenVietnameseScript — TTS script preparation", () => {
    it("converts standalone tone mark glyphs into spoken Vietnamese names", () => {
      expect(toSpokenVietnameseScript("—")).toBe("Thanh ngang");
      expect(toSpokenVietnameseScript("ˋ")).toBe("Dấu huyền");
      expect(toSpokenVietnameseScript("ˊ")).toBe("Dấu sắc");
      expect(toSpokenVietnameseScript("﹒")).toBe("Dấu nặng");
      expect(toSpokenVietnameseScript("ʾ")).toBe("Dấu hỏi");
      expect(toSpokenVietnameseScript("\u0309")).toBe("Dấu hỏi");
      expect(toSpokenVietnameseScript("˜")).toBe("Dấu ngã");
    });

    it("expands arithmetic expressions, progress ratios (BR-PNR-12), 'số 0', echo cue, and standalone integers", () => {
      expect(toSpokenVietnameseScript("4 + 2 = mấy nhỉ?")).toBe(
        "bốn cộng hai bằng mấy nhỉ?"
      );
      expect(toSpokenVietnameseScript("Toa thứ 2 chưa đúng nhịp (2/5)")).toBe(
        "Toa thứ hai chưa đúng nhịp, hai trên năm"
      );
      expect(toSpokenVietnameseScript("Đã xếp 3/5")).toBe(
        "Đã xếp, ba trên năm"
      );
      expect(toSpokenVietnameseScript("15")).toBe("mười lăm");
      expect(toSpokenVietnameseScript("Chọn số 0.")).toBe("Chọn số không.");
      expect(toSpokenVietnameseScript("Bé nói theo cô nhé: Quả táo")).toBe(
        "Bé nói theo cô nhé, Quả táo"
      );
      expect(toSpokenVietnameseScript("8 − 3 > 4")).toBe(
        "tám trừ ba lớn hơn bốn"
      );
      expect(toSpokenVietnameseScript("2 × 3 = 6 ÷ 1")).toBe(
        "hai nhân ba bằng sáu chia một"
      );
    });

    it("preserves hyphenated Vietnamese loanwords while expanding numeric subtraction", () => {
      expect(toSpokenVietnameseScript("Chọn chiếc ô-tô màu đỏ")).toBe(
        "Chọn chiếc ô-tô màu đỏ"
      );
      expect(toSpokenVietnameseScript("5 - 2 = 3")).toBe("năm trừ hai bằng ba");
    });
  });
});
