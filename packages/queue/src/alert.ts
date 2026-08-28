import { optionalEnv, requireEnv } from "@mindkid/config";
export type AlertSeverity =
  | "P0"
  | "P1"
  | "P2"
  | "critical"
  | "warning"
  | "error"
  | "info";

export interface AlertContext {
  [key: string]: unknown;
}

export interface AlertPayload {
  timestamp: string;
  severity: AlertSeverity;
  message: string;
  context: AlertContext;
  runbook?: string;
}

export interface AlertPort {
  sendAlert(payload: AlertPayload): Promise<void>;
  isLogOnly(): boolean;
}

export type AlertDispatcher = (
  recipient: string,
  payload: AlertPayload
) => Promise<void>;

let activeDispatcher: AlertDispatcher | undefined;

export function registerAlertDispatcher(dispatcher: AlertDispatcher): void {
  activeDispatcher = dispatcher;
}

/** Drops the dispatcher again, so a test can observe the production shape. */
export function clearAlertDispatcher(): void {
  activeDispatcher = undefined;
}

/**
 * An env var that is present but empty is not configured. requireEnv already
 * treats it that way (BR-ENV-01); an alert channel that trusted `""` would
 * report itself reachable and then build a request against an empty URL.
 */
function blankToUndefined(value: string | undefined): string | undefined {
  return value === undefined || value.trim().length === 0 ? undefined : value;
}

export class LogOnlyAlertAdapter implements AlertPort {
  sendAlert(payload: AlertPayload): Promise<void> {
    console.warn(
      `[ALERT_LOG_ONLY] ${payload.severity.toUpperCase()}: ${payload.message}`,
      payload.context
    );
    return Promise.resolve();
  }

  isLogOnly(): boolean {
    return true;
  }
}

export class EmailAlertAdapter implements AlertPort {
  readonly opsEmail: string;

  constructor(opsEmail?: string) {
    this.opsEmail =
      opsEmail === undefined ? requireEnv("OPERATIONS_ALERT_EMAIL") : opsEmail;
  }

  async sendAlert(payload: AlertPayload): Promise<void> {
    if (activeDispatcher) {
      await activeDispatcher(this.opsEmail, payload);
      return;
    }
    console.warn(
      `[ALERT_DISPATCHED_TO_EMAIL:${this.opsEmail}] ${payload.severity.toUpperCase()}: ${payload.message}`,
      payload.context
    );
  }

  /**
   * True in production, and that is the point.
   *
   * There is no email transport in this repository yet — the notification path
   * ends at LocalFileEmailAdapter — so without a dispatcher registered this
   * class writes a line to a log file and nothing else. Claiming otherwise is
   * what let a P0 alert channel look configured while nobody could receive
   * anything: assertAlertingReachable() below can only work if this answer is
   * honest.
   */
  isLogOnly(): boolean {
    return activeDispatcher === undefined;
  }
}

export interface TelegramAdapterOptions {
  botToken?: string;
  chatId?: string;
  fallbackAdapter?: AlertPort;
  fetchFn?: typeof fetch;
}

export class TelegramAlertAdapter implements AlertPort {
  readonly botToken: string | undefined;
  readonly chatId: string | undefined;
  readonly fallbackAdapter: AlertPort | undefined;
  private readonly fetchFn: typeof fetch;

  constructor(options?: TelegramAdapterOptions) {
    this.botToken = blankToUndefined(
      options?.botToken === undefined
        ? optionalEnv("TELEGRAM_BOT_TOKEN")
        : options.botToken
    );
    this.chatId = blankToUndefined(
      options?.chatId === undefined
        ? optionalEnv("TELEGRAM_CHAT_ID")
        : options.chatId
    );
    this.fallbackAdapter = options?.fallbackAdapter;
    this.fetchFn = options?.fetchFn || globalThis.fetch;
  }

  formatMessage(payload: AlertPayload): string {
    const runbook = payload.runbook || payload.context?.runbook;
    const runbookText = runbook ? `\n📖 Runbook: ${runbook}` : "";
    const ctxString =
      payload.context && Object.keys(payload.context).length > 0
        ? `\n📋 Context: ${JSON.stringify(payload.context)}`
        : "";

    return (
      `🚨 [ALERT:${payload.severity.toUpperCase()}] ${payload.message}\n` +
      `⏰ Time: ${payload.timestamp}` +
      runbookText +
      ctxString
    );
  }

