<template>
  <div />
</template>

<script lang="ts" setup>
  import { definePageMeta, navigateTo, useHead } from "#imports";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Game Levels",
  });

  await navigateTo("/studio/levels", { replace: true });
</script>
