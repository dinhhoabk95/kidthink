import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import {
  contentEntityTypeEnum,
  contentSkillMap,
  contentTagMap,
  contentTags,
} from "#src/schema/tagging";
import { skills } from "#src/schema/taxonomy";

describe("Tagging Schema Integration Tests", () => {
  it("BR-SCT-07: content_skill_map.weight must be > 0 and <= 1", async () => {
    const db = getOwnerDb();

    // Inserting weight = 1.5 must fail CHECK
    await expect(
      db.insert(contentSkillMap).values({
        entityType: "game_level",
        entityId: 1,
        skillId: 1,
        weight: "1.50",
      })
    ).rejects.toThrow();

    // Inserting weight = 0.00 must fail CHECK
    await expect(
      db.insert(contentSkillMap).values({
        entityType: "game_level",
        entityId: 1,
        skillId: 1,
        weight: "0.00",
      })
    ).rejects.toThrow();
  });

  it("BR-SCT-08: content_tag_map and content_skill_map use content_entity_type enum with 2 values", async () => {
    expect(contentEntityTypeEnum.enumValues).toEqual([
      "game_level",
      "curriculum",
    ]);

    const db = getOwnerDb();
    const [tag] = await db
      .insert(contentTags)
      .values({
        code: `tag-sct08-${Date.now()}`,
        axis: "what",
        label: "Kiểm thử BR-SCT-08",
      })
      .returning();
    if (!tag) {
      throw new Error("Failed to insert tag");
    }

    const baseEntityId = Math.floor(Math.random() * 800_000_000) + 100_000_000;
    for (const [
      idx,
      entityType,
    ] of contentEntityTypeEnum.enumValues.entries()) {
      const [row] = await db
        .insert(contentTagMap)
        .values({
          entityType,
          entityId: baseEntityId + idx,
          tagId: tag.id,
        })
        .returning();
      expect(row?.entityType).toBe(entityType);
    }
  });

  it("orphan content_tag_map.(entity_type, entity_id) polymorphic check", async () => {
    const db = getOwnerDb();

    const [tag] = await db
      .insert(contentTags)
      .values({
        code: `tag-test-${Date.now()}`,
        axis: "what",
        label: "Nhận biết số",
      })
      .returning();
    if (!tag) {
      throw new Error("Failed to insert tag");
    }

    const randomTagEntityId =
      Math.floor(Math.random() * 900_000_000) + 100_000_000;
    const [map] = await db
      .insert(contentTagMap)
      .values({
        entityType: "game_level",
        entityId: randomTagEntityId,
        tagId: tag.id,
      })
      .returning();

    expect(map).toBeDefined();
    expect(map?.entityId).toBe(randomTagEntityId);
  });

  it("orphan content_skill_map.(entity_type, entity_id) polymorphic check", async () => {
    const db = getOwnerDb();

    const [sk] = await db.select().from(skills).limit(1);

    if (sk) {
      const randomSkillEntityId =
        Math.floor(Math.random() * 900_000_000) + 100_000_000;
      const [map] = await db
        .insert(contentSkillMap)
        .values({
          entityType: "game_level",
          entityId: randomSkillEntityId,
          skillId: sk.id,
          weight: "0.80",
        })
        .returning();

      expect(map).toBeDefined();
      expect(map?.entityId).toBe(randomSkillEntityId);
    }
  });
});
