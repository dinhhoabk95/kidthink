import { backupFilename } from "@mindkid/config/backup";
import { describe, expect, it } from "vitest";
import { selectExpired, selectRetained } from "./retention.js";

const DAY = 24 * 60 * 60 * 1000;
const BASE = Date.UTC(2026, 7, 28, 1, 0, 0);

/** One dump per day, newest first, `count` of them. */
function dailySeries(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    backupFilename(new Date(BASE - i * DAY))
  );
}

describe("BR-BAK-05: 30 daily / 12 weekly / 24 monthly", () => {
  it("keeps everything while there is less than a month of history", () => {
    const files = dailySeries(30);
    expect(selectRetained(files).size).toBe(30);
    expect(selectExpired(files)).toEqual([]);
  });

  it("thins older history instead of dropping it", () => {
    // Two years of daily dumps: a single 30-day window would leave 30 files and
    // no way back to a corruption that started in the spring.
    const files = dailySeries(730);
    const kept = selectRetained(files);

    expect(kept.size).toBeGreaterThan(30);
    expect(kept.size).toBeLessThan(80);
    expect(selectExpired(files).length).toBe(files.length - kept.size);
  });

  it("keeps the newest 30 days untouched", () => {
    const files = dailySeries(730);
    const kept = selectRetained(files);
    for (const name of dailySeries(30)) {
      expect(kept.has(name)).toBe(true);
    }
  });

  it("reaches back further than a year", () => {
    const files = dailySeries(730);
    const kept = [...selectRetained(files)].sort();
    // The oldest retained dump must be older than 12 months, otherwise the
    // monthly tier is not doing anything.
    const oldest = kept[0] as string;
    expect(oldest < backupFilename(new Date(BASE - 365 * DAY))).toBe(true);
  });

  it("never selects a file that is not one of our dumps", () => {
    const files = [...dailySeries(400), "notes.txt", "db-backup-broken.enc"];
    const kept = selectRetained(files);
    const expired = selectExpired(files);

    expect(kept.has("notes.txt")).toBe(false);
    expect(expired).not.toContain("notes.txt");
    expect(expired).not.toContain("db-backup-broken.enc");
  });

  it("an empty directory expires nothing", () => {
    expect(selectExpired([])).toEqual([]);
  });
});
