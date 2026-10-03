<template>
  <div class="album-surface">
    <!-- Chỉ một lối ra: khoá phụ huynh nhấn giữ (`BR-STK-06`). -->
    <header class="album-hud">
      <KidParentLockButton
        data-testid="album-parent-lock"
        @unlock="showParentGate = true"
      />
    </header>

    <main class="album-main">
      <div class="album-state" v-if="isLoading">
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
        <KidMascot pose="idle" :size="160" />
      </div>

      <template v-else>
        <KidMascot pose="happy" :size="120" />
        <ul aria-label="Album sticker của bé" class="album-themes">
          <li
            class="album-theme"
            data-testid="album-theme"
            v-for="theme in themes"
            :key="theme.theme_code"
            :aria-label="themeLabel(theme.theme_code)"
          >
            <span aria-hidden="true" class="album-theme-icon"
              >{{ theme.icon_emoji }}</span
            >
            <ul class="album-stickers">
              <li
                class="album-sticker"
                data-testid="album-sticker"
                role="img"
                v-for="sticker in theme.stickers"
                :key="sticker.emoji"
                :aria-label="sticker.label"
              >
                {{ sticker.emoji }}
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
  import { getTheme } from "@mindkid/shared/client";
  import { onMounted, ref } from "vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import KidParentLockButton from "~/components/kid/parent-lock-button.vue";
  import { useApi } from "~/composables/use-api";

  /**
   * Album sticker của trẻ (`sticker-album.md`). Bề mặt trẻ: không navbar,
   * không chữ hiển thị, không số đếm (`BR-STK-03`, `BR-STK-06`).
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

  const router = useRouter();
  const api = useApi();

  const themes = ref<AlbumTheme[]>([]);
  const isLoading = ref(true);
  const hasError = ref(false);
  const showParentGate = ref(false);

  function themeLabel(themeCode: string): string {
    return `Chủ đề ${getTheme(themeCode)?.label_vi ?? themeCode}`;
  }

  async function loadAlbum(): Promise<void> {
    isLoading.value = true;
    hasError.value = false;
    try {
      const album = await api<StickerAlbum>("/api/users/play/stickers");
      themes.value = album.themes;
    } catch {
      // `useApi` đã điều hướng các lỗi cắt ngang (NO_ACTIVE_CHILD…); còn lại
      // thì hiện mascot khích lệ và nút tải lại, không chữ lỗi cho trẻ.
      hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function leaveAlbum(): void {
    showParentGate.value = false;
    router.push("/play");
  }

  onMounted(loadAlbum);
</script>

<style scoped>
  .album-surface {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-100);
    padding: 1rem;
  }

  .album-hud {
    display: flex;
    justify-content: flex-start;
  }

  .album-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
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
    background-color: var(--color-surface-0, #fff);
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
    border: 3px solid var(--color-surface-300);
    background-color: var(--color-surface-50);
  }

  .album-theme-icon {
    font-size: 2.5rem;
    line-height: 1;
    flex-shrink: 0;
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
    border-radius: 1.25rem;
    border: 3px dashed var(--color-brand-300);
    background-color: var(--color-surface-0, #fff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.75rem;
    line-height: 1;
  }

  .album-sticker:nth-child(odd) {
    transform: rotate(-4deg);
  }

  .album-sticker:nth-child(even) {
    transform: rotate(4deg);
  }
</style>
