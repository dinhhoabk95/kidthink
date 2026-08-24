<template>
  <div>
    <a :href="`/api/managers/worksheets/${code}/preview`">Xem PDF</a>
    <button type="button" @click="load">Tải</button>
    <button type="button" @click="openExport">Xuất</button>
    <img alt="" :src="imageUrl()">
  </div>
</template>

<script lang="ts" setup>
  const code = "L1";
  const query = "kind=all";
  const path = "images/a.png";

  async function load() {
    await $fetch("/api/managers/users");
  }

  function openExport() {
    window.open(`/api/managers/audit-logs/export?${query}`, "_blank");
  }

  function imageUrl() {
    return `/api/guest/storage/${path}`;
  }
</script>
