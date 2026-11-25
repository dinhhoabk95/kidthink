<template>
  <div class="album-surface">
    <!-- HUD bề mặt trẻ: khoá phụ huynh + nút về Phòng Chơi Gấu Con (không thẻ <a>, BR-STK-06) -->
    <header class="album-hud">
      <KidParentLockButton
        data-testid="album-parent-lock"
        @unlock="showParentGate = true"
      />

      <button
        aria-label="Về Phòng Chơi Gấu Con"
        class="home-button min-h-16 min-w-16"
        data-testid="album-home"
        type="button"
        @click="goPlayroom"
      >
        <UIcon class="w-7 h-7 text-brand-600" name="i-lucide-house" />
      </button>
    </header>

    <main class="album-main">
      <KidChildSelectGate
        v-if="needsChildSelect"
        @selected="loadAlbum"
      />

      <div class="album-state" v-else-if="isLoading">
        <KidMascot pose="listen" :size="120" />
      </div>

      <div class="album-state" v-else-if="hasError">
        <KidMascot pose="encourage" :size="120" />
        <button
          aria-label="Thử tải lại album"
          class="retry-button"
          data-testid="album-retry"
          type="button"
          @click="loadAlbum"
        >
          <UIcon class="w-7 h-7" name="i-lucide-rotate-ccw" />
        </button>
      </div>

      <!-- Album trống: chỉ Gấu Con, không ô trống để "săn" (`BR-STK-03`). -->
      <div
        class="album-state"
        data-testid="album-empty"
        v-else-if="themes.length === 0"
      >
        <!-- Gấu Con mời chơi: chạm để nghe, nút icon dẫn về sảnh; không ô trống (`BR-STK-03`). -->
        <button
          aria-label="Gấu Con mời bé chơi để nhận sticker"
          class="empty-mascot"
          data-testid="album-empty-mascot"
          type="button"
          @click="inviteToPlay"
        >
          <KidMascot pose="idle" :size="160" />
        </button>
        <button
          aria-label="Đi chơi để nhận sticker"
          class="retry-button"
          data-testid="album-empty-play"
          type="button"
          @click="goPlayroom"
        >
          <UIcon class="w-8 h-8" name="i-lucide-play" />
        </button>
      </div>

      <template v-else>
        <!-- Sân chơi bối cảnh dán sticker chủ đề (`sticker-diorama.md`, `BR-SDM-01..07`) -->
        <KidStickerDioramaCanvas
          v-if="activeThemeCode"
          :pending-sticker="selectedSticker"
          :placements="activeScenePlacements"
          :theme-code="activeThemeCode"
          @update-placements="handleUpdateScenePlacements"
        />

        <!-- Khay gỗ bộ sưu tập sticker của bé: chạm phát tiếng + chọn dán tranh (BR-STK-06, BR-SDM-04..05) -->
        <ul aria-label="Album sticker của bé" class="album-themes">
          <li
            class="album-theme"
            data-testid="album-theme"
            v-for="(theme, index) in themes"
            :key="theme.theme_code"
            :class="{
              'album-theme--active': activeThemeCode === theme.theme_code,
            }"
          >
            <!-- Dải màu chọn cảnh chủ đề, không chứa chữ hay emoji (`QA 2026-10-03`, `BR-STK-06`). -->
            <button
              class="album-theme-band"
              data-testid="album-theme-band"
              type="button"
              :aria-label="themeLabel(theme.theme_code)"
              :class="`album-theme-band--${index % BAND_COUNT}`"
              @click="selectThemeScene(theme.theme_code)"
            />
            <ul class="album-stickers">
              <li
                class="album-sticker-cell"
                v-for="(sticker, sIdx) in theme.stickers"
                :key="sticker.emoji"
              >
                <button
                  class="album-sticker"
                  data-testid="album-sticker"
                  type="button"
                  :aria-label="sticker.label"
                  :class="{
                    'album-sticker--selected':
                      selectedSticker?.theme_code === theme.theme_code &&
                      selectedSticker?.emoji === sticker.emoji,
                    'album-sticker--bounce':
                      bouncingTrayKey === `${theme.theme_code}:${sticker.emoji}`,
                  }"
                  @click="handleTrayStickerTap(theme.theme_code, sticker, sIdx)"
                >
                  <BrandEmoji :emoji="sticker.emoji" />
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </template>
    </main>

    <ParentGateModal
      v-if="showParentGate"
      :client-only="true"
      @cancel="showParentGate = false"
      @verified="leaveAlbum"
    />
  </div>
</template>

