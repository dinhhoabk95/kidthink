import type { AdventureStepItem } from "@mindkid/shared/client";

const SAFE_CODE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function sanitizeSafePlayCode(raw: string | undefined): string | null {
  return typeof raw === "string" && SAFE_CODE_PATTERN.test(raw) ? raw : null;
}

export function buildAdventureStartHref(
  steps: readonly AdventureStepItem[]
): string | null {
  const safeCodes = steps
    .map((step) => sanitizeSafePlayCode(step.level_code))
    .filter((code): code is string => code !== null);
  const first = safeCodes[0];
  if (!first) {
    return null;
  }
  const rest = safeCodes.slice(1);
  if (rest.length === 0) {
    return `/play/${first}?adventure=1`;
  }
  return `/play/${first}?adventure=1&adv_queue=${rest.join(",")}`;
}

export interface PlayRouteQueryShape {
  readonly return_to?: string | Array<string | null> | null;
  readonly return_level_code?: string | Array<string | null> | null;
  readonly adventure?: string | Array<string | null> | null;
  readonly adv_queue?: string | Array<string | null> | null;
}

function firstQueryString(
  val: string | Array<string | null> | null | undefined
): string | undefined {
  if (typeof val === "string") {
    return val;
  }
  if (Array.isArray(val) && typeof val[0] === "string") {
    return val[0];
  }
  return undefined;
}

/**
 * Suy đích đến kế tiếp khi trẻ bấm Chơi Tiếp trên màn thưởng (`BR-DAV-05`).
 * Mọi mã màn chơi đều đi qua regex whitelist chống open-redirect.
 */
export function resolveNextPlayDestination(query: PlayRouteQueryShape): string {
  const rawQueue = firstQueryString(query.adv_queue);
  if (rawQueue) {
    const queue = rawQueue
      .split(",")
      .map((entry) => sanitizeSafePlayCode(entry.trim()))
      .filter((code): code is string => code !== null);
    const nextCode = queue[0];
    if (nextCode) {
      const rest = queue.slice(1);
      return rest.length > 0
        ? `/play/${nextCode}?adventure=1&adv_queue=${rest.join(",")}`
        : `/play/${nextCode}?adventure=1`;
    }
  }

  const rawReturn =
    firstQueryString(query.return_to) ??
    firstQueryString(query.return_level_code);
  const safeReturn = sanitizeSafePlayCode(rawReturn);
  if (safeReturn) {
    return `/play/${safeReturn}`;
  }

  if (firstQueryString(query.adventure) === "1") {
    return "/play?adventure_done=1";
  }

  return "/play";
}
