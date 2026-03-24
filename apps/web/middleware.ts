import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/auth-config";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/bots(.*)",
  "/rules(.*)",
  "/runs(.*)",
  "/api/bots(.*)",
  "/api/rules(.*)",
  "/api/runs(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isClerkConfigured()) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  if (userId && req.nextUrl.pathname.startsWith("/sign-in")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
  authorizedParties: ["https://telegram-bot-builder.up.railway.app"],
};
