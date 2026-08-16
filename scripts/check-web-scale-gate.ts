import {
  ACCEPTED_WEB_SCALE_MANIFEST,
  validateWebScaleManifest,
} from "./check-web-scale-gate-lib.ts";

const violations = validateWebScaleManifest(ACCEPTED_WEB_SCALE_MANIFEST);

if (violations.length > 0) {
  process.stderr.write(
    `❌ [check:web-scale-gate] ${violations.length} lỗi vi phạm contract Web Scale:\n`
  );
  for (const v of violations) {
    process.stderr.write(`  [${v.code}] ${v.message}\n`);
  }
  process.exit(1);
}

process.stdout.write(
  `✅ [check:web-scale-gate] Toàn bộ ${ACCEPTED_WEB_SCALE_MANIFEST.length} outcome Web Scale và evidence hợp lệ.\n`
);
