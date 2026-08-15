<script lang="ts" setup>
  import { navigateTo } from "#imports";

  definePageMeta({
    layout: "manager",
  });

  await navigateTo("/studio/lessons", { replace: true });
</script>

<template>
  <div />
</template>
