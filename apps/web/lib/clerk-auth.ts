import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { auth, currentUser } from "@clerk/nextjs/server";

function isClerkMiddlewareMissingError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("clerk") && message.includes("clerkmiddleware");
}

export function isRecoverableCurrentUserError(error: unknown): boolean {
  return (
    isClerkMiddlewareMissingError(error) ||
    isClerkAPIResponseError(error) ||
    (error instanceof Error && error.name === "ClerkAPIResponseError")
  );
}

export async function getAuthUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch (error) {
    if (isClerkMiddlewareMissingError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getCurrentUserOrNull() {
  try {
    return await currentUser();
  } catch (error) {
    if (isRecoverableCurrentUserError(error)) {
      return null;
    }
    throw error;
  }
}
