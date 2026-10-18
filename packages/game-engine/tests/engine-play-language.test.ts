import { describe, expect, it } from "vitest";
import { ACTION_IGNORED, ACTION_RETRY } from "#src/game-session";
import { ALL_TEMPLATES } from "#src/generated/template-registry";
import {
  ENTITY_VISUALS,
  INTERACTION_STATES,
  INTERACTION_TO_ENTITY_VISUAL,
  InteractionManager,
  mapInteractionStateToVisual,
  PLAY_VERBS,
  type PlayVerb,
  SYSTEM_BEATS,
} from "#src/interaction";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures";
import { GT001Session } from "#src/templates/GT-001/session";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures";
import { GT003Session } from "#src/templates/GT-003/session";

describe("Engine Play Language Contract (BR-EPL-01..06)", () => {
  it("BR-EPL-01: enforces closed set of 6 play verbs across interaction contract and all templates", () => {
    expect(PLAY_VERBS).toEqual([
      "tap",
      "drop",
      "stroke",
      "adjust",
      "commit",
      "revert",
    ]);
    expect(PLAY_VERBS).toHaveLength(6);

    const allowedVerbs = new Set<string>(PLAY_VERBS);
    for (const [code, template] of Object.entries(ALL_TEMPLATES)) {
      const input = template.input;
      expect(input, `${code} must declare input config`).toBeDefined();
      const verbs = input?.verbs ?? [];
      expect(
        verbs.length,
        `${code} must declare >=1 verb`
      ).toBeGreaterThanOrEqual(1);
      for (const verb of verbs) {
        expect(
          allowedVerbs.has(verb),
          `${code} declares unknown verb "${String(verb)}" outside BR-EPL-01`
        ).toBe(true);
      }
    }
  });

  it("BR-EPL-02: enforces closed set of 3 system beats (reveal, hint, timeout)", () => {
    expect(SYSTEM_BEATS).toEqual(["reveal", "hint", "timeout"]);
    expect(SYSTEM_BEATS).toHaveLength(3);

    const fixture = GT001_FIXTURES[0];
    if (!fixture) {
      throw new Error("Missing GT-001 fixture");
    }
    const session = new GT001Session(fixture.content, fixture.difficulty);
    session.prepareRound("3-4");

    for (const beat of SYSTEM_BEATS) {
      expect(() => session.onBeat(beat)).not.toThrow();
    }
  });

  it("BR-EPL-03: maps 5 interaction states 1-to-1 onto 5 entity visual states", () => {
    expect(INTERACTION_STATES).toEqual([
      "idle",
      "active",
      "selected",
      "locked",
      "rejected",
    ]);
    expect(ENTITY_VISUALS).toEqual([
      "idle",
      "active",
      "selected",
      "correct",
      "incorrect",
    ]);

    const mappedVisuals = INTERACTION_STATES.map((state) =>
      mapInteractionStateToVisual(state)
    );
    expect(mappedVisuals).toEqual([...ENTITY_VISUALS]);
    expect(new Set(mappedVisuals).size).toBe(5);
    expect(INTERACTION_TO_ENTITY_VISUAL).toEqual({
      idle: "idle",
      active: "active",
      selected: "selected",
      locked: "correct",
      rejected: "incorrect",
    });
  });

  it("BR-EPL-04: swallows all subsequent gestures once checkWinCondition() === true without extra telemetry", () => {
    const fixture = GT001_FIXTURES[0];
    if (!fixture) {
      throw new Error("Missing GT-001 fixture");
    }
    const session = new GT001Session(fixture.content, fixture.difficulty);
    session.prepareRound("3-4");

    const view = session.getView();
    const correctOption = fixture.content.options.find((o) => o.is_correct);
    const wrongOption = fixture.content.options.find((o) => !o.is_correct);
    const correctEntity = view.entities.find(
      (e) => e.id === correctOption?.item_id
    );
    const wrongEntity = view.entities.find(
      (e) => e.id === wrongOption?.item_id
    );

    if (!(correctEntity && wrongEntity)) {
      throw new Error("Missing option entities in GT-001 view");
    }

    const winResult = session.dispatch({
      type: "tap",
      x: correctEntity.x,
      y: correctEntity.y,
      timeMs: 100,
    });
    expect(winResult?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);

    const eventsAfterWin = session.getTelemetry().events.length;

    const postWinTap = session.dispatch({
      type: "tap",
      x: wrongEntity.x,
      y: wrongEntity.y,
      timeMs: 200,
    });
    expect(postWinTap).toEqual(ACTION_IGNORED);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.getTelemetry().events.length).toBe(eventsAfterWin);
  });

  it("BR-EPL-05: returns warm amber_soft retry feedback on wrong move without red/buzzer or placement lock", () => {
    expect(ACTION_RETRY).toEqual({
      valid: false,
      feedback: "amber_soft",
    });

    const fixture = GT003_FIXTURES[0];
    if (!fixture) {
      throw new Error("Missing GT-003 fixture");
    }
    const session = new GT003Session(fixture.content, fixture.difficulty);
    session.prepareRound("3-4");

    const view = session.getView();
    const wrongItem = fixture.content.items.find((i) => !i.is_correct);
    const sourceEntity = view.entities.find((e) => e.id === wrongItem?.item_id);
    const targetEntity = view.entities.find((e) => e.role === "target");

    if (!(sourceEntity && targetEntity)) {
      throw new Error("Missing source or target entity in GT-003 view");
    }

    const res = session.dispatch({
      type: "drop",
      fromX: sourceEntity.x,
      fromY: sourceEntity.y,
      toX: targetEntity.x,
      toY: targetEntity.y,
      timeMs: 150,
    });

    expect(res).toEqual({
      valid: false,
      feedback: "amber_soft",
    });
    expect(res?.feedback).not.toContain("red");
    expect(res?.feedback).not.toContain("buzzer");
    expect(session.getPlacements().has(sourceEntity.id)).toBe(false);

    // Transient incorrect state expires back to idle after WRONG_FEEDBACK_MS (260ms)
    expect(session.getItemState(sourceEntity.id)).toBe("wrong");
    session.update(300);
    expect(session.getItemState(sourceEntity.id)).toBe("idle");
  });

  it("BR-EPL-06: requires tap-tap fallback on every drag template active in band 3-4 and completes via two taps", () => {
    for (const [code, template] of Object.entries(ALL_TEMPLATES)) {
      const verbs = (template.input?.verbs ?? []) as readonly PlayVerb[];
      const hasDrop = verbs.includes("drop");
      const bannedBands = template.banned_age_bands ?? [];
      const supports34 = template.age_min <= 3 && !bannedBands.includes("3-4");
      if (hasDrop && supports34) {
        expect(
          template.requires_tap_fallback,
          `${code} has drop verb in band 3-4 so requires_tap_fallback must be true`
        ).toBe(true);
      }
    }

    // Verify InteractionManager tap-tap state machine
    const im = new InteractionManager();
    const firstTap = im.handleTapTapFallback("paper", "");
    expect(firstTap).toBeNull();
    expect(im.getSelectedSourceId()).toBe("paper");
    const secondTap = im.handleTapTapFallback("paper", "bin_1");
    expect(secondTap).toEqual({
      source_id: "paper",
      target_id: "bin_1",
    });
    expect(im.getSelectedSourceId()).toBeNull();

    // Verify GT-003 session in band 3-4 completes purely via two taps per item
    const fixture = GT003_FIXTURES[0];
    if (!fixture) {
      throw new Error("Missing GT-003 fixture");
    }
    const session = new GT003Session(fixture.content, fixture.difficulty);
    session.prepareRound("3-4");

    const correctItems = fixture.content.items.filter((i) => i.is_correct);
    for (const item of correctItems) {
      const viewBeforeSelect = session.getView();
      const source = viewBeforeSelect.entities.find(
        (e) => e.id === item.item_id
      );
      const target = viewBeforeSelect.entities.find((e) => e.role === "target");
      if (!(source && target)) {
        throw new Error(`Missing entity for ${item.item_id}`);
      }

      // Tap 1: select source
      const tap1 = session.dispatch({
        type: "tap",
        x: source.x,
        y: source.y,
        timeMs: 100,
      });
      expect(tap1).toEqual(ACTION_IGNORED);
      expect(session.getStagedItemId()).toBe(item.item_id);

      // Tap 2: tap target to drop
      const tap2 = session.dispatch({
        type: "tap",
        x: target.x,
        y: target.y,
        timeMs: 200,
      });
      expect(tap2?.valid).toBe(true);
    }

    expect(session.checkWinCondition()).toBe(true);
  });
});
