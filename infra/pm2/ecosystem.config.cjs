"use strict";

/**
 * PM2 Ecosystem Configuration for MindKid Production Services
 * Spec: docs/specs/01-platform/process-supervision.md
 * Rules: BR-SUP-01..10
 */

module.exports = {
  apps: [
    {
      name: "mindkid-web",
      script: "./apps/web/.output/server/index.mjs",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "700M",
      max_restarts: 5,
      min_uptime: "30s",
      restart_delay: 5000,
      kill_timeout: 10_000,
      env_file: "/etc/mindkid/env/web.env",
      out_file: "/var/log/mindkid/web/out.log",
      error_file: "/var/log/mindkid/web/error.log",
      merge_logs: true,
    },
    {
      name: "mindkid-admin",
      script: "./apps/admin/.output/server/index.mjs",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "700M",
      max_restarts: 5,
      min_uptime: "30s",
      restart_delay: 5000,
      kill_timeout: 10_000,
      env_file: "/etc/mindkid/env/admin.env",
      out_file: "/var/log/mindkid/admin/out.log",
      error_file: "/var/log/mindkid/admin/error.log",
    },
    {
      name: "mindkid-worker",
      script: "./apps/worker/dist/index.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "700M",
      max_restarts: 5,
      min_uptime: "30s",
      restart_delay: 5000,
      kill_timeout: 10_000,
      env_file: "/etc/mindkid/env/worker.env",
      out_file: "/var/log/mindkid/worker/out.log",
      error_file: "/var/log/mindkid/worker/error.log",
    },
  ],
};
