import { readFileSync } from "node:fs";

export type AlertSeverityType = "critical" | "warning" | "info";

export interface AlertRuleDef {
  name: string;
  title_vi?: string;
  severity: AlertSeverityType;
  threshold: string;
  channels: string[];
  runbook: string;
  pending_source?: string;
  enabled?: boolean;
}

export interface AlertGroupDef {
  name: "P0" | "P1" | "P2";
  description?: string;
  rules: AlertRuleDef[];
}

export interface AlertsConfig {
  version: string;
  groups: AlertGroupDef[];
}

export interface AlertsValidationResult {
  valid: boolean;
  errors: string[];
  stats: {
    total: number;
    p0: number;
    p1: number;
    p2: number;
    p0Ready: number;
  };
  summaryMessage: string;
}

interface ParserState {
  version: string;
  groups: AlertGroupDef[];
  currentGroup: AlertGroupDef | null;
  currentRule: Partial<AlertRuleDef> | null;
  inChannelsList: boolean;
}

function stripQuotes(val: string): string {
  return val.trim().replace(/['"]/g, "");
}

function flushRuleAndGroup(state: ParserState): void {
  if (state.currentRule && state.currentGroup) {
    state.currentGroup.rules.push(state.currentRule as AlertRuleDef);
    state.currentRule = null;
  }
}

function handleGroupHeader(line: string, state: ParserState): void {
  flushRuleAndGroup(state);
  if (state.currentGroup) {
    state.groups.push(state.currentGroup);
  }
  const groupName = stripQuotes(line.replace("- name:", "")) as
    | "P0"
    | "P1"
    | "P2";
  state.currentGroup = { name: groupName, rules: [] };
  state.inChannelsList = false;
}

function handleRuleHeader(line: string, state: ParserState): void {
  if (state.currentRule && state.currentGroup) {
    state.currentGroup.rules.push(state.currentRule as AlertRuleDef);
  }
  state.currentRule = {
    name: stripQuotes(line.replace("- name:", "")),
    channels: [],
    enabled: true,
  };
  state.inChannelsList = false;
}

function handleRuleField(line: string, state: ParserState): void {
  const rule = state.currentRule;
  if (!rule) {
    return;
  }

  if (line.startsWith("title_vi:")) {
    rule.title_vi = stripQuotes(line.replace("title_vi:", ""));
  } else if (line.startsWith("severity:")) {
    rule.severity = stripQuotes(
      line.replace("severity:", "")
    ) as AlertSeverityType;
  } else if (line.startsWith("threshold:")) {
    rule.threshold = stripQuotes(line.replace("threshold:", ""));
  } else if (line.startsWith("runbook:")) {
    rule.runbook = stripQuotes(line.replace("runbook:", ""));
  } else if (line.startsWith("pending_source:")) {
    rule.pending_source = stripQuotes(line.replace("pending_source:", ""));
  } else if (line.startsWith("enabled:")) {
    rule.enabled = stripQuotes(line.replace("enabled:", "")) === "true";
  } else if (line.startsWith("channels:")) {
    state.inChannelsList = true;
  } else if (state.inChannelsList && line.startsWith("-")) {
    const channel = stripQuotes(line.replace("-", ""));
    if (channel) {
      rule.channels?.push(channel);
    }
  } else {
    state.inChannelsList = false;
  }
}

function parseYamlLine(line: string, state: ParserState): void {
  if (line.startsWith("version:")) {
    state.version = stripQuotes(line.replace("version:", ""));
  } else if (
    line.startsWith("- name: P0") ||
    line.startsWith("- name: P1") ||
    line.startsWith("- name: P2")
  ) {
    handleGroupHeader(line, state);
  } else if (
    line.startsWith("description:") &&
    state.currentGroup &&
    !state.currentRule
  ) {
    state.currentGroup.description = stripQuotes(
      line.replace("description:", "")
    );
  } else if (line.startsWith("- name:") && state.currentGroup) {
    handleRuleHeader(line, state);
  } else if (state.currentRule) {
    handleRuleField(line, state);
  }
}

/**
 * Lightweight, robust parser for infra/monitoring/alerts.yml without third-party deps.
 */
export function parseAlertsYaml(yamlContent: string): AlertsConfig {
  const lines = yamlContent.split("\n");
  const state: ParserState = {
    version: "1.0",
    groups: [],
    currentGroup: null,
    currentRule: null,
    inChannelsList: false,
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    parseYamlLine(line, state);
  }

  flushRuleAndGroup(state);
  if (state.currentGroup) {
    state.groups.push(state.currentGroup);
  }

  return { version: state.version, groups: state.groups };
}

interface ValidationStats {
  total: number;
  p0: number;
  p1: number;
  p2: number;
  p0Ready: number;
}

function validateRuleInGroup(
  rule: AlertRuleDef,
  groupName: string,
  errors: string[],
  stats: ValidationStats
): void {
  stats.total++;

  if (groupName === "P0") {
    stats.p0++;
    if (rule.pending_source) {
      errors.push(
        `BR-MON-07 / D-IR: P0 rule "${rule.name}" cannot have pending_source "${rule.pending_source}". P0 alerts must be active for go-live.`
      );
    } else {
      stats.p0Ready++;
    }
  } else if (groupName === "P1") {
    stats.p1++;
  } else if (groupName === "P2") {
    stats.p2++;
  }

  if (!rule.runbook?.startsWith("http")) {
    errors.push(
      `BR-MON-02: Rule "${rule.name}" in group ${groupName} is missing a valid runbook link (got: "${rule.runbook || ""}").`
    );
  }

  if (rule.enabled === false) {
    errors.push(
      `BR-MON-03: Rule "${rule.name}" is disabled. Disabling alerts is strictly forbidden; adjust thresholds instead.`
    );
  }
}

/**
 * Validates alerts configuration according to spec invariants:
 * - BR-MON-02: Every rule must have a valid runbook link
 * - BR-MON-03: No rule in "disabled" state (tuning threshold is required instead of disabling)
 * - BR-MON-07 & D-IR: Go-live gate: all P0 rules (>= 7) must be fully configured without pending_source
 */
export function validateAlertsConfig(
  config: AlertsConfig
): AlertsValidationResult {
  const errors: string[] = [];
  const stats: ValidationStats = {
    total: 0,
    p0: 0,
    p1: 0,
    p2: 0,
    p0Ready: 0,
  };

  for (const group of config.groups) {
    for (const rule of group.rules) {
      validateRuleInGroup(rule, group.name, errors, stats);
    }
  }

  if (stats.p0 < 7) {
    errors.push(
      `BR-MON-07: Minimum 7 P0 alert rules required per spec §7.2, found ${stats.p0}.`
    );
  }

  const valid = errors.length === 0;
  const summaryMessage = `${stats.p0Ready}/${stats.p0} quy tắc P0 có nguồn và runbook (tổng ${stats.total} quy tắc)`;

  return { valid, errors, stats, summaryMessage };
}

/**
 * Loads and validates alerts.yml from disk.
 */
export function loadAndValidateAlertsFile(
  filePath: string
): AlertsValidationResult {
  const content = readFileSync(filePath, "utf-8");
  const parsed = parseAlertsYaml(content);
  return validateAlertsConfig(parsed);
}