<script lang="ts" setup>
  import {
    getTheme,
    type StickerDioramaPlacementItem,
    type StickerDioramaResponse,
  } from "@mindkid/shared/client";
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import { computed, onMounted, onUnmounted, ref } from "vue";
  import KidChildSelectGate from "~/components/kid/child-select-gate.vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import KidParentLockButton from "~/components/kid/parent-lock-button.vue";
  import KidStickerDioramaCanvas, {
    type PendingTraySticker,
  } from "~/components/kid/sticker-diorama-canvas.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { isNoActiveChildError } from "~/composables/play/no-active-child";
  import { useKidSound } from "~/composables/play/use-kid-sound";
  import { useApi } from "~/composables/use-api";

  /**
   * Sân chơi dán sticker bối cảnh & Album của trẻ (`sticker-album.md`, `sticker-diorama.md`).
   * Bề mặt trẻ: không navbar, không chữ hiển thị, không số đếm (`BR-STK-03`, `BR-STK-06`, `BR-SDM-06`).
   */
  definePageMeta({ layout: "kid" });

  interface AlbumSticker {
    emoji: string;
    label: string;
  }

  interface AlbumTheme {
    theme_code: string;
    icon_emoji: string;
    stickers: AlbumSticker[];
  }

  interface StickerAlbum {
    themes: AlbumTheme[];
  }

  const BAND_COUNT = 4;
  const SAVE_DEBOUNCE_MS = 450;

  const router = useRouter();
  const api = useApi();
  const { playMarimba, playSfx, speakVi } = useKidSound();

  const themes = ref<AlbumTheme[]>([]);
  const activeThemeCode = ref<string>("");
  const placementsByTheme = ref<Record<string, StickerDioramaPlacementItem[]>>(
    {}
  );
  const selectedSticker = ref<PendingTraySticker | null>(null);
  const bouncingTrayKey = ref<string | null>(null);
  const isLoading = ref(true);
  const hasError = ref(false);
  const showParentGate = ref(false);
  const needsChildSelect = ref(false);
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const activeScenePlacements = computed<
    readonly StickerDioramaPlacementItem[]
  >(() => placementsByTheme.value[activeThemeCode.value] ?? []);

  function themeLabel(themeCode: string): string {
    return `Chủ đề ${getTheme(themeCode)?.label_vi ?? themeCode}`;
  }

  function selectThemeScene(themeCode: string): void {
    if (activeThemeCode.value !== themeCode) {
      playSfx("wood_pickup");
      activeThemeCode.value = themeCode;
      selectedSticker.value = null;
    }
  }

  function handleTrayStickerTap(
    themeCode: string,
    sticker: AlbumSticker,
    index: number
  ): void {
    activeThemeCode.value = themeCode;
    selectedSticker.value = {
      theme_code: themeCode,
      emoji: sticker.emoji,
      label: sticker.label,
    };
    const key = `${themeCode}:${sticker.emoji}`;
    bouncingTrayKey.value = key;
    playMarimba(index);
    speakVi(sticker.label);
    setTimeout(() => {
      if (bouncingTrayKey.value === key) {
        bouncingTrayKey.value = null;
      }
    }, 450);
  }

  function scheduleSaveScene(
    themeCode: string,
    placements: StickerDioramaPlacementItem[]
  ): void {
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(() => {
      api("/api/users/play/sticker-diorama", {
        method: "PUT",
        body: {
          theme_code: themeCode,
          placements: placements.map((item) => ({
            emoji: item.emoji,
            instance_index: item.instance_index,
            norm_x: item.norm_x,
            norm_y: item.norm_y,
            scale: item.scale,
          })),
        },
      }).catch(() => {
        // Giữ nguyên bố cục đang chơi nếu mạng chập chờn (`sticker-diorama.md` §5)
      });
    }, SAVE_DEBOUNCE_MS);
  }

  function handleUpdateScenePlacements(
    next: StickerDioramaPlacementItem[]
  ): void {
    const code = activeThemeCode.value;
    if (!code) {
      return;
    }
    placementsByTheme.value = {
      ...placementsByTheme.value,
      [code]: next,
    };
    scheduleSaveScene(code, next);
  }

  async function fetchSavedDiorama(): Promise<
    Record<string, StickerDioramaPlacementItem[]>
  > {
    const diorama = await api<StickerDioramaResponse>(
      "/api/users/play/sticker-diorama"
    ).catch(() => null);
    if (!diorama?.placements_by_theme) {
      return {};
    }
    const normalized: Record<string, StickerDioramaPlacementItem[]> = {};
    for (const [k, list] of Object.entries(diorama.placements_by_theme)) {
      if (Array.isArray(list)) {
        normalized[k] = [...list];
      }
    }
    return normalized;
  }

  function isGuestError(err: Error | object | null): boolean {
    if (typeof err !== "object" || err === null || !("code" in err)) {
      return false;
    }
    return Reflect.get(err, "code") === "UNAUTHENTICATED";
  }

  function inviteToPlay(): void {
    speakVi("Chơi để nhận sticker nhé!", "wood_pickup");
  }

  async function loadAlbum(): Promise<void> {
    isLoading.value = true;
    hasError.value = false;
    needsChildSelect.value = false;
    try {
      const album = await api<StickerAlbum>("/api/users/play/stickers");
      themes.value = Array.isArray(album?.themes) ? album.themes : [];
      const firstTheme = themes.value[0]?.theme_code ?? "";
      if (!activeThemeCode.value && firstTheme) {
        activeThemeCode.value = firstTheme;
      }
      if (themes.value.length > 0) {
        placementsByTheme.value = await fetchSavedDiorama();
      }
    } catch (err) {
      const error = err instanceof Object ? err : null;
      if (isNoActiveChildError(error)) {
        // Phụ huynh đăng nhập chưa chọn bé (428): chọn hồ sơ, không hiện album trống.
        themes.value = [];
        needsChildSelect.value = true;
      } else if (isGuestError(error)) {
        themes.value = [];
      } else {
        hasError.value = true;
      }
    } finally {
      isLoading.value = false;
    }
  }

  function goPlayroom(): void {
    playSfx("wood_pickup");
    router.push("/play");
  }

  function leaveAlbum(): void {
    showParentGate.value = false;
    router.push("/play");
  }

  onMounted(loadAlbum);

  onUnmounted(() => {
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
    }
  });
