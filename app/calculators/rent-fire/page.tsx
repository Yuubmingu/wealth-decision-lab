import type { Metadata } from "next";
import { RentFireCalculator } from "../../components/CalculatorUI";
import { CalculatorArticle } from "../../components/CalculatorArticle";
import { PageIntro } from "../../components/SiteChrome";
import { createPageMetadata } from "../../seo";
import { rentFireContent } from "../content";

export const metadata: Metadata = createPageMetadata({
  title: "월세 절약 자산증가 계산기",
  description: "월세를 줄여 아낀 돈을 투자했을 때 5년, 10년, 15년 뒤 늘어나는 자산과 목표자산 도달 시점을 계산합니다. 관리비와 주차비까지 합산해 비교합니다.",
  path: "/calculators/rent-fire",
  keywords: ["월세 절약 계산기", "월세 아끼면", "월세 투자 계산기", "주거비 비중", "고정비 절감 복리"],
});

export default function Page() {
  return (
    <main>
      <PageIntro
        eyebrow="CALCULATOR 02 · HOUSING"
        title="월세 절약 자산증가 계산기"
        description="월세를 아껴 만든 여유자금을 꾸준히 투자하면 5년, 10년, 15년 뒤 자산이 얼마나 늘어나는지 계산합니다."
      />
      <div className="shell calculator-wrap"><RentFireCalculator /></div>
      <CalculatorArticle content={rentFireContent} />
    </main>
  );
}