  async sendAlert(payload: AlertPayload): Promise<void> {
    const text = this.formatMessage(payload);

    try {
      if (
        (!this.botToken || this.botToken === "mock_token") &&
        activeDispatcher
      ) {
        await activeDispatcher(`telegram:${this.chatId}`, payload);
        return;
      }

      if (!(this.botToken && this.chatId)) {
        throw new Error(
          "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are not configured"
        );
      }

      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: "HTML",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Telegram Bot API returned HTTP ${response.status}: ${response.statusText}`
        );
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[ALERT_FALLBACK_TRIGGERED] Telegram alert failed, fell back to email adapter: ${errorMsg}`
      );
      // Fallback to secondary adapter (email) as mandated by §7.3, D-S
      const fallbackPayload: AlertPayload = {
        ...payload,
        context: {
          ...payload.context,
          _fallback_from: "telegram",
          _fallback_reason: errorMsg,
        },
      };
      await this.resolveFallback().sendAlert(fallbackPayload);
    }
  }

  /**
   * Healthchecks, not email, is the default second channel: it performs a real
   * HTTPS request with no transport this repository still has to build, which
   * is the difference between a fallback and the appearance of one (D-S).
   */
  private resolveFallback(): AlertPort {
    return this.fallbackAdapter ?? new HealthchecksAlertAdapter();
  }

  isLogOnly(): boolean {
    if (this.botToken && this.chatId) {
      return false;
    }
    return this.resolveFallback().isLogOnly();
  }
}

export interface HealthchecksAdapterOptions {
  pingUrl?: string;
  checkUuid?: string;
  fetchFn?: typeof fetch;
}

const TRAILING_SLASHES_REGEX = /\/+$/;

export class HealthchecksAlertAdapter implements AlertPort {
  readonly pingUrl: string | undefined;
  private readonly fetchFn: typeof fetch;

  constructor(options?: HealthchecksAdapterOptions) {
    // Naming either option — even as a blank string — means the caller is
    // configuring this adapter, so the environment is not consulted at all.
    // Without that rule an explicit "no URL" would silently pick up whatever
    // the developer happens to have in .env, and the deaf case would be
    // untestable.
    const configured =
      options !== undefined && ("pingUrl" in options || "checkUuid" in options);

    const pingUrl = blankToUndefined(
      configured ? options.pingUrl : optionalEnv("HEALTHCHECKS_PING_URL")
    );
    const uuid = blankToUndefined(
      configured ? options.checkUuid : optionalEnv("HEALTHCHECKS_CHECK_UUID")
    );

    if (uuid === undefined) {
      this.pingUrl = pingUrl;
    } else {
      this.pingUrl = `https://hc-ping.com/${uuid}`;
    }
    this.fetchFn = options?.fetchFn || globalThis.fetch;
  }

  async ping(
    status: "start" | "success" | "fail" | "log" = "success",
    message?: string
  ): Promise<void> {
    if (this.pingUrl === undefined) {
      throw new Error(
        "HEALTHCHECKS_PING_URL or HEALTHCHECKS_CHECK_UUID is not configured"
      );
    }
    const endpoint =
      status === "success"
        ? this.pingUrl
        : `${this.pingUrl.replace(TRAILING_SLASHES_REGEX, "")}/${status}`;

    try {
      await this.fetchFn(endpoint, {
        method: "POST",
        body: message,
      });
    } catch (err) {
      console.warn(
        `[HEALTHCHECKS_PING_FAILED] Ping to ${endpoint} failed:`,
        err
      );
    }
  }

  async sendAlert(payload: AlertPayload): Promise<void> {
    const isCritical =
      payload.severity === "critical" || payload.severity === "error";
    await this.ping(
      isCritical ? "fail" : "log",
      `[${payload.severity.toUpperCase()}] ${payload.message}`
    );
  }

  isLogOnly(): boolean {
    return this.pingUrl === undefined;
  }
}

export interface DeduplicatorOptions {
  windowMs?: number; // default 15 minutes (15 * 60 * 1000)
}

