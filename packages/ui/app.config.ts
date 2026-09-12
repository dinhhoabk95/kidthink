// @mindkid/ui — App configuration extension point for Nuxt UI v4 (BR-DSC-03, Task #107)

import { TOUCH_FLOORS } from "@mindkid/shared/touch-floors";

// Tailwind quét tên lớp TĨNH trong mã nguồn, nên `min-h-19` phải viết thẳng —
// `min-h-${n}` sinh ra lớp mà Tailwind Cấm — NEVER thấy, và nút tụt xuống không
// có sàn nào. Ràng buộc với nguồn bằng một phép so sánh chạy lúc nạp config:
// đổi TOUCH_FLOORS.kidPrimary mà quên sửa tên lớp thì app chết ngay, thay vì
// im lặng hạ sàn chạm của trẻ (BR-A11-04, BR-CFO-07).
const TAILWIND_SPACING_STEP_PX = 4;
const KID_PRIMARY_TOUCH_CLASS = "min-h-19";
const KID_PRIMARY_TOUCH_UNITS = Number(
  KID_PRIMARY_TOUCH_CLASS.slice("min-h-".length)
);

if (
  KID_PRIMARY_TOUCH_UNITS * TAILWIND_SPACING_STEP_PX !==
  TOUCH_FLOORS.kidPrimary
) {
  throw new Error(
    `[BR-A11-04] Lớp ${KID_PRIMARY_TOUCH_CLASS} = ${KID_PRIMARY_TOUCH_UNITS * TAILWIND_SPACING_STEP_PX}px nhưng TOUCH_FLOORS.kidPrimary = ${TOUCH_FLOORS.kidPrimary}px.`
  );
}

// biome-ignore lint/correctness/noUndeclaredVariables: Nuxt auto-imported global defineAppConfig
export default defineAppConfig({
  ui: {
    colors: {
      primary: "brand",
      neutral: "surface",
      cta: "cta",
      retry: "retry",
      error: "danger",
      info: "brand",
      secondary: "surface",
      success: "success",
      warning: "warning",
    },
    button: {
      slots: {
        base: "font-heading rounded-2xl transition-[transform,box-shadow,background-color] duration-200 active:scale-95",
      },
      variants: {
        size: {
          xl: {
            base: `${KID_PRIMARY_TOUCH_CLASS} text-lg px-6 py-4`, // BR-A11-04, khoá vào TOUCH_FLOORS.kidPrimary
          },
        },
      },
      defaultVariants: {
        color: "primary",
      },
    },
    card: {
      slots: {
        root: "rounded-3xl border-4 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800",
      },
    },
    input: {
      slots: {
        base: "rounded-2xl border-[3px] border-surface-300 focus:border-brand-500",
      },
    },
  },
});
