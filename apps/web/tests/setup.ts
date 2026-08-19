// Test-only credentials. Production helpers fail closed when runtime secrets
// are absent; API unit tests need the same deterministic value as their token
// fixtures without introducing a production fallback.
process.env.WEB_JWT_SECRET ??= "mindkid-dev-secret-mindkid-dev-secret-32bytes";
process.env.ADMIN_JWT_SECRET ??= process.env.WEB_JWT_SECRET;
process.env.PARENT_GATE_SECRET ??=
  "test-parent-gate-secret-key-123456789012345678901234567890";

import { clearInMemoryBuckets } from "@mindkid/cache";
import { beforeEach } from "vitest";

beforeEach(() => clearInMemoryBuckets());
