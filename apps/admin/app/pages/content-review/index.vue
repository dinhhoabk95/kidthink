<template>
  <div />
</template>

<script lang="ts" setup>
  import { definePageMeta, navigateTo, useHead } from "#imports";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Phê duyệt nội dung",
  });

  await navigateTo("/studio/review", { replace: true });
</script>
