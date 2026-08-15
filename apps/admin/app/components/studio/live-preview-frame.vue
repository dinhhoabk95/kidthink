<template>
  <div
    class="live-preview-container flex flex-col h-full bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-inner"
  >
    <!-- Preview Controls Toolbar -->
    <div
      class="h-14 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0"
    >
      <div class="flex items-center gap-3">
        <!-- Age Band Scaffolding Level Selector (BR-LPV-01) -->
        <div
          class="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800"
        >
          <button
            type="button"
            v-for="band in ageBands"
            :key="band.id"
            :class="[
              'px-2.5 py-1 rounded-xl text-xs font-bold transition-all',
              selectedAgeBand === band.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white',
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
            'min-h-9 px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
            reducedMotion
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'border-slate-700 text-slate-400 hover:bg-slate-800',
          ]"
          @click="toggleReducedMotion"
        >
          <span>Reduced Motion</span>
          <span
            class="w-1.5 h-1.5 rounded-full bg-amber-400"
            v-if="reducedMotion"
          ></span>
        </button>

        <!-- Audio Mute Toggle (BR-LPV-02) -->
        <button
          type="button"
          :class="[
            'min-h-9 px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
            isMuted
              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
              : 'border-slate-700 text-slate-400 hover:bg-slate-800',
          ]"
          @click="toggleMute"
        >
          <span>{{ isMuted ? "Tắt âm" : "Bật âm" }}</span>
        </button>
      </div>

      <!-- Replay & Reload Controls -->
      <div class="flex items-center gap-2">
        <button
          class="min-h-9 px-3 py-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1"
          type="button"
          @click="replaySession"
        >
          ↻ Chơi lại
        </button>
      </div>
    </div>

    <!-- Live Preview Canvas Frame (16:9 fixed ratio logic space 960x540) -->
    <div
      class="flex-1 p-4 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950"
    >
      <!-- Validation Error Banner (BR-LPV-03) -->
      <div
        class="absolute top-4 left-4 right-4 z-20 p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-600 text-rose-200 text-sm shadow-xl backdrop-blur-sm"
        v-if="validationError"
      >
        <div class="font-bold flex items-center gap-2 mb-1">
          <span class="text-rose-400 text-base">⚠️</span>
          <span>Dữ liệu màn chơi chưa hợp lệ với mẫu {{ templateCode }}:</span>
        </div>
        <div class="text-xs text-rose-300 font-mono">
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
        class="w-full max-w-[960px] aspect-[16/9] relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl bg-slate-900 flex items-center justify-center"
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
          class="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 z-10"
          v-if="isIframeLoading"
        >
          <div
            class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"
          ></div>
          <span class="text-sm font-medium">Đang khởi tạo Game Engine...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";

  export interface PreviewValidationError {
    message: string;
    issues?: Array<{ path: string; message: string }>;
  }

  const props = defineProps<{
    templateCode: string;
    levelData: Record<string, unknown>;
    validationError?: PreviewValidationError | null;
  }>();

  const selectedAgeBand = ref<"3-4" | "4-5" | "5-6">("3-4");
  const reducedMotion = ref(false);
  const isMuted = ref(false);
  const isIframeLoading = ref(true);
  const previewIframeRef = ref<HTMLIFrameElement | null>(null);

  const ageBands = [
    { id: "3-4", label: "Mầm (3-4)" },
    { id: "4-5", label: "Chồi (4-5)" },
    { id: "5-6", label: "Lá (5-6)" },
  ] as const;

  const previewUrl = computed(() => {
    return `/play/preview-sandbox?template=${props.templateCode}`;
  });

  onMounted(() => {
    if (previewIframeRef.value) {
      previewIframeRef.value.addEventListener("load", handleIframeLoad);
    }
  });

  onUnmounted(() => {
    if (previewIframeRef.value) {
      previewIframeRef.value.removeEventListener("load", handleIframeLoad);
    }
  });

  function handleIframeLoad() {
    isIframeLoading.value = false;
    postUpdateToIframe();
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

  function setAgeBand(band: "3-4" | "4-5" | "5-6") {
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

  function replaySession() {
    const iframe = previewIframeRef.value;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: "KIDTHINK_STUDIO_REPLAY",
        },
        "*"
      );
    }
  }

  function postUpdateToIframe() {
    const iframe = previewIframeRef.value;
    if (!iframe?.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(
      {
        type: "KIDTHINK_STUDIO_UPDATE",
        payload: {
          templateCode: props.templateCode,
          levelData: props.levelData,
          ageBand: selectedAgeBand.value,
          reducedMotion: reducedMotion.value,
          muted: isMuted.value,
        },
      },
      "*"
    );
  }
</script>
