import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  getGameTemplate,
  preloadGameSession,
  validateContentPack,
} from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import {
  buildDefaultPreviewPayload,
  type JsonObject,
  type JsonValue,
} from "../../app/utils/preview-sandbox-payloads";

const ERROR_STATE_RULE = /\.error-state\s*\{[^}]*\}/;

function isPack(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Phase 24 mục 9: payload mặc định của preview-sandbox phải hợp lệ cho cả 37
 * template, không chỉ vài mã có payload viết tay. Trước đó trang tải lại ra
 * banner `CONTENT_PACK_INVALID` ở GT-000/010/020/021/026/027/036/037...
 */
describe("preview-sandbox payload mặc định", () => {
  it("phủ cả 38 mã GT-000..GT-037", () => {
    expect(ALL_TEMPLATE_CODES.length).toBe(38);
  });

  it.each(ALL_TEMPLATE_CODES)(
    "%s: content pack hợp lệ, band không bị cấm, dựng được session",
    async (code) => {
      const payload = await buildDefaultPreviewPayload(code);
      const levelData = payload.levelData ?? {};
      const result = validateContentPack(code, levelData.content_pack);
      const detail = result.success
        ? ""
        : JSON.stringify(result.error.details ?? result.error.message);
      expect(result.success, detail.slice(0, 300)).toBe(true);

      const banned: readonly string[] =
        getGameTemplate(code)?.banned_age_bands ?? [];
      expect(banned).not.toContain(payload.ageBand);

      const difficulty = levelData.difficulty_params;
      if (!(isPack(levelData.content_pack) && isPack(difficulty))) {
        throw new Error("payload thiếu content_pack hoặc difficulty_params");
      }
      await preloadGameSession(code);
      const session = createGameSessionSync(code, {
        level_code: String(levelData.code),
        content_version: 1,
        template_code: code,
        content_pack: levelData.content_pack,
        difficulty_params: difficulty,
        theme_id: "default",
        age_band: payload.ageBand ?? "3-4",
        reduced_motion: false,
        audio_enabled: true,
      });
      expect(session).toBeDefined();
    }
  );

  it("mã lạ không có level mẫu thì ném lỗi rõ ràng", async () => {
    await expect(buildDefaultPreviewPayload("GT-999")).rejects.toThrow(
      "TEMPLATE_NOT_SUPPORTED"
    );
  });
});

describe("preview-sandbox .error-state", () => {
  it("chuỗi dài không có khoảng trắng xuống dòng thay vì tràn khỏi hộp", () => {
    const source = readFileSync(
      path.resolve(
        import.meta.dirname,
        "../../app/pages/play/preview-sandbox.vue"
      ),
      "utf8"
    );
    const block = ERROR_STATE_RULE.exec(source)?.[0] ?? "";
    expect(block).toContain("overflow-wrap: anywhere");
  });
});
