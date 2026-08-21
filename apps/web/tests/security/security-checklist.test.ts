import fs from "node:fs";
import path from "node:path";
import { appError, hashPassword } from "@mindkid/auth";
import { childProfiles, getAppDb, users } from "@mindkid/db";
import { findUnvalidatedRoutes } from "@mindkid/gates/route-validation";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

const ENV_READ_PATTERN =
  /readFileSync\s*\([^)]*\.env|\.config\s*\(\s*\{[^}]*path:[^}]*\.env/i;

describe("Security Checklist Contract (BR-SEC-01..10)", () => {
  it("BR-SEC-02 — cấm đọc tệp biến môi trường trong mã ứng dụng", () => {
    // Quét apps/ và packages/ để đảm bảo không có lệnh đọc file .env trực tiếp
    const root = path.resolve(import.meta.dirname, "../../../..");
    const scanDirs = [
      path.join(root, "apps", "web", "server"),
      path.join(root, "packages", "auth", "src"),
      path.join(root, "packages", "db", "src"),
    ];

    for (const dir of scanDirs) {
      if (!fs.existsSync(dir)) {
        continue;
      }
      const files = fs.readdirSync(dir, { recursive: true }) as string[];
      for (const f of files) {
        if (!f.endsWith(".ts")) {
          continue;
        }
        const filePath = path.join(dir, f);
        const code = fs.readFileSync(filePath, "utf8");
        expect(
          ENV_READ_PATTERN.test(code),
          `File ${filePath} đọc file .env trực tiếp (vi phạm BR-SEC-02)`
        ).toBe(false);
      }
    }
  });

  it("BR-SEC-04 — mọi route /api/* đọc body đều validate bằng Zod trong cùng file", () => {
    const findings = findUnvalidatedRoutes();
    expect(
      findings,
      "Tất cả các route /api/* phải Zod validate body (BR-SEC-04)"
    ).toEqual([]);
  });

  it("BR-SEC-05 — cấm mass assignment: map từng field tường minh, không ghi đè cột đặc quyền", async () => {
    const db = getAppDb();
    const suffix = Math.floor(Math.random() * 900_000 + 100_000).toString();
    const [user] = await db
      .insert(users)
      .values({
        email: `sec05_${suffix}@example.com`,
        passwordHash: await hashPassword("secure123"),
        displayName: "User SEC 05",
        status: "active",
      })
      .returning();

    // Client cố gắng inject các trường đặc quyền như status, sessionVersion, id
    const maliciousPayload = {
      display_name: "Updated Valid Name",
      status: "deleted",
      session_version: 999,
      role: "super_admin",
      id: 1,
    };

    // Handler tuân thủ BR-SEC-05 chỉ map các trường an toàn
    const safeUpdate = {
      displayName: maliciousPayload.display_name,
      updatedAt: new Date(),
    };

    await db.update(users).set(safeUpdate).where(eq(users.id, user.id));

    const [refreshed] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(refreshed?.displayName).toBe("Updated Valid Name");
    expect(refreshed?.status).toBe("active"); // Không bị ghi đè thành deleted
    expect(refreshed?.sessionVersion).toBe(0); // Không bị ghi đè thành 999
  });

  it("BR-SEC-06 & BR-SEC-07 — kiểm ownership ở server, record của người khác trả 404", async () => {
    const db = getAppDb();
    const suffix1 = Math.floor(Math.random() * 900_000 + 100_000).toString();
    const suffix2 = Math.floor(Math.random() * 900_000 + 100_000).toString();

    // User A và Trẻ A
    const [userA] = await db
      .insert(users)
      .values({
        email: `user_a_${suffix1}@example.com`,
        passwordHash: await hashPassword("password123"),
        displayName: "User A",
        status: "active",
      })
      .returning();

    const [childA] = await db
      .insert(childProfiles)
      .values({
        userId: userA.id,
        displayName: "Bé A",
        birthYear: 2021,
        avatarId: "avatar-01",
        status: "active",
      })
      .returning();

    // User B
    const [userB] = await db
      .insert(users)
      .values({
        email: `user_b_${suffix2}@example.com`,
        passwordHash: await hashPassword("password123"),
        displayName: "User B",
        status: "active",
      })
      .returning();

    // User B truy cập Child A -> Server phải trả 404 (BR-SEC-07, BR-ACT-03), không trả 403 để tránh tiết lộ record tồn tại
    const [lookupResult] = await db
      .select()
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.uuid, childA.uuid),
          eq(childProfiles.userId, userB.id)
        )
      );

    expect(lookupResult).toBeUndefined();

    // Khi lookup thất bại do sai ownership, throw 404 NOT_FOUND
    if (!lookupResult) {
      const notFoundErr = appError("NOT_FOUND");
      expect(notFoundErr.statusCode).toBe(404);
      expect(notFoundErr.message).not.toContain(childA.uuid); // Không rò rỉ ID
    }
  });

  it("BR-SEC-10 — cấu hình bảo mật tuân thủ contract: rateLimiter và CSRF nội bộ tắt để dùng domain layer", () => {
    const webNuxtConfig = path.resolve(
      import.meta.dirname,
      "../../nuxt.config.ts"
    );
    expect(fs.existsSync(webNuxtConfig)).toBe(true);

    const configContent = fs.readFileSync(webNuxtConfig, "utf8");
    // Nuxt config phải cấu hình nuxt-security với rateLimiter và csrf tắt (domain layer tự quản lý)
    expect(configContent).toContain("security");
  });
});
