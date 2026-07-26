import type { Metadata } from "next";
import { GoalStrategyCalculator } from "../../components/DecisionCalculators";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";

export const metadata: Metadata = createPageMetadata({
  title: "목표자산 달성 전략 계산기",
  description: "현재자산과 월 투자금으로 목표자산 달성 시점과 15년 목표에 필요한 월 투자금을 계산합니다.",
  path: "/calculators/goal-assets",
  keywords: ["목표자산 계산기", "월 투자금 계산기", "경제적 자유 계산기"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="CALCULATOR 01 · GOAL" title="목표자산 달성 전략 계산기" description="현재 투자 속도로 목표자산에 언제 도달하는지 확인하고, 15년 안에 달성하려면 월 투자금을 얼마나 조정해야 하는지 역산합니다." />
    <div className="shell calculator-wrap"><GoalStrategyCalculator /></div>
    <section className="shell calculator-article"><div><p className="eyebrow">HOW TO READ</p><h2>목표는 희망 금액보다 필요한 월 행동으로 바꿀 때 구체적이 됩니다.</h2></div><div><p>현재 속도의 도달 시점과 목표기간에 필요한 월 투자금을 함께 비교해 보세요. 부족분이 크다면 무리한 수익률을 가정하기보다 목표 금액, 기간, 월 투자금을 차례로 조정하는 편이 현실적입니다.</p><h3>계산의 한계</h3><p>수익률이 매월 일정하고 투자금도 변하지 않는다고 가정합니다. 세금, 수수료, 물가, 소득 변화와 시장 변동은 포함하지 않습니다.</p><h3>자주 묻는 질문</h3><details><summary>15년은 바꿀 수 있나요?</summary><p>목표기간 입력란에서 1년부터 40년까지 조정할 수 있습니다. 기본값은 비교하기 쉬운 15년입니다.</p></details><details><summary>수익률을 높이면 부족분이 줄어드는데 그대로 믿어도 되나요?</summary><p>수익률은 보장되지 않습니다. 4%, 6%, 8% 시나리오를 함께 보고 감당 가능한 월 투자금을 우선 기준으로 삼아 주세요.</p></details><details><summary>현재자산에는 무엇을 넣어야 하나요?</summary><p>현금, 예금, 투자자산처럼 목표에 사용할 수 있는 금융자산을 입력하고 실거주 주택 등 바로 사용하기 어려운 자산은 별도로 판단하는 편이 좋습니다.</p></details></div></section>
  </main>;
}
