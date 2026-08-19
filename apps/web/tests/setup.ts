// Test-only credentials. Production helpers fail closed when runtime secrets
// are absent; API unit tests need the same deterministic value as their token
// fixtures without introducing a production fallback.
process.env.WEB_JWT_SECRET ??= "mindkid-dev-secret-mindkid-dev-secret-32bytes";
process.env.ADMIN_JWT_SECRET ??= process.env.WEB_JWT_SECRET;
process.env.PARENT_GATE_SECRET ??=
  "test-parent-gate-secret-key-123456789012345678901234567890";
process.env.MFA_ENCRYPTION_KEY ??= "test-mfa-encryption-key-0123456789ab";
process.env.STORAGE_SIGNING_SECRET ??= "test-storage-signing-key-0123456789ab";
process.env.SITE_URL ??= "http://localhost:3000";
process.env.STORAGE_BASE_URL ??= "http://localhost:3000";
process.env.AWS_S3_PUBLIC_BUCKET ??= "mindkid-test-public";
process.env.AWS_S3_PRIVATE_BUCKET ??= "mindkid-test-private";
// Some suites call seed() to build their fixtures.
process.env.INITIAL_ADMIN_EMAIL ??= "admin@mindkid.test";
process.env.INITIAL_ADMIN_PASSWORD ??= "test-only-admin-password-0123456789";

import { clearInMemoryBuckets } from "@mindkid/cache";
import { beforeEach } from "vitest";

beforeEach(() => clearInMemoryBuckets());
