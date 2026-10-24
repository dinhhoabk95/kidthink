import {
  createInMemoryBufferStorage,
  type RoundRunner,
  type RoundRunnerState,
  type TelemetryEvent,
} from "@mindkid/game-engine";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = vi.fn();

vi.mock("~/composables/use-api", () => ({
  useApi: () => mockApi,
}));

import { collectSessionAssets } from "~/composables/play/use-play-session";
import {
  recordParentGateTelemetry,
  setActiveRoundRunner,
  usePlayTelemetry,
} from "~/composables/play/use-play-telemetry";

function createFakeRoundRunner(events: TelemetryEvent[] = []): RoundRunner {
  const fakeState: RoundRunnerState = {
    ageBand: "3-4",
    currentRoundIndex: 0,
    hintCountTotal: 1,
    isCompleted: true,
    roundsCompleted: 3,
    roundsSkipped: 0,
    roundsTotal: 3,
  };

  const fakeRunner = {
    getState: (): RoundRunnerState => fakeState,
    getAllTelemetry: (): TelemetryEvent[] => events,
    recordExternalEvent: (event: TelemetryEvent): void => {
      events.push(event);
    },
  };

  return fakeRunner as RoundRunner;
}

describe("usePlayTelemetry & offline play (BR-OFF-01, BR-OFF-02, BR-OFF-03, BR-OFF-06)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("thành công: finishSession trả ok: true và dữ liệu từ API", async () => {
    mockApi.mockResolvedValueOnce({
      rounds_correct: 3,
      rounds_total: 3,
      celebration: "great",
      stars: 3,
    });

    const { finishSession } = usePlayTelemetry({
      storage: createInMemoryBufferStorage(),
    });
    const runner = createFakeRoundRunner();
    const result = await finishSession("session-123", runner, true);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.celebration).toBe("great");
      expect(result.data.stars).toBe(3);
    }
  });

  it("ca âm: mock useApi ném 403 → finishSession trả ok: false, console.error gọi đúng 1 lần, không ném ra ngoài", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      /* noop */
    });
    const forbiddenError = new Error("403 CSRF token invalid");
    Object.assign(forbiddenError, { status: 403 });

    mockApi.mockRejectedValueOnce(forbiddenError);

    const { finishSession } = usePlayTelemetry({
      storage: createInMemoryBufferStorage(),
    });
    const runner = createFakeRoundRunner();

    let didThrow = false;
    let result = { ok: true, data: {} } as Awaited<
      ReturnType<typeof finishSession>
    >;

    try {
      result = await finishSession("session-403", runner, false);
    } catch {
      didThrow = true;
    }

    expect(didThrow).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("403");
    }
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0]?.[0]).toContain("session-403");
    expect(errorSpy.mock.calls[0]?.[0]).toContain(
      "/api/guest/play-sessions/session-403/complete"
    );
  });

  it("BR-OFF-01, BR-OFF-03: khi uploadTelemetry lỗi mạng ở vòng 1, sự kiện vẫn nằm trong OfflineEventBuffer và được gửi bù đúng thứ tự seq ở vòng 2", async () => {
    const storage = createInMemoryBufferStorage();
    const baseTime = 1_700_000_000_000;
    const roundEvents: TelemetryEvent[] = [
      {
        event_name: "round_started",
        timestamp_ms: baseTime + 100,
        data: { round_index: 0 },
      },
      {
        event_name: "round_completed",
        timestamp_ms: baseTime + 1200,
        data: { round_index: 0 },
      },
    ];

    const runner = createFakeRoundRunner(roundEvents);
    const { uploadTelemetry, getOfflineBuffer, destroyTelemetrySession } =
      usePlayTelemetry({ storage });

    // Vòng 1: mất mạng -> API reject
    mockApi.mockRejectedValueOnce(new Error("Network offline"));
    await uploadTelemetry(
      "session-offline-1",
      runner,
      true,
      new Date(baseTime).toISOString()
    );

    // Không mất sự kiện: vẫn còn 2 sự kiện trong buffer và trong storage bền
    expect(getOfflineBuffer().getPendingEvents()).toHaveLength(2);
    expect(await storage.load("session-offline-1")).toHaveLength(2);

    // Vòng 2: có thêm sự kiện mới và mạng có lại
    roundEvents.push({
      event_name: "round_completed",
      timestamp_ms: baseTime + 2500,
      data: { round_index: 1 },
    });
    mockApi.mockResolvedValueOnce({ accepted: 3, skipped: 0 });

    await uploadTelemetry(
      "session-offline-1",
      runner,
      true,
      new Date(baseTime).toISOString()
    );

    expect(mockApi).toHaveBeenCalledTimes(2);
    const secondCallArgs = mockApi.mock.calls[1];
    expect(secondCallArgs?.[0]).toBe(
      "/api/users/play-sessions/session-offline-1/events"
    );
    const body = (
      secondCallArgs?.[1] as {
        body?: { events?: Array<{ seq: number; event_name: string }> };
      }
    )?.body;
    expect(body?.events?.map((e) => e.seq)).toEqual([1, 2, 3]);
    expect(getOfflineBuffer().getPendingEvents()).toHaveLength(0);
    expect(await storage.load("session-offline-1")).toHaveLength(0);
    destroyTelemetrySession();
  });

  it("BR-OFF-06: Guest chỉ buffer trong phiên đang mở, không lưu bền sang storage và xoá sạch khi destroyTelemetrySession", async () => {
    const storage = createInMemoryBufferStorage();
    const baseTime = 1_700_000_000_000;
    const runner = createFakeRoundRunner([
      {
        event_name: "round_started",
        timestamp_ms: baseTime + 100,
        data: { round_index: 0 },
      },
    ]);

    const { uploadTelemetry, getOfflineBuffer, destroyTelemetrySession } =
      usePlayTelemetry({ storage });

    mockApi.mockRejectedValueOnce(new Error("Network offline"));
    await uploadTelemetry(
      "guest-session-offline",
      runner,
      false,
      new Date(baseTime).toISOString()
    );

    expect(getOfflineBuffer().getPendingEvents()).toHaveLength(1);
    expect(await storage.load("guest-session-offline")).toHaveLength(0);

    destroyTelemetrySession();
    expect(getOfflineBuffer().getPendingEvents()).toHaveLength(0);
  });

  it("BR-OFF-02: collectSessionAssets gom đủ assets chung và instruction_audio_path của tất cả các vòng trước khi vào Vòng 1", () => {
    const assets = collectSessionAssets({
      level_code: "GL-C1-CNT-01",
      code: "GL-C1-CNT-01",
      template_code: "GT-001",
      theme_id: "farm",
      assets: [
        { ref: "apple", kind: "image", url: "/assets/apple.webp" },
        { ref: "shared_audio", kind: "audio", url: "/audio/r0.mp3" },
      ],
      rounds: [
        {
          round_index: 0,
          instruction_audio_path: "/audio/r0.mp3",
          content_pack: {},
          difficulty_params: {},
        },
        {
          round_index: 1,
          instruction_audio_path: "/audio/r1.mp3",
          content_pack: {},
          difficulty_params: {},
        },
        {
          round_index: 2,
          instruction_audio_path: "/audio/r2.mp3",
          content_pack: {},
          difficulty_params: {},
        },
      ],
    });

    expect(assets.map((a) => a.url)).toEqual([
      "/assets/apple.webp",
      "/audio/r0.mp3",
      "/audio/r1.mp3",
      "/audio/r2.mp3",
    ]);
  });

  it("recordParentGateTelemetry giữa ván chơi đánh seq nối tiếp với roundRunner, không nhảy lên 10001 gây 409 EVENT_OUT_OF_ORDER", async () => {
    const storage = createInMemoryBufferStorage();
    const baseTime = 1_700_000_000_000;
    const roundEvents: TelemetryEvent[] = [
      {
        event_name: "round_started",
        timestamp_ms: baseTime + 100,
        data: { round_index: 0 },
      },
    ];
    const runner = createFakeRoundRunner(roundEvents);
    const {
      initTelemetrySession,
      uploadTelemetry,
      getOfflineBuffer,
      destroyTelemetrySession,
    } = usePlayTelemetry({ storage });

    initTelemetrySession({
      session_uuid: "session-pg-order",
      level_code: "GL-C1-CNT-01",
      content_version: 1,
      is_guest: false,
      started_at: baseTime,
    });
    setActiveRoundRunner(runner);

    recordParentGateTelemetry("parent_gate_shown", { trigger: "exit_game" });

    roundEvents.push({
      event_name: "round_completed",
      timestamp_ms: baseTime + 2000,
      data: { round_index: 0 },
    });

    mockApi.mockResolvedValueOnce({ accepted: 3, skipped: 0 });
    await uploadTelemetry(
      "session-pg-order",
      runner,
      true,
      new Date(baseTime).toISOString()
    );

    const callBody = (
      mockApi.mock.calls[0]?.[1] as {
        body?: { events?: Array<{ seq: number; event_name: string }> };
      }
    )?.body;
    expect(callBody?.events?.map((e) => [e.seq, e.event_name])).toEqual([
      [1, "round_started"],
      [2, "parent_gate_shown"],
      [3, "round_completed"],
    ]);
    expect(getOfflineBuffer().getPendingEvents()).toHaveLength(0);
    destroyTelemetrySession();
  });
});
