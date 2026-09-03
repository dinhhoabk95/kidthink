/**
 * AudioController — Master Web Audio API controller & Web Speech TTS coordinator.
 * Enforces BR-ENG-16: Master ceiling -16 LUFS, true peak <= -1 dBTP, ramp-in >= 20ms, ramp-out >= 40ms.
 * Enforces BR-ENG-10: Visual demonstration fallback when voice audio is unavailable.
 * Pure Vanilla TS — ZERO Vue / Pinia / Reactivity dependencies (BR-ENG-01).
 * Zero microphone / recording permissions (BR-CDC-04, BR-AST-04).
 */

import { SFXEngine, type SFXType } from "./sfx-engine";
import { SpeechSynthesisAdapter } from "./speech-synthesis-adapter";

export class AudioController {
  private enabled: boolean;
  private readonly sfxEngine: SFXEngine;
  private readonly speechAdapter: SpeechSynthesisAdapter;
  private readonly bufferCache: Map<string, AudioBuffer> = new Map();
  private readonly masterVolume = 0.85; // Clamped to safe ceiling (BR-ENG-16)

  constructor(enabled = true) {
    this.enabled = enabled;
    this.sfxEngine = new SFXEngine();
    this.speechAdapter = new SpeechSynthesisAdapter();
  }

  /** Enable or disable all audio output */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    const shouldMute = !enabled;
    if (shouldMute !== this.sfxEngine.muted) {
      this.sfxEngine.toggleMute();
    }
    if (!enabled) {
      this.speechAdapter.cancel();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Check if TTS voice for Vietnamese is available on this device */
  isVoiceAvailable(): boolean {
    return this.enabled && this.speechAdapter.hasVietnameseVoice();
  }

  /** Access speech adapter directly if needed */
  getSpeechAdapter(): SpeechSynthesisAdapter {
    return this.speechAdapter;
  }

  /**
   * Speak narration or prompt with automatic fallback to visual cue.
   * If speech is disabled or voice is missing, invokes fallbackVisualCue immediately.
   * Returns true if audio started, false if fallback triggered.
   */
  speakPrompt(
    text: string,
    onEnd?: () => void,
    fallbackVisualCue?: () => void
  ): boolean {
    if (!(this.enabled && this.speechAdapter.hasVietnameseVoice())) {
      fallbackVisualCue?.();
      onEnd?.();
      return false;
    }

    const started = this.speechAdapter.speak(text, {
      volume: this.masterVolume,
      onEnd,
      onError: () => {
        fallbackVisualCue?.();
        onEnd?.();
      },
    });

    if (!started) {
      fallbackVisualCue?.();
      onEnd?.();
      return false;
    }

    return true;
  }

  /** Cancel any ongoing speech or sounds */
  stopAll(): void {
    this.speechAdapter.cancel();
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

  playPromptAudio(ref?: string): void {
    if (ref) {
      this.play("tap");
    }
  }

  /** Soft amber chime on retry (BR-ENG-07 non-punitive) */
  playSoftFeedbackSound(): void {
    this.play("amber_soft");
  }

  /** Pop celebration at touch point (BR-ENG-08) */
  playPopCelebrateSound(): void {
    this.play("pop_celebrate");
  }

  /** Grand fanfare on level completion */
  playLevelCelebrateSound(): void {
    this.play("level_celebrate");
  }

  /** Tap sound on interaction */
  playTapSound(): void {
    this.play("tap");
  }

  /** Start chime sound on starting a round or session */
  playStartSound(): void {
    this.play("start_chime");
  }

  /** Soft snap sound when item locks into place */
  playSnapSound(): void {
    this.play("snap_item");
  }

  /** Whoosh return sound when item floats back to origin */
  playWhooshSound(): void {
    this.play("whoosh_return");
  }

  /** Sound on holding exit button */
  playExitSound(): void {
    this.play("longpress_exit");
  }
}
