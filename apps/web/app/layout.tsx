import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { Oxanium, Source_Code_Pro } from "next/font/google";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";
import { AppChrome } from "@/components/AppChrome";
import { Nav } from "@/components/Nav";
import { getContentsquareScriptUrl, isContentsquareEnabled } from "@/lib/analytics";
import { getServerAnalyticsConsent } from "@/lib/analytics.server";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const analyticsConsent = await getServerAnalyticsConsent();
  const contentsquareEnabled = isContentsquareEnabled();
  const contentsquareScriptUrl = contentsquareEnabled && analyticsConsent === "granted" ? getContentsquareScriptUrl() : null;
  const footer = (
    <footer className="mt-10 border-t border-border/70 pt-5 text-sm text-muted-foreground md:mt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[42ch]">
          Telegraph, the Telegram bot builder with a visual flow editor.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
  );
  const analyticsBanner =
    contentsquareEnabled && analyticsConsent === "unknown" ? (
      <AnalyticsConsentBanner />
    ) : null;
  const appShell = (
    <>
      <a className="skip-link focus-ring" href="#main-content">
        Skip to content
      </a>
      <AppChrome nav={<Nav />} footer={footer} analyticsBanner={analyticsBanner}>
        {children}
      </AppChrome>
    </>
  );

  return (
    <html
      lang="en"
      className={cn("font-sans", oxanium.variable, sourceCodePro.variable)}
    >
      <head>
        {contentsquareScriptUrl ? <Script src={contentsquareScriptUrl} strategy="afterInteractive" /> : null}
      </head>
      <body>
        {publishableKey ? (
          <ClerkProvider appearance={clerkAppearance} publishableKey={publishableKey}>
            {appShell}
          </ClerkProvider>
        ) : (
          appShell
        )}
      </body>
    </html>
  );
}
