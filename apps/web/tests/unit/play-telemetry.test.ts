import type {
  RoundRunner,
  RoundRunnerState,
  TelemetryEvent,
} from "@mindkid/game-engine";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApi = vi.fn();

vi.mock("~/composables/use-api", () => ({
  useApi: () => mockApi,
}));

import { usePlayTelemetry } from "~/composables/play/use-play-telemetry";

function createFakeRoundRunner(): RoundRunner {
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
    getAllTelemetry: (): TelemetryEvent[] => [],
  };

  return fakeRunner as RoundRunner;
}

describe("usePlayTelemetry", () => {
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

    const { finishSession } = usePlayTelemetry();
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

    const { finishSession } = usePlayTelemetry();
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
});
