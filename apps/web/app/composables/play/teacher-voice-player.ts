import {
  type TeacherVoiceText,
  teacherVoiceClipPaths,
} from "@mindkid/game-engine";

/**
 * Bộ phát mp3 giọng cô `teacher-v1` cho bề mặt trẻ ngoài màn chơi (bản đồ,
 * sticker, toybox, huy hiệu) — cùng kho và cùng hàm băm với `AudioController`
 * của engine (`BR-PNR-05`). Một lượt mỗi lúc: lượt mới cắt lượt cũ.
 */

interface TeacherVoiceTurn {
  readonly clips: readonly string[];
  index: number;
  element: HTMLAudioElement | null;
  readonly onError?: () => void;
}

let activeTurn: TeacherVoiceTurn | null = null;

function playClip(turn: TeacherVoiceTurn): void {
  const ref = turn.clips[turn.index];
  if (ref === undefined) {
    if (activeTurn === turn) {
      activeTurn = null;
    }
    return;
  }
  const element = new Audio(ref);
  turn.element = element;
  let failed = false;
  const fail = (): void => {
    if (failed || activeTurn !== turn || turn.element !== element) {
      return;
    }
    failed = true;
    activeTurn = null;
    turn.onError?.();
  };
  element.onended = () => {
    if (activeTurn !== turn || turn.element !== element) {
      return;
    }
    turn.index += 1;
    playClip(turn);
  };
  element.onerror = fail;
  element.play().catch(fail);
}

/** Dừng lượt giọng cô đang phát (nếu có). */
export function stopTeacherVoice(): void {
  const turn = activeTurn;
  activeTurn = null;
  if (turn?.element) {
    try {
      turn.element.pause();
    } catch {
      // Bỏ qua lỗi trình duyệt khi dừng phát
    }
  }
}

/**
 * Phát câu (hoặc các đoạn nối tiếp) bằng mp3 giọng cô. Trả `false` khi không
 * phát được ngay (SSR, câu rỗng); clip lỗi về sau báo qua `onError`.
 */
export function playTeacherVoice(
  text: TeacherVoiceText,
  onError?: () => void
): boolean {
  const clips = teacherVoiceClipPaths(text);
  if (clips.length === 0 || typeof Audio === "undefined") {
    return false;
  }
  stopTeacherVoice();
  const turn: TeacherVoiceTurn = { clips, index: 0, element: null, onError };
  activeTurn = turn;
  try {
    playClip(turn);
  } catch {
    activeTurn = null;
    return false;
  }
  return true;
}
