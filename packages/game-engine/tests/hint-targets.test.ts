import { describe, expect, it } from "vitest";
import type { HintTarget } from "#src/game-session";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { canAchieveBalance } from "#src/systems/balance-system";
import { GT000_FIXTURES } from "#src/templates/GT-000/fixtures";
import { GT000Session } from "#src/templates/GT-000/session";
import { SAMPLE_LEVEL_1 as GT010_SAMPLE_1 } from "#src/templates/GT-010/fixtures";
import { SubstitutionSession } from "#src/templates/GT-010/session";
import { GT011_FIXTURES } from "#src/templates/GT-011/fixtures";
import { GT011Session } from "#src/templates/GT-011/session";
import { SAMPLE_LEVEL_1 as GT012_SAMPLE_1 } from "#src/templates/GT-012/fixtures";
import { FlashRecallSession } from "#src/templates/GT-012/session";
import { SAMPLE_LEVEL_1, SAMPLE_LEVEL_2 } from "#src/templates/GT-014/fixtures";
import { BalanceScaleSession } from "#src/templates/GT-014/session";
import { SAMPLE_LEVEL_1 as GT017_SAMPLE_1 } from "#src/templates/GT-017/fixtures";
import { BlockStackSession } from "#src/templates/GT-017/session";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures";
import { GT019Session } from "#src/templates/GT-019/session";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures";
import { GT028Session } from "#src/templates/GT-028/session";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures";
import { GT032Session } from "#src/templates/GT-032/session";

/**
 * Gợi ý (`getHintTarget`) trả chỉ số trong `this.slots`. Ở stage, nhiều engine
 * xếp slot đích trước slot nguồn — trả chỉ số trong khay thì vòng sáng rơi
 * nhầm vào ô đích hoặc đĩa cân.
 */
const ZONES = computeStageZones({
  logicW: 960,
  logicH: 540,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: true,
  needsCommit: false,
});

const TRAY = ZONES.tray ?? undefined;

function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`Thiếu ${name}`);
  }
  return value;
}

function hintSlot(session: {
  getHintTarget(): HintTarget | null;
  readonly slots: readonly Slot[];
}): Slot | undefined {
  const target = session.getHintTarget();
  return target?.kind === "slot" ? session.slots[target.index] : undefined;
}

describe("GT-019: gợi ý chỉ vào mảnh ghép, không vào ô đích", () => {
  for (const [i, fixture] of GT019_FIXTURES.entries()) {
    it(`fixture ${i + 1} — stage`, () => {
      const session = new GT019Session(fixture.content, fixture.difficulty);
      session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage, TRAY);
      expect(hintSlot(session)?.role).toBe("source");
    });
  }
});

describe("GT-014: gợi ý theo mục tiêu của cân", () => {
  it("pick_heavier: chỉ vào đĩa nặng hơn (đĩa trái có dưa hấu)", () => {
    const session = new BalanceScaleSession(
      SAMPLE_LEVEL_1.content_pack,
      SAMPLE_LEVEL_1.difficulty_params
    );
    session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage, TRAY);
    const slot = hintSlot(session);
    const pans = session.targetSlots.slice().sort((a, b) => a.x - b.x);
    expect(slot).toBe(pans[0]);
  });

  it("balance: chỉ vào vật khay mà đặt xuống vẫn còn đường cân bằng", () => {
    const content = SAMPLE_LEVEL_2.content_pack;
    const session = new BalanceScaleSession(
      content,
      SAMPLE_LEVEL_2.difficulty_params
    );
    session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage, TRAY);
    const slot = hintSlot(session);
    expect(slot?.role).toBe("source");
    const trayIdx = slot ? session.sourceSlots.indexOf(slot) : -1;
    const item = content.tray[trayIdx];
    expect(item).toBeDefined();
    if (!item) {
      return;
    }
    const rest = content.tray.filter((_, j) => j !== trayIdx);
    expect(
      canAchieveBalance([...content.left_pan, item], content.right_pan, rest) ||
        canAchieveBalance(content.left_pan, [...content.right_pan, item], rest)
    ).toBe(true);
  });
});

