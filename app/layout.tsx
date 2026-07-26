import type { Metadata } from "next";
import "./globals.css";
import { analyticsConfig } from "./config";
import { AnalyticsScripts } from "./components/AnalyticsScripts";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { defaultDescription, siteName, siteUrl } from "./seo";

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
  verification: analyticsConfig.googleSearchConsoleVerification ? { google: analyticsConfig.googleSearchConsoleVerification } : undefined,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  description: "회사원의 월세 절약, 이직, 연봉 상승 선택을 장기 자산으로 계산하는 시뮬레이션 도구",
  url: siteUrl,
  inLanguage: "ko-KR",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <AnalyticsScripts />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </body>
    </html>
  );
}
