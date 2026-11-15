import {
  SFXEngine,
  type SFXType,
  SpeechSynthesisAdapter,
} from "@mindkid/game-engine";

const MARIMBA_STEPS: readonly SFXType[] = [
  "marimba_1",
  "marimba_2",
  "marimba_3",
  "marimba_4",
  "marimba_5",
];

let sharedSfx: SFXEngine | null = null;
let sharedSpeech: SpeechSynthesisAdapter | null = null;

function getSfx(): SFXEngine | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!sharedSfx) {
    sharedSfx = new SFXEngine();
  }
  return sharedSfx;
}

function getSpeech(): SpeechSynthesisAdapter | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!sharedSpeech) {
    sharedSpeech = new SpeechSynthesisAdapter();
  }
  return sharedSpeech;
}

export interface KidSoundControls {
  readonly playSfx: (type: SFXType) => void;
  readonly playMarimba: (stepIndex: number) => void;
  readonly speakVi: (text: string, chime?: SFXType) => void;
}

/**
 * Âm thanh xúc giác & giọng đọc tiếng Việt dùng chung cho bề mặt ngoài của trẻ
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
    try {
      const adapter = getSpeech();
      const didSpeak = adapter?.speak(trimmed) ?? false;
      if (!(didSpeak || chime)) {
        playMarimba(0);
      }
    } catch {
      if (!chime) {
        playMarimba(0);
      }
    }
  }

  return {
    playSfx,
    playMarimba,
    speakVi,
  };
}
