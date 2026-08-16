import type { Metadata } from "next";
import { JobOfferCalculator } from "../../components/CalculatorUI";
import { CalculatorArticle } from "../../components/CalculatorArticle";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
import { jobOfferContent } from "../content";

export const metadata: Metadata = createPageMetadata({
  title: "이직 오퍼 자산가속 계산기",
  description: "급여, 성과급, 복지와 직장 관련 비용을 반영해 이직 오퍼의 총보상과 월 가처분소득을 따로 비교하고 15년 자산효과를 계산합니다.",
  path: "/calculators/job-offer",
  keywords: ["이직 연봉 비교", "오퍼 비교 계산기", "성과급 기대값 계산", "총보상 비교", "가처분소득 계산"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="CALCULATOR 03 · CAREER" title="이직 오퍼 자산가속 계산기" description="기본급만 비교하지 않습니다. 성과급의 실현 가능성, 현금성 수당, 복지포인트, 식대·교통·주거 지원과 주식보상까지 현금가치로 나누어 비교합니다." />
    <div className="shell calculator-wrap"><JobOfferCalculator /></div>
    <CalculatorArticle content={jobOfferContent} />
  </main>;
}
