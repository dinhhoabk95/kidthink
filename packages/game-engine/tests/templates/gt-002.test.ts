import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE, type LogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test.js";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures";
import { GT002Session } from "#src/templates/GT-002/session";
import { createFakeCanvas } from "#tests/gates/fake-canvas";

/**
 * GT-002 chấm tập chọn **chỉ** khi `commit` (`BR-E002-02`, `N4`, `N6`).
 * Trước Task #275 S1a, chọn đủ tập đúng là thắng ngay: `dispatch()` nuốt mọi
 * cử chỉ sau đó nên trẻ không bỏ chọn được, và bề mặt web từ chối "Bỏ qua"
 * vì vòng đã "thắng" mà chưa ai nộp.
 */
const fixture = GT002_FIXTURES[0];
if (!fixture) {
  throw new Error("Fixture GT-002 not found");
}
const { content, difficulty } = fixture;
const correctIds = content.items
  .filter((item) => item.is_correct)
  .map((item) => item.item_id);
const distractorIds = content.items
  .filter((item) => !item.is_correct)
  .map((item) => item.item_id);

function buildSession(space?: LogicSpace): GT002Session {
  const session = new GT002Session(content, difficulty, 1);
  session.prepareRound("4-5", space);
  return session;
}

function tapItem(session: GT002Session, itemId: string): void {
  const index = session.displayItems.findIndex(
    (item) => item.item_id === itemId
  );
  const slot = session.slots[index];
  if (!slot) {
    throw new Error(`Thiếu slot của ${itemId}`);
  }
  session.dispatch({ type: "tap", x: slot.x, y: slot.y, timeMs: 0 });
}

