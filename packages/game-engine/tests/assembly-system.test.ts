import { describe, expect, it } from "vitest";
import {
  type AssemblyAnchor,
  type AssemblyPart,
  AssemblySystem,
} from "../src/systems/assembly-system.js";

describe("assemblySystem (BR-LVB-12 — independent test suite)", () => {
  const anchors: AssemblyAnchor[] = [
    { anchorId: "anchor-roof", x: 480, y: 150, acceptedPartId: "part-roof" },
    { anchorId: "anchor-body", x: 480, y: 300, acceptedPartId: "part-body" },
  ];

  const parts: AssemblyPart[] = [
    { partId: "part-roof", targetAnchorId: "anchor-roof" },
    { partId: "part-body", targetAnchorId: "anchor-body" },
    { partId: "part-wheel", targetAnchorId: "anchor-other" },
  ];

  it("finds nearest anchor within snap radius", () => {
    const sys = new AssemblySystem();
    sys.init(anchors, parts);

    const nearRoof = sys.findNearestAnchor(490, 160, 50);
    expect(nearRoof?.anchorId).toBe("anchor-roof");

    const farAway = sys.findNearestAnchor(100, 100, 50);
    expect(farAway).toBeNull();
  });

  it("assembles parts and verifies completion", () => {
    const sys = new AssemblySystem();
    sys.init(anchors, parts);

    expect(sys.isAllAssembled()).toBe(false);

    // Mismatched anchor
    const resWrong = sys.assemblePart("part-roof", "anchor-body");
    expect(resWrong.isAnchorMatch).toBe(false);
    expect(sys.isAllAssembled()).toBe(false);

    // Assemble roof
    const resRoof = sys.assemblePart("part-roof", "anchor-roof");
    expect(resRoof.isAnchorMatch).toBe(true);
    expect(sys.isAllAssembled()).toBe(false);

    // Assemble body
    const resBody = sys.assemblePart("part-body", "anchor-body");
    expect(resBody.isAnchorMatch).toBe(true);
    expect(resBody.isComplete).toBe(true);
    expect(sys.isAllAssembled()).toBe(true);
  });
});
