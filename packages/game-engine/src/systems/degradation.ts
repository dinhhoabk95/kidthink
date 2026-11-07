/**
 * DegradationManager — sheds visual effects as FPS drops (BR-PRF-03).
 *
 * Touch target size, audio channel, and font size are NEVER degraded: they are
 * accessibility floors, not decoration. Chỉ hạt và bóng được bỏ (BR-PRF-03):
 * nền cảnh hiện tĩnh nên chưa có nền động nào để bỏ, còn nhịp gợi ý (scaffolding)
 * là kênh phản hồi nên cấm tuột. Thêm cờ chỉ khi có code đọc nó.
 */

/** FPS below which each effect switches off, most expendable first. */
const FPS_FLOOR = {
  particles: 45,
  softShadows: 40,
} as const;

export interface DegradationState {
  particles_enabled: boolean;
  soft_shadows_enabled: boolean;
  touch_target_size_degraded: boolean;
  audio_channel_degraded: boolean;
  font_size_degraded: boolean;
}

function createDegradationTier(
  particles: boolean,
  softShadows: boolean
): DegradationState {
  return Object.freeze({
    particles_enabled: particles,
    soft_shadows_enabled: softShadows,
    touch_target_size_degraded: false,
    audio_channel_degraded: false,
    font_size_degraded: false,
  });
}

const DEGRADATION_TIERS = {
  full: createDegradationTier(true, true),
  noParticles: createDegradationTier(false, true),
  noShadows: createDegradationTier(false, false),
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
    return DEGRADATION_TIERS.noShadows;
  }
}
