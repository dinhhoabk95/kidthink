#!/usr/bin/env node
/**
 * Emits a contract-satisfying env file for one app, used by the release
 * harness. Generated from the registry rather than hand-written so the fixtures
 * cannot drift away from the contract they are meant to satisfy.
 */
import { type AppType, ENV_REGISTRY } from "@mindkid/config";

const SAMPLE_SECRET = "harness-secret-value-0123456789abcdef";

function sampleValue(kind: string, name: string): string {
  switch (kind) {
    case "url":
      return `https://harness.example/${name.toLowerCase()}`;
    case "secret":
      return SAMPLE_SECRET;
    case "email":
      return "ops@harness.example";
    case "port":
      return "3000";
    case "enum":
      return "production";
    default:
      return `harness-${name.toLowerCase()}`;
  }
}

const app = process.argv[2] as AppType;
const omit = new Set(process.argv.slice(3));

const lines: string[] = [`# generated for ${app}`];
for (const def of ENV_REGISTRY) {
  if (!def.apps.includes(app)) {
    continue;
  }
  if (def.required === "optional" || omit.has(def.name)) {
    continue;
  }
  lines.push(`${def.name}=${sampleValue(def.kind, def.name)}`);
}

process.stdout.write(`${lines.join("\n")}\n`);
