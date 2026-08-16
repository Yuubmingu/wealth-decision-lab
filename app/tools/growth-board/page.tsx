import type { Metadata } from "next";
import { GrowthLeverBoard } from "../../components/WealthOperatingTools";
import { CalculatorArticle } from "../../components/CalculatorArticle";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
import { growthBoardContent } from "../../calculators/content";

export const metadata: Metadata = createPageMetadata({
  title: "부의 성장 레버 실행보드",
  description: "소득, 절약, 투자, 부채상환과 부업소득에 입력한 가정을 같은 기간의 장기 효과로 환산해 나란히 비교합니다. 실행 우선순위는 자동으로 정하지 않습니다.",
  path: "/tools/growth-board",
  keywords: ["자산 증식 방법 비교", "절약 소득 비교", "부업 효과 계산", "재테크 우선순위", "고정비 절감 효과"],
});

export default function Page() {
  return <main>
    <PageIntro eyebrow="LAB 03 · COMPARE" title="부의 성장 레버 실행보드" description="소득 증가, 비용 절감, 투자금, 부채 감소와 부업소득을 같은 기간의 추정 효과로 바꿔 나란히 비교합니다. 금액이 큰 항목을 자동으로 추천하거나 실행 우선순위로 판정하지 않습니다." />
    <div className="shell calculator-wrap"><GrowthLeverBoard /></div>
    <CalculatorArticle content={growthBoardContent} />
  </main>;
}
