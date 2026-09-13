<template>
  <div />
</template>

<script lang="ts" setup>
  import { definePageMeta, navigateTo, useHead } from "#imports";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Hoạt động (Activities)",
  });

  await navigateTo("/studio/activities", { replace: true });
</script>
