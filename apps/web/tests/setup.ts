// Test-only setup. Production helpers fail closed when runtime secrets are
// absent; API tests provide deterministic values explicitly here.
function setTestEnv(name: string, value: string): void {
  if (process.env[name] === undefined) {
    process.env[name] = value;
  }
}

setTestEnv(
  "NUXT_SESSION_PASSWORD",
  "mindkid-session-password-mindkid-session-password"
);
setTestEnv(
  "PARENT_GATE_SECRET",
  "test-parent-gate-secret-key-123456789012345678901234567890"
);
setTestEnv("MFA_ENCRYPTION_KEY", "test-mfa-encryption-key-0123456789ab");
setTestEnv("STORAGE_SIGNING_SECRET", "test-storage-signing-key-0123456789ab");
setTestEnv("SITE_URL", "http://localhost:3000");
setTestEnv("STORAGE_BASE_URL", "http://localhost:3000");
setTestEnv("AWS_S3_PUBLIC_BUCKET", "mindkid-test-public");
setTestEnv("AWS_S3_PRIVATE_BUCKET", "mindkid-test-private");
setTestEnv("NUXT_ALLOWED_ORIGINS", "http://localhost:3001");
// `defineWorkspaceTest` đã đặt `DATABASE_URL`/`DATABASE_URL_APP` trỏ vào
// database test (`mindkid_test`) qua `test.env`, nên hai lời gọi dưới đây chỉ
// là lưới an toàn khi ai đó chạy file này ngoài vitest. ❌ NEVER trỏ chúng về
// `mindkid`: đó là database mà `pnpm dev` đang phục vụ.
setTestEnv(
  "DATABASE_URL",
  "postgresql://postgres:postgres@localhost:5433/mindkid_test"
);
// Role `mindkid_app` chứ ❌ NEVER owner: ràng buộc INSERT-only
// (`REVOKE UPDATE, DELETE ... FROM mindkid_app` trên `consent_logs`,
// `audit_logs`, `content_review_log`) chỉ được ép ở role này. Trỏ về owner thì
// mọi test đi qua `getAppDb()` đều là dương tính giả —
// `docs/tasks/07-first-migration-plan.md` §262 đã cảnh báo đúng cái bẫy đó.
setTestEnv(
  "DATABASE_URL_APP",
  "postgresql://mindkid_app:mindkid_app_password@localhost:5433/mindkid_test"
);
// Some suites call seed() to build their fixtures.
setTestEnv("INITIAL_ADMIN_EMAIL", "admin@mindkid.test");
setTestEnv("INITIAL_ADMIN_PASSWORD", "test-only-admin-password-0123456789");
setTestEnv(
  "NUXT_NOTIFICATION_TOKEN_ENCRYPTION_KEY",
  "test-notification-token-encryption-key-0123456789"
);
setTestEnv("VIETQR_BANK_ID", "970407");
setTestEnv("VIETQR_ACCOUNT_NO", "1234567890");
setTestEnv("VIETQR_ACCOUNT_NAME", "MINDKID CORP");
setTestEnv("VALKEY_URL", "redis://localhost:6380");
setTestEnv(
  "PAYMENT_PAYOS_WEBHOOK_SECRET",
  "test-payos-webhook-secret-0123456789"
);
setTestEnv("PAYMENT_WEBHOOK_SECRET", "test-payos-webhook-secret-0123456789");

import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import { clearInMemoryBuckets } from "@mindkid/cache";
import { beforeEach } from "vitest";
import {
  clearUserSession,
  getUserSession,
  requireManagerSession,
  requireSuperAdminSession,
  requireUserSession,
  setUserSession,
} from "./mock-imports.js";

Object.assign(globalThis, {
  setUserSession,
  getUserSession,
  clearUserSession,
  requireUserSession,
  requireManagerSession,
  requireSuperAdminSession,
});

setAuthRedisClient(new InMemoryRedisClient());
beforeEach(() => clearInMemoryBuckets());
