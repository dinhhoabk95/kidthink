/**
 * Âm đề tự phát khi mở vòng (GT-018 `auto_play_audio`, `BR-E018-05`): sau khi
 * câu dẫn của vòng đọc xong, đọc chữ âm đề đúng một lần rồi mới `settle` để mở
 * cử chỉ. Không có âm đề (cờ tắt, engine khác) thì `settle` ngay.
 */
export interface OpeningAudioSource {
  getOpeningAudioText?: () => string | null;
}

export type OpeningAudioSpeaker = (
  text: string,
  onEnd: () => void,
  onError: () => void
) => void;

export function playOpeningAudioThenSettle(
  source: OpeningAudioSource | null | undefined,
  speak: OpeningAudioSpeaker,
  settle: () => void
): void {
  const text = source?.getOpeningAudioText?.() ?? null;
  if (!text) {
    settle();
    return;
  }
  let done = false;
  const finish = (): void => {
    if (!done) {
      done = true;
      settle();
    }
  };
  speak(text, finish, finish);
}
