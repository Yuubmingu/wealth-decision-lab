import type { Metadata } from "next";
import { CarCostCalculator } from "../../components/DecisionCalculators";
import { CalculatorArticle } from "../../components/CalculatorArticle";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
import { carCostContent } from "../content";

export const metadata: Metadata = createPageMetadata({
  title: "자동차 비용 계산기",
  description: "차량 구매비, 할부이자, 유지비와 중고차 가치를 반영해 총소유비용과 보유기간의 투자 기회비용을 계산합니다.",
  path: "/calculators/car-cost",
  keywords: ["자동차 유지비 계산기", "차량 총비용 계산기", "자동차 기회비용", "할부 이자 계산", "총소유비용 TCO"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="CALCULATOR 04 · CAR" title="자동차 비용 계산기" description="차량 가격만 보지 않고 할부이자, 유지비와 중고차 가치까지 합산합니다. 차를 사지 않고 같은 돈을 보유기간 동안 투자했을 때의 기회비용도 함께 확인합니다." />
    <div className="shell calculator-wrap"><CarCostCalculator /></div>
    <CalculatorArticle content={carCostContent} />
  </main>;
}
