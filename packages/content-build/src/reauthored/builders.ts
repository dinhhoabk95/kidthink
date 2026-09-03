/**
 * Bộ dựng `content_pack` cho từng engine, dùng khi soạn lại nội dung.
 *
 * Mỗi hàm trả về đúng ba thứ mà một hạt giống cần đổi: `template_code`,
 * `content_pack`, `difficulty_params`. Phần đầu (mã, tiêu đề, kỹ năng, tag,
 * band tuổi, gói) giữ nguyên từ hạt gốc.
 *
 * Viết bộ dựng thay vì chép tay 73 khối JSON vì hai lý do: khối tay dễ lệch
 * một trường mà zod mới bắt được, và mọi ràng buộc số (số ô, số phương án,
 * khoảng `hint_after_ms`) nằm đúng một chỗ để đọc lại.
 */

export interface Asset {
  kind: "emoji";
  ref: string;
}

export interface ReauthoredPack {
  template_code: string;
  title?: string;
  instruction?: string;
  content_pack: Record<string, unknown>;
  difficulty_params: Record<string, unknown>;
}

function asset(ref: string): Asset {
  return { kind: "emoji", ref };
}

/** Thẻ số 1–10 dùng cho các level xếp thứ tự số. */
export const DIGIT_REFS: readonly string[] = [
  "0️⃣",
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
];

export interface TapOption {
  id: string;
  ref: string;
  correct?: boolean;
}

/**
 * `GT-001` — chọn một đáp án.
 *
 * `GT001Session` chỉ vẽ `prompt` và `options`; `target_item` có trong contract
 * nhưng session Cấm — NEVER đọc tới. Nó vẫn phải hợp lệ, nên trỏ vào phương án
 * đúng: không hiện ra màn hình, và không nói dối về nội dung.
 */
export function tapSelect(
  prompt: string,
  options: readonly TapOption[]
): ReauthoredPack {
  const correct = options.find((o) => o.correct);
  if (!correct) {
    throw new Error(`tapSelect '${prompt}': thiếu phương án đúng`);
  }
  return {
    template_code: "GT-001",
    content_pack: {
      prompt,
      target_item: { item_id: correct.id, asset: asset(correct.ref) },
      options: options.map((o) => ({
        item_id: o.id,
        asset: asset(o.ref),
        is_correct: o.correct === true,
      })),
    },
    difficulty_params: {
      distractor_count: options.length - 1,
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: true,
    },
  };
}

/**
 * `GT-011` — ma trận, quy luật là **ô vuông Latinh**: mỗi hàng và mỗi cột chứa
 * cùng một tập ký hiệu (`templates/GT-011/matrix-rule.ts`).
 *
 * Một dãy lặp AB đúng là một ô vuông Latinh 2×2 khi xếp lại thành lưới, và ABC
 * là 3×3 hoán vị vòng. Nhờ vậy nội dung "quy luật lặp" giữ nguyên ý nghĩa mà
 * vẫn hiện được cấu trúc lên màn hình, thay vì chỉ nằm trong câu hỏi bằng chữ.
 */
export function latinMatrix(
  prompt: string,
  symbols: readonly string[],
  distractorRef: string
): ReauthoredPack {
  const size = symbols.length;
  if (size !== 2 && size !== 3) {
    throw new Error(`latinMatrix '${prompt}': chỉ hỗ trợ 2×2 hoặc 3×3`);
  }
  const cells: Array<{
    row: number;
    col: number;
    asset: Asset | null;
  }> = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isBlank = row === size - 1 && col === size - 1;
      const ref = symbols[(row + col) % size] as string;
      cells.push({ row, col, asset: isBlank ? null : asset(ref) });
    }
  }
  const answerRef = symbols[(size - 1 + size - 1) % size] as string;
  const optionRefs = [
    answerRef,
    ...symbols.filter((s) => s !== answerRef),
    distractorRef,
  ].slice(0, Math.max(3, size));

  return {
    template_code: "GT-011",
    content_pack: {
      prompt,
      matrix: { rows: size, cols: size, cells },
      options: optionRefs.map((ref, i) => ({
        option_id: `op-${i + 1}`,
        asset: asset(ref),
        is_correct: ref === answerRef,
      })),
    },
    difficulty_params: {
      grid_size: size,
      distractor_count: optionRefs.length - 1,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  };
}

export interface SlotItem {
  id: string;
  ref: string;
  label?: string;
}

/**
 * `GT-008` — kéo từng vật vào đúng ô, theo thứ tự đã cho.
 *
 * Dùng cho dãy **có thứ tự thật** (số đếm, pha trăng, các bước câu chuyện,
 * bốn mùa). Ô vuông Latinh của `GT-011` không diễn đạt được loại này: nó là
 * quy luật lặp, không phải trình tự.
 */
