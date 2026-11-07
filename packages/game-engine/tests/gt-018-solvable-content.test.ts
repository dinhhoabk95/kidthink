import { describe, expect, it } from "vitest";
import { GT018_FIXTURES } from "#src/templates/GT-018/fixtures";
import { GT018ContentSchema } from "#src/templates/GT-018/template";

const PROMPT = "Bé hãy nghe rồi làm theo nhé!";

function option(id: string, isCorrect = false) {
  return {
    item_id: id,
    asset: { kind: "emoji", ref: "🍎" },
    is_correct: isCorrect,
  };
}

function selectContent(correct: boolean[]) {
  return {
    prompt: PROMPT,
    audio_prompt: { text: "Chọn quả táo" },
    response_mode: "select",
    options: correct.map((c, i) => option(`o${i}`, c)),
  };
}

function sequenceContent(options: string[], target: string[] | undefined) {
  return {
    prompt: PROMPT,
    audio_prompt: { text: "Xếp theo thứ tự" },
    response_mode: "sequence",
    target_sequence: target,
    options: options.map((id) => option(id)),
  };
}

describe("GT-018: level phải giải được", () => {
  it("select không có đáp án đúng nào bị từ chối", () => {
    expect(
      GT018ContentSchema.safeParse(selectContent([false, false])).success
    ).toBe(false);
  });

  it("select mà mọi lựa chọn đều đúng bị từ chối (không còn gì để phân biệt)", () => {
    expect(
      GT018ContentSchema.safeParse(selectContent([true, true])).success
    ).toBe(false);
  });

  it("select có 1 đáp án đúng trong 2 lựa chọn được chấp nhận", () => {
    expect(
      GT018ContentSchema.safeParse(selectContent([true, false])).success
    ).toBe(true);
  });

  it("sequence thiếu target_sequence bị từ chối", () => {
    expect(
      GT018ContentSchema.safeParse(sequenceContent(["a", "b"], undefined))
        .success
    ).toBe(false);
  });

  it("sequence có id không tồn tại trong options bị từ chối", () => {
    expect(
      GT018ContentSchema.safeParse(sequenceContent(["a", "b"], ["b", "z"]))
        .success
    ).toBe(false);
  });

  it("sequence lặp id bị từ chối", () => {
    expect(
      GT018ContentSchema.safeParse(sequenceContent(["a", "b"], ["a", "a"]))
        .success
    ).toBe(false);
  });

  it("sequence đã xếp sẵn đúng thứ tự ban đầu bị từ chối", () => {
    expect(
      GT018ContentSchema.safeParse(
        sequenceContent(["a", "b", "c"], ["a", "b", "c"])
      ).success
    ).toBe(false);
  });

  it("sequence hợp lệ (khác thứ tự ban đầu) được chấp nhận", () => {
    expect(
      GT018ContentSchema.safeParse(
        sequenceContent(["a", "b", "c"], ["c", "a", "b"])
      ).success
    ).toBe(true);
  });

  it("mọi fixture có sẵn vẫn hợp lệ", () => {
    for (const fixture of GT018_FIXTURES) {
      expect(GT018ContentSchema.safeParse(fixture.content).success).toBe(true);
    }
  });
});
