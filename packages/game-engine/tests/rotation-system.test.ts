import { describe, expect, it } from "vitest";
import {
  formatClockTime,
  hourAngleToHour,
  isSameTime,
  minuteAngleToMinute,
  snapMinuteAngle,
  timeToAngles,
} from "../src/systems/rotation-system.js";

describe("rotationSystem (BR-MTB-15)", () => {
  it("converts ClockTime to angles correctly", () => {
    // 12:00 -> hour: 0, min: 0
    expect(timeToAngles({ hour: 12, minute: 0 })).toEqual({
      hourAngleDeg: 0,
      minuteAngleDeg: 0,
    });

    // 3:00 -> hour: 90, min: 0
    expect(timeToAngles({ hour: 3, minute: 0 })).toEqual({
      hourAngleDeg: 90,
      minuteAngleDeg: 0,
    });

    // 6:30 -> hour: 180 + 15 = 195, min: 180
    expect(timeToAngles({ hour: 6, minute: 30 })).toEqual({
      hourAngleDeg: 195,
      minuteAngleDeg: 180,
    });
  });

  it("snaps minute angle to notches (0 or 180 deg)", () => {
    expect(snapMinuteAngle(10, 30)).toBe(0);
    expect(snapMinuteAngle(170, 30)).toBe(180);
    expect(snapMinuteAngle(190, 30)).toBe(180);
    expect(snapMinuteAngle(350, 30)).toBe(0);
  });

  it("converts angles back to time components", () => {
    expect(hourAngleToHour(0)).toBe(12);
    expect(hourAngleToHour(90)).toBe(3);
    expect(hourAngleToHour(195)).toBe(6);
    expect(hourAngleToHour(270)).toBe(9);

    expect(minuteAngleToMinute(0)).toBe(0);
    expect(minuteAngleToMinute(180)).toBe(30);
  });

  it("compares times and formats time strings", () => {
    expect(isSameTime({ hour: 12, minute: 0 }, { hour: 12, minute: 0 })).toBe(
      true
    );
    expect(isSameTime({ hour: 12, minute: 0 }, { hour: 0, minute: 0 })).toBe(
      true
    );
    expect(isSameTime({ hour: 8, minute: 30 }, { hour: 8, minute: 0 })).toBe(
      false
    );

    expect(formatClockTime({ hour: 8, minute: 0 })).toBe("08:00");
    expect(formatClockTime({ hour: 11, minute: 30 })).toBe("11:30");
  });
});
