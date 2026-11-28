import { describe, expect, it, vi } from "vitest";
import type { Gesture } from "#src/interaction";
import { GT000_FIXTURES } from "#src/templates/GT-000/fixtures.js";
import { GT000Session } from "#src/templates/GT-000/session.js";
import { collectRenderedText } from "../helpers/rendered-text.ts";
import { NUMERAL_PROGRESS_BADGE } from "../render/fixtures/progress-badge-numeral.ts";

const FIXTURE = GT000_FIXTURES[0] ?? failMissingFixture();
const PROGRESS_NUMERAL = /\d+\s*\/\s*\d+/;

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-000");
}

type VoiceEnd = (() => void) | undefined;

interface VoiceHarness {
  readonly session: GT000Session;
  /** Kết thúc mọi lượt giọng đang treo (giả lập onEnd của audio). */
  finishVoice(): void;
}

/** Giọng đọc treo cho tới khi `finishVoice()` — mô phỏng audio thật đang phát. */
function openSession(): VoiceHarness {
  const session = new GT000Session(FIXTURE.content, FIXTURE.difficulty);
  const pending: VoiceEnd[] = [];
  vi.spyOn(session.audio, "speakPrompt").mockImplementation((_t, onEnd) => {
    pending.push(onEnd);
    return true;
  });
  vi.spyOn(session.audio, "playPromptAudio").mockImplementation(
    (_ref, onEnd) => {
      pending.push(onEnd);
    }
  );
  session.prepareRound("3-4");
  return {
    session,
    finishVoice: () => {
      for (const end of pending.splice(0)) {
        end?.();
      }
    },
  };
}

function tapCard(session: GT000Session): Gesture {
  const e = session.getView().entities[0];
  if (!e) {
    throw new Error("Thiếu thẻ");
  }
  return { type: "tap", x: e.x, y: e.y, timeMs: 0 };
}

describe("GT-000 present/echo: chạm thẻ sau khi đọc xong thì sang thẻ kế (BR-E000-14)", () => {
  it("đang đọc: chạm thẻ chỉ nghe lại, không đổi bước", () => {
    const { session } = openSession();
    const before = session.currentStepIndex;

    session.dispatch(tapCard(session));

    expect(session.currentStepIndex).toBe(before);
  });

  it("đã đọc xong một lần: chạm thẻ sang bước kế", () => {
    const { session, finishVoice } = openSession();
    const before = session.currentStepIndex;
    finishVoice();

    session.dispatch(tapCard(session));

    expect(session.currentStepIndex).toBe(before + 1);
  });

  it("lượt giọng cũ bị ngắt bởi nghe lại không tính là đã đọc xong bước mới", () => {
    const { session, finishVoice } = openSession();
    finishVoice();
    session.dispatch(tapCard(session));
    const next = session.currentStepIndex;

    session.dispatch(tapCard(session));

    expect(session.currentStepIndex).toBe(next);
  });

  it("nút Tiếp tục vẫn đi tiếp bất kể giọng", () => {
    const { session } = openSession();
    const before = session.currentStepIndex;

    session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });

    expect(session.currentStepIndex).toBe(before + 1);
  });

  it("recognise giữ hành vi cũ: chạm đúng vật mới tính, không phải sang bước tự do", () => {
    const { session, finishVoice } = openSession();
    const steps = FIXTURE.content.steps ?? [];
    const idx = steps.findIndex((s) => s.action === "recognise");
    while (session.currentStepIndex < idx) {
      session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    }
    finishVoice();
    const step = steps[idx];
    const wrong = session
      .getView()
      .entities.find((e) => e.id !== step?.target_asset_id);
    if (!wrong) {
      throw new Error("Thiếu vật sai");
    }

    session.dispatch({ type: "tap", x: wrong.x, y: wrong.y, timeMs: 0 });

    expect(session.currentStepIndex).toBe(idx);
  });
});

describe("GT-000: không vẽ chữ số tiến độ trang sách (BR-RSP-10)", () => {
  it("mẫu vi phạm 3/5 bị bộ phát hiện bắt", () => {
    expect(PROGRESS_NUMERAL.test(NUMERAL_PROGRESS_BADGE)).toBe(true);
  });

  it("khung vẽ không chứa chuỗi dạng n/m", () => {
    const { session } = openSession();
    const drawn = collectRenderedText(session, { prepare: false });

    expect(drawn.filter((t) => PROGRESS_NUMERAL.test(t))).toEqual([]);
  });
});
