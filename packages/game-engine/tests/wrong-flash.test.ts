import { describe, expect, it } from "vitest";
import {
  WRONG_FLASH_MS,
  WrongFlash,
  WrongFlashMap,
} from "#src/systems/wrong-flash";

/** Task #313 Phase 2 — một đồng hồ, một thời lượng cho nhịp "sai" của mọi template. */
describe("WrongFlash", () => {
  it("chưa kích thì không active, không hết hạn, elapsed = 0", () => {
    const flash = new WrongFlash();
    expect(flash.started).toBe(false);
    expect(flash.isActive(1000)).toBe(false);
    expect(flash.hasExpired(1000)).toBe(false);
    expect(flash.elapsedMs(1000)).toBe(0);
    expect(flash.progress(1000)).toBe(0);
  });

  it("active trong WRONG_FLASH_MS rồi hết hạn", () => {
    const flash = new WrongFlash();
    flash.trigger(1000);
    expect(flash.started).toBe(true);
    expect(flash.isActive(1000 + WRONG_FLASH_MS - 1)).toBe(true);
    expect(flash.hasExpired(1000 + WRONG_FLASH_MS - 1)).toBe(false);
    expect(flash.isActive(1000 + WRONG_FLASH_MS)).toBe(false);
    expect(flash.hasExpired(1000 + WRONG_FLASH_MS)).toBe(true);
  });

  it("kích ở thời điểm 0 vẫn tính (không dùng 0 làm cờ rỗng)", () => {
    const flash = new WrongFlash();
    flash.trigger(0);
    expect(flash.isActive(100)).toBe(true);
    expect(flash.hasExpired(WRONG_FLASH_MS)).toBe(true);
  });

  it("elapsedMs và progress đi từ 0 tới 1 rồi kẹp ở 1", () => {
    const flash = new WrongFlash();
    flash.trigger(500);
    expect(flash.elapsedMs(600)).toBe(100);
    expect(flash.progress(500 + WRONG_FLASH_MS / 2)).toBeCloseTo(0.5);
    expect(flash.progress(500 + WRONG_FLASH_MS * 3)).toBe(1);
  });

  it("clear đưa về trạng thái chưa kích", () => {
    const flash = new WrongFlash();
    flash.trigger(10);
    flash.clear();
    expect(flash.started).toBe(false);
    expect(flash.isActive(20)).toBe(false);
    expect(flash.hasExpired(10_000)).toBe(false);
  });

  it("kích lại thì đếm lại từ đầu", () => {
    const flash = new WrongFlash();
    flash.trigger(0);
    flash.trigger(300);
    expect(flash.isActive(600)).toBe(true);
    expect(flash.elapsedMs(600)).toBe(300);
  });
});

describe("WrongFlashMap", () => {
  it("mỗi khoá có nhịp riêng, cùng một đồng hồ", () => {
    const map = new WrongFlashMap();
    map.trigger("a", 0);
    map.trigger("b", 200);
    expect(map.size).toBe(2);
    expect(map.isActive("a", 399)).toBe(true);
    expect(map.isActive("a", 400)).toBe(false);
    expect(map.isActive("b", 400)).toBe(true);
    expect(map.isActive("c", 10)).toBe(false);
    expect(map.elapsedMs("b", 300)).toBe(100);
    expect(map.elapsedMs("c", 300)).toBe(0);
  });

  it("expiredKeys trả khoá đã hết nhịp và drain xoá chúng", () => {
    const map = new WrongFlashMap();
    map.trigger("a", 0);
    map.trigger("b", 200);
    expect(map.expiredKeys(WRONG_FLASH_MS)).toEqual(["a"]);
    expect(map.drainExpired(WRONG_FLASH_MS)).toEqual(["a"]);
    expect(map.has("a")).toBe(false);
    expect(map.has("b")).toBe(true);
    expect(map.drainExpired(WRONG_FLASH_MS + 200)).toEqual(["b"]);
    expect(map.size).toBe(0);
  });

  it("clear theo khoá, clearAll xoá hết; kích lại thì đếm lại", () => {
    const map = new WrongFlashMap();
    map.trigger("a", 0);
    map.trigger("a", 300);
    expect(map.isActive("a", 600)).toBe(true);
    map.trigger("b", 0);
    map.clear("a");
    expect(map.has("a")).toBe(false);
    map.clearAll();
    expect(map.size).toBe(0);
  });

  it("thời lượng riêng theo spec engine (vd GT-003 260 ms)", () => {
    const map = new WrongFlashMap(260);
    map.trigger("a", 0);
    expect(map.progress("a", 130)).toBeCloseTo(0.5);
    expect(map.isActive("a", 259)).toBe(true);
    expect(map.isActive("a", 260)).toBe(false);
    expect(map.progress("a", 9999)).toBe(1);
    expect(map.progress("zz", 5)).toBe(0);
  });
});
