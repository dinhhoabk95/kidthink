import { describe, expect, it } from "vitest";
import { type SceneObject, SceneSystem } from "#src/systems/scene-system";

describe("sceneSystem (BR-LVB-12 — independent test suite)", () => {
  const sampleObjects: SceneObject[] = [
    {
      id: "target-star",
      x: 100,
      y: 150,
      width: 64,
      height: 64,
      isTarget: true,
      isHidden: true,
    },
    {
      id: "target-circle",
      x: 300,
      y: 200,
      width: 64,
      height: 64,
      isTarget: true,
      isHidden: false,
    },
    {
      id: "distractor-tree",
      x: 500,
      y: 250,
      width: 80,
      height: 80,
      isTarget: false,
      isHidden: false,
    },
  ];

  it("initializes objects and tracks target count", () => {
    const sys = new SceneSystem();
    sys.init(sampleObjects);

    expect(sys.getTotalTargets()).toBe(2);
    expect(sys.getFoundCount()).toBe(0);
    expect(sys.isAllFound()).toBe(false);

    expect(sys.getObjectState("target-star")?.isRevealed).toBe(false);
    expect(sys.getObjectState("target-circle")?.isRevealed).toBe(true);
  });

  it("reveals hidden objects and collects targets", () => {
    const sys = new SceneSystem();
    sys.init(sampleObjects);

    // Reveal hidden target
    const rev = sys.revealObject("target-star");
    expect(rev).toBe(true);
    expect(sys.getObjectState("target-star")?.isRevealed).toBe(true);

    // Tap distractor
    const resDistractor = sys.findTarget("distractor-tree");
    expect(resDistractor.valid).toBe(false);
    expect(resDistractor.isTarget).toBe(false);

    // Find first target
    const res1 = sys.findTarget("target-star");
    expect(res1).toEqual({ valid: true, isTarget: true, isNewFind: true });
    expect(sys.getFoundCount()).toBe(1);
    expect(sys.isAllFound()).toBe(false);

    // Find second target
    const res2 = sys.findTarget("target-circle");
    expect(res2).toEqual({ valid: true, isTarget: true, isNewFind: true });
    expect(sys.getFoundCount()).toBe(2);
    expect(sys.isAllFound()).toBe(true);
  });
});
