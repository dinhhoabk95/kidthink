/**
 * Spring Physics — Analytical damped harmonic motion & squash-and-stretch
 * for tactile Montessori tokens, stickers, and gesture overlays (Task #314).
 *
 * Pure Vanilla TS — ZERO heap allocations on settled/reduced frames,
 * deterministic in `progress` (BR-ERC-02), respects `reducedMotion` (BR-A11-05).
 */

export interface SquashStretchScale {
  readonly scaleX: number;
  readonly scaleY: number;
}

export interface MagneticPullResult {
  readonly x: number;
  readonly y: number;
  readonly snapped: boolean;
  readonly strength: number;
}

export type TactileMotionKind = "lift" | "drop" | "bounce";

const IDENTITY_SCALE: SquashStretchScale = Object.freeze({
  scaleX: 1,
  scaleY: 1,
});

const SQUASH_AMPLITUDE: Readonly<Record<TactileMotionKind, number>> = {
  lift: 0.08,
  drop: 0.13,
  bounce: 0.1,
};

const SPRING_DAMPING = 6.2;
const SPRING_OMEGA = 8.8;
const SPRING_END_ERROR = Math.exp(-SPRING_DAMPING) * Math.cos(SPRING_OMEGA);
const SPRING_NORM = 1 / (1 - SPRING_END_ERROR);

function clampUnit(progress: number): number {
  if (Number.isNaN(progress)) {
    return 0;
  }
  if (progress <= 0) {
    return 0;
  }
  if (progress >= 1) {
    return 1;
  }
  return progress;
}

/**
 * Samples a gentle under-damped spring curve over `progress` in `[0, 1]`.
 * - At `0` → `0`, at `1` → `1`.
 * - Normal mode: warm ~9% Montessori wooden snap overshoot.
 * - `reducedMotion`: smooth monotonic cubic ease-out without oscillation.
 */
export function sampleTactileSpring(
  progress: number,
  reducedMotion: boolean
): number {
  const t = clampUnit(progress);
  if (t === 0 || t === 1) {
    return t;
  }
  if (reducedMotion) {
    const inv = 1 - t;
    return 1 - inv * inv * inv;
  }
  const raw = 1 - Math.exp(-SPRING_DAMPING * t) * Math.cos(SPRING_OMEGA * t);
  return raw * SPRING_NORM;
}

/**
 * Computes volume-preserving (`scaleX * scaleY ≈ 1`) squash-and-stretch scales.
 * Returns a shared frozen `{ scaleX: 1, scaleY: 1 }` when settled or `reducedMotion`.
 */
export function computeSquashStretch(
  progress: number,
  kind: TactileMotionKind,
  reducedMotion: boolean
): SquashStretchScale {
  const t = clampUnit(progress);
  if (reducedMotion || t === 0 || t === 1) {
    return IDENTITY_SCALE;
  }
  const amplitude = SQUASH_AMPLITUDE[kind];
  const wave = Math.exp(-5.4 * t) * Math.sin(t * Math.PI * 2.5);
  const delta = kind === "lift" ? -amplitude * wave : amplitude * wave;
  const scaleX = Math.max(0.82, Math.min(1.22, 1 + delta));
  const scaleY = 1 / scaleX;
  return { scaleX, scaleY };
}

/**
 * Computes magnetic attraction toward `(targetX, targetY)` within `snapRadius`.
 * Helps 3–6yo fingers land drops effortlessly without pixel-perfect aim (BR-LAY-08).
 */
export function computeMagneticPull(
  pointerX: number,
  pointerY: number,
  targetX: number,
  targetY: number,
  snapRadius: number
): MagneticPullResult {
  if (
    !(
      Number.isFinite(pointerX) &&
      Number.isFinite(pointerY) &&
      Number.isFinite(targetX) &&
      Number.isFinite(targetY)
    ) ||
    snapRadius <= 0
  ) {
    return { x: pointerX, y: pointerY, snapped: false, strength: 0 };
  }
  const dx = targetX - pointerX;
  const dy = targetY - pointerY;
  const dist = Math.hypot(dx, dy);
  if (dist > snapRadius) {
    return { x: pointerX, y: pointerY, snapped: false, strength: 0 };
  }
  const norm = 1 - dist / snapRadius;
  const pull = norm * norm * 0.42;
  return {
    x: pointerX + dx * pull,
    y: pointerY + dy * pull,
    snapped: true,
    strength: norm,
  };
}
