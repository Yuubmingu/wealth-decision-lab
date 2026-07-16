"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Info, LockKeyhole } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateCarCost,
  calculateDebtVsInvest,
  calculateGoalStrategy,
  formatMoney,
  formatPeriod,
  type CarCostInputs,
  type DebtVsInvestInputs,
  type GoalAsset,
  type GoalStrategyInputs,
} from "../lib/finance";
import { LegalDisclaimer } from "./SiteChrome";

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
};

function NumberField({ label, value, onChange, unit = "원", hint, min = 0, max, step = 1 }: NumberFieldProps) {
  const money = unit === "원";
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-wrap">
        <input
          inputMode={step < 1 ? "decimal" : "numeric"}
          value={money ? Math.round(value).toLocaleString("ko-KR") : value}
          onChange={(event) => {
            const raw = money
              ? event.target.value.replace(/[^0-9]/g, "")
              : event.target.value.replace(min < 0 ? /[^0-9.-]/g : /[^0-9.]/g, "");
            let next = raw === "" ? 0 : Number(raw);
            if (!Number.isFinite(next)) next = 0;
            if (max !== undefined) next = Math.min(next, max);
            onChange(Math.max(next, min));
          }}
          aria-label={label}
        />
        <span>{unit}</span>
      </span>
      <small>{money && value > 0 ? formatMoney(value) : hint ?? "\u00a0"}</small>
    </label>
  );
}

function PanelHeading({ step, title }: { step: string; title: string }) {
  return <div className="panel-heading"><div><span>{step}</span><h2>{title}</h2></div></div>;
}

function PrivacyNote() {
  return <div className="privacy-note"><LockKeyhole size={17} /><span><b>입력값은 외부로 전송되지 않습니다.</b> 모든 계산은 현재 브라우저 안에서만 처리됩니다.</span></div>;
}

function Kpi({ label, value, tone = "default", sub }: { label: string; value: string; tone?: "default" | "green" | "rust"; sub?: string }) {
  return <div className={`kpi kpi-${tone}`}><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>;
}

function FormulaDetails({ children }: { children: React.ReactNode }) {
  return <details className="formula-details"><summary>계산 근거 보기 <ChevronDown size={16} /></summary><div>{children}</div></details>;
}

function MoneyTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><b>{label}</b>{payload.map((item) => <span key={item.name} style={{ color: item.color }}>{item.name}: {formatMoney(item.value ?? 0)}</span>)}</div>;
}

const goalDefaults: GoalStrategyInputs = {
  assets: [
    { id: "cash", label: "예금·적금", enabled: true, currentValue: 20_000_000, monthlyContribution: 500_000, annualRate: 3 },
    { id: "stock", label: "주식·ETF", enabled: true, currentValue: 25_000_000, monthlyContribution: 600_000, annualRate: 7 },
    { id: "pension", label: "연금·IRP", enabled: true, currentValue: 5_000_000, monthlyContribution: 200_000, annualRate: 5 },
    { id: "realestate", label: "부동산 순자산", enabled: false, currentValue: 0, monthlyContribution: 0, annualRate: 3, monthlyIncome: 0 },
    { id: "crypto", label: "코인", enabled: false, currentValue: 0, monthlyContribution: 0, annualRate: 8 },
    { id: "fx", label: "외화", enabled: false, currentValue: 0, monthlyContribution: 0, annualRate: 2 },
    { id: "gold", label: "금·원자재", enabled: false, currentValue: 0, monthlyContribution: 0, annualRate: 4 },
    { id: "other", label: "기타 자산", enabled: false, currentValue: 0, monthlyContribution: 0, annualRate: 4 },
  ],
  targetAssets: 1_000_000_000,
  targetYears: 15,
};

