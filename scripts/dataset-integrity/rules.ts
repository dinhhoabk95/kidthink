/**
 * Luật toàn vẹn cho bộ dữ liệu kỹ năng (Task #267 review / `BR-SDI-01..08`).
 *
 * Mọi luật ở đây là hàm thuần: nhận dataset, trả vi phạm. Không đọc đĩa, không
 * đọc biến môi trường — nhờ vậy mỗi luật có ca âm chạy được trong
 * `scripts/check-dataset-integrity.test.ts`.
 *
 * Vì sao cổng này tồn tại: cổng `check-thinking-structure` chỉ đo **hình dạng**
 * (có mảng `relations` không, `ordering` có khác thứ tự khai không, `axes` có mấy
 * khoá). Nó không hề đo rằng quan hệ trỏ vào vật có thật, rằng `ordering` đúng
 * chiều, hay rằng giá trị trục khớp vật nào. Task #267 khai đủ hình dạng và sai
 * nghĩa, cổng vẫn xanh. Đây là chỗ bịt.
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import type {
  DatasetAxis,
  DatasetAxisObject,
  DatasetItem,
  SkillDataset,
  SkillIdentity,
} from "@mindkid/shared";

export interface IntegrityViolation {
  readonly rule: string;
  readonly skillCode: string;
  readonly detail: string;
}

/**
 * Kỹ năng mà `ordering` ngược chiều khai `items` là ĐÚNG, vì chính kỹ năng đó
 * dạy chiều ngược. Mọi mã khác nằm ngoài danh sách này mà đảo ngược đều là dấu
 * hiệu đảo mảng cho qua cổng `hasNonTrivialOrdering`, không phải soạn nội dung.
 *
 * Cấm — NEVER thêm mã vào đây để cổng xanh: phải kèm lý do vì sao chiều ngược là
 * nội dung đúng của kỹ năng.
 */
export const REVERSED_ORDERING_ALLOWLIST: Readonly<Record<string, string>> = {
  "C1.CNT.04": "Đếm ngược — chiều giảm chính là kỹ năng được dạy.",
  "C1.ORD.06": "Thứ tự ngược từ cuối lên — chiều giảm là nội dung của kỹ năng.",
};

function itemIds(dataset: SkillDataset): readonly string[] {
  return dataset.items.map((item) => item.id);
}

function getAxisValues(axis: DatasetAxis): readonly string[] {
  if (Array.isArray(axis)) {
    return axis;
  }
  return (axis as DatasetAxisObject).values;
}

function isOrderedAxis(axis: DatasetAxis): boolean {
  if (typeof axis === "object" && !Array.isArray(axis)) {
    return (axis as DatasetAxisObject).ordered === true;
  }
  return false;
}

/** `BR-SDI-01` — quan hệ phải trỏ vào vật có thật, không tự trỏ, không trùng cạnh. */
export function checkRelationIntegrity(
  dataset: SkillDataset
): readonly IntegrityViolation[] {
  const relations = dataset.relations;
  if (!relations) {
    return [];
  }
  const code = dataset.skill_code;
  const known = new Set(itemIds(dataset));
  const violations: IntegrityViolation[] = [];
  const seenEdges = new Map<string, string>();

  for (const rel of relations) {
    for (const [side, id] of [
      ["source_id", rel.source_id],
      ["target_id", rel.target_id],
    ] as const) {
      if (!known.has(id)) {
        violations.push({
          rule: "BR-SDI-01",
          skillCode: code,
          detail: `quan hệ ${rel.type} có ${side} "${id}" không nằm trong items`,
        });
      }
    }

    if (rel.source_id === rel.target_id) {
      violations.push({
        rule: "BR-SDI-01",
        skillCode: code,
        detail: `quan hệ ${rel.type} tự trỏ: "${rel.source_id}" → chính nó`,
      });
    }

    const edgeKey = `${rel.source_id}→${rel.target_id}`;
    const priorType = seenEdges.get(edgeKey);
    if (priorType !== undefined && priorType !== rel.type) {
      violations.push({
        rule: "BR-SDI-01",
        skillCode: code,
        detail: `cạnh ${edgeKey} khai hai kiểu mâu thuẫn: ${priorType} và ${rel.type}`,
      });
    }
    seenEdges.set(edgeKey, rel.type);
  }

  return violations;
}

