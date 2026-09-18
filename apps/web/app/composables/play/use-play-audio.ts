import type { GameEngine } from "@mindkid/game-engine";

export interface PlayAudioOptions {
  readonly getEngine: () => GameEngine | null;
  readonly onFallbackCue: () => void;
}

/**
 * Trần dự phòng của cả chuỗi phát câu dẫn (`BR-PNR-09`): mp3 + TTS cộng lại
 * không được vượt mốc này trước khi `onSettled` buộc phải gọi. Không bậc nào
 * — kể cả khi cả mp3 và TTS đều không bao giờ báo xong — được phép treo vô
 * hạn, vì `onSettled` là tín hiệu bề mặt chơi dùng để mở lại cử chỉ
 * (`BR-PNR-11`).
 */
const NARRATION_SETTLE_TIMEOUT_MS = 12_000;

export function usePlayAudio(options: PlayAudioOptions) {
  const { getEngine, onFallbackCue } = options;
  let activeNarrationAudio: HTMLAudioElement | null = null;
  let currentInstructionAudio: string | null = null;
  let pendingSettleTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Settle của lượt đang chờ (nếu có) — `stopNarrationAudio` phải gọi nó
   * trước khi dừng/thay câu dẫn, không chỉ hủy timer. `<audio>.pause()`
   * Cấm — NEVER tự phát `onended`, nên nếu không gọi tay ở đây, lượt bị cắt
   * ngang (ví dụ trẻ bấm "Nghe lại" giữa lúc câu dẫn mở vòng còn đang phát)
   * sẽ không bao giờ báo xong — `engine.acceptingInput` kẹt `false` mãi
   * (`BR-PNR-11`).
   */
  let pendingSettleCallback: (() => void) | null = null;

  function setInstructionAudio(audioPath: string | null | undefined): void {
    currentInstructionAudio = audioPath || null;
  }

  function clearPendingSettleTimer(): void {
    if (pendingSettleTimer !== null) {
      clearTimeout(pendingSettleTimer);
      pendingSettleTimer = null;
    }
  }

  function stopNarrationAudio(): void {
    clearPendingSettleTimer();
    const previousSettle = pendingSettleCallback;
    pendingSettleCallback = null;
    previousSettle?.();

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

  /**
   * Phát câu dẫn vòng, đi qua ba bậc dự phòng của `play-narration.md` §7.2.
   *
   * `onSettled` — nếu có — gọi ĐÚNG MỘT LẦN khi chuỗi phát đã tới điểm cuối:
   * mp3 phát xong, TTS đọc xong, tín hiệu thị giác đã kích hoạt, hoặc quá
   * hạn `NARRATION_SETTLE_TIMEOUT_MS` (Cấm — NEVER treo vô hạn, `BR-PNR-09`).
   * Bề mặt chơi dùng tín hiệu này để mở lại `engine.acceptingInput` và gọi
   * `RoundRunner.notePromptSettled()` (`BR-PNR-11`).
   */
  function playInstructionNarration(
    promptText?: string,
    onSettled?: () => void
  ): void {
    stopNarrationAudio();
    const engine = getEngine();

    let settled = false;
    const settleOnce = () => {
      if (settled) {
        return;
      }
      settled = true;
      clearPendingSettleTimer();
      if (pendingSettleCallback === settleOnce) {
        pendingSettleCallback = null;
      }
      onSettled?.();
    };
    if (onSettled) {
      pendingSettleCallback = settleOnce;
      pendingSettleTimer = setTimeout(settleOnce, NARRATION_SETTLE_TIMEOUT_MS);
    }

    const speakOrSettle = () => {
      if (promptText && engine) {
        engine.audio.speakPrompt(promptText, settleOnce, () => {
          onFallbackCue();
          settleOnce();
        });
        return;
      }
      settleOnce();
    };

    if (currentInstructionAudio) {
      try {
        const aud = new Audio(currentInstructionAudio);
        activeNarrationAudio = aud;
        aud.onended = () => {
          if (activeNarrationAudio === aud) {
            activeNarrationAudio = null;
          }
          settleOnce();
        };
        aud.onerror = () => {
          if (activeNarrationAudio === aud) {
            activeNarrationAudio = null;
          }
          speakOrSettle();
        };
        aud.play().catch(() => {
          speakOrSettle();
        });
      } catch {
        speakOrSettle();
      }
    } else {
      speakOrSettle();
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
