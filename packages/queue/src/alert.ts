export type AlertSeverity = "info" | "warning" | "error" | "critical";

export interface AlertContext {
  [key: string]: unknown;
}

export interface AlertPayload {
  timestamp: string;
  severity: AlertSeverity;
  message: string;
  context: AlertContext;
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
      opsEmail || process.env.OPERATIONS_ALERT_EMAIL || "ops@kidthink.vn";
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

  isLogOnly(): boolean {
    return false;
  }
}

let currentAlertPort: AlertPort = new EmailAlertAdapter();

export function setAlertPort(port: AlertPort): void {
  currentAlertPort = port;
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
  context?: AlertContext
): Promise<AlertPayload> {
  const payload: AlertPayload = {
    timestamp: new Date().toISOString(),
    severity,
    message,
    context: context || {},
  };

  await currentAlertPort.sendAlert(payload);
  return payload;
}