export function GoalStrategyCalculator() {
  const [input, setInput] = useState(goalDefaults);
  const [result, setResult] = useState(() => calculateGoalStrategy(goalDefaults));
  const [error, setError] = useState("");
  const update = <K extends keyof GoalStrategyInputs>(key: K, value: GoalStrategyInputs[K]) => setInput((current) => ({ ...current, [key]: value }));
  const updateAsset = (id: string, patch: Partial<GoalAsset>) => setInput((current) => ({ ...current, assets: (current.assets ?? []).map((asset) => asset.id === id ? { ...asset, ...patch } : asset) }));
  const calculate = () => {
    if (input.targetAssets <= 0 || input.targetYears <= 0) return setError("목표자산과 목표기간은 0보다 크게 입력해 주세요.");
    if (!input.assets?.some((asset) => asset.enabled)) return setError("계산에 포함할 자산을 하나 이상 선택해 주세요.");
    setError("");
    setResult(calculateGoalStrategy(input));
  };

  return <div className="calculator-grid">
    <section className="input-panel">
      <PanelHeading step="STEP 01 · GOAL" title="목표를 먼저 정하고 현재 투자 속도를 입력하세요" />
      <PrivacyNote />
      <div className="field-section goal-first-section"><h3>1. 목표 설정</h3><div className="field-grid">
        <NumberField label="목표자산" value={input.targetAssets} onChange={(value) => update("targetAssets", value)} />
        <NumberField label="목표기간" value={input.targetYears} onChange={(value) => update("targetYears", value)} unit="년" max={40} />
      </div></div>
      <div className="field-section"><h3>2. 현재 자산과 월 투자 속도</h3></div>
      <div className="asset-planner">
        {(input.assets ?? []).map((asset) => <div className={`asset-row ${asset.enabled ? "is-enabled" : ""}`} key={asset.id}>
          <label className="asset-toggle"><input type="checkbox" checked={asset.enabled} onChange={(event) => updateAsset(asset.id, { enabled: event.target.checked })} /><span>{asset.label}</span><small>{asset.enabled ? "계산 포함" : "해당 없음"}</small></label>
          {asset.enabled && <div className="asset-fields"><NumberField label="현재 평가액" value={asset.currentValue} onChange={(value) => updateAsset(asset.id, { currentValue: value })} /><NumberField label="월 추가금" value={asset.monthlyContribution} onChange={(value) => updateAsset(asset.id, { monthlyContribution: value })} /><NumberField label="연 수익률" value={asset.annualRate} onChange={(value) => updateAsset(asset.id, { annualRate: value })} unit="%" max={30} step={0.1} />{asset.id === "realestate" && <NumberField label="월 순임대소득" value={asset.monthlyIncome ?? 0} onChange={(value) => updateAsset(asset.id, { monthlyIncome: value })} hint="세금·관리비·이자를 뺀 금액" />}</div>}
        </div>)}
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="primary-button" data-testid="goal-calculate" type="button" onClick={calculate}>{input.targetYears}년 목표 전략 계산하기 <ArrowRight size={18} /></button>
    </section>
    <section className="result-panel" aria-live="polite">
      <PanelHeading step="STEP 02 · RESULT" title="목표 달성 전략" />
      <div className="verdict-line"><span>현재 속도 진단</span><strong className="verdict">{result.onTrack ? `${input.targetYears}년 안에 달성 가능` : "월 투자금 보완 필요"}</strong><p>입력한 수익률을 매월 복리로 환산한 시뮬레이션입니다.</p></div>
      <div className="kpi-grid">
        <Kpi label="현재 속도의 목표 시점" value={formatPeriod(result.currentMonths)} />
        <Kpi label={`${input.targetYears}년 뒤 예상자산`} value={formatMoney(result.projectedAtTarget)} tone={result.onTrack ? "green" : "rust"} />
        <Kpi label="목표에 필요한 월 투자금" value={formatMoney(result.requiredMonthlyInvestment)} tone="green" />
      </div>
      <div className="milestone-grid"><div><span>현재 순자산</span><strong>{formatMoney(result.currentAssets)}</strong></div><div><span>월 자산 증가액</span><strong>{formatMoney(result.monthlyInvestment)}</strong></div><div><span>가중평균 수익률</span><strong>연 {result.weightedRate.toFixed(1)}%</strong></div></div>
      <div className="chart-block"><div className="chart-heading"><h3>현재 속도와 목표 속도</h3><span>연말 기준 예상 금융자산</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.chart}><CartesianGrid stroke="#e5e9e5" vertical={false} /><XAxis dataKey="year" tickFormatter={(value) => `${value}년`} /><YAxis tickFormatter={(value) => `${Math.round(value / 100_000_000)}억`} width={38} /><Tooltip content={<MoneyTooltip />} /><Legend /><Line type="monotone" dataKey="current" name="현재 속도" stroke="#747d78" dot={false} strokeWidth={2} /><Line type="monotone" dataKey="required" name="목표 속도" stroke="#145c45" dot={false} strokeWidth={3} /></LineChart></ResponsiveContainer></div></div>
      <div className="scenario-table"><div className="table-row table-head"><span>자산군</span><span>{input.targetYears}년 뒤 예상액</span></div>{result.assetBreakdown.map((asset) => <div className="table-row" key={asset.label}><span>{asset.label}</span><span>{formatMoney(asset.value)}</span></div>)}</div>
      {result.largestShare >= 60 && <div className="warning-strip"><Info size={17} /><span>현재 자산의 {result.largestShare.toFixed(0)}%가 한 자산군에 집중되어 있습니다. 기대수익뿐 아니라 변동성과 현금화 가능성도 함께 확인해 주세요.</span></div>}
      <FormulaDetails><p>필요 월 투자금은 현재자산의 미래가치를 먼저 계산한 뒤, 목표자산에서 부족한 금액을 매월 같은 금액으로 적립한다고 가정해 역산합니다.</p><p>세금, 수수료, 물가와 수익률 변동은 반영하지 않습니다.</p></FormulaDetails>
      <LegalDisclaimer />
    </section>
  </div>;
}

