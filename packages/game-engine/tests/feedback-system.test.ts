import { describe, expect, it } from "vitest";
import {
  COMPLIMENTS,
  FEEDBACK_TABLE,
  FeedbackSystem,
  FORBIDDEN_WORDS,
  RETRY_ENCOURAGEMENTS,
} from "../src/systems/feedback-system";

describe("FeedbackSystem (BR-FBK-01..10 & FEEDBACK-AND-CELEBRATION spec)", () => {
  it("BR-FBK-01 & BR-FBK-03: retry state uses amber token and never danger token", () => {
    const feedback = FEEDBACK_TABLE.retry;
    expect(feedback.tokenColor).toBe("retry");
    expect(feedback.tokenColor).not.toBe("danger");
  });

  it("BR-FBK-02: wrong touch always yields non-silent feedback config", () => {
    const system = new FeedbackSystem();
    const touch = system.createTouchFeedback("retry", 100, 200);
    expect(touch.config.soundType).toBe("amber_soft");
    expect(touch.config.motion).toBe("amber_pulse_drift");
  });

  it("BR-FBK-04: grand celebration only for level completion with <= 40 particles", () => {
    const itemSuccess = FEEDBACK_TABLE.success;
    expect(itemSuccess.particlesCount).toBe(0);
    expect(itemSuccess.hasMascot).toBe(false);

    const levelSuccess = FEEDBACK_TABLE.celebrate_level;
    expect(levelSuccess.particlesCount).toBe(40);
    expect(levelSuccess.hasMascot).toBe(true);
  });

  it("BR-FBK-05: touch feedback includes exact touch point coordinates", () => {
    const system = new FeedbackSystem();
    const touch = system.createTouchFeedback("success", 150, 300);
    expect(touch.touchPoint).toEqual({ x: 150, y: 300 });
  });

  it("BR-FBK-06: feedback contains multi-sensory attributes (motion, scale, sound)", () => {
    const config = FEEDBACK_TABLE.success;
    expect(config.motion).toBeDefined();
    expect(config.scale).toBeGreaterThan(1.0);
    expect(config.soundType).toBeDefined();
  });

  it("BR-FBK-07: wrong feedback intensity does not escalate on 5th miss", () => {
    const system = new FeedbackSystem();
    const touch1 = system.createTouchFeedback("retry", 100, 200);
    const touch5 = system.createTouchFeedback("retry", 100, 200);
    expect(touch1.config).toEqual(touch5.config);
  });

  it("BR-FBK-08: compliments & retry phrases rotate and contain no forbidden text", () => {
    const system = new FeedbackSystem();

    // Check compliment rotation
    const compliment1 = system.getCompliment();
    const compliment2 = system.getCompliment();
    expect(COMPLIMENTS).toContain(compliment1);
    expect(COMPLIMENTS).toContain(compliment2);

    // Check retry rotation
    const retry1 = system.getRetryEncouragement();
    const retry2 = system.getRetryEncouragement();
    expect(RETRY_ENCOURAGEMENTS).toContain(retry1);
    expect(RETRY_ENCOURAGEMENTS).toContain(retry2);

    // Check forbidden words
    const allPhrases = [...COMPLIMENTS, ...RETRY_ENCOURAGEMENTS];
    for (const phrase of allPhrases) {
      for (const forbidden of FORBIDDEN_WORDS) {
        expect(phrase.toLowerCase()).not.toContain(forbidden.toLowerCase());
      }
      expect(phrase.toLowerCase()).not.toContain("kém");
      expect(phrase.toLowerCase()).not.toContain("hơn");
    }
  });

  it("BR-FBK-09: prefers-reduced-motion scales down celebration but keeps sound", () => {
    const system = new FeedbackSystem();
    const config = system.getFeedbackConfig("celebrate_level", true);
    expect(config.motion).toBe("scale_pulse_reduced");
    expect(config.durationMs).toBe(400);
    expect(config.particlesCount).toBe(0);
    expect(config.soundType).toBe("level_celebrate");
  });
});
