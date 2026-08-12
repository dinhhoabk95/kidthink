// @kidthink/ui — App configuration extension point for Nuxt UI (BR-DSC-03, Task 3)

// biome-ignore lint/correctness/noUndeclaredVariables: Nuxt auto-imported global defineAppConfig
export default defineAppConfig({
  ui: {
    primary: "brand",
    gray: "surface",
    colors: {
      brand: "brand",
      cta: "cta",
      retry: "retry",
    },
    button: {
      default: {
        rounded: "rounded-2xl",
      },
    },
    card: {
      default: {
        rounded: "rounded-3xl",
      },
    },
  },
});
