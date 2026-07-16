import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wealth-decision-lab.fotochalkak.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "부자 회사원의 의사결정 연구소", template: "%s | 부자 회사원의 의사결정 연구소" },
  description: "월세 절약, 이직, 연봉 상승이 15년 뒤 자산과 목표자산 도달 시점에 미치는 영향을 투명한 공식으로 계산합니다.",
  keywords: ["월세 절약 계산기", "월세 아끼면", "월세 자산 계산기", "이직 오퍼 비교", "투자 후보 비교", "대출 상환 투자 비교"],
  alternates: { canonical: "/" },
  openGraph: { title: "부자 회사원의 의사결정 연구소", description: "오늘의 선택을 15년 뒤 자산으로 계산합니다.", type: "website", locale: "ko_KR" },
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "부자 회사원의 의사결정 연구소",
  description: "회사원의 월세 절약, 이직, 연봉 상승 선택을 장기 자산으로 계산하는 시뮬레이션 도구",
  inLanguage: "ko-KR",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </body>
    </html>
  );
}