const carDefaults: CarCostInputs = {
  carPrice: 35_000_000, downPayment: 15_000_000, tradeIn: 5_000_000,
  loanRate: 5.5, loanYears: 4, insuranceAnnual: 1_200_000, taxAnnual: 520_000,
  fuelMonthly: 180_000, parkingMonthly: 100_000, maintenanceAnnual: 600_000,
  resaleValue: 12_000_000, holdingYears: 7, annualRate: 6,
  currentAssets: 50_000_000, monthlyInvestment: 1_300_000, targetAssets: 1_000_000_000,
};

export function CarCostCalculator() {
  const [input, setInput] = useState(carDefaults);
  const [result, setResult] = useState(() => calculateCarCost(carDefaults));
  const [error, setError] = useState("");
  const update = <K extends keyof CarCostInputs>(key: K, value: CarCostInputs[K]) => setInput((current) => ({ ...current, [key]: value }));
  const calculate = () => {
    if (input.carPrice <= 0 || input.holdingYears <= 0 || input.loanYears <= 0) return setError("차량 가격과 기간은 0보다 크게 입력해 주세요.");
    if (input.downPayment > input.carPrice) return setError("선수금은 차량 가격보다 클 수 없습니다.");
    if (input.resaleValue > input.carPrice) return setError("예상 중고차 가치는 차량 가격보다 클 수 없습니다.");
    setError("");
    setResult(calculateCarCost(input));
  };

  return <div className="calculator-grid">
    <section className="input-panel">
      <PanelHeading step="STEP 01 · INPUT" title="차량 구매와 보유 조건을 입력하세요" />
      <PrivacyNote />
      <div className="field-section"><h3>구매와 할부</h3><div className="field-grid">
        <NumberField label="차량 가격" value={input.carPrice} onChange={(value) => update("carPrice", value)} />
        <NumberField label="선수금" value={input.downPayment} onChange={(value) => update("downPayment", value)} />
        <NumberField label="기존 차량 처분액" value={input.tradeIn} onChange={(value) => update("tradeIn", value)} />
        <NumberField label="할부 금리" value={input.loanRate} onChange={(value) => update("loanRate", value)} unit="%" max={30} step={0.1} />
        <NumberField label="할부 기간" value={input.loanYears} onChange={(value) => update("loanYears", value)} unit="년" max={10} />
        <NumberField label="보유 기간" value={input.holdingYears} onChange={(value) => update("holdingYears", value)} unit="년" max={15} />
      </div></div>
      <div className="field-section"><h3>보유 비용</h3><div className="field-grid">
        <NumberField label="연 보험료" value={input.insuranceAnnual} onChange={(value) => update("insuranceAnnual", value)} />
        <NumberField label="연 자동차세" value={input.taxAnnual} onChange={(value) => update("taxAnnual", value)} />
        <NumberField label="월 유류비" value={input.fuelMonthly} onChange={(value) => update("fuelMonthly", value)} />
        <NumberField label="월 주차비" value={input.parkingMonthly} onChange={(value) => update("parkingMonthly", value)} />
        <NumberField label="연 정비비" value={input.maintenanceAnnual} onChange={(value) => update("maintenanceAnnual", value)} />
        <NumberField label="예상 중고차 가치" value={input.resaleValue} onChange={(value) => update("resaleValue", value)} />
      </div></div>
      <div className="field-section"><h3>차를 사지 않았을 때의 투자 가정</h3><div className="field-grid">
        <NumberField label="현재 금융자산" value={input.currentAssets} onChange={(value) => update("currentAssets", value)} />
        <NumberField label="월 투자 가능액" value={input.monthlyInvestment} onChange={(value) => update("monthlyInvestment", value)} />
        <NumberField label="목표자산" value={input.targetAssets} onChange={(value) => update("targetAssets", value)} />
        <NumberField label="연평균 수익률" value={input.annualRate} onChange={(value) => update("annualRate", value)} unit="%" max={20} step={0.1} />
      </div></div>
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="primary-button" data-testid="car-calculate" type="button" onClick={calculate}>자동차의 총비용과 기회비용 계산하기 <ArrowRight size={18} /></button>
    </section>
    <section className="result-panel" aria-live="polite">
      <PanelHeading step="STEP 02 · RESULT" title="자동차의 실제 자산비용" />
      <div className="verdict-line"><span>{input.holdingYears}년 보유기간의 기회비용</span><strong className="verdict">{formatMoney(result.opportunityCost15)}</strong><p>차량을 사지 않고 초기비용과 매월 유지비를 같은 기간 투자했을 때의 미래가치입니다.</p></div>
      <div className="kpi-grid">
        <Kpi label="월 할부금" value={formatMoney(result.loanPayment)} />
        <Kpi label="할부기간 월 부담" value={formatMoney(result.runningCostFirstMonth)} tone="rust" sub="할부금 + 월평균 보유비" />
        <Kpi label={`${input.holdingYears}년 총소유비용`} value={formatMoney(result.totalOwnershipCost)} />
      </div>
      <div className="milestone-grid"><div><span>초기 현금 지출</span><strong>{formatMoney(result.upfrontCash)}</strong></div><div><span>총 할부이자</span><strong>{formatMoney(result.loanInterest)}</strong></div><div><span>목표자산 지연</span><strong>{formatPeriod(result.delayedMonths)}</strong></div></div>
      <div className="chart-block"><div className="chart-heading"><h3>총소유비용 구성</h3><span>중고차 처분가 반영</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={result.costBreakdown} layout="vertical" margin={{ left: 16 }}><CartesianGrid stroke="#e5e9e5" horizontal={false} /><XAxis type="number" tickFormatter={(value) => `${Math.round(value / 10_000)}만`} /><YAxis type="category" dataKey="name" width={92} /><Tooltip content={<MoneyTooltip />} /><Bar dataKey="value" name="비용" fill="#145c45" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></div>
      <div className="warning-strip"><Info size={17} /><span>차량이 만들어 주는 시간 절약, 업무 기회와 생활 만족도는 금액으로 환산하지 않았습니다. 결과와 함께 비금전적 편익도 별도로 비교해 주세요.</span></div>
      <FormulaDetails><p>총소유비용 = 초기 현금 지출 + 할부 원금·이자 + 보유기간 운영비 − 예상 중고차 가치입니다.</p><p>기회비용은 차량을 사지 않았다고 가정하고 초기 지출과 매월 차량비를 입력한 보유기간 동안 투자한 미래가치에서 중고차 처분가의 미래가치를 차감합니다.</p></FormulaDetails>
      <LegalDisclaimer />
    </section>
  </div>;
}

