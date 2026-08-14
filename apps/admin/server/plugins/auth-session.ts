import { getBrowserSessionService } from "@kidthink/auth";
import { defineNitroPlugin } from "#imports";

interface SessionHooksObject {
  hook(
    name: "fetch",
    handler: (session: Record<string, unknown>) => Promise<void>
  ): void;
}

export default defineNitroPlugin(() => {
  const service = getBrowserSessionService();
  const globalObj = globalThis as unknown as {
    sessionHooks?: SessionHooksObject;
  };

  if (globalObj.sessionHooks) {
    globalObj.sessionHooks.hook(
      "fetch",
      async (session: Record<string, unknown>) => {
        const secure = session.secure as { session_token?: string } | undefined;
        const token = secure?.session_token;

        if (!token || typeof token !== "string") {
          session.manager = undefined;
          return;
        }

        try {
          const authCtx = await service.resolve("manager", token);
          if (authCtx?.manager) {
            session.manager = authCtx.manager;
          } else {
            session.manager = undefined;
          }
        } catch {
          session.manager = undefined;
        }
      }
    );
  }
});
