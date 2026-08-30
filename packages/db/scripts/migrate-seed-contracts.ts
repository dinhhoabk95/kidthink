/**
 * Codemod một lần: đưa hạt giống level cũ về đúng `content_contract` của engine.
 *
 * Bối cảnh và bảng ánh xạ: `docs/tasks/162-seed-content-contract-migration-plan.md`.
 *
 * Script nạp **giá trị runtime** của từng mảng đã export rồi phát lại nguyên
 * khối literal — không regex trên nguồn, nên không có khả năng ghép sai cặp.
 * Bình luận trong khối bị mất; đó là cái giá đã biết trước.
 */
import fs from "node:fs";
import path from "node:path";
import { ALL_EMOJIS, getEmojiCode } from "@mindkid/emoji";
import { ALL_TEMPLATES } from "@mindkid/game-engine";

interface SeedHeader {
  code: string;
  template_code: string;
  instruction: string;
  title: string;
  age_min: number;
  age_max: number;
  [k: string]: unknown;
}
interface Seed {
  header: SeedHeader;
  content_pack: Record<string, unknown>;
  difficulty_params: Record<string, unknown>;
  [k: string]: unknown;
}
interface Asset {
  kind: "emoji";
  ref: string;
}
type Transform = (seed: Seed) => Seed | null;

// ── emoji: glyph thô → mã EMJ ────────────────────────────────────
const GLYPH_TO_REF = new Map<string, string>();
for (const entry of ALL_EMOJIS) {
  const code = getEmojiCode(entry);
  if (!GLYPH_TO_REF.has(entry.emoji)) {
    GLYPH_TO_REF.set(entry.emoji, code);
  }
  // Nhiều glyph mang đuôi VS16 (U+FE0F); tra cả bản đã lược.
  const stripped = entry.emoji.replace(/️/g, "");
  if (!GLYPH_TO_REF.has(stripped)) {
    GLYPH_TO_REF.set(stripped, code);
  }
}
const unmappedGlyphs = new Map<string, number>();

function refForGlyph(glyph: string): string {
  if (glyph.startsWith("EMJ-")) {
    return glyph;
  }
  const hit =
    GLYPH_TO_REF.get(glyph) ?? GLYPH_TO_REF.get(glyph.replace(/️/g, ""));
  if (hit) {
    return hit;
  }
  unmappedGlyphs.set(glyph, (unmappedGlyphs.get(glyph) ?? 0) + 1);
  return glyph;
}

/** Thẻ số trong nội dung cũ là chuỗi "3"; contract đòi asset. */
const DIGIT_REFS: Record<string, string> = {
  "0": "EMJ-zero",
  "1": "EMJ-one",
  "2": "EMJ-two",
  "3": "EMJ-three",
  "4": "EMJ-four",
  "5": "EMJ-five",
  "6": "EMJ-six",
  "7": "EMJ-seven",
  "8": "EMJ-eight",
  "9": "EMJ-nine",
  "10": "EMJ-ten",
};

const GLYPH_FIELDS = ["ref", "emoji"] as const;
const DIGIT_FIELDS = ["text", "label"] as const;

function toAsset(raw: unknown): Asset {
  if (typeof raw === "string") {
    return { kind: "emoji", ref: refForGlyph(raw) };
  }
  if (!(raw && typeof raw === "object")) {
    return { kind: "emoji", ref: "EMJ-star" };
  }
  const obj = raw as Record<string, unknown>;
  for (const field of GLYPH_FIELDS) {
    const value = obj[field];
    if (typeof value === "string") {
      return { kind: "emoji", ref: refForGlyph(value) };
    }
  }
  for (const field of DIGIT_FIELDS) {
    const value = obj[field];
    const digit =
      typeof value === "string" ? DIGIT_REFS[value.trim()] : undefined;
    if (digit) {
      return { kind: "emoji", ref: digit };
    }
  }
  return { kind: "emoji", ref: "EMJ-star" };
}

