/**
 * DegradationManager — sheds visual effects as FPS drops (BR-PRF-03).
 *
 * Touch target size, audio channel, and font size are NEVER degraded: they are
 * accessibility floors, not decoration.
 */

/** FPS below which each effect switches off, most expendable first. */
const FPS_FLOOR = {
  particles: 45,
  softShadows: 40,
  bgAnimation: 35,
  scaffoldingPulse: 30,
} as const;

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
    return {
      particles_enabled: fps >= FPS_FLOOR.particles,
      soft_shadows_enabled: fps >= FPS_FLOOR.softShadows,
      bg_animation_enabled: fps >= FPS_FLOOR.bgAnimation,
      scaffolding_pulse_enabled: fps >= FPS_FLOOR.scaffoldingPulse,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
  }
}
