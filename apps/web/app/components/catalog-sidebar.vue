<template>
  <aside aria-label="Danh mục kỹ năng và năng lực" class="taxonomy-sidebar">
    <div class="sidebar-card">
      <div class="sidebar-header">
        <div class="sidebar-header-title">
          <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-layers" />
          <span>Nhóm năng lực tư duy</span>
        </div>
        <button
          class="sidebar-reset-btn"
          title="Xoá chọn năng lực"
          type="button"
          v-if="selectedCompetency"
          @click="onSelectCompetency('')"
        >
          Xem tất cả
        </button>
      </div>

      <!-- Danh sách 6 nhóm năng lực -->
      <nav aria-label="Chọn nhóm năng lực" class="competency-nav-list">
        <!-- Mục Tất cả -->
        <button
          type="button"
          :class="['competency-nav-item', { active: selectedCompetency === '' }]"
          @click="onSelectCompetency('')"
        >
          <div class="nav-item-left">
            <span class="nav-item-emoji">🌟</span>
            <div class="nav-item-text">
              <span class="nav-item-title">Tất cả 6 nhóm năng lực</span>
              <span class="nav-item-sub">Toàn bộ kho trò chơi</span>
            </div>
          </div>
          <span class="nav-item-badge">{{ totalCount }}</span>
        </button>

        <!-- 6 Nhóm C1 đến C6 -->
        <div
          class="competency-nav-group"
          v-for="comp in COMPETENCY_CATALOG"
          :key="comp.code"
        >
          <button
            type="button"
            :class="['competency-nav-item', { active: selectedCompetency === comp.code }]"
            @click="onSelectCompetency(comp.code)"
          >
            <div class="nav-item-left">
              <span class="nav-item-emoji">{{ comp.emoji }}</span>
              <div class="nav-item-text">
                <span class="nav-item-title">{{ comp.name }}</span>
                <span class="nav-item-sub">{{ comp.short }}</span>
              </div>
            </div>
            <span
              class="nav-item-badge"
              v-if="facetCounts[comp.code] !== undefined"
            >
              {{ facetCounts[comp.code] }}
            </span>
          </button>

          <!-- Danh sách các mạch kỹ năng (Strands) con mở rộng khi chọn năng lực này -->
          <div class="strands-sublist" v-if="selectedCompetency === comp.code">
            <div class="strands-sublist-title">
              <span>Mạch kỹ năng trọng tâm:</span>
            </div>
            <div class="strands-pill-grid">
              <button
                type="button"
                :class="['strand-pill', { active: selectedStrand === '' }]"
                @click="onSelectStrand('')"
              >
                Tất cả
              </button>
              <button
                type="button"
                v-for="strand in getStrands(comp.code)"
                :key="strand.code"
                :class="['strand-pill', { active: selectedStrand === strand.name }]"
                @click="onSelectStrand(strand.name)"
              >
                {{ strand.name }}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script lang="ts" setup>
  import {
    COMPETENCY_CATALOG,
    findStrandsByCompetency,
    type StrandCatalogEntry,
  } from "@mindkid/shared/client";

  defineProps<{
    selectedCompetency: string;
    selectedStrand: string;
    totalCount: number;
    facetCounts: Record<string, number>;
  }>();

  const emit = defineEmits<{
    "select-competency": [code: string];
    "select-strand": [name: string];
  }>();

  function onSelectCompetency(code: string): void {
    emit("select-competency", code);
  }

  function onSelectStrand(name: string): void {
    emit("select-strand", name);
  }

  function getStrands(compCode: string): readonly StrandCatalogEntry[] {
    return findStrandsByCompetency(compCode);
  }
</script>

<style scoped>
  .taxonomy-sidebar {
    position: sticky;
    top: 5rem;
  }

  .sidebar-card {
    background-color: white;
    border-radius: 1.25rem;
    border: 2px solid var(--color-surface-200);
    padding: 1.25rem;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.85rem;
    margin-bottom: 0.85rem;
    border-bottom: 1.5px solid var(--color-surface-100);
  }

  .sidebar-header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--color-surface-900);
  }

  .sidebar-reset-btn {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-brand-600);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    border-radius: 0.35rem;
  }

  .sidebar-reset-btn:hover {
    background-color: var(--color-brand-50);
  }

  .competency-nav-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .competency-nav-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .competency-nav-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 48px;
    padding: 0.65rem 0.75rem;
    border-radius: 0.85rem;
    border: 1.5px solid transparent;
    background-color: var(--color-surface-50);
    color: var(--color-surface-800);
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
  }

  .competency-nav-item:hover {
    background-color: var(--color-surface-100);
    border-color: var(--color-surface-200);
  }

  .competency-nav-item.active {
    background-color: var(--color-brand-50, #eff6ff);
    border-color: var(--color-brand-400, #818cf8);
    color: var(--color-brand-900, #1e1b4b);
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.08);
  }

  .nav-item-left {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    overflow: hidden;
  }

  .nav-item-emoji {
    font-size: 1.35rem;
    flex-shrink: 0;
  }

  .nav-item-text {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .nav-item-title {
    font-size: 0.9rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-item-sub {
    font-size: 0.75rem;
    color: var(--color-surface-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .competency-nav-item.active .nav-item-sub {
    color: var(--color-brand-700);
  }

  .nav-item-badge {
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.2rem 0.5rem;
    border-radius: 9999px;
    background-color: white;
    border: 1px solid var(--color-surface-200);
    color: var(--color-surface-600);
    flex-shrink: 0;
  }

  .competency-nav-item.active .nav-item-badge {
    background-color: var(--color-brand-600);
    border-color: var(--color-brand-600);
    color: white;
  }

  /* Strands Sublist */
  .strands-sublist {
    background-color: var(--color-surface-100);
    border-radius: 0.85rem;
    padding: 0.75rem;
    margin-left: 0.5rem;
    border-left: 3px solid var(--color-brand-500);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .strands-sublist-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-surface-600);
  }

  .strands-pill-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .strand-pill {
    padding: 0.25rem 0.55rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-surface-200);
    background-color: white;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-surface-700);
    cursor: pointer;
    transition: all 0.15s;
  }

  .strand-pill:hover {
    border-color: var(--color-brand-400);
    color: var(--color-brand-700);
  }

  .strand-pill.active {
    background-color: var(--color-brand-600);
    border-color: var(--color-brand-600);
    color: white;
  }
</style>
