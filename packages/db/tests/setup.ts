/**
 * Test-only environment for the integration suite.
 *
 * Production code fails closed when these are absent (BR-ENV-03), so the tests
 * supply their own deterministic values here rather than the source carrying a
 * fallback that would also apply on a real server.
 */
const TEST_SECRET = "test-only-value-0123456789abcdef01";

process.env.STORAGE_SIGNING_SECRET ??= TEST_SECRET;
process.env.STORAGE_BASE_URL ??= "http://localhost:3000";
process.env.SITE_URL ??= "http://localhost:3000";
process.env.AWS_S3_PUBLIC_BUCKET ??= "mindkid-test-public";
process.env.AWS_S3_PRIVATE_BUCKET ??= "mindkid-test-private";
process.env.INITIAL_ADMIN_EMAIL ??= "admin@mindkid.test";
process.env.INITIAL_ADMIN_PASSWORD ??= "test-only-admin-password-0123456789";