</script>

<style scoped>
  .album-surface {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-100);
    padding: 1rem;
    user-select: none;
  }

  .album-hud {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.75rem;
    max-width: 64rem;
    width: 100%;
    margin-inline: auto;
  }

  .empty-mascot {
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
  }

  .home-button {
    width: 4rem;
    height: 4rem;
    border-radius: 1rem;
    border: 3px solid var(--color-brand-300);
    background-color: var(--color-surface-50);
    box-shadow: 0 4px 0 var(--color-brand-300);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .album-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding-block: 1rem;
  }

  .album-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }

  .retry-button {
    width: 4.5rem;
    height: 4.5rem;
    border-radius: 1.25rem;
    border: 3px solid var(--color-surface-300);
    background-color: var(--color-surface-50);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .album-themes {
    width: 100%;
    max-width: 48rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .album-theme {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 2rem;
    border: 3px solid var(--color-warning-300);
    background-color: var(--color-surface-50);
    box-shadow: 0 5px 0 var(--color-warning-300);
    cursor: pointer;
    transition: border-color 160ms ease;
  }

  .album-theme--active {
    border-color: var(--color-brand-400);
    box-shadow: 0 5px 0 var(--color-brand-300);
  }

  .album-theme-band {
    align-self: stretch;
    width: 1.5rem;
    min-width: 1.5rem;
    min-height: 4.5rem;
    border-radius: 9999px;
    border: none;
    padding: 0;
    flex-shrink: 0;
    cursor: pointer;
    background-color: var(--color-brand-300);
  }

  .album-theme-band--1 {
    background-color: var(--color-warning-400);
  }

  .album-theme-band--2 {
    background-color: var(--color-success-400, var(--color-brand-400));
  }

  .album-theme-band--3 {
    background-color: var(--color-surface-400);
  }

  .album-stickers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .album-sticker {
    width: 4.5rem;
    height: 4.5rem;
    min-width: 4rem;
    min-height: 4rem;
    border-radius: 1.25rem;
    border: 3px dashed var(--color-brand-300);
    background-color: var(--color-surface-50);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family:
      "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
    font-size: 2.75rem;
    line-height: 1;
    cursor: pointer;
    transition:
      transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
      border-color 160ms ease;
  }

  .album-sticker-cell:nth-child(odd) {
    transform: rotate(-4deg);
  }

  .album-sticker-cell:nth-child(even) {
    transform: rotate(4deg);
  }

  .album-sticker--selected {
    border-style: solid;
    border-color: var(--color-cta);
    background-color: var(--color-warning-50);
    box-shadow: 0 4px 0 var(--color-cta);
  }

  .album-sticker--bounce {
    animation: trayStickerBounce 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes trayStickerBounce {
    0% {
      transform: scale(1);
    }
    35% {
      transform: scale(1.22, 0.85);
    }
    70% {
      transform: scale(0.95, 1.08);
    }
    100% {
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .album-sticker--bounce {
      animation: none;
    }
  }
</style>
