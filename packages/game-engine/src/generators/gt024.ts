import { getNouns, pickOne, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

interface ShapePreset {
  name: string;
  points: Array<{ x: number; y: number }>;
}

const SHAPE_PRESETS: ShapePreset[] = [
  {
    name: "Hình tam giác",
    points: [
      { x: 480, y: 120 },
      { x: 680, y: 420 },
      { x: 280, y: 420 },
      { x: 480, y: 120 },
    ],
  },
  {
    name: "Hình chữ nhật",
    points: [
      { x: 300, y: 150 },
      { x: 660, y: 150 },
      { x: 660, y: 390 },
      { x: 300, y: 390 },
      { x: 300, y: 150 },
    ],
  },
  {
    name: "Hình vuông",
    points: [
      { x: 340, y: 130 },
      { x: 620, y: 130 },
      { x: 620, y: 410 },
      { x: 340, y: 410 },
      { x: 340, y: 130 },
    ],
  },
  {
    name: "Hình thoi",
    points: [
      { x: 480, y: 110 },
      { x: 680, y: 270 },
      { x: 480, y: 430 },
      { x: 280, y: 270 },
      { x: 480, y: 110 },
    ],
  },
  {
    name: "Hình ngũ giác",
    points: [
      { x: 480, y: 110 },
      { x: 680, y: 240 },
      { x: 600, y: 430 },
      { x: 360, y: 430 },
      { x: 280, y: 240 },
      { x: 480, y: 110 },
    ],
  },
  {
    name: "Hình lục giác",
    points: [
      { x: 380, y: 120 },
      { x: 580, y: 120 },
      { x: 680, y: 270 },
      { x: 580, y: 420 },
      { x: 380, y: 420 },
      { x: 280, y: 270 },
      { x: 380, y: 120 },
    ],
  },
  {
    name: "Ngôi nhà",
    points: [
      { x: 480, y: 110 },
      { x: 660, y: 230 },
      { x: 660, y: 430 },
      { x: 300, y: 430 },
      { x: 300, y: 230 },
      { x: 480, y: 110 },
    ],
  },
  {
    name: "Mũi tên",
    points: [
      { x: 480, y: 110 },
      { x: 640, y: 240 },
      { x: 540, y: 240 },
      { x: 540, y: 430 },
      { x: 420, y: 430 },
      { x: 420, y: 240 },
      { x: 320, y: 240 },
      { x: 480, y: 110 },
    ],
  },
  {
    name: "Chữ V",
    points: [
      { x: 320, y: 140 },
      { x: 480, y: 420 },
      { x: 640, y: 140 },
    ],
  },
  {
    name: "Chữ Z",
    points: [
      { x: 320, y: 140 },
      { x: 640, y: 140 },
      { x: 320, y: 420 },
      { x: 640, y: 420 },
    ],
  },
  {
    name: "Số 4",
    points: [
      { x: 540, y: 120 },
      { x: 320, y: 320 },
      { x: 640, y: 320 },
      { x: 540, y: 120 },
      { x: 540, y: 440 },
    ],
  },
];

export const GT024Generator: LevelGenerator = {
  engine: "GT-024",
  axes: {
    age_band: ["5-6"],
    what: ["motor", "geometry", "path", "writing"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary }) {
    const preset = pickOne(rng, SHAPE_PRESETS);

    // Thêm độ lệch ngẫu nhiên về vị trí và tỉ lệ
    const dx = rng.nextInt(61) - 30; // -30..+30
    const dy = rng.nextInt(41) - 20; // -20..+20
    const scalePercent = 90 + rng.nextInt(21); // 90..110%
    const scale = scalePercent / 100;

    const centerX = 480;
    const centerY = 270;

    const waypoints = preset.points.map((pt, idx) => {
      const rx = Math.round(centerX + (pt.x - centerX) * scale + dx);
      const ry = Math.round(centerY + (pt.y - centerY) * scale + dy);
      const clampedX = Math.max(50, Math.min(910, rx));
      const clampedY = Math.max(50, Math.min(490, ry));

      return {
        id: `p${idx + 1}`,
        x: clampedX,
        y: clampedY,
        order: idx,
        label: `${idx + 1}`,
      };
    });

    const nouns = getNouns(vocabulary, 1);
    const guideNoun = nouns[0];
    const guideAsset = guideNoun
      ? { kind: "emoji" as const, ref: guideNoun.emoji_ref }
      : undefined;

    return {
      content_pack: {
        prompt: `Bé hãy nối các điểm theo thứ tự để vẽ ${preset.name} nhé!`,
        shape_name: preset.name,
        guide_asset: guideAsset,
        waypoints,
      },
      difficulty_params: {
        tolerance_px: 35 + rng.nextInt(15),
        show_numbered_dots: true,
        show_guide_lines: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
