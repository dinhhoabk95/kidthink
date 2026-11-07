export interface EngineSpecViolation {
  readonly templateCode?: string;
  readonly file?: string;
  readonly rule: string;
  readonly message: string;
}

export interface ExpectedEngineTemplate {
  mechanic?: string;
  layouts?: readonly string[];
  age_min?: number;
  age_max?: number;
  banned_age_bands?: readonly string[];
  requires_tap_fallback?: boolean;
  limits?: Record<string, [number, number]>;
  asset_kinds?: readonly string[];
  engine_session?: string;
}

export type ExpectedTemplateOrLimits =
  | ExpectedEngineTemplate
  | Record<string, [number, number]>;

const S15_MECHANIC_REGEX = /\|\s*`mechanic`\s*\|\s*`?([^`|\s]+)`?\s*\|/;
const S15_LAYOUTS_ROW_REGEX = /\|\s*`layouts`\s*\|\s*([^|]+)\|/;
const S15_AGE_REGEX =
  /\|\s*`age_min`\s*·\s*`age_max`\s*\|\s*`?(\d+)`?\s*·\s*`?(\d+)`?\s*\|/;
const S15_BANNED_ROW_REGEX = /\|\s*`banned_age_bands`\s*\|\s*([^|]+)\|/;
const S15_FALLBACK_REGEX =
  /\|\s*`requires_tap_fallback`\s*\|\s*`?(true|false)`?\s*\|/;
const S15_ASSETS_ROW_REGEX = /\|\s*`asset_kinds`\s*\|\s*([^|]+)\|/;

/**
 * Bốn giá trị hợp lệ của `GameTemplate.asset_kinds`. Trước đây bộ lọc ở đây chỉ
 * biết ba — spec khai `text` thì bị bỏ đi lúc đọc, nên cổng báo lệch với mọi
 * engine dùng asset chữ, dù spec và registry ghi giống hệt nhau.
 */
const ASSET_KINDS: ReadonlySet<string> = new Set([
  "emoji",
  "image",
  "audio",
  "text",
]);
const S15_SESSION_REGEX = /\|\s*`engine_session`\s*\|\s*`?([^`|\s]+)`?\s*\|/;
const S15_BACKTICK_TOKEN_REGEX = /`([^`]+)`/g;
const S15_AGE_BAND_TOKEN_REGEX = /^\d-\d$/;
const S15_QUOTED_WORD_REGEX = /[`"]([a-z0-9_-]+)[`"]/g;

export function checkLimits(
  templateCode: string,
  specPath: string,
  body: string,
  expectedLimits?: Record<string, [number, number]>
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];
  if (!expectedLimits) {
    return violations;
  }

  for (const [limitKey, expectedVal] of Object.entries(expectedLimits)) {
    const limitRegex = new RegExp(`\`${limitKey}\`\\s*\\[(\\d+),\\s*(\\d+)\\]`);
    const match = limitRegex.exec(body);
    if (match?.[1] && match[2]) {
      const actualMin = Number(match[1]);
      const actualMax = Number(match[2]);
      if (actualMin !== expectedVal[0] || actualMax !== expectedVal[1]) {
        violations.push({
          templateCode,
          file: specPath,
          rule: "BR-ESS-02",
          message: `limits.${limitKey} spec ghi [${actualMin}, ${actualMax}], registry [${expectedVal[0]}, ${expectedVal[1]}]   LỆCH`,
        });
      }
    }
  }

  return violations;
}

export function checkMechanicAndSession(
  templateCode: string,
  specPath: string,
  s15Content: string,
  tmpl: ExpectedEngineTemplate
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];

  if (tmpl.mechanic !== undefined) {
    const mechMatch = S15_MECHANIC_REGEX.exec(s15Content);
    const actualMechanic = mechMatch?.[1];
    if (actualMechanic !== tmpl.mechanic) {
      violations.push({
        templateCode,
        file: specPath,
        rule: "BR-ESS-02",
        message: `mechanic spec ghi "${actualMechanic ?? ""}", registry "${tmpl.mechanic}"   LỆCH`,
      });
    }
  }

  if (tmpl.engine_session !== undefined) {
    const sessMatch = S15_SESSION_REGEX.exec(s15Content);
    const actualSession = sessMatch?.[1];
    if (actualSession !== tmpl.engine_session) {
      violations.push({
        templateCode,
        file: specPath,
        rule: "BR-ESS-02",
        message: `engine_session spec ghi "${actualSession ?? ""}", registry "${tmpl.engine_session}"   LỆCH`,
      });
    }
  }

  return violations;
}

