import type { Metadata } from "next";
import { HomePurchaseCalculator } from "../../components/HomePurchaseCalculator";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";

export const metadata: Metadata = createPageMetadata({
  title: "내 집 마련 필요현금 계산기",
  description: "지역과 주택가격, LTV·DTI·DSR, 정책대출과 회사대출을 반영해 최대 대출한도와 필요 현금, 상환액과 구입 부대비용을 계산합니다.",
  path: "/calculators/home-purchase",
  keywords: ["내 집 마련 계산기", "주택 구입 필요 현금", "취득세 계산기", "LTV DSR 계산기"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="CALCULATOR 06 · HOME" title="내 집 마련 필요현금 계산기" description="집값만 입력하는 계산이 아닙니다. 지역 규제, 상환능력, 정책대출과 회사대출을 함께 검토해 실제로 준비해야 할 현금과 매달 감당할 비용을 확인합니다." />
    <div className="shell calculator-wrap"><HomePurchaseCalculator /></div>
    <section className="shell calculator-article"><div><p className="eyebrow">POLICY-AWARE ESTIMATE</p><h2>대출 가능액보다 먼저 확인할 것은 필요한 현금입니다.</h2></div><div><p>주택담보대출은 LTV 하나로 결정되지 않습니다. 담보가치, 소득과 기존 부채, 정책대출 한도, 지역별 절대한도가 동시에 적용되며 가장 낮은 금액이 실제 한도의 출발점이 됩니다.</p><h3>결과를 읽는 순서</h3><p>먼저 잔금일 필요 현금과 부족분을 확인하고, 다음으로 대출한도를 제한한 조건을 살펴보세요. 월 전체 부채상환액이 생활비와 저축 계획을 훼손하지 않는지도 함께 판단해야 합니다.</p><h3>정책 기준</h3><p>2026년 7월 16일 기준 금융위원회와 한국주택금융공사의 공개자료를 바탕으로 구성했습니다. 정책과 금융회사 심사는 바뀔 수 있으므로 계약 전 반드시 해당 기관과 금융회사에서 다시 확인해야 합니다.</p></div></section>
  </main>;
}
