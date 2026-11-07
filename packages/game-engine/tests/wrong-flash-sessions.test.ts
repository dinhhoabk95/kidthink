import { describe, expect, it } from "vitest";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
import { GT001Session } from "#src/templates/GT-001/session.js";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures.js";
import { GT002Session } from "#src/templates/GT-002/session.js";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures";
import { GT003Session } from "#src/templates/GT-003/session";
import { GT004_FIXTURES } from "#src/templates/GT-004/fixtures";
import { GT004Session } from "#src/templates/GT-004/session";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures.js";
import { GT006Session } from "#src/templates/GT-006/session.js";
import { GT018_FIXTURES } from "#src/templates/GT-018/fixtures.js";
import { GT018Session } from "#src/templates/GT-018/session.js";
import { GT037Session } from "#src/templates/GT-037/session";
import type { GT037Content } from "#src/templates/GT-037/template";

/**
 * Task #313 — nhịp "sai" của mọi template đi qua `WrongFlash`/`WrongFlashMap`:
 * một thời lượng `WRONG_FLASH_MS`, một đồng hồ khung (`update(delta)` cộng dồn,
 * `render(…, timeMs)` đặt lại). Mỗi describe khoá một template.
 */

describe("GT-001 — vật chọn sai tự về trung tính sau WRONG_FLASH_MS", () => {
  function makeSession(): GT001Session {
    const fixture = GT001_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-001");
    }
    const session = new GT001Session(fixture.content, fixture.difficulty);
    session.prepareRound("4-5");
    return session;
  }

  it("giữ trạng thái wrong trước hạn, về idle đúng hạn", () => {
    const session = makeSession();
    session.commit({ type: "select_item", data: { item_id: "banana_opt" } });
    expect(session.getItemState("banana_opt")).toBe("wrong");
    session.update(WRONG_FLASH_MS - 1);
    expect(session.getItemState("banana_opt")).toBe("wrong");
    session.update(1);
    expect(session.getItemState("banana_opt")).toBe("idle");
  });

  it("hai vật sai lệch nhịp hết hạn riêng từng vật", () => {
    const session = makeSession();
    session.commit({ type: "select_item", data: { item_id: "banana_opt" } });
    session.update(200);
    const other = session.displayOptions.find(
      (o) => !o.is_correct && o.item_id !== "banana_opt"
    );
    if (!other) {
      return;
    }
    session.commit({ type: "select_item", data: { item_id: other.item_id } });
    session.update(WRONG_FLASH_MS - 200);
    expect(session.getItemState("banana_opt")).toBe("idle");
    expect(session.getItemState(other.item_id)).toBe("wrong");
    session.update(200);
    expect(session.getItemState(other.item_id)).toBe("idle");
  });
});

describe("GT-002 — nháy sai sau lần kéo lưới chưa đúng", () => {
  it("nháy đúng WRONG_FLASH_MS theo đồng hồ khung", () => {
    const fixture = GT002_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-002");
    }
    const session = new GT002Session(fixture.content, fixture.difficulty, 0);
    session.prepareRound("4-5");
    const wrong = fixture.content.items.find((i) => !i.is_correct);
    session.commit({
      type: "toggle_item",
      data: { item_id: wrong?.item_id ?? "" },
    });
    session.commit({ type: "submit_selection", data: {} });
    expect(session.isWrongFlashing()).toBe(true);
    session.update(WRONG_FLASH_MS - 1);
    expect(session.isWrongFlashing()).toBe(true);
    session.update(1);
    expect(session.isWrongFlashing()).toBe(false);
  });
});

describe("GT-006 — nháy thẻ sai thứ tự sau khi kiểm tra chưa đúng", () => {
  it("nháy đúng WRONG_FLASH_MS theo đồng hồ khung", () => {
    const fixture = GT006_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-006");
    }
    const session = new GT006Session(fixture.content, fixture.difficulty, 0);
    session.prepareRound("4-5");
    session.commit({ type: "check_sequence", data: {} });
    expect(session.isWrongSubmitFlashing()).toBe(true);
    session.update(WRONG_FLASH_MS - 1);
    expect(session.isWrongSubmitFlashing()).toBe(true);
    session.update(1);
    expect(session.isWrongSubmitFlashing()).toBe(false);
  });
});

