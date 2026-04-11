import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/orgs(.*)",
  "/bots(.*)",
  "/flows(.*)",
  "/library(.*)",
  "/builder(.*)",
  "/templates(.*)",
  "/runs(.*)",
  "/api/bots(.*)",
  "/api/flows(.*)",
  "/api/builder(.*)",
  "/api/templates(.*)",
  "/api/runs(.*)",
  "/api/media(.*)",
]);

const isOrgRequiredRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/bots(.*)",
  "/flows(.*)",
  "/library(.*)",
  "/builder(.*)",
  "/templates(.*)",
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
    const isPublicTemplateRoute = req.nextUrl.pathname.startsWith("/templates/public");
    const isPublicTemplateApiRoute = req.nextUrl.pathname.startsWith("/api/templates/public");

    if (
      userId &&
      (req.nextUrl.pathname.startsWith("/sign-in") ||
        req.nextUrl.pathname.startsWith("/sign-up"))
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isProtectedRoute(req) && !isPublicTemplateRoute && !isPublicTemplateApiRoute) {
      await auth.protect();
    }

    if (userId && isOrgRequiredRoute(req) && !isPublicTemplateRoute && !orgId) {
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
