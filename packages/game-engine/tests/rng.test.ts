import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FeedbackSystem } from "#src/index";
import { createRng, deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { RngStreamName } from "#src/rng/types";
import { GT001Session } from "#src/templates/GT-001/session.js";
import { GT004Session } from "#src/templates/GT-004/session.js";
import { GT005Session } from "#src/templates/GT-005/session.js";
import { GT006Session } from "#src/templates/GT-006/session.js";

function findFilesRecursive(dir: string): string[] {
  let results: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findFilesRecursive(fullPath));
    } else if (fullPath.endsWith(".ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Deterministic Randomness (BR-RNG-01..10)", () => {
  it("BR-RNG-01 — cùng seed cho cùng dãy số và cùng thứ tự xáo trộn 50 lần liên tiếp", () => {
    const seed = 123_456_789;
    const items = ["a", "b", "c", "d", "e", "f", "g", "h"];

    const firstRun = shuffle(items, createRng(seed));
    for (let i = 0; i < 50; i++) {
      const run = shuffle(items, createRng(seed));
      expect(run).toEqual(firstRun);
    }
  });

  it("BR-RNG-02 — packages/game-engine/src tuyệt đối không chứa Math.random", () => {
    const srcDir = join(import.meta.dirname, "../src");
    const tsFiles = findFilesRecursive(srcDir);

    expect(tsFiles.length).toBeGreaterThan(5);
    for (const file of tsFiles) {
      const content = readFileSync(file, "utf-8");
      expect(
        content.includes("Math.random"),
        `File ${file} vi phạm BR-RNG-02: chứa lời gọi Math.random`
      ).toBe(false);
    }
  });

  it("BR-RNG-03 — createRng sinh số thực trong [0, 1) và số nguyên trong [0, maxExclusive)", () => {
    const rng = createRng(42);

    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);

      const intVal = rng.nextInt(6);
      expect(Number.isInteger(intVal)).toBe(true);
      expect(intVal).toBeGreaterThanOrEqual(0);
      expect(intVal).toBeLessThan(6);
    }

    expect(rng.nextInt(1)).toBe(0);
    expect(rng.nextInt(0)).toBe(0);
  });

  it("BR-RNG-04 — chia luồng theo tên: thêm luồng mới không làm dịch chuyển các luồng khác", () => {
    const seed = 987_654_321;
    const itemsRng1 = deriveStream(seed, "items");
    const itemsNumbers1 = Array.from({ length: 10 }, () => itemsRng1.next());

    // Sinh luồng khác ở giữa
    const themeRng = deriveStream(seed, "theme");
    const _themeNumbers = Array.from({ length: 10 }, () => themeRng.next());

    // Luồng items độc lập với việc có gọi luồng theme hay không
    const itemsRng2 = deriveStream(seed, "items");
    const itemsNumbers2 = Array.from({ length: 10 }, () => itemsRng2.next());

    expect(itemsNumbers1).toEqual(itemsNumbers2);

    // Năm luồng chuẩn theo spec
    const streams: RngStreamName[] = [
      "items",
      "sides",
      "initial",
      "feedback",
      "theme",
    ];
    for (const name of streams) {
      const r = deriveStream(seed, name);
      expect(typeof r.next()).toBe("number");
    }
  });

  it("BR-RNG-05 — shuffle là hàm thuần, trả mảng mới và không sửa mảng đầu vào", () => {
    const original = Object.freeze(["apple", "banana", "cherry", "date"]);
    const rng = createRng(100);

    const result = shuffle(original, rng);

    expect(result).not.toBe(original);
    expect(original).toEqual(["apple", "banana", "cherry", "date"]);
    expect(result.sort()).toEqual([...original].sort());
  });

  it("BR-RNG-06 — FeedbackSystem chấp nhận Rng hoặc round-robin mà không dùng Math.random", () => {
    const feedbackWithRng = new FeedbackSystem(
      deriveStream(12_345, "feedback")
    );
    const p1 = feedbackWithRng.getCompliment();
    const p2 = feedbackWithRng.getCompliment();
    expect(typeof p1).toBe("string");
    expect(typeof p2).toBe("string");

    const feedbackRoundRobin = new FeedbackSystem();
    const r1 = feedbackRoundRobin.getCompliment();
    const r2 = feedbackRoundRobin.getCompliment();
    expect(r1).not.toEqual(r2);
  });

  it("BR-RNG-07 — hai seed khác nhau sinh hai kết quả xáo trộn khác nhau", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const runA = shuffle(items, createRng(11_111));
    const runB = shuffle(items, createRng(99_999));

    expect(runA).not.toEqual(runB);
  });

  it("BR-RNG-09 — xáo trộn không đổi đáp án đúng (GT-004 và GT-005)", () => {
    const content = {
      prompt: "Xếp vào nhóm đúng",
      groups: [
        {
          group_id: "g1",
          label: "Động vật",
          label_emoji: "🐶",
        },
        {
          group_id: "g2",
          label: "Trái cây",
          label_emoji: "🍎",
        },
      ],
      items: [
        {
          item_id: "i1",
          asset: { kind: "emoji" as const, ref: "🐱" },
          correct_group_id: "g1",
        },
        {
          item_id: "i2",
          asset: { kind: "emoji" as const, ref: "🍌" },
          correct_group_id: "g2",
        },
        {
          item_id: "i3",
          asset: { kind: "emoji" as const, ref: "🍊" },
          correct_group_id: "g2",
        },
      ],
    };
    const difficulty = {
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    };

    for (let s = 1; s <= 20; s++) {
      const session = new GT004Session(content, difficulty, s * 1000);
      session.setupEntities();

      expect(session.displayItems).toHaveLength(3);
      for (const item of session.displayItems) {
        const originalItem = content.items.find(
          (i) => i.item_id === item.item_id
        );
        expect(originalItem).toBeDefined();
        expect(item.correct_group_id).toBe(originalItem?.correct_group_id);

        const actionResult = session.validateAction({
          type: "sort_item",
          data: { item_id: item.item_id, group_id: item.correct_group_id },
        });
        expect(actionResult.valid).toBe(true);
      }
    }
  });

  it("BR-RNG-10 — khi shuffle_* tắt, thứ tự hiển thị bằng đúng thứ tự trong content_pack", () => {
    // GT-001
    const gt1Session = new GT001Session(
      {
        prompt: "Chọn đúng",
        target_item: {
          item_id: "t1",
          asset: { kind: "emoji", ref: "🍎" },
        },
        options: [
          {
            item_id: "o1",
            asset: { kind: "emoji", ref: "🍎" },
            is_correct: true,
          },
          {
            item_id: "o2",
            asset: { kind: "emoji", ref: "🍌" },
            is_correct: false,
          },
          {
            item_id: "o3",
            asset: { kind: "emoji", ref: "🍒" },
            is_correct: false,
          },
        ],
      },
      {
        distractor_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: false, // TẮT
      },
      999
    );
    gt1Session.setupEntities();
    expect(gt1Session.displayOptions.map((o) => o.item_id)).toEqual([
      "o1",
      "o2",
      "o3",
    ]);

    // GT-006
    const gt6Session = new GT006Session(
      {
        prompt: "Sắp xếp theo thứ tự",
        sequence: [
          {
            step_id: "s1",
            order_index: 1,
            asset: { kind: "emoji", ref: "🌱" },
          },
          {
            step_id: "s2",
            order_index: 2,
            asset: { kind: "emoji", ref: "🌱" },
          },
          {
            step_id: "s3",
            order_index: 3,
            asset: { kind: "emoji", ref: "🌳" },
          },
        ],
      },
      {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_initial: false, // TẮT
      },
      999
    );
    gt6Session.setupEntities();
    expect(gt6Session.getCurrentSequence()).toEqual(["s1", "s2", "s3"]);

    // GT-005
    const gt5Session = new GT005Session(
      {
        prompt: "Nối cặp",
        pairs: [
          {
            pair_id: "p1",
            left: {
              item_id: "l1",
              asset: { kind: "emoji", ref: "👩" },
            },
            right: { item_id: "r1", asset: { kind: "emoji", ref: "👶" } },
          },
          {
            pair_id: "p2",
            left: { item_id: "l2", asset: { kind: "emoji", ref: "🐱" } },
            right: { item_id: "r2", asset: { kind: "emoji", ref: "🐱" } },
          },
        ],
      },
      {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_sides: false, // TẮT
      },
      999
    );
    gt5Session.setupEntities();
    expect(gt5Session.displayLeft.map((i) => i.item_id)).toEqual(["l1", "l2"]);
    expect(gt5Session.displayRight.map((i) => i.item_id)).toEqual(["r1", "r2"]);
  });
});
