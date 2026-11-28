import { describe, expect, it, vi } from "vitest";
import type { Gesture } from "#src/interaction";
import { GT000_FIXTURES } from "#src/templates/GT-000/fixtures";
import { GT000Session } from "#src/templates/GT-000/session";
import type {
  GT000Content,
  GT000Difficulty,
} from "#src/templates/GT-000/template";

/**
 * Task #313 Phase 3 — GT-000 khớp phiếu: chạm ở `present` chỉ nghe lại, sai ở
 * `recognise`/`link` không báo sai mà chạy lại `present` của mục tiêu rồi hỏi
 * lại, thắng thì đóng phiên bằng `winSession` (`BR-E000-14`).
 */
function requireFixture(): (typeof GT000_FIXTURES)[number] {
  const first = GT000_FIXTURES[0];
  if (!first) {
    throw new Error("Fixture GT-000 not found");
  }
  return first;
}

const source = requireFixture();

function makeSession(
  content: GT000Content = source.content,
  difficulty: GT000Difficulty = source.difficulty,
  voiceEnds = true
) {
  const session = new GT000Session(content, difficulty);
  const spoken: string[] = [];
  vi.spyOn(session.audio, "speakPrompt").mockImplementation((text, onEnd) => {
    spoken.push(typeof text === "string" ? text : text.join(" "));
    if (voiceEnds) {
      onEnd?.();
    }
    return true;
  });
  vi.spyOn(session.audio, "playPromptAudio").mockImplementation(() => {
    /* mp3 — không liên quan */
  });
  session.prepareRound("3-4");
  return { session, spoken };
}

function tapEntity(session: GT000Session, id: string, timeMs = 0): Gesture {
  const e = session.getView().entities.find((x) => x.id === id);
  if (!e) {
    throw new Error(`Thiếu entity ${id}`);
  }
  return { type: "tap", x: e.x, y: e.y, timeMs };
}

function advanceTo(session: GT000Session, index: number): void {
  while (session.currentStepIndex < index) {
    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
  }
}

describe("GT-000 — present: chạm chỉ để nghe lại (BR-E000-14)", () => {
  it("chạm vào thẻ present không đi tiếp mà đọc lại tên chất liệu", () => {
    // Giọng còn đang đọc (chưa onEnd): chạm chỉ nghe lại.
    const { session, spoken } = makeSession(
      source.content,
      source.difficulty,
      false
    );
    const before = session.currentStepIndex;
    const n = spoken.length;
    session.dispatch(tapEntity(session, "num_1"));
    expect(session.currentStepIndex).toBe(before);
    expect(spoken.length).toBe(n + 1);
    expect(spoken.at(-1)).toContain("số một");
  });

  it("nút Tiếp tục (commit advance) mới đi tiếp", () => {
    const { session } = makeSession();
    const before = session.currentStepIndex;
    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    expect(session.currentStepIndex).toBe(before + 1);
  });
});

describe("GT-000 — recognise sai: không báo sai, chạy lại present rồi hỏi lại (BR-E000-14)", () => {
  const idx =
    source.content.steps?.findIndex((s) => s.action === "recognise") ?? -1;

  it("chạm sai không đặt trạng thái wrong, không đổi bước, đọc lại mục tiêu rồi hỏi lại", () => {
    const { session, spoken } = makeSession();
    advanceTo(session, idx);
    spoken.length = 0;
    session.dispatch(tapEntity(session, "num_2"));
    expect(session.currentStepIndex).toBe(idx);
    const states = session.getView().entities.map((e) => e.state);
    expect(states).not.toContain("wrong");
    session.update(1000);
    expect(session.getView().entities.map((e) => e.state)).not.toContain(
      "wrong"
    );
    expect(spoken[0]).toContain("số một");
    expect(spoken.at(-1)).toBe("Bé hãy chỉ cho cô số một nhé!");
    expect(session.isAcceptingInput()).toBe(true);
  });

  it("chạm đúng sau khi sai vẫn đi tiếp", () => {
    const { session } = makeSession();
    advanceTo(session, idx);
    session.dispatch(tapEntity(session, "num_3"));
    session.dispatch(tapEntity(session, "num_1"));
    expect(session.currentStepIndex).toBe(idx + 1);
  });
});

