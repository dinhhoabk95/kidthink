import type {
  GT024Content,
  GT024Difficulty,
} from "#src/templates/GT-024/template.js";
import { pickOne, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

interface ShapePreset {
  readonly emoji: string;
  readonly name: string;
  readonly pts: readonly number[];
}

const SHAPE_PRESETS: ShapePreset[] = [
  {
    name: "Hình tam giác",
    emoji: "🔺",
    pts: [480, 120, 680, 420, 280, 420, 480, 120],
  },
  {
    name: "Hình chữ nhật",
    emoji: "🟧",
    pts: [300, 150, 660, 150, 660, 390, 300, 390, 300, 150],
  },
  {
    name: "Hình vuông",
    emoji: "🟦",
    pts: [340, 130, 620, 130, 620, 410, 340, 410, 340, 130],
  },
  {
    name: "Hình thoi",
    emoji: "🔶",
    pts: [480, 110, 680, 270, 480, 430, 280, 270, 480, 110],
  },
  {
    name: "Ngôi sao",
    emoji: "⭐",
    pts: [480, 120, 592, 464, 299, 251, 661, 251, 368, 464, 480, 120],
  },
  {
    name: "Hình ngũ giác",
    emoji: "⬟",
    pts: [480, 110, 680, 240, 600, 430, 360, 430, 280, 240, 480, 110],
  },
  {
    name: "Hình lục giác",
    emoji: "⬡",
    pts: [380, 120, 580, 120, 680, 270, 580, 420, 380, 420, 280, 270, 380, 120],
  },
  {
    name: "Ngôi nhà",
    emoji: "🏠",
    pts: [480, 110, 660, 230, 660, 430, 300, 430, 300, 230, 480, 110],
  },
  {
    name: "Mũi tên",
    emoji: "⬆️",
    pts: [
      480, 110, 640, 240, 540, 240, 540, 430, 420, 430, 420, 240, 320, 240, 480,
      110,
    ],
  },
  { name: "Chữ V", emoji: "✌️", pts: [320, 140, 480, 420, 640, 140] },
  {
    name: "Chữ Z",
    emoji: "⚡",
    pts: [320, 140, 640, 140, 320, 420, 640, 420],
  },
  {
    name: "Số 4",
    emoji: "4️⃣",
    pts: [540, 120, 320, 320, 640, 320, 540, 120, 540, 440],
  },
];

function resolveBaseTolerance(levelDiff: number): number {
  if (levelDiff <= 2) {
    return 46;
  }
  return levelDiff <= 4 ? 38 : 32;
}

export const GT024Generator: LevelGenerator<GT024Content, GT024Difficulty> = {
  engine: "GT-024",
  axes: {
    age_band: ["5-6"],
    what: ["motor", "geometry", "path", "writing"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, escalation_step }) {
    const preset = pickOne(rng, SHAPE_PRESETS);
    const dx = rng.nextInt(41) - 20;
    const dy = rng.nextInt(25) - 12;
    const scale = (92 + rng.nextInt(15)) / 100;
    const centerX = 480;
    const centerY = 270;

    let distinctCounter = 0;
    const waypoints: GT024Content["waypoints"] = [];
    const total = Math.floor(preset.pts.length / 2);
    for (let idx = 0; idx < total; idx++) {
      const px = preset.pts[idx * 2] ?? centerX;
      const py = preset.pts[idx * 2 + 1] ?? centerY;
      const rx = Math.round(centerX + (px - centerX) * scale + dx);
      const ry = Math.round(centerY + (py - centerY) * scale + dy);
      const clampedX = Math.max(64, Math.min(896, rx));
      const clampedY = Math.max(64, Math.min(476, ry));
      const prevSame = waypoints.find(
        (w) => w.x === clampedX && w.y === clampedY
      );
      const label = prevSame ? prevSame.label : String(++distinctCounter);
      waypoints.push({
        id: `p${idx + 1}`,
        x: clampedX,
        y: clampedY,
        order: idx,
        label,
      });
    }

    const levelDiff = Math.max(1, Math.min(5, escalation_step ?? 2));
    const tolerancePx = resolveBaseTolerance(levelDiff) + rng.nextInt(7);

    return {
      content_pack: {
        prompt: `Bé hãy nối các điểm theo thứ tự để vẽ ${preset.name} nhé!`,
        shape_name: preset.name,
        guide_asset: { kind: "emoji", ref: preset.emoji },
        waypoints,
      },
      difficulty_params: {
        item_count: waypoints.length,
        tolerance_px: tolerancePx,
        show_numbered_dots: true,
        show_guide_lines: levelDiff < 5,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