const debtDefaults: DebtVsInvestInputs = {
  loanBalance: 150_000_000, loanRate: 4.5, remainingYears: 20,
  prepaymentAmount: 30_000_000, prepaymentFeeRate: 0.8, monthlyExtra: 500_000,
  expectedReturn: 6, pessimisticReturn: -5, optimisticReturn: 10,
  monthlyIncome: 5_000_000, fixedExpenses: 3_000_000, currentCash: 60_000_000,
  emergencyMonths: 6, taxRate: 15.4, maxLossRate: 30, horizonYears: 15,
};

export function DebtVsInvestCalculator() {
  const [input, setInput] = useState(debtDefaults);
  const [result, setResult] = useState(() => calculateDebtVsInvest(debtDefaults));
  const [error, setError] = useState("");
  const update = <K extends keyof DebtVsInvestInputs>(key: K, value: DebtVsInvestInputs[K]) => setInput((current) => ({ ...current, [key]: value }));
  const calculate = () => {
    if (input.loanBalance <= 0 || input.remainingYears <= 0 || input.horizonYears <= 0) return setError("대출 잔액과 기간은 0보다 크게 입력해 주세요.");
    if (input.prepaymentAmount > input.loanBalance) return setError("중도상환액은 대출 잔액보다 클 수 없습니다.");
    setError("");
    setResult(calculateDebtVsInvest(input));
  };
  const verdictText = useMemo(() => result.verdict === "투자 우세" ? "같은 가정에서는 투자가 앞섭니다" : result.verdict === "상환 우세" ? "같은 가정에서는 상환이 앞섭니다" : "두 선택의 차이가 크지 않습니다", [result.verdict]);

  return <div className="calculator-grid">
    <section className="input-panel">
      <PanelHeading step="STEP 01 · INPUT" title="대출과 여유자금 조건을 입력하세요" />
      <PrivacyNote />
      <div className="field-section"><h3>현재 대출</h3><div className="field-grid">
        <NumberField label="대출 잔액" value={input.loanBalance} onChange={(value) => update("loanBalance", value)} />
        <NumberField label="대출 금리" value={input.loanRate} onChange={(value) => update("loanRate", value)} unit="%" max={30} step={0.1} />
        <NumberField label="남은 상환기간" value={input.remainingYears} onChange={(value) => update("remainingYears", value)} unit="년" max={40} />
        <NumberField label="중도상환수수료" value={input.prepaymentFeeRate} onChange={(value) => update("prepaymentFeeRate", value)} unit="%" max={5} step={0.1} />
      </div></div>
      <div className="field-section"><h3>현금흐름과 안전판</h3><div className="field-grid">
        <NumberField label="세후 월소득" value={input.monthlyIncome} onChange={(value) => update("monthlyIncome", value)} />
        <NumberField label="월 고정지출" value={input.fixedExpenses} onChange={(value) => update("fixedExpenses", value)} />
        <NumberField label="현재 현금성 자산" value={input.currentCash} onChange={(value) => update("currentCash", value)} />
        <NumberField label="목표 비상자금" value={input.emergencyMonths} onChange={(value) => update("emergencyMonths", value)} unit="개월" max={24} />
      </div></div>
      <div className="field-section"><h3>비교할 선택</h3><div className="field-grid">
        <NumberField label="지금 사용할 목돈" value={input.prepaymentAmount} onChange={(value) => update("prepaymentAmount", value)} />
        <NumberField label="월 추가 여유자금" value={input.monthlyExtra} onChange={(value) => update("monthlyExtra", value)} />
        <NumberField label="투자 기대수익률" value={input.expectedReturn} onChange={(value) => update("expectedReturn", value)} unit="%" max={20} step={0.1} />
        <NumberField label="투자 부진 수익률" value={input.pessimisticReturn} onChange={(value) => update("pessimisticReturn", value)} unit="%" min={-50} max={20} step={0.1} />
        <NumberField label="투자 호조 수익률" value={input.optimisticReturn} onChange={(value) => update("optimisticReturn", value)} unit="%" max={30} step={0.1} />
        <NumberField label="수익 과세 가정" value={input.taxRate} onChange={(value) => update("taxRate", value)} unit="%" max={50} step={0.1} />
        <NumberField label="감내 가능한 손실" value={input.maxLossRate} onChange={(value) => update("maxLossRate", value)} unit="%" max={100} />
        <NumberField label="비교 기간" value={input.horizonYears} onChange={(value) => update("horizonYears", value)} unit="년" max={30} />
      </div></div>
      <div className="preset-row"><span>기대수익률 빠른 설정</span>{[3, 6, 9].map((rate) => <button type="button" className={input.expectedReturn === rate ? "active" : ""} key={rate} onClick={() => update("expectedReturn", rate)}>{rate}%</button>)}</div>
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="primary-button" data-testid="debt-calculate" type="button" onClick={calculate}>상환과 투자 결과 비교하기 <ArrowRight size={18} /></button>
    </section>
    <section className="result-panel" aria-live="polite">
      <PanelHeading step="STEP 02 · RESULT" title="같은 현금흐름으로 비교한 결과" />
      <div className="verdict-line"><span>비교 결론</span><strong className="verdict">{verdictText}</strong><p>{input.horizonYears}년 뒤 순자산 기준 · 투자 기대수익률 연 {input.expectedReturn}%</p></div>
      <div className="kpi-grid">
        <Kpi label="상환 우선 순자산" value={formatMoney(result.repayNetWorth)} tone={result.verdict === "상환 우세" ? "green" : "default"} />
        <Kpi label="투자 우선 순자산" value={formatMoney(result.investNetWorth)} tone={result.verdict === "투자 우세" ? "green" : "default"} />
        <Kpi label="투자 기준 차이" value={formatMoney(result.difference)} tone={result.difference >= 0 ? "green" : "rust"} sub="양수는 투자 우세, 음수는 상환 우세" />
      </div>
      <div className="milestone-grid"><div><span>상환 시 절감 이자</span><strong>{formatMoney(result.interestSaved)}</strong></div><div><span>상환 우선 완납 시점</span><strong>{formatPeriod(result.repayPayoffMonth)}</strong></div><div><span>손익분기 기대수익률</span><strong>{result.breakEvenReturn === null ? "20% 초과" : `연 ${result.breakEvenReturn}%`}</strong></div></div>
      <div className="decision-dashboard"><div><span>대출 상환의 확정효과</span><strong>연 {result.guaranteedReturn.toFixed(1)}%</strong><small>세금 없는 이자 절감 기준</small></div><div className={result.reserveGap >= 0 ? "safe" : "danger"}><span>상환 후 비상자금</span><strong>{result.cashMonthsAfterRepay.toFixed(1)}개월</strong><small>{result.reserveGap >= 0 ? `목표보다 ${formatMoney(result.reserveGap)} 여유` : `목표보다 ${formatMoney(Math.abs(result.reserveGap))} 부족`}</small></div><div><span>투자 손실 감내액</span><strong>{formatMoney(result.downsideLoss)}</strong><small>목돈의 {input.maxLossRate}% 하락 가정</small></div></div>
      <div className="chart-block"><div className="chart-heading"><h3>두 선택의 순자산 변화</h3><span>금융자산 − 남은 대출</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.chart}><CartesianGrid stroke="#e5e9e5" vertical={false} /><XAxis dataKey="year" tickFormatter={(value) => `${value}년`} /><YAxis tickFormatter={(value) => `${Math.round(value / 100_000_000)}억`} width={38} /><Tooltip content={<MoneyTooltip />} /><Legend /><Line type="monotone" dataKey="repay" name="상환 우선" stroke="#145c45" dot={false} strokeWidth={3} /><Line type="monotone" dataKey="invest" name="투자 우선" stroke="#c6532f" dot={false} strokeWidth={2} /></LineChart></ResponsiveContainer></div></div>
      <div className="warning-strip"><Info size={17} /><span>대출이자 절감은 확정 효과에 가깝지만 투자수익률은 변동합니다. 두 값이 비슷하면 수익률보다 비상자금, 소득 안정성과 심리적 부담을 우선 확인해 주세요.</span></div>
      <div className="scenario-table"><div className="table-row table-head"><span>투자 시나리오</span><span>투자−상환 순자산 차이</span></div>{result.scenarios.map((scenario) => <div className="table-row" key={scenario.label}><span>{scenario.label} · 연 {scenario.rate}%</span><span>{formatMoney(scenario.difference)}</span></div>)}</div>
      <FormulaDetails><p>두 선택 모두 같은 목돈과 월 여유자금을 사용합니다. 투자 우선은 해당 금액을 투자하고, 상환 우선은 대출 원금을 줄인 뒤 완납 후의 기존 상환액을 투자합니다.</p><p>원리금균등상환을 가정하며 세금, 투자 수수료, 금리 변동과 대출공제는 반영하지 않습니다.</p></FormulaDetails>
      <LegalDisclaimer />
    </section>
  </div>;
}
