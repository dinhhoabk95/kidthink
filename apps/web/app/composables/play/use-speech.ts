import { onUnmounted } from "vue";
import {
  playTeacherVoice,
  stopTeacherVoice,
} from "~/composables/play/teacher-voice-player";

export interface UseSpeechReturn {
  readonly speak: (text: string) => boolean;
  readonly cancel: () => void;
}

/**
 * Đọc to câu dẫn tiếng Việt trên bề mặt trẻ (`BR-CCE-08`, `BR-ENG-10`, `BR-A11-11`)
 * bằng mp3 giọng cô `teacher-v1` (`BR-PNR-05`) — không dùng Web Speech API.
 */
export function useSpeech(): UseSpeechReturn {
  let speaking = false;

  function speak(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) {
      return false;
    }
    speaking = playTeacherVoice(trimmed);
    return speaking;
  }

  function cancel(): void {
    speaking = false;
    stopTeacherVoice();
  }

  onUnmounted(() => {
    if (speaking) {
      cancel();
    }
  });

  return { speak, cancel };
}
