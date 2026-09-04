import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CarFront,
  ChartPie,
  Coins,
  Eye,
  Home as HouseIcon,
  LockKeyhole,
  Scale,
  Sigma,
  Target,
} from "lucide-react";
import { pageUrl } from "../seo";

const title = "Wealth Decision Lab";
const description =
  "Free calculators that show how housing, career, car, debt, and investment decisions may affect long-term wealth under transparent assumptions.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/en/",
    languages: {
      "ko-KR": "/",
      "en": "/en/",
      "x-default": "/",
    },
  },
  openGraph: {
    title,
    description,
    url: "/en/",
    siteName: title,
    type: "website",
    locale: "en_US",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

const calculators = [
  {
    number: "01",
    icon: Target,
    title: "Target Wealth Planner",
    description:
      "Estimate when your current investing pace may reach a target and how much you would need to invest each month to reach it within 15 years.",
    href: "/calculators/goal-assets",
    example: "Monthly investment required for a 15-year goal",
  },
  {
    number: "02",
    icon: Building2,
    title: "Rent Savings & Wealth",
    description:
      "See how investing monthly rent savings could compound over 5, 10, and 15 years and change the date you reach your target.",
    href: "/calculators/rent-fire",
    example: "KRW 300,000 saved each month over 15 years",
  },
  {
    number: "03",
    icon: BriefcaseBusiness,
    title: "Job Offer Comparison",
    description:
      "Compare base pay, probability-weighted bonuses, and work-related costs to estimate the practical value of a new job offer.",
    href: "/calculators/job-offer",
    example: "Compare disposable income, not headline salary",
  },
  {
    number: "04",
    icon: CarFront,
    title: "Car Cost Calculator",
    description:
      "Combine purchase price, financing, ownership costs, resale value, and the investment opportunity cost of buying a car.",
    href: "/calculators/car-cost",
    example: "Seven-year ownership and opportunity cost",
  },
  {
    number: "05",
    icon: Scale,
    title: "Repay Debt or Invest?",
    description:
      "After protecting an emergency fund, compare the guaranteed interest saved by repayment with several investment scenarios.",
    href: "/calculators/debt-vs-invest",
    example: "Guaranteed savings versus uncertain returns",
  },
  {
    number: "06",
    icon: HouseIcon,
    title: "Home Purchase Cash Planner",
    description:
      "Estimate the cash needed for a South Korean home purchase, including lending limits, taxes, and related transaction costs.",
    href: "/calculators/home-purchase",
    example: "Loan limits, taxes, and closing costs",
  },
  {
    number: "INV 01",
    icon: Coins,
    title: "Lump Sum vs. DCA",
    description:
      "Compare investing at once with spreading purchases over 3, 6, 12, or 24 months under three simple market paths.",
    href: "/calculators/lump-sum-vs-dca",
    example: "Rising, immediate-drop, and delayed-drop paths",
  },
  {
    number: "INV 02",
    icon: ChartPie,
    title: "Portfolio Rebalancing",
    description:
      "Calculate new contributions or trades needed to move a portfolio back toward its target weights.",
    href: "/calculators/rebalancing",
    example: "Contribution-only and buy/sell plans",
  },
  {
    number: "LAB",
    icon: Scale,
    title: "Investment Candidate Lab",
    description:
      "Compare up to three candidates by expected return, downside, cash flow, liquidity, and execution difficulty.",
    href: "/calculators/investment-compare",
    example: "Include the option of not investing",
  },
  {
    number: "LAB 02",
    icon: Eye,
    title: "Stock Decision Journal",
    description:
      "Record valuation, three-year operating trends, cash flow, and financial safety, then compare the original thesis with the actual outcome.",
    href: "/tools/decision-journal",
    example: "Stored locally in your browser with JSON export",
  },
  {
    number: "LAB 03",
    icon: BarChart3,
    title: "Quant Backtest",
    description:
      "Test transparent quantitative rules against historical data while separating publish dates from future information.",
    href: "/invest/quant-backtest",
    example: "CAGR, drawdown, and trade history",
  },
  {
    number: "LAB 04",
    icon: Sigma,
    title: "Wealth Action Board",
    description:
      "Compare the estimated long-term effects of earning more, saving, investing, repaying debt, and building a side income.",
    href: "/tools/growth-board",
    example: "Put different actions on the same timeline",
  },
];

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: pageUrl("/en"),
  inLanguage: "en",
};

const serializedWebsiteSchema = JSON.stringify(websiteSchema).replace(/</g, "\\u003c");

