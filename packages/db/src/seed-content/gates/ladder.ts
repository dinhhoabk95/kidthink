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

export const GATE_1_LADDER_BASELINES: Gate1LadderBaselines = {
  maxFailingGate1Levels: 175,
  maxContentPackFails: 162,
  maxDifficultyParamsFails: 170,
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
