import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { scanNarrationCoverage } from "./check-narration-coverage.ts";

describe("Cổng check:narration-coverage (Task #269 / BR-PNR-01..10)", () => {
  it("baseline: toàn bộ codebase hiện tại đạt chuẩn (0 vi phạm, ratchet xanh)", () => {
    const { stats, violations, ok } = scanNarrationCoverage();
    expect(ok).toBe(true);
    expect(violations).toHaveLength(0);
    expect(stats.datasets_with_audio_path).toBeGreaterThanOrEqual(57);
    expect(stats.engines_with_round_narration).toBe(37);
    expect(stats.items_with_audio_path).toBeGreaterThanOrEqual(486);
  });

  // T4.5: Ca âm BR-PNR-01 — level không có instruction_audio_path VÀ dataset không có narration_template → cổng đỏ
  it("T4.5 (Ca âm BR-PNR-01): level thiếu instruction_audio_path và dataset thiếu narration_template làm cổng đỏ", () => {
    const { violations } = scanNarrationCoverage({
      extraLevels: [
        {
          code: "GL-TEST-001",
          instruction_audio_path: null,
          narration_template: null,
        },
      ],
    });

    const pnr01 = violations.find((v) => v.rule === "BR-PNR-01");
    expect(pnr01).toBeDefined();
    expect(pnr01?.target).toBe("GL-TEST-001");
    expect(pnr01?.message).toContain("không có đường phát câu dẫn thành tiếng");
  });

  // T4.6: Ca âm BR-PNR-02 — item không có audio_path và không có spokenLabel / label → cổng đỏ
  it("T4.6 (Ca âm BR-PNR-02): item thiếu cả audio_path lẫn spokenLabel lẫn label làm cổng đỏ", () => {
    const testDataset: SkillDataset = {
      skill_code: "C1.TEST.01",
      concept_label: "Test item thiếu tên",
      surface: "game",
      ladder: [{ rung: 1, dimension: "test", description: "test rung" }],
      phrasing: { prompt_template: "Tìm {label}" },
      items: [
        {
          id: "item_blind",
          label: "", // rỗng label
          glyph: "❓",
          value: 1,
          audio_path: undefined,
        },
      ],
    };

    const { violations } = scanNarrationCoverage({
      datasets: { "C1.TEST.01": testDataset },
    });

    const pnr02 = violations.find((v) => v.rule === "BR-PNR-02");
    expect(pnr02).toBeDefined();
    expect(pnr02?.target).toContain("C1.TEST.01:item_blind");
  });

  // T4.7: Ca âm BR-PNR-05 — sinh file đọc số trùng / item số gõ sai đường dẫn → cổng đỏ
  it("T4.7 (Ca âm BR-PNR-05): item chữ số gõ đường dẫn ngoài common/numbers làm cổng đỏ", () => {
    const testDataset: SkillDataset = {
      skill_code: "C1.TEST.02",
      concept_label: "Test item số sai đường dẫn",
      surface: "game",
      ladder: [{ rung: 1, dimension: "test", description: "test rung" }],
      phrasing: { prompt_template: "Tìm {label}" },
      items: [
        {
          id: "num_1",
          label: "số một",
          glyph: "1",
          value: 1,
          contrast_group: "numeral",
          audio_path: "/audio/voice/custom/1.mp3", // hardcode đường dẫn khác
        },
      ],
    };

    const { violations } = scanNarrationCoverage({
      datasets: { "C1.TEST.02": testDataset },
    });

    const pnr05 = violations.find((v) => v.rule === "BR-PNR-05");
    expect(pnr05).toBeDefined();
    expect(pnr05?.target).toContain("C1.TEST.02:num_1");
    expect(pnr05?.message).toContain("/audio/voice/common/numbers/1.mp3");
  });

  // T4.8: Ca âm file không tồn tại — audio_path trỏ vào đường dẫn không có file mp3 trên đĩa → cổng đỏ
  it("T4.8 (Ca âm BR-PNR-06): audio_path trỏ file không tồn tại trên đĩa làm cổng đỏ", () => {
    const testDataset: SkillDataset = {
      skill_code: "C1.TEST.03",
      concept_label: "Test file ma",
      surface: "game",
      ladder: [{ rung: 1, dimension: "test", description: "test rung" }],
      phrasing: { prompt_template: "Tìm {label}" },
      items: [
        {
          id: "ghost_item",
          label: "vật không có file thật",
          glyph: "👻",
          value: 1,
          audio_path: "/audio/voice/common/numbers/999_khong_ton_tai.mp3",
        },
      ],
    };

    const { violations } = scanNarrationCoverage({
      datasets: { "C1.TEST.03": testDataset },
    });

    const pnr06 = violations.find((v) => v.rule === "BR-PNR-06");
    expect(pnr06).toBeDefined();
    expect(pnr06?.target).toContain("C1.TEST.03:ghost_item");
    expect(pnr06?.message).toContain("không tồn tại file thật trên đĩa");
  });

  // T4.9: Ca âm ratchet BR-PNR-10 — hạ số dataset có audio_path so với baseline → cổng đỏ
  it("T4.9 (Ca âm ratchet BR-PNR-10): số dataset có audio_path bị thụt lùi làm cổng đỏ", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "narration-ratchet-"));
    const fakeBaselinePath = path.join(tmpDir, "baseline.json");

    // Giả lập baseline đòi 100 datasets có audio_path
    fs.writeFileSync(
      fakeBaselinePath,
      JSON.stringify({
        datasets_with_audio_path: 100,
        datasets_total: 443,
        engines_with_round_narration: 37,
        engines_total: 37,
        items_with_audio_path: 1000,
        orphan_audio_files: 700,
      }),
      "utf-8"
    );

    try {
      const { violations } = scanNarrationCoverage({
        baselinePath: fakeBaselinePath,
      });

      const pnr10 = violations.filter((v) => v.rule === "BR-PNR-10");
      expect(pnr10.length).toBeGreaterThan(0);
      expect(pnr10.some((v) => v.target === "datasets_with_audio_path")).toBe(
        true
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
