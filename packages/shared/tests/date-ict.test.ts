import { describe, expect, it } from "vitest";
import { getDateIct, parseDateIct } from "#src/date-ict";

describe("BR-TLM-08 & D-GB: ICT Date Boundary Helper", () => {
  it("formats dates into YYYY-MM-DD in UTC+7 (ICT)", () => {
    // 2026-08-10 17:30 UTC = 2026-08-11 00:30 ICT
    const dateUtc1730 = new Date("2026-08-10T17:30:00.000Z");
    expect(getDateIct(dateUtc1730)).toBe("2026-08-11");
  });

  it("negative test: sessions at 23:50 ICT and 00:10 ICT fall into two different date_ict strings (BR-TLM-08)", () => {
    // 23:50 ICT on Aug 10 = 16:50 UTC on Aug 10
    const session1 = new Date("2026-08-10T16:50:00.000Z");
    // 00:10 ICT on Aug 11 = 17:10 UTC on Aug 10
    const session2 = new Date("2026-08-10T17:10:00.000Z");

    const dateIct1 = getDateIct(session1);
    const dateIct2 = getDateIct(session2);

    expect(dateIct1).toBe("2026-08-10");
    expect(dateIct2).toBe("2026-08-11");
    expect(dateIct1).not.toBe(dateIct2);
  });

  it("parses date_ict string to exact start of day in UTC+7", () => {
    const parsed = parseDateIct("2026-08-11");
    expect(parsed.toISOString()).toBe("2026-08-10T17:00:00.000Z");
  });
});
