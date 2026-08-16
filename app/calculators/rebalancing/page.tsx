import type { Metadata } from "next";
import { RebalancingCalculator } from "../../components/InvestmentManagementCalculators";
import { CalculatorArticle } from "../../components/CalculatorArticle";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
import { rebalancingContent } from "../content";

export const metadata: Metadata = createPageMetadata({
  title: "포트폴리오 리밸런싱 계산기",
  description: "자산 가격이 달라졌을 때 목표 비중을 회복하기 위한 신규 투자금 배분, 정확한 조정, 허용범위 조정 세 가지 실행안을 거래비용과 함께 계산합니다.",
  path: "/calculators/rebalancing",
  keywords: ["리밸런싱 계산기", "포트폴리오 비중 계산", "자산배분 계산기", "목표 비중 회복", "허용 편차 밴드"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="INVESTMENT 02 · REBALANCE" title="포트폴리오 리밸런싱 계산기" description="자산별 가격 변화 후 실제 비중과 목표 편차를 확인하고 신규 투자금 우선, 정확한 조정, 허용범위까지만 조정하는 세 가지 실행안을 비교합니다." />
    <div className="shell calculator-wrap"><RebalancingCalculator /></div>
    <CalculatorArticle content={rebalancingContent} />
  </main>;
}
