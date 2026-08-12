export type ScaffoldingLevel = 0 | 1 | 2 | 3;

export interface ScaffoldingConfig {
  l1_misses: number;
  l1_time_s: number;
  l2_misses: number;
  l2_time_s: number;
  l3_misses: number;
  l3_time_s: number;
}

export const SCAFFOLDING_BY_BAND: Record<
  "3-4" | "4-5" | "5-6",
  ScaffoldingConfig
> = {
  "3-4": {
    l1_misses: 1,
    l1_time_s: 10,
    l2_misses: 2,
    l2_time_s: 18,
    l3_misses: 3,
    l3_time_s: 25,
  },
  "4-5": {
    l1_misses: 2,
    l1_time_s: 15,
    l2_misses: 3,
    l2_time_s: 25,
    l3_misses: 4,
    l3_time_s: 35,
  },
  "5-6": {
    l1_misses: 2,
    l1_time_s: 20,
    l2_misses: 3,
    l2_time_s: 30,
    l3_misses: 5,
    l3_time_s: 40,
  },
};

export class ScaffoldingSystem {
  private readonly ageBand: "3-4" | "4-5" | "5-6";
  private missCount = 0;
  private startTimeMs = Date.now();
  private currentLevel: ScaffoldingLevel = 0;

  constructor(ageBand: "3-4" | "4-5" | "5-6" = "3-4") {
    this.ageBand = ageBand;
  }

  recordMiss(): ScaffoldingLevel {
    this.missCount++;
    return this.evaluateLevel();
  }

  tick(): ScaffoldingLevel {
    return this.evaluateLevel();
  }

  resetOnSuccess(): void {
    this.missCount = 0;
    this.startTimeMs = Date.now();
    this.currentLevel = 0;
  }

  evaluateLevel(): ScaffoldingLevel {
    const config = SCAFFOLDING_BY_BAND[this.ageBand];
    const elapsedSeconds = (Date.now() - this.startTimeMs) / 1000;

    if (
      this.missCount >= config.l3_misses ||
      elapsedSeconds >= config.l3_time_s
    ) {
      this.currentLevel = 3;
    } else if (
      this.missCount >= config.l2_misses ||
      elapsedSeconds >= config.l2_time_s
    ) {
      this.currentLevel = 2;
    } else if (
      this.missCount >= config.l1_misses ||
      elapsedSeconds >= config.l1_time_s
    ) {
      this.currentLevel = 1;
    } else {
      this.currentLevel = 0;
    }

    return this.currentLevel;
  }

  getCurrentLevel(): ScaffoldingLevel {
    return this.currentLevel;
  }
}
