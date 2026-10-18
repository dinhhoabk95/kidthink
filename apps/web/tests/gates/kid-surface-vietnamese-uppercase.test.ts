import { describe, expect, it } from "vitest";
import {
  runKidSurfaceVietnameseUppercaseGate,
  scanKidSurfaceUppercase,
} from "./kid-surface-vietnamese-uppercase.ts";

describe("BR-A11-09: cấm IN HOA (uppercase) trên bề mặt trẻ tiếng Việt", () => {
  it("Toàn bộ bề mặt trẻ thật không có class uppercase hay text-transform: uppercase", () => {
    expect(runKidSurfaceVietnameseUppercaseGate()).toEqual([]);
  });

  it("Ca âm: dùng class uppercase trên nhãn tiếng Việt ở bề mặt trẻ thì cổng đỏ", () => {
    const badVue = `<template>
  <span class="text-base font-bold text-brand-700 uppercase">
    Tuần {{ w.week_no }}
  </span>
</template>`;
    const violations = scanKidSurfaceUppercase(
      badVue,
      "apps/web/app/pages/play/map.vue"
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe("tailwind-class");
    expect(violations[0]?.line).toBe(2);
  });

  it("Ca âm: dùng text-transform: uppercase trong CSS bề mặt trẻ thì cổng đỏ", () => {
    const badCss = `.week-badge {
  font-weight: 700;
  text-transform: uppercase;
}`;
    const violations = scanKidSurfaceUppercase(
      badCss,
      "apps/web/app/assets/css/play-surface.css"
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe("css-text-transform");
    expect(violations[0]?.line).toBe(3);
  });

  it("Nhãn viết hoa chữ cái đầu bình thường (không có uppercase) thì xanh", () => {
    const goodVue = `<template>
  <span class="text-base font-bold text-brand-700 tabular-nums">
    Tuần {{ w.week_no }}
  </span>
</template>`;
    expect(scanKidSurfaceUppercase(goodVue)).toEqual([]);
  });
});
