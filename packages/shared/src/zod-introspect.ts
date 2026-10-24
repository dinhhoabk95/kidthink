import { getByGlyph } from "@mindkid/emoji";
import { z } from "zod";

export type EmojiInputValidationResult =
  | { readonly ok: true; readonly glyph: string }
  | { readonly ok: false; readonly error: string };

const EMOJI_CODE_PREFIX_REGEX = /^EMJ-/i;
let graphemeSegmenterCache: Intl.Segmenter | null = null;

function getGraphemeSegmenter(): Intl.Segmenter {
  if (!graphemeSegmenterCache) {
    graphemeSegmenterCache = new Intl.Segmenter("vi", {
      granularity: "grapheme",
    });
  }
  return graphemeSegmenterCache;
}

/**
 * Chuẩn hoá và kiểm tra giá trị nhập/dán trực tiếp vào trường emoji (BR-EPK-03, BR-EPK-09, BR-SDF-04).
 * Chỉ chấp nhận chuỗi rỗng (xoá) hoặc đúng 1 grapheme thuộc danh mục @mindkid/emoji.
 */
export function validateEmojiInput(
  rawInput: string
): EmojiInputValidationResult {
  const trimmed = rawInput.trim();
  if (trimmed === "") {
    return { ok: true, glyph: "" };
  }

  const normalized = trimmed.normalize("NFC");
  if (EMOJI_CODE_PREFIX_REGEX.test(normalized)) {
    return {
      ok: false,
      error: "Chỉ lưu ký tự emoji UTF-8, không dùng mã EMJ-* (BR-EPK-09).",
    };
  }

  const segments = Array.from(
    getGraphemeSegmenter().segment(normalized),
    (segment) => segment.segment
  );

  if (segments.length !== 1) {
    return {
      ok: false,
      error: "Vui lòng nhập hoặc dán đúng 1 ký tự emoji (BR-EPK-03).",
    };
  }

  const singleGlyph = segments[0] ?? "";
  const entry = getByGlyph(singleGlyph);
  if (!entry) {
    return {
      ok: false,
      error:
        "Ký tự nhập vào không thuộc danh mục emoji giáo dục cho phép (BR-EPK-03).",
    };
  }

  return { ok: true, glyph: singleGlyph };
}

export type UiHintType =
  | "emoji"
  | "image"
  | "color"
  | "audio"
  | "duration"
  | "textarea"
  | "select"
  | "toggle"
  | "slider"
  | "array"
  | "object"
  | "text";

export interface UiHintResult {
  path: string;
  name: string;
  hint: UiHintType;
  depth: number;
  min?: number;
  max?: number;
  options?: string[];
  children?: Record<string, UiHintResult>;
  elementHint?: UiHintResult;
}

export function unwrapZodType(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current: z.ZodTypeAny = schema;
  while (true) {
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      current = current.unwrap();
    } else if (current instanceof z.ZodDefault) {
      current = current.removeDefault();
    } else if (current instanceof z.ZodEffects) {
      current = current.innerType();
    } else if (current instanceof z.ZodCatch) {
      current = current.removeCatch();
    } else if (current instanceof z.ZodBranded) {
      current = current.unwrap();
    } else if (current instanceof z.ZodPipeline) {
      current = current._def.out;
    } else {
      break;
    }
  }
  return current;
}

function resolveUiHintFromName(
  fieldName: string,
  schema: z.ZodTypeAny,
  depth: number,
  path: string
): UiHintResult | undefined {
  if (
    fieldName.endsWith("_emoji") ||
    fieldName === "emoji" ||
    fieldName.endsWith("_emoji_ref")
  ) {
    return { path, name: fieldName, hint: "emoji", depth };
  }

  if (
    fieldName.endsWith("_image") ||
    fieldName === "image" ||
    fieldName.endsWith("_path") ||
    fieldName === "path"
  ) {
    return { path, name: fieldName, hint: "image", depth };
  }

  if (fieldName.endsWith("_color") || fieldName === "color") {
    return { path, name: fieldName, hint: "color", depth };
  }

  if (
    fieldName.endsWith("_audio") ||
    fieldName.endsWith("_audio_ref") ||
    fieldName === "audio"
  ) {
    return { path, name: fieldName, hint: "audio", depth };
  }

  if (fieldName.endsWith("_ms") || fieldName.endsWith("_seconds")) {
    const unwrapped = unwrapZodType(schema);
    let min: number | undefined;
    let max: number | undefined;
    if (unwrapped instanceof z.ZodNumber) {
      min = unwrapped.minValue ?? undefined;
      max = unwrapped.maxValue ?? undefined;
    }
    return { path, name: fieldName, hint: "duration", depth, min, max };
  }

  return undefined;
}

