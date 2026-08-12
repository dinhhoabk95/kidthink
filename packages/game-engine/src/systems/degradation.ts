export interface DegradationState {
  particles_enabled: boolean;
  soft_shadows_enabled: boolean;
  bg_animation_enabled: boolean;
  scaffolding_pulse_enabled: boolean;
  touch_target_size_degraded: boolean;
  audio_channel_degraded: boolean;
  font_size_degraded: boolean;
}

export class DegradationManager {
  currentFps = 60;

  updateFps(fps: number): DegradationState {
    this.currentFps = fps;
    const state: DegradationState = {
      particles_enabled: true,
      soft_shadows_enabled: true,
      bg_animation_enabled: true,
      scaffolding_pulse_enabled: true,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };

    if (fps < 45) {
      state.particles_enabled = false;
    }
    if (fps < 40) {
      state.soft_shadows_enabled = false;
    }
    if (fps < 35) {
      state.bg_animation_enabled = false;
    }
    if (fps < 30) {
      state.scaffolding_pulse_enabled = false;
    }

    // Touch targets, audio channel, font size MUST NEVER be degraded (BR-PRF-03)
    return state;
  }
}
