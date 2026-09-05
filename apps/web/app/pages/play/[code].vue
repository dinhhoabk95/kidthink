<template>
  <div class="game-play-container">
    <!-- Loading State -->
    <div class="loading-state" v-if="isLoading">
      <div class="loading-box">
        <span aria-hidden="true" class="loading-emoji animate-bounce">🐻</span>
        <p class="loading-text">Đang chuẩn bị bài học cho bé...</p>
      </div>
    </div>

    <!-- Error State -->
    <div class="error-state" v-else-if="errorMessage">
      <div class="error-card">
        <span aria-hidden="true" class="error-emoji">{{ errorEmoji }}</span>
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-desc">{{ errorMessage }}</p>
        <div class="error-actions">
          <NuxtLink
            class="btn-primary"
            v-if="errorActionLink"
            :to="errorActionLink"
          >
            {{ errorActionText }}
          </NuxtLink>
          <NuxtLink class="btn-secondary" to="/games">
            Về danh sách trò chơi
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Active Game Viewport -->
    <div class="game-viewport" v-show="!(isLoading || errorMessage)">
      <!-- TOP HUD BAR (Stitch MCP Kinder-Tactile) -->
      <header class="top-hud-bar">
        <!-- Left: Lesson Info Pill -->
        <div class="lesson-info-pill">
          <div class="avatar-circle">
            <span aria-hidden="true" class="avatar-emoji">🐻</span>
          </div>
          <span class="lesson-title-text">{{ displayTitle }}</span>
        </div>

        <!-- Center: Star Progress Track -->
        <div class="progress-container">
          <KidRoundProgressIndicator
            :current="currentRound"
            :total="totalRounds"
          />
        </div>

        <!-- Right: Actions (Audio Replay & Parent Lock) -->
        <div class="hud-actions">
          <button
            aria-label="Nghe lại hướng dẫn"
            class="btn-audio-replay clay-button"
            type="button"
            @click="replayInstructionAudio"
          >
            <span class="btn-icon">🔊</span>
            <span class="btn-label">Nghe lại</span>
          </button>

          <button
            aria-label="Cổng phụ huynh / Thoát"
            class="btn-parent-lock"
            type="button"
            @click="showParentGate = true"
          >
            <span class="lock-icon">🔒</span>
          </button>
        </div>
      </header>

      <!-- MAIN ARENA: Montessori Wooden Tray Canvas -->
      <main class="main-arena">
        <div class="wooden-tray-container">
          <canvas
            class="game-canvas"
            ref="canvasRef"
            @pointercancel="handlePointerCancel"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
          />
        </div>
      </main>

      <!-- Victory Celebration Modal -->
      <KidVictoryModal
        :show="showVictoryModal"
        :stars="earnedStars ?? undefined"
        @continue="handleContinueNext"
        @replay="handleReplayGame"
      />

      <!-- Parent Gate Exit Modal -->
      <ParentGateModal
        v-if="showParentGate"
        @cancel="showParentGate = false"
        @verified="handleParentVerified"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    createGameSessionSync,
    drawTargetHoverAura,
    type EngineConfig,
    GameEngine,
    type GameSession,
    getTemplateInput,
    LIFECYCLE,
    type RoundConfig,
    RoundRunner,
    type Slot,
  } from "@mindkid/game-engine";
  import { nextTick, onMounted, onUnmounted, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { definePageMeta, useUserSession } from "#imports";

  definePageMeta({ layout: false });

  type JsonPrimitive = string | number | boolean | null;
  interface JsonObject {
    [key: string]: JsonPrimitive | JsonObject | JsonArray;
  }
  type JsonArray = Array<JsonPrimitive | JsonObject | JsonArray>;

  interface RoundPayload {
    round_index: number;
    instruction?: string | null;
    instruction_audio_path?: string | null;
    content_pack: JsonObject;
    difficulty_params: JsonObject;
    difficulty?: number;
  }

  interface ConfigPayload {
    level_code: string;
    code: string;
    title?: string;
    name?: string;
    content_version?: number;
    template_code: string;
    content_pack?: JsonObject;
    difficulty_params?: JsonObject;
    theme_id: string;
    age_band?: "3-4" | "4-5" | "5-6";
    scoring?: { mode: "rounds" | "attempts" };
    rounds?: RoundPayload[];
    session?: { uuid: string; started_at?: string };
    flags?: {
      reduced_motion?: boolean;
      audio_enabled?: boolean;
      tap_fallback?: boolean;
    };
    assets?: Array<{
      ref: string;
      kind: string;
      url?: string;
      glyph?: string;
    }>;
  }

  interface ItemAsset {
    kind: string;
    ref?: string;
    path?: string;
  }

  interface InteractiveSessionItem {
    item_id: string;
    attribute?: string;
    asset?: ItemAsset;
    label?: string;
    text?: string;
    is_correct?: boolean;
  }

  interface InteractiveSession {
    slots?: readonly Slot[];
    content?: {
      container?: { container_id: string; label?: string };
      options?: Array<{
        value: number;
        item_id?: string;
        label?: string;
        text?: string;
        asset?: ItemAsset;
      }>;
      items?: InteractiveSessionItem[];
      pairs?: Array<{
        left: { item_id: string; asset?: ItemAsset };
        right: { item_id: string; asset?: ItemAsset };
      }>;
      slots?: Array<{
        slot_id: string;
        expected_item_id?: string;
        label?: string;
      }>;
      objects?: Array<{ object_id: string }>;
    };
    displayOptions?: Array<{
      item_id: string;
      value?: number;
      asset?: ItemAsset;
      label?: string;
      text?: string;
    }>;
    displayItems?: InteractiveSessionItem[];
    displayLeft?: InteractiveSessionItem[];
    displayRight?: InteractiveSessionItem[];
    getOptions?: () => Array<{ value: number; item_id?: string }>;
    selectOption?: (opt: number | string) => boolean | undefined;
    onItemLocked?: (id: string) => void;
    flipCard?: (idx: number) => void;
    tapObject?: (id: string) => void;
    onItemDropped?: (itemId: string, containerId: string) => void;
    onItemPlaced?: (itemId: string, slotId: string) => void;
    connectPair?: (leftId: string, rightId: string) => void;
    onPairMatched?: (leftId: string, rightId: string) => void;
    stageItem?: (itemId: string | null) => void;
    getStagedItemId?: () => string | null;
    getContainerId?: () => string;
    getPlacements?: () => ReadonlyMap<string, string>;
    placedSlots?: Map<string, string>;
    hoveredContainer?: boolean;
  }

  const route = useRoute();
  const router = useRouter();
  const levelCode = route.params.code as string;
  const { loggedIn, fetch: fetchSession } = useUserSession();

  const isLoading = ref(true);
  const errorMessage = ref<string | null>(null);
  const errorTitle = ref<string>("Đã có lỗi xảy ra");
  const errorEmoji = ref<string>("😢");
  const errorActionLink = ref<string | null>(null);
  const errorActionText = ref<string>("Thử lại");

  const displayTitle = ref<string>("Bài học toán tư duy");
  const showVictoryModal = ref(false);
  const showParentGate = ref(false);

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const currentRound = ref(0);
  const totalRounds = ref(1);
  /** Sao do **server** tính (BR-SCO-01, BR-RSP-12). Client Cấm — NEVER tự tính. */
  const earnedStars = ref<number | null>(null);

  /** `EventsSchema` của endpoint event chặn ở `.max(100)`. */
  const MAX_EVENTS_PER_REQUEST = 100;

  let engine: GameEngine | null = null;
  let roundRunner: RoundRunner | null = null;
  let cachedPayload: ConfigPayload | null = null;
  let currentInstructionAudio: string | null = null;

  async function preloadAssets(
    assets: Array<{ ref: string; kind: string; url?: string; glyph?: string }>
  ) {
    const promises: Promise<void>[] = [];
    for (const asset of assets) {
      if (asset.kind === "image" && asset.url) {
        const srcUrl = asset.url;
        promises.push(
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = srcUrl;
          })
        );
      } else if (asset.kind === "audio" && asset.url) {
        const srcUrl = asset.url;
        promises.push(
          new Promise<void>((resolve) => {
            const aud = new Audio();
            aud.oncanplaythrough = () => resolve();
            aud.onerror = () => resolve();
            aud.src = srcUrl;
          })
        );
      }
    }
    await Promise.all(promises);
  }

  function playSessionApiBase(): string {
    return loggedIn.value ? "/api/users" : "/api/guest";
  }

  /**
   * Đẩy chuỗi event của cả phiên lên server.
   *
   * Tới 2026-08-31 `apps/web/app` **không tham chiếu `play-sessions` một lần
   * nào** — bốn endpoint `events` và `complete` tồn tại và không ai gọi. Hệ quả:
   * server mở một hàng `play_sessions` mỗi lần trẻ vào chơi rồi bỏ đó
   * `in_progress` mãi, và toàn bộ đường điểm ở `scoring.ts` là mã không ai chạm.
   *
   * `seq` đánh từ 1 và tăng dần: `validateSequenceNumbers` chặn `seq < 1` và
   * chặn lùi xuống dưới `currentMaxSeq`, còn seq trùng thì bị skip — nên gửi lại
   * cùng một chuỗi là idempotent.
   */
  async function uploadTelemetry(sessionUuid: string): Promise<void> {
    if (!roundRunner) {
      return;
    }
    const events = roundRunner.getAllTelemetry().map((e, index) => ({
      seq: index + 1,
      event_name: e.event_name,
      occurred_at_ms: e.timestamp_ms,
      payload: e.data,
    }));

    for (let from = 0; from < events.length; from += MAX_EVENTS_PER_REQUEST) {
      const chunk = events.slice(from, from + MAX_EVENTS_PER_REQUEST);
      const res = await fetch(
        `${playSessionApiBase()}/play-sessions/${sessionUuid}/events`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ events: chunk }),
        }
      );
      if (!res.ok) {
        throw new Error(
          `Gửi chuỗi sự kiện thất bại: ${res.status} ${res.statusText}`
        );
      }
    }
  }

  /**
   * Đóng phiên và nhận sao.
   *
   * Sao đến từ server (`BR-SCO-01`), và client Cấm — NEVER gửi kết quả vòng lên
   * (`BR-RSP-12`) — chỉ gửi chuỗi event, server tự dựng `rounds_total` và
   * `rounds_correct` từ đó.
   *
   * Lỗi mạng Cấm — NEVER chặn phần ăn mừng của trẻ: `BR-RSP` đã chốt lập trường
   * đó ở nhánh "mất mạng giữa set" — chạy hết set bình thường. Nhưng lỗi vẫn
   * phải kêu ở console, Cấm — NEVER nuốt im lặng.
   */
  async function finishSession(): Promise<void> {
    const sessionUuid = cachedPayload?.session?.uuid;
    if (!sessionUuid) {
      console.error(
        "[play] payload config thiếu session.uuid — không đóng được phiên"
      );
      showVictoryModal.value = true;
      return;
    }

    try {
      await uploadTelemetry(sessionUuid);
      const res = await fetch(
        `${playSessionApiBase()}/play-sessions/${sessionUuid}/complete`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) {
        throw new Error(`Đóng phiên thất bại: ${res.status} ${res.statusText}`);
      }
      const result = (await res.json()) as { stars?: number | null };
      earnedStars.value = result.stars ?? null;
    } catch (err) {
      console.error("[play] không đóng được phiên chơi:", err);
    } finally {
      showVictoryModal.value = true;
    }
  }

  function playInstructionNarration(promptText?: string) {
    if (currentInstructionAudio) {
      const aud = new Audio(currentInstructionAudio);
      aud.play().catch(() => {
        if (promptText && engine) {
          engine.audio.speakPrompt(promptText);
        }
      });
    } else if (promptText && engine) {
      engine.audio.speakPrompt(promptText);
    }
  }

  function replayInstructionAudio() {
    engine?.audio.playTapSound();
    const currentRoundCfg = roundRunner?.getCurrentRoundConfig();
    const prompt =
      (currentRoundCfg?.content_pack as { prompt?: string })?.prompt ||
      currentRoundCfg?.instruction ||
      cachedPayload?.title;
    playInstructionNarration(prompt);
  }

  function handleContinueNext() {
    showVictoryModal.value = false;
    const returnTo = route.query.return_to;
    if (typeof returnTo === "string" && returnTo) {
      router.push(`/play/${returnTo}`);
      return;
    }
    router.push("/games");
  }

  function handleReplayGame() {
    showVictoryModal.value = false;
    if (cachedPayload) {
      const rounds = cachedPayload.rounds ?? [];
      if (rounds.length === 0) {
        return;
      }
      startRounds(
        cachedPayload,
        rounds,
        buildEngineConfig(cachedPayload, rounds[0])
      );
    }
  }

  function handleParentVerified() {
    showParentGate.value = false;
    router.push("/games");
  }

  /**
   * Đổi điểm chạm sang toạ độ logic bằng chính hình học mà engine đang vẽ.
   */
  function getLogicCoordinates(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const boxX = clientX - rect.left;
    const boxY = clientY - rect.top;
    if (engine) {
      return engine.renderSystem.toLogicPoint(boxX, boxY);
    }
    return { x: boxX, y: boxY };
  }

  function findHitSlot(slots: readonly Slot[], x: number, y: number): number {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s) {
        continue;
      }
      const hw = (s.hitW || s.w || 80) / 2;
      const hh = (s.hitH || s.h || 80) / 2;
      if (Math.abs(x - s.x) <= hw && Math.abs(y - s.y) <= hh) {
        return i;
      }
    }
    return -1;
  }

  interface DragItemInfo {
    item_id: string;
    slotIndex: number;
    asset?: ItemAsset;
    label?: string;
    text?: string;
  }

  interface ReturningItem {
    item: DragItemInfo;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    startTime: number;
    duration: number;
  }

  let activePointerId: number | null = null;
  let pointerDownTime = 0;
  let pointerDownX = 0;
  let pointerDownY = 0;
  let isDragging = false;
  let isMoved = false;
  let draggedItem: DragItemInfo | null = null;
  let returningItem: ReturningItem | null = null;
  let currentDragPos = { x: 0, y: 0 };
  let selectedSourceIndex: number | null = null;
  let hoveredTargetIndex: number | null = null;
  let isSettlingRound = false;

  function getSourceSlotIndex(
    slots: readonly Slot[],
    hitIdx: number,
    session?: GameSession
  ): number {
    const slot = slots[hitIdx];
    const sourceSlots =
      session &&
      "sourceSlots" in session &&
      Array.isArray((session as { sourceSlots: readonly Slot[] }).sourceSlots)
        ? (session as { sourceSlots: readonly Slot[] }).sourceSlots
        : slots.filter((s) => s.role === "source");
    if (sourceSlots.length > 0 && slot?.role === "source") {
      const idx = sourceSlots.indexOf(slot);
      if (idx >= 0) {
        return idx;
      }
    }
    return hitIdx;
  }

  function getItemFromCollection(
    session: GameSession & InteractiveSession,
    itemIndex: number
  ): InteractiveSessionItem | undefined {
    const directItem =
      session.displayLeft?.[itemIndex] || session.displayItems?.[itemIndex];
    if (directItem) {
      return directItem;
    }

    const opt =
      session.displayOptions?.[itemIndex] ||
      session.content?.options?.[itemIndex];
    if (opt) {
      return {
        item_id: opt.item_id ?? `opt-${itemIndex}`,
        asset: opt.asset,
        label: opt.label,
        text: opt.text,
      };
    }
    return session.content?.items?.[itemIndex];
  }

  function getItemForSlot(
    session: GameSession & InteractiveSession,
    hitIdx: number,
    slots: readonly Slot[]
  ): InteractiveSessionItem | undefined {
    const itemIndex = getSourceSlotIndex(slots, hitIdx, session);
    return getItemFromCollection(session, itemIndex);
  }

  function isSourceSlot(
    session: GameSession & InteractiveSession,
    hitIdx: number,
    slots: readonly Slot[]
  ): boolean {
    const slot = slots[hitIdx];
    if (slot?.role === "source") {
      return true;
    }
    if (slot?.role === "target") {
      return false;
    }
    if (
      slots.length > 1 &&
      hitIdx === slots.length - 1 &&
      typeof session.onItemDropped === "function"
    ) {
      return false;
    }
    const hasExplicitTarget = slots.some((s) => s.role === "target");
    if (hasExplicitTarget) {
      return false;
    }
    const itemCount =
      session.displayItems?.length ||
      session.displayOptions?.length ||
      session.displayLeft?.length ||
      session.content?.items?.length ||
      session.content?.options?.length ||
      0;
    return hitIdx < itemCount;
  }

  function isItemLocked(
    session: GameSession & InteractiveSession,
    itemId: string
  ): boolean {
    const placements = session.getPlacements?.();
    if (placements?.has(itemId)) {
      return true;
    }
    if (session.placedSlots) {
      for (const [key, val] of session.placedSlots.entries()) {
        if (key === itemId || val === itemId) {
          return true;
        }
      }
    }
    return false;
  }

  function isTargetSlot(
    session: GameSession & InteractiveSession,
    slots: readonly Slot[],
    idx: number
  ): boolean {
    const slot = slots[idx];
    if (!slot) {
      return false;
    }
    if (slot.role === "target") {
      return true;
    }
    if (
      slots.length > 1 &&
      idx === slots.length - 1 &&
      typeof session.onItemDropped === "function"
    ) {
      return true;
    }
    const leftCount = session.displayLeft?.length || 0;
    return Boolean(session.displayRight && idx >= leftCount);
  }

  function findNearestTargetSlot(
    session: GameSession & InteractiveSession,
    slots: readonly Slot[],
    x: number,
    y: number
  ): number | null {
    let bestIdx: number | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!(slot && isTargetSlot(session, slots, i))) {
        continue;
      }
      const halfW = Math.max(slot.hitW || slot.w || 80, 240) / 2 + 24;
      const halfH = Math.max(slot.hitH || slot.h || 80, 120) / 2 + 24;

      if (Math.abs(x - slot.x) <= halfW && Math.abs(y - slot.y) <= halfH) {
        const dist = Math.hypot(x - slot.x, y - slot.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
    }
    return bestIdx;
  }

  function handlePlacementByContainer(
    session: GameSession & InteractiveSession,
    dragged: DragItemInfo
  ): boolean {
    if (typeof session.onItemDropped !== "function") {
      return false;
    }
    const containerId =
      session.getContainerId?.() ||
      session.content?.container?.container_id ||
      "coop";
    session.onItemDropped(dragged.item_id, containerId);
    return true;
  }

  function handleDropPlacement(
    session: GameSession & InteractiveSession,
    _slots: readonly Slot[],
    dragged: DragItemInfo,
    _targetIdx: number
  ): void {
    if (handlePlacementByContainer(session, dragged)) {
      engine?.audio.playSnapSound();
      engine?.audio.playPopCelebrateSound();
      return;
    }
    if (typeof session.onItemLocked === "function") {
      session.onItemLocked(dragged.item_id);
      engine?.audio.playTapSound();
    }
  }

  function tryOtherAction(
    session: GameSession & InteractiveSession,
    hitIdx: number
  ): void {
    if (typeof session.flipCard === "function") {
      session.flipCard(hitIdx);
    } else if (typeof session.tapObject === "function") {
      const objs = session.content?.objects;
      const obj = objs?.[hitIdx];
      if (obj?.object_id) {
        session.tapObject(obj.object_id);
      }
    }
  }

  function dispatchSlotAction(
    session: GameSession & InteractiveSession,
    hitIdx: number
  ): void {
    tryOtherAction(session, hitIdx);
  }

  function settleRoundIfWon(): void {
    if (isSettlingRound || !roundRunner?.isCurrentRoundWon()) {
      return;
    }
    isSettlingRound = true;

    const state = roundRunner.getState();
    const isFinalRound = state.currentRoundIndex >= state.roundsTotal - 1;

    if (isFinalRound) {
      engine?.audio.playLevelCelebrateSound();
    } else {
      engine?.audio.playPopCelebrateSound();
    }

    setTimeout(
      () => {
        isSettlingRound = false;
        if (roundRunner) {
          roundRunner.completeCurrentRound();
        }
      },
      isFinalRound ? 1100 : 850
    );
  }

  function handlePlacementTap(
    session: GameSession & InteractiveSession,
    slots: readonly Slot[],
    hitIdx: number
  ): void {
    const isSource = isSourceSlot(session, hitIdx, slots);
    if (isSource) {
      const item = getItemForSlot(session, hitIdx, slots);
      if (!item || isItemLocked(session, item.item_id)) {
        return;
      }
      if (selectedSourceIndex === hitIdx) {
        selectedSourceIndex = null;
        session.stageItem?.(null);
      } else {
        selectedSourceIndex = hitIdx;
        session.stageItem?.(item.item_id);
        engine?.audio.playTapSound();
      }
    } else if (selectedSourceIndex !== null) {
      const dragged = getItemForSlot(session, selectedSourceIndex, slots);
      if (dragged) {
        handleDropPlacement(
          session,
          slots,
          { item_id: dragged.item_id, slotIndex: selectedSourceIndex },
          hitIdx
        );
      }
      selectedSourceIndex = null;
      session.stageItem?.(null);
    }
  }

  function handleTapInteraction(
    session: GameSession & InteractiveSession,
    slots: readonly Slot[],
    hitIdx: number,
    x: number,
    y: number
  ): void {
    const templateCode = cachedPayload?.template_code;
    const inputConfig = templateCode
      ? getTemplateInput(templateCode)
      : undefined;
    if (inputConfig) {
      const lifecycleFamily =
        LIFECYCLE[inputConfig.family as keyof typeof LIFECYCLE];
      if (lifecycleFamily) {
        const gesture = lifecycleFamily.toGesture(x, y, performance.now());
        session.dispatch?.(gesture);
        return;
      }
    }

    if (hitIdx < 0) {
      selectedSourceIndex = null;
      session.stageItem?.(null);
      return;
    }

    if (typeof session.onItemDropped === "function") {
      handlePlacementTap(session, slots, hitIdx);
      return;
    }

    dispatchSlotAction(session, hitIdx);
  }

  function handlePointerDown(event: PointerEvent): void {
    if (!(engine?.activeSession && canvasRef.value)) {
      return;
    }
    const session = engine.activeSession as GameSession & InteractiveSession;
    const { x, y } = getLogicCoordinates(
      canvasRef.value,
      event.clientX,
      event.clientY
    );
    activePointerId = event.pointerId;
    pointerDownTime = performance.now();
    pointerDownX = x;
    pointerDownY = y;
    currentDragPos = { x, y };
    isMoved = false;

    try {
      canvasRef.value.setPointerCapture(event.pointerId);
    } catch {
      /* ignore pointer capture error on devices without capture support */
    }

    const slots = session.slots || engine.slots || [];
    const hitIdx = findHitSlot(slots, x, y);

    if (hitIdx >= 0) {
      const isSource = isSourceSlot(session, hitIdx, slots);
      if (isSource) {
        const item = getItemForSlot(session, hitIdx, slots);
        if (item && !isItemLocked(session, item.item_id)) {
          isDragging = true;
          draggedItem = {
            item_id: item.item_id,
            slotIndex: hitIdx,
            asset: item.asset,
            label: item.label,
            text: item.text,
          };
          engine?.audio.playTapSound();
        }
      }
    }
  }

  function handlePointerMove(event: PointerEvent): void {
    if (
      activePointerId !== event.pointerId ||
      !canvasRef.value ||
      !engine?.activeSession
    ) {
      return;
    }
    const session = engine.activeSession as GameSession & InteractiveSession;
    const { x, y } = getLogicCoordinates(
      canvasRef.value,
      event.clientX,
      event.clientY
    );
    currentDragPos = { x, y };

    if (!isMoved && Math.hypot(x - pointerDownX, y - pointerDownY) > 8) {
      isMoved = true;
    }

    if (isDragging && draggedItem) {
      const slots = session.slots || engine.slots || [];
      hoveredTargetIndex = findNearestTargetSlot(session, slots, x, y);
      if (session.hoveredContainer !== undefined) {
        session.hoveredContainer = hoveredTargetIndex !== null;
      }
    }
  }

  function tryDispatchDrop(
    session: GameSession & InteractiveSession,
    slots: readonly Slot[],
    dragged: DragItemInfo,
    x: number,
    y: number
  ): boolean {
    const templateCode = cachedPayload?.template_code;
    const inputConfig = templateCode
      ? getTemplateInput(templateCode)
      : undefined;
    if (!inputConfig) {
      return false;
    }
    const lifecycleFamily =
      LIFECYCLE[inputConfig.family as keyof typeof LIFECYCLE];
    if (!(lifecycleFamily && "toDropGesture" in lifecycleFamily)) {
      return false;
    }

    const originSlot = slots[dragged.slotIndex];
    const fromX = originSlot?.x ?? pointerDownX;
    const fromY = originSlot?.y ?? pointerDownY;
    const gesture = lifecycleFamily.toDropGesture(
      fromX,
      fromY,
      x,
      y,
      performance.now()
    );
    const result = session.dispatch?.(gesture);
    if (!result?.valid) {
      engine?.audio.playSoftFeedbackSound();
      if (originSlot) {
        returningItem = {
          item: dragged,
          startX: x,
          startY: y,
          targetX: originSlot.x,
          targetY: originSlot.y,
          startTime: performance.now(),
          duration: 240,
        };
        engine?.audio.playWhooshSound();
      }
    }
    return true;
  }

  function handleDragDropRelease(
    session: GameSession & InteractiveSession,
    slots: readonly Slot[],
    dragged: DragItemInfo,
    x: number,
    y: number
  ): void {
    if (tryDispatchDrop(session, slots, dragged, x, y)) {
      return;
    }

    const targetIdx = findNearestTargetSlot(session, slots, x, y);
    if (targetIdx !== null) {
      handleDropPlacement(session, slots, dragged, targetIdx);
      return;
    }
    if (
      typeof session.onItemLocked === "function" &&
      Math.hypot(x - pointerDownX, y - pointerDownY) > 40
    ) {
      session.onItemLocked(dragged.item_id);
      return;
    }
    engine?.audio.playSoftFeedbackSound();
    const originSlot = slots[dragged.slotIndex];
    if (originSlot) {
      returningItem = {
        item: dragged,
        startX: x,
        startY: y,
        targetX: originSlot.x,
        targetY: originSlot.y,
        startTime: performance.now(),
        duration: 240,
      };
      engine?.audio.playWhooshSound();
    }
  }

  function handlePointerUp(event: PointerEvent): void {
    if (
      activePointerId !== event.pointerId ||
      !canvasRef.value ||
      !engine?.activeSession
    ) {
      return;
    }
    const session = engine.activeSession as GameSession & InteractiveSession;
    const { x, y } = getLogicCoordinates(
      canvasRef.value,
      event.clientX,
      event.clientY
    );

    try {
      canvasRef.value.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore pointer capture release error */
    }

    const timeHeld = performance.now() - pointerDownTime;
    const distance = Math.hypot(x - pointerDownX, y - pointerDownY);
    const slots = session.slots || engine.slots || [];
    const hitIdx = findHitSlot(slots, x, y);

    if (timeHeld < 350 && distance < 20) {
      handleTapInteraction(session, slots, hitIdx, x, y);
    } else if (isDragging && draggedItem) {
      handleDragDropRelease(session, slots, draggedItem, x, y);
    }

    isDragging = false;
    draggedItem = null;
    activePointerId = null;
    hoveredTargetIndex = null;
    if (session.hoveredContainer !== undefined) {
      session.hoveredContainer = false;
    }
    settleRoundIfWon();
  }

  function handlePointerCancel(event: PointerEvent): void {
    if (activePointerId === event.pointerId) {
      isDragging = false;
      draggedItem = null;
      activePointerId = null;
      hoveredTargetIndex = null;
    }
  }

  function renderDragAvatar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    item: DragItemInfo,
    scale = 1.15
  ): void {
    const baseRadius = 48;
    const radius = baseRadius * scale;

    ctx.save();
    // 1. Deep floating 3D drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(130, 118, 96, 0.38)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. 3D Bottom Slab
    ctx.save();
    ctx.fillStyle = "#d4c5ab";
    ctx.beginPath();
    ctx.arc(x, y + 4, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Main Avatar Body
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffbf00"; // Honey amber border
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Specular highlight
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y - 6, radius * 0.7, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();

    // Content: Emoji or Text
    if (item.asset?.kind === "emoji" && item.asset.ref) {
      ctx.font = `${Math.round(52 * scale)}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.asset.ref, x, y);
    } else if (item.text || item.label) {
      ctx.font = `bold ${Math.round(28 * scale)}px "Fredoka", "Quicksand", sans-serif`;
      ctx.fillStyle = "#1b1c1a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.text || item.label || "", x, y);
    } else {
      ctx.font = `${Math.round(48 * scale)}px "Noto Color Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⭐", x, y);
    }
    ctx.restore();
  }

  function renderHoverAura(ctx: CanvasRenderingContext2D, nowMs: number): void {
    if (!isDragging || hoveredTargetIndex === null) {
      return;
    }
    const slots =
      (engine?.activeSession as { slots?: readonly Slot[] })?.slots ||
      engine?.slots ||
      [];
    const targetSlot = slots[hoveredTargetIndex];
    if (targetSlot) {
      const auraR = Math.max(targetSlot.w, targetSlot.h) / 2 + 16;
      drawTargetHoverAura(
        ctx,
        targetSlot.x,
        targetSlot.y,
        auraR,
        (nowMs % 1000) / 1000
      );
    }
  }

  function renderReturningAnimation(
    ctx: CanvasRenderingContext2D,
    nowMs: number
  ): void {
    if (!returningItem) {
      return;
    }
    const progress = Math.min(
      1,
      (nowMs - returningItem.startTime) / returningItem.duration
    );
    const easeProgress = 1 - (1 - progress) ** 3;
    const curX =
      returningItem.startX +
      (returningItem.targetX - returningItem.startX) * easeProgress;
    const curY =
      returningItem.startY +
      (returningItem.targetY - returningItem.startY) * easeProgress;
    ctx.save();
    renderDragAvatar(
      ctx,
      curX,
      curY,
      returningItem.item,
      1 + (1 - progress) * 0.15
    );
    ctx.restore();
    if (progress >= 1) {
      returningItem = null;
    }
  }

  function startRounds(
    payload: ConfigPayload,
    rounds: RoundPayload[],
    engineConfig: EngineConfig
  ) {
    totalRounds.value = rounds.length;
    currentRound.value = 0;
    earnedStars.value = null;

    const roundConfigs: RoundConfig[] = rounds.map((r) => ({
      round_index: r.round_index,
      instruction: r.instruction,
      instruction_audio_path: r.instruction_audio_path,
      content_pack: r.content_pack,
      difficulty_params: r.difficulty_params,
    }));

    roundRunner = new RoundRunner({
      rounds: roundConfigs,
      ageBand: engineConfig.age_band,
      sessionFactory: (contentPack, difficultyParams, seed) => {
        const roundCfg: EngineConfig = {
          ...engineConfig,
          content_pack: contentPack,
          difficulty_params: difficultyParams,
          layout_seed: seed,
        };
        return createGameSessionSync(payload.template_code, roundCfg);
      },
      onRoundStarted: (roundIndex) => {
        currentRound.value = roundIndex;
        currentInstructionAudio =
          rounds[roundIndex]?.instruction_audio_path || null;
        const session = roundRunner?.getCurrentSession();
        if (session && engine) {
          engine.activeSession = session;
          engine.audio.playStartSound();
        }
        const currentRoundCfg = rounds[roundIndex];
        const prompt =
          (currentRoundCfg?.content_pack as { prompt?: string })?.prompt ||
          currentRoundCfg?.instruction ||
          cachedPayload?.title;
        setTimeout(() => {
          playInstructionNarration(prompt);
        }, 350);
      },
      onRoundCompleted: (_roundIndex, _wasSkipped) => {
        engine?.scaffolding?.resetOnSuccess();
      },
      onAllRoundsCompleted: () => {
        engine?.audio.playLevelCelebrateSound();
        setTimeout(() => {
          finishSession().catch((err) => {
            console.error("[play] finishSession thất bại:", err);
            showVictoryModal.value = true;
          });
        }, 500);
      },
    });

    const factory = (cfg: EngineConfig) => {
      roundRunner?.startFirstRound();
      const session = roundRunner?.getCurrentSession();
      if (!session) {
        return createGameSessionSync(payload.template_code, cfg);
      }
      return session;
    };

    if (canvasRef.value) {
      if (engine) {
        engine.destroy();
        engine = null;
      }
      engine = new GameEngine();
      engine.onAfterRender = (ctx, _rs, nowMs) => {
        renderHoverAura(ctx, nowMs);

        if (isDragging && draggedItem) {
          ctx.save();
          renderDragAvatar(
            ctx,
            currentDragPos.x,
            currentDragPos.y,
            draggedItem,
            1.15
          );
          ctx.restore();
        }

        renderReturningAnimation(ctx, nowMs);
      };
      engine.load(engineConfig, factory);
      engine.start(canvasRef.value);
    }
  }

  function handleApiError(
    status: number,
    message?: string,
    statusMessage?: string,
    details?: Record<string, unknown>
  ): Error {
    errorActionLink.value = null;
    errorActionText.value = "Thử lại";

    if (status === 410) {
      errorTitle.value = "Trò chơi đã ngừng phát hành";
      errorEmoji.value = "📦";
      errorActionLink.value = "/games";
      errorActionText.value = "Xem danh sách trò chơi";
      return new Error(
        "Nội dung bài học này đã hoàn thành chu kỳ sử dụng hoặc được thay thế."
      );
    }

    if (status === 401) {
      errorTitle.value = "Yêu cầu đăng nhập";
      errorEmoji.value = "🔒";
      errorActionLink.value = `/login?redirect=/play/${levelCode}`;
      errorActionText.value = "Đăng nhập để chơi";
      return new Error(
        "Trò chơi này yêu cầu đăng nhập tài khoản để bé có thể tham gia và lưu tiến độ."
      );
    }

    if (status === 403) {
      if (!loggedIn.value) {
        errorTitle.value = "Yêu cầu đăng nhập";
        errorEmoji.value = "🔒";
        errorActionLink.value = `/login?redirect=/play/${levelCode}`;
        errorActionText.value = "Đăng nhập để chơi";
        return new Error(
          "Trò chơi này yêu cầu đăng nhập tài khoản để bé có thể tham gia và lưu tiến độ."
        );
      }

      errorTitle.value = "Cần nâng cấp gói học";
      errorEmoji.value = "⭐";
      errorActionLink.value = "/pricing";
      errorActionText.value = "Xem các gói học";
      return new Error(
        "Trò chơi này thuộc gói nâng cấp. Phụ huynh vui lòng mở khoá gói học để bé tiếp tục trải nghiệm."
      );
    }

    if (status === 428) {
      if (
        statusMessage === "INTRO_REQUIRED" ||
        details?.intro_level_code ||
        details?.intro_queue
      ) {
        const queue = details?.intro_queue as
          | Array<{ intro_level_code: string }>
          | undefined;
        const introCode = String(
          details?.intro_level_code ?? queue?.[0]?.intro_level_code ?? ""
        );
        errorTitle.value = "Làm quen khái niệm trước";
        errorEmoji.value = "📖";
        errorActionLink.value = introCode
          ? `/play/${introCode}?return_to=${levelCode}`
          : "/games";
        errorActionText.value = "Bắt đầu bài làm quen";
        return new Error(
          "Bé hãy hoàn thành bài làm quen ngắn để hiểu khái niệm trước khi bước vào màn chơi nhé!"
        );
      }

      errorTitle.value = "Chưa chọn hồ sơ bé";
      errorEmoji.value = "👶";
      errorActionLink.value = `/me/children?redirect=/play/${levelCode}`;
      errorActionText.value = "Chọn hồ sơ bé";
      return new Error(
        "Vui lòng chọn hoặc tạo hồ sơ của bé trước khi bắt đầu bài học."
      );
    }

    if (status === 404) {
      errorTitle.value = "Không tìm thấy trò chơi";
      errorEmoji.value = "🔍";
      errorActionLink.value = "/games";
      errorActionText.value = "Xem danh sách trò chơi";
      return new Error(
        "Trò chơi không tồn tại hoặc chưa được phát hành công khai."
      );
    }

    errorTitle.value = "Lỗi tải trò chơi";
    errorEmoji.value = "⚠️";
    return new Error(message || `Lỗi tải cấu hình trò chơi (${status})`);
  }

  function buildEngineConfig(
    payload: ConfigPayload,
    firstRound?: RoundPayload
  ): EngineConfig {
    return {
      level_code: payload.code || payload.level_code || levelCode,
      content_version: payload.content_version ?? 1,
      template_code: payload.template_code,
      content_pack: (firstRound?.content_pack ??
        payload.content_pack) as EngineConfig["content_pack"],
      difficulty_params: (firstRound?.difficulty_params ??
        payload.difficulty_params) as EngineConfig["difficulty_params"],
      theme_id: payload.theme_id,
      age_band: payload.age_band || "3-4",
      reduced_motion: payload.flags?.reduced_motion ?? false,
      audio_enabled: payload.flags?.audio_enabled ?? true,
    };
  }

  async function fetchAndStartGame() {
    if (!loggedIn.value) {
      await fetchSession().catch(() => {
        // session not established yet
      });
    }

    const endpoint = loggedIn.value
      ? `/api/users/levels/${levelCode}/config`
      : `/api/guest/levels/${levelCode}/config`;

    const res = await fetch(endpoint, { credentials: "include" });
    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as {
        statusMessage?: string;
        message?: string;
        data?: {
          code?: string;
          message?: string;
          details?: Record<string, unknown>;
        };
      };
      throw handleApiError(
        res.status,
        errJson.message ?? errJson.data?.message,
        errJson.statusMessage ?? errJson.data?.code,
        errJson.data?.details
      );
    }

    const payload: ConfigPayload = await res.json();
    cachedPayload = payload;
    displayTitle.value =
      payload.title || payload.name || `Bài học: ${levelCode}`;

    if (payload.assets && Array.isArray(payload.assets)) {
      await preloadAssets(payload.assets);
    }

    isLoading.value = false;
    await nextTick();

    const rounds = payload.rounds ?? [];
    if (rounds.length === 0) {
      // Delivery bảo đảm set Cấm — NEVER rỗng (WP167.1). Rỗng ở đây nghĩa là
      // payload không đúng hợp đồng, và im lặng dựng vòng ở client sẽ che đúng
      // cái lỗi cần thấy.
      throw new Error(
        "Cấu hình trò chơi thiếu danh sách câu hỏi. Bé thử lại sau nhé!"
      );
    }
    startRounds(payload, rounds, buildEngineConfig(payload, rounds[0]));
  }

  function handleResize() {
    if (engine && canvasRef.value) {
      engine.renderSystem.setupCanvas(canvasRef.value);
    }
  }

  onMounted(async () => {
    window.addEventListener("resize", handleResize);
    try {
      isLoading.value = true;
      errorMessage.value = null;
      await fetchAndStartGame();
    } catch (err) {
      isLoading.value = false;
      errorMessage.value =
        err instanceof Error ? err.message : "Lỗi tải cấu hình game";
    }
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
    if (roundRunner) {
      roundRunner.destroy();
      roundRunner = null;
    }
    if (engine) {
      engine.destroy();
      engine = null;
    }
  });
