import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  findDirectForbiddenStaticImports,
  traceClientEntryStaticImports,
} from "./client-entry-weight.js";

const GAME_ENGINE_SRC = path.resolve(import.meta.dirname, "../../src");

describe("BR-PRF-01 & BR-TAK-08: Client Entry Weight & Lazy Loading Gate", () => {
  it("src/index.ts does not static-import any GT-*/session or GT-*/fixtures", () => {
    const entryFile = path.join(GAME_ENGINE_SRC, "index.ts");
    const violations = traceClientEntryStaticImports(entryFile);
    expect(violations).toEqual([]);
  });

  it("src/runtime.ts does not static-import any GT-*/session or GT-*/fixtures", () => {
    const entryFile = path.join(GAME_ENGINE_SRC, "runtime.ts");
    const violations = traceClientEntryStaticImports(entryFile);
    expect(violations).toEqual([]);
  });

  it("src/generated/session-loader.ts uses only dynamic import for templates", () => {
    const loaderFile = path.join(
      GAME_ENGINE_SRC,
      "generated/session-loader.ts"
    );
    const violations = traceClientEntryStaticImports(loaderFile);
    expect(violations).toEqual([]);
  });

  it("negative test case: detects static import of GT-*/session in client reachable path", () => {
    const dummyContent = `
import { GT001Session } from "./templates/GT-001/session.js";
export function dummy() { return GT001Session; }
`;
    const violations = findDirectForbiddenStaticImports(
      "/fake/entry.ts",
      dummyContent
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.importedSpecifier).toBe(
      "./templates/GT-001/session.js"
    );
  });

  it("negative test case: detects static export of GT-*/session in client reachable path", () => {
    const dummyContent = `
export { GT001Session } from "./templates/GT-001/session.js";
`;
    const violations = findDirectForbiddenStaticImports(
      "/fake/entry.ts",
      dummyContent
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.importedSpecifier).toBe(
      "./templates/GT-001/session.js"
    );
  });
});
