import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/orgs(.*)",
  "/bots(.*)",
  "/flows(.*)",
  "/builder(.*)",
  "/runs(.*)",
  "/api/bots(.*)",
  "/api/flows(.*)",
  "/api/builder(.*)",
  "/api/runs(.*)",
]);

const isOrgRequiredRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/bots(.*)",
  "/flows(.*)",
  "/builder(.*)",
  "/runs(.*)",
]);

function getAuthorizedParties() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return undefined;
  }

  try {
    return [new URL(siteUrl).origin];
  } catch {
    return undefined;
  }
}

export default clerkMiddleware(
  async (auth, req) => {
    const { userId, orgId } = await auth();

    if (
      userId &&
      (req.nextUrl.pathname.startsWith("/sign-in") ||
        req.nextUrl.pathname.startsWith("/sign-up"))
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isProtectedRoute(req)) {
      await auth.protect();
    }

    if (userId && isOrgRequiredRoute(req) && !orgId) {
      return NextResponse.redirect(new URL("/orgs", req.url));
    }
  },
  {
    authorizedParties: getAuthorizedParties(),
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
