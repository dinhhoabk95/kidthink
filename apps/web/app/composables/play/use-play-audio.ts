import type { GameEngine } from "@mindkid/game-engine";

export interface PlayAudioOptions {
  readonly getEngine: () => GameEngine | null;
  readonly onFallbackCue: () => void;
}

export function usePlayAudio(options: PlayAudioOptions) {
  const { getEngine, onFallbackCue } = options;
  let activeNarrationAudio: HTMLAudioElement | null = null;
  let currentInstructionAudio: string | null = null;

  function setInstructionAudio(audioPath: string | null | undefined): void {
    currentInstructionAudio = audioPath || null;
  }

  function stopNarrationAudio(): void {
    if (activeNarrationAudio) {
      try {
        activeNarrationAudio.pause();
        activeNarrationAudio.currentTime = 0;
      } catch {
        // Safe ignore
      }
      activeNarrationAudio = null;
    }
  }

  function playInstructionNarration(promptText?: string): void {
    stopNarrationAudio();
    const engine = getEngine();
    if (currentInstructionAudio) {
      try {
        const aud = new Audio(currentInstructionAudio);
        activeNarrationAudio = aud;
        aud.onended = () => {
          if (activeNarrationAudio === aud) {
            activeNarrationAudio = null;
          }
        };
        aud.play().catch(() => {
          if (promptText && engine) {
            engine.audio.speakPrompt(promptText, undefined, onFallbackCue);
          }
        });
      } catch {
        if (promptText && engine) {
          engine.audio.speakPrompt(promptText, undefined, onFallbackCue);
        }
      }
    } else if (promptText && engine) {
      engine.audio.speakPrompt(promptText, undefined, onFallbackCue);
    }
  }

  function speakErrorPrompt(): void {
    const engine = getEngine();
    if (engine) {
      engine.audio.speakPrompt(
        "Bé ơi, chưa tải được trò chơi. Bé bấm nút màu vàng để thử lại nhé!"
      );
    }
  }

  return {
    setInstructionAudio,
    stopNarrationAudio,
    playInstructionNarration,
    speakErrorPrompt,
  };
}

export async function preloadPlayAssets(
  assets: ReadonlyArray<{
    ref: string;
    kind: string;
    url?: string;
    glyph?: string;
  }>
): Promise<void> {
  const promises: Promise<void>[] = [];
  for (const asset of assets) {
    if (asset.kind === "image" && asset.url) {
      const srcUrl = asset.url;
      promises.push(
        new Promise<void>((resolve) => {
          const img = new Image();
          const timer = setTimeout(() => resolve(), 3000);
          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            resolve();
          };
          img.src = srcUrl;
        })
      );
    } else if (asset.kind === "audio" && asset.url) {
      const srcUrl = asset.url;
      promises.push(
        new Promise<void>((resolve) => {
          const aud = new Audio();
          const timer = setTimeout(() => resolve(), 3000);
          aud.oncanplaythrough = () => {
            clearTimeout(timer);
            resolve();
          };
          aud.onerror = () => {
            clearTimeout(timer);
            resolve();
          };
          aud.src = srcUrl;
        })
      );
    }
  }

  const overallTimeout = new Promise<void>((resolve) =>
    setTimeout(resolve, 5000)
  );

  await Promise.race([Promise.all(promises), overallTimeout]);
}
