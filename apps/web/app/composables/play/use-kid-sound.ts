import { SFXEngine, type SFXType } from "@mindkid/game-engine";
import { playTeacherVoice } from "~/composables/play/teacher-voice-player";

const MARIMBA_STEPS: readonly SFXType[] = [
  "marimba_1",
  "marimba_2",
  "marimba_3",
  "marimba_4",
  "marimba_5",
];

let sharedSfx: SFXEngine | null = null;

function getSfx(): SFXEngine | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!sharedSfx) {
    sharedSfx = new SFXEngine();
  }
  return sharedSfx;
}

export interface KidSoundControls {
  readonly playSfx: (type: SFXType) => void;
  readonly playMarimba: (stepIndex: number) => void;
  readonly speakVi: (text: string, chime?: SFXType) => void;
}

/**
 * Âm thanh xúc giác & giọng cô giáo (mp3 `teacher-v1`) dùng chung cho bề mặt ngoài của trẻ
 * (`/play`, `/play/map`, `/play/stickers`, `/play/toybox`, `KidVictoryModal`).
 * Tự động im lặng an toàn trong môi trường SSR / happy-dom không có Web Audio.
 */
export function useKidSound(): KidSoundControls {
  function playSfx(type: SFXType): void {
    try {
      getSfx()?.play(type);
    } catch {
      // Bỏ qua trên môi trường thiếu AudioContext
    }
  }

  function playMarimba(stepIndex: number): void {
    const safeIndex = Math.max(0, Math.floor(stepIndex)) % MARIMBA_STEPS.length;
    const note = MARIMBA_STEPS[safeIndex] ?? "marimba_1";
    playSfx(note);
  }

  function speakVi(text: string, chime?: SFXType): void {
    if (chime) {
      playSfx(chime);
    }
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    // Giọng cô `teacher-v1` (`BR-PNR-05`); thiếu mp3 thì một nốt marimba
    // thay lời để trẻ vẫn có phản hồi âm thanh.
    const fallback = (): void => {
      if (!chime) {
        playMarimba(0);
      }
    };
    if (!playTeacherVoice(trimmed, fallback)) {
      fallback();
    }
  }

  return {
    playSfx,
    playMarimba,
    speakVi,
  };
}
