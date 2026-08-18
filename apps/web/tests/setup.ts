// Test-only credentials. Production helpers fail closed when runtime secrets
// are absent; API unit tests need the same deterministic value as their token
// fixtures without introducing a production fallback.
process.env.JWT_SECRET ??= "mindkid-dev-secret-mindkid-dev-secret-32bytes";
process.env.NUXT_WEB_JWT_SECRET ??= process.env.JWT_SECRET;
process.env.NUXT_ADMIN_JWT_SECRET ??= process.env.JWT_SECRET;
process.env.NUXT_PARENT_GATE_SECRET ??=
  "test-parent-gate-secret-key-123456789012345678901234567890";

import { clearInMemoryBuckets } from "@mindkid/cache";
import { beforeEach } from "vitest";

beforeEach(() => clearInMemoryBuckets());
