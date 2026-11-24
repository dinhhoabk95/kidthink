import { describe, expect, it } from "vitest";
import {
  CLOUDFLARE_SKIPPED_JOBS,
  isCronDue,
  JOB_DEFINITIONS,
  scheduledEnvelopesAt,
} from "#src/index";

/** ICT = UTC+7: 00:30 ICT ngày 2026-11-24 = 17:30 UTC ngày 2026-11-23. */
function ict(y: number, mo: number, d: number, h: number, mi: number): Date {
  return new Date(Date.UTC(y, mo - 1, d, h - 7, mi));
}

describe("isCronDue (ICT, BR-JOB-09)", () => {
  const cases: readonly [string, string, Date, boolean][] = [
    ["minute+hour số", "30 0 * * *", ict(2026, 11, 24, 0, 30), true],
    [
      "minute+hour số — lệch phút",
      "30 0 * * *",
      ict(2026, 11, 24, 0, 35),
      false,
    ],
    [
      "đúng giờ UTC nhưng sai giờ ICT",
      "30 0 * * *",
      new Date(Date.UTC(2026, 10, 24, 0, 30)),
      false,
    ],
    ["mỗi giờ", "0 * * * *", ict(2026, 11, 24, 13, 0), true],
    ["mỗi giờ — phút 5", "0 * * * *", ict(2026, 11, 24, 13, 5), false],
    ["*/10 khớp", "*/10 * * * *", ict(2026, 11, 24, 9, 40), true],
    ["*/10 không khớp", "*/10 * * * *", ict(2026, 11, 24, 9, 45), false],
    ["danh sách", "0,15,45 * * * *", ict(2026, 11, 24, 9, 45), true],
    [
      "danh sách không khớp",
      "0,15,45 * * * *",
      ict(2026, 11, 24, 9, 30),
      false,
    ],
    ["khoảng", "0 9-17 * * *", ict(2026, 11, 24, 12, 0), true],
    ["khoảng ngoài", "0 9-17 * * *", ict(2026, 11, 24, 18, 0), false],
    // 2026-11-23 là thứ hai.
    ["thứ hai 05:00", "0 5 * * 1", ict(2026, 11, 23, 5, 0), true],
    ["thứ ba không khớp thứ hai", "0 5 * * 1", ict(2026, 11, 24, 5, 0), false],
    ["ngày 1 hàng tháng", "0 0 1 * *", ict(2026, 12, 1, 0, 0), true],
    ["ngày 2 không khớp", "0 0 1 * *", ict(2026, 12, 2, 0, 0), false],
    ["Chủ nhật = 0 và 7", "0 0 * * 7", ict(2026, 11, 22, 0, 0), true],
    // 2026-11-22 là Chủ nhật, 2026-11-23 thứ hai, 2026-11-28 thứ bảy.
    ["khoảng 5-7 khớp Chủ nhật", "0 0 * * 5-7", ict(2026, 11, 22, 0, 0), true],
    ["khoảng 5-7 khớp thứ bảy", "0 0 * * 5-7", ict(2026, 11, 28, 0, 0), true],
    [
      "khoảng 5-7 không khớp thứ hai",
      "0 0 * * 5-7",
      ict(2026, 11, 23, 0, 0),
      false,
    ],
    ["khoảng 0-7 khớp Chủ nhật", "0 0 * * 0-7", ict(2026, 11, 22, 0, 0), true],
    [
      "khoảng 1-5 không khớp Chủ nhật",
      "0 0 * * 1-5",
      ict(2026, 11, 22, 0, 0),
      false,
    ],
    ["tháng", "0 0 1 12 *", ict(2026, 12, 1, 0, 0), true],
    ["tháng không khớp", "0 0 1 12 *", ict(2026, 11, 1, 0, 0), false],
  ];

  it.each(cases)("%s", (_label, pattern, at, expected) => {
    expect(isCronDue(pattern, at)).toBe(expected);
  });

  it("ném lỗi với pattern không đủ 5 field", () => {
    expect(() => isCronDue("* * *", new Date())).toThrow();
  });
});