export function orderedSlots(
  prompt: string,
  ordered: readonly SlotItem[]
): ReauthoredPack {
  if (ordered.length < 2 || ordered.length > 9) {
    throw new Error(`orderedSlots '${prompt}': cần 2..9 bước`);
  }
  return {
    template_code: "GT-008",
    content_pack: {
      prompt,
      slots: ordered.map((item, i) => ({
        slot_id: `slot-${i + 1}`,
        label: `Ô ${i + 1}`,
        expected_item_id: item.id,
      })),
      // Đảo thứ tự khi bày ra: bày sẵn đúng thứ tự thì không còn gì để làm.
      items: [...ordered].reverse().map((item) => ({
        item_id: item.id,
        label: item.label,
        asset: asset(item.ref),
      })),
    },
    difficulty_params: {
      slot_count: ordered.length,
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  };
}

/**
 * `GT-008` dạng quy luật lặp — mỗi ô là một bước của chuỗi.
 *
 * Dùng cho band 4-5: `GT-011` diễn đạt quy luật đẹp hơn nhưng `age_min` của nó
 * là 5, và `isLevelOutOfBand` tính cả `age_min` chứ không chỉ
 * `banned_age_bands`. Kéo thẻ vào ô giữ nguyên việc học quy luật mà vẫn đúng
 * lứa tuổi.
 */
export function patternSlots(
  prompt: string,
  symbols: readonly { ref: string; label: string }[],
  repeats: number
): ReauthoredPack {
  const sequence: Array<{ id: string; ref: string; label: string }> = [];
  for (let r = 0; r < repeats; r++) {
    symbols.forEach((symbol, i) => {
      sequence.push({
        id: `s${r + 1}-${i + 1}`,
        ref: symbol.ref,
        label: symbol.label,
      });
    });
  }
  if (sequence.length < 2 || sequence.length > 9) {
    throw new Error(`patternSlots '${prompt}': cần 2..9 ô`);
  }
  return {
    template_code: "GT-008",
    content_pack: {
      prompt,
      slots: sequence.map((item, i) => ({
        slot_id: `slot-${i + 1}`,
        label: `Ô ${i + 1}`,
        expected_item_id: item.id,
      })),
      items: [...sequence].reverse().map((item) => ({
        item_id: item.id,
        label: item.label,
        asset: asset(item.ref),
      })),
    },
    difficulty_params: {
      slot_count: sequence.length,
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  };
}

export interface SortGroup {
  id: string;
  label: string;
  labelRef: string;
}

export interface SortItem {
  id: string;
  ref: string;
  groupId: string;
}

/** `GT-004` — phân loại vật vào 2..4 nhóm. */
export function sortGroups(
  prompt: string,
  groups: readonly SortGroup[],
  items: readonly SortItem[]
): ReauthoredPack {
  if (groups.length < 2 || groups.length > 4) {
    throw new Error(`sortGroups '${prompt}': cần 2..4 nhóm`);
  }
  if (items.length < 4 || items.length > 10) {
    throw new Error(`sortGroups '${prompt}': cần 4..10 vật`);
  }
  const idMap = new Map(groups.map((g, i) => [g.id, `g${i}`]));
  const mapped = items.map((item) => ({
    item_id: item.id,
    asset: asset(item.ref),
    correct_group_id: idMap.get(item.groupId) ?? "g0",
  }));
  const used = new Set(mapped.map((i) => i.correct_group_id));
  if (used.size !== groups.length) {
    throw new Error(`sortGroups '${prompt}': mỗi nhóm phải có ít nhất 1 vật`);
  }
  return {
    template_code: "GT-004",
    content_pack: {
      prompt,
      groups: groups.map((g, i) => ({
        group_id: `g${i}`,
        label: g.label.slice(0, 24),
        label_emoji: g.labelRef,
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

/**
 * `GT-006` — sắp xếp thứ tự.
 *
 * Chỉ dùng cho band 5-6: engine cấm cả `3-4` lẫn `4-5`. Đây là chỗ đúng của
 * các dãy **có thứ tự thật** ở lứa lớn (pha trăng, các bước câu chuyện, bốn
 * mùa, đếm ngược); `GT-008` nhận cùng nội dung nhưng dành cho lứa nhỏ hơn.
 */
export function sequenceOrder(
  prompt: string,
  ordered: readonly SlotItem[]
): ReauthoredPack {
  if (ordered.length < 3 || ordered.length > 5) {
    throw new Error(`sequenceOrder '${prompt}': cần 3..5 bước`);
  }
  return {
    template_code: "GT-006",
    content_pack: {
      prompt,
      sequence: ordered.map((item, i) => ({
        step_id: item.id,
        order_index: i,
        asset: asset(item.ref),
        label: item.label,
      })),
    },
    difficulty_params: {
      hint_after_ms: 12_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  };
}

/**
 * `GT-014` — cân hai bên, mục tiêu `balance`.
 *
 * Nội dung cũ hỏi "bên nào nhiều hơn" và không có engine nào nhận. Cân thăng
 * bằng dạy cùng khái niệm nhiều/ít nhưng đi xa hơn một bước: trẻ phải làm cho
 * hai bên bằng nhau, và điều kiện thắng đo được chứ không phải một cú chạm.
 */
export function balanceScale(
  prompt: string,
  ref: string,
  leftCount: number,
  rightCount: number,
  trayCount: number
): ReauthoredPack {
  const build = (prefix: string, n: number) =>
    Array.from({ length: n }, (_, i) => ({
      item_id: `${prefix}-${i + 1}`,
      asset: asset(ref),
      weight: 1,
    }));
  if (leftCount > 4 || rightCount > 4) {
    throw new Error(`balanceScale '${prompt}': mỗi đĩa tối đa 4 vật`);
  }
  if (Math.abs(leftCount - rightCount) > trayCount) {
    throw new Error(`balanceScale '${prompt}': khay không đủ để cân bằng`);
  }
  return {
    template_code: "GT-014",
    content_pack: {
      prompt,
      left_pan: build("left", leftCount),
      right_pan: build("right", rightCount),
      tray: build("tray", trayCount),
      goal: "balance",
    },
    difficulty_params: {
      tray_count: trayCount,
      weight_span: 1,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  };
}

/** `GT-012` — nhìn chớp rồi chọn số lượng vừa thấy. */
export function flashCount(
  prompt: string,
  ref: string,
  count: number,
  flashMs: number,
  distractors: readonly number[]
): ReauthoredPack {
  if (count < 1 || count > 6) {
    throw new Error(`flashCount '${prompt}': số vật phải 1..6`);
  }
  const values = [count, ...distractors];
  return {
    template_code: "GT-012",
    content_pack: {
      prompt,
      flash_items: Array.from({ length: count }, (_, i) => ({
        item_id: `it-${i + 1}`,
        asset: asset(ref),
      })),
      arrangement: "dice",
      options: [...values]
        .sort((a, b) => a - b)
        .map((value) => ({ value, is_correct: value === count })),
    },
    difficulty_params: {
      flash_ms: flashMs,
      item_count: count,
      distractor_count: distractors.length,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  };
}

export interface SceneObject {
  id: string;
  ref: string;
  target?: boolean;
  x: number;
  y: number;
}

/**
 * `GT-022` — tìm vật trong khung cảnh.
 *
 * Toạ độ `x`/`y` là thứ giữ lại được ý nghĩa của các level "vị trí": trên,
 * dưới, trái, phải nằm trong chính chỗ đặt vật, không chỉ trong câu hỏi.
 */
export function hiddenObject(
  prompt: string,
  targetDescription: string,
  objects: readonly SceneObject[]
): ReauthoredPack {
  if (objects.length < 3 || objects.length > 12) {
    throw new Error(`hiddenObject '${prompt}': cần 3..12 vật trong cảnh`);
  }
  return {
    template_code: "GT-022",
    content_pack: {
      prompt,
      target_description: targetDescription,
      scene_objects: objects.map((o) => ({
        id: o.id,
        asset: asset(o.ref),
        is_target: o.target === true,
        is_hidden: false,
        x: o.x,
        y: o.y,
      })),
    },
    difficulty_params: {
      hint_after_ms: 9000,
      allow_retry: true,
      show_target_counter: true,
    },
  };
}

/** `GT-020` — lật thẻ tìm cặp. */
export function memoryFlip(
  prompt: string,
  refs: readonly string[]
): ReauthoredPack {
  if (refs.length < 2 || refs.length > 6) {
    throw new Error(`memoryFlip '${prompt}': cần 2..6 cặp`);
  }
  return {
    template_code: "GT-020",
    content_pack: {
      prompt,
      pairs: refs.map((ref, i) => ({
        pair_key: `pair-${i + 1}`,
        card_a: { card_id: `c${i + 1}a`, asset: asset(ref) },
        card_b: { card_id: `c${i + 1}b`, asset: asset(ref) },
      })),
    },
    difficulty_params: {
      flip_back_delay_ms: 1500,
      peek_all_initial_ms: 2000,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  };
}

export interface ActivityCard {
  id: string;
  ref: string;
  name: string;
  hour: number;
  minute: 0 | 30;
}

/** `GT-016` chế độ `match` — nối hoạt động trong ngày với giờ trên đồng hồ. */
export function clockMatch(
  prompt: string,
  target: { hour: number; minute: 0 | 30 },
  cards: readonly ActivityCard[]
): ReauthoredPack {
  if (cards.length < 2) {
    throw new Error(`clockMatch '${prompt}': chế độ match cần ≥ 2 thẻ`);
  }
  return {
    template_code: "GT-016",
    content_pack: {
      prompt,
      mode: "match",
      target_time: target,
      activity_cards: cards.map((c) => ({
        card_id: c.id,
        asset: asset(c.ref),
        hour: c.hour,
        minute: c.minute,
      })),
    },
    difficulty_params: {
      minute_step: 30,
      distractor_count: Math.min(3, Math.max(1, cards.length - 1)),
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  };
}
