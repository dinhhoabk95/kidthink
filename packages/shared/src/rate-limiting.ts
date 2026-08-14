export type FailMode = "closed" | "open";

export interface RouteClassConfig {
  className: string;
  ipLimit: number;
  accountLimit?: number;
  windowSeconds: number;
  failMode: FailMode;
}

export const RATE_LIMIT_CONFIGS: Record<string, RouteClassConfig> = {
  "auth:login": {
    className: "auth:login",
    ipLimit: 20,
    accountLimit: 5,
    windowSeconds: 900, // 15 min
    failMode: "closed",
  },
  "auth:register": {
    className: "auth:register",
    ipLimit: 10,
    windowSeconds: 3600, // 1 hour
    failMode: "closed",
  },
  "auth:forgot-password": {
    className: "auth:forgot-password",
    ipLimit: 10,
    accountLimit: 3,
    windowSeconds: 3600, // 1 hour
    failMode: "closed",
  },
  "auth:mfa": {
    className: "auth:mfa",
    ipLimit: 10,
    accountLimit: 5,
    windowSeconds: 900,
    failMode: "closed",
  },
  "auth:refresh": {
    className: "auth:refresh",
    ipLimit: 60,
    accountLimit: 60,
    windowSeconds: 900, // 15 min
    failMode: "closed",
  },
  "auth:social-login": {
    className: "auth:social-login",
    ipLimit: 20,
    windowSeconds: 900, // 15 min
    failMode: "closed",
  },
  "auth:oauth:start": {
    className: "auth:oauth:start",
    ipLimit: 30,
    windowSeconds: 900,
    failMode: "closed",
  },
  "auth:oauth:callback": {
    className: "auth:oauth:callback",
    ipLimit: 30,
    windowSeconds: 900,
    failMode: "closed",
  },
  "payment:create": {
    className: "payment:create",
    ipLimit: 20,
    accountLimit: 5,
    windowSeconds: 3600, // 1 hour
    failMode: "closed",
  },
  "payment:proof": {
    className: "payment:proof",
    ipLimit: 20,
    accountLimit: 10,
    windowSeconds: 3600, // 1 hour
    failMode: "closed",
  },
  "upload:image": {
    className: "upload:image",
    ipLimit: 60,
    accountLimit: 30,
    windowSeconds: 3600, // 1 hour
    failMode: "open",
  },
  "export:data": {
    className: "export:data",
    ipLimit: 5,
    accountLimit: 1,
    windowSeconds: 86_400, // 24 hours
    failMode: "open",
  },
  "play:events": {
    className: "play:events",
    ipLimit: 600,
    accountLimit: 300,
    windowSeconds: 600, // 10 min
    failMode: "open",
  },
  search: {
    className: "search",
    ipLimit: 300,
    accountLimit: 200,
    windowSeconds: 300, // 5 min
    failMode: "open",
  },
  "read:public": {
    className: "read:public",
    ipLimit: 600,
    windowSeconds: 300, // 5 min
    failMode: "open",
  },
  "managers:*": {
    className: "managers:*",
    ipLimit: 600,
    accountLimit: 600,
    windowSeconds: 300, // 5 min
    failMode: "open",
  },
};

export type RouteClassName = keyof typeof RATE_LIMIT_CONFIGS;

export function getRouteClassConfig(className: string): RouteClassConfig {
  const cfg = RATE_LIMIT_CONFIGS[className];
  if (!cfg) {
    throw new Error(
      `BR-RTL-01 error: Route class '${className}' is not defined in rate limiting registry. Routes cannot default to unlimited.`
    );
  }
  return cfg;
}

/**
 * Progressive lockout calculation for failed login attempts (BR-RTL-05).
 * 5 attempts -> 60s (1 min)
 * 10 attempts -> 300s (5 min)
 * 15+ attempts -> 1800s (30 min)
 * Reset window: 86400s (24 hours).
 */
export function calculateProgressiveLockoutSeconds(
  failedAttempts: number
): number {
  if (failedAttempts < 5) {
    return 0;
  }
  if (failedAttempts < 10) {
    return 60;
  }
  if (failedAttempts < 15) {
    return 300;
  }
  return 1800;
}