describe("GT-002 — thắng chỉ khi commit (BR-E002-02, Task #275 S1a)", () => {
  it("chọn đủ tập đúng mà chưa commit thì chưa thắng", () => {
    const session = buildSession();

    for (const id of correctIds) {
      tapItem(session, id);
    }

    expect(session.checkWinCondition()).toBe(false);
  });

  it("chọn đủ tập đúng rồi chạm lại một vật thì vật đó bỏ chọn được", () => {
    const session = buildSession();
    for (const id of correctIds) {
      tapItem(session, id);
    }
    const [firstCorrect] = correctIds;
    if (!firstCorrect) {
      throw new Error("Fixture không có vật đúng");
    }

    tapItem(session, firstCorrect);

    expect(session.getItemState(firstCorrect)).toBe("idle");
  });

  it("commit với tập chọn đúng thì thắng", () => {
    const session = buildSession();
    for (const id of correctIds) {
      tapItem(session, id);
    }

    const verdict = session.dispatch({ type: "commit", timeMs: 0 });

    expect(verdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });
});

/**
 * Nút **Xong** nằm ở `zones.action` do shell vẽ (`BR-PSZ-05`, Task #283 B2): engine
 * khai `needsCommit`, báo sáng/mờ qua `canCommit()` và chỉ nhận `commit`.
 * Trước đó (#275 S1b) engine tự vẽ nút trong canvas; nút đó đã gỡ.
 */
describe("GT-002 — nút Xong ở zones.action (BR-PSZ-05, Task #283 B2)", () => {
  it("khai needsCommit, mờ khi chưa chọn, sáng khi đã chọn", () => {
    const session = buildSession();
    const [firstCorrect] = correctIds;
    if (!firstCorrect) {
      throw new Error("Fixture không có vật đúng");
    }

    expect(session.needsCommit).toBe(true);
    expect(session.canCommit()).toBe(false);
    tapItem(session, firstCorrect);
    expect(session.canCommit()).toBe(true);
  });

  it("getView() không còn entity nút Xong — shell dựng nút hành động", () => {
    const session = buildSession();

    const ids = session.getView().entities.map((e) => e.id);

    expect(ids.every((id) => id !== "commit:done")).toBe(true);
  });

  it("commit với tập chọn sai thì nhắc thử lại, chưa thắng", () => {
    const session = buildSession();
    const [firstCorrect] = correctIds;
    const [firstDistractor] = distractorIds;
    if (!(firstCorrect && firstDistractor)) {
      throw new Error("Fixture thiếu vật đúng hoặc distractor");
    }
    tapItem(session, firstCorrect);
    tapItem(session, firstDistractor);

    const verdict = session.dispatch({ type: "commit", timeMs: 0 });

    expect(verdict).toEqual({ valid: false, feedback: "amber_soft" });
    expect(session.checkWinCondition()).toBe(false);
  });

  it("commit khi chưa chọn vật nào thì bị nuốt, không tính lần sai", () => {
    const session = buildSession();

    const verdict = session.dispatch({ type: "commit", timeMs: 0 });

    expect(verdict).toEqual({ valid: false, feedback: "none" });
    expect(session.checkWinCondition()).toBe(false);
  });

  it("chọn đủ vật đúng thì gợi ý trỏ vào nút hành động, chưa đủ thì trỏ vật", () => {
    const session = buildSession();
    expect(session.getHintTarget()?.kind).toBe("slot");

    for (const id of correctIds) {
      tapItem(session, id);
    }

    expect(session.getHintTarget()).toEqual({ kind: "action" });
  });
});

describe("GT-002 — commit sai giữ tập chọn, trạng thái một nguồn (G3, G5, Task #275 S2)", () => {
  it("commit sai thì giữ nguyên tập chọn và không entity nào ở trạng thái incorrect", () => {
    const session = buildSession();
    const [firstCorrect] = correctIds;
    const [firstDistractor] = distractorIds;
    if (!(firstCorrect && firstDistractor)) {
      throw new Error("Fixture thiếu vật đúng hoặc distractor");
    }
    tapItem(session, firstCorrect);
    tapItem(session, firstDistractor);

    session.dispatch({ type: "commit", timeMs: 0 });

    expect(session.getItemState(firstDistractor)).toBe("selected");
    expect(session.getItemState(firstCorrect)).toBe("selected");
    const entities = session.getView().entities;
    expect(entities.some((e) => e.state === "incorrect")).toBe(false);
  });

  it("chạm lại distractor sau khi commit sai: trở về idle và mechanic không còn chọn", () => {
    const session = buildSession();
    const [firstDistractor] = distractorIds;
    if (!firstDistractor) {
      throw new Error("Fixture thiếu distractor");
    }
    tapItem(session, firstDistractor);
    session.dispatch({ type: "commit", timeMs: 0 });

    tapItem(session, firstDistractor);

    expect(session.getItemState(firstDistractor)).toBe("idle");
    const entity = session
      .getView()
      .entities.find((e) => e.id === firstDistractor);
    expect(entity?.state).toBe("idle");
  });
});

describe("GT-002 — vị trí vật xáo theo seed (R3, Task #275 S4)", () => {
  it("cùng seed thì cùng thứ tự, khác seed thì vị trí vật đổi", () => {
    const s1 = new GT002Session(content, difficulty, 42);
    s1.prepareRound("4-5");
    const s2 = new GT002Session(content, difficulty, 42);
    s2.prepareRound("4-5");
    const s3 = new GT002Session(content, difficulty, 9999);
    s3.prepareRound("4-5");

    const order1 = s1.displayItems.map((i) => i.item_id);
    const order2 = s2.displayItems.map((i) => i.item_id);
    const order3 = s3.displayItems.map((i) => i.item_id);

    expect(order1).toEqual(order2);
    expect(order1).not.toEqual(order3);
  });

  it("getHintTargetIndex() trỏ đúng vật đúng sau khi xáo", () => {
    const s = new GT002Session(content, difficulty, 12_345);
    s.prepareRound("4-5");
    const hintIdx = s.getHintTargetIndex();
    expect(hintIdx).not.toBeNull();
    const item = hintIdx === null ? undefined : s.displayItems[hintIdx];
    expect(item?.is_correct).toBe(true);
  });

  it("20.000 seed: tỉ lệ vật đúng ở ô 0 lệch <= 1 điểm % so với target_count / item_count", () => {
    const targetCount = content.items.filter((i) => i.is_correct).length;
    const totalCount = content.items.length;
    const expectedRatio = targetCount / totalCount;

    let correctAtZero = 0;
    const totalTrials = 20_000;
    for (let seed = 1; seed <= totalTrials; seed++) {
      const s = new GT002Session(content, difficulty, seed);
      s.prepareRound("4-5");
      if (s.displayItems[0]?.is_correct) {
        correctAtZero++;
      }
    }

    const actualRatio = correctAtZero / totalTrials;
    expect(Math.abs(actualRatio - expectedRatio)).toBeLessThanOrEqual(0.01);
  });
});

describe("GT-002 — chạm vật đọc tên, một hình học chạm (R6, E4/E5, Task #275 S5)", () => {
  it("getView() mang glyph, label, spokenLabel và role neutral", () => {
    const session = buildSession();
    const entities = session.getView().entities;

    expect(entities.length).toBe(content.items.length);
    for (const entity of entities) {
      expect(entity.role).toBe("neutral");
      expect(entity.label).toBeDefined();
      expect(entity.spokenLabel).toBeDefined();
    }
  });

  it("điểm ở góc hình vuông cũ nhưng ngoài vòng tròn (bán kính + 24px) thì toAction trả null", () => {
    const session = buildSession();
    const slot = session.slots[0];
    if (!slot) {
      throw new Error("Thiếu slot");
    }
    const r = Math.min(slot.hitW, slot.w) / 2;
    // Điểm ở góc: dx = r + 16, dy = r + 16.
    // Chebyshev (hình vuông): max(dx, dy) = r + 16 <= r + 24.
    // Euclid (vòng tròn): hypot(dx, dy) = 1.414 * (r + 16) > r + 24.
    const cornerX = slot.x + r + 16;
    const cornerY = slot.y + r + 16;

    const action = session.toAction({
      type: "tap",
      x: cornerX,
      y: cornerY,
      timeMs: 0,
    });

    expect(action).toBeNull();
  });

  it("quét lưới điểm: toAction và findHitEntity chọn cùng một entity", () => {
    const session = buildSession();
    const entities = session.getView().entities;

    for (let x = 0; x <= 960; x += 30) {
      for (let y = 0; y <= 540; y += 30) {
        const action = session.toAction({ type: "tap", x, y, timeMs: 0 });
        const hitEntity = findHitEntity(entities, x, y);

        const actionItemId =
          action &&
          typeof action.data === "object" &&
          action.data !== null &&
          "item_id" in action.data
            ? String(Reflect.get(action.data, "item_id"))
            : null;

        expect(actionItemId).toBe(hitEntity ? hitEntity.id : null);
      }
    }
  });
});

interface RecordedDrawContext {
  readonly ctx: CanvasRenderingContext2D;
  readonly calls: string[];
  readonly maxShadowBlur: () => number;
}

function createRecordingContext(w = 960, h = 540): RecordedDrawContext {
  const fake = createFakeCanvas(w, h);
  const rawCtx = fake.getContext("2d");
  if (!rawCtx) {
    throw new Error("Fake canvas missing 2d context");
  }
  const calls: string[] = [];
  let maxBlur = 0;

  const trackBlur = (): void => {
    if (rawCtx.shadowBlur > maxBlur) {
      maxBlur = rawCtx.shadowBlur;
    }
  };

  vi.spyOn(rawCtx, "arc").mockImplementation((x, y, r, s, e) => {
    trackBlur();
    calls.push(
      `arc(${x.toFixed(2)},${y.toFixed(2)},${r.toFixed(2)},${s.toFixed(2)},${e.toFixed(2)})`
    );
  });
  vi.spyOn(rawCtx, "roundRect").mockImplementation((x, y, rw, rh) => {
    trackBlur();
    calls.push(
      `roundRect(${x.toFixed(2)},${y.toFixed(2)},${rw.toFixed(2)},${rh.toFixed(2)})`
    );
  });
  vi.spyOn(rawCtx, "fill").mockImplementation(() => {
    trackBlur();
    calls.push(`fill(${String(rawCtx.fillStyle)})`);
  });
  vi.spyOn(rawCtx, "stroke").mockImplementation(() => {
    trackBlur();
    calls.push(
      `stroke(${String(rawCtx.strokeStyle)},${rawCtx.lineWidth.toFixed(1)})`
    );
  });
  vi.spyOn(rawCtx, "fillText").mockImplementation((t, x, y) => {
    trackBlur();
    calls.push(`fillText(${t},${x.toFixed(2)},${y.toFixed(2)})`);
  });

  return {
    ctx: rawCtx as CanvasRenderingContext2D,
    calls,
    maxShadowBlur: () => maxBlur,
  };
}

describe("GT-002 — Regression & UI/UX Contract (Hint, Retry, Telemetry, 7 Render Gates)", () => {
  it("Hint khi chọn thừa distractor: trỏ vào distractor để bỏ chọn, KHÔNG trỏ nút action", () => {
    const session = buildSession();
    const [firstDistractor] = distractorIds;
    if (!firstDistractor) {
      throw new Error("Thiếu distractor");
    }

    for (const id of correctIds) {
      tapItem(session, id);
    }
    tapItem(session, firstDistractor);

    const distractorIdx = session.displayItems.findIndex(
      (i) => i.item_id === firstDistractor
    );
    expect(session.getHintTargetIndex()).toBe(distractorIdx);
    expect(session.getHintTarget()).toEqual({
      kind: "slot",
      index: distractorIdx,
    });

    tapItem(session, firstDistractor);
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintTarget()).toEqual({ kind: "action" });
  });

  it("Hint sau khi thắng hoặc đóng vòng trả null; getHintDemoSequence(3) trả chuỗi bước khi còn >= 2 bước", () => {
    const session = buildSession();
    const demoInitial = session.getHintDemoSequence(3);
    expect(demoInitial).not.toBeNull();
    expect(demoInitial?.length).toBe(correctIds.length);
    expect(demoInitial?.[0]?.from).toBe(session.getHintTargetIndex());
    expect(session.getHintDemoSequence(2)).toBeNull();

    for (const id of correctIds) {
      tapItem(session, id);
    }
    expect(session.getHintDemoSequence(3)).toBeNull();

    session.dispatch({ type: "commit", timeMs: 0 });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintTarget()).toBeNull();
    expect(session.getHintDemoSequence(3)).toBeNull();
  });

  it("allow_retry: false — nộp sai đóng vòng, khoá input và sau WRONG_FLASH_MS làm sáng các vật đúng", () => {
    const session = new GT002Session(
      content,
      { ...difficulty, allow_retry: false },
      1
    );
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    const [firstDistractor] = distractorIds;
    const [firstCorrect] = correctIds;
    if (!(firstDistractor && firstCorrect)) {
      throw new Error("Thiếu item");
    }

    tapItem(session, firstDistractor);
    const submitVerdict = session.dispatch({ type: "commit", timeMs: 0 });
    expect(submitVerdict?.valid).toBe(false);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.canCommit()).toBe(false);
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintTarget()).toBeNull();
    expect(session.getRenderState(firstDistractor)).toBe("wrong");

    const slot0 = session.slots[0];
    if (!slot0) {
      throw new Error("Thiếu slot 0");
    }
    expect(
      session.toAction({ type: "tap", x: slot0.x, y: slot0.y, timeMs: 10 })
    ).toBeNull();
    expect(
      session.dispatch({ type: "tap", x: slot0.x, y: slot0.y, timeMs: 10 })
    ).toEqual({ valid: false, feedback: "none" });

    session.update(WRONG_FLASH_MS);
    expect(session.isWrongFlashing()).toBe(false);
    for (const id of correctIds) {
      expect(session.getItemState(id)).toBe("selected");
      expect(session.getRenderState(id)).toBe("selected");
    }
    for (const id of distractorIds) {
      expect(session.getItemState(id)).toBe("idle");
      expect(session.getRenderState(id)).toBe("idle");
    }
  });

  it("allow_retry: true — nộp sai lại làm mới nhịp nháy, chạm sửa dọn ngay nhịp nháy, chặn ID lạ và phát item_selected khi chọn", () => {
    const session = buildSession();
    const [firstDistractor] = distractorIds;
    const [firstCorrect] = correctIds;
    if (!(firstDistractor && firstCorrect)) {
      throw new Error("Thiếu item");
    }

    session.toggleItemSelection("unknown_ghost_id");
    expect(session.canCommit()).toBe(false);

    tapItem(session, firstDistractor);
    const selectedEvents1 = session
      .getTelemetry()
      .events.filter((e) => e.event_name === "item_selected");
    expect(selectedEvents1).toHaveLength(1);
    expect(selectedEvents1[0]?.data).toEqual({
      item_id: firstDistractor,
      is_correct: false,
    });

    session.dispatch({ type: "commit", timeMs: 0 });
    expect(session.isWrongFlashing()).toBe(true);
    session.update(250);
    session.dispatch({ type: "commit", timeMs: 250 });
    session.update(WRONG_FLASH_MS - 1);
    expect(session.isWrongFlashing()).toBe(true);

    tapItem(session, firstCorrect);
    expect(session.isWrongFlashing()).toBe(false);
    expect(session.getRenderState(firstCorrect)).toBe("selected");

    tapItem(session, firstDistractor);
    const selectedEventsAfterDeselect = session
      .getTelemetry()
      .events.filter((e) => e.event_name === "item_selected");
    expect(selectedEventsAfterDeselect).toHaveLength(2);
  });

  it("BR-ERC-02: render() thuần 100% — gọi 100 lần cùng timeMs giữ nguyên Object.entries(session), 0 telemetry mới và hạt chỉ bước ở update()", () => {
    const session = buildSession(DEFAULT_LOGIC_SPACE);
    for (const id of correctIds) {
      tapItem(session, id);
    }
    session.dispatch({ type: "commit", timeMs: 0 });
    expect(session.checkWinCondition()).toBe(true);

    const rs = new RenderSystem();
    const beforeEntries = Object.entries(session).map(([k, v]) => [
      k,
      structuredClone(v),
    ]);
    const telemetryCountBefore = session.getTelemetry().events.length;

    const first = createRecordingContext();
    session.render(first.ctx, rs, 100);
    expect(Object.entries(session)).toEqual(beforeEntries);

    let lastCalls: string[] = [];
    for (let i = 0; i < 100; i++) {
      const rec = createRecordingContext();
      session.render(rec.ctx, rs, 100);
      lastCalls = rec.calls;
    }
    expect(lastCalls).toEqual(first.calls);
    expect(Object.entries(session)).toEqual(beforeEntries);
    expect(session.getTelemetry().events).toHaveLength(telemetryCountBefore);

    session.update(800);
    const afterUpdate = createRecordingContext();
    session.render(afterUpdate.ctx, rs, 900);
    expect(afterUpdate.calls).not.toEqual(first.calls);
  });

  it("Spec §12: đủ 5 trạng thái thị giác (idle, touching, selected, wrong, correct), selected dùng brand thay vì màu đúng/sai", () => {
    const session = buildSession(DEFAULT_LOGIC_SPACE);
    const [firstCorrect] = correctIds;
    if (!firstCorrect) {
      throw new Error("Thiếu vật đúng");
    }
    const rs = new RenderSystem();
    rs.reducedMotion = true;

    const idleRec = createRecordingContext();
    session.render(idleRec.ctx, rs, 0);

    session.setTouchingItem(firstCorrect);
    expect(session.getItemState(firstCorrect)).toBe("touching");
    const touchingRec = createRecordingContext();
    session.render(touchingRec.ctx, rs, 0);
    expect(touchingRec.calls).not.toEqual(idleRec.calls);

    session.setTouchingItem(null);
    const backToIdleRec = createRecordingContext();
    session.render(backToIdleRec.ctx, rs, 0);
    expect(backToIdleRec.calls).toEqual(idleRec.calls);

    tapItem(session, firstCorrect);
    const selectedRec = createRecordingContext();
    session.render(selectedRec.ctx, rs, 0);
    expect(selectedRec.calls).not.toEqual(idleRec.calls);
    expect(selectedRec.calls).toContain(
      `fill(${designTokens.colors.brand[500]})`
    );
    expect(selectedRec.calls).not.toContain(
      `fill(${designTokens.colors.montessori.emeraldBright})`
    );
  });

  it("Spec §5 Nhánh 5 & 6: tôn trọng reducedMotion, softShadowsEnabled = false, particles_enabled = false và fallback drawPlaceholderBox khi asset hỏng", () => {
    const brokenContent = {
      ...content,
      items: content.items.map((item, idx) =>
        idx === 0
          ? {
              ...item,
              asset: {
                id: "broken_fish",
                kind: "emoji" as const,
                ref: "EMJ-BROKEN-999",
              },
            }
          : item
      ),
    };
    const session = new GT002Session(brokenContent, difficulty, 1);
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);

    const rs = new RenderSystem();
    rs.softShadowsEnabled = false;
    rs.reducedMotion = true;
    const spyParticles = vi.spyOn(rs, "drawParticles");

    const rec100 = createRecordingContext();
    const rec800 = createRecordingContext();
    expect(() => session.render(rec100.ctx, rs, 100)).not.toThrow();
    session.render(rec800.ctx, rs, 800);
    expect(rec100.maxShadowBlur()).toBe(0);
    expect(rec100.calls).toEqual(rec800.calls);
    for (const call of rec100.calls.filter((c) => c.startsWith("fillText("))) {
      expect(call).not.toContain("EMJ-BROKEN-999");
    }

    for (const id of correctIds) {
      tapItem(session, id);
    }
    session.dispatch({ type: "commit", timeMs: 0 });
    const winRec = createRecordingContext();
    session.render(winRec.ctx, rs, 900);
    expect(spyParticles).not.toHaveBeenCalled();
  });
});
