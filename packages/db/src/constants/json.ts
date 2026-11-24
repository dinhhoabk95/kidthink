export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };

export interface JsonObject {
  readonly [key: string]: JsonValue | undefined;
}

export type JsonRecord = JsonObject;
