/**
 * Đọc `content_pack` thật của corpus cho test hồi quy sư phạm của bộ chiếu.
 *
 * Mọi level dựng bằng chính `buildLevelsForSkill` trên `ALL_SKILL_SEEDS` — quét
 * nguồn thật, không dựng lại tham số seed bằng tay.
 */
import { buildLevelsForSkill } from "#src/builders/build-levels";
import { ALL_SKILL_SEEDS } from "#src/skills/index";
import type { ContentSeed } from "#src/types";

export type PackValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly PackValue[]
  | PackObject;

export interface PackObject {
  readonly [key: string]: PackValue;
}

type RawPack = ContentSeed["content_pack"];

function toPackValue(raw: RawPack): PackValue {
  if (
    raw === null ||
    raw === undefined ||
    typeof raw === "string" ||
    typeof raw === "number" ||
    typeof raw === "boolean"
  ) {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw.map((v: RawPack) => toPackValue(v));
  }
  if (typeof raw === "object") {
    const out: Record<string, PackValue> = {};
    for (const [k, v] of Object.entries(raw)) {
      out[k] = toPackValue(v);
    }
    return out;
  }
  throw new Error(`content_pack chứa giá trị lạ: ${typeof raw}`);
}

function isPackArray(v: PackValue): v is readonly PackValue[] {
  return Array.isArray(v);
}

export function asObject(v: PackValue): PackObject {
  if (
    v === null ||
    v === undefined ||
    typeof v !== "object" ||
    isPackArray(v)
  ) {
    throw new Error(`Mong một object, nhận ${JSON.stringify(v)}`);
  }
  return v;
}

export function asArray(v: PackValue): readonly PackValue[] {
  if (!isPackArray(v)) {
    throw new Error(`Mong một mảng, nhận ${JSON.stringify(v)}`);
  }
  return v;
}

export function asString(v: PackValue): string {
  if (typeof v !== "string") {
    throw new Error(`Mong một chuỗi, nhận ${JSON.stringify(v)}`);
  }
  return v;
}

/**
 * Khoá nhìn thấy của một asset: hai asset cùng khoá là cùng một hình trên màn
 * (`text:"🍎"` và `emoji:"🍎"` trùng khoá, bỏ VS16).
 */
export function assetKeyOf(v: PackValue): string {
  const a = asObject(v);
  if (a.kind === "image") {
    return `image:${asString(a.path)}`;
  }
  const shown = asString(a.kind === "text" ? a.text : a.ref);
  return `shown:${shown.replace(/\uFE0F/gu, "").trim()}`;
}

/** Chuỗi hiện ra của một asset (emoji ref hoặc text). */
export function assetShown(v: PackValue): string {
  const a = asObject(v);
  if (a.kind === "emoji") {
    return asString(a.ref);
  }
  if (a.kind === "text") {
    return asString(a.text);
  }
  return asString(a.path);
}

export interface RealPack {
  readonly levelCode: string;
  readonly skillCode: string;
  readonly roundIndex: number;
  readonly pack: PackObject;
}

const cache = new Map<string, readonly RealPack[]>();

/** Mọi gói nội dung (level + từng vòng) của khuôn `template` trong corpus thật. */
export function realPacks(template: string): readonly RealPack[] {
  const hit = cache.get(template);
  if (hit) {
    return hit;
  }
  const out: RealPack[] = [];
  for (const seed of ALL_SKILL_SEEDS) {
    if (!seed.levels.some((l) => l.template === template)) {
      continue;
    }
    for (const level of buildLevelsForSkill(seed)) {
      if (level.header.template_code !== template) {
        continue;
      }
      const packs: RawPack[] = [
        level.content_pack,
        ...(level.rounds ?? []).map((r) => r.content_pack),
      ];
      packs.forEach((raw, i) => {
        out.push({
          levelCode: level.header.code,
          skillCode: seed.dataset.skill_code,
          roundIndex: i,
          pack: asObject(toPackValue(raw)),
        });
      });
    }
  }
  cache.set(template, out);
  return out;
}

/** Gói nội dung bộ chiếu trả về, đọc qua cùng bộ đọc với corpus thật. */
export function toPack(raw: RawPack): PackObject {
  return asObject(toPackValue(raw));
}
