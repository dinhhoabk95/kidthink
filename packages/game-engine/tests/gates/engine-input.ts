import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { GameAction, GameSession } from "#src/game-session";

export interface InputGateViolation {
  readonly templateCode?: string;
  readonly file?: string;
  readonly rule: "BR-EIC-01" | "BR-EIC-02" | "BR-EIC-04" | "BR-EIC-05";
  readonly message: string;
}

export interface InputGateResult {
  readonly readyCodes: readonly string[];
  readonly violations: readonly InputGateViolation[];
}

const RESOLVE_SLOTS_CALL_REGEX = /this\.resolveSlots\s*\(/;
const GET_VIEW_REGEX = /\bgetView\s*\(/;
const EXPORT_ON_HANDLER_REGEX =
  /export\s+(?:interface|type)\s+.*\{[^}]*\bon[A-Z]\w*\s*[:(]/s;
const SETUP_ENTITIES_METHOD_REGEX =
  /setupEntities\s*\([^)]*\)\s*:\s*void\s*\{([\s\S]*?)\n\s*\}/;

function validateReadyTemplate(
  code: string,
  templatesDir: string
): InputGateViolation[] {
  const violations: InputGateViolation[] = [];
  const sessionFile = join(templatesDir, code, "session.ts");

  if (!existsSync(sessionFile)) {
    violations.push({
      templateCode: code,
      file: sessionFile,
      rule: "BR-EIC-01",
      message: `Template ${code} in ready list but session.ts does not exist`,
    });
    return violations;
  }

  const content = readFileSync(sessionFile, "utf8");

  // BR-EIC-01: Must implement getView()
  if (!GET_VIEW_REGEX.test(content)) {
    violations.push({
      templateCode: code,
      file: sessionFile,
      rule: "BR-EIC-01",
      message: `Template ${code} is in engine-input-ready.json but missing getView() implementation`,
    });
  }

  // BR-EIC-02: Must not export duck-typed on* handlers in public interfaces
  if (EXPORT_ON_HANDLER_REGEX.test(content)) {
    violations.push({
      templateCode: code,
      file: sessionFile,
      rule: "BR-EIC-02",
      message: `Template ${code} exports duck-typed on* handler in public interface (BR-EIC-02)`,
    });
  }

  return violations;
}

function checkTemplateResolveSlots(
  entry: string,
  templatesDir: string
): InputGateViolation | null {
  if (!entry.startsWith("GT-")) {
    return null;
  }
  const sessionFile = join(templatesDir, entry, "session.ts");
  if (!existsSync(sessionFile)) {
    return null;
  }
  const content = readFileSync(sessionFile, "utf8");
  const match = content.match(SETUP_ENTITIES_METHOD_REGEX);
  if (match?.[1] && RESOLVE_SLOTS_CALL_REGEX.test(match[1])) {
    return {
      templateCode: entry,
      file: sessionFile,
      rule: "BR-EIC-05",
      message: `Template ${entry} calls this.resolveSlots() inside setupEntities() (BR-EIC-05)`,
    };
  }
  return null;
}

export function scanEngineInputGate(
  templatesDir: string,
  readyConfigPath: string
): InputGateResult {
  const violations: InputGateViolation[] = [];

  if (!existsSync(readyConfigPath)) {
    return { readyCodes: [], violations };
  }

  const rawReady = readFileSync(readyConfigPath, "utf8");
  const readyCodes = JSON.parse(rawReady) as string[];

  // 1. Check BR-EIC-01 & BR-EIC-02 on templates in ready list
  for (const code of readyCodes) {
    violations.push(...validateReadyTemplate(code, templatesDir));
  }

  // 2. Check BR-EIC-05: Cấm this.resolveSlots( trong setupEntities trên TOÀN BỘ template
  if (existsSync(templatesDir)) {
    const entries = readdirSync(templatesDir);
    for (const entry of entries) {
      const v = checkTemplateResolveSlots(entry, templatesDir);
      if (v) {
        violations.push(v);
      }
    }
  }

  return {
    readyCodes,
    violations,
  };
}

/**
 * BR-EIC-04: Verify validateAction purity.
 * It must not mutate session state and must not emit telemetry events.
 */
export function checkValidateActionPurity(
  session: GameSession,
  action: GameAction
): { isPure: boolean; reason?: string } {
  const telemetryBefore = session.getTelemetry();
  const eventsCountBefore = telemetryBefore.events.length;
  const winBefore = session.checkWinCondition();

  session.validateAction(action);

  const telemetryAfter = session.getTelemetry();
  const eventsCountAfter = telemetryAfter.events.length;
  const winAfter = session.checkWinCondition();

  if (eventsCountAfter !== eventsCountBefore) {
    return {
      isPure: false,
      reason: `validateAction emitted ${eventsCountAfter - eventsCountBefore} telemetry event(s) (expected 0)`,
    };
  }

  if (winAfter !== winBefore) {
    return {
      isPure: false,
      reason: `validateAction mutated win condition state from ${winBefore} to ${winAfter}`,
    };
  }

  return { isPure: true };
}
