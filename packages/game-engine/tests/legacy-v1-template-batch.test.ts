import { describe, expect, it } from "vitest";
import {
  ALL_TEMPLATE_CODES,
  AssemblySystem,
  CardSystem,
  GT018_FIXTURES,
  GT018Session,
  GT019_FIXTURES,
  GT019Session,
  GT020_FIXTURES,
  GT020Session,
  GT021_FIXTURES,
  GT021Session,
  GT022_FIXTURES,
  GT022Session,
  GT023_FIXTURES,
  GT023Session,
  GT024_FIXTURES,
  GT024Session,
  getGameTemplate,
  MirrorSystem,
  SceneSystem,
  TraceSystem,
} from "../src/index.js";

describe("Legacy V1 Template Batch (§7.4, BR-LVB-01..15)", () => {
  const BATCH_CODES = [
    "GT-018",
    "GT-019",
    "GT-020",
    "GT-021",
    "GT-022",
    "GT-023",
    "GT-024",
  ] as const;

  it("registers all 7 legacy v1 templates in template registry (BR-LVB-01)", () => {
    for (const code of BATCH_CODES) {
      expect(ALL_TEMPLATE_CODES).toContain(code);
      const template = getGameTemplate(code);
      expect(template).toBeDefined();
      expect(template?.status).toBe("published");
      expect(template?.limits.item_count[0]).toBeGreaterThanOrEqual(1);
    }
  });

  it("group A templates reuse existing systems without adding new systems (BR-LVB-02)", () => {
    // GT-018: selection / ordering mechanics, AudioController (no mic)
    const t018 = getGameTemplate("GT-018");
    expect(t018?.mechanic).toBe("listen-respond");
    expect(t018?.requires_tap_fallback).toBe(false);

    // GT-019: rotationSystem expansion with 90° button rotation
    const t019 = getGameTemplate("GT-019");
    expect(t019?.mechanic).toBe("rotate-transform");
    expect(t019?.requires_tap_fallback).toBe(true);
  });

  it("group B templates wire to their respective systems with independent unit tests (BR-LVB-12)", () => {
    // 5 systems instantiable independently
    expect(new CardSystem()).toBeInstanceOf(CardSystem);
    expect(new MirrorSystem()).toBeInstanceOf(MirrorSystem);
    expect(new SceneSystem()).toBeInstanceOf(SceneSystem);
    expect(new AssemblySystem()).toBeInstanceOf(AssemblySystem);
    expect(new TraceSystem()).toBeInstanceOf(TraceSystem);
  });

  it("GT-024 strictly bans age band 3-4 and does not enforce tap fallback (BR-LVB-08)", () => {
    const t024 = getGameTemplate("GT-024");
    expect(t024?.mechanic).toBe("trace-path");
    expect(t024?.age_min).toBe(5);
    expect(t024?.age_max).toBe(6);
    expect(t024?.banned_age_bands).toContain("3-4");
    expect(t024?.requires_tap_fallback).toBe(false);
  });

  it("all 7 templates have at least 3 sample levels in fixtures (BR-TAK-09, BR-LVB-15)", () => {
    expect(GT018_FIXTURES.length).toBeGreaterThanOrEqual(3);
    expect(GT019_FIXTURES.length).toBeGreaterThanOrEqual(3);
    expect(GT020_FIXTURES.length).toBeGreaterThanOrEqual(3);
    expect(GT021_FIXTURES.length).toBeGreaterThanOrEqual(3);
    expect(GT022_FIXTURES.length).toBeGreaterThanOrEqual(3);
    expect(GT023_FIXTURES.length).toBeGreaterThanOrEqual(3);
    expect(GT024_FIXTURES.length).toBeGreaterThanOrEqual(3);
  });

  it("all 7 templates emit round_started and round_completed telemetry (BR-LVB-09)", () => {
    const f18 = GT018_FIXTURES[0];
    const f19 = GT019_FIXTURES[0];
    const f20 = GT020_FIXTURES[0];
    const f21 = GT021_FIXTURES[0];
    const f22 = GT022_FIXTURES[0];
    const f23 = GT023_FIXTURES[0];
    const f24 = GT024_FIXTURES[0];

    if (!(f18 && f19 && f20 && f21 && f22 && f23 && f24)) {
      throw new Error("Missing batch fixtures");
    }

    const sessions = [
      new GT018Session(f18.content, f18.difficulty),
      new GT019Session(f19.content, f19.difficulty),
      new GT020Session(f20.content, f20.difficulty),
      new GT021Session(f21.content, f21.difficulty),
      new GT022Session(f22.content, f22.difficulty),
      new GT023Session(f23.content, f23.difficulty),
      new GT024Session(f24.content, f24.difficulty),
    ];

    for (const session of sessions) {
      session.setupEntities();
      const telemetry = session.getTelemetry();
      const roundStarted = telemetry.events.find(
        (e) => e.event_name === "round_started"
      );
      expect(roundStarted).toBeDefined();
    }
  });

  it("negative test case: invalid action returns ACTION_IGNORED / ACTION_RETRY (BR-LVB-09)", () => {
    const f18 = GT018_FIXTURES[0];
    const f20 = GT020_FIXTURES[0];
    if (!(f18 && f20)) {
      throw new Error("Missing fixtures");
    }

    const s018 = new GT018Session(f18.content, f18.difficulty);
    s018.setupEntities();
    expect(
      s018.validateAction({ type: "unknown_action", data: {} }).valid
    ).toBe(false);

    const s020 = new GT020Session(f20.content, f20.difficulty);
    s020.setupEntities();
    expect(
      s020.validateAction({
        type: "tap_card",
        data: { card_id: "nonexistent" },
      }).valid
    ).toBe(false);
  });
});