describe("GT-018 — vật chọn sai và cả dải sai về trung tính sau WRONG_FLASH_MS", () => {
  function build(mode: "select" | "sequence"): {
    session: GT018Session;
    optionIds: string[];
    wrongId: string;
  } {
    const fixture = GT018_FIXTURES.find(
      (f) => f.content.response_mode === mode
    );
    if (!fixture) {
      throw new Error(`Thiếu fixture ${mode}`);
    }
    const session = new GT018Session(fixture.content, fixture.difficulty);
    session.prepareRound("4-5");
    return {
      session,
      optionIds: fixture.content.options.map((o) => o.item_id),
      wrongId:
        fixture.content.options.find((o) => !o.is_correct)?.item_id ?? "",
    };
  }

  it("chế độ chọn: vật sai về idle đúng hạn", () => {
    const { session, wrongId } = build("select");
    session.onItemSelect(wrongId);
    expect(session.getRenderItemState(wrongId)).toBe("wrong");
    session.update(WRONG_FLASH_MS - 1);
    expect(session.getRenderItemState(wrongId)).toBe("wrong");
    session.update(1);
    expect(session.getRenderItemState(wrongId)).toBe("idle");
  });

  it("chế độ xếp: cả dải về idle đúng hạn", () => {
    const { session, optionIds } = build("sequence");
    session.onSubmitSequence();
    for (const id of optionIds) {
      expect(session.getRenderItemState(id)).toBe("wrong");
    }
    session.update(WRONG_FLASH_MS - 1);
    expect(session.getRenderItemState(optionIds[0] ?? "")).toBe("wrong");
    session.update(1);
    for (const id of optionIds) {
      expect(session.getRenderItemState(id)).toBe("idle");
    }
  });
});

describe("GT-003 — vật thả trượt về trung tính sau 260 ms (spec GT-003 chốt riêng)", () => {
  it("giữ wrong tới 259 ms, idle đúng 260 ms", () => {
    const fixture = GT003_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-003");
    }
    const session = new GT003Session(fixture.content, fixture.difficulty, 0);
    session.prepareRound("3-4");
    const view = session.getView();
    const wrongItem = fixture.content.items.find((i) => !i.is_correct);
    const source = view.entities.find((e) => e.id === wrongItem?.item_id);
    const target = view.entities.find((e) => e.role === "target");
    if (!(source && target && wrongItem)) {
      throw new Error("Thiếu entity GT-003");
    }
    session.dispatch({
      type: "drop",
      fromX: source.x,
      fromY: source.y,
      toX: target.x,
      toY: target.y,
      timeMs: 0,
    });
    expect(session.getItemState(wrongItem.item_id)).toBe("wrong");
    session.update(259);
    expect(session.getItemState(wrongItem.item_id)).toBe("wrong");
    session.update(1);
    expect(session.getItemState(wrongItem.item_id)).toBe("idle");
  });
});

describe("GT-004 — vật phân loại nhầm về trung tính sau WRONG_FLASH_MS", () => {
  it("giữ wrong tới WRONG_FLASH_MS - 1, idle đúng hạn", () => {
    const fixture = GT004_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-004");
    }
    const session = new GT004Session(fixture.content, fixture.difficulty, 0);
    session.prepareRound("4-5");
    const item = fixture.content.items[0];
    const other = fixture.content.groups.find(
      (g) => g.group_id !== item?.correct_group_id
    );
    if (!(item && other)) {
      throw new Error("Thiếu dữ liệu GT-004");
    }
    session.commit({
      type: "sort_item",
      data: { item_id: item.item_id, group_id: other.group_id },
    });
    expect(session.getRenderItemState(item.item_id)).toBe("wrong");
    session.update(WRONG_FLASH_MS - 1);
    expect(session.getRenderItemState(item.item_id)).toBe("wrong");
    session.update(1);
    expect(session.getRenderItemState(item.item_id)).toBe("idle");
  });
});

describe("GT-037 — ô chạm nhầm tắt theo đồng hồ khung, không theo Date.now()", () => {
  const content: GT037Content = {
    prompt: "Con tìm hết số 3 nhé",
    symbols: [
      { id: "t", asset: { kind: "text", text: "3" } },
      { id: "d", asset: { kind: "text", text: "5" } },
    ],
    target_ids: ["t"],
    target_copies: 3,
    item_count: 12,
    confusable_ids: [],
  };

  function wrongTap(): GT037Session {
    const session = new GT037Session(content, {}, 7);
    session.prepareRound("5-6");
    const slotIndex = session.boardSymbols.findIndex((b) => b?.id === "d");
    session.commit({ type: "tap_symbol", data: { slotIndex, symbolId: "d" } });
    return session;
  }

  it("giữ ô sai tới WRONG_FLASH_MS - 1 rồi xoá đúng hạn", () => {
    const session = wrongTap();
    expect(session.wrongSlotIndex).not.toBeNull();
    session.update(WRONG_FLASH_MS - 1);
    expect(session.wrongSlotIndex).not.toBeNull();
    session.update(1);
    expect(session.wrongSlotIndex).toBeNull();
  });
});
