import type { Metadata } from "next";

export const siteUrl = "https://yuubmingulab.com";
export const siteName = "부자 회사원의 의사결정 연구소";
/** 글과 계산식을 작성·검토하는 운영자의 필명. 모든 글에 같은 이름을 씁니다. */
export const authorName = "부자 직장인 밍구";
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

/**
 * 검색결과에서 사이트 안의 위치를 보여 주는 이동경로 구조화 데이터.
 * 링크만 있고 표시하지 않는 경로는 넣지 않습니다.
 */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "홈", path: "/" }, ...trail].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: pageUrl(item.path),
    })),
  };
}

/** JSON-LD 를 페이지에 넣기 전에 스크립트 종료 태그를 막습니다. */
export function serializeJsonLd(payload: unknown) {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
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
