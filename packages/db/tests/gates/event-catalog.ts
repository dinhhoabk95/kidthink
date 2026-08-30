import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Spec sở hữu: docs/specs/00-foundation/event-catalog.md
 * Rule sở hữu: BR-EVT-01, BR-EVT-07
 *
 * Ba nguồn tên event phải khớp nhau:
 *   1. Catalog §7 của spec — nguồn sự thật cho người.
 *   2. `ALLOWED_EVENT_NAMES` trong play-session.ts — cái server thật sự nhận.
 *   3. Trường `events` của từng khuôn — cái engine thật sự phát.
 * Lệch bất kỳ cặp nào là event bị 422 ở production mà không cổng nào bắt.
 *
 * Catalog được phép rộng hơn `ALLOWED_EVENT_NAMES`: nó còn khai event sinh ở server
 * (webhook thanh toán, đồng bộ gói offline) không đi qua endpoint nạp event của phiên chơi.
 */

export interface EventCatalogViolation {
  readonly rule: string;
  readonly source: string;
  readonly eventName: string;
  readonly message: string;
}

const CATALOG_SECTION_START = "## 7. Data — catalog";
const CATALOG_SECTION_END = "### 7.5";
const CATALOG_ROW_REGEX = /^\|\s*`([a-z][a-z0-9_]*)`\s*\|/gm;
const ALLOWED_BLOCK_REGEX =
  /ALLOWED_EVENT_NAMES\s*=\s*new Set\(\[([\s\S]*?)\]\)/;
const PAYLOAD_FIELDS_BLOCK_REGEX =
  /EVENT_PAYLOAD_FIELDS[^=]*=\s*\{([\s\S]*?)\n\};/;
const PAYLOAD_SCHEMAS_BLOCK_REGEX =
  /EVENT_PAYLOAD_SCHEMAS[^=]*=\s*\{([\s\S]*?)\n\};/;
