<template>
  <span class="brand-emoji" :style="wrapperStyle">
    <img
      class="brand-emoji__img"
      decoding="async"
      draggable="false"
      v-if="activeSrc !== null"
      ref="imgRef"
      :alt="resolvedAlt"
      :aria-hidden="isDecorative ? 'true' : undefined"
      :height="props.size"
      :loading="props.eager ? 'eager' : 'lazy'"
      :src="activeSrc"
      :width="props.size"
    >
    <span
      :aria-hidden="activeSrc !== null || isDecorative ? 'true' : undefined"
      :aria-label="fallbackAriaLabel"
      :class="activeSrc === null ? 'brand-emoji__glyph' : 'sr-only'"
      :role="fallbackRole"
      >{{
        props.emoji
      }}</span
    >
  </span>
</template>

<script lang="ts" setup>
  import { resolveCustomEmojiSprite } from "@mindkid/emoji";
  import { type CSSProperties, computed, ref, watch } from "vue";

  export interface BrandEmojiProps {
    readonly alt?: string;
    readonly decorative?: boolean;
    readonly eager?: boolean;
    readonly emoji: string;
    readonly hero?: boolean;
    readonly size?: number;
  }

  const props = withDefaults(defineProps<BrandEmojiProps>(), {
    alt: "",
    decorative: undefined,
    eager: false,
    hero: false,
    size: undefined,
  });

  const imgRef = ref<HTMLImageElement | null>(null);
  const failedHero = ref(false);
  const failedSvg = ref(false);

  watch(
    () => [props.emoji, props.hero],
    () => {
      failedHero.value = false;
      failedSvg.value = false;
    }
  );

  const spriteMeta = computed(() => resolveCustomEmojiSprite(props.emoji));

  const activeSrc = computed<string | null>(() => {
    const meta = spriteMeta.value;
    if (meta === null) {
      return null;
    }
    if (props.hero && meta.heroWebpPath !== undefined && !failedHero.value) {
      return meta.heroWebpPath;
    }
    if (!failedSvg.value) {
      return meta.svgPath;
    }
    return null;
  });

  const isDecorative = computed<boolean>(() => {
    if (props.decorative !== undefined) {
      return props.decorative;
    }
    return props.alt.trim().length === 0;
  });

  const resolvedAlt = computed<string>(() => {
    if (isDecorative.value) {
      return "";
    }
    return props.alt;
  });

  const fallbackAriaLabel = computed<string | undefined>(() => {
    if (isDecorative.value || activeSrc.value !== null) {
      return undefined;
    }
    return resolvedAlt.value;
  });

  const fallbackRole = computed<"img" | undefined>(() => {
    if (isDecorative.value || activeSrc.value !== null) {
      return undefined;
    }
    return "img";
  });

  const wrapperStyle = computed<CSSProperties | undefined>(() => {
    if (props.size === undefined) {
      return undefined;
    }
    const px = `${props.size}px`;
    return {
      width: px,
      height: px,
      fontSize: `${Math.round(props.size * 0.82)}px`,
    };
  });

  function handleImageError(): void {
    const meta = spriteMeta.value;
    if (
      props.hero &&
      meta !== null &&
      meta.heroWebpPath !== undefined &&
      !failedHero.value
    ) {
      failedHero.value = true;
      return;
    }
    failedSvg.value = true;
  }

  watch(
    imgRef,
    (el, _prev, onCleanup) => {
      if (el === null) {
        return;
      }
      el.addEventListener("error", handleImageError);
      onCleanup(() => {
        el.removeEventListener("error", handleImageError);
      });
    },
    { flush: "sync" }
  );
</script>

<style scoped>
  .brand-emoji {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    line-height: 1;
    vertical-align: middle;
    user-select: none;
  }

  .brand-emoji__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  .brand-emoji__glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family:
      "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
    line-height: 1;
  }
</style>
