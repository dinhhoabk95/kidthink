/**
 * DegradationManager — sheds visual effects as FPS drops (BR-PRF-03, BR-ERC-17).
 *
 * Touch target size, audio channel, and font size are NEVER degraded: they are
 * accessibility floors, not decoration. Thứ tự bỏ dần khi tụt FPS:
 * 1. `particles` (< 45 fps)
 * 2. `ambientMotion` (< 42 fps — mây trôi, bọt biển, sao lấp lánh ở cảnh nền)
 * 3. `softShadows` (< 40 fps)
 */

/** FPS below which each effect switches off, most expendable first. */
const FPS_FLOOR = {
  particles: 45,
  ambientMotion: 42,
  softShadows: 40,
} as const;

export interface DegradationState {
  particles_enabled: boolean;
  ambient_motion_enabled?: boolean;
  soft_shadows_enabled: boolean;
  touch_target_size_degraded: boolean;
  audio_channel_degraded: boolean;
  font_size_degraded: boolean;
}

export interface ResolvedDegradationState extends DegradationState {
  ambient_motion_enabled: boolean;
}

function createDegradationTier(
  particles: boolean,
  ambientMotion: boolean,
  softShadows: boolean
): ResolvedDegradationState {
  return Object.freeze({
    particles_enabled: particles,
    ambient_motion_enabled: ambientMotion,
    soft_shadows_enabled: softShadows,
    touch_target_size_degraded: false,
    audio_channel_degraded: false,
    font_size_degraded: false,
  });
}

const DEGRADATION_TIERS = {
  full: createDegradationTier(true, true, true),
  noParticles: createDegradationTier(false, true, true),
  noAmbientMotion: createDegradationTier(false, false, true),
  noShadows: createDegradationTier(false, false, false),
} as const;

export class DegradationManager {
  currentFps = 60;

  updateFps(fps: number): ResolvedDegradationState {
    this.currentFps = fps;
    if (fps >= FPS_FLOOR.particles) {
      return DEGRADATION_TIERS.full;
    }
    if (fps >= FPS_FLOOR.ambientMotion) {
      return DEGRADATION_TIERS.noParticles;
    }
    if (fps >= FPS_FLOOR.softShadows) {
      return DEGRADATION_TIERS.noAmbientMotion;
    }
    return DEGRADATION_TIERS.noShadows;
  }
}
