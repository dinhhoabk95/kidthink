// @mindkid/ui — App configuration extension point for Nuxt UI v4 (BR-DSC-03, Task #107)

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
            base: "min-h-19 text-lg px-6 py-4", // 76px floor (BR-A11-04)
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
