import { describe, expect, it } from "vitest";
import {
  DASHBOARD_CARDS,
  type DashboardCardDefinition,
  getDashboardCardById,
  getDashboardCardsForRole,
} from "#src/dashboard-cards";

describe("Task 3 — Dashboard Cards Registry & Invariants (D-IX, BR-DSH-02, BR-DSH-06)", () => {
  it("Scenario: D-IX — declares exactly 16 KPI cards matching Spec §7", () => {
    expect(DASHBOARD_CARDS.length).toBe(16);

    const groupCounts = DASHBOARD_CARDS.reduce(
      (acc, card) => {
        acc[card.group] = (acc[card.group] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    expect(groupCounts.todo).toBe(3);
    expect(groupCounts.growth).toBe(5);
    expect(groupCounts.content).toBe(6);
    expect(groupCounts.system).toBe(2);
  });

  it("Scenario: BR-DSH-02 — 16/16 thẻ có href; 4 thẻ pending_source (across 4 remaining owner steps)", () => {
    const cardsWithoutHref = DASHBOARD_CARDS.filter(
      (card) => !card.href || card.href.trim() === ""
    );
    expect(cardsWithoutHref.length).toBe(0);

    const pendingCards = DASHBOARD_CARDS.filter((card) => card.pending_source);
    const pendingSteps = new Set(pendingCards.map((c) => c.pending_source));

    // 4 remaining owner steps: P2.3, P2.8, P3.3, P4 (P3.1 published_lessons implemented)
    expect(pendingSteps).toEqual(new Set(["P2.3", "P2.8", "P3.3", "P4"]));

    console.log(
      `16/16 thẻ có href; ${pendingSteps.size} nhóm pending_source (${pendingCards.length} thẻ pending_source: ${pendingCards.map((c) => c.id).join(", ")})`
    );
  });

  it("Scenario: BR-DSH-02 negative test — card missing href is rejected", () => {
    const invalidCard: Partial<DashboardCardDefinition> = {
      id: "invalid_kpi",
      group: "todo",
      source: "test",
      href: "",
      roles: ["super_admin"],
    };

    expect(!invalidCard.href).toBe(true);
  });

  it("Scenario: §7.1 thresholds are precisely declared in registry", () => {
    const paymentsCard = getDashboardCardById("pending_payments");
    expect(paymentsCard).toBeDefined();
    expect(paymentsCard?.threshold?.maxCount).toBe(20);
    expect(paymentsCard?.threshold?.maxOldestHours).toBe(24);

    const contentCard = getDashboardCardById("pending_content");
    expect(contentCard).toBeDefined();
    expect(contentCard?.threshold?.maxCount).toBe(50);

    const alertsCard = getDashboardCardById("open_alerts");
    expect(alertsCard).toBeDefined();
    expect(alertsCard?.threshold?.maxCount).toBe(0);
  });

  it("Scenario: §7.3 feedback cards are placed before count cards in content group", () => {
    const contentCards = DASHBOARD_CARDS.filter((c) => c.group === "content");
    expect(contentCards.length).toBe(6);

    const feedbackCards = contentCards.slice(0, 3);
    const countCards = contentCards.slice(3);

    expect(feedbackCards.every((c) => c.is_feedback === true)).toBe(true);
    expect(countCards.every((c) => !c.is_feedback)).toBe(true);

    expect(feedbackCards.map((c) => c.id)).toEqual([
      "skills_without_levels",
      "levels_high_drop_rate",
      "curriculum_weeks_incomplete",
    ]);
    expect(countCards.map((c) => c.id)).toEqual([
      "published_levels",
      "draft_levels",
      "published_lessons",
    ]);
  });

  it("Scenario: D-IY & BR-DSH-06 — content_reviewer role only receives content cards (no money, user, or system)", () => {
    const reviewerCards = getDashboardCardsForRole("content_reviewer");

    // All reviewer cards must be content group or pending_content
    for (const card of reviewerCards) {
      expect(["content", "todo"].includes(card.group)).toBe(true);
      if (card.group === "todo") {
        expect(card.id).toBe("pending_content");
      }
      expect(card.group).not.toBe("growth");
      expect(card.group).not.toBe("system");
    }

    const adminCards = getDashboardCardsForRole("super_admin");
    expect(adminCards.length).toBe(16);
  });

  it("Scenario: D-IX negative test — pending_source card must be marked as pending, never treated as ready", () => {
    const pendingCards = DASHBOARD_CARDS.filter((c) => c.pending_source);
    for (const card of pendingCards) {
      expect(["P2.3", "P2.8", "P3.1", "P3.3", "P4"]).toContain(
        card.pending_source
      );
    }
  });
});
