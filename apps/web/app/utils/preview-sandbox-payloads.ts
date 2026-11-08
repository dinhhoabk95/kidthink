import { loadPreviewDefault } from "@mindkid/game-engine/preview-default";
import type { AgeBand } from "@mindkid/shared/client";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface StudioUpdatePayload {
  templateCode?: string;
  levelData?: JsonObject;
  ageBand?: AgeBand;
  reducedMotion?: boolean;
  muted?: boolean;
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fixture là object thuần; qua JSON để bỏ `undefined` đúng như khi Studio gửi qua postMessage. */
function toJsonObject(source: object): JsonObject {
  const parsed: JsonValue = JSON.parse(JSON.stringify(source));
  if (!isJsonObject(parsed)) {
    throw new Error("Fixture không phải object");
  }
  return parsed;
}

/**
 * Payload mặc định khi Studio chưa gửi level: level mẫu đầu tiên của chính
 * engine, band đầu tiên template không cấm. Nạp lười nên chỉ tải fixture của mã
 * đang xem. Mã không có fixture thì ném, không bịa payload chung không hợp lệ.
 */
export async function buildDefaultPreviewPayload(
  templateCode: string
): Promise<StudioUpdatePayload> {
  const fixture = await loadPreviewDefault(templateCode);
  if (!fixture) {
    throw new Error(
      `TEMPLATE_NOT_SUPPORTED: ${templateCode} không có level mẫu`
    );
  }
  return {
    templateCode,
    ageBand: fixture.ageBand,
    levelData: {
      code: `PREVIEW-${templateCode}`,
      content_pack: toJsonObject(fixture.content),
      difficulty_params: toJsonObject(fixture.difficulty),
      theme_id: "default",
    },
  };
}
