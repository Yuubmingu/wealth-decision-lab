import type { Metadata } from "next";
import { QuantBacktestWorkbench } from "../../components/backtest/QuantBacktestWorkbench";
import { PageIntro } from "../../components/SiteChrome";

export const metadata: Metadata = {
  title: "정량 투자 기준 백테스트",
  description: "재무제표가 공개된 당시의 정보와 수정주가 CSV를 사용해 정량 투자 기준의 과거 성과, CAGR, MDD와 거래내역을 검증합니다.",
};

const faqs = [
  ["백테스트는 종목 추천인가요?", "아닙니다. 사용자가 정한 기준이 과거 데이터에서 보인 성과와 위험을 검증하는 연구 도구입니다."],
  ["왜 회계기간 종료일 대신 공개일이 필요한가요?", "결산일의 재무정보는 그날 투자자가 알 수 없기 때문입니다. 실제 공개 가능일을 사용해야 미래정보 참조를 줄일 수 있습니다."],
  ["수정주가는 배당까지 반영하나요?", "데이터 제공처마다 다릅니다. 액면분할은 반영하더라도 배당 재투자는 포함하지 않을 수 있으므로 데이터 정의를 확인해야 합니다."],
  ["현재 상장된 종목만 사용해도 되나요?", "가능하지만 상장폐지 종목이 빠지면 생존자 편향으로 과거 수익률이 높아질 수 있습니다."],
  ["금융회사와 리츠는 왜 기본 제외하나요?", "일반 제조·서비스 기업과 부채, 자본, 현금흐름 구조가 달라 같은 기준을 적용하면 결과가 왜곡될 수 있기 때문입니다."],
  ["거래비용을 0으로 두어도 되나요?", "계산은 가능하지만 잦은 매매 전략일수록 실제 성과를 크게 과대평가할 수 있습니다."],
  ["기록이 몇 건 있어야 사후검증을 믿을 수 있나요?", "10건 미만은 통계 해석을 피해야 하며, 30건 이상이어도 업종과 시장 국면이 한쪽에 몰렸는지 확인해야 합니다."],
  ["좋은 결과가 나오면 실제 투자해도 되나요?", "과거 성과는 미래를 보장하지 않습니다. 과최적화, 데이터 누락, 체결 가능성, 세금과 투자자의 손실 감내 수준을 별도로 확인해야 합니다."],
];

export default function QuantBacktestPage() {
  return <main>
    <PageIntro eyebrow="INVESTMENT RESEARCH · BACKTEST" title="정량 투자 기준 백테스트" description="재무제표가 공개된 당시의 정보만 사용해 정량 투자 기준의 과거 성과와 위험을 검증합니다. 미래 수익을 예측하거나 종목을 추천하는 점수는 제공하지 않습니다." />
    <div className="shell backtest-wrap"><QuantBacktestWorkbench /></div>
    <section className="shell backtest-guide"><div className="backtest-guide-lead"><p className="eyebrow">READ BEFORE RESULTS</p><h2>백테스트는 답이 아니라 기준을 반박하는 실험입니다.</h2><p>현재 재무제표를 과거 시점에 소급하면 당시에는 알 수 없었던 정보를 사용하게 됩니다. 이 도구는 재무정보 공개일 다음 거래일부터 매수할 수 있도록 제한해 미래정보 참조를 줄입니다.</p></div><div className="guide-concepts"><article><span>01</span><h3>투자 기록 복기와 전략 검증</h3><p>내 기록 사후검증은 내가 검토한 종목만 분석합니다. 전략 백테스트는 당시 시장 전체 데이터에서 같은 기준을 반복 적용합니다.</p></article><article><span>02</span><h3>생존자 편향</h3><p>상장폐지 종목을 제외하면 실패한 기업이 데이터에서 사라져 전략 성과가 실제보다 좋아 보일 수 있습니다.</p></article><article><span>03</span><h3>거래비용과 체결가격</h3><p>화면 속 종가에 항상 거래할 수 있는 것은 아닙니다. 수수료, 세금, 슬리피지와 유동성을 반영해야 현실에 가까워집니다.</p></article><article><span>04</span><h3>과최적화</h3><p>기준값을 조금 바꿨을 때 성과가 급격히 무너지면 과거 데이터에만 우연히 맞은 전략일 수 있습니다.</p></article></div></section>
    <section className="shell backtest-faq"><div><p className="eyebrow">FAQ</p><h2>결과를 믿기 전에 확인할 질문</h2></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
  </main>;
}

