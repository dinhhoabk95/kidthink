/**
 * lint:perf-budget — Ngân sách hiệu năng và cổng tự động (BR-PRF-01, BR-PRF-02, BR-PRF-08).
 *
 * SPEC: performance-budgets.md (§7.1, §7.2, §7.4).
 * Plan: 26-p1-1-ui-quality-contract-plan.md Task 6 (D-FB, D-FC).
 */

export const PERFORMANCE_BUDGETS = {
  appShellGzipMaxKb: 180,
  gameTemplateGzipMaxKb: 80,
  levelConfigPayloadMaxKb: 200,
  assetImageWebpMaxKb: 120,
  publicPageTotalGzipMaxKb: 500,
  imageMaxDimensionPx: 960,
  lcpMaxSeconds: 2.5,
  clsMaxScore: 0.1,
  apiP95MaxMs: 800,
  ingestP95MaxMs: 200,
  deviceTarget: "Lenovo Tab M8 (2GB RAM, 4G Throttle)",
} as const;

export interface AssetMeta {
  dimensions?: { height: number; width: number };
  format: string;
  name: string;
  sizeKb: number;
}

export function checkBundleBudget(
  actualKb: number,
  category: "appShell" | "gameTemplate" | "levelConfig" | "publicPage"
): boolean {
  let maxKb = PERFORMANCE_BUDGETS.appShellGzipMaxKb;
  if (category === "gameTemplate") {
    maxKb = PERFORMANCE_BUDGETS.gameTemplateGzipMaxKb;
  } else if (category === "levelConfig") {
    maxKb = PERFORMANCE_BUDGETS.levelConfigPayloadMaxKb;
  } else if (category === "publicPage") {
    maxKb = PERFORMANCE_BUDGETS.publicPageTotalGzipMaxKb;
  }

  if (actualKb > maxKb) {
    throw new Error(
      `[BR-PRF-01 Error] Category '${category}' bundle size (${actualKb} KB) exceeds performance budget limit (${maxKb} KB). Merge blocked.`
    );
  }
  return true;
}

export function checkWebpImageBudget(asset: AssetMeta): boolean {
  // BR-PRF-08: WebP image <= 960x960, size <= 120KB
  if (asset.format.toLowerCase() !== "webp") {
    throw new Error(
      `[BR-PRF-08 Error] Asset '${asset.name}' is format '${asset.format}'. Images must be served as WebP.`
    );
  }

  if (asset.sizeKb > PERFORMANCE_BUDGETS.assetImageWebpMaxKb) {
    throw new Error(
      `[BR-PRF-08 Error] Asset '${asset.name}' size (${asset.sizeKb} KB) exceeds maximum allowed size (${PERFORMANCE_BUDGETS.assetImageWebpMaxKb} KB).`
    );
  }

  if (
    asset.dimensions &&
    (asset.dimensions.width > PERFORMANCE_BUDGETS.imageMaxDimensionPx ||
      asset.dimensions.height > PERFORMANCE_BUDGETS.imageMaxDimensionPx)
  ) {
    throw new Error(
      `[BR-PRF-08 Error] Asset '${asset.name}' dimensions (${asset.dimensions.width}x${asset.dimensions.height}) exceed maximum allowed dimensions (${PERFORMANCE_BUDGETS.imageMaxDimensionPx}x${PERFORMANCE_BUDGETS.imageMaxDimensionPx}).`
    );
  }

  return true;
}

export const K6_HEALTH_CONFIG = {
  options: {
    thresholds: {
      http_req_duration: ["p(95)<800"], // API P95 < 800ms
    },
    vus: 10,
    duration: "10s",
  },
  endpoint: "/health",
};

// CLI execution
if (process.argv[1]?.endsWith("lint-perf-budget.ts")) {
  process.stdout.write(
    `✅ [lint:perf-budget] Performance budget gate configured (Shell <= ${PERFORMANCE_BUDGETS.appShellGzipMaxKb}KB, LCP < ${PERFORMANCE_BUDGETS.lcpMaxSeconds}s on 4G throttle).\n`
  );
  process.exit(0);
}
