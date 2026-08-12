import { describe, expect, it } from "vitest";
import { SURFACE_RULES, TOUCH_FLOORS, validateIconName } from "../src/index.js";

describe("Task 3: Kit, Surfaces & Touch Floor Constants (BR-A11-04, BR-DSC-04)", () => {
  it("BR-A11-04: verifies touch floor single source of truth (D-FF)", () => {
    expect(TOUCH_FLOORS.kidBand3_4).toBe(96);
    expect(TOUCH_FLOORS.kidPrimary).toBe(76);
    expect(TOUCH_FLOORS.kidMin).toBe(64);
    expect(TOUCH_FLOORS.adult).toBe(44);
    expect(TOUCH_FLOORS.studio).toBe(40);
    expect(TOUCH_FLOORS.absoluteMin).toBe(24);
  });

  it("defines all 4 surfaces in structured dataset", () => {
    expect(SURFACE_RULES.surfaces.kid.touchFloorPx).toBe(64);
    expect(SURFACE_RULES.surfaces.kid.allowDarkMode).toBe(false);
    expect(SURFACE_RULES.surfaces.kid.allowRedSignal).toBe(false);

    expect(SURFACE_RULES.surfaces.account.touchFloorPx).toBe(44);
    expect(SURFACE_RULES.surfaces.public.touchFloorPx).toBe(44);
    expect(SURFACE_RULES.surfaces.admin.touchFloorPx).toBe(44);
  });

  it("BR-DSC-04: validates string icons i-lucide-* and rejects component objects", () => {
    expect(validateIconName("i-lucide-home")).toBe(true);
    expect(validateIconName("i-lucide-check-circle")).toBe(true);

    // Negative tests: Vue component object or non-lucide string
    const mockComponentObj = {
      render: () => {
        /* noop */
      },
    };
    expect(validateIconName(mockComponentObj)).toBe(false);
    expect(validateIconName("icon-home")).toBe(false);
    expect(validateIconName("fa-solid-home")).toBe(false);
  });
});