const QUOTED_NAME_REGEX = /"([a-z][a-z0-9_]*)"/g;
const KEY_REGEX = /^\s{2}([a-z][a-z0-9_]*):/gm;
const TEMPLATE_EVENTS_REGEX = /events:\s*\[([\s\S]*?)\]/;
const RECORD_EVENT_REGEX = /recordEvent\(\s*"([a-z][a-z0-9_]*)"/g;
const GT_CODE_REGEX = /^GT-\d{3}$/;

function matchAll(source: string, regex: RegExp): string[] {
  const out: string[] = [];
  regex.lastIndex = 0;
  let m = regex.exec(source);
  while (m !== null) {
    if (m[1] !== undefined) {
      out.push(m[1]);
    }
    m = regex.exec(source);
  }
  return out;
}

/** Tên event khai trong §7.1–§7.4 của spec catalog. */
export function parseCatalogEventNames(
  content: string,
  label = "catalog"
): Set<string> {
  const start = content.indexOf(CATALOG_SECTION_START);
  if (start === -1) {
    throw new Error(
      `Không tìm thấy mục "${CATALOG_SECTION_START}" trong ${label}`
    );
  }
  const end = content.indexOf(CATALOG_SECTION_END, start);
  const section = content.slice(start, end === -1 ? undefined : end);
  return new Set(matchAll(section, CATALOG_ROW_REGEX));
}

export function collectCatalogEventNames(specFile: string): Set<string> {
  return parseCatalogEventNames(readFileSync(specFile, "utf8"), specFile);
}

/** Tên event server chấp nhận (BR-EVT-01). */
export function parseAllowedEventNames(
  content: string,
  label = "play-session"
): Set<string> {
  const block = ALLOWED_BLOCK_REGEX.exec(content);
  if (!block?.[1]) {
    throw new Error(`Không tìm thấy ALLOWED_EVENT_NAMES trong ${label}`);
  }
  return new Set(matchAll(block[1], QUOTED_NAME_REGEX));
}

export function collectAllowedEventNames(playSessionFile: string): Set<string> {
  return parseAllowedEventNames(
    readFileSync(playSessionFile, "utf8"),
    playSessionFile
  );
}

function collectKeys(content: string, blockRegex: RegExp): Set<string> {
  const block = blockRegex.exec(content);
  if (!block?.[1]) {
    return new Set();
  }
  return new Set(matchAll(block[1], KEY_REGEX));
}

export interface TemplateEventUsage {
  readonly templateCode: string;
  readonly declared: readonly string[];
  readonly recorded: readonly string[];
}

/** Event từng khuôn khai trong `template.ts` và phát trong `session.ts`. */
export function collectTemplateEvents(
  templatesDir: string
): TemplateEventUsage[] {
  const usages: TemplateEventUsage[] = [];
  for (const entry of readdirSync(templatesDir).sort()) {
    const dirPath = join(templatesDir, entry);
    if (!(statSync(dirPath).isDirectory() && GT_CODE_REGEX.test(entry))) {
      continue;
    }
    const templateSource = readFileSync(join(dirPath, "template.ts"), "utf8");
    const declaredBlock = TEMPLATE_EVENTS_REGEX.exec(templateSource);
    const declared = declaredBlock?.[1]
      ? matchAll(declaredBlock[1], QUOTED_NAME_REGEX)
      : [];

    let recorded: string[] = [];
    const sessionFile = join(dirPath, "session.ts");
    try {
      recorded = matchAll(
        readFileSync(sessionFile, "utf8"),
        RECORD_EVENT_REGEX
      );
    } catch {
      recorded = [];
    }
    usages.push({ templateCode: entry, declared, recorded });
  }
  return usages;
}

export interface EventCatalogPaths {
  readonly specFile: string;
  readonly playSessionFile: string;
  readonly templatesDir: string;
}

export interface EventCatalogSources {
  readonly catalogMarkdown: string;
  readonly playSessionSource: string;
  readonly templates: readonly TemplateEventUsage[];
}

function checkAllowedName(
  name: string,
  catalog: Set<string>,
  payloadFields: Set<string>,
  payloadSchemas: Set<string>
): EventCatalogViolation[] {
  const violations: EventCatalogViolation[] = [];
  if (!catalog.has(name)) {
    violations.push({
      rule: "BR-EVT-07",
      source: "ALLOWED_EVENT_NAMES",
      eventName: name,
      message: `Server nhận '${name}' nhưng catalog §7 không khai nó.`,
    });
  }
  if (!payloadFields.has(name)) {
    violations.push({
      rule: "BR-EVT-02",
      source: "EVENT_PAYLOAD_FIELDS",
      eventName: name,
      message: `'${name}' thiếu danh sách field cho phép — payload sẽ không bị strip.`,
    });
  }
  if (!payloadSchemas.has(name)) {
    violations.push({
      rule: "BR-EVT-01",
      source: "EVENT_PAYLOAD_SCHEMAS",
      eventName: name,
      message: `'${name}' thiếu schema payload — payload sẽ không được parse.`,
    });
  }
  return violations;
}

function checkTemplateUsage(
  usage: TemplateEventUsage,
  catalog: Set<string>,
  allowed: Set<string>
): EventCatalogViolation[] {
  const violations: EventCatalogViolation[] = [];
  for (const name of usage.declared) {
    if (!catalog.has(name)) {
      violations.push({
        rule: "BR-EVT-07",
        source: usage.templateCode,
        eventName: name,
        message: `Khuôn ${usage.templateCode} khai event '${name}' chưa có trong catalog §7.`,
      });
    }
    if (!allowed.has(name)) {
      violations.push({
        rule: "BR-EVT-01",
        source: usage.templateCode,
        eventName: name,
        message: `Khuôn ${usage.templateCode} phát '${name}' nhưng server trả 422 — tên không nằm trong ALLOWED_EVENT_NAMES.`,
      });
    }
  }
  for (const name of usage.recorded) {
    if (!usage.declared.includes(name)) {
      violations.push({
        rule: "BR-EVT-07",
        source: usage.templateCode,
        eventName: name,
        message: `Session của ${usage.templateCode} phát '${name}' nhưng trường events của khuôn không khai nó.`,
      });
    }
  }
  return violations;
}

export function scanEventCatalogSources(
  sources: EventCatalogSources
): EventCatalogViolation[] {
  const catalog = parseCatalogEventNames(sources.catalogMarkdown);
  const allowed = parseAllowedEventNames(sources.playSessionSource);
  const payloadFields = collectKeys(
    sources.playSessionSource,
    PAYLOAD_FIELDS_BLOCK_REGEX
  );
  const payloadSchemas = collectKeys(
    sources.playSessionSource,
    PAYLOAD_SCHEMAS_BLOCK_REGEX
  );

  return [
    ...[...allowed]
      .sort()
      .flatMap((name) =>
        checkAllowedName(name, catalog, payloadFields, payloadSchemas)
      ),
    ...sources.templates.flatMap((usage) =>
      checkTemplateUsage(usage, catalog, allowed)
    ),
  ];
}

export function scanEventCatalogGates(
  paths: EventCatalogPaths
): EventCatalogViolation[] {
  return scanEventCatalogSources({
    catalogMarkdown: readFileSync(paths.specFile, "utf8"),
    playSessionSource: readFileSync(paths.playSessionFile, "utf8"),
    templates: collectTemplateEvents(paths.templatesDir),
  });
}
