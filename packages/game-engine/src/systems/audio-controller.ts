import { SFXEngine } from "./sfx-engine";

export class AudioController {
  private enabled: boolean;
  private readonly sfxEngine = new SFXEngine();

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    const shouldMute = !enabled;
    if (shouldMute !== this.sfxEngine.muted) {
      this.sfxEngine.toggleMute();
    }
  }

  playPromptAudio(_ref?: string): void {
    if (!(this.enabled && _ref)) {
      return;
    }
    this.sfxEngine.play("tap");
  }

  playSoftFeedbackSound(): void {
    if (!this.enabled) {
      return;
    }
    // Soft amber non-punitive chime (BR-ENG-07)
    this.sfxEngine.play("amber_soft");
  }

  playPopCelebrateSound(): void {
    if (!this.enabled) {
      return;
    }
    // Pop celebrate sound at touch point (BR-ENG-08)
    this.sfxEngine.play("pop_celebrate");
  }

  playLevelCelebrateSound(): void {
    if (!this.enabled) {
      return;
    }
    // Grand celebration sound at level completion (BR-ENG-08)
    this.sfxEngine.play("level_celebrate");
  }
}
