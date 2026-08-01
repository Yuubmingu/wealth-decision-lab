import Link from "next/link";
import { ArrowUpRight, FlaskConical, Menu } from "lucide-react";

const navigationItems = [
  { href: "/calculators/goal-assets", label: "목표" },
  { href: "/calculators/rent-fire", label: "월세" },
  { href: "/calculators/job-offer", label: "이직" },
  { href: "/calculators/car-cost", label: "자동차" },
  { href: "/calculators/debt-vs-invest", label: "대출" },
  { href: "/calculators/home-purchase", label: "내 집" },
  { href: "/calculators/investment-compare", label: "투자 비교" },
  { href: "/calculators/lump-sum-vs-dca", label: "분할매수" },
  { href: "/calculators/rebalancing", label: "리밸런싱" },
  { href: "/tools/decision-journal", label: "주식 기록장" },
  { href: "/invest/quant-backtest", label: "백테스트" },
  { href: "/tools/growth-board", label: "실행보드" },
  { href: "/guides", label: "가이드" },
  { href: "/about", label: "소개" },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="부자 회사원의 의사결정 연구소 홈">
          <span className="brand-mark"><FlaskConical size={18} strokeWidth={1.8} /></span>
          <span>부자 회사원의<br />의사결정 연구소</span>
        </Link>
        <nav aria-label="주요 메뉴" className="main-nav desktop-nav">
          {navigationItems.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <details className="mobile-nav">
          <summary><Menu size={19} aria-hidden="true" /> 메뉴</summary>
          <nav aria-label="모바일 주요 메뉴">
            {navigationItems.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
        </details>
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
    <aside className="disclaimer-box" aria-label="계산 결과 이용 안내">
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
    <section className="page-intro shell" aria-labelledby="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="page-title">{title}</h1>
      <p>{description}</p>
    </section>
  );
}
