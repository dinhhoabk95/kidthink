import { VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT024Generator: LevelGenerator = {
  engine: "GT-024",
  axes: {
    age_band: ["5-6"],
    what: ["motor", "geometry", "path", "writing"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng }) {
    const isTriangle = rng.nextInt(2) === 0;

    let shapeName = "Hình tam giác";
    let waypoints: Array<{
      id: string;
      x: number;
      y: number;
      order: number;
      label?: string;
    }> = [];

    if (isTriangle) {
      shapeName = "Hình tam giác";
      waypoints = [
        { id: "p1", x: 480, y: 120, order: 0, label: "1" },
        { id: "p2", x: 680, y: 420, order: 1, label: "2" },
        { id: "p3", x: 280, y: 420, order: 2, label: "3" },
        { id: "p4", x: 480, y: 120, order: 3, label: "4" },
      ];
    } else {
      shapeName = "Hình chữ nhật";
      waypoints = [
        { id: "p1", x: 300, y: 150, order: 0, label: "1" },
        { id: "p2", x: 660, y: 150, order: 1, label: "2" },
        { id: "p3", x: 660, y: 390, order: 2, label: "3" },
        { id: "p4", x: 300, y: 390, order: 3, label: "4" },
        { id: "p5", x: 300, y: 150, order: 4, label: "5" },
      ];
    }

    return {
      content_pack: {
        prompt: `Bé hãy nối các điểm theo thứ tự để vẽ ${shapeName} nhé!`,
        shape_name: shapeName,
        waypoints,
      },
      difficulty_params: {
        tolerance_px: 40,
        show_numbered_dots: true,
        show_guide_lines: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
