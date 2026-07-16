import type { Metadata } from "next";
import { RentFireCalculator } from "../../components/CalculatorUI";
import { PageIntro } from "../../components/SiteChrome";

export const metadata: Metadata = {
  title: "월세 절약 자산증가 계산기",
  description: "월세를 줄여 아낀 돈을 투자했을 때 5년, 10년, 15년 뒤 늘어나는 자산과 목표자산 도달 시점을 계산합니다.",
};

export default function Page() {
  return (
    <main>
      <PageIntro
        eyebrow="CALCULATOR 02 · HOUSING"
        title="월세 절약 자산증가 계산기"
        description="월세를 아껴 만든 여유자금을 꾸준히 투자하면 5년, 10년, 15년 뒤 자산이 얼마나 늘어나는지 계산합니다."
      />
      <div className="shell calculator-wrap"><RentFireCalculator /></div>
      <CalculatorArticle />
    </main>
  );
}

function CalculatorArticle() {
  return (
    <section className="shell calculator-article">
      <div>
        <p className="eyebrow">HOW TO READ</p>
        <h2>월세를 아끼는 것보다 아낀 돈을 실제로 남기는 일이 중요합니다.</h2>
      </div>
      <div>
        <p>월세를 줄였다고 자산이 자동으로 늘어나는 것은 아닙니다. 이 계산기는 절약액 중 사용자가 정한 비율을 매월 투자한다고 가정합니다. 절약한 돈을 다른 생활비로 사용하면 장기 자산 증가 효과도 그만큼 줄어듭니다.</p>
        <h3>계산의 한계</h3>
        <p>이사비, 보증금의 기회비용, 통근시간, 삶의 질, 세금과 물가는 포함하지 않습니다. 계산 결과는 월세 절약의 금전적 효과를 비교하는 참고 자료이며 최종 주거 결정을 대신하지 않습니다.</p>
        <h3>자주 묻는 질문</h3>
        <details><summary>절약 후 예상 주거비가 더 비싸면 어떻게 계산하나요?</summary><p>월세 절약액과 추가 투자액을 0원으로 처리하고 주거비가 증가한다는 점을 결과에 표시합니다.</p></details>
        <details><summary>수익률은 몇 %로 설정하는 것이 좋나요?</summary><p>빠른 비교를 위해 보수 4%, 기준 6%, 성장 8%를 제공하지만 어떤 수익률도 보장되지 않습니다. 여러 가정을 함께 비교해 보세요.</p></details>
        <details><summary>목표자산을 이미 달성했다면 어떻게 표시되나요?</summary><p>목표 도달 기간을 ‘이미 달성’으로 표시합니다.</p></details>
        <details><summary>전세 보증금도 반영되나요?</summary><p>현재 버전은 매월 줄일 수 있는 주거비에 집중하므로 보증금의 기회비용은 별도로 반영하지 않습니다.</p></details>
        <details><summary>계산기간이 최대 60년인 이유는 무엇인가요?</summary><p>지나치게 긴 계산을 방지하고 현실적인 범위에서 목표 도달 가능성을 확인하기 위한 상한입니다.</p></details>
      </div>
    </section>
  );
}
