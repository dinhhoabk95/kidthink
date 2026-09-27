<template>
  <div class="min-h-screen min-h-dvh bg-surface-50 text-surface-800">
    <main class="h-screen h-dvh" id="main-content">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
  // Bề mặt chơi của trẻ (`play-stage-zones.md`, BR-PSZ-11): không navbar,
  // không footer, không liên kết công khai nào ngoài khoá phụ huynh của
  // chính trang chơi.
</script>