export class DeduplicatingAlertAdapter implements AlertPort {
  readonly innerPort: AlertPort;
  readonly windowMs: number;
  private readonly cache = new Map<
    string,
    { lastSent: number; count: number }
  >();

  constructor(innerPort: AlertPort, options?: DeduplicatorOptions | number) {
    this.innerPort = innerPort;
    if (typeof options === "number") {
      this.windowMs = options;
    } else {
      this.windowMs = options?.windowMs ?? 15 * 60 * 1000;
    }
  }

  async sendAlert(payload: AlertPayload): Promise<void> {
    await this.sendAlertWithTime(payload, Date.now());
  }

  async sendAlertWithTime(
    payload: AlertPayload,
    now: number = Date.now()
  ): Promise<void> {
    const key = `${payload.severity}:${payload.message}`;
    const entry = this.cache.get(key);

    if (entry && now - entry.lastSent < this.windowMs) {
      entry.count += 1;
      return;
    }

    this.cache.set(key, { lastSent: now, count: 1 });
    await this.innerPort.sendAlert(payload);
  }

  getSuppressionInfo(
    severity: AlertSeverity,
    message: string
  ): { suppressedCount: number; lastSent?: number } {
    const key = `${severity}:${message}`;
    const entry = this.cache.get(key);
    return {
      suppressedCount: entry ? entry.count - 1 : 0,
      lastSent: entry?.lastSent,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  isLogOnly(): boolean {
    return this.innerPort.isLogOnly();
  }
}

export class DeadManSwitchMonitor {
  private lastHeartbeat: number = Date.now();
  private readonly thresholdMs: number;
  private readonly independentPort: AlertPort;

  constructor(
    independentPort: AlertPort,
    thresholdMs: number = 10 * 60 * 1000 // 10 minutes
  ) {
    this.independentPort = independentPort;
    this.thresholdMs = thresholdMs;
  }

  recordHeartbeat(now: number = Date.now()): void {
    this.lastHeartbeat = now;
  }

  async checkHeartbeat(now: number = Date.now()): Promise<boolean> {
    const elapsed = now - this.lastHeartbeat;
    if (elapsed >= this.thresholdMs) {
      await this.independentPort.sendAlert({
        timestamp: new Date(now).toISOString(),
        severity: "critical",
        message:
          "Monitoring system dead-man switch triggered: missing heartbeat for >= 10 minutes (BR-MON-04)",
        context: {
          elapsedMs: elapsed,
          thresholdMs: this.thresholdMs,
          independentChannel: true,
        },
      });
      return true;
    }
    return false;
  }
}

let currentAlertPort: AlertPort = new DeduplicatingAlertAdapter(
  new TelegramAlertAdapter()
);

export function setAlertPort(port: AlertPort): void {
  currentAlertPort = port;
}

export class AlertingUnreachableError extends Error {}

/**
 * BR-MON-01 — a P0 alert has to reach a person.
 *
 * Called at process start in production. Refusing to boot is deliberately
 * harsher than warning: a process that runs while every alert channel is a
 * console.warn is a process whose failures nobody will hear about, and the
 * whole point of the alert contract is that this state is not allowed to be
 * silent. The environment gate (BR-DEP-04) catches the same thing one step
 * earlier, at release time; this is the backstop for a machine that was
 * reconfigured by hand afterwards.
 */
export function assertAlertingReachable(
  isProduction = process.env.NODE_ENV === "production"
): void {
  if (!isProduction) {
    return;
  }
  if (currentAlertPort.isLogOnly()) {
    throw new AlertingUnreachableError(
      "No alert channel can reach a person: configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, or HEALTHCHECKS_PING_URL. Refusing to start deaf."
    );
  }
}

export function getAlertPort(): AlertPort {
  return currentAlertPort;
}

/**
 * Sends alert to active AlertPort.
 * Negative test for D-FX: fails if currentAlertPort.isLogOnly() returns true when real recipient delivery is enforced.
 */
export async function alert(
  severity: AlertSeverity,
  message: string,
  context?: AlertContext,
  runbook?: string
): Promise<AlertPayload> {
  const payload: AlertPayload = {
    timestamp: new Date().toISOString(),
    severity,
    message,
    context: context || {},
    runbook,
  };

  await currentAlertPort.sendAlert(payload);
  return payload;
}
