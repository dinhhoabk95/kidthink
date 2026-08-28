<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
    v-if="isOpen"
  >
    <div
      aria-labelledby="image-crop-title"
      aria-modal="true"
      class="w-full max-w-2xl bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      role="dialog"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-700 shrink-0"
      >
        <div>
          <h2
            class="text-lg font-bold text-surface-900 dark:text-white"
            id="image-crop-title"
          >
            Tải và Cắt Ảnh Minh Hoạ
          </h2>
          <p class="text-xs text-surface-500">
            Tỉ lệ vuông 1:1, tối đa 2MB. Chuẩn hoá WebP chất lượng cao.
          </p>
        </div>
        <button
          aria-label="Đóng"
          class="w-9 h-9 rounded-2xl flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all font-bold text-lg"
          type="button"
          @click="close"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Child Privacy Warning Banner (BR-IUP-08, BR-CDC-04) -->
      <div
        class="my-3 p-3 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 flex items-center gap-2.5 text-xs text-danger-800 dark:text-danger-300 font-medium shrink-0"
      >
        <span class="text-base">⚠️</span>
        <span>
          <strong>Lưu ý bảo vệ trẻ em:</strong>
          Tuyệt đối <strong>KHÔNG</strong> tải lên hình ảnh chụp gương mặt hoặc
          danh tính của trẻ em dưới mọi hình thức (BR-CDC-04).
        </span>
      </div>

      <!-- Main Workspace -->
      <div class="flex-1 overflow-y-auto space-y-4 py-2">
        <!-- 1. Dropzone if no image selected -->
        <button
          aria-label="Chọn hoặc kéo thả ảnh"
          class="w-full border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-3xl p-8 text-center hover:border-brand-500 transition-all cursor-pointer bg-surface-50 dark:bg-surface-900/30 flex flex-col items-center justify-center min-h-[220px]"
          type="button"
          v-if="!imageSource"
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="onFileDrop"
        >
          <input
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            type="file"
            ref="fileInputRef"
            @change="onFileSelected"
          >
          <div
            class="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center text-2xl mb-3"
          >
            📷
          </div>
          <span
            class="text-sm font-bold text-surface-800 dark:text-surface-200 mb-1"
          >
            Chọn hoặc kéo thả ảnh vào đây
          </span>
          <span class="text-xs text-surface-500">
            Hỗ trợ PNG, JPG, WebP. Tối đa 2 MB. Cấm SVG.
          </span>
        </button>

        <!-- 2. Interactive Crop Canvas & Preview Area -->
        <div class="space-y-4" v-else>
          <div
            class="flex flex-col sm:flex-row items-center gap-6 justify-center bg-surface-950 p-4 rounded-3xl"
          >
            <!-- Crop Viewport (Square Canvas) -->
            <div
              class="relative w-64 h-64 bg-surface-900 border-2 border-brand-500 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center"
            >
              <canvas
                class="w-full h-full object-contain"
                height="256"
                width="256"
                ref="cropCanvasRef"
              />
            </div>

            <!-- In-game Real-Size Preview Box (BR-IUP-02: 96x96px) -->
            <div class="flex flex-col items-center gap-2">
              <span class="text-xs font-semibold text-surface-400">
                Cỡ thật trong game (96px)
              </span>
              <div
                class="w-24 h-24 rounded-2xl border-2 border-surface-700 bg-surface-900 flex items-center justify-center overflow-hidden shadow-lg"
              >
                <canvas
                  class="w-full h-full"
                  height="96"
                  width="96"
                  ref="realSizeCanvasRef"
                />
              </div>
            </div>
          </div>

          <!-- Controls: Rotate 90 & Reset -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                class="px-3.5 py-1.5 rounded-xl border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-bold transition-all flex items-center gap-1.5"
                type="button"
                @click="rotateClockwise"
              >
                <span>↻ Xoay 90°</span>
              </button>
              <button
                class="px-3.5 py-1.5 rounded-xl border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-semibold transition-all"
                type="button"
                @click="triggerFileInput"
              >
                Đổi ảnh khác
              </button>
            </div>
          </div>

          <!-- Alt text input (BR-IUP-05: Mandatory) -->
          <div>
            <label
              class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
              for="image-alt-input"
            >
              Mô tả ảnh (Alt text) *
              <span class="text-danger-500 font-normal"
                >(Bắt buộc cho tiếp cận)</span
              >
            </label>
            <input
              class="w-full min-h-11 px-3 py-2 text-sm rounded-xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="image-alt-input"
              placeholder="Ví dụ: Quả dưa hấu màu đỏ có hạt đen"
              type="text"
              v-model="altText"
            >
          </div>
        </div>

        <!-- Error feedback -->
        <p
          class="text-xs text-danger-600 dark:text-danger-400 font-semibold"
          v-if="errorMessage"
        >
          {{ errorMessage }}
        </p>
      </div>

      <!-- Action Footer -->
      <div
        class="flex items-center justify-end gap-3 pt-3 border-t border-surface-200 dark:border-surface-700 shrink-0"
      >
        <button
          class="px-4 py-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-sm"
          type="button"
          @click="close"
        >
          Huỷ
        </button>
        <button
          class="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
          type="button"
          v-if="imageSource"
          :disabled="!altText.trim() || isUploading"
          @click="uploadCroppedImage"
        >
          <span>{{ isUploading ? "Đang xử lý..." : "Lưu & Sử dụng ảnh" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { nextTick, ref, watch } from "vue";

  const props = defineProps<{
    isOpen: boolean;
    targetFieldPath?: string;
  }>();

  const emit = defineEmits<{
    (e: "close"): void;
    (e: "uploaded", payload: { path: string; targetFieldPath?: string }): void;
  }>();

  const fileInputRef = ref<HTMLInputElement | null>(null);
  const cropCanvasRef = ref<HTMLCanvasElement | null>(null);
  const realSizeCanvasRef = ref<HTMLCanvasElement | null>(null);

  const imageSource = ref<string | null>(null);
  const altText = ref("");
  const rotationDegrees = ref(0);
  const isUploading = ref(false);
  const errorMessage = ref("");

  watch(
    () => props.isOpen,
    (open) => {
      if (open) {
        errorMessage.value = "";
      } else {
        imageSource.value = null;
        altText.value = "";
        rotationDegrees.value = 0;
      }
    }
  );

  function triggerFileInput() {
    fileInputRef.value?.click();
  }

  function onFileSelected(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      processIncomingFile(file);
    }
  }

  function onFileDrop(e: DragEvent) {
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processIncomingFile(file);
    }
  }

  function processIncomingFile(file: File) {
    errorMessage.value = "";

    if (file.name.toLowerCase().endsWith(".svg") || file.type.includes("svg")) {
      errorMessage.value =
        "Cấm tải tệp SVG (BR-IMG-02). Vui lòng chọn JPG/PNG/WebP.";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      errorMessage.value = "Dung lượng ảnh vượt quá 2MB (BR-IUP-04).";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      imageSource.value = e.target?.result as string;
      rotationDegrees.value = 0;
      nextTick(() => {
        renderCroppedCanvases();
      });
    };
    reader.readAsDataURL(file);
  }

  function rotateClockwise() {
    rotationDegrees.value = (rotationDegrees.value + 90) % 360;
    renderCroppedCanvases();
  }

  function renderCroppedCanvases() {
    if (
      !(imageSource.value && cropCanvasRef.value && realSizeCanvasRef.value)
    ) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      // 1. Draw on main 256x256 crop preview
      const ctx = cropCanvasRef.value?.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 256, 256);
        ctx.save();
        ctx.translate(128, 128);
        ctx.rotate((rotationDegrees.value * Math.PI) / 180);

        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, -128, -128, 256, 256);
        ctx.restore();
      }

      // 2. Draw on 96x96 real size preview
      const realCtx = realSizeCanvasRef.value?.getContext("2d");
      if (realCtx) {
        realCtx.clearRect(0, 0, 96, 96);
        realCtx.save();
        realCtx.translate(48, 48);
        realCtx.rotate((rotationDegrees.value * Math.PI) / 180);

        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        realCtx.drawImage(img, sx, sy, minDim, minDim, -48, -48, 96, 96);
        realCtx.restore();
      }
    };
    img.src = imageSource.value;
  }

  function getCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/webp", 0.85);
    });
  }

  async function uploadCroppedImage() {
    if (!(cropCanvasRef.value && altText.value.trim())) {
      return;
    }

    isUploading.value = true;
    errorMessage.value = "";

    try {
      const blob = await getCanvasBlob(cropCanvasRef.value);
      if (!blob) {
        errorMessage.value = "Lỗi xử lý ảnh";
        return;
      }

      const formData = new FormData();
      formData.append("file", blob, "cropped-image.webp");
      formData.append("owner_type", "game_level");
      formData.append("owner_id", "1");
      formData.append("alt", altText.value.trim());

      const res = await apiFetch<{ path: string }>("/api/managers/images", {
        method: "POST",
        body: formData,
      });

      emit("uploaded", {
        path: res.path,
        targetFieldPath: props.targetFieldPath,
      });
      emit("close");
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi khi tải ảnh lên máy chủ";
      errorMessage.value = message;
    } finally {
      isUploading.value = false;
    }
  }

  function close() {
    emit("close");
  }
</script>
