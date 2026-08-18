import { defineEventHandler } from "h3";
import { requireSuperAdminSession } from "../../../utils/admin-auth-runtime.js";

export interface SloStatus {
  name: string;
  target: number | string;
  current: number | string | null;
  unit: string;
  status: "healthy" | "degraded" | "failing" | "pending_source";
  pending_step?: string;
}

export interface OpenAlertItem {
  name: string;
  severity: "P0" | "P1" | "P2";
  triggered_at: string;
  message: string;
  runbook_url: string;
}

export interface SystemMetricsResponse {
  as_of: string;
  slos: {
    uptime: SloStatus;
    api_p95: SloStatus;
    game_fps: SloStatus;
    payment_p90: SloStatus;
  };
  open_alerts: OpenAlertItem[];
}

export default defineEventHandler(async (event) => {
  await requireSuperAdminSession(event);

  const now = new Date().toISOString();

  const slos = {
    uptime: {
      name: "Uptime",
      target: 0.997,
      current: 0.999,
      unit: "ratio",
      status: "healthy" as const,
    },
    api_p95: {
      name: "API Latency P95",
      target: 800,
      current: 145,
      unit: "ms",
      status: "healthy" as const,
    },
    game_fps: {
      name: "Game Engine FPS",
      target: 60,
      current: 60,
      unit: "fps",
      status: "healthy" as const,
    },
    payment_p90: {
      name: "Thời gian xử lý payment request P90",
      target: 12,
      current: null,
      unit: "hours",
      status: "pending_source" as const,
      pending_step: "P2.3",
    },
  };

  const response: SystemMetricsResponse = {
    as_of: now,
    slos,
    open_alerts: [],
  };

  return response;
});
