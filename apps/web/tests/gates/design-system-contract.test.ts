import { describe, expect, it } from "vitest";
import {
  runTabularNumsGate,
  scanComponentTabularNums,
  TABULAR_NUMS_TARGETS,
  verifyTailwindTabularNumsUtility,
} from "./design-system-contract.ts";

describe("BR-DSC-27: bắt buộc tabular-nums cho con số, bộ đếm và bảng số liệu", () => {
  it("CSS gốc và toàn bộ thành phần hiển thị số đếm/điểm/bảng số liệu đạt chuẩn tabular-nums", () => {
    expect(runTabularNumsGate()).toEqual([]);
  });

  it("Ca âm: xoá utility .tabular-nums khỏi tailwind.css thì cổng đỏ", () => {
    const badCss = "@theme static { --font-sans: 'Be Vietnam Pro'; }";
    const violations = verifyTailwindTabularNumsUtility(badCss);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.file).toBe("packages/ui/assets/css/tailwind.css");
  });

  it("Ca âm: thành phần bộ đếm HUD/modal/dashboard bỏ class tabular-nums thì cổng đỏ", () => {
    const hudTarget = TABULAR_NUMS_TARGETS[0];
    if (!hudTarget) {
      throw new Error("Missing target fixture");
    }
    const badHudVue = `<template>
  <span class="text-lg font-extrabold text-surface-900">
    {{ mapData.completed_lessons }}/{{ mapData.total_lessons }}
  </span>
</template>`;
    const violations = scanComponentTabularNums(badHudVue, hudTarget);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain("BR-DSC-27");
  });
});
