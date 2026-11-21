import { describe, expect, it } from "vitest";
import {
  createMindKidManagerAuthClient,
  createMindKidUserAuthClient,
} from "#src/client";

describe("Browser-Safe Better Auth Clients (@mindkid/auth/client, BR-AUT-40)", () => {
  it("constructs isolated user and manager auth clients with twoFactor and passkey actions", () => {
    const userClient = createMindKidUserAuthClient({
      baseURL: "http://localhost:3000/api/auth/users",
    });
    const managerClient = createMindKidManagerAuthClient({
      baseURL: "http://localhost:3000/api/auth/managers",
    });

    expect(typeof userClient.signIn.email).toBe("function");
    expect(typeof userClient.signIn.social).toBe("function");
    expect(typeof userClient.signIn.passkey).toBe("function");
    expect(typeof userClient.twoFactor.enable).toBe("function");
    expect(typeof userClient.passkey.addPasskey).toBe("function");

    expect(typeof managerClient.signIn.email).toBe("function");
    expect(typeof managerClient.signIn.passkey).toBe("function");
    expect(typeof managerClient.twoFactor.verifyTotp).toBe("function");
    expect(typeof managerClient.passkey.addPasskey).toBe("function");
  });
});
