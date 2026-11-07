import { describe, expect, it } from "vitest";
import { GT018_FIXTURES } from "#src/templates/GT-018/fixtures.js";
import { GT018Session } from "#src/templates/GT-018/session.js";

/** BR-E018-05 — `auto_play_audio` quyết định âm đề có tự phát khi mở vòng hay không. */
function missing(): never {
  throw new Error("Missing GT018 fixture");
}
const fixture = GT018_FIXTURES[0] ?? missing();

function build(autoPlay: boolean): GT018Session {
  const session = new GT018Session(fixture.content, {
    ...fixture.difficulty,
    auto_play_audio: autoPlay,
  });
  session.prepareRound("4-5");
  return session;
}

describe("GT-018: auto_play_audio (BR-E018-05)", () => {
  it("bật: trả chữ audio_prompt để bề mặt chơi đọc sau câu dẫn", () => {
    expect(build(true).getOpeningAudioText()).toBe(
      fixture.content.audio_prompt.text
    );
  });

  it("tắt: không tự phát", () => {
    expect(build(false).getOpeningAudioText()).toBeNull();
  });

  it("tắt: máy hát vẫn đọc được audio_prompt khi trẻ chạm", () => {
    const gramophone = build(false)
      .getView()
      .entities.find((e) => e.id === "gramophone");
    expect(gramophone?.spokenLabel).toBe(fixture.content.audio_prompt.text);
  });
});
