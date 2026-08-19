/**
 * Parser for a dotenv-style file on the server.
 * Contract: docs/specs/01-platform/env-contract.md
 *
 * Kept separate from the registry so the release gate and the unit tests read
 * env files through exactly one code path.
 */

const LINE_PATTERN = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;
const INLINE_COMMENT_PATTERN = /\s#/;

function stripInlineComment(value: string): string {
  // Only an unquoted ` #` starts a comment; a `#` inside a value is data.
  const commentIndex = value.search(INLINE_COMMENT_PATTERN);
  return commentIndex === -1 ? value : value.slice(0, commentIndex);
}

function unquote(rawValue: string): string {
  const value = rawValue.trim();
  const isDoubleQuoted = value.startsWith('"') && value.endsWith('"');
  const isSingleQuoted = value.startsWith("'") && value.endsWith("'");

  if (value.length >= 2 && (isDoubleQuoted || isSingleQuoted)) {
    const inner = value.slice(1, -1);
    return isDoubleQuoted ? inner.replace(/\\n/g, "\n") : inner;
  }

  return stripInlineComment(value).trim();
}

/**
 * Returns the declared variables in file order. Later declarations of the same
 * name win, matching how a shell would source the file.
 */
export function parseEnvFile(content: string): Map<string, string> {
  const parsed = new Map<string, string>();

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    const match = LINE_PATTERN.exec(line);
    if (!match) {
      continue;
    }

    const [, name, rawValue] = match;
    if (name) {
      parsed.set(name, unquote(rawValue ?? ""));
    }
  }

  return parsed;
}
