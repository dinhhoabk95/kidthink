/**
 * Kiểm thử cổng toàn vẹn dataset (`BR-SDI-01..08`).
 *
 * Mỗi luật có ĐỦ hai ca: một ca âm (dữ liệu sai → phải báo vi phạm) và một ca
 * dương (dữ liệu đúng → phải im). Thiếu ca âm thì cổng có thể không bao giờ đỏ
 * được, và một cổng không đỏ được thì không phải cổng.
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import type { DatasetItem, SkillDataset, SkillIdentity } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  collectAllDatasets,
  runDatasetIntegrityCheck,
} from "./check-dataset-integrity.js";
import {
  checkAudioPathsResolve,
  checkAxesBindToItems,
  checkConceptLabelMatchesName,
  checkCrossDatasetItemConsistency,
  checkOrderingCoverage,
  checkOrderingNotReversed,
  checkPromptPlaceholders,
  checkRelationIntegrity,
  REVERSED_ORDERING_ALLOWLIST,
} from "./dataset-integrity/rules.js";

function item(id: string, overrides?: Partial<DatasetItem>): DatasetItem {
  return { id, label: `nhãn ${id}`, ...overrides };
}

function dataset(overrides?: Partial<SkillDataset>): SkillDataset {
  return {
    skill_code: "C1.TEST.01",
    concept_label: "Kỹ năng test",
    surface: "game",
    items: [item("a"), item("b"), item("c")],
    ladder: [],
    phrasing: { prompt_template: "Bé chọn {label} nhé!" },
    ...overrides,
  };
}

function identity(overrides?: Partial<SkillIdentity>): SkillIdentity {
  return {
    code: "C1.TEST.01",
    strand_code: "C1.TEST",
    competency_code: "C1",
    name: "Kỹ năng test",
    age_min: 3,
    age_max: 4,
    difficulty: 1,
    thinking_processes: ["observe"],
    tier: "basic",
    prerequisites: [],
    learning_objectives: [],
    ...overrides,
  };
}

describe("BR-SDI-01 toàn vẹn quan hệ", () => {
  it("báo vi phạm khi quan hệ trỏ vào vật không tồn tại", () => {
    const violations = checkRelationIntegrity(
      dataset({
        relations: [
          { type: "sequence", source_id: "a", target_id: "khong_co" },
        ],
      })
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.detail).toContain("khong_co");
  });

  it("báo vi phạm khi quan hệ tự trỏ vào chính nó", () => {
    const violations = checkRelationIntegrity(
      dataset({
        relations: [{ type: "subset", source_id: "a", target_id: "a" }],
      })
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.detail).toContain("tự trỏ");
  });

  it("báo vi phạm khi một cạnh khai hai kiểu mâu thuẫn", () => {
    const violations = checkRelationIntegrity(
      dataset({
        relations: [
          { type: "pair", source_id: "a", target_id: "b" },
          { type: "subset", source_id: "a", target_id: "b" },
        ],
      })
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.detail).toContain("hai kiểu mâu thuẫn");
  });

  it("im lặng khi mọi quan hệ trỏ vào vật có thật", () => {
    expect(
      checkRelationIntegrity(
        dataset({
          relations: [{ type: "pair", source_id: "a", target_id: "b" }],
        })
      )
    ).toHaveLength(0);
  });
});

describe("BR-SDI-02 phủ của ordering", () => {
  it("báo vi phạm khi ordering trỏ vào vật không tồn tại", () => {
    const violations = checkOrderingCoverage(
      dataset({ ordering: ["a", "b", "c", "ma"] })
    );

    expect(violations.some((v) => v.detail.includes('"ma"'))).toBe(true);
  });

  it("báo vi phạm khi ordering bỏ sót vật", () => {
    const violations = checkOrderingCoverage(dataset({ ordering: ["a", "b"] }));

    expect(violations).toHaveLength(1);
    expect(violations[0]?.detail).toContain("bỏ sót");
  });

  it("báo vi phạm khi ordering lặp id", () => {
    const violations = checkOrderingCoverage(
      dataset({ ordering: ["a", "b", "c", "c"] })
    );

    expect(violations.some((v) => v.detail.includes("lặp id"))).toBe(true);
  });

  it("im lặng khi ordering phủ đúng một lần mỗi vật", () => {
    expect(
      checkOrderingCoverage(dataset({ ordering: ["b", "a", "c"] }))
    ).toHaveLength(0);
  });
});

describe("BR-SDI-03 ordering không được là bản đảo ngược", () => {
  it("báo vi phạm khi ordering đúng bằng items đảo ngược", () => {
    const violations = checkOrderingNotReversed(
      dataset({ ordering: ["c", "b", "a"] })
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.rule).toBe("BR-SDI-03");
  });

  it("im lặng với kỹ năng nằm trong danh sách cho phép đảo", () => {
    const allowed = Object.keys(REVERSED_ORDERING_ALLOWLIST)[0] ?? "";

    expect(
      checkOrderingNotReversed(
        dataset({ skill_code: allowed, ordering: ["c", "b", "a"] })
      )
    ).toHaveLength(0);
  });

  it("im lặng khi ordering là một hoán vị thật sự", () => {
    expect(
      checkOrderingNotReversed(dataset({ ordering: ["b", "a", "c"] }))
    ).toHaveLength(0);
  });
});

describe("BR-SDI-04 trục phải khớp vật", () => {
  it("báo vi phạm khi giá trị trục không vật nào mang", () => {
    const violations = checkAxesBindToItems(
      dataset({ axes: { parity: { values: ["chẵn", "lẻ"] } } })
    );

    expect(violations).toHaveLength(2);
    expect(violations[0]?.detail).toContain("không vật nào mang");
  });

  it("báo vi phạm khi trục ordered nhưng value của vật không đơn điệu", () => {
    const violations = checkAxesBindToItems(
      dataset({
        items: [
          item("a", { value: 5, category: { size: "nhỏ" } }),
          item("b", { value: 1, category: { size: "vừa" } }),
          item("c", { value: 9, category: { size: "to" } }),
        ],
        axes: { size: { values: ["nhỏ", "vừa", "to"], ordered: true } },
      })
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.detail).toContain("không đơn điệu");
  });

  it("im lặng khi trục ordered có value tăng dần", () => {
    expect(
      checkAxesBindToItems(
        dataset({
          items: [
            item("a", { value: 1, category: { size: "nhỏ" } }),
            item("b", { value: 2, category: { size: "vừa" } }),
            item("c", { value: 3, category: { size: "to" } }),
          ],
          axes: { size: { values: ["nhỏ", "vừa", "to"], ordered: true } },
        })
      )
    ).toHaveLength(0);
  });
});

describe("BR-SDI-05 concept_label phải khớp tên kỹ năng", () => {
  it("báo vi phạm khi hai chỗ nói hai thứ khác nhau", () => {
    const violations = checkConceptLabelMatchesName(
      dataset({ concept_label: "Phân biệt số với chữ cái" }),
      identity({ name: "Số trước" })
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.rule).toBe("BR-SDI-05");
  });

  it("im lặng khi hai chỗ khớp nhau", () => {
    expect(checkConceptLabelMatchesName(dataset(), identity())).toHaveLength(0);
  });
});

describe("BR-SDI-06 audio_path phải có tệp", () => {
  it("báo vi phạm khi tệp âm thanh không tồn tại", () => {
    const violations = checkAudioPathsResolve(
      dataset({
        items: [item("a", { audio_path: "/audio/voice/c1/khong-co.mp3" })],
      }),
      () => false
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.detail).toContain("không có tệp");
  });

  it("im lặng khi tệp tồn tại", () => {
    expect(
      checkAudioPathsResolve(
        dataset({ items: [item("a", { audio_path: "/audio/voice/co.mp3" })] }),
        () => true
      )
    ).toHaveLength(0);
  });
});

describe("BR-SDI-07 chỗ trống prompt phải thay được", () => {
  it("báo vi phạm khi prompt khai chỗ trống không ai thay", () => {
    const violations = checkPromptPlaceholders(
      dataset({
        phrasing: { prompt_template: "Bạn nào đứng thứ {position}?" },
      }),
      ["label"]
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.detail).toContain("{position}");
  });

  it("im lặng khi mọi chỗ trống nằm trong hợp đồng của bộ dựng", () => {
    expect(
      checkPromptPlaceholders(
        dataset({ phrasing: { prompt_template: "Bé chọn {label} nhé!" } }),
        ["label"]
      )
    ).toHaveLength(0);
  });
});

describe("BR-SDI-08 id vật dùng lại phải cùng nghĩa", () => {
  it("báo vi phạm khi cùng id mang value khác nhau ở hai dataset", () => {
    const violations = checkCrossDatasetItemConsistency([
      dataset({ skill_code: "C1.CMP.14", items: [item("rua", { value: 1 })] }),
      dataset({ skill_code: "C1.CMP.15", items: [item("rua", { value: 2 })] }),
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.detail).toContain("C1.CMP.14");
  });

  it("im lặng khi cùng id mang cùng nghĩa", () => {
    expect(
      checkCrossDatasetItemConsistency([
        dataset({
          skill_code: "C1.CMP.14",
          items: [item("rua", { value: 1 })],
        }),
        dataset({
          skill_code: "C1.CMP.15",
          items: [item("rua", { value: 1 })],
        }),
      ])
    ).toHaveLength(0);
  });
});

describe("gom dataset", () => {
  it("gom cả dataset chủ đề gắn thẳng vào level", () => {
    const topic = dataset({ skill_code: "C1.TEST.02" });
    const all = collectAllDatasets({ "C1.TEST.01": dataset() }, [
      { levels: [{ dataset: topic }, {}] },
    ]);

    expect(all).toHaveLength(2);
  });
});

describe("cổng tổng", () => {
  it("gom vi phạm từ nhiều luật trong một lượt chạy", () => {
    const report = runDatasetIntegrityCheck({
      datasets: [
        dataset({
          ordering: ["c", "b", "a"],
          relations: [{ type: "pair", source_id: "a", target_id: "ma" }],
        }),
      ],
      identities: {},
      resolvesAudio: () => true,
      substitutedPlaceholders: ["label"],
    });

    expect(report.inspectedDatasets).toBe(1);
    expect(report.violations.map((v) => v.rule).sort()).toEqual([
      "BR-SDI-01",
      "BR-SDI-03",
    ]);
  });

  it("im lặng trên dataset sạch", () => {
    const report = runDatasetIntegrityCheck({
      datasets: [dataset({ ordering: ["b", "a", "c"] })],
      identities: { "C1.TEST.01": identity() },
      resolvesAudio: () => true,
      substitutedPlaceholders: ["label"],
    });

    expect(report.violations).toHaveLength(0);
  });
});
