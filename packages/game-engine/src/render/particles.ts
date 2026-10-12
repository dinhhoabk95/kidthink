import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { Particle } from "#src/systems/render-system";

const PARTICLE_COLORS = [
  designTokens.colors.semantic.success[400],
  designTokens.colors.cta[400],
  designTokens.colors.brand[400],
] as const;

/**
 * Máy có bật "giảm chuyển động" hay không (BR-FBK-09).
 * Đọc trực tiếp `matchMedia` vì hạt được sinh trong `validateAction`/`commit`,
 * nơi không có `RenderSystem` để hỏi.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  );
}

export function spawnParticlesAtSlot(slot: Slot, count: number): Particle[] {
  const particles: Particle[] = [];
  // Giảm mật độ ở CHỖ SINH. Bỏ bớt lúc vẽ (`i += 2`) thì hạt vẫn được mô phỏng
  // mà không bao giờ hiện — tốn công và vẫn đủ chuyển động.
  const total = prefersReducedMotion()
    ? Math.max(1, Math.ceil(count / 2))
    : count;
  for (let i = 0; i < total; i++) {
    const angle = (Math.PI * 2 * i) / total;
    const spread = 1.5 + ((i * 7 + 3) % 5) * 0.4;
    particles.push({
      x: slot.x,
      y: slot.y,
      vx: Math.cos(angle) * spread,
      vy: Math.sin(angle) * spread,
      color:
        PARTICLE_COLORS[i % PARTICLE_COLORS.length] ??
        designTokens.colors.semantic.success[400],
      size: 3 + ((i * 3 + 1) % 4),
      life: 1,
      maxLife: 1,
    });
  }
  return particles;
}

const PARTICLE_GRAVITY = 0.05;

const PARTICLE_DECAY = 0.02;

/**
 * Bước một khung hạt — trả mảng MỚI, ❌ NEVER sửa hạt tại chỗ.
 *
 * Bản trước cộng dồn thẳng vào `p.x`/`p.life` rồi mới lọc, nên cùng một mảng bị
 * chia sẻ giữa `renderParticles` của session và bất kỳ ai còn giữ tham chiếu —
 * replay và snapshot test đọc phải trạng thái đã trôi.
 */
export function updateParticles(particles: readonly Particle[]): Particle[] {
  const next: Particle[] = [];
  for (const p of particles) {
    const life = p.life - PARTICLE_DECAY;
    if (life <= 0) {
      continue;
    }
    next.push({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + PARTICLE_GRAVITY,
      life,
    });
  }
  return next;
}
