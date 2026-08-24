import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// `?? "..."` alone doesn't catch an empty string, and a malformed value
// (missing scheme, stray whitespace) throws inside `new URL()` and takes the
// whole build down — this must never be fatal, since metadataBase is
// cosmetic (canonical/OG URL resolution), not something the app depends on.
function resolveAppUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      return new URL(raw);
    } catch {
      // fall through to the default below
    }
  }
  return new URL("http://localhost:3000");
}

const appUrl = resolveAppUrl();

export const metadata: Metadata = {
  metadataBase: appUrl,
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "professional networking",
    "personal brand",
    "content strategy",
    "career growth",
    "AI coach",
  ],
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2b59ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh bg-surface text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-sm)] focus:bg-surface focus:px-4 focus:py-2 focus:shadow-[var(--shadow-md)]"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
