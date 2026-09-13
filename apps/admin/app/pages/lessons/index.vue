<template>
  <div />
</template>

<script lang="ts" setup>
  import { definePageMeta, navigateTo, useHead } from "#imports";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Bài học (Lessons)",
  });

  await navigateTo("/studio/lessons", { replace: true });
</script>
