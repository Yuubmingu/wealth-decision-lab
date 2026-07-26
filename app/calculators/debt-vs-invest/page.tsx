import type { Metadata } from "next";
import { DebtVsInvestCalculator } from "../../components/DecisionCalculators";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";

export const metadata: Metadata = createPageMetadata({
  title: "대출 상환 vs 투자 계산기",
  description: "같은 목돈과 월 여유자금을 대출 상환 또는 투자에 사용할 때 15년 뒤 순자산과 완납 시점을 비교합니다.",
  path: "/calculators/debt-vs-invest",
  keywords: ["대출 상환 투자 비교", "중도상환 계산기", "대출 이자 투자 수익 비교"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="CALCULATOR 05 · DEBT" title="목돈, 상환할까 투자할까?" description="비상자금을 지키면서 대출 상환과 투자의 확정효과, 세후 손익분기 수익률과 부진·기준·호조 시나리오를 비교합니다." />
    <div className="shell calculator-wrap"><DebtVsInvestCalculator /></div>
    <section className="shell calculator-article"><div><p className="eyebrow">HOW TO READ</p><h2>수익률 한 줄보다 확정 효과와 변동 가능성을 함께 보셔야 합니다.</h2></div><div><p>대출을 먼저 갚으면 이자를 확실하게 줄일 수 있고, 투자하면 더 높은 수익을 기대하는 대신 변동을 감수해야 합니다. 계산 결과가 비슷할수록 숫자 차이보다 비상자금과 소득 안정성이 더 중요합니다.</p><h3>계산의 한계</h3><p>원리금균등상환과 고정금리를 가정합니다. 세금, 투자 수수료, 대출이자 공제, 중도상환수수료 면제 조건과 시장 변동은 포함하지 않습니다.</p><h3>자주 묻는 질문</h3><details><summary>손익분기 기대수익률은 무엇인가요?</summary><p>입력한 조건에서 투자 우선 순자산이 상환 우선 순자산과 같아지기 시작하는 연평균 수익률입니다.</p></details><details><summary>비상자금도 중도상환액에 넣어야 하나요?</summary><p>권장하지 않습니다. 갑작스러운 지출에 대응할 현금을 별도로 남긴 뒤 실제로 사용할 수 있는 목돈만 입력해 주세요.</p></details><details><summary>변동금리 대출도 계산할 수 있나요?</summary><p>현재 금리가 비교기간 동안 유지된다고 가정합니다. 금리 상승과 하락 시나리오를 각각 입력해 결과 범위를 확인해 주세요.</p></details></div></section>
  </main>;
}