function resolvePrimitiveHint(
  fieldName: string,
  unwrapped: z.ZodTypeAny,
  depth: number,
  path: string
): UiHintResult | undefined {
  if (unwrapped instanceof z.ZodEnum) {
    return {
      path,
      name: fieldName,
      hint: "select",
      depth,
      options: unwrapped.options,
    };
  }

  if (unwrapped instanceof z.ZodNativeEnum) {
    return {
      path,
      name: fieldName,
      hint: "select",
      depth,
      options: Object.values(unwrapped.enum),
    };
  }

  if (unwrapped instanceof z.ZodBoolean) {
    return { path, name: fieldName, hint: "toggle", depth };
  }

  if (unwrapped instanceof z.ZodNumber) {
    const min = unwrapped.minValue;
    const max = unwrapped.maxValue;
    if (
      min !== null &&
      min !== undefined &&
      max !== null &&
      max !== undefined
    ) {
      return { path, name: fieldName, hint: "slider", depth, min, max };
    }
    return { path, name: fieldName, hint: "text", depth };
  }

  if (unwrapped instanceof z.ZodString) {
    const max = unwrapped.maxLength;
    if (max === null || max === undefined || max > 200) {
      return { path, name: fieldName, hint: "textarea", depth };
    }
    return { path, name: fieldName, hint: "text", depth };
  }

  return undefined;
}

function resolveStructuralHint(
  fieldName: string,
  unwrapped: z.ZodTypeAny,
  depth: number,
  path: string
): UiHintResult {
  if (unwrapped instanceof z.ZodArray) {
    const elementSchema = unwrapped.element;
    const elementHint = resolveUiHintForField(
      `${fieldName}[]`,
      elementSchema,
      depth,
      `${path}[]`
    );
    return {
      path,
      name: fieldName,
      hint: "array",
      depth,
      elementHint,
    };
  }

  if (unwrapped instanceof z.ZodObject) {
    const shape = unwrapped.shape;
    const children: Record<string, UiHintResult> = {};
    for (const [key, fieldDef] of Object.entries(shape)) {
      children[key] = resolveUiHintForField(
        key,
        fieldDef as z.ZodTypeAny,
        depth + 1,
        path ? `${path}.${key}` : key
      );
    }
    return {
      path,
      name: fieldName,
      hint: "object",
      depth,
      children,
    };
  }

  if (unwrapped instanceof z.ZodDiscriminatedUnion) {
    return {
      path,
      name: fieldName,
      hint: "select",
      depth,
      options: Array.from(unwrapped.optionsMap.keys() as Iterable<string>),
    };
  }

  return { path, name: fieldName, hint: "text", depth };
}

export function resolveUiHintForField(
  fieldName: string,
  schema: z.ZodTypeAny,
  depth = 1,
  path = fieldName
): UiHintResult {
  const fromName = resolveUiHintFromName(fieldName, schema, depth, path);
  if (fromName) {
    return fromName;
  }

  const unwrapped = unwrapZodType(schema);
  const fromPrimitive = resolvePrimitiveHint(fieldName, unwrapped, depth, path);
  if (fromPrimitive) {
    return fromPrimitive;
  }

  return resolveStructuralHint(fieldName, unwrapped, depth, path);
}

export function introspectZodSchema(
  schema: z.ZodTypeAny,
  rootName = ""
): Record<string, UiHintResult> {
  const unwrapped = unwrapZodType(schema);
  if (!(unwrapped instanceof z.ZodObject)) {
    return {
      root: resolveUiHintForField(
        rootName || "root",
        schema,
        1,
        rootName || "root"
      ),
    };
  }

  const shape = unwrapped.shape;
  const results: Record<string, UiHintResult> = {};
  for (const [key, fieldDef] of Object.entries(shape)) {
    results[key] = resolveUiHintForField(key, fieldDef as z.ZodTypeAny, 1, key);
  }
  return results;
}

export function flattenUiHints(
  hints: Record<string, UiHintResult>
): Record<string, UiHintType> {
  const flattened: Record<string, UiHintType> = {};

  function traverse(node: UiHintResult) {
    flattened[node.path] = node.hint;
    if (node.children) {
      for (const child of Object.values(node.children)) {
        traverse(child);
      }
    }
    if (node.elementHint) {
      traverse(node.elementHint);
    }
  }

  for (const node of Object.values(hints)) {
    traverse(node);
  }

  return flattened;
}

export function getMaxNestingDepth(
  hints: Record<string, UiHintResult>
): number {
  let maxDepth = 1;

  function traverse(node: UiHintResult) {
    if (node.depth > maxDepth) {
      maxDepth = node.depth;
    }
    if (node.children) {
      for (const child of Object.values(node.children)) {
        traverse(child);
      }
    }
    if (node.elementHint) {
      traverse(node.elementHint);
    }
  }

  for (const node of Object.values(hints)) {
    traverse(node);
  }

  return maxDepth;
}
