import type { RoundRunner } from "@mindkid/game-engine";
import { useApi } from "~/composables/use-api";

const MAX_EVENTS_PER_REQUEST = 50;

export type CelebrationTier = "great" | "good" | "nice_try";

export interface SessionCompleteResponse {
  readonly rounds_correct?: number;
  readonly rounds_total?: number;
  readonly celebration?: CelebrationTier;
  readonly stars?: number;
}

export type FinishSessionResult =
  | { readonly ok: true; readonly data: SessionCompleteResponse }
  | { readonly ok: false; readonly error: string };

export function usePlayTelemetry() {
  const api = useApi();

  function playSessionApiBase(loggedIn: boolean): string {
    return loggedIn ? "/api/users" : "/api/guest";
  }

  async function uploadTelemetry(
    sessionUuid: string,
    roundRunner: RoundRunner,
    loggedIn: boolean
  ): Promise<void> {
    const events = roundRunner.getAllTelemetry().map((e, index) => ({
      seq: index + 1,
      event_name: e.event_name,
      occurred_at_ms: e.timestamp_ms,
      payload: e.data,
    }));

    for (let from = 0; from < events.length; from += MAX_EVENTS_PER_REQUEST) {
      const chunk = events.slice(from, from + MAX_EVENTS_PER_REQUEST);
      const endpoint = `${playSessionApiBase(loggedIn)}/play-sessions/${sessionUuid}/events`;
      try {
        await api(endpoint, {
          method: "POST",
          body: { events: chunk },
        });
      } catch (err) {
        const status =
          typeof err === "object" && err !== null && "status" in err
            ? String(err.status)
            : "unknown_status";
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[play-telemetry] uploadTelemetry thất bại — session: ${sessionUuid}, endpoint: ${endpoint}, status: ${status}, error: ${message}`
        );
      }
    }
  }

  async function finishSession(
    sessionUuid: string,
    roundRunner: RoundRunner,
    loggedIn: boolean
  ): Promise<FinishSessionResult> {
    const state = roundRunner.getState();
    const payload = {
      rounds_completed: state.roundsCompleted,
      rounds_total: state.roundsTotal,
      rounds_skipped: state.roundsSkipped,
      hint_count: state.hintCountTotal,
    };

    const endpoint = `${playSessionApiBase(loggedIn)}/play-sessions/${sessionUuid}/complete`;
    try {
      const resp = await api<SessionCompleteResponse>(endpoint, {
        method: "POST",
        body: payload,
      });
      return { ok: true, data: resp };
    } catch (err) {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? String(err.status)
          : "unknown_status";
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[play-telemetry] finishSession thất bại — session: ${sessionUuid}, endpoint: ${endpoint}, status: ${status}, error: ${message}`
      );
      return { ok: false, error: message };
    }
  }

  return {
    uploadTelemetry,
    finishSession,
  };
}
