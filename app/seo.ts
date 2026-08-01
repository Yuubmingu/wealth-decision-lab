import type { Metadata } from "next";

export const siteUrl = "https://yuubmingulab.com";
export const siteName = "부자 회사원의 의사결정 연구소";
export const defaultDescription = "내 집 마련, 월세 절약, 이직, 자동차, 대출과 투자의 장기 자산 효과를 투명한 공식으로 계산하는 무료 재무 의사결정 도구입니다.";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  openGraphType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function pagePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? normalized : `${normalized.replace(/\/+$/, "")}/`;
}

export function pageUrl(path: string): string {
  return `${siteUrl}${pagePath(path)}`;
}

export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  openGraphType = "website",
  publishedTime,
  modifiedTime,
}: PageMetadataOptions): Metadata {
  const canonicalPath = pagePath(path);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalPath },
    openGraph: openGraphType === "article"
      ? {
          title,
          description,
          url: canonicalPath,
          siteName,
          type: "article",
          locale: "ko_KR",
          publishedTime,
          modifiedTime,
          images: [{ url: "/og.png", width: 1200, height: 630, alt: siteName }],
        }
      : {
          title,
          description,
          url: canonicalPath,
          siteName,
          type: "website",
          locale: "ko_KR",
          images: [{ url: "/og.png", width: 1200, height: 630, alt: siteName }],
        },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}
