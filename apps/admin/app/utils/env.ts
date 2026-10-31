import { createEnv } from "@t3-oss/env-nuxt";
import { z } from "zod";

interface EnvIssuePathSegment {
  readonly key: PropertyKey;
}

interface EnvValidationIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | EnvIssuePathSegment> | undefined;
}

function urlWithProtocols(protocols: readonly string[]) {
  return z.string().refine(
    (val: string): boolean => {
      try {
        const parsed = new URL(val);
        return protocols.includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    {
      message: `URL không hợp lệ hoặc giao thức không nằm trong: ${protocols.join(", ")} (BR-ENV-13)`,
    }
  );
}

function formatIssuePath(issue: EnvValidationIssue): string {
  if (!issue.path || issue.path.length === 0) {
    return "UNKNOWN_ENV_VAR";
  }
  const firstSegment = issue.path[0];
  if (
    typeof firstSegment === "object" &&
    firstSegment !== null &&
    "key" in firstSegment
  ) {
    return String(firstSegment.key);
  }
  return String(firstSegment);
}

/**
 * BR-ENV-08: Chỉ in tên biến và lý do lỗi, tuyệt đối không in giá trị.
 */
function handleValidationError(issues: readonly EnvValidationIssue[]): never {
  const details = issues
    .map(
      (issue: EnvValidationIssue): string =>
        `${formatIssuePath(issue)}: ${issue.message}`
    )
    .join("; ");
  throw new Error(
    `Cấu hình biến môi trường admin không hợp lệ (${details}). Xem docs/specs/01-platform/env-contract.md.`
  );
}

export interface CreateAdminEnvOptions {
  isServer?: boolean;
  skipValidation?: boolean;
}

export function createAdminEnv(options: CreateAdminEnvOptions = {}) {
  return createEnv({
    isServer: options.isServer,
    skipValidation: options.skipValidation,
    emptyStringAsUndefined: true,
    onValidationError: handleValidationError,
    shared: {
      NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    },
    client: {
      NUXT_PUBLIC_API_BASE_URL: urlWithProtocols(["http:", "https:"]),
    },
  });
}
