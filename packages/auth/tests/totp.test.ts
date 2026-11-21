import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import { describe, expect, it } from "vitest";
import {
  createMindKidManagerAuth,
  createMindKidUserAuth,
  InMemoryRedisClient,
} from "#src/index";

const dummyCols = {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
};

describe("Better Auth Dual-Instance Initialization (BR-AUT-39, BR-AUT-45)", () => {
  it("initializes both userAuth and managerAuth with twoFactor and passkey plugins without conflict", () => {
    const mockDb = drizzle.mock();
    const redis = new InMemoryRedisClient();
    const rootSecret = "0123456789abcdef0123456789abcdef";

    const userAuth = createMindKidUserAuth({
      db: mockDb,
      schema: {
        users: pgTable("users", dummyCols),
        userAccounts: pgTable("user_accounts", dummyCols),
        userSessions: pgTable("user_sessions", dummyCols),
        userVerifications: pgTable("user_verifications", dummyCols),
        userTwoFactors: pgTable("user_two_factors", dummyCols),
        userPasskeys: pgTable("user_passkeys", dummyCols),
      },
      redis,
      rootSecret,
      siteUrl: "http://localhost:3000",
      trustedOrigins: ["http://localhost:3000"],
      isProduction: false,
    });

    const managerAuth = createMindKidManagerAuth({
      db: mockDb,
      schema: {
        managers: pgTable("managers", dummyCols),
        managerAccounts: pgTable("manager_accounts", dummyCols),
        managerSessions: pgTable("manager_sessions", dummyCols),
        managerVerifications: pgTable("manager_verifications", dummyCols),
        managerTwoFactors: pgTable("manager_two_factors", dummyCols),
        managerPasskeys: pgTable("manager_passkeys", dummyCols),
      },
      redis,
      rootSecret,
      siteUrl: "http://localhost:3000",
      trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
      isProduction: false,
    });

    expect(userAuth.options.basePath).toBe("/api/auth/users");
    expect(managerAuth.options.basePath).toBe("/api/auth/managers");
    expect(userAuth.options.advanced?.cookiePrefix).toBe("mindkid-user");
    expect(managerAuth.options.advanced?.cookiePrefix).toBe("mindkid-manager");
    expect(managerAuth.options.emailAndPassword?.disableSignUp).toBe(true);
    expect("socialProviders" in managerAuth.options).toBe(false);
  });
});
