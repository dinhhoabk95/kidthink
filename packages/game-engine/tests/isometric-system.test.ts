import { describe, expect, it } from "vitest";
import {
  type CubeCoord,
  computeTopView,
  countHiddenCubes,
  hasNoFloatingCubes,
  isCubeHidden,
  isModelConnected,
  projectIsometric,
  rotateCubeZ,
  rotateModelZ,
  sortCubesForRender,
} from "#src/systems/isometric-system";

describe("isometricSystem (BR-MTB-15)", () => {
  describe("rotateCubeZ & rotateModelZ", () => {
    it("rotates coordinates 90, 180, 270 degrees in 4x4 grid", () => {
      const cube: CubeCoord = { x: 0, y: 0, z: 1 };
      // 4x4 grid (maxIdx = 3)
      expect(rotateCubeZ(cube, 0)).toEqual({ x: 0, y: 0, z: 1 });
      expect(rotateCubeZ(cube, 90)).toEqual({ x: 0, y: 3, z: 1 });
      expect(rotateCubeZ(cube, 180)).toEqual({ x: 3, y: 3, z: 1 });
      expect(rotateCubeZ(cube, 270)).toEqual({ x: 3, y: 0, z: 1 });
    });

    it("rotates entire model", () => {
      const model: CubeCoord[] = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ];
      const rotated = rotateModelZ(model, 90);
      expect(rotated).toEqual([
        { x: 0, y: 3, z: 0 },
        { x: 0, y: 2, z: 0 },
      ]);
    });
  });

  describe("projectIsometric", () => {
    it("projects 3D coordinate to 2D screen coordinates with depth", () => {
      const cube: CubeCoord = { x: 1, y: 1, z: 0 };
      const proj = projectIsometric(cube, 400, 300, 40);
      expect(proj.screenX).toBe(400); // (1 - 1) * cos(30) = 0
      expect(proj.screenY).toBe(340); // 300 + (1 + 1) * 0.5 * 40 = 340
      expect(proj.depth).toBe(2);
    });
  });

  describe("sortCubesForRender (Painter's Algorithm)", () => {
    it("sorts cubes with lower z and lower x+y first", () => {
      const cubes: CubeCoord[] = [
        { x: 1, y: 1, z: 1 },
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ];
      const sorted = sortCubesForRender(cubes, 0);
      expect(sorted[0]).toEqual({ x: 0, y: 0, z: 0 });
      expect(sorted.at(-1)).toEqual({ x: 1, y: 1, z: 1 });
    });
  });

  describe("isModelConnected", () => {
    it("returns true for single cube or adjacent connected cubes", () => {
      expect(isModelConnected([{ x: 0, y: 0, z: 0 }])).toBe(true);

      const connected: CubeCoord[] = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 1, y: 1, z: 1 },
      ];
      expect(isModelConnected(connected)).toBe(true);
    });

    it("returns false for disconnected cubes", () => {
      const disconnected: CubeCoord[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 2, z: 0 },
      ];
      expect(isModelConnected(disconnected)).toBe(false);
    });
  });

  describe("hasNoFloatingCubes", () => {
    it("returns true when cubes at z > 0 have support below", () => {
      const valid: CubeCoord[] = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: 2 },
      ];
      expect(hasNoFloatingCubes(valid)).toBe(true);
    });

    it("returns false when a cube is floating with nothing below", () => {
      const floating: CubeCoord[] = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1 }, // (1,1,0) is missing
      ];
      expect(hasNoFloatingCubes(floating)).toBe(false);
    });
  });

  describe("isCubeHidden & countHiddenCubes", () => {
    it("detects hidden cube occluded by top, front-left, and front-right cubes", () => {
      // Cube at (0,0,0) is hidden if there are cubes at (0,0,1) [top], (1,0,0) [front-right], (0,1,0) [front-left]
      const model: CubeCoord[] = [
        { x: 0, y: 0, z: 0 }, // hidden
        { x: 0, y: 0, z: 1 }, // top
        { x: 1, y: 0, z: 0 }, // right
        { x: 0, y: 1, z: 0 }, // left
      ];

      if (model[0] && model[1]) {
        expect(isCubeHidden(model[0], model, 0)).toBe(true);
        expect(isCubeHidden(model[1], model, 0)).toBe(false);
      }
      expect(countHiddenCubes(model, 0)).toBe(1);

      // When rotated 180 degrees, the cube at (0,0,0) becomes visible from the back!
      expect(countHiddenCubes(model, 180)).toBe(0);
    });
  });

  describe("computeTopView", () => {
    it("computes 2D height grid from top perspective", () => {
      const model: CubeCoord[] = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 }, // height 2 at (0,0)
        { x: 1, y: 0, z: 0 }, // height 1 at (1,0)
        { x: 2, y: 2, z: 0 }, // height 1 at (2,2)
      ];

      const topView = computeTopView(model, 3);
      expect(topView[0]?.[0]).toBe(2);
      expect(topView[0]?.[1]).toBe(1);
      expect(topView[2]?.[2]).toBe(1);
      expect(topView[1]?.[1]).toBe(0);
    });
  });
});
