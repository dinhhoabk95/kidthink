import { canPromptPwaInstall, type PwaInstallState } from "@kidthink/shared";
import { computed, onMounted, ref } from "vue";

const STORAGE_KEY = "kidthink_pwa_install_state";
const IOS_UA_REGEX = /iphone|ipad|ipod/;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePwaInstall() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
  const isStandalone = ref(false);
  const isIos = ref(false);
  const installState = ref<PwaInstallState>({
    dismissed_count: 0,
    last_dismissed_at: null,
  });

  function loadInstallState(): PwaInstallState {
    if (typeof window === "undefined" || !window.localStorage) {
      return { dismissed_count: 0, last_dismissed_at: null };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as PwaInstallState;
      }
    } catch {
      // Ignore JSON parse error
    }
    return { dismissed_count: 0, last_dismissed_at: null };
  }

  function saveInstallState(state: PwaInstallState) {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      installState.value = state;
    } catch {
      // Ignore storage error
    }
  }

  onMounted(() => {
    installState.value = loadInstallState();

    // Check standalone mode
    if (typeof window !== "undefined") {
      isStandalone.value =
        window.matchMedia?.("(display-mode: standalone)")?.matches ||
        Boolean(
          (window.navigator as unknown as { standalone?: boolean })?.standalone
        );

      // Check iOS
      const ua = window.navigator.userAgent.toLowerCase();
      isIos.value =
        IOS_UA_REGEX.test(ua) &&
        !(window as unknown as { MSStream?: unknown }).MSStream;

      // Capture beforeinstallprompt (BR-PWA-01: keep it, don't show immediately)
      window.addEventListener("beforeinstallprompt", (e: Event) => {
        e.preventDefault();
        deferredPrompt.value = e as BeforeInstallPromptEvent;
      });
    }
  });

  function shouldShowPrompt(params: {
    currentPath: string;
    childCount: number;
    completedSessionCount: number;
  }): boolean {
    // BR-PWA-01 & BR-PWA-02: ONLY on adult surface (/me), NEVER on /play
    const isAdult =
      params.currentPath.startsWith("/me") &&
      !params.currentPath.startsWith("/play");

    return canPromptPwaInstall({
      isAdultSurface: isAdult,
      childCount: params.childCount,
      completedSessionCount: params.completedSessionCount,
      installState: installState.value,
      isStandalone: isStandalone.value,
    });
  }

  async function promptInstall(): Promise<
    "accepted" | "dismissed" | "unavailable"
  > {
    if (!deferredPrompt.value) {
      return "unavailable";
    }

    try {
      await deferredPrompt.value.prompt();
      const choice = await deferredPrompt.value.userChoice;
      if (choice.outcome === "dismissed") {
        dismissPrompt();
      }
      deferredPrompt.value = null;
      return choice.outcome;
    } catch {
      return "unavailable";
    }
  }

  function dismissPrompt() {
    const newState: PwaInstallState = {
      dismissed_count: installState.value.dismissed_count + 1,
      last_dismissed_at: new Date().toISOString(),
    };
    saveInstallState(newState);
  }

  return {
    deferredPrompt: computed(() => deferredPrompt.value),
    isStandalone: computed(() => isStandalone.value),
    isIos: computed(() => isIos.value),
    installState: computed(() => installState.value),
    shouldShowPrompt,
    promptInstall,
    dismissPrompt,
  };
}
