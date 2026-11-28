import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { resolveTeacherVoicePath } from "@mindkid/shared/voice-path";

/**
 * Cổng `BR-PNR-05` — mọi câu khung chuyện của engine và mọi `audio_path` tĩnh
 * trong nội dung phải trỏ tới mp3 có thật trong `apps/web/public`.
 * Thiếu file = 404 ở vòng đầu của trẻ.
 */
export const PUBLIC_DIR = join(REPO_ROOT, "apps/web/public");
export const CONTENT_SRC_DIR = join(REPO_ROOT, "packages/content/src");

const AUDIO_PATH_RE = /audio_path:\s*"([^"]+)"/g;

export interface VoiceCoverageViolation {
  readonly kind: "story_line" | "audio_path";
  readonly subject: string;
  readonly expectedPath: string | null;
}

function publicFileExists(urlPath: string): boolean {
  return existsSync(join(PUBLIC_DIR, urlPath));
}

export function findMissingStoryLines(
  lines: readonly string[]
): VoiceCoverageViolation[] {
  const out: VoiceCoverageViolation[] = [];
  for (const line of lines) {
    const expectedPath = resolveTeacherVoicePath(line);
    if (expectedPath === null || !publicFileExists(expectedPath)) {
      out.push({ kind: "story_line", subject: line, expectedPath });
    }
  }
  return out;
}

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTsFiles(full));
    } else if (entry.name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out.sort();
}

export function findDeadAudioPaths(dir: string): VoiceCoverageViolation[] {
  const out: VoiceCoverageViolation[] = [];
  for (const file of listTsFiles(dir)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(AUDIO_PATH_RE)) {
      const audioPath = match[1] ?? "";
      if (!publicFileExists(audioPath)) {
        out.push({
          kind: "audio_path",
          subject: `${file}: ${audioPath}`,
          expectedPath: audioPath,
        });
      }
    }
  }
  return out;
}
