import type { Metadata } from "next";
import { HomePurchaseCalculator } from "../../components/HomePurchaseCalculator";
import { CalculatorArticle } from "../../components/CalculatorArticle";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
import { homePurchaseContent } from "../content";

export const metadata: Metadata = createPageMetadata({
  title: "내 집 마련 필요현금 계산기",
  description: "지역과 주택가격, LTV·DTI·스트레스 DSR, 정책대출과 회사대출을 반영해 최대 대출한도와 잔금일 필요 현금, 상환액과 구입 부대비용을 계산합니다.",
  path: "/calculators/home-purchase",
  keywords: ["내 집 마련 계산기", "주택 구입 필요 현금", "취득세 계산기", "LTV DSR 계산기", "스트레스 DSR", "주담대 한도"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="CALCULATOR 06 · HOME" title="내 집 마련 필요현금 계산기" description="집값만 입력하는 계산이 아닙니다. 지역 규제, 상환능력, 정책대출과 회사대출을 함께 검토해 실제로 준비해야 할 현금과 매달 감당할 비용을 확인합니다." />
    <div className="shell calculator-wrap"><HomePurchaseCalculator /></div>
    <CalculatorArticle content={homePurchaseContent} />
  </main>;
}
