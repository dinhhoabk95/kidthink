export type AlertSeverity = "info" | "warning" | "error" | "critical";

export interface AlertContext {
  [key: string]: unknown;
}

/**
 * Port for monitoring and alerting (P1.16).
 * P0 implementation just logs structure output.
 */
export function alert(
  severity: AlertSeverity,
  message: string,
  context?: AlertContext
): void {
  // context should not contain sensitive data like connection strings or PII,
  // but sanitization is a shared responsibility.

  const payload = {
    timestamp: new Date().toISOString(),
    severity,
    message,
    context: context || {},
  };

  if (severity === "error" || severity === "critical") {
    console.error(JSON.stringify(payload));
  } else if (severity === "warning") {
    console.warn(JSON.stringify(payload));
  } else {
    console.info(JSON.stringify(payload));
  }
}
