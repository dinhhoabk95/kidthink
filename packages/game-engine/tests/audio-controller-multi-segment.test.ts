import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioController } from "#src/systems/audio-controller";
import { teacherVoiceClipPaths } from "#src/systems/teacher-voice";

const STORY = "Gấu Con đi chợ.";
const PROMPT = "Chọn quả táo";

function clipOf(text: string): string {
  return teacherVoiceClipPaths(text)[0] ?? "";
}

/** Giả `Audio`: mp3 nằm trong `missing` thì `play()` reject (404), còn lại phát xong ngay. */
function stubAudio(missing: readonly string[], played: string[]): void {
  vi.stubGlobal(
    "Audio",
    class {
      volume = 1;
      currentTime = 0;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readonly pause = vi.fn();
      private readonly src: string;
      constructor(src: string) {
        this.src = src;
        played.push(src);
      }
      play(): Promise<void> {
        if (missing.includes(this.src)) {
          return Promise.reject(new Error("NotSupportedError"));
        }
        queueMicrotask(() => this.onended?.());
        return Promise.resolve();
      }
    }
  );
}

async function flush(): Promise<void> {
  for (let i = 0; i < 12; i++) {
    await Promise.resolve();
  }
}

/** `BR-PNR-06`: đoạn lỗi của câu nhiều đoạn được bỏ qua; dự phòng thị giác chỉ khi câu dẫn (đoạn cuối) lỗi. */
describe("AudioController.speakPrompt — câu nhiều đoạn (BR-PNR-06, BR-FBK-16)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("khung chuyện 404, câu dẫn ổn: câu dẫn vẫn được phát, không gọi dự phòng thị giác", async () => {
    const played: string[] = [];
    stubAudio([clipOf(STORY)], played);
    const onEnd = vi.fn();
    const cue = vi.fn();

    new AudioController(true).speakPrompt([STORY, PROMPT], onEnd, cue);
    await flush();

    expect(played).toEqual([clipOf(STORY), clipOf(PROMPT)]);
    expect(cue).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("khung chuyện ổn, câu dẫn 404: dự phòng thị giác đúng một lần", async () => {
    const played: string[] = [];
    stubAudio([clipOf(PROMPT)], played);
    const onEnd = vi.fn();
    const cue = vi.fn();

    new AudioController(true).speakPrompt([STORY, PROMPT], onEnd, cue);
    await flush();

    expect(cue).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("mọi đoạn 404: dự phòng thị giác và onEnd mỗi cái đúng một lần", async () => {
    const played: string[] = [];
    stubAudio([clipOf(STORY), clipOf(PROMPT)], played);
    const onEnd = vi.fn();
    const cue = vi.fn();

    new AudioController(true).speakPrompt([STORY, PROMPT], onEnd, cue);
    await flush();

    expect(cue).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