/** `BR-SDI-02` — `ordering` phải trỏ vào vật có thật và không lặp id. */
export function checkOrderingCoverage(
  dataset: SkillDataset
): readonly IntegrityViolation[] {
  const ordering = dataset.ordering;
  if (!ordering) {
    return [];
  }
  const code = dataset.skill_code;
  const known = new Set(itemIds(dataset));
  const violations: IntegrityViolation[] = [];

  for (const id of ordering) {
    if (!known.has(id)) {
      violations.push({
        rule: "BR-SDI-02",
        skillCode: code,
        detail: `ordering chứa "${id}" không nằm trong items`,
      });
    }
  }

  if (new Set(ordering).size !== ordering.length) {
    violations.push({
      rule: "BR-SDI-02",
      skillCode: code,
      detail: "ordering lặp id",
    });
  }

  // Cấm — NEVER đòi `ordering` phủ hết `items`: vật nhiễu nằm ngoài dãy có thứ
  // tự là chuyện bình thường. Chỉ id ma và id lặp mới là lỗi toàn vẹn.
  return violations;
}

/** `BR-SDI-03` — `ordering` không được là bản đảo ngược nguyên xi của `items`. */
export function checkOrderingNotReversed(
  dataset: SkillDataset
): readonly IntegrityViolation[] {
  const ordering = dataset.ordering;
  if (!ordering || ordering.length < 2) {
    return [];
  }
  const code = dataset.skill_code;
  if (code in REVERSED_ORDERING_ALLOWLIST) {
    return [];
  }
  const reversed = [...itemIds(dataset)].reverse();
  if (
    ordering.length === reversed.length &&
    ordering.every((id, i) => id === reversed[i])
  ) {
    return [
      {
        rule: "BR-SDI-03",
        skillCode: code,
        detail:
          "ordering đúng bằng bản đảo ngược của items — dấu hiệu đảo mảng cho " +
          "qua cổng chứ không soạn thứ tự thật",
      },
    ];
  }
  return [];
}

function itemAxisValue(item: DatasetItem, axisKey: string): string | undefined {
  return item.category?.[axisKey];
}

/** `BR-SDI-04` — mọi giá trị trục phải khớp ít nhất một vật; trục `ordered` phải thật sự xếp được. */
export function checkAxesBindToItems(
  dataset: SkillDataset
): readonly IntegrityViolation[] {
  const axes = dataset.axes;
  if (!axes) {
    return [];
  }
  const code = dataset.skill_code;
  const violations: IntegrityViolation[] = [];

  for (const [axisKey, axis] of Object.entries(axes)) {
    const values = getAxisValues(axis);
    const matchedValues: string[] = [];

    for (const value of values) {
      const matches = dataset.items.filter(
        (item) => itemAxisValue(item, axisKey) === value
      );
      if (matches.length === 0) {
        violations.push({
          rule: "BR-SDI-04",
          skillCode: code,
          detail: `trục "${axisKey}" khai giá trị "${value}" không vật nào mang (category.${axisKey})`,
        });
        continue;
      }
      matchedValues.push(value);
    }

    if (!isOrderedAxis(axis) || matchedValues.length !== values.length) {
      continue;
    }

    // `ordered: true` nghĩa là thang có chiều. Chiều đó phải đọc được từ `value`
    // của vật, nếu không thì cờ chỉ là trang trí.
    const rankPerValue = values.map((value) => {
      const first = dataset.items.find(
        (item) => itemAxisValue(item, axisKey) === value
      );
      return first?.value;
    });
    if (rankPerValue.some((v) => v === undefined)) {
      violations.push({
        rule: "BR-SDI-04",
        skillCode: code,
        detail: `trục "${axisKey}" khai ordered: true nhưng vật của nó không mang value để xếp chiều`,
      });
      continue;
    }
    const ranks = rankPerValue as number[];
    const ascending = ranks.every(
      (v, i) => i === 0 || v > (ranks[i - 1] ?? Number.NEGATIVE_INFINITY)
    );
    const descending = ranks.every(
      (v, i) => i === 0 || v < (ranks[i - 1] ?? Number.POSITIVE_INFINITY)
    );
    if (!(ascending || descending)) {
      violations.push({
        rule: "BR-SDI-04",
        skillCode: code,
        detail: `trục "${axisKey}" khai ordered: true nhưng value của vật không đơn điệu: ${ranks.join(", ")}`,
      });
    }
  }

  return violations;
}

/** `BR-SDI-05` — tên kỹ năng và nhãn khái niệm phải nói cùng một thứ. */
export function checkConceptLabelMatchesName(
  dataset: SkillDataset,
  identity: SkillIdentity | undefined
): readonly IntegrityViolation[] {
  if (!identity || identity.name === dataset.concept_label) {
    return [];
  }
  return [
    {
      rule: "BR-SDI-05",
      skillCode: dataset.skill_code,
      detail:
        `identity.name "${identity.name}" khác concept_label ` +
        `"${dataset.concept_label}" — concept_label là thứ trẻ đọc được`,
    },
  ];
}

