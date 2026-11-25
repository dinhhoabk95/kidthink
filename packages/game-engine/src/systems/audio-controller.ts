/**
 * AudioController — Master Web Audio API controller & teacher-voice mp3 player.
 * Enforces BR-ENG-16: Master ceiling -16 LUFS, true peak <= -1 dBTP, ramp-in >= 20ms, ramp-out >= 40ms.
 * Enforces BR-ENG-10: Visual demonstration fallback when voice audio is unavailable.
 * Giọng đọc chỉ từ kho mp3 cô giáo `teacher-v1` (`BR-PNR-05`, Task #316) —
 * không còn Web Speech API của trình duyệt.
 * Pure Vanilla TS — ZERO Vue / Pinia / Reactivity dependencies (BR-ENG-01).
 * Zero microphone / recording permissions (BR-CDC-04, BR-AST-04).
 */

import type { RetryEncouragementClip } from "./feedback-system";
import {
  SFXEngine,
  type SFXType,
  TRUE_PEAK_CEILING_LINEAR,
} from "./sfx-engine";
import { type TeacherVoiceText, teacherVoiceClipPaths } from "./teacher-voice";

/**
 * Clip giọng chưa bắt đầu phát sau mốc này thì coi như hỏng và rơi xuống tín
 * hiệu thị giác (`BR-PNR-06`, `play-narration.md` §7.2: "quá hạn 3 giây").
 */
export const VOICE_CLIP_START_TIMEOUT_MS = 3000;

const PENTATONIC_NOTES: readonly SFXType[] = Object.freeze([
  "marimba_1",
  "marimba_2",
  "marimba_3",
  "marimba_4",
  "marimba_5",
]);

export class AudioController {
  private enabled: boolean;
  private readonly sfxEngine: SFXEngine;
  private readonly bufferCache: Map<string, AudioBuffer> = new Map();
  private readonly masterVolume = TRUE_PEAK_CEILING_LINEAR; // <= -1 dBTP ceiling (BR-ENG-16)
  private currentAudio: HTMLAudioElement | null = null;
  /**
   * Kết thúc lượt giọng đang phát khi bị cắt ngang. Lượt bị cắt báo `onEnd`,
   * không báo lỗi — như giọng đọc cũ — để bên chờ settle không treo
   * (`BR-PNR-11`).
   */
  private interruptVoice: (() => void) | null = null;
  private pentatonicStep = 0;

  constructor(enabled = true) {
    this.enabled = enabled;
    this.sfxEngine = new SFXEngine();
  }

