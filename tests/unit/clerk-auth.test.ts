import { describe, expect, it } from "vitest";

import { isRecoverableCurrentUserError } from "@/lib/clerk-auth";

describe("isRecoverableCurrentUserError", () => {
  it("returns true for the Clerk middleware missing error", () => {
    expect(
      isRecoverableCurrentUserError(
        new Error("Clerk: ClerkMiddleware must run before currentUser()"),
      ),
    ).toBe(true);
  });

  it("returns true for Clerk API response errors", () => {
    const error = new Error("backend unavailable");
    error.name = "ClerkAPIResponseError";

    expect(isRecoverableCurrentUserError(error)).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isRecoverableCurrentUserError(new Error("boom"))).toBe(false);
  });
});
