import type { QueuedJobEnvelope } from "#src/do-queue-driver";
import { JOB_DEFINITIONS, type JobName } from "#src/jobs/index";

/**
 * Scheduler Cloudflare (`BR-JOB-09`, `BR-JOB-10`): một cron trigger `*\/5 * * * *`
 * kiểm mọi `schedule.pattern` của `JOB_DEFINITIONS` theo giờ ICT.
 */
export const CLOUDFLARE_SKIPPED_JOBS = [
  "backup:postgres",
  "backup:verify",
] as const;

const ICT_OFFSET_MS = 7 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
export const CLOUDFLARE_TICK_MINUTES = 5;
const TICK_MS = CLOUDFLARE_TICK_MINUTES * MINUTE_MS;
const INTEGER = /^\d+$/;
const WHITESPACE = /\s+/;

interface IctParts {
  readonly minute: number;
  readonly hour: number;
  readonly dayOfMonth: number;
  readonly month: number;
  readonly dayOfWeek: number;
  /** `YYYY-MM-DDTHH:mm` theo ICT. */
  readonly stamp: string;
}

function ictParts(at: Date): IctParts {
  const shifted = new Date(at.getTime() + ICT_OFFSET_MS);
  return {
    minute: shifted.getUTCMinutes(),
    hour: shifted.getUTCHours(),
    dayOfMonth: shifted.getUTCDate(),
    month: shifted.getUTCMonth() + 1,
    dayOfWeek: shifted.getUTCDay(),
    stamp: shifted.toISOString().slice(0, 16),
  };
}

function parseNumber(token: string, pattern: string): number {
  if (!INTEGER.test(token)) {
    throw new Error(
      `Cron pattern '${pattern}' có token không hợp lệ: '${token}'`
    );
  }
  return Number(token);
}

/** Một field cron: `*`, `*\/n`, số, `a-b`, hoặc danh sách phân cách dấu phẩy. */
function fieldMatches(
  field: string,
  value: number,
  min: number,
  pattern: string,
  normalize: (n: number) => number = (n) => n
): boolean {
  return field.split(",").some((part) => {
    const [range = "", stepRaw] = part.split("/");
    const step = stepRaw === undefined ? 1 : parseNumber(stepRaw, pattern);
    if (step < 1) {
      throw new Error(`Cron pattern '${pattern}' có bước không hợp lệ`);
    }
    if (range === "*") {
      return (value - min) % step === 0;
    }
    if (range.includes("-")) {
      const [lo = "", hi = ""] = range.split("-");
      const from = normalize(parseNumber(lo, pattern));
      const to = parseNumber(hi, pattern);
      // Field thứ: `a-7` phải khớp Chủ nhật (0) — thử thêm giá trị 7 cho 0.
      const candidates = value === 0 && normalize(7) === 0 ? [0, 7] : [value];
      return candidates.some(
        (v) => v >= from && v <= to && (v - from) % step === 0
      );
    }
    const exact = normalize(parseNumber(range, pattern));
    return stepRaw === undefined
      ? exact === value
      : value >= exact && (value - exact) % step === 0;
  });
}

/**
 * Cron 5 field có đến hạn tại đúng phút của `at` (giờ ICT) không.
 * Ngày-trong-tháng và thứ cùng bị giới hạn thì khớp khi một trong hai khớp.
 */
export function isCronDue(pattern: string, at: Date): boolean {
  const fields = pattern.trim().split(WHITESPACE);
  if (fields.length !== 5) {
    throw new Error(`Cron pattern '${pattern}' phải có đúng 5 field`);
  }
  const [minF = "", hourF = "", domF = "", monF = "", dowF = ""] = fields;
  const p = ictParts(at);
  const sunday7 = (n: number): number => (n === 7 ? 0 : n);

  if (
    !(
      fieldMatches(minF, p.minute, 0, pattern) &&
      fieldMatches(hourF, p.hour, 0, pattern) &&
      fieldMatches(monF, p.month, 1, pattern)
    )
  ) {
    return false;
  }
  const domMatch = fieldMatches(domF, p.dayOfMonth, 1, pattern);
  const dowMatch = fieldMatches(dowF, p.dayOfWeek, 0, pattern, sunday7);
  const domRestricted = domF !== "*";
  const dowRestricted = dowF !== "*";
  if (domRestricted && dowRestricted) {
    return domMatch || dowMatch;
  }
  return domMatch && dowMatch;
}

export interface ScheduledJobPattern {
  readonly name: JobName;
  readonly pattern: string;
}

const SKIPPED: ReadonlySet<string> = new Set(CLOUDFLARE_SKIPPED_JOBS);

function defaultSchedule(): readonly ScheduledJobPattern[] {
  const out: ScheduledJobPattern[] = [];
  for (const job of JOB_DEFINITIONS) {
    if (job.schedule.kind === "cron" && !SKIPPED.has(job.name)) {
      out.push({ name: job.name, pattern: job.schedule.pattern });
    }
  }
  return out;
}

function findDefinition(name: JobName): (typeof JOB_DEFINITIONS)[number] {
  const def = JOB_DEFINITIONS.find((job) => job.name === name);
  if (!def) {
    throw new Error(`Job '${name}' chưa được khai`);
  }
  return def;
}

/**
 * Các job đến hạn ở tick 5 phút chứa `ms`. Một pattern được tính ở tick phủ
 * phút nó nổ: cửa sổ là `(tick − 5 phút, tick]`, nên pattern có phút không phải
 * bội số của 5 vẫn được dispatch đúng một lần (ở tick liền sau).
 */
export function scheduledEnvelopesAt(
  ms: number,
  patterns: readonly ScheduledJobPattern[] = defaultSchedule()
): QueuedJobEnvelope[] {
  const tick = Math.floor(ms / TICK_MS) * TICK_MS;
  const envelopes: QueuedJobEnvelope[] = [];
  for (const { name, pattern } of patterns) {
    if (SKIPPED.has(name)) {
      continue;
    }
    const def = findDefinition(name);
    for (let k = 0; k < CLOUDFLARE_TICK_MINUTES; k++) {
      const minuteAt = new Date(tick - k * MINUTE_MS);
      if (!isCronDue(pattern, minuteAt)) {
        continue;
      }
      envelopes.push({
        jobId: `${name}:${ictParts(minuteAt).stamp}`,
        name,
        payloadJson: "{}",
        maxAttempts: def.retry.maxAttempts,
        backoffType: def.retry.backoffType,
        backoffDelayMs: def.retry.backoffDelayMs,
        timeoutSeconds: def.timeoutSeconds,
        alertOnFailImmediately: def.retry.alertOnFailImmediately,
      });
    }
  }
  return envelopes;
}
