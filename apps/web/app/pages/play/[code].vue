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
            @pointerdown="handlePointerDown"
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
    type EngineConfig,
    GameEngine,
    type GameSession,
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

  interface InteractiveSession {
    slots?: readonly Slot[];
    content?: {
      options?: Array<{ value: number; item_id?: string }>;
      items?: Array<{ item_id: string }>;
      objects?: Array<{ object_id: string }>;
    };
    displayOptions?: Array<{ item_id: string }>;
    displayItems?: Array<{ item_id: string }>;
    getOptions?: () => Array<{ value: number; item_id?: string }>;
    selectValue?: (val: number) => boolean;
    onItemLocked?: (id: string) => void;
    toggleItemSelection?: (id: string) => void;
    flipCard?: (idx: number) => void;
    tapObject?: (id: string) => void;
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

  function replayInstructionAudio() {
    if (currentInstructionAudio) {
      const aud = new Audio(currentInstructionAudio);
      aud.play().catch(() => {
        // audio playback might require user gesture
      });
    }
  }

  function handleContinueNext() {
    showVictoryModal.value = false;
    router.push("/games");
  }

  function handleReplayGame() {
    showVictoryModal.value = false;
    if (cachedPayload) {
      const rounds = cachedPayload.rounds ?? [];
      if (rounds.length === 0) {
        return;
      }
      // Chơi lại là một **phiên mới** từ vòng 0 (BR-RSP-07).
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

  function getLogicCoordinates(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / 960;
    const scaleY = rect.height / 540;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (rect.width - 960 * scale) / 2;
    const offsetY = (rect.height - 540 * scale) / 2;
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
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

  function trySelectValue(
    session: GameSession & InteractiveSession,
    hitIdx: number
  ): boolean {
    if (typeof session.selectValue !== "function") {
      return false;
    }
    const options = session.getOptions
      ? session.getOptions()
      : session.content?.options;
    const opt = options?.[hitIdx];
    if (opt !== undefined && typeof opt.value === "number") {
      session.selectValue(opt.value);
    }
    return true;
  }

  function tryItemAction(
    session: GameSession & InteractiveSession,
    hitIdx: number
  ): boolean {
    if (typeof session.onItemLocked === "function") {
      const opts = session.displayOptions || session.content?.options;
      const opt = opts?.[hitIdx];
      if (opt?.item_id) {
        session.onItemLocked(opt.item_id);
      }
      return true;
    }
    if (typeof session.toggleItemSelection === "function") {
      const items = session.displayItems || session.content?.items;
      const item = items?.[hitIdx];
      if (item?.item_id) {
        session.toggleItemSelection(item.item_id);
      }
      return true;
    }
    return false;
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
    if (trySelectValue(session, hitIdx) || tryItemAction(session, hitIdx)) {
      return;
    }
    tryOtherAction(session, hitIdx);
  }

  /**
   * Chốt vòng hiện tại nếu trẻ vừa thắng.
   *
   * Đây là mảnh còn thiếu làm cả vòng chơi hở: `roundRunner.completeCurrentRound()`
   * chưa từng được gọi ở bất kỳ đâu trong `apps/web`, nên con trỏ vòng không bao
   * giờ tiến, `onAllRoundsCompleted` không bao giờ chạy, và
   * `showVictoryModal` — chỉ được đặt `true` ở đúng một chỗ, trong callback đó —
   * không bao giờ hiện.
   *
   * Dò **sau hành động** chứ không dò mỗi frame vì đo được: cả 31 lời gọi
   * `winSession()` trong 27 template đều nằm trong một hàm hành động
   * (`selectOption`, `onTapCard`, `onSubmitSequence`, …), **không** cái nào nằm
   * trong `update()`. Nên sau mỗi hành động là tất định và đủ, còn dò mỗi frame
   * thì tốn một phép kiểm mỗi khung mà không bắt thêm được ca nào.
   */
  function settleRoundIfWon(): void {
    if (!roundRunner?.isCurrentRoundWon()) {
      return;
    }
    // `completeCurrentRound()` tự sang vòng kế, và `startRound()` gọi
    // `onRoundStarted` — chỗ đã gán `engine.activeSession`. Gán lại ở đây là dư.
    roundRunner.completeCurrentRound();
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
    const slots = session.slots || engine.slots || [];
    const hitIdx = findHitSlot(slots, x, y);
    if (hitIdx >= 0) {
      dispatchSlotAction(session, hitIdx);
      settleRoundIfWon();
    }
  }

  /**
   * Đường chạy **duy nhất** của mọi màn chơi — kể cả level một vòng.
   *
   * Trước Task #167 có hai đường: `startMultiRound` gác sau `rounds.length > 1`,
   * và `startSingleRound` cho phần còn lại. Vì `game_level_rounds` không có
   * writer nào trong repo, `rounds` luôn rỗng, nên **mọi** phiên đi
   * `startSingleRound` — hàm không kiểm điều kiện thắng, không bật modal ăn
   * mừng, không cập nhật chỉ báo tiến độ. Không trẻ nào kết thúc được màn chơi.
   *
   * `BR-RSM-09` đã tuyên set một vòng là hợp lệ và là mặc định, `BR-RSP-02` bắt
   * phát vòng cho **mọi** set. Hai đường mã cho một hợp đồng chính là chỗ nhánh
   * chết đó sinh ra, nên chỉ còn một đường.
   */
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
        }
      },
      onRoundCompleted: (_roundIndex, _wasSkipped) => {
        // Scaffolding leo theo từng vòng, không theo cả phiên (BR-RSP-08).
        // `hint_count` vẫn cộng dồn cả phiên — nó do server dựng lại từ chuỗi
        // event, không phải từ biến nào ở đây (BR-RSP-12).
        // `resetOnSuccess()` là tên thật của phép reset — `ScaffoldingSystem`
        // KHÔNG có `reset()`. Gọi `reset?.()` sẽ là một no-op im lặng.
        engine?.scaffolding?.resetOnSuccess();
      },
      onAllRoundsCompleted: () => {
        finishSession().catch((err) => {
          console.error("[play] finishSession thất bại:", err);
          showVictoryModal.value = true;
        });
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
      engine.load(engineConfig, factory);
      engine.start(canvasRef.value);
    }
  }

  function handleApiError(status: number, message?: string): Error {
    if (status === 401) {
      errorTitle.value = "Yêu cầu đăng nhập";
      errorEmoji.value = "🔒";
      errorActionLink.value = `/login?redirect=/play/${levelCode}`;
      errorActionText.value = "Đăng nhập để chơi";
      return new Error(
        "Trò chơi này yêu cầu đăng nhập tài khoản để bé có thể tham gia và lưu tiến độ."
      );
    }

    if (status === 410) {
      errorTitle.value = "Trò chơi đã ngừng phát hành";
      errorEmoji.value = "📦";
      errorActionLink.value = "/games";
      errorActionText.value = "Xem danh sách trò chơi";
      return new Error(
        "Nội dung bài học này đã hoàn thành chu kỳ sử dụng hoặc được thay thế."
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
      };
      throw handleApiError(res.status, errJson.message);
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
    width: 100%;
    height: 100%;
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