export function checkLayoutsAndAssets(
  templateCode: string,
  specPath: string,
  s15Content: string,
  tmpl: ExpectedEngineTemplate
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];

  if (tmpl.layouts !== undefined) {
    const layoutRow = S15_LAYOUTS_ROW_REGEX.exec(s15Content)?.[1] || "";
    const actualLayouts = Array.from(
      layoutRow.matchAll(S15_BACKTICK_TOKEN_REGEX)
    ).map((m) => m[1]);
    const sortedActual = [...actualLayouts].sort();
    const sortedExpected = [...tmpl.layouts].sort();
    if (JSON.stringify(sortedActual) !== JSON.stringify(sortedExpected)) {
      violations.push({
        templateCode,
        file: specPath,
        rule: "BR-ESS-02",
        message: `layouts spec ghi [${sortedActual.join(", ")}], registry [${sortedExpected.join(", ")}]   LỆCH`,
      });
    }
  }

  if (tmpl.asset_kinds !== undefined) {
    const assetRow = S15_ASSETS_ROW_REGEX.exec(s15Content)?.[1] || "";
    const actualAssets = Array.from(assetRow.matchAll(S15_QUOTED_WORD_REGEX))
      .map((m) => m[1])
      .filter((a): a is string => a !== undefined && ASSET_KINDS.has(a));
    const sortedActual = Array.from(new Set(actualAssets)).sort();
    const sortedExpected = [...tmpl.asset_kinds].sort();
    if (JSON.stringify(sortedActual) !== JSON.stringify(sortedExpected)) {
      violations.push({
        templateCode,
        file: specPath,
        rule: "BR-ESS-02",
        message: `asset_kinds spec ghi [${sortedActual.join(", ")}], registry [${sortedExpected.join(", ")}]   LỆCH`,
      });
    }
  }

  return violations;
}

export function checkAgeBands(
  templateCode: string,
  specPath: string,
  s15Content: string,
  tmpl: ExpectedEngineTemplate
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];

  if (tmpl.age_min !== undefined && tmpl.age_max !== undefined) {
    const ageMatch = S15_AGE_REGEX.exec(s15Content);
    const actualMin = ageMatch ? Number(ageMatch[1]) : undefined;
    const actualMax = ageMatch ? Number(ageMatch[2]) : undefined;
    if (actualMin !== tmpl.age_min || actualMax !== tmpl.age_max) {
      violations.push({
        templateCode,
        file: specPath,
        rule: "BR-ESS-02",
        message: `age_min · age_max spec ghi ${actualMin} · ${actualMax}, registry ${tmpl.age_min} · ${tmpl.age_max}   LỆCH`,
      });
    }
  }

  if (tmpl.banned_age_bands !== undefined) {
    const bannedRow = S15_BANNED_ROW_REGEX.exec(s15Content)?.[1] || "";
    const actualBanned = Array.from(
      bannedRow.matchAll(S15_BACKTICK_TOKEN_REGEX)
    )
      .map((m) => m[1])
      .filter(
        (b): b is string =>
          typeof b === "string" && S15_AGE_BAND_TOKEN_REGEX.test(b)
      );
    const sortedActual = [...actualBanned].sort();
    const sortedExpected = [...tmpl.banned_age_bands].sort();
    if (JSON.stringify(sortedActual) !== JSON.stringify(sortedExpected)) {
      violations.push({
        templateCode,
        file: specPath,
        rule: "BR-ESS-02",
        message: `banned_age_bands spec ghi [${sortedActual.join(", ")}], registry [${sortedExpected.join(", ")}]   LỆCH`,
      });
    }
  }

  return violations;
}

export function checkTapFallback(
  templateCode: string,
  specPath: string,
  s15Content: string,
  tmpl: ExpectedEngineTemplate
): EngineSpecViolation[] {
  const violations: EngineSpecViolation[] = [];

  if (tmpl.requires_tap_fallback !== undefined) {
    const fallbackMatch = S15_FALLBACK_REGEX.exec(s15Content);
    const actualFallback = fallbackMatch
      ? fallbackMatch[1] === "true"
      : undefined;
    if (actualFallback !== tmpl.requires_tap_fallback) {
      violations.push({
        templateCode,
        file: specPath,
        rule: "BR-ESS-02",
        message: `requires_tap_fallback spec ghi ${actualFallback}, registry ${tmpl.requires_tap_fallback}   LỆCH`,
      });
    }
  }

  return violations;
}

export function checkSection15RegistryFields(
  templateCode: string,
  specPath: string,
  body: string,
  expected?: ExpectedTemplateOrLimits
): EngineSpecViolation[] {
  if (!expected) {
    return [];
  }

  const isLimitsOnly =
    "item_count" in expected &&
    !("mechanic" in expected) &&
    !("layouts" in expected);

  const expectedLimits = isLimitsOnly
    ? expected
    : (expected as ExpectedEngineTemplate).limits;

  const violations: EngineSpecViolation[] = [];
  violations.push(...checkLimits(templateCode, specPath, body, expectedLimits));

  if (isLimitsOnly) {
    return violations;
  }

  const tmpl = expected as ExpectedEngineTemplate;
  const s15Index = body.indexOf("## 15.");
  if (s15Index === -1) {
    return violations;
  }
  const s16Index = body.indexOf("## 16.", s15Index);
  const s15Content =
    s16Index === -1 ? body.slice(s15Index) : body.slice(s15Index, s16Index);

  violations.push(
    ...checkMechanicAndSession(templateCode, specPath, s15Content, tmpl)
  );
  violations.push(
    ...checkLayoutsAndAssets(templateCode, specPath, s15Content, tmpl)
  );
  violations.push(...checkAgeBands(templateCode, specPath, s15Content, tmpl));
  violations.push(
    ...checkTapFallback(templateCode, specPath, s15Content, tmpl)
  );

  return violations;
}
