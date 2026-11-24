import type { GenericEndpointContext } from "better-auth";
import { describe, expect, it } from "vitest";
import { computeSessionReauthAt } from "../src/user-auth-helpers.js";

const NOW = new Date("2026-01-01T00:00:00.000Z");

interface UserFlags {
  readonly twoFactorEnabled: boolean;
}

function ctxFor(flags: UserFlags): GenericEndpointContext {
  return {
    context: {
      internalAdapter: {
        findUserById: () => Promise.resolve(flags),
      },
    },
  } as never;
}

const PATHS = {
  email: "/sign-in/email",
  signUp: "/sign-up/email",
  passkey: "/passkey/verify-authentication",
  socialStart: "/sign-in/social",
  socialCallback: "/callback/google",
  totp: "/two-factor/verify-totp",
  backup: "/two-factor/verify-backup-code",
  other: "/get-session",
} as const;

async function run(
  pathStr: string,
  twoFactor: boolean,
  via: "snapshot" | "db"
): Promise<Date | null> {
  return await computeSessionReauthAt({
    pathStr,
    userId: 1,
    snapshot2faEnabled: via === "snapshot" && twoFactor,
    ctx: ctxFor({ twoFactorEnabled: via === "db" && twoFactor }),
    now: NOW,
  });
}

describe("computeSessionReauthAt — ma trận 2FA × cách đăng nhập (BR-AUT-13)", () => {
  for (const via of ["snapshot", "db"] as const) {
    describe(`2FA phát hiện qua ${via}`, () => {
      it.each([
        ["email", PATHS.email],
        ["sign-up", PATHS.signUp],
        ["passkey", PATHS.passkey],
        ["social start", PATHS.socialStart],
        ["social callback", PATHS.socialCallback],
      ])("không 2FA + %s => fresh", async (_n, path) => {
        expect(await run(path, false, via)).toEqual(NOW);
      });

      it.each([
        ["email", PATHS.email],
        ["sign-up", PATHS.signUp],
        ["social start", PATHS.socialStart],
        ["social callback", PATHS.socialCallback],
      ])("có 2FA + %s => null", async (_n, path) => {
        expect(await run(path, true, via)).toBeNull();
      });

      it("có 2FA + passkey => fresh", async () => {
        expect(await run(PATHS.passkey, true, via)).toEqual(NOW);
      });
    });
  }

  it.each([PATHS.totp, PATHS.backup])(
    "2FA verify %s => fresh dù bật hay không",
    async (path) => {
      expect(await run(path, true, "snapshot")).toEqual(NOW);
      expect(await run(path, false, "snapshot")).toEqual(NOW);
    }
  );

  it("đường dẫn khác => null", async () => {
    expect(await run(PATHS.other, false, "snapshot")).toBeNull();
  });
});
