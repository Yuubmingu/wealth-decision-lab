import type { MetadataRoute } from "next";
import { guides } from "./guides/data";
import { pageUrl } from "./seo";

export const dynamic = "force-static";

/**
 * 페이지별 최종 수정일.
 *
 * 크롤러는 lastmod 를 재수집 우선순위 힌트로 씁니다. 내용을 크게 고친 뒤에도
 * 예전 날짜가 남아 있으면 다시 읽어 갈 이유가 줄어듭니다. 반대로 바뀌지 않은
 * 페이지까지 오늘 날짜로 올리면 신호의 신뢰도가 떨어지므로, 실제로 고친
 * 페이지만 갱신합니다.
 */
const CONTENT_REVISED = "2026-08-16"; // 계산기 본문·차트·소개 페이지 개편
const UNCHANGED = "2026-08-01";
const ENGLISH_HOME_PUBLISHED = "2026-09-04";
const ABOUT_REVISED = "2026-09-05";

const routes: { path: string; lastModified: string }[] = [
  { path: "", lastModified: UNCHANGED },
  { path: "/en", lastModified: ENGLISH_HOME_PUBLISHED },
  // 본문 보강과 차트 추가로 내용이 크게 바뀐 페이지
  { path: "/calculators/goal-assets", lastModified: CONTENT_REVISED },
  { path: "/calculators/rent-fire", lastModified: CONTENT_REVISED },
  { path: "/calculators/job-offer", lastModified: CONTENT_REVISED },
  { path: "/calculators/car-cost", lastModified: CONTENT_REVISED },
  { path: "/calculators/debt-vs-invest", lastModified: CONTENT_REVISED },
  { path: "/calculators/home-purchase", lastModified: CONTENT_REVISED },
  { path: "/calculators/investment-compare", lastModified: CONTENT_REVISED },
  { path: "/calculators/lump-sum-vs-dca", lastModified: CONTENT_REVISED },
  { path: "/calculators/rebalancing", lastModified: CONTENT_REVISED },
  { path: "/tools/growth-board", lastModified: CONTENT_REVISED },
  { path: "/guides", lastModified: CONTENT_REVISED },
  { path: "/about", lastModified: ABOUT_REVISED },
  // 이번 개편에서 손대지 않은 페이지
  { path: "/tools/decision-journal", lastModified: UNCHANGED },
  { path: "/invest/quant-backtest", lastModified: UNCHANGED },
  { path: "/privacy", lastModified: UNCHANGED },
  { path: "/disclaimer", lastModified: UNCHANGED },
  { path: "/terms", lastModified: UNCHANGED },
  { path: "/contact", lastModified: UNCHANGED },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...routes.map((route) => ({ url: pageUrl(route.path), lastModified: route.lastModified })),
    ...guides.map((guide) => ({ url: pageUrl(`/guides/${guide.slug}`), lastModified: guide.reviewedAt })),
  ];
}
