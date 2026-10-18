<template>
  <div class="min-h-screen min-h-dvh bg-surface-50 text-surface-800">
    <main class="h-screen h-dvh" id="main-content">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
  import { NOINDEX_ROBOTS_DIRECTIVE } from "@mindkid/shared/client";
  import { useSeoMeta } from "#imports";

  // Bề mặt chơi của trẻ (`play-stage-zones.md`, BR-PSZ-11): không navbar,
  // không footer, không liên kết công khai nào ngoài khoá phụ huynh của
  // chính trang chơi.
  // BR-SEO2-01: Bề mặt trẻ không được index
  useSeoMeta({
    robots: NOINDEX_ROBOTS_DIRECTIVE,
  });
</script>
