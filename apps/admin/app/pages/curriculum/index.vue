<template>
  <div />
</template>

<script lang="ts" setup>
  import { navigateTo } from "#imports";

  definePageMeta({
    layout: "manager",
  });

  await navigateTo("/studio/curricula", { replace: true });
</script>
