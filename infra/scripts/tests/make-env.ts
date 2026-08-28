#!/usr/bin/env node
/**
 * Emits a contract-satisfying env file for one app, used by the release
 * harness. Generated from the registry rather than hand-written so the fixtures
 * cannot drift away from the contract they are meant to satisfy.
 */
// Subpath, not the package barrel: this file runs under plain `node`, and the
// barrel re-exports with .js specifiers that only a bundler resolves.
import {
  type AppType,
  ENV_REGISTRY,
  type EnvVarDef,
} from "@mindkid/config/env-contract";

const SAMPLE_SECRET = "harness-secret-value-0123456789abcdef";

/**
 * The value has to satisfy every rule the registry states about the variable,
 * not just its kind. BR-ENV-13 constrains the protocol of a URL per variable,
 * so a fixture that always emits https:// makes DATABASE_URL fail validation
 * and every release in this harness die at the environment gate — a fixture
 * bug that reads exactly like a contract violation.
 */
function sampleValue(def: EnvVarDef): string {
  switch (def.kind) {
    case "url": {
      const protocol = def.urlProtocols?.[0] ?? "https:";
      return `${protocol}//harness.example/${def.name.toLowerCase()}`;
    }
    case "secret":
      return SAMPLE_SECRET;
    case "email":
      return "ops@harness.example";
    case "port":
      return "3000";
    case "enum":
      return def.enumValues?.[0] ?? "production";
    default:
      return `harness-${def.name.toLowerCase()}`;
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
  lines.push(`${def.name}=${sampleValue(def)}`);
}

process.stdout.write(`${lines.join("\n")}\n`);