describe("GT-000 — link sai: không im lặng (BR-E000-14)", () => {
  const content: GT000Content = {
    concept: source.content.concept,
    assets: source.content.assets,
    steps: [
      { action: "present", target_asset_id: "num_1" },
      {
        action: "link",
        source_asset_id: "num_1",
        target_asset_id: "num_2",
        prompt_line: "Nối hai thẻ nhé",
      },
      {
        action: "recall",
        target_asset_id: "num_1",
        option_asset_ids: ["num_1", "num_2"],
      },
    ],
    requires_reintro: false,
  };

  it("nối sai chạy lại present của mục tiêu rồi hỏi lại, không đổi bước", () => {
    const { session, spoken } = makeSession(content);
    advanceTo(session, 1);
    spoken.length = 0;
    // Màn link chỉ có hai thẻ nên cử chỉ không tạo được cặp sai; ép action sai.
    session.commit({
      type: "tap_item",
      data: { source_id: "num_1", target_id: "num_3" },
    });
    expect(session.currentStepIndex).toBe(1);
    expect(spoken[0]).toContain("số hai");
    expect(spoken.at(-1)).toBe("Nối hai thẻ nhé");
    expect(session.getView().entities.map((e) => e.state)).not.toContain(
      "wrong"
    );
  });
});

describe("GT-000 — thắng đóng phiên bằng winSession (BR-E000-14)", () => {
  it("hết dãy hành động: checkWinCondition true, end_time_ms có, game_completed đúng một lần", () => {
    const { session } = makeSession();
    for (const _ of session.steps) {
      const step = session.steps[session.currentStepIndex];
      if (!step) {
        break;
      }
      if (step.action === "present" || step.action === "echo") {
        session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
      } else {
        session.dispatch(tapEntity(session, step.target_asset_id));
      }
    }
    expect(session.checkWinCondition()).toBe(true);
    const tel = session.getTelemetry();
    expect(tel.end_time_ms).toBeDefined();
    expect(
      tel.events.filter((e) => e.event_name === "game_completed")
    ).toHaveLength(1);
  });
});

describe("GT-000 — recall sai vẫn đi tiếp (spec §5 nhánh 2, BR-CIR-07)", () => {
  const content: GT000Content = {
    concept: source.content.concept,
    assets: source.content.assets,
    steps: [
      { action: "present", target_asset_id: "num_1" },
      {
        action: "recall",
        target_asset_id: "num_1",
        option_asset_ids: ["num_1", "num_2"],
      },
      {
        action: "recall",
        target_asset_id: "num_2",
        option_asset_ids: ["num_1", "num_2"],
      },
    ],
    requires_reintro: false,
  };

  it("chạm sai: không đánh dấu sai, không chấm thử lại, ghi kết quả sai rồi sang bước kế", () => {
    const { session } = makeSession(content);
    advanceTo(session, 1);
    const verdict = session.dispatch(tapEntity(session, "num_2"));
    expect(verdict?.feedback).toBe("none");
    expect(session.getView().entities.map((e) => e.state)).not.toContain(
      "wrong"
    );
    session.update(16);
    expect(session.currentStepIndex).toBe(2);
    expect(session.recallAnswers).toEqual([
      { asset_id: "num_1", correct: false },
    ]);
    const answered = session
      .getTelemetry()
      .events.filter((e) => e.event_name === "intro_recall_answered");
    expect(answered.at(-1)?.data?.answer_correct).toBe(false);
  });

  it("recall cuối sai: phiên vẫn thắng ở nhịp update kế tiếp", () => {
    const { session } = makeSession(content);
    advanceTo(session, 1);
    session.dispatch(tapEntity(session, "num_1"));
    expect(session.currentStepIndex).toBe(2);
    session.dispatch(tapEntity(session, "num_1"));
    expect(session.checkWinCondition()).toBe(false);
    session.update(16);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("chờ sang bước thì không nhận cử chỉ mới", () => {
    const { session } = makeSession(content);
    advanceTo(session, 1);
    session.dispatch(tapEntity(session, "num_2"));
    expect(session.isAcceptingInput()).toBe(false);
  });
});
