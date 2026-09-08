import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { DEFAULT_LOGIC_SPACE, type LogicSpace } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { RoundRunner } from "#src/round-runner";

class FakeResponsiveSession extends TemplateGameSession<
  Record<string, number>,
  Record<string, number>
> {
  override setupEntities(): void {
    // noop
  }

  override validateAction(_a: GameAction): ActionResult {
    return ACTION_CORRECT;
  }

  override checkWinCondition(): boolean {
    return true;
  }

  protected override computeSlots(_band: AgeBand): readonly Slot[] {
    return [
      {
        index: 0,
        role: "source",
        x: this.logicSpace.w / 2,
        y: this.logicSpace.h / 2,
        w: 80,
        h: 80,
        hitW: 80,
        hitH: 80,
        page: 0,
      },
    ];
  }
}

describe("RoundRunner logicSpace propagation (T6, BR-RSP & Task #260)", () => {
  it("truyền logicSpace từ options vào cả vòng 1 và sang tận vòng 2", () => {
    const portraitSpace: LogicSpace = { h: 1168, w: 540 };

    const createdSessions: FakeResponsiveSession[] = [];
    const runner = new RoundRunner({
      rounds: [
        {
          round_index: 0,
          content_pack: { round: 1 },
          difficulty_params: {},
        },
        {
          round_index: 1,
          content_pack: { round: 2 },
          difficulty_params: {},
        },
      ],
      ageBand: "3-4",
      logicSpace: portraitSpace,
      sessionFactory: (contentPack, difficultyParams, seed) => {
        const sess = new FakeResponsiveSession(
          contentPack as Record<string, number>,
          difficultyParams as Record<string, number>,
          seed
        );
        createdSessions.push(sess);
        return sess;
      },
    });

    runner.startFirstRound();
    const session1 = runner.getCurrentSession() as FakeResponsiveSession;
    expect(session1).toBeDefined();
    expect(session1.logicSpace).toEqual(portraitSpace);
    expect(session1.logicSpace).not.toEqual(DEFAULT_LOGIC_SPACE);

    // Chuyển sang vòng 2 — đây là chỗ lỗi cũ giữ DEFAULT_LOGIC_SPACE
    const hasMore = runner.completeCurrentRound();
    expect(hasMore).toBe(true);

    const session2 = runner.getCurrentSession() as FakeResponsiveSession;
    expect(session2).toBeDefined();
    expect(session2).not.toBe(session1);
    expect(session2.logicSpace).toEqual(portraitSpace);
    expect(session2.logicSpace).not.toEqual(DEFAULT_LOGIC_SPACE);
  });

  it("setLogicSpace cập nhật ngay lập tức cho session hiện tại và session vòng kế tiếp", () => {
    const initialSpace: LogicSpace = { h: 1000, w: 540 };
    const resizedSpace: LogicSpace = { h: 1200, w: 540 };

    const runner = new RoundRunner({
      rounds: [
        {
          round_index: 0,
          content_pack: { round: 1 },
          difficulty_params: {},
        },
        {
          round_index: 1,
          content_pack: { round: 2 },
          difficulty_params: {},
        },
      ],
      ageBand: "4-5",
      logicSpace: initialSpace,
      sessionFactory: (contentPack, difficultyParams, seed) => {
        return new FakeResponsiveSession(
          contentPack as Record<string, number>,
          difficultyParams as Record<string, number>,
          seed
        );
      },
    });

    runner.startFirstRound();
    const session1 = runner.getCurrentSession() as FakeResponsiveSession;
    expect(session1.logicSpace).toEqual(initialSpace);

    // Giả lập xoay máy / resize
    runner.setLogicSpace(resizedSpace);
    expect(session1.logicSpace).toEqual(resizedSpace);
    expect(session1.slots[0]?.y).toBe(600); // 1200 / 2

    // Chuyển sang vòng 2 vẫn giữ resizedSpace
    runner.completeCurrentRound();
    const session2 = runner.getCurrentSession() as FakeResponsiveSession;
    expect(session2.logicSpace).toEqual(resizedSpace);
  });
});