describe("scheduledEnvelopesAt", () => {
  it("00:30 ICT đẩy billing:renew với jobId theo phút ICT", () => {
    const envelopes = scheduledEnvelopesAt(ict(2026, 11, 24, 0, 30).getTime());
    const renew = envelopes.find((e) => e.name === "billing:renew");
    expect(renew?.jobId).toBe("billing:renew:2026-11-24T00:30");
    expect(renew?.payloadJson).toBe("{}");
  });

  it("không bao giờ đẩy job backup trên Cloudflare", () => {
    const week = weekOfTicks();
    for (const ms of week) {
      for (const e of scheduledEnvelopesAt(ms)) {
        expect(CLOUDFLARE_SKIPPED_JOBS).not.toContain(e.name);
      }
    }
  });

  it("pattern lệch 5 phút được dispatch ở tick 5 phút phủ nó", () => {
    const def = {
      name: "order:expire" as const,
      pattern: "7 * * * *",
    };
    const envelopes = scheduledEnvelopesAt(
      ict(2026, 11, 24, 10, 10).getTime(),
      [def]
    );
    expect(envelopes.map((e) => e.jobId)).toEqual([
      "order:expire:2026-11-24T10:07",
    ]);
    expect(
      scheduledEnvelopesAt(ict(2026, 11, 24, 10, 5).getTime(), [def])
    ).toEqual([]);
    expect(
      scheduledEnvelopesAt(ict(2026, 11, 24, 10, 15).getTime(), [def])
    ).toEqual([]);
  });
});

function weekOfTicks(): number[] {
  // Thứ hai 2026-11-23 00:00 ICT → Chủ nhật 23:55, và qua ngày 1 tháng sau.
  const start = ict(2026, 11, 23, 0, 0).getTime();
  const ticks: number[] = [];
  for (let i = 0; i < 7 * 24 * 12; i++) {
    ticks.push(start + i * 5 * 60 * 1000);
  }
  return ticks;
}

describe("drift: JOB_DEFINITIONS ↔ scheduler Cloudflare (BR-JOB-10)", () => {
  it("mọi job cron được dispatch ít nhất một lần trong tuần/tháng, hoặc nằm trong skip set", () => {
    const dispatched = new Set<string>();
    // Một tuần phủ mọi pattern trừ theo-tháng; thêm tick ngày 1 tháng 12.
    const ticks = [
      ...weekOfTicks(),
      ...Array.from(
        { length: 12 },
        (_, i) => ict(2026, 12, 1, 0, 0).getTime() + i * 5 * 60 * 1000
      ),
    ];
    for (const ms of ticks) {
      for (const e of scheduledEnvelopesAt(ms)) {
        dispatched.add(e.name);
      }
    }
    const skipped = new Set<string>(CLOUDFLARE_SKIPPED_JOBS);
    const missing = JOB_DEFINITIONS.filter(
      (job) =>
        job.schedule.kind === "cron" &&
        !dispatched.has(job.name) &&
        !skipped.has(job.name)
    ).map((job) => job.name);
    expect(missing).toEqual([]);
  });

  it("job sự kiện không bao giờ bị dispatch theo lịch", () => {
    const eventJobs = new Set<string>(
      JOB_DEFINITIONS.filter((j) => j.schedule.kind === "event").map(
        (j) => j.name
      )
    );
    for (const ms of weekOfTicks()) {
      for (const e of scheduledEnvelopesAt(ms)) {
        expect(eventJobs.has(e.name)).toBe(false);
      }
    }
  });

  it("negative: một job cron không có trong registry thì drift test sẽ bắt", () => {
    const dispatched = new Set<string>();
    for (const ms of weekOfTicks()) {
      for (const e of scheduledEnvelopesAt(ms, [
        { name: "order:expire", pattern: "0 * * * *" },
      ])) {
        dispatched.add(e.name);
      }
    }
    expect(dispatched.has("billing:renew")).toBe(false);
  });
});
