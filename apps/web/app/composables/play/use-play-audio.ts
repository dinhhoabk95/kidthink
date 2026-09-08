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
        "Bé ơi, chưa tải được trò chơi. Bé bấm nút màu vàng để thử lại nhé!",
        undefined,
        onFallbackCue
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

const ASSET_TIMEOUT_MS = 3000;
const OVERALL_TIMEOUT_MS = 5000;

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
          // Cấm — NEVER resolve im lặng: asset treo (không load, không error)
          // là ca thường gặp nhất và trước đây không để lại dấu nào.
          const timer = setTimeout(() => {
            console.warn(`[preload] Hết hạn chờ hình ảnh: ${srcUrl}`);
            resolve();
          }, ASSET_TIMEOUT_MS);
          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            console.warn(`[preload] Không tải được hình ảnh: ${srcUrl}`);
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
          const timer = setTimeout(() => {
            console.warn(`[preload] Hết hạn chờ âm thanh: ${srcUrl}`);
            resolve();
          }, ASSET_TIMEOUT_MS);
          aud.oncanplaythrough = () => {
            clearTimeout(timer);
            resolve();
          };
          aud.onerror = () => {
            console.warn(`[preload] Không tải được âm thanh: ${srcUrl}`);
            clearTimeout(timer);
            resolve();
          };
          aud.src = srcUrl;
        })
      );
    }
  }

  let overallTimer: ReturnType<typeof setTimeout> | undefined;
  const overallTimeout = new Promise<void>((resolve) => {
    overallTimer = setTimeout(resolve, OVERALL_TIMEOUT_MS);
  });

  await Promise.race([Promise.all(promises), overallTimeout]);
  if (overallTimer) {
    clearTimeout(overallTimer);
  }
}
