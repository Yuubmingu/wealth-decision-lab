import type { Metadata } from "next";
import { LumpSumVsDcaCalculator } from "../../components/InvestmentManagementCalculators";
import { CalculatorArticle } from "../../components/CalculatorArticle";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
import { lumpSumVsDcaContent } from "../content";

export const metadata: Metadata = createPageMetadata({
  title: "목돈투자 vs 분할매수 계산기",
  description: "목돈을 한 번에 투자할 때와 3·6·12·24개월 분할매수할 때의 기대자산, 최대 평가손실과 급락 시나리오를 비교합니다.",
  path: "/calculators/lump-sum-vs-dca",
  keywords: ["일시투자 분할매수 비교", "적립식 거치식 계산기", "분할매수 계산기", "DCA 계산기", "목돈 투자 시점"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="INVESTMENT 01 · TIMING" title="목돈투자 vs 분할매수 계산기" description="보유한 현금을 지금 한 번에 투자할지 나눠 투자할지 상승 지속, 투자 직후 급락, 중간 급락 후 회복의 세 가지 시장에서 비교합니다." />
    <div className="shell calculator-wrap"><LumpSumVsDcaCalculator /></div>
    <CalculatorArticle content={lumpSumVsDcaContent} />
  </main>;
}