describe("GT-000: gợi ý và vị trí mục tiêu ở bước recognise", () => {
  const fixture = required(GT000_FIXTURES[0], "fixture GT-000");

  function atRecognise(layoutSeed: number): GT000Session {
    const session = new GT000Session(
      fixture.content,
      fixture.difficulty,
      layoutSeed
    );
    session.prepareRound("4-5");
    session.currentStepIndex = session.steps.findIndex(
      (s) => s.action === "recognise"
    );
    session.resolveSlots("4-5");
    return session;
  }

  it("gợi ý trỏ đúng thực thể mục tiêu", () => {
    for (const seed of [0, 1, 2, 3, 4, 5]) {
      const session = atRecognise(seed);
      const step = session.steps[session.currentStepIndex];
      const target = session.getHintTarget();
      expect(target?.kind).toBe("slot");
      const index = target?.kind === "slot" ? target.index : -1;
      const entity = session.getView().entities[index];
      expect(step?.action === "recognise" ? step.target_asset_id : "").toBe(
        entity?.id
      );
    }
  });

  it("mục tiêu không luôn ở ô đầu", () => {
    const positions = new Set(
      Array.from({ length: 12 }, (_, seed) => {
        const session = atRecognise(seed);
        const target = session.getHintTarget();
        return target?.kind === "slot" ? target.index : -1;
      })
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("engine có nút nộp: hết vật để chỉ thì gợi ý nút (BR-PSZ-05)", () => {
  const fixture = required(GT028_FIXTURES[0], "fixture GT-028");

  function countTo(n: number): GT028Session {
    const session = new GT028Session(fixture.content, fixture.difficulty);
    session.prepareRound("5-6");
    for (const item of fixture.content.items.slice(0, n)) {
      session.commit({ type: "select_item", data: { item_id: item.item_id } });
    }
    return session;
  }

  it("GT-028: đếm vừa đủ thì gợi ý chỉ vào nút Xong", () => {
    const exact = fixture.content.target_total / fixture.content.step;
    expect(countTo(exact).getHintTarget()).toEqual({ kind: "action" });
  });

  it("GT-028: đếm vượt đích thì không gợi ý nộp", () => {
    const over = fixture.content.target_total / fixture.content.step + 1;
    expect(countTo(over).getHintTarget()?.kind).not.toBe("action");
  });
});

describe("Task #301 S4/S5: bậc thang gợi ý L1/L2/L3 cho 5 engine ưu tiên", () => {
  it("GT-010 (thay thế ký hiệu): L1/L2 khoanh vùng luật, L3 mới chỉ vào slot đáp án", () => {
    const session = new SubstitutionSession(
      GT010_SAMPLE_1.content_pack,
      GT010_SAMPLE_1.difficulty_params
    );
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, ZONES.stage, TRAY);

    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);

    expect(l1?.kind).toBe("region");
    expect(l2?.kind).toBe("region");
    expect(l1).not.toEqual(l2);
    expect(l1).not.toEqual(l3);
    expect(l3?.kind).toBe("slot");
  });

  it("GT-011 (ma trận quy luật): L1 tô hàng, L2 tô hàng + cột, L3 mới chỉ vào slot đáp án", () => {
    const fixture = required(GT011_FIXTURES[0], "fixture GT-011");
    const session = new GT011Session(fixture.content, fixture.difficulty);
    session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage, TRAY);

    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);

    expect(l1?.kind).toBe("region");
    expect(l2?.kind).toBe("region");
    expect(l1).not.toEqual(l2);
    expect(l1).not.toEqual(l3);
    expect(l3?.kind).toBe("slot");
  });

  it("GT-012 (trí nhớ chớp hình): L1 gợi ý xem lại, L2 thu gọn 2 phương án, L3 chỉ đáp án", () => {
    const session = new FlashRecallSession(
      GT012_SAMPLE_1.content_pack,
      GT012_SAMPLE_1.difficulty_params
    );
    session.prepareRound("3-4", DEFAULT_LOGIC_SPACE, ZONES.stage, TRAY);

    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);

    expect(l1?.kind).toBe("region");
    expect(l2?.kind).toBe("region");
    if (l2?.kind === "region") {
      expect(l2.ids).toHaveLength(2);
    }
    expect(l1).not.toEqual(l3);
    expect(l3?.kind).toBe("slot");
  });

  it("GT-017 (đếm khối 3D): L1 tô tầng dưới, L2 lộ khối khuất, L3 chỉ đáp án", () => {
    const session = new BlockStackSession(
      GT017_SAMPLE_1.content_pack,
      GT017_SAMPLE_1.difficulty_params
    );
    session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage, TRAY);

    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);

    expect(l1?.kind).toBe("region");
    expect(l2?.kind).toBe("region");
    expect(l1).not.toEqual(l2);
    expect(l1).not.toEqual(l3);
    expect(l3?.kind).toBe("slot");
  });

  it("GT-032 (bảo toàn dung tích): L1 hiện vạch đơn vị, L2 hiện số vạch, L3 chỉ cốc đúng", () => {
    const fixture = required(GT032_FIXTURES[0], "fixture GT-032");
    const session = new GT032Session(fixture.content, fixture.difficulty);
    session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage, TRAY);

    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);

    expect(l1?.kind).toBe("region");
    expect(l2?.kind).toBe("region");
    expect(l1).not.toEqual(l2);
    expect(l1).not.toEqual(l3);
    expect(l3?.kind).toBe("slot");
  });
});
