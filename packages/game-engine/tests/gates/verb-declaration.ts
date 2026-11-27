import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Verb có nhánh xử lý riêng trong session — `tap` mọi template đều nhận. */
export const SCANNED_VERBS = ["drop", "stroke", "adjust", "commit"] as const;
export type ScannedVerb = (typeof SCANNED_VERBS)[number];

export interface VerbDrift {
  readonly code: string;
  readonly verb: ScannedVerb;
  readonly kind: "handled_not_declared" | "declared_not_handled";
}

const VERBS_LIST = /verbs:\s*\[([^\]]*)\]/u;
const QUOTED_WORD = /"([a-z]+)"/gu;

const SKIPPED_FILES = new Set(["template.ts", "fixtures.ts"]);

function listTsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      return listTsFiles(full);
    }
    return name.endsWith(".ts") && !SKIPPED_FILES.has(name) ? [full] : [];
  });
}

function handlesVerb(source: string, verb: ScannedVerb): boolean {
  const pattern = new RegExp(`type (===|!==) "${verb}"|case "${verb}":`, "u");
  return pattern.test(source);
}

function declaredVerbs(templateSource: string): Set<string> {
  const match = VERBS_LIST.exec(templateSource);
  const list = match?.[1] ?? "";
  return new Set([...list.matchAll(QUOTED_WORD)].map((m) => m[1] ?? ""));
}

/**
 * `input.verbs` của template phải khớp verb mà session thật sự đọc
 * (`BR-EIC-08`): shell dựa vào nó để bật/tắt kéo, nên lệch là kéo vô nghĩa
 * (khai thừa) hoặc mất thao tác (khai thiếu).
 */
export function scanVerbDeclarations(templatesDir: string): VerbDrift[] {
  const drifts: VerbDrift[] = [];
  const codes = readdirSync(templatesDir)
    .filter((name) => name.startsWith("GT-"))
    .sort();
  for (const code of codes) {
    const dir = join(templatesDir, code);
    const declared = declaredVerbs(
      readFileSync(join(dir, "template.ts"), "utf8")
    );
    const source = listTsFiles(dir)
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    for (const verb of SCANNED_VERBS) {
      const handled = handlesVerb(source, verb);
      if (handled && !declared.has(verb)) {
        drifts.push({ code, verb, kind: "handled_not_declared" });
      }
      if (!handled && declared.has(verb)) {
        drifts.push({ code, verb, kind: "declared_not_handled" });
      }
    }
  }
  return drifts;
}
