/**
 * Gom mọi mã lỗi của mọi domain về một chỗ.
 *
 * ⚠️ Chỉ dùng cho **cổng** và **test đối chiếu spec**. ❌ NEVER tra registry ở
 * call site: route ném lớp, không tra bảng. Tra bảng là đường quay lại
 * `appError("MÃ_GÕ_TAY")` mà bản tách file này sinh ra để bỏ.
 *
 * File này cố ý KHÔNG nằm trong barrel `./index.ts` — nó ở subpath riêng
 * `@mindkid/errors/registry`. Gom mọi domain bằng namespace import chặn
 * tree-shaking, nên để nó trong barrel là kéo cả 11 file domain vào bundle
 * client dù trang chỉ dùng một mã.
 */

/* biome-ignore-all lint/performance/noNamespaceImport: registry cố ý gom mọi domain; nó ở subpath riêng ngoài đường bundle của app */

import * as account from "./domains/account.ts";
import * as auth from "./domains/auth.ts";
import * as billing from "./domains/billing.ts";
import * as child from "./domains/child.ts";
import * as common from "./domains/common.ts";
import * as content from "./domains/content.ts";
import * as curriculum from "./domains/curriculum.ts";
import * as gameLevel from "./domains/game-level.ts";
import * as offlinePack from "./domains/offline-pack.ts";
import * as play from "./domains/play.ts";
import * as social from "./domains/social.ts";

/** Định nghĩa một mã lỗi: cặp (HTTP status, thông báo mặc định). */
export interface ErrorCodeDefinition {
  readonly code: string;
  readonly status: number;
  readonly message: string;
  readonly domain: string;
  readonly className: string;
}

/** Một lớp not-found gắn model — tham chiếu tới mã đã định nghĩa ở trên. */
export interface ModelErrorDefinition {
  readonly className: string;
  readonly model: string;
  readonly code: string;
  readonly domain: string;
}

type DomainExport = Readonly<Record<string, object>>;

const DOMAIN_MODULES: Readonly<Record<string, DomainExport>> = {
  account,
  auth,
  billing,
  child,
  common,
  content,
  curriculum,
  "game-level": gameLevel,
  "offline-pack": offlinePack,
  play,
  social,
};

interface CodeCarrier {
  readonly code: string;
  readonly status: number;
  readonly defaultMessage: string;
  readonly name: string;
}

interface ModelCarrier {
  readonly code: string;
  readonly model: string;
  readonly name: string;
}

function hasStringProp(value: object, key: string): boolean {
  return typeof Reflect.get(value, key) === "string";
}

function isModelCarrier(value: object): value is ModelCarrier {
  return hasStringProp(value, "code") && hasStringProp(value, "model");
}

function isCodeCarrier(value: object): value is CodeCarrier {
  return (
    hasStringProp(value, "code") &&
    hasStringProp(value, "defaultMessage") &&
    typeof Reflect.get(value, "status") === "number" &&
    !hasStringProp(value, "model")
  );
}

interface CollectedErrors {
  readonly codes: ReadonlyMap<string, ErrorCodeDefinition>;
  readonly models: readonly ModelErrorDefinition[];
}

function collect(): CollectedErrors {
  const codes = new Map<string, ErrorCodeDefinition>();
  const models: ModelErrorDefinition[] = [];

  for (const [domain, moduleExports] of Object.entries(DOMAIN_MODULES)) {
    for (const value of Object.values(moduleExports)) {
      if (isModelCarrier(value)) {
        models.push({
          className: value.name,
          model: value.model,
          code: value.code,
          domain,
        });
        continue;
      }
      if (!isCodeCarrier(value)) {
        continue;
      }
      const existing = codes.get(value.code);
      if (existing) {
        throw new Error(
          `Mã lỗi trùng: ${value.code} khai ở cả ${existing.domain} và ${domain}`
        );
      }
      codes.set(value.code, {
        code: value.code,
        status: value.status,
        message: value.defaultMessage,
        domain,
        className: value.name,
      });
    }
  }

  return { codes, models };
}

const collected = collect();

/** Mọi mã lỗi đã cài, khoá theo mã. */
export const ERROR_REGISTRY: ReadonlyMap<string, ErrorCodeDefinition> =
  collected.codes;

/** Mọi lớp not-found gắn model. Mã của chúng phải có trong `ERROR_REGISTRY`. */
export const MODEL_ERROR_REGISTRY: readonly ModelErrorDefinition[] =
  collected.models;

export function errorCodes(): readonly string[] {
  return [...ERROR_REGISTRY.keys()].sort();
}
