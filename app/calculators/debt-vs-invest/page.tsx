import type { Metadata } from "next";
import { DebtVsInvestCalculator } from "../../components/DecisionCalculators";
import { CalculatorArticle } from "../../components/CalculatorArticle";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
import { debtVsInvestContent } from "../content";

export const metadata: Metadata = createPageMetadata({
  title: "대출 상환 vs 투자 계산기",
  description: "같은 목돈과 월 여유자금을 대출 상환 또는 투자에 사용할 때 순자산과 완납 시점을 비교하고, 세금을 반영한 손익분기 기대수익률을 계산합니다.",
  path: "/calculators/debt-vs-invest",
  keywords: ["대출 상환 투자 비교", "중도상환 계산기", "대출 이자 투자 수익 비교", "손익분기 수익률", "여윳돈 상환"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="CALCULATOR 05 · DEBT" title="목돈, 상환할까 투자할까?" description="비상자금을 지키면서 대출 상환과 투자의 확정효과, 세후 손익분기 수익률과 부진·기준·호조 시나리오를 비교합니다." />
    <div className="shell calculator-wrap"><DebtVsInvestCalculator /></div>
    <CalculatorArticle content={debtVsInvestContent} />
  </main>;
}
