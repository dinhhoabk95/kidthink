import { existsSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { resolveTeacherVoicePath } from "@mindkid/shared/voice-path";
import type { SeedSpokenLabel } from "#src/voice/seed-spoken-labels";

/**
 * Lõi cổng `BR-PNR-05/06` — "mọi thứ chạm được đều có tiếng": một `spokenLabel`
 * hợp lệ khi `spokenAudioPath` của entity trỏ tới file có thật, hoặc kho giọng
 * có mp3 cho đúng chuỗi đó.
 */
export interface SpokenLabelViolation {
  readonly label: string;
  readonly source: string;
  readonly expectedPath: string | null;
}

function publicFileExists(urlPath: string): boolean {
  return existsSync(repoPath(`apps/web/public${urlPath}`));
}

export function findUnvoicedSpokenLabels(
  labels: readonly SeedSpokenLabel[]
): SpokenLabelViolation[] {
  const seen = new Set<string>();
  const out: SpokenLabelViolation[] = [];
  for (const item of labels) {
    if (seen.has(item.label)) {
      continue;
    }
    seen.add(item.label);
    if (item.audioPath !== null && publicFileExists(item.audioPath)) {
      continue;
    }
    const expectedPath = resolveTeacherVoicePath(item.label);
    if (expectedPath === null || !publicFileExists(expectedPath)) {
      out.push({ label: item.label, source: item.source, expectedPath });
    }
  }
  return out;
}
