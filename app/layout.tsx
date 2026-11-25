import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/ui";
import { OptionalConsent } from "@/components/optional-consent";
import { Suspense } from "react";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://operlyynt.vercel.app"
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  alternates: {
    canonical: "/",
  },

  title: {
    default: "Operlynt — Career growth, more intentional",
    template: "%s | Operlynt",
  },

  description:
    "Build resumes, check ATS scores, practice tech interviews, follow career roadmaps, and find role-relevant courses with Operlynt.",

  keywords: [
    "resume builder",
    "ATS resume checker",
    "resume score",
    "tech interview preparation",
    "career roadmap",
    "online courses",
  ],

  robots: {
    index: true,
    follow: true,
  },

  applicationName: "Operlynt",
  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    title: "Operlynt",
    statusBarStyle: "default",
  },

  openGraph: {
    title: "Operlynt — Resume builder, ATS score, and tech interview preparation",
    description:
      "Build resumes, check ATS scores, practice interviews, and learn what moves you toward your next role.",
    siteName: "Operlynt",
    type: "website",
    url: siteUrl,
    images: ["/opengraph-image"],
  },

  twitter: {
    card: "summary_large_image",
    title: "Operlynt — Career growth, more intentional",
    description:
      "Resume building, ATS scoring, interview preparation, courses, and career roadmaps in one workspace.",
    images: ["/opengraph-image"],
  },

  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,

  other: {
    "google-adsense-account": "ca-pub-3072425233890321",
  },
};

export const viewport: Viewport = {
  themeColor: "#7055D9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />

        <Suspense fallback={null}>
          <OptionalConsent />
        </Suspense>
      </body>
    </html>
  );
}