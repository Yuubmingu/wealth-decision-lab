import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, BriefcaseBusiness, Building2, CarFront, ChartPie, Coins, Eye, Home as HouseIcon, LockKeyhole, Scale, Sigma, Target } from "lucide-react";
import { createPageMetadata, defaultDescription, siteName } from "./seo";

const baseMetadata = createPageMetadata({
  title: siteName,
  description: defaultDescription,
  path: "/",
  keywords: ["재테크 계산기", "내 집 마련 계산기", "월세 절약 계산기", "대출 상환 계산기", "이직 연봉 비교"],
});

export const metadata: Metadata = {
  ...baseMetadata,
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
      en: "/en/",
      "x-default": "/",
    },
  },
};

const calculators = [
  {
    number: "01",
    icon: Target,
    title: "목표자산 달성 전략 계산기",
    description: "현재 투자 속도로 목표자산에 언제 도달하는지 확인하고, 15년 안에 달성하려면 월 투자금을 얼마나 조정해야 하는지 계산합니다.",
    href: "/calculators/goal-assets",
    example: "15년 목표에 필요한 월 투자금",
  },
  {
    number: "02",
    icon: Building2,
    title: "월세 절약 자산증가 계산기",
    description: "줄인 월세를 투자했을 때 5년, 10년, 15년 뒤 늘어나는 자산과 목표자산 도달 시점을 계산합니다.",
    href: "/calculators/rent-fire",
    example: "월 30만원 절약 → 15년 뒤 약 8,607만원",
  },
  {
    number: "03",
    icon: BriefcaseBusiness,
    title: "이직 오퍼 자산가속 계산기",
    description: "기본급, 기대 성과급, 직장 관련 비용을 구분하여 이직 제안의 실질 가치를 비교합니다.",
    href: "/calculators/job-offer",
    example: "연봉이 아닌 가처분소득 비교",
  },
  {
    number: "04",
    icon: CarFront,
    title: "자동차 비용 계산기",
    description: "구매비, 할부이자, 유지비와 중고차 가치를 반영하고 차를 사지 않았을 때의 투자 기회비용을 계산합니다.",
    href: "/calculators/car-cost",
    example: "7년 보유비용과 투자 기회비용",
  },
  {
    number: "05",
    icon: Scale,
    title: "목돈, 상환할까 투자할까?",
    description: "비상자금을 지킨 뒤 목돈을 대출 상환 또는 투자에 쓸 때의 확정효과와 손실 시나리오를 비교합니다.",
    href: "/calculators/debt-vs-invest",
    example: "확정 이자절감과 기대수익 비교",
  },
  {
    number: "06",
    icon: HouseIcon,
    title: "내 집 마련 필요현금 계산기",
    description: "지역 규제와 LTV·DTI·DSR, 정책대출과 회사대출을 함께 반영해 실제 준비할 현금을 계산합니다.",
    href: "/calculators/home-purchase",
    example: "대출한도부터 세금·부대비용까지",
  },
  {
    number: "LAB",
    icon: Scale,
    title: "투자 후보 비교 연구실",
    description: "세 가지 투자 후보를 기대수익, 하락 위험, 현금흐름, 유동성과 실행 난이도로 비교합니다.",
    href: "/calculators/investment-compare",
    example: "투자하기와 하지 않기까지 같은 표로",
  },
  {
    number: "LAB 02",
    icon: Target,
    title: "주식 투자 기록장",
    description: "업종 대비 PER, 3개년 실적, 현금흐름과 재무안전성을 기록하고 실제 결과와 비교합니다.",
    href: "/tools/decision-journal",
    example: "정량 점검 · 브라우저 저장 · JSON 내려받기",
  },
  {
    number: "LAB 03",
    icon: BarChart3,
    title: "정량 투자 기준 백테스트",
    description: "재무제표 공개일과 수정주가를 사용해 내가 정한 정량 기준의 과거 성과와 최대낙폭을 검증합니다.",
    href: "/invest/quant-backtest",
    example: "미래정보 차단 · CAGR · MDD · 거래내역",
  },
  {
    number: "LAB 04",
    icon: Sigma,
    title: "부의 성장 레버 실행보드",
    description: "소득, 절약, 투자, 부채상환과 부업에 입력한 가정별 장기 효과를 같은 기간으로 비교합니다.",
    href: "/tools/growth-board",
    example: "서로 다른 추정 효과 비교 · 판단은 직접",
  },
  {
    number: "INV 01",
    icon: Coins,
    title: "목돈투자 vs 분할매수 계산기",
    description: "목돈을 한 번에 투자할 때와 3·6·12·24개월 분할매수할 때를 세 가지 시장에서 비교합니다.",
    href: "/calculators/lump-sum-vs-dca",
    example: "상승 지속 · 즉시 급락 · 중간 급락",
  },
  {
    number: "INV 02",
    icon: ChartPie,
    title: "포트폴리오 리밸런싱 계산기",
    description: "자산 가격 변화 후 목표 비중을 회복하기 위한 신규 투자금 배분과 매수·매도 금액을 계산합니다.",
    href: "/calculators/rebalancing",
    example: "ETF 65% · 비트코인 35% 실행안",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">WEALTH DECISION LAB · 2026</p>
          <h1>오늘의 선택을<br /><em>15년 뒤 자산</em>으로<br />계산합니다.</h1>
          <p className="hero-description">목표 설정부터 주거비, 이직, 자동차, 대출과 내 집 마련까지 회사원의 중요한 선택을 같은 기준으로 계산합니다. 오늘의 결정이 장기 자산에 미치는 영향을 직접 비교해 보세요.</p>
          <div className="hero-actions">
            <Link href="/calculators/goal-assets" className="primary-link">목표부터 계산하기 <ArrowRight size={18} /></Link>
            <Link href="/about" className="quiet-link">계산 원칙 보기</Link>
          </div>
        </div>
        <div className="hero-figure" aria-label="월 30만원을 연 6%로 15년 투자하는 예시">
          <div className="figure-top"><span>가정 실험 001</span><Sigma size={20} /></div>
          <div className="figure-equation"><span>월 30만원</span><i>×</i><span>15년</span><i>@</i><span>연 6%</span></div>
          <div className="figure-result"><span>예상 미래가치</span><strong>약 8,607만원</strong><small>투자원금 5,400만원 · 복리수익 약 3,207만원</small></div>
          <div className="mini-chart" aria-hidden="true"><svg viewBox="0 0 520 150" preserveAspectRatio="none"><path d="M0 139 C70 132 115 124 170 110 C235 94 300 79 350 58 C410 35 455 22 520 6" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M0 139 C70 132 115 124 170 110 C235 94 300 79 350 58 C410 35 455 22 520 6 L520 150 L0 150 Z" fill="url(#fade)" /><defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".16"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs></svg><span className="axis-start">지금</span><span className="axis-end">15년 후</span></div>
          <p>수익률은 보장된 값이 아니라 사용자가 설정한 가정입니다.</p>
        </div>
      </section>

      <section className="trust-strip"><div className="shell"><div><LockKeyhole size={18} /><span><b>서버 전송 없음</b> 입력한 급여와 자산은 브라우저 안에서만 계산합니다.</span></div><div><Eye size={18} /><span><b>계산 근거 공개</b> 모든 결과에서 계산식과 판정 기준을 확인할 수 있습니다.</span></div></div></section>

      <section className="home-section shell">
        <div className="section-lead"><div><p className="eyebrow">ASSET BUILDING</p><h2>자산 형성의 큰 결정을 계산합니다.</h2></div><p>목표, 주거비, 이직, 자동차, 대출과 내 집 마련이 장기 자산에 미치는 영향을 같은 기준으로 확인합니다.</p></div>
        <div className="calculator-cards">{calculators.slice(0,6).map((calculator) => { const Icon = calculator.icon; return <Link href={calculator.href} key={calculator.number} className="calculator-card"><div className="card-top"><span>{calculator.number}</span><Icon size={22} strokeWidth={1.6} /></div><h3>{calculator.title}</h3><p>{calculator.description}</p><div className="card-bottom"><span>{calculator.example}</span><ArrowRight size={18} /></div></Link>; })}</div>
      </section>

      <section className="home-section investment-section shell">
        <div className="section-lead"><div><p className="eyebrow">INVESTMENT MANAGEMENT</p><h2>투자를 비교하고 기록하고 관리합니다.</h2></div><p>목돈 진입 시점, 자산배분, 투자 후보와 실행 기록처럼 감으로 결정하기 쉬운 문제를 숫자와 공개된 규칙으로 바꿉니다.</p></div>
        <div className="calculator-cards">{calculators.slice(6).map((calculator) => { const Icon = calculator.icon; return <Link href={calculator.href} key={calculator.number} className="calculator-card"><div className="card-top"><span>{calculator.number}</span><Icon size={22} strokeWidth={1.6} /></div><h3>{calculator.title}</h3><p>{calculator.description}</p><div className="card-bottom"><span>{calculator.example}</span><ArrowRight size={18} /></div></Link>; })}</div>
      </section>

      <section className="decision-flow">
        <div className="shell">
          <p className="eyebrow">ONE CONNECTED FLOW</p>
          <div className="flow-row"><div><b>1</b><span>목표와 현재 속도를 확인합니다.</span></div><ArrowRight /><div><b>2</b><span>소득과 큰 지출의 차이를 비교합니다.</span></div><ArrowRight /><div><b>3</b><span>남는 돈의 배분을 결정합니다.</span></div></div>
          <p className="flow-conclusion">각 선택을 같은 기간과 수익률로 비교하면 지금 우선해야 할 행동이 더 선명해집니다.</p>
        </div>
      </section>

      <section className="method-section shell">
        <div className="method-statement"><span>연구 원칙</span><h2>미래를 단정하지 않고,<br />가정을 투명하게 공개합니다.</h2></div>
        <div className="principle-list"><div><b>01</b><h3>같은 입력, 같은 결과</h3><p>상황에 따라 달라지는 조언 대신 공개된 공식으로 반복 계산합니다.</p></div><div><b>02</b><h3>확정 금액과 기대 금액 분리</h3><p>기본급과 성과급처럼 확실성이 다른 숫자를 구분하여 계산합니다.</p></div><div><b>03</b><h3>계산의 한계 공개</h3><p>세금, 물가, 시장 변동 등 반영하지 못한 조건도 결과와 함께 안내합니다.</p></div></div>
      </section>

      <section className="guide-preview shell"><div className="section-lead"><div><p className="eyebrow">FIELD NOTES</p><h2>계산 결과를 해석하는 방법</h2></div><Link href="/guides" className="quiet-link">가이드 전체 보기 <ArrowRight size={16} /></Link></div><div className="guide-list"><Link href="/guides/rent-100k-15years"><span>주거비 · 7분</span><h3>월세 10만원 차이가 15년 뒤 자산에 미치는 영향</h3><ArrowRight /></Link><Link href="/guides/base-vs-bonus"><span>이직 · 6분</span><h3>이직할 때 기본급과 성과급을 구분해야 하는 이유</h3><ArrowRight /></Link><Link href="/guides/salary-10m"><span>연봉 · 5분</span><h3>연봉 1,000만원 상승분을 투자했을 때의 장기 효과</h3><ArrowRight /></Link></div></section>
    </main>
  );
}
