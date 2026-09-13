<template>
  <div />
</template>

<script lang="ts" setup>
  import { definePageMeta, navigateTo, useHead } from "#imports";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Khung chương trình",
  });

  await navigateTo("/studio/curricula", { replace: true });
</script>