  /** Enable or disable all audio output */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    const shouldMute = !enabled;
    if (shouldMute !== this.sfxEngine.muted) {
      this.sfxEngine.toggleMute();
    }
    if (!enabled) {
      this.stopAll();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Giọng cô giáo là mp3 tĩnh: luôn sẵn khi âm thanh đang bật. */
  isVoiceAvailable(): boolean {
    return this.enabled;
  }

  /**
   * Đọc câu dẫn bằng mp3 giọng cô `teacher-v1` (`BR-PNR-05`). `text` là một câu
   * hoặc các đoạn phát nối tiếp. Clip nào lỗi (thiếu file, giải mã hỏng, bị
   * chặn tự phát) thì dừng chuỗi và rơi xuống tín hiệu thị giác
   * `fallbackVisualCue` (`BR-PNR-06`). Tín hiệu thị giác và `onEnd` mỗi cái gọi
   * đúng một lần (Task #274 S8). Trả `false` khi rơi xuống dự phòng ngay.
   */
  speakPrompt(
    text: TeacherVoiceText,
    onEnd?: () => void,
    fallbackVisualCue?: () => void
  ): boolean {
    let cued = false;
    const cueOnce = () => {
      if (!cued) {
        cued = true;
        fallbackVisualCue?.();
      }
    };
    let ended = false;
    const endOnce = () => {
      if (!ended) {
        ended = true;
        onEnd?.();
      }
    };

    const clips = teacherVoiceClipPaths(text);
    if (!this.enabled || clips.length === 0 || typeof Audio === "undefined") {
      cueOnce();
      endOnce();
      return false;
    }

    this.endInterruptedVoice();
    const finish = () => {
      if (this.interruptVoice === finish) {
        this.interruptVoice = null;
      }
      endOnce();
    };
    this.interruptVoice = finish;
    const playAt = (index: number): void => {
      const ref = clips[index];
      if (ref === undefined) {
        finish();
        return;
      }
      let failed = false;
      this.startClip(
        ref,
        () => {
          if (failed) {
            finish();
            return;
          }
          playAt(index + 1);
        },
        () => {
          failed = true;
          cueOnce();
        }
      );
    };
    playAt(0);
    return !cued;
  }

  /**
   * Câu khích lệ khi chưa đúng (`BR-FBK-13`): mp3 giọng cô đọc `clip.text`.
   * Thiếu file thì im (một giọng duy nhất, `BR-PNR-05`). `onEnd` gọi đúng một
   * lần khi xong (kể cả khi im).
   */
  speakEncouragement(clip: RetryEncouragementClip, onEnd?: () => void): void {
    if (!this.enabled) {
      onEnd?.();
      return;
    }
    this.speakPrompt(clip.text, onEnd);
  }

  /** Tạm dừng clip giọng đang phát (Task #313 B5). */
  pauseVoice(): void {
    try {
      this.currentAudio?.pause();
    } catch {
      // Safe ignore
    }
  }

  /** Phát tiếp clip giọng đã tạm dừng. */
  resumeVoice(): void {
    this.currentAudio?.play().catch(() => undefined);
  }

  /** Dừng mọi âm thanh và giải phóng `AudioContext`. */
  dispose(): void {
    this.stopAll();
    this.sfxEngine.dispose();
    this.bufferCache.clear();
  }

  /** Cancel any ongoing speech or sounds */
  stopAll(): void {
    this.endInterruptedVoice();
    this.stopCurrentClip();
  }

  private endInterruptedVoice(): void {
    const interrupted = this.interruptVoice;
    this.interruptVoice = null;
    interrupted?.();
  }

  private stopCurrentClip(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Safe ignore
      }
      this.currentAudio = null;
    }
  }

  /** Cache an AudioBuffer for fast offline playback */
  cacheAudioBuffer(key: string, buffer: AudioBuffer): void {
    this.bufferCache.set(key, buffer);
  }

  getAudioBuffer(key: string): AudioBuffer | undefined {
    return this.bufferCache.get(key);
  }

  hasAudioBuffer(key: string): boolean {
    return this.bufferCache.has(key);
  }

  clearBufferCache(): void {
    this.bufferCache.clear();
  }

  /** Play a synthesized sound effect */
  play(type: SFXType): void {
    if (!this.enabled) {
      return;
    }
    this.sfxEngine.play(type);
  }

  /**
   * Play recorded MP3 prompt audio if available.
   *
   * `onError` is the escape hatch for BR-PNR-06: the caller cannot otherwise tell
   * a finished clip from a clip that never played, so a missing file, a decode
   * error or a blocked autoplay would end in silence. Every failing branch calls
   * `onError` first so the caller can descend to the next fallback tier, then
   * `onEnd` so existing callers keep their completion signal.
   */
  playPromptAudio(
    ref?: string,
    onEnd?: () => void,
    onError?: () => void
  ): void {
    if (!(this.enabled && ref)) {
      onError?.();
      onEnd?.();
      return;
    }
    this.endInterruptedVoice();
    this.startClip(ref, onEnd, onError);
  }

  /** Phát một clip mp3, thay clip đang phát mà không kết thúc lượt giọng. */
  private startClip(
    ref: string | undefined,
    onEnd?: () => void,
    onError?: () => void
  ): void {
    if (!(this.enabled && ref)) {
      onError?.();
      onEnd?.();
      return;
    }

    this.stopCurrentClip();

    if (typeof Audio !== "undefined") {
      try {
        const audio = new Audio(ref);
        audio.volume = this.masterVolume;
        this.currentAudio = audio;

        // File hỏng phát CẢ `error` LẪN reject `play()`; một mp3 đã bị
        // `stopAll()` thay thì reject `AbortError`. Chỉ báo lỗi một lần, và
        // chỉ cho clip còn đang là clip hiện hành (Task #274, E3).
        let startTimer: ReturnType<typeof setTimeout> | null = null;
        const clearStartTimer = () => {
          if (startTimer !== null) {
            clearTimeout(startTimer);
            startTimer = null;
          }
        };
        const failAndRelease = () => {
          clearStartTimer();
          if (this.currentAudio !== audio) {
            return;
          }
          this.currentAudio = null;
          onError?.();
          onEnd?.();
        };

        audio.onended = () => {
          clearStartTimer();
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          onEnd?.();
        };

        audio.onerror = failAndRelease;

        // Mạng chậm hoặc file treo: quá hạn thì dừng clip và rơi xuống dự
        // phòng, Cấm — NEVER treo lượt giọng (`BR-PNR-06`, `BR-PNR-09`).
        startTimer = setTimeout(() => {
          startTimer = null;
          if (this.currentAudio !== audio) {
            return;
          }
          try {
            audio.pause();
          } catch {
            // Safe ignore
          }
          failAndRelease();
        }, VOICE_CLIP_START_TIMEOUT_MS);

        audio.play().then(clearStartTimer, failAndRelease);
        return;
      } catch {
        this.currentAudio = null;
      }
    }

    this.play("tap");
    onError?.();
    onEnd?.();
  }

  /** Soft amber chime on retry (BR-ENG-07 non-punitive) */
  playSoftFeedbackSound(): void {
    this.play("amber_soft");
  }

  /** Pop celebration at touch point (BR-ENG-08) */
  playPopCelebrateSound(): void {
    this.play("pop_celebrate");
  }

  /** Grand fanfare + Đàn Tranh harmonic pluck on level completion */
  playLevelCelebrateSound(): void {
    this.play("level_celebrate");
    this.playPluckedZither();
  }

  /** Warm T'rưng bamboo chime when completing an individual round */
  playRoundCompleteSound(): void {
    this.playFolkChime();
  }

  /** Tap sound on interaction */
  playTapSound(): void {
    this.play("tap");
  }

  /** Start chime sound on starting a round or session (resets pentatonic progression) */
  playStartSound(): void {
    this.pentatonicStep = 0;
    this.play("start_chime");
  }

  /** Tactile bamboo clack + ascending pentatonic marimba note when item locks into place */
  playSnapSound(): void {
    this.play("snap_item");
    this.playBambooClack();
    this.playMarimbaNote(this.pentatonicStep);
    this.pentatonicStep = (this.pentatonicStep + 1) % PENTATONIC_NOTES.length;
  }

  /** Current step (0..4) in Vietnamese pentatonic progression (Hò-Xự-Xang-Xê-Cống) */
  getPentatonicStep(): number {
    return this.pentatonicStep;
  }

  /** Reset pentatonic progression to Hò (step 0) */
  resetPentatonicStep(): void {
    this.pentatonicStep = 0;
  }

  /** Tactile wooden pickup sound on drag start */
  playWoodPickup(): void {
    this.play("wood_pickup");
  }

  /** Tactile wooden clack on magnetic target hover */
  playWoodClackSnap(): void {
    this.play("wood_clack_snap");
  }

  /** Whoosh return sound when item floats back to origin */
  playWhooshSound(): void {
    this.play("whoosh_return");
  }

  /** Sound on holding exit button */
  playExitSound(): void {
    this.play("longpress_exit");
  }

  /** Play ascending Vietnamese pentatonic T'rưng / mộc cầm note (Hò-Xự-Xang-Xê-Cống, 0..4) */
  playMarimbaNote(stepIndex: number): void {
    const safeIdx = Math.max(
      0,
      Math.min(PENTATONIC_NOTES.length - 1, Math.floor(stepIndex))
    );
    const cue = PENTATONIC_NOTES[safeIdx];
    if (cue) {
      this.play(cue);
    }
  }

  /** Play warm T'rưng bamboo chime arpeggio */
  playFolkChime(): void {
    this.play("trung_chime");
  }

  /** Play gentle plucked Đàn Tranh harmonic chime */
  playPluckedZither(): void {
    this.play("dan_tranh_pluck");
  }

  /** Play folk Trống Bỏi rattle drum cue */
  playRattleDrum(): void {
    this.play("trong_boi_rattle");
  }

  /** Play crisp Bamboo Clack (phách tre) rhythm cue */
  playBambooClack(): void {
    this.play("bamboo_clack");
  }
}
