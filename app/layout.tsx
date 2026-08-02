import type { Metadata } from "next";
import "./globals.css";
import { analyticsConfig } from "./config";
import { AnalyticsScripts } from "./components/AnalyticsScripts";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { defaultDescription, pageUrl, siteName, siteUrl } from "./seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: defaultDescription,
  openGraph: {
    title: siteName,
    description: defaultDescription,
    siteName,
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: defaultDescription,
    images: ["/og.png"],
  },
  verification: {
    google: analyticsConfig.googleSearchConsoleVerification || undefined,
    other: analyticsConfig.naverSearchAdvisorVerification
      ? { "naver-site-verification": analyticsConfig.naverSearchAdvisorVerification }
      : undefined,
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  description: defaultDescription,
  url: pageUrl("/"),
  inLanguage: "ko-KR",
};

const serializedWebsiteSchema = JSON.stringify(websiteSchema).replace(/</g, "\\u003c");

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <a href="#main-content" className="skip-link">본문으로 건너뛰기</a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <SiteFooter />
        <AnalyticsScripts />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializedWebsiteSchema }} />
      </body>
    </html>
  );
}
