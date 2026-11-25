import { type TeacherVoiceText, withStoryLine } from "@mindkid/game-engine";
import {
  type OpeningAudioSource,
  playOpeningAudioThenSettle,
} from "~/composables/play/opening-audio";

/**
 * Lượt đọc mở vòng dùng chung cho bề mặt không có `RoundRunner` (Studio
 * preview, `BR-FBK-16` + `BR-E018-05`): khung chuyện của session (nếu có)
 * đứng trước câu dẫn trong cùng một lượt phát, rồi âm đề tự phát (GT-018).
 * Trang chơi thật đi qua `RoundRunner.spokenPromptFor`; cả hai ghép bằng
 * cùng `withStoryLine` của engine nên không có hai nguồn quy tắc.
 */
export interface RoundOpenSource extends OpeningAudioSource {
  storyLine?: () => string | null;
}

export type RoundOpenSpeaker = (
  text: TeacherVoiceText,
  onEnd: () => void,
  onError: () => void
) => void;

export interface RoundOpenOptions {
  /**
   * `false` khi đây không phải lần mở đầu của lượt xem (preview tự chơi lại
   * sau thắng): khung chuyện chỉ kể một lần (`BR-FBK-16`), câu dẫn vẫn đọc.
   */
  tellStory?: boolean;
  settle?: () => void;
}

export function composeRoundOpenSpeech(
  source: RoundOpenSource | null | undefined,
  prompt: string,
  tellStory = true
): TeacherVoiceText {
  return withStoryLine(tellStory ? source?.storyLine?.() : null, prompt);
}

export function playRoundOpenNarration(
  source: RoundOpenSource | null | undefined,
  prompt: string | null | undefined,
  speak: RoundOpenSpeaker,
  options: RoundOpenOptions = {}
): void {
  const settle = options.settle ?? (() => undefined);
  // `AudioController.speakPrompt` báo lỗi bằng `onError` RỒI `onEnd` — chặn
  // để âm đề không bị đọc hai lần khi câu dẫn lỗi hoặc không có giọng.
  let advanced = false;
  const afterPrompt = (): void => {
    if (advanced) {
      return;
    }
    advanced = true;
    playOpeningAudioThenSettle(source, speak, settle);
  };
  if (!prompt) {
    afterPrompt();
    return;
  }
  speak(
    composeRoundOpenSpeech(source, prompt, options.tellStory ?? true),
    afterPrompt,
    afterPrompt
  );
}
