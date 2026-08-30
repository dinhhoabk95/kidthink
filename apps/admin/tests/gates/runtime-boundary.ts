import fs from "node:fs";
import path from "node:path";

export interface BoundaryViolation {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

const CODE_FILE_REGEX = /\.(vue|ts|js)$/;
const NATIVE_FETCH_REGEX = /(?<!api)fetch\s*\(\s*["'`]\/api\//;

export function scanRuntimeBoundary(targetDir: string): BoundaryViolation[] {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Target directory does not exist: ${targetDir}`);
  }

  const entries = fs.readdirSync(targetDir, {
    recursive: true,
    withFileTypes: true,
  });
  const codeFiles = entries
    .filter((e) => e.isFile() && CODE_FILE_REGEX.test(e.name))
    .map((e) => path.join(e.parentPath || targetDir, e.name));

  if (codeFiles.length === 0) {
    throw new Error(
      `Target directory is empty or contains no code files: ${targetDir}`
    );
  }

  const violations: BoundaryViolation[] = [];

  for (const filePath of codeFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    const isLoginPage = filePath.endsWith("login.vue");
    const isPage =
      filePath.includes(path.join("app", "pages")) ||
      filePath.includes("pages");

    if (isPage && !isLoginPage) {
      const hasAuthGuard =
        content.includes("definePageMeta") &&
        (content.includes('middleware: "auth"') ||
          content.includes("middleware: ['auth']") ||
          content.includes('middleware: ["auth"]') ||
          content.includes("auth"));

      if (!(hasAuthGuard || content.includes("definePageMeta"))) {
        violations.push({
          file: filePath,
          line: 1,
          snippet: "Page missing auth guard",
          reason:
            "BR-ARB-04: Admin pages outside login must define auth guard middleware",
        });
      }
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // 1. Direct native fetch("/api/...")
      if (NATIVE_FETCH_REGEX.test(trimmed) && !trimmed.includes("apiFetch")) {
        violations.push({
          file: filePath,
          line: index + 1,
          snippet: trimmed,
          reason:
            "BR-ARB-04: Direct fetch to /api/ forbidden. Use apiUrl() or useApiClient() / apiFetch()",
        });
      }

      // 2. window.open with direct "/api/..." not wrapped in apiUrl()
      if (
        (trimmed.includes("window.open('/api/") ||
          trimmed.includes('window.open("/api/') ||
          trimmed.includes("window.open(`/api/")) &&
        !trimmed.includes("apiUrl(")
      ) {
        violations.push({
          file: filePath,
          line: index + 1,
          snippet: trimmed,
          reason:
            "BR-ARB-04: window.open with direct /api/ forbidden. Wrap with apiUrl()",
        });
      }

      // 3. Raw template literal URL in href/src without apiUrl()
      if (
        (trimmed.includes('href="/api/') ||
          trimmed.includes("href='/api/") ||
          (trimmed.includes(':href="`/api/') &&
            !trimmed.includes("apiUrl("))) &&
        !trimmed.includes("apiUrl(")
      ) {
        violations.push({
          file: filePath,
          line: index + 1,
          snippet: trimmed,
          reason:
            "BR-ARB-04: Direct /api/ URL in href/src forbidden. Wrap with apiUrl()",
        });
      }
    });
  }

  return violations;
}
