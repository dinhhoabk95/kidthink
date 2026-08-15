import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  flattenUiHints,
  getMaxNestingDepth,
  introspectZodSchema,
  resolveUiHintForField,
} from "../src/zod-introspect";

describe("zodIntrospect — Schema to uiHint Engine (BR-SDF-02, BR-SDF-08, Spec §7.1)", () => {
  it("covers all 12 rows in Spec §7.1 with exact precedence", () => {
    // 1. _emoji or emoji -> emoji
    const emojiField = resolveUiHintForField("avatar_emoji", z.string());
    expect(emojiField.hint).toBe("emoji");
    const bareEmoji = resolveUiHintForField("emoji", z.string());
    expect(bareEmoji.hint).toBe("emoji");

    // 2. _image or _path or image or path -> image
    const imageField = resolveUiHintForField("thumbnail_image", z.string());
    expect(imageField.hint).toBe("image");
    const pathField = resolveUiHintForField("asset_path", z.string());
    expect(pathField.hint).toBe("image");

    // 3. _color -> color
    const colorField = resolveUiHintForField("card_color", z.string());
    expect(colorField.hint).toBe("color");

    // 4. _audio or _audio_ref -> audio
    const audioField = resolveUiHintForField("prompt_audio_ref", z.string());
    expect(audioField.hint).toBe("audio");

    // 5. _ms or _seconds -> duration
    const durationField = resolveUiHintForField(
      "hint_after_ms",
      z.number().int().min(5000).max(30_000)
    );
    expect(durationField.hint).toBe("duration");
    expect(durationField.min).toBe(5000);
    expect(durationField.max).toBe(30_000);

    // 6. Zod string with max > 200 or no max -> textarea
    const longString = resolveUiHintForField(
      "description",
      z.string().max(500)
    );
    expect(longString.hint).toBe("textarea");
    const unconstrainedString = resolveUiHintForField("notes", z.string());
    expect(unconstrainedString.hint).toBe("textarea");

    // 7. Zod enum -> select
    const enumField = resolveUiHintForField(
      "status",
      z.enum(["draft", "published", "archived"])
    );
    expect(enumField.hint).toBe("select");
    expect(enumField.options).toEqual(["draft", "published", "archived"]);

    // 8. Zod boolean -> toggle
    const boolField = resolveUiHintForField("is_active", z.boolean());
    expect(boolField.hint).toBe("toggle");

    // 9. Zod number with min/max -> slider
    const sliderField = resolveUiHintForField(
      "item_count",
      z.number().int().min(2).max(10)
    );
    expect(sliderField.hint).toBe("slider");
    expect(sliderField.min).toBe(2);
    expect(sliderField.max).toBe(10);

    // 10. Zod array -> array
    const arrayField = resolveUiHintForField(
      "tags",
      z.array(z.string().max(20))
    );
    expect(arrayField.hint).toBe("array");
    expect(arrayField.elementHint?.hint).toBe("text");

    // 11. Zod object -> object
    const objectField = resolveUiHintForField(
      "profile",
      z.object({
        display_name: z.string().max(50),
        avatar_emoji: z.string(),
      })
    );
    expect(objectField.hint).toBe("object");
    expect(objectField.children?.display_name?.hint).toBe("text");
    expect(objectField.children?.avatar_emoji?.hint).toBe("emoji");

    // 12. Fallback -> text
    const textField = resolveUiHintForField("title", z.string().max(100));
    expect(textField.hint).toBe("text");
  });

  it("BR-SDF-02: infers from naming conventions before Zod raw types", () => {
    // Number typed field named 'speed_ms' -> duration, not slider
    const speed = resolveUiHintForField(
      "speed_ms",
      z.number().min(100).max(5000)
    );
    expect(speed.hint).toBe("duration");

    // String typed field named 'target_emoji' -> emoji, not text
    const targetEmoji = resolveUiHintForField("target_emoji", z.string());
    expect(targetEmoji.hint).toBe("emoji");
  });

  it("calculates nesting depth accurately up to 3 levels (D-JU)", () => {
    const schema = z.object({
      groups: z.array(
        z.object({
          group_id: z.string().max(10),
          items: z.array(
            z.object({
              item_id: z.string().max(10),
            })
          ),
        })
      ),
    });

    const hints = introspectZodSchema(schema);
    const depth = getMaxNestingDepth(hints);
    expect(depth).toBe(3);
  });

  it("flattens uiHints correctly", () => {
    const schema = z.object({
      prompt: z.string().max(80),
      label_emoji: z.string(),
      allow_retry: z.boolean(),
    });

    const hints = introspectZodSchema(schema);
    const flattened = flattenUiHints(hints);
    expect(flattened).toEqual({
      prompt: "text",
      label_emoji: "emoji",
      allow_retry: "toggle",
    });
  });
});
