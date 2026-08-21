import { describe, expect, it } from "vitest";
import {
  TraceSystem,
  type TraceWaypoint,
} from "../src/systems/trace-system.js";

describe("traceSystem (BR-LVB-12 — independent test suite)", () => {
  const waypoints: TraceWaypoint[] = [
    { id: "wp-1", x: 200, y: 200, order: 0 },
    { id: "wp-2", x: 400, y: 200, order: 1 },
    { id: "wp-3", x: 400, y: 400, order: 2 },
  ];

  it("initializes ordered waypoints and tracks current target", () => {
    const sys = new TraceSystem();
    sys.init(waypoints, 50);

    expect(sys.getTotalWaypoints()).toBe(3);
    expect(sys.getCurrentOrderIndex()).toBe(0);
    expect(sys.getCurrentTargetWaypoint()?.id).toBe("wp-1");
    expect(sys.isComplete()).toBe(false);
  });

  it("checks trace points along the path and completes when all checkpoints reached", () => {
    const sys = new TraceSystem();
    sys.init(waypoints, 50);

    // Far from first point
    const resFar = sys.checkPoint({ x: 50, y: 50 });
    expect(resFar.valid).toBe(false);
    expect(sys.getCurrentOrderIndex()).toBe(0);

    // Hit near wp-1 (200, 200)
    const res1 = sys.checkPoint({ x: 210, y: 195 });
    expect(res1.valid).toBe(true);
    expect(res1.reachedWaypointId).toBe("wp-1");
    expect(sys.getCurrentOrderIndex()).toBe(1);

    // Hit near wp-2 (400, 200)
    const res2 = sys.checkPoint({ x: 395, y: 205 });
    expect(res2.valid).toBe(true);
    expect(res2.reachedWaypointId).toBe("wp-2");
    expect(sys.getCurrentOrderIndex()).toBe(2);

    // Hit near wp-3 (400, 400)
    const res3 = sys.checkPoint({ x: 400, y: 400 });
    expect(res3.valid).toBe(true);
    expect(res3.reachedWaypointId).toBe("wp-3");
    expect(res3.isComplete).toBe(true);
    expect(sys.isComplete()).toBe(true);
  });
});
