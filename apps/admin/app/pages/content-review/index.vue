<script lang="ts" setup>
  import { navigateTo } from "#imports";

  definePageMeta({
    layout: "manager",
  });

  await navigateTo("/studio/review", { replace: true });
</script>

<template>
  <div />
</template>
