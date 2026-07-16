import Link from "next/link";
import { ArrowUpRight, FlaskConical } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="부자 회사원의 의사결정 연구소 홈">
          <span className="brand-mark"><FlaskConical size={18} strokeWidth={1.8} /></span>
          <span>부자 회사원의<br />의사결정 연구소</span>
        </Link>
        <nav aria-label="주요 메뉴" className="main-nav">
          <Link href="/calculators/goal-assets">목표</Link>
          <Link href="/calculators/rent-fire">월세</Link>
          <Link href="/calculators/job-offer">이직</Link>
          <Link href="/calculators/car-cost">자동차</Link>
          <Link href="/calculators/debt-vs-invest">대출</Link>
          <Link href="/calculators/home-purchase">내 집</Link>
          <Link href="/calculators/investment-compare">투자 비교</Link>
          <Link href="/calculators/lump-sum-vs-dca">분할매수</Link>
          <Link href="/calculators/rebalancing">리밸런싱</Link>
          <Link href="/tools/decision-journal">주식 기록장</Link>
          <Link href="/invest/quant-backtest">백테스트</Link>
          <Link href="/tools/growth-board">실행보드</Link>
          <Link href="/guides">가이드</Link>
          <Link href="/about">소개</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <p className="footer-brand">부자 회사원의 의사결정 연구소</p>
          <p className="footer-copy">같은 숫자에는 같은 공식으로.<br />선택의 장기 비용을 투명하게 계산합니다.</p>
        </div>
        <div className="footer-links">
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/disclaimer">금융정보 면책</Link>
          <Link href="/contact">문의</Link>
        </div>
        <div className="footer-note">
          <span>브라우저 안에서만 계산</span>
          <ArrowUpRight size={16} />
        </div>
      </div>
      <div className="shell footer-bottom">© 2026 Wealth Decision Lab. 투자 권유가 아닌 시뮬레이션 도구입니다.</div>
    </footer>
  );
}

export function AdPlaceholder({ label = "광고 준비 영역" }: { label?: string }) {
  return <div className="ad-placeholder" aria-hidden="true"><span>{label}</span></div>;
}

export function LegalDisclaimer() {
  return (
    <aside className="disclaimer-box">
      <strong>계산 결과를 보기 전에</strong>
      <p>본 계산 결과는 사용자가 입력한 가정에 따른 단순 시뮬레이션입니다. 미래 수익률, 세금, 물가, 수수료, 시장 변동, 실제 소득을 보장하지 않습니다. 본 사이트는 투자, 세무, 법률 또는 이직 결정을 대신하지 않습니다.</p>
    </aside>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-intro shell">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
