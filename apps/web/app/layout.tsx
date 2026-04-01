import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Oxanium, Source_Code_Pro } from "next/font/google";
import { Nav } from "@/components/Nav";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";
import "./globals.css";

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Telegraph | Telegram Bot Builder for Modern Teams",
  description:
    "Telegraph is a SaaS platform for building Telegram bots with a visual flow editor, reliable webhook processing, and run history.",
  applicationName: "Telegraph",
  alternates: {
    canonical: toAbsoluteUrl("/"),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Telegraph | Telegram Bot Builder for Modern Teams",
    description:
      "Build Telegram bots with a visual flow editor, reliable execution, and clear run history in one workspace.",
    type: "website",
    url: toAbsoluteUrl("/"),
    siteName: "Telegraph",
  },
  twitter: {
    card: "summary_large_image",
    title: "Telegraph | Telegram Bot Builder for Modern Teams",
    description:
      "Build Telegram bots with a visual flow editor, reliable execution, and clear run history.",
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
            <p>Telegraph, the Telegram bot builder with a visual flow editor.</p>
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
              <Link className="focus-ring" href="/cookies">
                Cookie policy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );

  return (
    <html
      lang="en"
      className={cn("font-sans", oxanium.variable, sourceCodePro.variable)}
    >
      <body>
        <ClerkProvider appearance={clerkAppearance} publishableKey={publishableKey}>
          {appShell}
        </ClerkProvider>
      </body>
    </html>
  );
}
