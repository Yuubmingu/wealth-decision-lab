import type { Metadata } from "next";
import { CarCostCalculator } from "../../components/DecisionCalculators";
import { PageIntro } from "../../components/SiteChrome";

export const metadata: Metadata = { title: "자동차 비용 계산기", description: "차량 구매비, 할부이자, 유지비와 중고차 가치를 반영해 총소유비용과 보유기간의 투자 기회비용을 계산합니다." };
export default function Page() { return <main><PageIntro eyebrow="CALCULATOR 04 · CAR" title="자동차 비용 계산기" description="차량 가격만 보지 않고 할부이자, 유지비와 중고차 가치까지 합산합니다. 차를 사지 않고 같은 돈을 보유기간 동안 투자했을 때의 기회비용도 함께 확인합니다." /><div className="shell calculator-wrap"><CarCostCalculator /></div><section className="shell calculator-article"><div><p className="eyebrow">HOW TO READ</p><h2>자동차의 가격표와 실제 비용은 다릅니다.</h2></div><div><p>차량 구매에는 초기 지출뿐 아니라 보험, 세금, 정비, 유류비와 주차비가 반복해서 발생합니다. 보유기간은 기본 7년으로 두었지만 실제 교체 계획에 맞게 조정할 수 있습니다.</p><h3>7년은 정답이 아니라 시작값입니다</h3><p>공개 통계에서 확인되는 차량의 평균 수명은 한 사람이 같은 차를 보유하는 기간과 다른 개념입니다. 따라서 특정 평균을 강제하지 않고 5년, 7년, 10년 등 본인의 계획을 직접 비교하도록 설계했습니다.</p><h3>기회비용을 함께 보세요</h3><p>자동차가 제공하는 시간 절약과 생활 편익은 계산에 포함되지 않습니다. 투자 기회비용과 실제 편익을 함께 비교해 구매 여부와 예산을 결정해 주세요.</p></div></section></main>; }