/** `BR-SDI-06` — mọi `audio_path` phải trỏ vào tệp có thật. */
export function checkAudioPathsResolve(
  dataset: SkillDataset,
  resolves: (audioPath: string) => boolean
): readonly IntegrityViolation[] {
  const violations: IntegrityViolation[] = [];
  for (const item of dataset.items) {
    if (item.audio_path !== undefined && !resolves(item.audio_path)) {
      violations.push({
        rule: "BR-SDI-06",
        skillCode: dataset.skill_code,
        detail: `vật "${item.id}" khai audio_path "${item.audio_path}" không có tệp`,
      });
    }
  }
  return violations;
}

const PLACEHOLDER_PATTERN = /\{([a-z_]+)\}/g;

/** `BR-SDI-07` — chỗ trống trong prompt phải là chỗ bộ dựng thay được. */
export function checkPromptPlaceholders(
  dataset: SkillDataset,
  substituted: readonly string[]
): readonly IntegrityViolation[] {
  const template = dataset.phrasing?.prompt_template;
  if (!template) {
    return [];
  }
  const allowed = new Set(substituted);
  const violations: IntegrityViolation[] = [];
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    const name = match[1];
    if (name !== undefined && !allowed.has(name)) {
      violations.push({
        rule: "BR-SDI-07",
        skillCode: dataset.skill_code,
        detail:
          `prompt khai chỗ trống "{${name}}" mà bộ dựng không thay — ` +
          "trẻ sẽ đọc ra nguyên chuỗi này",
      });
    }
  }
  return violations;
}

/**
 * `BR-SDI-08` — cùng một id vật, dùng ở nhiều dataset, phải mang cùng LƯỢNG.
 *
 * Chỉ đối chiếu `value`, không đối chiếu `label`: corpus cố ý dùng lại id chung
 * cho cùng một VAI (`size_more`, `length_less`) trên những vật cụ thể khác nhau
 * — quả bóng to ở kỹ năng này, chiếc hộp to ở kỹ năng kia. Nhãn khác nhau ở đó
 * là đúng. Lượng khác nhau mới là mâu thuẫn: cùng `speed_turtle_less` mà chỗ
 * khai 1 chỗ khai 2 thì hai bài dạy hai thang khác nhau.
 */
export function checkCrossDatasetItemConsistency(
  datasets: readonly SkillDataset[]
): readonly IntegrityViolation[] {
  const seen = new Map<string, { skillCode: string; item: DatasetItem }>();
  const violations: IntegrityViolation[] = [];

  for (const dataset of datasets) {
    for (const item of dataset.items) {
      const prior = seen.get(item.id);
      if (!prior) {
        seen.set(item.id, { skillCode: dataset.skill_code, item });
        continue;
      }
      if (
        prior.item.value !== undefined &&
        item.value !== undefined &&
        prior.item.value !== item.value
      ) {
        violations.push({
          rule: "BR-SDI-08",
          skillCode: dataset.skill_code,
          detail:
            `vật "${item.id}" mâu thuẫn với ${prior.skillCode}: ` +
            `(${prior.item.label}, value=${String(prior.item.value)}) ` +
            `vs (${item.label}, value=${String(item.value)})`,
        });
      }
    }
  }

  return violations;
}

/**
 * `BR-SDI-09` — `glyph` không được bằng `image.ref`.
 *
 * Vật mang `glyph` khi và chỉ khi nó dạy một ký hiệu viết được (chữ số, chữ cái, dấu).
 * Vật là tranh minh hoạ chỉ mang `image` (hoặc `glyph` khác `image.ref` nếu là thẻ mang chữ số).
 * Gán `glyph === image.ref` là vi phạm nguyên tắc phân định vai trò giữa tranh và ký hiệu.
 */
export function checkGlyphNotEqualImageRef(
  dataset: SkillDataset
): readonly IntegrityViolation[] {
  const violations: IntegrityViolation[] = [];
  for (const item of dataset.items) {
    if (
      item.glyph &&
      item.image?.kind === "emoji" &&
      item.glyph === item.image.ref
    ) {
      violations.push({
        rule: "BR-SDI-09",
        skillCode: dataset.skill_code,
        detail:
          `vật "${item.id}" có glyph "${item.glyph}" trùng image.ref — ` +
          "vật tranh chỉ mang image, không được gán glyph trùng hình",
      });
    }
  }
  return violations;
}
