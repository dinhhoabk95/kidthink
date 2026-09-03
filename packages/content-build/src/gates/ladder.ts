/**
 * Bậc thang đo nợ và kiểm soát thoái lui cho Cổng 1 (BR-CSA-16, Task #117).
 *
 * Quy tắc: Con số trượt chỉ được GIẢM khi 27 task engine (#130–#156) merge;
 * nếu con số trượt tăng lên bất kỳ lúc nào, gate/test phải ĐỎ ngay lập tức.
 */

export interface Gate1LadderBaselines {
  maxFailingGate1Levels: number;
  maxContentPackFails: number;
  maxDifficultyParamsFails: number;
}

/**
 * Đo lại 2026-08-30 sau task 162: 175 → **0** level trượt Cổng 1.
 *
 * Codemod hợp đồng chuyển 102 level về đúng `content_contract` của engine sở
 * hữu chúng; 73 level còn lại được soạn lại trong
 * `seed-content/reauthored/authoring.ts` theo cơ chế mà engine thật sự có.
 * Trần 0 nghĩa là một level mới không parse được contract làm cổng đỏ ngay.
 */
export const GATE_1_LADDER_BASELINES: Gate1LadderBaselines = {
  maxFailingGate1Levels: 0,
  maxContentPackFails: 0,
  maxDifficultyParamsFails: 0,
};

export interface EngineFailureStat {
  engineCode: string;
  totalLevels: number;
  contentPackFails: number;
  difficultyParamsFails: number;
  failingLevels: number;
  missingContentFields: Record<string, number>;
  missingDifficultyFields: Record<string, number>;
}

export interface Gate1CorpusReport {
  totalLevels: number;
  totalFailingLevels: number;
  totalContentPackFails: number;
  totalDifficultyParamsFails: number;
  statsByEngine: Record<string, EngineFailureStat>;
  isLadderCompliant: boolean;
  regressionMessage?: string;
}

/**
 * Bậc thang đo nợ và kiểm soát thoái lui cho Cổng 5 — Band tuổi bị cấm (BR-ECD-13, Task #118).
 *
 * Quy tắc: Con số level ngoài band chỉ được GIẢM khi 27 task engine (#130–#156) merge dọn dẹp;
 * nếu con số trượt tăng lên bất kỳ lúc nào, gate/test phải ĐỎ ngay lập tức.
 */
export interface Gate5BandLadderBaselines {
  maxOutOfBandLevels: number;
}

export const GATE_5_BAND_LADDER_BASELINES: Gate5BandLadderBaselines = {
  // Dọn xong trong dải task #130–#156: 42 level đã được nâng lên band hợp lệ
  // thấp nhất của engine sở hữu chúng. Trần 0 nghĩa là mọi level mới gắn sai
  // band đều làm cổng đỏ ngay, thay vì chui vào một hạn ngạch còn chỗ trống.
  maxOutOfBandLevels: 0,
};

export interface EngineBandViolationStat {
  engineCode: string;
  totalLevels: number;
  outOfBandLevels: number;
  bannedAgeBands: string[];
  violatingLevelCodes: string[];
}
