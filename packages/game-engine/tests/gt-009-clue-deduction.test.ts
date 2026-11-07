import { describe, expect, it } from "vitest";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures.js";
import { GT009Session } from "#src/templates/GT-009/session.js";
import GT009Template, {
  GT009BaseSchema,
  GT009ContentSchema,
  GT009DifficultySchema,
} from "#src/templates/GT-009/template";

function getFixture<T>(fixtures: readonly T[], index: number): T {
  const item = fixtures[index];
  if (!item) {
    throw new Error(`Fixture at index ${index} not found`);
  }
  return item;
}

const FIRST = getFixture(GT009_FIXTURES, 0);
const SECOND = getFixture(GT009_FIXTURES, 1);
const THIRD = getFixture(GT009_FIXTURES, 2);

function newSession(index = 1): GT009Session {
  const fixture = GT009_FIXTURES[index] ?? FIRST;
  const session = new GT009Session(fixture.content, fixture.difficulty);
  session.setupEntities();
  return session;
}

describe("GT-009 — contract loại trừ theo manh mối (BR-MTB-06, BR-GTC-03)", () => {
  it("ba level mẫu parse được bằng cả hai contract", () => {
    for (const fixture of GT009_FIXTURES) {
      expect(GT009ContentSchema.safeParse(fixture.content).success).toBe(true);
      expect(GT009DifficultySchema.safeParse(fixture.difficulty).success).toBe(
        true
      );
    }
    expect(GT009_FIXTURES.length).toBeGreaterThanOrEqual(3);
  });

  it("ca âm: bộ manh mối để lại hai ứng viên thì refine chặn", () => {
    const result = GT009ContentSchema.safeParse({
      ...FIRST.content,
      clues: [
        {
          clue_id: "k1",
          text: "Số này lớn hơn 1",
          predicate: { kind: "greater_than", value: 1 },
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("đúng một ứng viên");
  });

  it("ca âm: answer_candidate_id không phải ứng viên sống sót thì refine chặn", () => {
    const result = GT009ContentSchema.safeParse({
      ...FIRST.content,
      answer_candidate_id: "c1",
    });

    expect(result.success).toBe(false);
  });

  it("ca âm: vị ngữ lạ bị union phân biệt từ chối", () => {
    const result = GT009ContentSchema.safeParse({
      ...FIRST.content,
      clues: [
        {
          clue_id: "k1",
          text: "Số này màu đỏ",
          predicate: { kind: "is_red", value: 1 },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("BR-GTC-03: không key độ khó nào nằm trong content_contract", () => {
    const difficultyKeys = Object.keys(GT009DifficultySchema.shape);
    const contentKeys = Object.keys(GT009BaseSchema.shape);

    for (const key of difficultyKeys) {
      expect(contentKeys).not.toContain(key);
    }
  });

  it("khai đúng band, layout và không fallback tap", () => {
    expect(GT009Template.age_min).toBe(4);
    expect(GT009Template.age_max).toBe(6);
    expect(GT009Template.layouts).toEqual(["clue-board"]);
    expect(GT009Template.requires_tap_fallback).toBe(false);
    expect(GT009Template.mechanic).toBe("clue-deduction");
  });

  it("band 4-5 giữ bảng tối đa 6 ứng viên (BR-MCM-08)", () => {
    for (const fixture of GT009_FIXTURES) {
      expect(fixture.content.candidates.length).toBeLessThanOrEqual(6);
      expect(fixture.difficulty.candidate_count).toBe(
        fixture.content.candidates.length
      );
    }
  });
});

describe("GT-009 — kiểm soát lỗi tự thân (BR-MTB-14)", () => {
  it("chạm manh mối gạch ứng viên vi phạm, ứng viên gạch vẫn nằm trong nội dung", () => {
    const session = newSession(1);

    expect(session.getEliminatedIds()).toEqual([]);
    session.onClueRevealed("k1"); // bé hơn 5 → loại 5 và 6

    expect([...session.getEliminatedIds()].sort()).toEqual(["c5", "c6"]);
    expect([...session.getSurvivingIds()].sort()).toEqual(["c1", "c2", "c4"]);
    // Ứng viên bị loại vẫn hiển thị được: nội dung không bị cắt hàng nào
    expect(session.content.candidates).toHaveLength(5);
  });

  it("trẻ tự thu hẹp tới đáp án trước khi hệ thống báo bất kỳ điều gì", () => {
    const session = newSession(1);

    session.onClueRevealed("k1");
    session.onClueRevealed("k2");
    session.onClueRevealed("k3");

    expect(session.getSurvivingIds()).toEqual(["c4"]);
    // Chưa có phản hồi đúng sai nào: chỉ có clue_revealed và candidate_eliminated
    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(new Set(names)).toEqual(
      new Set(["clue_revealed", "candidate_eliminated"])
    );
    expect(session.checkWinCondition()).toBe(false);
  });

  it("lật lại một manh mối đã lật không sinh thêm event", () => {
    const session = newSession(1);

    session.onClueRevealed("k1");
    const afterFirst = session.getTelemetry().events.length;
    session.onClueRevealed("k1");

    expect(session.getTelemetry().events).toHaveLength(afterFirst);
    expect(session.getRevealedClueIds()).toEqual(["k1"]);
  });

  it("manh mối lạ bị bỏ qua, không gạch ứng viên nào", () => {
    const session = newSession(1);

    session.onClueRevealed("khong-ton-tai");

    expect(session.getRevealedClueIds()).toEqual([]);
    expect(session.getEliminatedIds()).toEqual([]);
  });
});

describe("GT-009 — journey một phiên đầy đủ (điều kiện nghiệm thu 6, 7, 13)", () => {
  it("lật ba manh mối, tự loại trừ, rồi chạm đáp án và thắng", () => {
    const session = newSession(2);

    for (const clue of THIRD.content.clues) {
      session.onClueRevealed(clue.clue_id);
    }
    expect(session.getSurvivingIds()).toEqual(["c4"]);

    const wrong = session.validateAction({
      type: "tap_option",
      data: { item_id: "c5" },
    });
    expect(wrong.valid).toBe(false);
    expect(wrong.feedback).not.toBe("none");

    session.onCandidateSelected("c4");
    expect(session.checkWinCondition()).toBe(true);

    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(names).toContain("clue_revealed");
    expect(names).toContain("candidate_eliminated");
  });

  it("BR-GTC-09: checkWinCondition thuần — gọi 100 lần cho cùng kết quả", () => {
    const session = newSession(1);
    session.onClueRevealed("k1");

    const before = session.getEliminatedIds().length;
    for (let i = 0; i < 100; i++) {
      expect(session.checkWinCondition()).toBe(false);
    }
    expect(session.getEliminatedIds()).toHaveLength(before);
    expect(
      session.getTelemetry().events.map((e) => e.event_name)
    ).not.toContain("game_completed");
  });

  it("setupEntities dựng lại phiên sạch", () => {
    const session = newSession(1);
    session.onClueRevealed("k1");
    session.onCandidateSelected("c4");

    session.setupEntities();

    expect(session.getRevealedClueIds()).toEqual([]);
    expect(session.getEliminatedIds()).toEqual([]);
    expect(session.checkWinCondition()).toBe(false);
  });

  it("một manh mối duy nhất cũng đủ chốt đáp án ở level mẫu đầu", () => {
    const session = new GT009Session(FIRST.content, FIRST.difficulty);
    session.setupEntities();

    session.onClueRevealed("k1");
    expect(session.getSurvivingIds()).toEqual(["c5"]);

    session.onCandidateSelected("c5");
    expect(session.checkWinCondition()).toBe(true);
  });

  it("level mẫu thứ hai dùng cả bốn loại vị ngữ trong lô", () => {
    const kinds = new Set(
      GT009_FIXTURES.flatMap((f) =>
        f.content.clues.map((c) => c.predicate.kind)
      )
    );
    expect(kinds).toEqual(
      new Set(["greater_than", "less_than", "not_equal", "between"])
    );
    expect(SECOND.content.clues).toHaveLength(3);
  });
});

describe("GT-009 — ba bậc gợi ý (điều kiện nghiệm thu 15)", () => {
  it("L1 trỏ vào manh mối chưa dùng và nêu đúng nhóm sẽ bị gạch", () => {
    const session = newSession(1);

    const l1 = session.getScaffoldHint(1);
    expect(l1?.clue_id).toBe("k1");
    expect([...(l1?.eliminates ?? [])].sort()).toEqual(["c5", "c6"]);
    expect(l1?.ghost_hand).toBe(false);
    expect(l1?.slow_repeat).toBe(false);
  });

  it("gợi ý chuyển sang manh mối kế tiếp sau khi trẻ lật manh mối trước", () => {
    const session = newSession(1);
    session.onClueRevealed("k1");

    expect(session.getScaffoldHint(2)?.clue_id).toBe("k2");
    expect(session.getScaffoldHint(2)?.ghost_hand).toBe(true);
    expect(session.getScaffoldHint(3)?.slow_repeat).toBe(true);
  });

  it("hết manh mối chưa dùng thì gợi ý trỏ vào manh mối cuối, không trả null", () => {
    const session = newSession(1);
    for (const clue of SECOND.content.clues) {
      session.onClueRevealed(clue.clue_id);
    }

    const hint = session.getScaffoldHint(3);
    expect(hint?.clue_id).toBe("k3");
    expect(hint?.eliminates).toEqual([]);
  });
});

describe("GT-009 — Montessori 2-Phase Explore & Control of Error", () => {
  it("chuyển pha Explore -> Challenge sau 2 thao tác lật manh mối", () => {
    const session = newSession(1);
    session.startExplorePhase();
    expect(session.getExploreTracker().getPhase()).toBe("explore");

    session.onClueRevealed("k1");
    expect(session.getExploreTracker().getPhase()).toBe("explore");
    expect(session.getExploreTracker().getExploreActionsCount()).toBe(1);

    session.onClueRevealed("k2");
    expect(session.getExploreTracker().getPhase()).toBe("challenge");
    expect(session.getExploreTracker().getExploreActionsCount()).toBe(2);
  });

  it("findViolatedClueForCandidate trả về manh mối đầu tiên loại ứng viên sai và tự lật manh mối khi vào Micro-Sandbox", () => {
    const session = newSession(1);

    const violatedForC5 = session.findViolatedClueForCandidate("c5");
    expect(violatedForC5?.clue_id).toBe("k1");
    expect(session.findViolatedClueForCandidate("c4")).toBeNull();

    // Lần chọn sai 1 (chưa lật manh mối k1)
    session.onCandidateSelected("c5");
    expect(session.isMicroSandboxActive()).toBe(false);
    expect(session.getControlOfError()?.reasonVi).toBe(
      "Chưa khớp manh mối: Số này bé hơn 5"
    );
    expect(session.getControlOfError()?.targetId).toBe("k1");
    expect(session.getRevealedClueIds()).toEqual([]);

    // Lần chọn sai 2 liên tiếp -> kích hoạt Micro-Sandbox + tự động lật manh mối k1 và gạch c5, c6
    session.onCandidateSelected("c6");
    expect(session.isMicroSandboxActive()).toBe(true);
    expect(session.getRevealedClueIds()).toContain("k1");
    expect([...session.getEliminatedIds()].sort()).toEqual(["c5", "c6"]);

    // Chọn đúng -> thoát Micro-Sandbox và xoá chẩn đoán lỗi
    session.onCandidateSelected("c4");
    expect(session.isMicroSandboxActive()).toBe(false);
    expect(session.getControlOfError()).toBeNull();
    expect(session.checkWinCondition()).toBe(true);
  });
});

describe("GT-009 — loại trừ theo thuộc tính phi số (has_attribute / not_attribute)", () => {
  const ATTRIBUTE_PACK = {
    prompt: "Lật manh mối để tìm con vật bí ẩn nhé!",
    candidates: [
      {
        candidate_id: "cat",
        value: 1,
        asset: { kind: "emoji" as const, ref: "🐱" },
        attributes: { habitat: "land", diet: "meat", legs: "4" },
      },
      {
        candidate_id: "rabbit",
        value: 2,
        asset: { kind: "emoji" as const, ref: "🐰" },
        attributes: { habitat: "land", diet: "plant", legs: "4" },
      },
      {
        candidate_id: "duck",
        value: 3,
        asset: { kind: "emoji" as const, ref: "🦆" },
        attributes: { habitat: "water", diet: "plant", legs: "2" },
      },
      {
        candidate_id: "fish",
        value: 4,
        asset: { kind: "emoji" as const, ref: "🐟" },
        attributes: { habitat: "water", diet: "meat", legs: "0" },
      },
    ],
    clues: [
      {
        clue_id: "attr-1",
        text: "Sống trên cạn",
        predicate: {
          kind: "has_attribute" as const,
          key: "habitat",
          attr_value: "land",
        },
      },
      {
        clue_id: "attr-2",
        text: "Không ăn thịt",
        predicate: {
          kind: "not_attribute" as const,
          key: "diet",
          attr_value: "meat",
        },
      },
    ],
    answer_candidate_id: "rabbit",
  };

  it("schema chấp nhận manh mối thuộc tính khi thu hẹp về đúng 1 ứng viên và từ chối khi còn > 1 ứng viên", () => {
    expect(GT009ContentSchema.safeParse(ATTRIBUTE_PACK).success).toBe(true);
    const ambiguous = {
      ...ATTRIBUTE_PACK,
      clues: ATTRIBUTE_PACK.clues.slice(0, 1),
    };
    expect(GT009ContentSchema.safeParse(ambiguous).success).toBe(false);
  });

  it("phiên chơi loại trừ dần theo thuộc tính và chốt đúng ứng viên duy nhất", () => {
    const parsed = GT009ContentSchema.parse(ATTRIBUTE_PACK);
    const session = new GT009Session(parsed, FIRST.difficulty);
    session.setupEntities();

    session.onClueRevealed("attr-1");
    expect(session.getSurvivingIds()).toEqual(["cat", "rabbit"]);
    expect([...session.getEliminatedIds()].sort()).toEqual(["duck", "fish"]);

    session.onClueRevealed("attr-2");
    expect(session.getSurvivingIds()).toEqual(["rabbit"]);
    expect([...session.getEliminatedIds()].sort()).toEqual([
      "cat",
      "duck",
      "fish",
    ]);

    session.onCandidateSelected("rabbit");
    expect(session.checkWinCondition()).toBe(true);
  });
});
