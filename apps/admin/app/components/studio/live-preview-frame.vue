<template>
  <div
    class="live-preview-container flex flex-col h-full min-h-[360px] min-w-0 bg-surface-900 rounded-3xl overflow-hidden border-2 border-surface-800 shadow-inner"
  >
    <!-- Preview Controls Toolbar -->
    <div
      class="min-h-14 px-3 sm:px-4 py-2 bg-surface-950 border-b border-surface-800 flex flex-wrap items-center justify-between gap-2 shrink-0"
    >
      <div class="flex flex-wrap items-center gap-2 min-w-0">
        <!-- Age Band Scaffolding Level Selector (BR-LPV-01, BR-LPV-06) -->
        <div
          class="flex flex-wrap items-center gap-1 bg-surface-900 p-1 rounded-2xl border border-surface-800"
        >
          <button
            type="button"
            v-for="band in ageBands"
            :key="band.id"
            :class="[
              'min-h-11 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              selectedAgeBand === band.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-surface-400 hover:text-white',
            ]"
            @click="setAgeBand(band.id)"
          >
            {{ band.label }}
          </button>
        </div>

        <!-- Reduced Motion Toggle (BR-LPV-02) -->
        <button
          type="button"
          :class="[
            'min-h-11 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
            reducedMotion
              ? 'bg-warning-500/20 border-warning-500 text-warning-300'
              : 'border-surface-700 text-surface-400 hover:bg-surface-800',
          ]"
          @click="toggleReducedMotion"
        >
          <span>Reduced Motion</span>
          <span
            class="w-1.5 h-1.5 rounded-full bg-warning-400"
            v-if="reducedMotion"
          ></span>
        </button>

        <!-- Audio Mute Toggle (BR-LPV-02) -->
        <button
          type="button"
          :class="[
            'min-h-11 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
            isMuted
              ? 'bg-danger-500/20 border-danger-500 text-danger-300'
              : 'border-surface-700 text-surface-400 hover:bg-surface-800',
          ]"
          @click="toggleMute"
        >
          <span>{{ isMuted ? "Tắt âm" : "Bật âm" }}</span>
        </button>

        <!-- Scale Toggle (Fit vs 100% 960x540 - Spec §7.1) -->
        <button
          type="button"
          :class="[
            'min-h-11 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
            scaleMode === '100%'
              ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
              : 'border-surface-700 text-surface-400 hover:bg-surface-800',
          ]"
          @click="toggleScaleMode"
        >
          <span>{{
            scaleMode === "100%" ? "100% (960×540)" : "Tự vừa (Fit)"
          }}</span>
        </button>
      </div>

      <!-- Replay & Reload Controls -->
      <div class="flex items-center gap-2">
        <button
          class="min-h-11 px-3 py-1.5 rounded-xl border border-surface-700 bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-bold transition-all flex items-center gap-1"
          type="button"
          @click="replaySession"
        >
          ↻ Chơi lại
        </button>
      </div>
    </div>

    <!-- Live Preview Canvas Frame (16:9 fixed ratio logic space 960x540) -->
    <div
      class="flex-1 p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-auto bg-surface-950 min-w-0"
    >
      <!-- Validation Error Banner (BR-LPV-03) -->
      <div
        class="absolute top-4 left-4 right-4 z-20 p-4 rounded-2xl bg-danger-950/90 border-2 border-danger-600 text-danger-200 text-sm shadow-xl backdrop-blur-sm"
        v-if="validationError"
      >
        <div
          class="font-bold flex flex-wrap items-center justify-between gap-2 mb-1"
        >
          <div class="flex items-center gap-2">
            <UIcon
              class="w-4 h-4 text-danger-400 shrink-0"
              name="i-lucide-alert-triangle"
            />
            <span
              >Dữ liệu màn chơi chưa hợp lệ với mẫu {{ templateCode }}:</span
            >
          </div>
          <button
            class="min-h-11 text-xs px-3 py-1.5 rounded-xl bg-danger-800 hover:bg-danger-700 text-white font-mono transition-all"
            type="button"
            @click="copyErrorDetails"
          >
            Sao chép chi tiết
          </button>
        </div>
        <div class="text-xs text-danger-300 font-mono">
          {{ validationError.message }}
        </div>
        <ul
          class="mt-2 text-xs list-disc list-inside space-y-0.5"
          v-if="validationError.issues?.length"
        >
          <li v-for="(issue, idx) in validationError.issues" :key="idx">
            <span class="font-semibold">{{ issue.path }}:</span>
            {{ issue.message }}
          </li>
        </ul>
      </div>

      <!-- Iframe Target -->
      <div
        :class="[
          'relative rounded-2xl overflow-hidden border-2 border-surface-800 shadow-xl bg-surface-900 flex items-center justify-center transition-all',
          scaleMode === '100%'
            ? 'w-[960px] h-[540px] shrink-0'
            : 'w-full max-w-[960px] aspect-[16/9]',
        ]"
      >
        <iframe
          class="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Game Level Live Preview"
          ref="previewIframeRef"
          :src="previewUrl"
        />

        <!-- Overlay when no iframe or loading -->
        <div
          class="absolute inset-0 bg-surface-900 flex flex-col items-center justify-center text-surface-400 z-10"
          v-if="isIframeLoading"
        >
          <div
            class="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"
          ></div>
          <span class="text-sm font-medium">Đang khởi tạo Game Engine...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { AGE_BANDS, type AgeBand } from "@mindkid/shared/client";
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import { useRuntimeConfig } from "#imports";

  export interface PreviewValidationError {
    message: string;
    issues?: Array<{ path: string; message: string }>;
  }

  const TRAILING_SLASHES_REGEX = /\/+$/;
  const TRAILING_API_REGEX = /\/api$/;

  function resolveWebOrigin(apiBaseUrl: string): string {
    const trimmed = apiBaseUrl
      .trim()
      .replace(TRAILING_SLASHES_REGEX, "")
      .replace(TRAILING_API_REGEX, "");
    if (!trimmed) {
      return "";
    }
    try {
      return new URL(trimmed).origin;
    } catch {
      return trimmed;
    }
  }

  const props = defineProps<{
    templateCode: string;
    levelData: object;
    validationError?: PreviewValidationError | null;
    previewToken?: string | null;
  }>();

  const emit = defineEmits<(e: "preview-loaded") => void>();

  const runtimeConfig = useRuntimeConfig();
  const webOrigin = computed(() =>
    resolveWebOrigin(String(runtimeConfig.public.apiBaseUrl || ""))
  );

  const selectedAgeBand = ref<AgeBand>("3-4");
  const reducedMotion = ref(false);
  const isMuted = ref(false);
  const scaleMode = ref<"fit" | "100%">("fit");
  const isIframeLoading = ref(true);
  const previewIframeRef = ref<HTMLIFrameElement | null>(null);

  // Nhãn theo band; danh sách band thì dẫn xuất từ AGE_BANDS (BR-CFO-06).
  const AGE_BAND_LABELS: Record<AgeBand, string> = {
    "3-4": "Mầm (3-4)",
    "4-5": "Chồi (4-5)",
    "5-6": "Lá (5-6)",
  };
  const ageBands = AGE_BANDS.map((id) => ({ id, label: AGE_BAND_LABELS[id] }));

  const previewUrl = computed(() => {
    const params = new URLSearchParams();
    params.set("template", props.templateCode);
    if (props.previewToken) {
      params.set("token", props.previewToken);
    }
    return [webOrigin.value, `/play/preview-sandbox?${params.toString()}`].join(
      ""
    );
  });

  function handleWindowMessage(event: MessageEvent) {
    if (!webOrigin.value || event.origin !== webOrigin.value) {
      return;
    }
    const raw: object | null =
      typeof event.data === "object" ? event.data : null;
    if (!(raw && "type" in raw)) {
      return;
    }
    if (raw.type === "MindKid_STUDIO_SANDBOX_READY") {
      isIframeLoading.value = false;
      postUpdateToIframe();
      emit("preview-loaded");
    } else if (raw.type === "MindKid_STUDIO_SESSION_LOADED") {
      emit("preview-loaded");
    }
  }

  onMounted(() => {
    window.addEventListener("message", handleWindowMessage);
    if (previewIframeRef.value) {
      previewIframeRef.value.addEventListener("load", handleIframeLoad);
    }
  });

  onUnmounted(() => {
    window.removeEventListener("message", handleWindowMessage);
    if (previewIframeRef.value) {
      previewIframeRef.value.removeEventListener("load", handleIframeLoad);
    }
  });

  function handleIframeLoad() {
    isIframeLoading.value = false;
    postUpdateToIframe();
    emit("preview-loaded");
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  watch(
    () => props.levelData,
    () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        postUpdateToIframe();
      }, 300);
    },
    { deep: true }
  );

  function setAgeBand(band: AgeBand) {
    selectedAgeBand.value = band;
    postUpdateToIframe();
  }

  function toggleReducedMotion() {
    reducedMotion.value = !reducedMotion.value;
    postUpdateToIframe();
  }

  function toggleMute() {
    isMuted.value = !isMuted.value;
    postUpdateToIframe();
  }

  function toggleScaleMode() {
    scaleMode.value = scaleMode.value === "fit" ? "100%" : "fit";
  }

  function copyErrorDetails() {
    if (!props.validationError) {
      return;
    }
    const details = JSON.stringify(props.validationError, null, 2);
    navigator.clipboard?.writeText(details);
  }

  function replaySession() {
    const iframe = previewIframeRef.value;
    if (iframe?.contentWindow && webOrigin.value) {
      iframe.contentWindow.postMessage(
        {
          type: "MindKid_STUDIO_REPLAY",
        },
        webOrigin.value
      );
    }
  }

  function postUpdateToIframe() {
    const iframe = previewIframeRef.value;
    if (!(iframe?.contentWindow && webOrigin.value)) {
      return;
    }

    const plainLevelData: object = JSON.parse(
      JSON.stringify(props.levelData ?? {})
    );

    iframe.contentWindow.postMessage(
      {
        type: "MindKid_STUDIO_UPDATE",
        payload: {
          templateCode: props.templateCode,
          levelData: plainLevelData,
          ageBand: selectedAgeBand.value,
          reducedMotion: reducedMotion.value,
          muted: isMuted.value,
        },
      },
      webOrigin.value
    );
  }
</script>
