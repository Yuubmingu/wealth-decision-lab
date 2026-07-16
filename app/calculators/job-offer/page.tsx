import type { Metadata } from "next";
import { JobOfferCalculator } from "../../components/CalculatorUI";
import { PageIntro } from "../../components/SiteChrome";

export const metadata: Metadata = { title: "이직 오퍼 자산가속 계산기", description: "급여, 성과급, 복지와 직장 관련 비용을 반영해 이직 오퍼의 실질 가치와 15년 자산효과를 비교합니다." };

export default function Page() { return <main><PageIntro eyebrow="CALCULATOR 03 · CAREER" title="이직 오퍼 자산가속 계산기" description="기본급만 비교하지 않습니다. 성과급의 실현 가능성, 현금성 수당, 복지포인트, 식대·교통·주거 지원과 주식보상까지 현금가치로 나누어 비교합니다." /><div className="shell calculator-wrap"><JobOfferCalculator /></div><section className="shell calculator-article"><div><p className="eyebrow">HOW TO READ</p><h2>계약으로 확정된 보상과 기대에 의존하는 보상을 분리해 보세요.</h2></div><div><p>총보상이 높아도 주거비와 통근비가 늘면 실제 가처분소득은 감소할 수 있습니다. 복지포인트처럼 사용처가 제한된 혜택은 실제로 사용할 수 있는 금액만 입력하는 것이 좋습니다.</p><h3>주식보상은 보수적으로 입력해 주세요</h3><p>상장 여부, 베스팅, 퇴사 시 소멸 조건을 확인한 뒤 연간 평가액과 실현 가능성을 따로 입력합니다. 계산 결과는 계약서 검토를 대신하지 않습니다.</p></div></section></main>; }
