import { describe, expect, it } from "vitest";
import {
  InvalidArgumentError,
  validateApp,
  validateCommit,
  validateHost,
  validateRef,
  validateReleaseName,
} from "../deploy/remote-exec.ts";

describe("Deploy CLI argument validation", () => {
  // Everything below reaches a root shell on the server. A rejected argument is
  // the difference between a usage error and a remote command injection.
  it("accepts an ordinary ssh target", () => {
    expect(validateHost("root@vps-01.example.com")).toBe(
      "root@vps-01.example.com"
    );
    expect(validateHost("deploy-host")).toBe("deploy-host");
  });

  it.each([
    "root@example; id",
    "root@example && curl evil",
    "root@example`whoami`",
    "root@example$(id)",
    "root@example\nid",
    "root@example|sh",
  ])("rejects host %j", (host) => {
    expect(() => validateHost(host)).toThrow(InvalidArgumentError);
  });

  it("accepts branch, tag and sha refs", () => {
    for (const ref of ["main", "release/2026-08", "v1.2.3", "a".repeat(40)]) {
      expect(validateRef(ref)).toBe(ref);
    }
  });

  it.each(["main; rm -rf /", "main && id", "main$(id)", "main`id`", "'"])(
    "rejects ref %j",
    (ref) => {
      expect(() => validateRef(ref)).toThrow(InvalidArgumentError);
    }
  );

  it("accepts only the three application log targets and the deploy log", () => {
    for (const app of ["web", "admin", "worker", "deploy"]) {
      expect(validateApp(app)).toBe(app);
    }
    expect(() => validateApp("web; rm -rf /")).toThrow(InvalidArgumentError);
    expect(() => validateApp("../../etc/shadow")).toThrow(InvalidArgumentError);
  });

  it("accepts only a generated release directory name", () => {
    expect(validateReleaseName("20260819T031259Z-1dfad1a")).toBe(
      "20260819T031259Z-1dfad1a"
    );
    expect(() => validateReleaseName("../../../etc")).toThrow(
      InvalidArgumentError
    );
    expect(() => validateReleaseName("20260819T031259Z-1dfad1a; id")).toThrow(
      InvalidArgumentError
    );
  });

  it("accepts only a full commit id", () => {
    expect(validateCommit("a".repeat(40))).toBe("a".repeat(40));
    expect(() => validateCommit("abc1234")).toThrow(InvalidArgumentError);
    expect(() => validateCommit("Z".repeat(40))).toThrow(InvalidArgumentError);
  });
});
