import type { Metadata } from "next";
import { Outfit, Sora } from "next/font/google";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Nav } from "@/components/Nav";
import { isClerkConfigured } from "@/lib/auth-config";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Telegraph | Telegram automation workspace",
  description:
    "Build and run Telegram automations with a visual builder studio, bot controls, and execution history.",
  openGraph: {
    title: "Telegraph",
    description:
      "Telegram automation workspace for teams shipping event-driven workflows.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Telegraph",
    description: "Build and run Telegram automations with a visual builder.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk = isClerkConfigured();
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
    <html lang="en">
      <body className={`${outfit.variable} ${sora.variable}`}>
        {hasClerk && publishableKey ? (
          <ClerkProvider publishableKey={publishableKey}>{appShell}</ClerkProvider>
        ) : (
          appShell
        )}
      </body>
    </html>
  );
}
