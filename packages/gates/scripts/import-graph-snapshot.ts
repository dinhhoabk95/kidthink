import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { buildImportGraph } from "#src/import-graph";

const SNAPSHOT_PATH = path.join(
  REPO_ROOT,
  "packages",
  "gates",
  "src",
  "import-graph-snapshot.json"
);

export function saveSnapshot(): number {
  const graph = buildImportGraph();
  const obj: Record<string, string> = {};
  for (const [k, v] of graph.entries()) {
    obj[k] = v;
  }
  fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
  return graph.size;
}

export function diffSnapshot(): {
  readonly matches: boolean;
  readonly added: string[];
  readonly removed: string[];
  readonly changed: Array<{ key: string; expected: string; actual: string }>;
} {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return { matches: true, added: [], removed: [], changed: [] };
  }

  const current = buildImportGraph();
  const raw = fs.readFileSync(SNAPSHOT_PATH, "utf8");
  const baseline: Record<string, string> = JSON.parse(raw);

  const added: string[] = [];
  const removed: string[] = [];
  const changed: Array<{ key: string; expected: string; actual: string }> = [];

  const baselineKeys = new Set(Object.keys(baseline));
  const currentKeys = new Set(current.keys());

  for (const key of currentKeys) {
    if (baselineKeys.has(key)) {
      const curVal = current.get(key) ?? "";
      const baseVal = baseline[key];
      if (curVal !== baseVal) {
        changed.push({ key, expected: baseVal, actual: curVal });
      }
    } else {
      added.push(key);
    }
  }

  for (const key of baselineKeys) {
    if (!currentKeys.has(key)) {
      removed.push(key);
    }
  }

  const matches =
    added.length === 0 && removed.length === 0 && changed.length === 0;
  return { matches, added, removed, changed };
}

function handleDiff(): void {
  const result = diffSnapshot();
  if (result.matches) {
    console.log("import-graph equivalence: OK (snapshot matches perfectly)");
    process.exit(0);
  }

  console.error("❌ import-graph mismatch found:");
  if (result.changed.length > 0) {
    console.error(`Changed targets (${result.changed.length}):`);
    for (const c of result.changed.slice(0, 20)) {
      console.error(`  ${c.key}: expected ${c.expected} -> got ${c.actual}`);
    }
  }
  if (result.added.length > 0) {
    console.error(`New/unexpected entries (${result.added.length}):`);
    for (const a of result.added.slice(0, 10)) {
      console.error(`  + ${a}`);
    }
  }
  if (result.removed.length > 0) {
    console.error(`Missing entries (${result.removed.length}):`);
    for (const r of result.removed.slice(0, 10)) {
      console.error(`  - ${r}`);
    }
  }
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--write")) {
    const count = saveSnapshot();
    console.log(`Saved import graph snapshot with ${count} entries.`);
    process.exit(0);
  }

  if (args.includes("--diff")) {
    handleDiff();
    return;
  }

  const graph = buildImportGraph();
  console.log(`Current import graph has ${graph.size} resolved entries.`);
}

main();
