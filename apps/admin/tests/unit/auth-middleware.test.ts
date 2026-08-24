import { beforeEach, describe, expect, it, vi } from "vitest";

interface RouteLocationMinimal {
  path: string;
}

type MiddlewareHandler = (
  to: RouteLocationMinimal,
  from: RouteLocationMinimal
) => Promise<unknown> | unknown;

// Mock #imports and use-admin-auth
const mockNavigateTo = vi.fn((to: string) => ({ redirectedTo: to }));
const mockFetchSession = vi.fn();
const mockLoggedIn = { value: false };

vi.mock("#imports", () => ({
  defineNuxtRouteMiddleware: (fn: MiddlewareHandler) => fn,
  navigateTo: (to: string) => mockNavigateTo(to),
}));

vi.mock("~/composables/use-admin-auth", () => ({
  useAdminAuth: () => ({
    loggedIn: mockLoggedIn,
    fetchSession: mockFetchSession,
  }),
}));

import authMiddleware from "~/middleware/auth.global";

const DUMMY_FROM: RouteLocationMinimal = { path: "/" };

describe("Admin SPA Global Auth Middleware (BR-ADA-01, Task #105)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoggedIn.value = false;
  });

  it("allows unauthenticated visitor to access /login without calling fetchSession", async () => {
    mockLoggedIn.value = false;
    const result = await (authMiddleware as unknown as MiddlewareHandler)(
      { path: "/login" },
      DUMMY_FROM
    );
    expect(result).toBeUndefined();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it("redirects authenticated manager visiting /login to /", async () => {
    mockLoggedIn.value = true;
    const result = await (authMiddleware as unknown as MiddlewareHandler)(
      { path: "/login" },
      DUMMY_FROM
    );
    expect(mockNavigateTo).toHaveBeenCalledWith("/");
    expect(result).toEqual({ redirectedTo: "/" });
  });

  it("redirects unauthenticated visitor accessing / to /login after failed session fetch", async () => {
    mockLoggedIn.value = false;
    mockFetchSession.mockResolvedValue(false);

    const result = await (authMiddleware as unknown as MiddlewareHandler)(
      { path: "/" },
      DUMMY_FROM
    );
    expect(mockFetchSession).toHaveBeenCalledTimes(1);
    expect(mockNavigateTo).toHaveBeenCalledWith("/login");
    expect(result).toEqual({ redirectedTo: "/login" });
  });

  it("allows unauthenticated visitor accessing / if session fetch succeeds", async () => {
    mockLoggedIn.value = false;
    mockFetchSession.mockImplementation(() => {
      mockLoggedIn.value = true;
      return true;
    });

    const result = await (authMiddleware as unknown as MiddlewareHandler)(
      { path: "/" },
      DUMMY_FROM
    );
    expect(mockFetchSession).toHaveBeenCalledTimes(1);
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("allows already authenticated manager accessing protected route without calling fetchSession", async () => {
    mockLoggedIn.value = true;

    const result = await (authMiddleware as unknown as MiddlewareHandler)(
      { path: "/taxonomy" },
      DUMMY_FROM
    );
    expect(mockFetchSession).not.toHaveBeenCalled();
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
