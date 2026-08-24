<template>
  <div>
    <a :href="apiUrl(`/api/managers/worksheets/${code}/preview`)">Xem PDF</a>
    <button type="button" @click="load">Tải</button>
  </div>
</template>

<script lang="ts" setup>
  const code = "L1";

  async function load() {
    await apiFetch<{ items: string[] }>("/api/managers/users");
    await useApiFetch<{ total: number }>("/api/managers/dashboard");
  }
</script>
