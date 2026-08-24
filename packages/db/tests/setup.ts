/**
 * Test-only environment for the integration suite.
 *
 * Production code fails closed when these are absent (BR-ENV-03), so the tests
 * supply their own deterministic values here rather than the source carrying a
 * fallback that would also apply on a real server.
 */
const TEST_SECRET = "test-only-value-0123456789abcdef01";

function setTestEnv(name: string, value: string): void {
  if (process.env[name] === undefined) {
    process.env[name] = value;
  }
}

setTestEnv("STORAGE_SIGNING_SECRET", TEST_SECRET);
setTestEnv("STORAGE_BASE_URL", "http://localhost:3000");
setTestEnv("SITE_URL", "http://localhost:3000");
setTestEnv("AWS_S3_PUBLIC_BUCKET", "mindkid-test-public");
setTestEnv("AWS_S3_PRIVATE_BUCKET", "mindkid-test-private");
setTestEnv("INITIAL_ADMIN_EMAIL", "admin@mindkid.test");
setTestEnv("INITIAL_ADMIN_PASSWORD", "test-only-admin-password-0123456789");
