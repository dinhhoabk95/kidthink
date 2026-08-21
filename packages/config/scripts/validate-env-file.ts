#!/usr/bin/env node
/**
 * Gate: environment file validation for the release workflow.
 * Rules: BR-DEP-04 (runs before build), BR-ENV-06 (never reads process.env),
 *        BR-ENV-08 (prints variable names, never values).
 *
 * Dependency-free on purpose: this runs on the server BEFORE `pnpm install`,
 * so it may only use Node built-ins and the registry source file.
 */
import { readFileSync } from "node:fs";
import { type AppType, validateEnvFile } from "../src/env-contract.ts";
import { parseEnvFile } from "../src/env-file.ts";

const VALID_APPS: readonly AppType[] = ["web", "admin", "worker"];

interface CliArgs {
  app: AppType;
  file: string;
  isProduction: boolean;
}

function readFlag(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index === -1 ? undefined : argv[index + 1];
}

function isAppType(val: string | undefined): val is AppType {
  return val === "web" || val === "admin" || val === "worker";
}

function parseArgs(argv: string[]): CliArgs {
  const app = readFlag(argv, "--app");
  const file = readFlag(argv, "--file");

  if (!isAppType(app)) {
    throw new Error(`--app must be one of: ${VALID_APPS.join(", ")}`);
  }
  if (!file) {
    throw new Error("--file <path> is required");
  }

  return {
    app,
    file,
    isProduction: argv.includes("--production"),
  };
}

function main(): number {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `❌ [validate-env] ${error instanceof Error ? error.message : String(error)}`
    );
    return 2;
  }

  let content: string;
  try {
    content = readFileSync(args.file, "utf8");
  } catch {
    console.error(`❌ [validate-env] Cannot read env file: ${args.file}`);
    return 1;
  }

  const parsed = parseEnvFile(content);
  const result = validateEnvFile(args.app, parsed, args.isProduction);

  for (const warning of result.warnings) {
    console.warn(`⚠️  [validate-env] ${warning.varName}: ${warning.issue}`);
  }

  if (result.valid) {
    console.log(
      `✅ [validate-env] ${args.app}: ${parsed.size} variables declared, contract satisfied.`
    );
    return 0;
  }

  console.error(
    `❌ [validate-env] ${args.app}: ${result.errors.length} contract violations in ${args.file}`
  );
  for (const error of result.errors) {
    console.error(`   ${error.varName}: ${error.issue}`);
  }
  return 1;
}

process.exit(main());