/** `prompt` của mọi contract là 4..80 ký tự. Lấy từ instruction, không bịa. */
function promptFrom(seed: Seed, fallback: string): string {
  const raw =
    (typeof seed.content_pack.prompt === "string"
      ? seed.content_pack.prompt
      : "") ||
    seed.header.instruction ||
    seed.header.title ||
    fallback;
  const trimmed = raw.trim();
  if (trimmed.length <= 80) {
    return trimmed.length >= 4 ? trimmed : fallback;
  }
  return `${trimmed.slice(0, 77).trimEnd()}...`;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function retarget(seed: Seed, templateCode: string): SeedHeader {
  return { ...seed.header, template_code: templateCode };
}

// ── các phép chuyển ──────────────────────────────────────────────

/** Chỉ thiếu hai trường độ khó chung. */
const addRetryFields: Transform = (seed) => ({
  ...seed,
  content_pack: seed.content_pack,
  difficulty_params: {
    ...seed.difficulty_params,
    hint_after_ms: 9000,
    allow_retry: true,
  },
});

/** Ghép cặp — đổi tên khoá trong `pairs[]`, thêm prompt. */
const toPairMatch: Transform = (seed) => {
  const pairs = seed.content_pack.pairs as
    | Record<string, Record<string, unknown>>[]
    | undefined;
  if (!pairs || pairs.length < 2 || pairs.length > 6) {
    return null;
  }
  return {
    ...seed,
    header: retarget(seed, "GT-005"),
    content_pack: {
      prompt: promptFrom(seed, "Bé hãy nối các cặp cho đúng nhé"),
      pairs: pairs.map((p, i) => ({
        pair_id: String(p.pair_id ?? p.id ?? `pair-${i + 1}`),
        left: {
          item_id: String(p.left?.id ?? p.left?.item_id ?? `left-${i + 1}`),
          asset: toAsset(p.left),
        },
        right: {
          item_id: String(p.right?.id ?? p.right?.item_id ?? `right-${i + 1}`),
          asset: toAsset(p.right),
        },
      })),
    },
    difficulty_params: {
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_sides: false,
    },
  };
};

/** Kéo vào một đích duy nhất. */
function buildDragToContainer(
  seed: Seed,
  container: { id: string; label: string; attribute: string },
  items: Array<{
    id: string;
    attribute: string;
    asset: Asset;
    correct: boolean;
  }>
): Seed | null {
  if (items.length < 2 || items.length > 6) {
    return null;
  }
  const targetCount = items.filter((i) => i.correct).length;
  const distractorCount = items.length - targetCount;
  if (targetCount < 1 || targetCount > 4 || distractorCount > 4) {
    return null;
  }
  return {
    ...seed,
    header: retarget(seed, "GT-003"),
    content_pack: {
      prompt: promptFrom(seed, "Bé hãy kéo đúng vật vào giỏ nhé"),
      container: {
        container_id: container.id,
        label: container.label.slice(0, 40),
        accepts_attribute: container.attribute,
      },
      items: items.map((i) => ({
        item_id: i.id,
        attribute: i.attribute,
        asset: i.asset,
        is_correct: i.correct,
      })),
    },
    difficulty_params: {
      distractor_count: distractorCount,
      target_count: targetCount,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  };
}

/** Phân nhóm — 2..4 nhóm, 4..10 vật. */
function buildSortGroups(
  seed: Seed,
  groups: Array<{ id: string; label: string; emoji: string }>,
  items: Array<{ id: string; asset: Asset; groupId: string }>
): Seed | null {
  if (groups.length < 2 || groups.length > 4) {
    return null;
  }
  if (items.length < 4 || items.length > 10) {
    return null;
  }
  const idMap = new Map(groups.map((g, i) => [g.id, `g${i}`]));
  const mapped = items.map((i) => ({
    item_id: i.id,
    asset: i.asset,
    correct_group_id: idMap.get(i.groupId) ?? "g0",
  }));
  const used = new Set(mapped.map((i) => i.correct_group_id));
  if (used.size !== groups.length) {
    return null;
  }
  return {
    ...seed,
    header: retarget(seed, "GT-004"),
    content_pack: {
      prompt: promptFrom(seed, "Bé hãy xếp các vật vào đúng nhóm nhé"),
      groups: groups.map((g, i) => ({
        group_id: `g${i}`,
        label: g.label.slice(0, 24),
        label_emoji: refForGlyph(g.emoji),
      })),
      items: mapped,
    },
    difficulty_params: {
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  };
}

type AxisResolver = (box: Record<string, unknown>) => string | null;
type AttrResolver = (
  raw: Record<string, unknown>,
  axis: string | null
) => string;

function singleContainer(
  seed: Seed,
  box: Record<string, unknown>,
  dragItems: Record<string, unknown>[],
  axisOf: AxisResolver,
  attrOf: AttrResolver
): Seed | null {
  const axis = axisOf(box);
  const attribute = axis
    ? String(box[`target_${axis}`])
    : String(box.color ?? box.attribute ?? box.label ?? "");
  return buildDragToContainer(
    seed,
    {
      id: String(box.id ?? "container-1"),
      label: String(box.label ?? "Giỏ"),
      attribute,
    },
    dragItems.map((item, i) => ({
      id: String(item.id ?? `item-${i + 1}`),
      attribute: attrOf(item, axis),
      asset: toAsset(item),
      correct:
        attrOf(item, axis) === attribute ||
        String(item.target_bin ?? "") === String(box.id ?? ""),
    }))
  );
}

/** `containers` + `drag_items` — một giỏ thì kéo vào đích, nhiều giỏ thì phân nhóm. */
const toContainerFamily: Transform = (seed) => {
  const containers = (seed.content_pack.containers ?? seed.content_pack.bins) as
    | Record<string, unknown>[]
    | undefined;
  const dragItems = (seed.content_pack.drag_items ?? seed.content_pack.items) as
    | Record<string, unknown>[]
    | undefined;
  if (!(containers && dragItems) || containers.length === 0) {
    return null;
  }

  // Nội dung cũ đặt tiêu chí phân loại dưới nhiều tên: màu, loại, hình dạng,
  // kích thước. Dò theo cặp `target_<trục>` trên giỏ và `<trục>` trên vật.
  const axisOf = (box: Record<string, unknown>): string | null => {
    for (const key of Object.keys(box)) {
      if (key.startsWith("target_") && typeof box[key] === "string") {
        return key.slice("target_".length);
      }
    }
    return null;
  };
  const attrOf = (raw: Record<string, unknown>, axis: string | null): string =>
    String(
      (axis ? raw[axis] : undefined) ??
        raw.color ??
        raw.type ??
        raw.attribute ??
        ""
    );

  if (containers.length === 1) {
    return singleContainer(
      seed,
      containers[0] as Record<string, unknown>,
      dragItems,
      axisOf,
      attrOf
    );
  }

  return buildSortGroups(
    seed,
    containers.map((box, i) => ({
      id: String(box.id ?? `bin-${i + 1}`),
      label: String(box.label ?? `Nhóm ${i + 1}`),
      emoji: String(box.emoji ?? box.label_emoji ?? "EMJ-basket"),
    })),
    dragItems.map((item, i) => ({
      id: String(item.id ?? `item-${i + 1}`),
      asset: toAsset(item),
      groupId: String(
        item.target_bin ??
          item.correct_group_id ??
          containers.find((b) => {
            const axis = axisOf(b);
            return axis
              ? String(b[`target_${axis}`]) === String(item[axis])
              : false;
          })?.id ??
          ""
      ),
    }))
  );
};

/** Kéo N vật vào một giỏ có sẵn `target_count`. */
const toDragCount: Transform = (seed) => {
  const source = seed.content_pack.source_items as
    | Record<string, unknown>[]
    | undefined;
  const box = seed.content_pack.target_container as
    | Record<string, unknown>
    | undefined;
  if (!(source && box)) {
    return null;
  }
  const need = Number(box.target_count ?? 1);
  return buildDragToContainer(
    seed,
    {
      id: String(box.id ?? "basket"),
      label: String(box.label ?? "Giỏ"),
      attribute: "target",
    },
    source.map((item, i) => ({
      id: String(item.id ?? `item-${i + 1}`),
      attribute: "target",
      asset: toAsset(item),
      correct: i < need,
    }))
  );
};

/** Đếm rồi chọn số — engine `flash-recall` là chỗ duy nhất diễn đạt được. */
const toCountRecall: Transform = (seed) => {
  const items = seed.content_pack.items as
    | Record<string, unknown>[]
    | undefined;
  const targetCount = Number(seed.content_pack.target_count ?? 0);
  if (!items || items.length < 1 || items.length > 6) {
    return null;
  }
  if (targetCount !== items.length || targetCount < 1 || targetCount > 10) {
    return null;
  }
  const values = new Set<number>([targetCount]);
  for (const delta of [1, -1, 2, -2]) {
    const candidate = targetCount + delta;
    if (values.size < 3 && candidate >= 1 && candidate <= 10) {
      values.add(candidate);
    }
  }
  const options = [...values]
    .sort((a, b) => a - b)
    .map((value) => ({ value, is_correct: value === targetCount }));
  return {
    ...seed,
    header: retarget(seed, "GT-012"),
    content_pack: {
      prompt: promptFrom(seed, "Bé đếm xem có mấy vật nhé"),
      flash_items: items.map((item, i) => ({
        item_id: String(item.id ?? `it-${i + 1}`),
        asset: toAsset(item),
      })),
      arrangement: "line",
      options,
    },
    difficulty_params: {
      flash_ms: 3000,
      item_count: items.length,
      distractor_count: clamp(options.length - 1, 1, 5),
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  };
};

/** Nhìn chớp đếm nhanh — khuôn cũ đã đúng cơ chế, chỉ sai tên trường. */
const toFlashRecall: Transform = (seed) => {
  const flashItems = seed.content_pack.flash_items as
    | Record<string, unknown>[]
    | undefined;
  const rawOptions = seed.content_pack.options as unknown[] | undefined;
  const correct = Number(seed.content_pack.correct_answer ?? 0);
  if (!(flashItems && rawOptions) || flashItems.length < 1) {
    return null;
  }
  if (flashItems.length > 6 || correct !== flashItems.length) {
    return null;
  }
  const values = rawOptions.map((o) =>
    typeof o === "number" ? o : Number((o as Record<string, unknown>).value)
  );
  if (values.some((v) => !Number.isInteger(v) || v < 1 || v > 10)) {
    return null;
  }
  if (values.filter((v) => v === correct).length !== 1) {
    return null;
  }
  const flashMs = clamp(
    Number(seed.content_pack.flash_duration_ms ?? 1500),
    800,
    3000
  );
  return {
    ...seed,
    header: retarget(seed, "GT-012"),
    content_pack: {
      prompt: promptFrom(seed, "Bé nhìn nhanh xem có mấy vật nhé"),
      flash_items: flashItems.map((item, i) => ({
        item_id: String(item.id ?? `it-${i + 1}`),
        asset: toAsset(item),
      })),
      arrangement: "dice",
      options: values.map((value) => ({
        value,
        is_correct: value === correct,
      })),
    },
    difficulty_params: {
      flash_ms: flashMs,
      item_count: flashItems.length,
      distractor_count: clamp(values.length - 1, 1, 5),
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  };
};

/** Chọn một đáp án — khuôn cũ đúng cơ chế, sai tên khoá. */
const toTapSelect: Transform = (seed) => {
  const options = seed.content_pack.options as
    | Record<string, unknown>[]
    | undefined;
  if (!options || options.length < 2 || options.length > 6) {
    return null;
  }
  if (options.filter((o) => o.is_correct === true).length !== 1) {
    return null;
  }
  const rawTarget = seed.content_pack.target_item ?? seed.content_pack.target;
  const correctOption = options.find((o) => o.is_correct === true);
  const targetSource =
    rawTarget && typeof rawTarget === "object" ? rawTarget : correctOption;
  return {
    ...seed,
    header: retarget(seed, "GT-001"),
    content_pack: {
      prompt: promptFrom(seed, "Bé hãy chọn đáp án đúng nhé"),
      target_item: {
        item_id: String(
          (targetSource as Record<string, unknown>)?.id ??
            (targetSource as Record<string, unknown>)?.item_id ??
            "target"
        ),
        asset: toAsset(targetSource),
      },
      options: options.map((o, i) => ({
        item_id: String(o.id ?? o.item_id ?? `opt-${i + 1}`),
        asset: toAsset(o),
        is_correct: o.is_correct === true,
      })),
    },
    difficulty_params: {
      distractor_count: clamp(options.length - 1, 1, 5),
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: true,
    },
  };
};

/** Sắp xếp thứ tự — `items` + `correct_order` → `sequence`. */
const toSequenceOrder: Transform = (seed) => {
  const items = seed.content_pack.items as
    | Record<string, unknown>[]
    | undefined;
  const order = seed.content_pack.correct_order as string[] | undefined;
  if (!(items && order) || items.length < 3 || items.length > 5) {
    return null;
  }
  const sequence = items.map((item, i) => {
    const label = String(item.label ?? item.id ?? i);
    const idx = order.indexOf(label);
    return {
      step_id: String(item.id ?? `step-${i + 1}`),
      order_index: idx >= 0 ? idx : i,
      asset: toAsset(item),
      label,
    };
  });
  const seen = new Set(sequence.map((s) => s.order_index));
  if (seen.size !== sequence.length) {
    return null;
  }
  return {
    ...seed,
    header: retarget(seed, "GT-006"),
    content_pack: {
      prompt: promptFrom(seed, "Bé hãy xếp theo đúng thứ tự nhé"),
      sequence,
    },
    difficulty_params: {
      hint_after_ms: 12_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  };
};

const CLOCK_TEXT_REGEX = /^(\d{1,2}):(\d{2})$/;

/** Xem giờ — `clock_display` + phương án chữ "3:00". */
const toClockRead: Transform = (seed) => {
  const clock = seed.content_pack.clock_display as
    | Record<string, unknown>
    | undefined;
  const options = seed.content_pack.options as
    | Record<string, unknown>[]
    | undefined;
  if (!(clock && options)) {
    return null;
  }
  const parse = (text: string): { hour: number; minute: 0 | 30 } | null => {
    const match = CLOCK_TEXT_REGEX.exec(text);
    if (!match) {
      return null;
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 1 || hour > 12 || (minute !== 0 && minute !== 30)) {
      return null;
    }
    return { hour, minute: minute as 0 | 30 };
  };
  const parsed = options.map((o) => ({
    time: parse(String(o.text ?? "")),
    correct: o.is_correct === true,
  }));
  if (parsed.some((p) => p.time === null) || parsed.length < 2) {
    return null;
  }
  const target = parse(String(seed.content_pack.target ?? ""));
  if (!target) {
    return null;
  }
  return {
    ...seed,
    header: retarget(seed, "GT-016"),
    content_pack: {
      prompt: promptFrom(seed, "Đồng hồ đang chỉ mấy giờ nhỉ"),
      mode: "read",
      target_time: target,
      options: parsed.slice(0, 4).map((p) => ({
        hour: p.time?.hour ?? 12,
        minute: p.time?.minute ?? 0,
        is_correct: p.correct,
      })),
      activity_cards: [],
    },
    difficulty_params: {
      minute_step: 30,
      distractor_count: clamp(parsed.length - 1, 0, 4),
      hint_after_ms: 9000,
      allow_retry: true,
    },
  };
};

/** Tìm vật trong khung cảnh — lưới ô cũ trở thành `scene_objects`. */
const toHiddenObject: Transform = (seed) => {
  const grid = seed.content_pack.grid as
    | Record<string, unknown>[][]
    | undefined;
  const targetId = String(seed.content_pack.target_id ?? "");
  if (!grid) {
    return null;
  }
  const cells = grid.flat();
  if (cells.length < 3 || cells.length > 12) {
    return null;
  }
  if (!cells.some((c) => String(c.id) === targetId)) {
    return null;
  }
  return {
    ...seed,
    header: retarget(seed, "GT-022"),
    content_pack: {
      prompt: promptFrom(seed, "Bé hãy tìm và chạm vào vật đúng nhé"),
      target_description: seed.header.title.slice(0, 80),
      scene_objects: cells.map((cell, i) => ({
        id: String(cell.id ?? `obj-${i + 1}`),
        asset: toAsset(cell),
        is_target: String(cell.id) === targetId,
        is_hidden: false,
      })),
    },
    difficulty_params: {
      hint_after_ms: 9000,
      allow_retry: true,
      show_target_counter: true,
    },
  };
};

/** Năm hạt lệch nhẹ, mỗi hạt một trường sai — vá tại chỗ. */
const patchNearMiss: Transform = (seed) => {
  const pack = { ...seed.content_pack };
  const diff = { ...seed.difficulty_params };

  if (pack.arrangement === "scattered") {
    pack.arrangement = "random";
  }
  if (pack.regions === "blocks_2x2") {
    pack.regions = "row_col_box";
  }
  if (typeof pack.target_item_id === "string") {
    pack.target_sequence = [pack.target_item_id];
    pack.target_item_id = undefined;
  }
  if (pack.response_mode === "single") {
    pack.response_mode = "select";
  }
  if (Array.isArray(pack.options) && pack.options.length === 0) {
    pack.options = undefined;
  }
  if (Array.isArray(pack.activity_cards) && pack.activity_cards.length === 0) {
    pack.activity_cards = undefined;
  }
  // `distractor_count` của GT-016 nhận 1..3; chế độ "set" không có phương án
  // nhiễu nên nội dung cũ ghi 0.
  if (diff.distractor_count === 0) {
    diff.distractor_count = 1;
  }
  return { ...seed, content_pack: pack, difficulty_params: diff };
};

// ── bảng điều phối ───────────────────────────────────────────────
const TRANSFORMS: Record<string, Transform> = {
  "GT-007|options,parts,prompt,scaffolding,whole": addRetryFields,
  "GT-008|items,prompt,scaffolding,slots": addRetryFields,
  "GT-005|pairs,scaffolding": toPairMatch,
  "GT-002|pairs,scaffolding": toPairMatch,
  "GT-002|containers,drag_items": toContainerFamily,
  "GT-004|bins,items,scaffolding": toContainerFamily,
  "GT-003|scaffolding,source_items,target_container": toDragCount,
  "GT-001|items,target_count": toCountRecall,
  "GT-001|items,options,scaffolding,target_count": toCountRecall,
  "GT-006|correct_answer,flash_duration_ms,flash_items,options": toFlashRecall,
  "GT-001|options,scaffolding,target_item": toTapSelect,
  "GT-001|options,scaffolding,target": toTapSelect,
  "GT-001|missing_index,options,scaffolding,sequence,target": toTapSelect,
  "GT-006|correct_order,items,scaffolding": toSequenceOrder,
  "GT-001|clock_display,options,scaffolding,target": toClockRead,
  "GT-005|grid,target_id": toHiddenObject,
  "GT-011|matrix,options,prompt": patchNearMiss,
  "GT-012|arrangement,flash_items,options,prompt": patchNearMiss,
  "GT-015|cells,grid_size,prompt,regions,symbols": patchNearMiss,
  "GT-016|activity_cards,initial_time,mode,options,prompt,target_time":
    patchNearMiss,
  "GT-016|activity_cards,mode,options,prompt,target_time": patchNearMiss,
  "GT-018|audio_prompt,options,prompt,response_mode,target_item_id":
    patchNearMiss,
};

function shapeKey(seed: Seed): string {
  return `${seed.header.template_code}|${Object.keys(seed.content_pack).sort().join(",")}`;
}

function isContractValid(seed: Seed): boolean {
  const tmpl = ALL_TEMPLATES[seed.header.template_code];
  if (!tmpl) {
    return false;
  }
  return (
    tmpl.content_contract.safeParse(seed.content_pack).success &&
    tmpl.difficulty_contract.safeParse(seed.difficulty_params).success
  );
}

export interface MigrationOutcome {
  migrated: number;
  alreadyValid: number;
  quarantined: string[];
  seeds: Seed[];
}

export function migrateSeeds(seeds: Seed[]): MigrationOutcome {
  const out: Seed[] = [];
  const quarantined: string[] = [];
  let migrated = 0;
  let alreadyValid = 0;

  for (const seed of seeds) {
    if (isContractValid(seed)) {
      alreadyValid++;
      out.push(seed);
      continue;
    }
    const transform = TRANSFORMS[shapeKey(seed)];
    const candidate = transform ? transform(seed) : null;
    if (candidate && isContractValid(candidate)) {
      migrated++;
      out.push(candidate);
      continue;
    }
    quarantined.push(`${seed.header.code} [${shapeKey(seed)}]`);
    out.push(seed);
  }

  return { migrated, alreadyValid, quarantined, seeds: out };
}

// ── ghi lại khối literal trong file nguồn ────────────────────────
export function rewriteArrayLiteral(
  filePath: string,
  exportName: string,
  value: unknown[]
): void {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const startIdx = lines.findIndex((line) =>
    line.startsWith(`export const ${exportName}`)
  );
  if (startIdx === -1) {
    throw new Error(
      `Không thấy 'export const ${exportName}' trong ${filePath}`
    );
  }
  if (!lines[startIdx]?.trimEnd().endsWith("= [")) {
    throw new Error(
      `'export const ${exportName}' trong ${filePath} không mở literal mảng trên cùng dòng.`
    );
  }
  const endIdx = lines.findIndex((line, i) => i > startIdx && line === "];");
  if (endIdx === -1) {
    throw new Error(`Không thấy dòng đóng '];' cho ${exportName}`);
  }

  const body = JSON.stringify(value, null, 2)
    .split("\n")
    .slice(1, -1)
    .join("\n");
  const next = [
    ...lines.slice(0, startIdx),
    lines[startIdx] as string,
    body,
    "];",
    ...lines.slice(endIdx + 1),
  ];
  fs.writeFileSync(filePath, next.join("\n"), "utf-8");
}

export function reportUnmappedGlyphs(): [string, number][] {
  return [...unmappedGlyphs.entries()].sort((a, b) => b[1] - a[1]);
}

export const SEED_ROOT = path.resolve(
  import.meta.dirname,
  "../src/seed-content"
);
