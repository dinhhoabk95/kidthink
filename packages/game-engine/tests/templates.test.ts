import { describe, expect, it } from "vitest";
import {
  GT001Session,
  GT002Session,
  GT003Session,
  GT004Session,
  GT005Session,
  GT006Session,
  GT007Session,
  GT008Session,
  InteractionManager,
} from "#src/index";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
import { GT007_FIXTURES } from "#src/templates/GT-007/fixtures.js";
import { GT008_FIXTURES } from "#src/templates/GT-008/fixtures.js";

function getFixture<T>(fixtures: readonly T[], index: number): T {
  const item = fixtures[index];
  if (!item) {
    throw new Error(`Fixture at index ${index} not found`);
  }
  return item;
}

const GT001_FIXTURE_0 = getFixture(GT001_FIXTURES, 0);
const GT007_FIXTURE_0 = getFixture(GT007_FIXTURES, 0);
const GT008_FIXTURE_0 = getFixture(GT008_FIXTURES, 0);

describe("Task 6 & Task 7 — All 6 Template Sessions & Kid Surface Rules", () => {
  it("GT-001 (tap-select): completes session upon correct selection", () => {
    const session = new GT001Session(
      GT001_FIXTURE_0.content,
      GT001_FIXTURE_0.difficulty
    );
    session.setupEntities();

    const res = session.validateAction({
      type: "tap_option",
      data: { item_id: "apple_opt" },
    });
    expect(res.valid).toBe(true);
    expect(res.feedback).toBe("pop_celebrate");

    session.onItemLocked("apple_opt");
    expect(session.checkWinCondition()).toBe(true);
  });

  it("GT-002 (tap-select-multi): toggles choices and completes session on submit", () => {
    const content = {
      prompt: "Chọn các quả màu đỏ",
      target_criterion: "Màu đỏ",
      items: [
        {
          item_id: "i1",
          asset: { kind: "emoji" as const, ref: "🍎" },
          is_correct: true,
        },
        {
          item_id: "i2",
          asset: { kind: "emoji" as const, ref: "🍓" },
          is_correct: true,
        },
        {
          item_id: "i3",
          asset: { kind: "emoji" as const, ref: "🍌" },
          is_correct: false,
        },
      ],
    };
    const difficulty = {
      distractor_count: 1,
      target_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    };
    const session = new GT002Session(content, difficulty);
    session.setupEntities();

    session.toggleItemSelection("i1");
    session.toggleItemSelection("i2");

    session.onSubmitSelection();
    expect(session.checkWinCondition()).toBe(true);
  });

  it("GT-003 (drag-to-container): supports drag drop and tap-tap fallback", () => {
    const content = {
      prompt: "Kéo rác vào thùng",
      container: {
        container_id: "bin_1",
        label: "Thùng rác",
        accepts_attribute: "trash",
      },
      items: [
        {
          item_id: "paper",
          attribute: "trash",
          asset: { kind: "emoji" as const, ref: "📄" },
          is_correct: true,
        },
        {
          item_id: "apple_core",
          attribute: "trash",
          asset: { kind: "emoji" as const, ref: "🍏" },
          is_correct: true,
        },
      ],
    };
    const difficulty = {
      distractor_count: 0,
      target_count: 2,
      hint_after_ms: 6000,
      allow_retry: true,
    };
    const session = new GT003Session(content, difficulty);
    session.setupEntities();

    const im = new InteractionManager();
    const tapRes = im.handleTapTapFallback("paper", "bin_1");
    expect(tapRes).toBeNull(); // First tap selects source

    const tapRes2 = im.handleTapTapFallback("paper", "bin_1");
    expect(tapRes2).toEqual({ source_id: "paper", target_id: "bin_1" });

    session.onItemDropped("paper", "bin_1");
    session.onItemDropped("apple_core", "bin_1");
    expect(session.checkWinCondition()).toBe(true);
  });

  it("GT-004 (sort-groups): sorts items into matching groups", () => {
    const content = {
      prompt: "Phân loại động vật và thực vật",
      groups: [
        { group_id: "g1", label: "Động vật", label_emoji: "🐶" },
        { group_id: "g2", label: "Thực vật", label_emoji: "🌻" },
      ],
      items: [
        {
          item_id: "dog",
          asset: { kind: "emoji" as const, ref: "🐶" },
          correct_group_id: "g1",
        },
        {
          item_id: "cat",
          asset: { kind: "emoji" as const, ref: "🐱" },
          correct_group_id: "g1",
        },
        {
          item_id: "flower",
          asset: { kind: "emoji" as const, ref: "🌻" },
          correct_group_id: "g2",
        },
        {
          item_id: "tree",
          asset: { kind: "emoji" as const, ref: "🌲" },
          correct_group_id: "g2",
        },
      ],
    };
    const difficulty = {
      distractor_count: 0,
      hint_after_ms: 8000,
      allow_retry: true,
      shuffle_items: true,
    };
    const session = new GT004Session(content, difficulty);
    session.setupEntities();

    session.onItemSorted("dog", "g1");
    session.onItemSorted("cat", "g1");
    session.onItemSorted("flower", "g2");
    session.onItemSorted("tree", "g2");

    expect(session.checkWinCondition()).toBe(true);
  });

  it("GT-005 (pair-match): pairs left and right items", () => {
    const content = {
      prompt: "Nối mẹ và con",
      pairs: [
        {
          pair_id: "p1",
          left: {
            item_id: "dog_mom",
            asset: { kind: "emoji" as const, ref: "🐶" },
          },
          right: {
            item_id: "puppy",
            asset: { kind: "emoji" as const, ref: "🐶" },
          },
        },
        {
          pair_id: "p2",
          left: {
            item_id: "cat_mom",
            asset: { kind: "emoji" as const, ref: "🐱" },
          },
          right: {
            item_id: "kitten",
            asset: { kind: "emoji" as const, ref: "🐱" },
          },
        },
      ],
    };
    const difficulty = {
      hint_after_ms: 6000,
      allow_retry: true,
      shuffle_sides: true,
    };
    const session = new GT005Session(content, difficulty);
    session.setupEntities();

    session.onPairMatched("dog_mom", "puppy");
    session.onPairMatched("cat_mom", "kitten");
    expect(session.checkWinCondition()).toBe(true);
  });

  it("GT-006 (sequence-order): orders steps in sequence", () => {
    const content = {
      prompt: "Sắp xếp quy trình trồng cây",
      sequence: [
        {
          step_id: "s1",
          order_index: 0,
          asset: { kind: "emoji" as const, ref: "🌱" },
        },
        {
          step_id: "s2",
          order_index: 1,
          asset: { kind: "emoji" as const, ref: "🪴" },
        },
        {
          step_id: "s3",
          order_index: 2,
          asset: { kind: "emoji" as const, ref: "🌳" },
        },
      ],
    };
    const difficulty = {
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_initial: false,
    };
    const session = new GT006Session(content, difficulty);
    session.setupEntities();

    session.onSubmitSequence();
    expect(session.checkWinCondition()).toBe(true);
  });

  it("BR-ENG-07: wrong answer produces amber_soft non-punitive feedback", () => {
    const session = new GT001Session(
      GT001_FIXTURE_0.content,
      GT001_FIXTURE_0.difficulty
    );
    session.setupEntities();

    const res = session.validateAction({
      type: "tap_option",
      data: { item_id: "banana_opt" },
    });
    expect(res.valid).toBe(false);
    expect(res.feedback).toBe("amber_soft"); // Non-punitive amber soft feedback
  });

  it("BR-ENG-07 (negative): wrong answer NEVER returns 'none' feedback", () => {
    const session = new GT001Session(
      GT001_FIXTURE_0.content,
      GT001_FIXTURE_0.difficulty
    );
    session.setupEntities();

    const wrongItems = GT001_FIXTURE_0.content.options.filter(
      (o) => !o.is_correct
    );
    for (const item of wrongItems) {
      const res = session.validateAction({
        type: "tap_option",
        data: { item_id: item.item_id },
      });
      expect(res.feedback).not.toBe("none");
      expect(res.feedback).toBeDefined();
    }
  });

  it("GT-007 (number-bond): completes session when correct part is filled", () => {
    const session = new GT007Session(
      GT007_FIXTURE_0.content,
      GT007_FIXTURE_0.difficulty
    );
    session.setupEntities();

    const wrongRes = session.validateAction({
      type: "tap_option",
      data: { option_id: "o1" },
    });
    expect(wrongRes.valid).toBe(false);

    const correctRes = session.validateAction({
      type: "tap_option",
      data: { option_id: "o2" },
    });
    expect(correctRes.valid).toBe(true);

    session.onPartFilled("o2", "p2");
    expect(session.checkWinCondition()).toBe(true);
  });

  it("GT-008 (drag-to-slot): completes session when all slots are correctly filled", () => {
    const session = new GT008Session(
      GT008_FIXTURE_0.content,
      GT008_FIXTURE_0.difficulty
    );
    session.setupEntities();

    const wrongRes = session.validateAction({
      type: "place_item",
      data: { item_id: "car_2", slot_id: "s1" },
    });
    expect(wrongRes.valid).toBe(false);

    session.onItemPlaced("car_1", "s1");
    session.onItemPlaced("car_2", "s2");
    session.onItemPlaced("car_3", "s3");
    expect(session.checkWinCondition()).toBe(true);
  });
});
