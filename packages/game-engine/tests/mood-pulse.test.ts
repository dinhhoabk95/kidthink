import { describe, expect, it } from "vitest";
import { MoodPulse } from "#src/systems/mood-pulse";

describe("MoodPulse: dáng mascot ngắn hạn (BR-FBK-15)", () => {
  it("chưa đặt thì null; đặt xong giữ đến hết giờ rồi về null", () => {
    const pulse = new MoodPulse();
    expect(pulse.current()).toBeNull();

    pulse.set("cheer", 1000);
    pulse.tick(999);
    expect(pulse.current()).toBe("cheer");
    pulse.tick(2);
    expect(pulse.current()).toBeNull();
  });

  it("đặt dáng mới ghi đè dáng cũ; clear về null ngay", () => {
    const pulse = new MoodPulse();
    pulse.set("cheer", 1000);
    pulse.set("wonder", 500);
    expect(pulse.current()).toBe("wonder");

    pulse.clear();
    expect(pulse.current()).toBeNull();
  });
});