export default function EnglishHome() {
  return (
    <main lang="en">
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">WEALTH DECISION LAB · SOUTH KOREA</p>
          <h1>
            Turn today&apos;s choice into its
            <br />
            <em>long-term wealth impact.</em>
          </h1>
          <p className="hero-description">
            Compare major decisions about housing, career, cars, debt, and investing
            with consistent formulas and assumptions you can inspect.
          </p>
          <div className="hero-actions">
            <a href="#calculators" className="primary-link">
              Explore calculators <ArrowRight size={18} />
            </a>
            <a href="#english-access" className="quiet-link">
              Read before using
            </a>
          </div>
        </div>
        <div className="hero-figure" aria-label="Example: invest KRW 300,000 monthly at an assumed annual return of 6 percent for 15 years">
          <div className="figure-top"><span>ASSUMPTION TEST 001</span><Sigma size={20} /></div>
          <div className="figure-equation"><span>KRW 300K/mo</span><i>×</i><span>15 years</span><i>@</i><span>6%/yr</span></div>
          <div className="figure-result"><span>Estimated future value</span><strong>About KRW 86.1M</strong><small>Contributions KRW 54M · estimated growth KRW 32.1M</small></div>
          <div className="mini-chart" aria-hidden="true"><svg viewBox="0 0 520 150" preserveAspectRatio="none"><path d="M0 139 C70 132 115 124 170 110 C235 94 300 79 350 58 C410 35 455 22 520 6" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M0 139 C70 132 115 124 170 110 C235 94 300 79 350 58 C410 35 455 22 520 6 L520 150 L0 150 Z" fill="url(#english-fade)" /><defs><linearGradient id="english-fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".16"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs></svg><span className="axis-start">Today</span><span className="axis-end">Year 15</span></div>
          <p>Returns are user assumptions, not promises or forecasts.</p>
        </div>
      </section>

      <section className="trust-strip" id="english-access">
        <div className="shell">
          <div><LockKeyhole size={18} /><span><b>English access is in beta.</b> This overview is written in English; calculator interfaces and detailed sources are currently in Korean.</span></div>
          <div><Eye size={18} /><span><b>South Korean rules.</b> Currency, taxes, lending limits, and policy assumptions refer to South Korea unless explicitly stated otherwise.</span></div>
        </div>
      </section>

      <section className="home-section shell" id="calculators">
        <div className="section-lead">
          <div><p className="eyebrow">DECISION CALCULATORS</p><h2>Spend less time assembling the calculation.</h2></div>
          <p>Open a calculator below, then use your browser&apos;s built-in &ldquo;Translate to English&rdquo; command if needed. Safari shows it in the address bar; Chrome and Edge show it in the page menu or right-click menu.</p>
        </div>
        <div className="calculator-cards">
          {calculators.map((calculator) => {
            const Icon = calculator.icon;
            return (
              <Link href={calculator.href} key={calculator.number} className="calculator-card" hrefLang="ko">
                <div className="card-top"><span>{calculator.number}</span><Icon size={22} strokeWidth={1.6} /></div>
                <h3>{calculator.title}</h3>
                <p>{calculator.description}</p>
                <div className="card-bottom"><span>{calculator.example} · Korean UI</span><ArrowRight size={18} /></div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="decision-flow" id="method">
        <div className="shell">
          <p className="eyebrow">ONE CONNECTED FLOW</p>
          <div className="flow-row"><div><b>1</b><span>Check your goal and current pace.</span></div><ArrowRight /><div><b>2</b><span>Compare income and major expenses.</span></div><ArrowRight /><div><b>3</b><span>Decide how to allocate the remaining cash.</span></div></div>
          <p className="flow-conclusion">Using the same timeline and return assumptions makes competing choices easier to compare.</p>
        </div>
      </section>

      <section className="method-section shell">
        <div className="method-statement"><span>Method</span><h2>We do not predict the future.<br />We make assumptions visible.</h2></div>
        <div className="principle-list">
          <div><b>01</b><h3>Same inputs, same result</h3><p>Published formulas replace advice that changes from one situation to another.</p></div>
          <div><b>02</b><h3>Separate certainty from expectation</h3><p>Guaranteed amounts and probability-weighted amounts are shown separately.</p></div>
          <div><b>03</b><h3>Show what is missing</h3><p>Each result explains important taxes, inflation, fees, or market risks that the model does not capture.</p></div>
        </div>
      </section>

      <section className="guide-preview shell">
        <div className="section-lead"><div><p className="eyebrow">IMPORTANT</p><h2>Use the output as a scenario, not a recommendation.</h2></div></div>
        <p className="hero-description">These tools do not provide investment, tax, legal, lending, or employment advice. Verify current rules and personal eligibility with the relevant institution or a qualified professional before signing a contract or filing a return.</p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializedWebsiteSchema }} />
    </main>
  );
}
