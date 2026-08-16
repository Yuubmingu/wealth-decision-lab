import type { Metadata } from "next";
import { InvestmentCompareCalculator } from "../../components/InvestmentCompareCalculator";
import { CalculatorArticle } from "../../components/CalculatorArticle";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
import { investmentCompareContent } from "../content";

export const metadata: Metadata = createPageMetadata({
  title: "투자 후보 비교 연구실",
  description: "투자 후보를 기대수익, 최대손실, 현금흐름, 회수기간, 유동성, 세금, 공부시간, 레버리지의 여러 축으로 나란히 비교합니다. 종합 점수나 순위는 매기지 않습니다.",
  path: "/calculators/investment-compare",
  keywords: ["투자 비교", "자산군 비교", "투자 후보 분석", "유동성 비교", "기회비용 비교"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="LAB 01 · COMPARE" title="투자 후보 비교 연구실" description="주식·ETF·부동산·코인·금·부업 또는 아무것도 하지 않는 선택까지 최대 세 가지를 비교합니다. 무엇을 살지보다 이 투자가 내 상황에 맞는지를 판단해 보세요." />
    <div className="shell calculator-wrap"><InvestmentCompareCalculator /></div>
    <CalculatorArticle content={investmentCompareContent} />
  </main>;
}
