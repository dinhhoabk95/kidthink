import { describe, expect, it } from "vitest";
import {
  collectJarBox,
  JAR_STAR_FLIGHT_MS,
  jarFillLevel,
  jarMouth,
  starFlightPose,
} from "#src/render/container-shapes";

const FROM = { x: 100, y: 300 };
const TO = { x: 700, y: 120 };

describe("Lọ nhặt sao GT-037 — hàm thuần (BR-E037-14)", () => {
  it("sao bay: bắt đầu ở ô đích, kết thúc ở miệng lọ, thu nhỏ dần", () => {
    const start = starFlightPose(FROM, TO, 0, false);
    expect(start).toMatchObject({ x: FROM.x, y: FROM.y, scale: 1 });

    const nearEnd = starFlightPose(FROM, TO, JAR_STAR_FLIGHT_MS - 1, false);
    expect(nearEnd?.x).toBeGreaterThan(TO.x - 5);
    expect(nearEnd?.scale ?? 1).toBeLessThan(0.6);
  });

  it("sao bay theo cung: giữa đường cao hơn đường thẳng", () => {
    const mid = starFlightPose(FROM, TO, JAR_STAR_FLIGHT_MS / 2, false);
    const straightY = (FROM.y + TO.y) / 2;
    expect(mid?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(straightY);
  });

  it("hết thời gian bay hoặc reduced-motion thì không còn sao bay (trạng thái cuối)", () => {
    expect(starFlightPose(FROM, TO, JAR_STAR_FLIGHT_MS, false)).toBeNull();
    expect(starFlightPose(FROM, TO, 10, true)).toBeNull();
  });

  it("mức đầy theo tổng: đơn điệu, 0 ở đầu, 1 khi đủ", () => {
    expect(jarFillLevel(0, 4)).toBe(0);
    expect(jarFillLevel(2, 4)).toBe(0.5);
    expect(jarFillLevel(4, 4)).toBe(1);
    expect(jarFillLevel(9, 4)).toBe(1);
  });

  it("không biết tổng: đầy dần nhưng không bao giờ đầy và không phụ thuộc tổng", () => {
    let previous = jarFillLevel(0, null);
    expect(previous).toBe(0);
    for (let n = 1; n <= 30; n++) {
      const level = jarFillLevel(n, null);
      expect(level).toBeGreaterThan(previous);
      expect(level).toBeLessThan(1);
      previous = level;
    }
  });

  it("chỗ đặt lọ nằm ngoài sân khấu ở cả landscape lẫn portrait", () => {
    const landscape = collectJarBox(
      { x: 16, y: 100, w: 700, h: 400 },
      960,
      540
    );
    expect(landscape).not.toBeNull();
    expect(landscape?.x ?? 0).toBeGreaterThanOrEqual(16 + 700);

    const portrait = collectJarBox({ x: 16, y: 100, w: 400, h: 600 }, 432, 860);
    expect(portrait).not.toBeNull();
    expect(portrait?.y ?? 0).toBeGreaterThanOrEqual(100 + 600);
  });

  it("mép không đủ rộng thì không có lọ", () => {
    expect(
      collectJarBox({ x: 16, y: 100, w: 940, h: 400 }, 960, 540)
    ).toBeNull();
  });

  it("miệng lọ nằm trong hộp lọ", () => {
    const box = { x: 10, y: 20, w: 100, h: 120 };
    const mouth = jarMouth(box);
    expect(mouth.x).toBe(60);
    expect(mouth.y).toBeGreaterThan(box.y);
    expect(mouth.y).toBeLessThan(box.y + box.h);
  });
});
