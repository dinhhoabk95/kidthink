import { describe, expect, it } from "vitest";
import { collectSeedSpokenLabels } from "../../src/voice/seed-spoken-labels.js";
import { findUnvoicedSpokenLabels } from "../../src/voice/spoken-label-coverage.js";
import { UNRENDERED_SPOKEN_LABEL_FIXTURE } from "./fixtures/spoken-label-voice/unrendered-spoken-label.fixture.js";

/**
 * Sổ nợ: nhãn không thể render (ghi lý do cạnh từng mục). Đỏ khi tăng và khi
 * giảm. Mục tiêu: rỗng.
 */
const KNOWN_UNVOICED_LABELS: readonly string[] = [];

describe("Cổng spoken-label-voice (BR-PNR-05/06)", () => {
  const labels = collectSeedSpokenLabels();

  it("quét được nhãn thật từ nội dung seed mọi template", () => {
    expect(new Set(labels.map((l) => l.label)).size).toBeGreaterThan(500);
  });

  it("mọi spokenLabel của entity có mp3 (trừ sổ nợ)", () => {
    const missing = findUnvoicedSpokenLabels(labels)
      .map((v) => v.label)
      .sort();
    expect(missing).toEqual([...KNOWN_UNVOICED_LABELS].sort());
  });

  it("ca âm: nhãn chưa render làm cổng đỏ", () => {
    const hit = findUnvoicedSpokenLabels([
      {
        label: UNRENDERED_SPOKEN_LABEL_FIXTURE,
        source: "fixture",
        audioPath: null,
      },
    ]);
    expect(hit).toHaveLength(1);
  });
});
