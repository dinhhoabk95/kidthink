import type { RoundRunner } from "@mindkid/game-engine";
import { useApi } from "~/composables/use-api";

const MAX_EVENTS_PER_REQUEST = 50;

export interface SessionCompleteResponse {
  readonly rounds_correct?: number;
  readonly rounds_total?: number;
  readonly celebration?: "great" | "good" | "nice_try";
  readonly stars?: number;
}

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
      await api(
        `${playSessionApiBase(loggedIn)}/play-sessions/${sessionUuid}/events`,
        {
          method: "POST",
          body: { events: chunk },
        }
      );
    }
  }

  async function finishSession(
    sessionUuid: string,
    roundRunner: RoundRunner,
    loggedIn: boolean
  ): Promise<SessionCompleteResponse | null> {
    const state = roundRunner.getState();
    const payload = {
      rounds_completed: state.roundsCompleted,
      rounds_total: state.roundsTotal,
      rounds_skipped: state.roundsSkipped,
      hint_count: state.hintCountTotal,
    };

    try {
      const resp = await api<SessionCompleteResponse>(
        `${playSessionApiBase(loggedIn)}/play-sessions/${sessionUuid}/complete`,
        {
          method: "POST",
          body: payload,
        }
      );
      return resp;
    } catch {
      return null;
    }
  }

  return {
    uploadTelemetry,
    finishSession,
  };
}
