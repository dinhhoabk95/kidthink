/**
 * RuleDetectionSystem — Hệ thống nhận diện và chấm quy luật tự tạo cho GT-036 (free-create).
 *
 * Tiêu chuẩn:
 * - BR-E036-01: Chấm là hàm thuần tất định của chuỗi phần tử và min_repetitions.
 * - BR-E036-02: Mọi quy luật tự nhất quán đều đạt; cấm so với mẫu dựng sẵn.
 * - Hỗ trợ 2 chế độ: "relaxed" (chấp nhận đuôi dở dang) và "strict" (kết thúc đúng ranh giới).
 */

export interface RuleDetectionOptions {
  readonly minRepetitions: number;
  readonly strictness?: "relaxed" | "strict";
  readonly paletteSize?: number;
}

export interface RuleDetectionResult {
  readonly detected: boolean;
  readonly motif: readonly string[];
  readonly repetitions: number;
  readonly distinctElements: number;
  readonly score: number;
  readonly isWin: boolean;
}

function checkMotifMatch(
  sequence: readonly string[],
  motifLength: number,
  minRepetitions: number,
  strictness: "relaxed" | "strict"
): { valid: boolean; repetitions: number } {
  const n = sequence.length;
  const motif = sequence.slice(0, motifLength);

  let fullRepetitions = 0;
  let idx = 0;

  while (idx + motifLength <= n) {
    let matches = true;
    for (let j = 0; j < motifLength; j++) {
      if (sequence[idx + j] !== motif[j]) {
        matches = false;
        break;
      }
    }
    if (!matches) {
      break;
    }
    fullRepetitions++;
    idx += motifLength;
  }

  if (fullRepetitions < minRepetitions) {
    return { valid: false, repetitions: 0 };
  }

  const remainder = n - idx;
  if (remainder === 0) {
    return { valid: true, repetitions: fullRepetitions };
  }

  if (strictness === "strict") {
    return { valid: false, repetitions: 0 };
  }

  // Relaxed mode: remainder items must match the start of the motif
  for (let j = 0; j < remainder; j++) {
    if (sequence[idx + j] !== motif[j]) {
      return { valid: false, repetitions: 0 };
    }
  }

  return { valid: true, repetitions: fullRepetitions };
}

function calculateScore(
  repetitions: number,
  minRepetitions: number,
  distinctInMotif: number,
  paletteSize: number
): number {
  const baseScore = 60; // Điểm sàn khi đạt quy luật (pass_threshold = 60)
  const repBonus = Math.min(20, (repetitions - minRepetitions) * 10);
  const denom = Math.max(paletteSize, 2);
  const diversityBonus = Math.min(
    20,
    Math.round((distinctInMotif / denom) * 20)
  );

  return Math.min(100, Math.max(0, baseScore + repBonus + diversityBonus));
}

/**
 * Phát hiện mô-típ ngắn nhất lặp lại trong chuỗi phần tử.
 * Hàm thuần — không có side-effect, trả về kết quả tất định.
 */
export function detectRule(
  sequence: readonly (string | null | undefined)[],
  options: RuleDetectionOptions
): RuleDetectionResult {
  const { minRepetitions, strictness = "relaxed", paletteSize = 3 } = options;

  // Lấy chuỗi các phần tử liên tục đã đặt từ đầu
  const cleanSequence: string[] = [];
  for (const item of sequence) {
    if (item === null || item === undefined || item === "") {
      break;
    }
    cleanSequence.push(item);
  }

  const n = cleanSequence.length;
  if (n === 0 || minRepetitions <= 0) {
    return {
      detected: false,
      motif: [],
      repetitions: 0,
      distinctElements: 0,
      score: 0,
      isWin: false,
    };
  }

  const maxMotifLen = Math.floor(n / minRepetitions);

  for (let len = 1; len <= maxMotifLen; len++) {
    const { valid, repetitions } = checkMotifMatch(
      cleanSequence,
      len,
      minRepetitions,
      strictness
    );

    if (valid) {
      const motif = cleanSequence.slice(0, len);
      const distinctInMotif = new Set(motif).size;
      const score = calculateScore(
        repetitions,
        minRepetitions,
        distinctInMotif,
        paletteSize
      );

      return {
        detected: true,
        motif,
        repetitions,
        distinctElements: distinctInMotif,
        score,
        isWin: score >= 60,
      };
    }
  }

  return {
    detected: false,
    motif: [],
    repetitions: 0,
    distinctElements: 0,
    score: 0,
    isWin: false,
  };
}
