import { nextTick, onMounted, onUnmounted, type Ref, watch } from "vue";

export interface FocusTrapOptions {
  readonly onEscape?: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  containerRef: Ref<HTMLElement | null>,
  isActive: Ref<boolean>,
  options: FocusTrapOptions = {}
) {
  let previouslyFocusedElement: HTMLElement | null = null;

  function getFocusableElements(): HTMLElement[] {
    if (!containerRef.value) {
      return [];
    }
    const nodes =
      containerRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    return Array.from(nodes).filter(
      (el) => el.offsetParent !== null && !el.hasAttribute("disabled")
    );
  }

  function cycleFocus(
    event: KeyboardEvent,
    container: HTMLElement,
    focusables: HTMLElement[]
  ): void {
    const first = focusables[0];
    const last = focusables.at(-1);
    const active = document.activeElement;
    const isOutside = !container.contains(active);

    if (event.shiftKey) {
      if (active === first || isOutside) {
        event.preventDefault();
        last?.focus();
      }
      return;
    }

    if (active === last || isOutside) {
      event.preventDefault();
      first?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!(isActive.value && containerRef.value)) {
      return;
    }

    if (event.key === "Escape" && options.onEscape) {
      event.preventDefault();
      options.onEscape();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusables = getFocusableElements();
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    cycleFocus(event, containerRef.value, focusables);
  }

  function activate(): void {
    if (typeof document === "undefined") {
      return;
    }
    previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    nextTick(() => {
      const focusables = getFocusableElements();
      if (focusables.length > 0) {
        focusables[0]?.focus();
      } else {
        containerRef.value?.focus();
      }
    });
    document.addEventListener("keydown", handleKeyDown);
  }

  function deactivate(): void {
    if (typeof document === "undefined") {
      return;
    }
    document.removeEventListener("keydown", handleKeyDown);
    if (
      previouslyFocusedElement &&
      typeof previouslyFocusedElement.focus === "function"
    ) {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
  }

  watch(
    isActive,
    (active) => {
      if (active) {
        activate();
      } else {
        deactivate();
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    if (isActive.value) {
      activate();
    }
  });

  onUnmounted(() => {
    deactivate();
  });
}
