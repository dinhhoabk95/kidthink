import { describe, expect, it } from "vitest";
import { RuleSystem } from "../src/systems/rule-system.js";

describe("RuleSystem (BR-TGB-08, BR-TGB-07)", () => {
  interface CardItem {
    color: "red" | "blue";
    shape: "circle" | "star";
  }

  const rules = [
    {
      id: "rule-color",
      name: "Chọn màu đỏ",
      description: "Chạm vào hình có màu đỏ",
      signalText: "Luật đổi: Bé hãy tìm hình màu đỏ nhé!",
      signalAudioPrompt: "Tìm hình màu đỏ",
      validator: (item: CardItem) => item.color === "red",
    },
    {
      id: "rule-shape",
      name: "Chọn hình sao",
      description: "Chạm vào hình ngôi sao",
      signalText: "Luật đổi: Bé hãy tìm hình ngôi sao nhé!",
      signalAudioPrompt: "Tìm hình ngôi sao",
      validator: (item: CardItem) => item.shape === "star",
    },
  ];

  it("evaluates items using active rule and switches rule after threshold (BR-TGB-07)", () => {
    const sys = new RuleSystem<CardItem>({
      rules,
      switchAfterTrials: 2,
      signalDurationMs: 1000,
    });

    expect(sys.getActiveRule().id).toBe("rule-color");
    expect(sys.isSignaling()).toBe(false);

    // Trial 1: Red circle -> valid for color rule
    const res1 = sys.evaluate({ color: "red", shape: "circle" });
    expect(res1).toEqual({ valid: true, triggeredSwitch: false });

    // Trial 2: Blue circle -> invalid for color rule
    const res2 = sys.evaluate({ color: "blue", shape: "circle" });
    expect(res2).toEqual({ valid: false, triggeredSwitch: false });

    // Trial 3: Red star -> 2nd correct -> triggers switch to rule-shape!
    const res3 = sys.evaluate({ color: "red", shape: "star" });
    expect(res3).toEqual({ valid: true, triggeredSwitch: true });

    expect(sys.isSignaling()).toBe(true);
    expect(sys.getActiveRule().id).toBe("rule-shape");
    expect(sys.getSignalInfo()).toEqual({
      text: "Luật đổi: Bé hãy tìm hình ngôi sao nhé!",
      audioPrompt: "Tìm hình ngôi sao",
    });

    // While signaling, evaluations are locked
    expect(sys.evaluate({ color: "red", shape: "star" }).valid).toBe(false);

    // Tick past signal duration
    const signalEnded = sys.tick(1000);
    expect(signalEnded).toBe(true);
    expect(sys.isSignaling()).toBe(false);

    // Now evaluate according to rule-shape (blue star is valid!)
    const res4 = sys.evaluate({ color: "blue", shape: "star" });
    expect(res4.valid).toBe(true);

    // Red circle is invalid for rule-shape
    const res5 = sys.evaluate({ color: "red", shape: "circle" });
    expect(res5.valid).toBe(false);
  });
});
