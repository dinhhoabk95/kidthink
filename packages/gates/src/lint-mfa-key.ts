import { REPO_ROOT } from "@mindkid/config/paths";
import { type FileItem, readCodebaseFiles } from "./lint-lib/codebase-files.ts";
import { isTestPath } from "./lint-lib/source-scan.ts";

const ENCRYPT_OR_DECRYPT = /(?:encryptTotpSecret|decryptTotpSecret)\s*\(/g;

/**
 * BR-MFA-13: Every call to encryptTotpSecret / decryptTotpSecret in apps/
 * (non-test) must pass getMfaEncryptionKey() as the key argument.
 */

function extractCallSnippet(content: string, startIdx: number): string {
  let depth = 0;
  let foundOpen = false;
  let snippet = "";
  const end = Math.min(content.length, startIdx + 500);
  for (let i = startIdx; i < end; i++) {
    const ch = content[i];
    snippet += ch;
    if (ch === "(") {
      depth++;
      foundOpen = true;
    } else if (ch === ")") {
      depth--;
      if (foundOpen && depth === 0) {
        break;
      }
    }
  }
  return snippet;
}

function findViolations(file: FileItem): string[] {
  if (!file.filePath.startsWith("apps/") || isTestPath(file.filePath)) {
    return [];
  }

  const violations: string[] = [];
  const content = file.content;

  ENCRYPT_OR_DECRYPT.lastIndex = 0;
  for (
    let match = ENCRYPT_OR_DECRYPT.exec(content);
    match !== null;
    match = ENCRYPT_OR_DECRYPT.exec(content)
  ) {
    const snippet = extractCallSnippet(content, match.index);
    if (!snippet.includes("getMfaEncryptionKey()")) {
      const lineNum = content.slice(0, match.index).split("\n").length;
      violations.push(
        `BR-MFA-13 VIOLATION: "${file.filePath}":${lineNum} calls encrypt/decryptTotpSecret without getMfaEncryptionKey()`
      );
    }
  }

  return violations;
}

export function scanMfaKeyCustody(files: FileItem[]): void {
  const violations: string[] = [];

  for (const file of files) {
    violations.push(...findViolations(file));
  }

  if (violations.length > 0) {
    throw new Error(violations.join("\n"));
  }
}

export function runMfaKeyGate(root: string = REPO_ROOT): void {
  scanMfaKeyCustody(readCodebaseFiles(root));
}