</script>

<style scoped>
  .game-play-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fbf9f5;
    position: relative;
    overflow: hidden;
    user-select: none;
  }

  .game-viewport {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  /* TOP HUD BAR */
  .top-hud-bar {
    position: relative;
    z-index: 20;
    width: 100%;
    height: 5.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem 0 2rem;
  }

  .lesson-info-pill {
    display: flex;
    align-items: center;
    background-color: #f5f3ef;
    border-radius: 9999px;
    padding: 0.35rem 1.25rem 0.35rem 0.5rem;
    border: 2px solid #d4c5ab;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  }

  .avatar-circle {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    background-color: #ffbf00;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.75rem;
    border: 2px solid white;
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.5);
  }

  .avatar-emoji {
    font-size: 1.5rem;
    line-height: 1;
  }

  .lesson-title-text {
    font-family: var(--font-heading, "Fredoka", "Quicksand", sans-serif);
    font-size: 1.15rem;
    font-weight: 700;
    color: #504532;
  }

  .progress-container {
    display: flex;
    align-items: center;
  }

  .hud-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .btn-audio-replay {
    background-color: #ffbf00;
    color: #1b1c1a;
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 1.05rem;
    font-weight: 700;
    padding: 0.6rem 1.25rem;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    border: none;
    transition: all 0.15s ease;
  }

  .btn-parent-lock {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: #eae8e4;
    border: 2px solid #d4c5ab;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .btn-parent-lock:hover {
    background-color: #e4e2de;
  }

  .lock-icon {
    font-size: 1.25rem;
  }

  .clay-button {
    box-shadow:
      inset -2px -2px 4px rgba(0, 0, 0, 0.1),
      inset 2px 2px 4px rgba(255, 255, 255, 0.8),
      0 4px 0 #d4c5ab;
  }

  .clay-button:active {
    transform: translateY(3px);
    box-shadow:
      inset -1px -1px 2px rgba(0, 0, 0, 0.1),
      inset 1px 1px 2px rgba(255, 255, 255, 0.8),
      0 1px 0 #d4c5ab;
  }

  /* MAIN ARENA */
  .main-arena {
    position: relative;
    z-index: 10;
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 2rem 1.5rem 2rem;
  }

  .wooden-tray-container {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 1200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .game-canvas {
    /* `height` phải là `auto`: khai cả `width:100%` lẫn `height:100%` thì
       `aspect-ratio` bị vô hiệu, hộp canvas giãn theo container và lệch khỏi
       tỉ lệ mà engine vẽ. */
    width: 100%;
    height: auto;
    max-height: 85vh;
    aspect-ratio: 16 / 9;
    object-fit: contain;
    touch-action: none;
    border-radius: 2rem;
    box-shadow: 0 12px 32px rgba(130, 118, 96, 0.15);
  }

  /* Loading & Error States */
  .loading-state,
  .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    width: 100%;
    max-width: 32rem;
  }

  .loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    background-color: white;
    padding: 2.5rem 2rem;
    border-radius: 1.5rem;
    border: 3px solid #d4c5ab;
    box-shadow: 0 8px 16px rgba(130, 118, 96, 0.08);
    text-align: center;
  }

  .loading-emoji {
    font-size: 3.5rem;
    line-height: 1;
  }

  .loading-text {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 1.25rem;
    font-weight: 700;
    color: #504532;
    margin: 0;
  }

  .error-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
    padding: 2.5rem 2rem;
    border-radius: 1.5rem;
    border: 3px solid #d4c5ab;
    box-shadow: 0 8px 0 #d4c5ab;
    text-align: center;
    width: 100%;
  }

  .error-emoji {
    font-size: 3.5rem;
    margin-bottom: 0.75rem;
    line-height: 1;
  }

  .error-title {
    font-family: var(--font-heading, "Fredoka", system-ui, sans-serif);
    font-size: 1.5rem;
    font-weight: 700;
    color: #1b1c1a;
    margin: 0 0 0.5rem 0;
  }

  .error-desc {
    font-size: 1rem;
    line-height: 1.5;
    color: #504532;
    margin: 0 0 1.75rem 0;
  }

  .error-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .btn-primary,
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 52px;
    padding: 0.75rem 1.5rem;
    border-radius: 1rem;
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .btn-primary {
    background-color: #f97316;
    color: white;
    border: 2px solid transparent;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.15);
  }

  .btn-primary:hover {
    background-color: #ea580c;
  }

  .btn-primary:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
  }

  .btn-secondary {
    background-color: #f5f3ef;
    color: #504532;
    border: 2px solid #d4c5ab;
  }

  .btn-secondary:hover {
    background-color: #eae8e4;
  }

  .btn-secondary:active {
    transform: translateY(2px);
  }
</style>
