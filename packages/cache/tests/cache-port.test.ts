import { describe, expect, it } from "vitest";
import {
  deleteCached,
  flushKvCachePrefixes,
  getCached,
  getUserEntitlementsCache,
  invalidateUserEntitlementsCache,
  registerCachePort,
  setCached,
  setUserEntitlementsCache,
} from "#src/index";

describe("cache KV qua port của engine local (D15)", () => {
  it("set/get/delete một giá trị JSON", async () => {
    await setCached("cache:json", { a: 1 }, 60);
    expect(await getCached<{ a: number }>("cache:json")).toEqual({ a: 1 });
    await deleteCached("cache:json");
    expect(await getCached("cache:json")).toBeNull();
  });

  it("giá trị chuỗi không phải JSON được trả nguyên văn", async () => {
    await setCached("cache:str", "plain text", 60);
    expect(await getCached<string>("cache:str")).toBe("plain text");
  });

  it("entitlements cache: set, get rồi invalidate", async () => {
    await setUserEntitlementsCache(7, ["a", "b"]);
    expect(await getUserEntitlementsCache(7)).toEqual(["a", "b"]);
    await invalidateUserEntitlementsCache(7);
    expect(await getUserEntitlementsCache(7)).toBeNull();
  });

  it("flushKvCachePrefixes xoá theo tiền tố và đếm số khoá", async () => {
    await setCached("flush:a:1", "1", 60);
    await setCached("flush:a:2", "2", 60);
    await setCached("flush:b:1", "3", 60);
    expect(await flushKvCachePrefixes(["flush:a:"])).toBe(2);
    expect(await getCached("flush:b:1")).toBe(3);
    expect(await flushKvCachePrefixes([])).toBe(0);
  });

  it("khoá hết hạn (TTL) bị engine bỏ qua khi đọc", async () => {
    await setCached("cache:ttl", "x", 1);
    await expect
      .poll(() => getCached("cache:ttl"), { timeout: 3000, interval: 100 })
      .toBeNull();
  });
});

describe("cache không có port (cache được phép trượt)", () => {
  it("đọc trả null, ghi/xoá bỏ qua, flush trả 0", async () => {
    registerCachePort(undefined);
    expect(await getCached("any")).toBeNull();
    await expect(setCached("any", "v", 10)).resolves.toBeUndefined();
    await expect(deleteCached("any")).resolves.toBeUndefined();
    expect(await flushKvCachePrefixes(["any"])).toBe(0);
  });
});
