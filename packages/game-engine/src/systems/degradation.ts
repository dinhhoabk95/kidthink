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

function createDegradationTier(
  particles: boolean,
  softShadows: boolean,
  bgAnimation: boolean,
  scaffoldingPulse: boolean
): DegradationState {
  return Object.freeze({
    particles_enabled: particles,
    soft_shadows_enabled: softShadows,
    bg_animation_enabled: bgAnimation,
    scaffolding_pulse_enabled: scaffoldingPulse,
    touch_target_size_degraded: false,
    audio_channel_degraded: false,
    font_size_degraded: false,
  });
}

const DEGRADATION_TIERS = {
  full: createDegradationTier(true, true, true, true),
  noParticles: createDegradationTier(false, true, true, true),
  noShadows: createDegradationTier(false, false, true, true),
  noBgAnim: createDegradationTier(false, false, false, true),
  minimal: createDegradationTier(false, false, false, false),
} as const;

export class DegradationManager {
  currentFps = 60;

  updateFps(fps: number): DegradationState {
    this.currentFps = fps;
    if (fps >= FPS_FLOOR.particles) {
      return DEGRADATION_TIERS.full;
    }
    if (fps >= FPS_FLOOR.softShadows) {
      return DEGRADATION_TIERS.noParticles;
    }
    if (fps >= FPS_FLOOR.bgAnimation) {
      return DEGRADATION_TIERS.noShadows;
    }
    if (fps >= FPS_FLOOR.scaffoldingPulse) {
      return DEGRADATION_TIERS.noBgAnim;
    }
    return DEGRADATION_TIERS.minimal;
  }
}
