import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Nav } from "@/components/Nav";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Telegraph | Telegram bot automation workspace",
  description:
    "Build and run Telegram automations with a visual workflow builder, bot controls, and execution history.",
  applicationName: "Telegraph",
  alternates: {
    canonical: toAbsoluteUrl("/"),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Telegraph | Telegram bot automation workspace",
    description:
      "Telegram automation workspace for teams shipping event-driven workflows.",
    type: "website",
    url: toAbsoluteUrl("/"),
    siteName: "Telegraph",
  },
  twitter: {
    card: "summary_large_image",
    title: "Telegraph | Telegram bot automation workspace",
    description: "Build and run Telegram automations with a visual workflow builder.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;
  const appShell = (
    <>
      <a className="skip-link focus-ring" href="#main-content">
        Skip to content
      </a>
      <div className="app-shell">
        <Nav />
        <main id="main-content">{children}</main>
        <footer className="mt-12 border-t border-border/70 pt-5 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>Telegraph automation workspace</p>
            <div className="flex items-center gap-4">
              <Link className="focus-ring" href="/blog">
                Blog
              </Link>
              <Link className="focus-ring" href="/privacy">
                Privacy policy
              </Link>
              <Link className="focus-ring" href="/terms">
                Terms of service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );

  return (
    <html lang="en" className="font-sans">
      <body>
        <ClerkProvider appearance={clerkAppearance} publishableKey={publishableKey}>
          {appShell}
        </ClerkProvider>
      </body>
    </html>
  );
}
