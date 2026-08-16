import type { Metadata } from "next";
import { GoalStrategyCalculator } from "../../components/DecisionCalculators";
import { CalculatorArticle } from "../../components/CalculatorArticle";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
import { goalAssetsContent } from "../content";

export const metadata: Metadata = createPageMetadata({
  title: "목표자산 달성 전략 계산기",
  description: "현재자산과 월 투자금으로 목표자산 달성 시점과 15년 목표에 필요한 월 투자금을 계산합니다. 자산군별 수익률을 따로 적용해 복리 계산합니다.",
  path: "/calculators/goal-assets",
  keywords: ["목표자산 계산기", "월 투자금 계산기", "경제적 자유 계산기", "복리 계산기", "10억 모으기"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="CALCULATOR 01 · GOAL" title="목표자산 달성 전략 계산기" description="현재 투자 속도로 목표자산에 언제 도달하는지 확인하고, 15년 안에 달성하려면 월 투자금을 얼마나 조정해야 하는지 역산합니다." />
    <div className="shell calculator-wrap"><GoalStrategyCalculator /></div>
    <CalculatorArticle content={goalAssetsContent} />
  </main>;
}
