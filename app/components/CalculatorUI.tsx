"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  Eraser,
  Info,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
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
  calculateJobOffer,
  calculateRentFire,
  formatMoney,
  formatPeriod,
  type JobOfferInputs,
  type RentInputs,
} from "../lib/finance";
import { EditableNumberInput } from "./EditableNumberInput";
import { InputModeSwitch, QuickAssumptionNote, QuickEstimateNotice, type InputMode } from "./InputModeSwitch";
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

function NumberField({
  label,
  value,
  onChange,
  unit = "원",
  hint,
  min = 0,
  max,
  step = 1,
}: NumberFieldProps) {
  const isMoney = unit === "원";
  const helper = isMoney && value > 0 ? formatMoney(value) : hint;

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-wrap">
        <EditableNumberInput
          value={value}
          onValueChange={onChange}
          min={min}
          max={max}
          decimalPlaces={!isMoney && step < 1 ? 2 : 0}
          format={isMoney ? "money" : "plain"}
          aria-label={label}
        />
        <span>{unit}</span>
      </span>
      {helper && <small>{helper}</small>}
    </label>
  );
}

function RangeField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = "%",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <label className="range-field">
      <span><b>{label}</b><strong>{value}{suffix}</strong></span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Kpi({ label, value, tone = "default", sub }: { label: string; value: string; tone?: "default" | "green" | "rust"; sub?: string }) {
  return (
    <div className={`kpi kpi-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function parseStorageEnvelope(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { expiresAt?: unknown; data?: unknown };
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      typeof parsed.expiresAt !== "number" || !Number.isFinite(parsed.expiresAt) ||
      parsed.expiresAt <= Date.now() || !parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
      return null;
    }
    return parsed as { expiresAt: number; data: Record<string, unknown> };
  } catch {
    return null;
  }
}

function StorageControl({ storageKey, inputs }: { storageKey: string; inputs: unknown }) {
  const [enabled, setEnabled] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [storageError, setStorageError] = useState("");
  const consentKey = `${storageKey}:enabled`;

  useEffect(() => {
    // Browser storage is unavailable during server rendering, so hydrate this opt-in state after mount.
    const timer = window.setTimeout(() => {
      try {
        const optedIn = window.localStorage.getItem(consentKey) === "true";
        const envelope = parseStorageEnvelope(window.localStorage.getItem(storageKey));
        if (optedIn && envelope) setEnabled(true);
        else {
          window.localStorage.removeItem(storageKey);
          window.localStorage.removeItem(consentKey);
          setEnabled(false);
        }
        window.localStorage.removeItem("wdl-save-enabled");
      } catch {
        setEnabled(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [consentKey, storageKey]);

  useEffect(() => {
    if (enabled) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({
          version: 1,
          expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1_000,
          data: inputs,
        }));
      } catch {
        window.setTimeout(() => {
          try {
            window.localStorage.removeItem(storageKey);
            window.localStorage.removeItem(consentKey);
          } catch {
            // Storage may remain unavailable; the in-memory calculator still works.
          }
          setEnabled(false);
          setStorageError("브라우저가 기기 저장을 허용하지 않아 저장 기능을 껐습니다.");
        }, 0);
      }
    }
  }, [consentKey, enabled, inputs, storageKey]);

  return (
    <div className="storage-control">
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            const nextEnabled = event.target.checked;
            setStorageError("");
            try {
              if (nextEnabled) {
                // Write the expiring payload first so a consent flag is never left without data.
                window.localStorage.setItem(storageKey, JSON.stringify({
                  version: 1,
                  expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1_000,
                  data: inputs,
                }));
                window.localStorage.setItem(consentKey, "true");
              } else {
                window.localStorage.removeItem(storageKey);
                window.localStorage.removeItem(consentKey);
              }
              setEnabled(nextEnabled);
            } catch {
              try {
                window.localStorage.removeItem(storageKey);
                window.localStorage.removeItem(consentKey);
              } catch {
                // Storage may be completely unavailable.
              }
              setEnabled(false);
              setStorageError("브라우저가 기기 저장을 허용하지 않습니다.");
            }
          }}
        />
        이 계산기 입력값을 이 기기에 90일간 저장
      </label>
      <button
        type="button"
        className="text-button"
        onClick={() => {
          setStorageError("");
          try {
            for (const key of ["wdl-rent", "wdl-job"]) {
              window.localStorage.removeItem(key);
              window.localStorage.removeItem(`${key}:enabled`);
            }
            setEnabled(false);
            setCleared(true);
            window.setTimeout(() => setCleared(false), 1800);
          } catch {
            setStorageError("브라우저 설정에서 이 사이트의 저장 데이터를 직접 삭제해 주세요.");
          }
        }}
      >
        {cleared ? <Check size={15} /> : <Eraser size={15} />}
        {cleared ? "삭제됨" : "계산기 저장값 전체 삭제"}
      </button>
      {storageError ? <small role="status">{storageError}</small> : null}
    </div>
  );
}

function ResultActions({ title, lines }: { title: string; lines: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copyResult() {
    await navigator.clipboard.writeText([title, ...lines, "※ 입력 가정에 따른 단순 시뮬레이션입니다."].join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function saveImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#F5F6F2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#145C45";
    context.fillRect(0, 0, 24, canvas.height);
    context.fillStyle = "#171B19";
    context.font = "600 34px sans-serif";
    context.fillText("부자 회사원의 의사결정 연구소", 72, 82);
    context.font = "700 52px sans-serif";
    context.fillText(title, 72, 170);
    lines.slice(0, 4).forEach((line, index) => {
      context.font = index === 0 ? "700 38px sans-serif" : "500 30px sans-serif";
      context.fillStyle = index === 0 ? "#145C45" : "#4F5954";
      context.fillText(line, 72, 260 + index * 66);
    });
    context.font = "400 22px sans-serif";
    context.fillStyle = "#747D78";
    context.fillText("입력한 가정에 따른 단순 시뮬레이션 · 투자 권유가 아닙니다", 72, 570);
    const anchor = document.createElement("a");
    anchor.download = `${title.replaceAll(" ", "-")}.png`;
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
  }

  return (
    <div className="result-actions">
      <button type="button" className="secondary-button" onClick={copyResult}>
        {copied ? <Check size={17} /> : <Clipboard size={17} />}
        {copied ? "복사됨" : "결과 요약 복사"}
      </button>
      <button type="button" className="secondary-button" onClick={saveImage}>
        <Download size={17} /> 결과 카드 저장
      </button>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="privacy-note"><LockKeyhole size={17} /><span><b>입력값은 외부로 전송되지 않습니다.</b> 모든 계산은 현재 사용 중인 브라우저 안에서만 처리됩니다.</span></div>
  );
}

function FormulaDetails({ children }: { children: React.ReactNode }) {
  return (
    <details className="formula-details">
      <summary>계산 근거 보기 <ChevronDown size={16} /></summary>
      <div>{children}</div>
    </details>
  );
}

function loadSaved<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    if (window.localStorage.getItem(`${key}:enabled`) !== "true") return fallback;
    const envelope = parseStorageEnvelope(window.localStorage.getItem(key));
    if (!envelope) {
      window.localStorage.removeItem(key);
      window.localStorage.removeItem(`${key}:enabled`);
      return fallback;
    }
    return { ...fallback, ...(envelope.data as Partial<T>) };
  } catch {
    try {
      window.localStorage.removeItem(key);
      window.localStorage.removeItem(`${key}:enabled`);
    } catch {
      // Storage may be blocked; the calculator still works with defaults.
    }
    return fallback;
  }
}

const rentDefaults: RentInputs = {
  monthlyIncome: 4_000_000,
  rent: 1_100_000,
  maintenance: 0,
  parking: 0,
  alternativeHousing: 700_000,
  currentAssets: 50_000_000,
  monthlyInvestment: 1_300_000,
  targetAssets: 1_000_000_000,
  annualRate: 6,
  investRate: 100,
  maxYears: 60,
};

export function RentFireCalculator() {
  const [input, setInput] = useState(rentDefaults);
  const [inputMode, setInputMode] = useState<InputMode>("quick");
  const [result, setResult] = useState(() => calculateRentFire(rentDefaults));
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = loadSaved("wdl-rent", rentDefaults);
    // Intentional hydration from optional device-local storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInput(saved);
    setResult(calculateRentFire(saved));
  }, []);

  function update<K extends keyof RentInputs>(key: K, value: RentInputs[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function calculate() {
    if (input.monthlyIncome <= 0) return setError("세후 월소득은 0원보다 큰 값으로 입력해 주세요.");
    if (input.annualRate < 0 || input.annualRate > 20) return setError("기대수익률은 0~20% 범위로 입력해 주세요.");
    setError("");
    setResult(calculateRentFire(input));
  }

  const summary = [
    `월세 절약 후 추가 투자액 ${formatMoney(result.additionalInvestment)}`,
    `15년 뒤 늘어나는 자산 ${formatMoney(result.milestones.find((item) => item.years === 15)?.value ?? 0)}`,
    `목표자산 도달 단축 ${formatPeriod(result.shortenedMonths)}`,
  ];

  return (
    <div className="calculator-grid">
      <section className="input-panel" aria-label="월세 절약 자산증가 계산기 입력">
        <div className="panel-heading"><div><span>STEP 01</span><h2>현재 월세와 절약 가능한 금액을 입력해 주세요</h2></div><ShieldCheck size={22} /></div>
        <PrivacyNote />
        <InputModeSwitch mode={inputMode} onChange={setInputMode} quickDescription="현재 월세와 줄일 주거비, 자산 목표만 입력해 절약 효과를 바로 확인합니다." />
        <div className="field-section"><h3>소득과 주거비</h3><div className="field-grid">
          <NumberField label="세후 월소득" value={input.monthlyIncome} onChange={(v) => update("monthlyIncome", v)} />
          <NumberField label="현재 월세" value={input.rent} onChange={(v) => update("rent", v)} />
          {inputMode === "detailed" && <><NumberField label="관리비" value={input.maintenance} onChange={(v) => update("maintenance", v)} />
          <NumberField label="주차비" value={input.parking} onChange={(v) => update("parking", v)} /></>}
          <NumberField label="절약 후 예상 주거비" value={input.alternativeHousing} onChange={(v) => update("alternativeHousing", v)} />
        </div></div>
        <div className="field-section"><h3>자산 목표와 투자</h3><div className="field-grid">
          <NumberField label="현재 금융자산" value={input.currentAssets} onChange={(v) => update("currentAssets", v)} />
          <NumberField label="현재 월 투자금" value={input.monthlyInvestment} onChange={(v) => update("monthlyInvestment", v)} />
          <NumberField label="목표자산" value={input.targetAssets} onChange={(v) => update("targetAssets", v)} />
          {inputMode === "detailed" && <NumberField label="최대 계산기간" value={input.maxYears} onChange={(v) => update("maxYears", v)} unit="년" min={1} max={60} />}
        </div>
        <div className="preset-row"><span>기대수익률</span>{[4, 6, 8].map((rate) => <button key={rate} type="button" className={input.annualRate === rate ? "active" : ""} aria-pressed={input.annualRate === rate} onClick={() => update("annualRate", rate)}>{rate === 4 ? "보수" : rate === 6 ? "기준" : "성장"} {rate}%</button>)}</div>
        {inputMode === "detailed" && <RangeField label="월세 절약액 중 투자할 비율" value={input.investRate} onChange={(v) => update("investRate", v)} />}
        </div>
        <QuickAssumptionNote mode={inputMode}>관리비·주차비는 0원, 절약한 금액은 전부 투자, 최대 60년까지 계산합니다. 실제 관리비가 크다면 상세 계산에서 더해 주세요.</QuickAssumptionNote>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button" data-testid="rent-calculate" type="button" onClick={calculate}>월세를 아끼면 얼마 모이는지 계산하기 <ArrowRight size={18} /></button>
        <StorageControl storageKey="wdl-rent" inputs={input} />
      </section>

      <section className="result-panel" data-testid="rent-results" aria-live="polite">
        <div className="panel-heading"><div><span>RESULT</span><h2>월세 절약으로 늘어나는 자산</h2></div></div>
        <QuickEstimateNotice mode={inputMode} />
        {result.housingDifference < 0 && <div className="warning-strip"><Info size={17} />예상 주거비가 현재보다 {formatMoney(Math.abs(result.housingDifference))} 높아 월세 절약액은 0원으로 계산했습니다.</div>}
        <div className="kpi-grid">
          <Kpi label="소득 대비 주거비" value={`${result.housingRatio.toFixed(1)}%`} sub={`월 ${formatMoney(result.currentHousing)}`} />
          <Kpi label="월세 절약 후 추가 투자액" value={formatMoney(result.additionalInvestment)} tone="green" sub={`월세 절약액 ${formatMoney(result.housingDifference)}`} />
          <Kpi label="목표자산 도달 단축" value={formatPeriod(result.shortenedMonths)} tone="rust" sub={`현재 ${formatPeriod(result.currentMonths)} → 절약 후 ${formatPeriod(result.alternativeMonths)}`} />
        </div>
        <div className="milestone-grid">{result.milestones.map((item) => <div key={item.years}><span>{item.years}년 뒤 늘어나는 자산</span><strong>{formatMoney(item.value)}</strong></div>)}</div>
        <div className="chart-block"><div className="chart-heading"><h3>월세 절약 전후 예상자산</h3><span>아낀 월세를 설정한 비율만큼 투자한 경우</span></div><div className="chart-area">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={result.chart} margin={{ top: 16, right: 10, left: 0, bottom: 0 }}><CartesianGrid stroke="#d9ded9" vertical={false} /><XAxis dataKey="year" tickFormatter={(v) => `${v}년`} tick={{ fontSize: 11, fill: "#747d78" }} /><YAxis tickFormatter={(v) => `${Math.round(v / 100_000_000)}억`} width={46} tick={{ fontSize: 11, fill: "#747d78" }} /><Tooltip formatter={(v) => formatMoney(Number(v))} labelFormatter={(v) => `${v}년 후`} /><Legend /><Line type="monotone" name="현재 월세 유지" dataKey="current" stroke="#8a938e" strokeWidth={2} dot={false} /><Line type="monotone" name="월세 절약 후 투자" dataKey="alternative" stroke="#145c45" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>
        </div></div>
        <div className="responsive-table simple-result-table" role="region" aria-label="월 투자금별 목표 도달 예상기간" tabIndex={0}><table><thead><tr><th scope="col">월 투자금</th><th scope="col">목표 도달 예상</th></tr></thead><tbody>{result.scenarios.map((scenario) => <tr key={scenario.monthly}><th scope="row">{formatMoney(scenario.monthly)}</th><td>{formatPeriod(scenario.months)}</td></tr>)}</tbody></table></div>
        <FormulaDetails><p><b>현재 주거비</b> = 월세 + 관리비 + 주차비</p><p><b>월세 절약 후 추가 투자액</b> = max((현재 주거비 − 절약 후 예상 주거비) × 투자비율, 0)</p><p><b>월수익률</b> = (1 + 연수익률)<sup>1/12</sup> − 1</p><p>월말 적립식 미래가치 공식을 적용하고, 목표자산을 처음 넘는 달을 순서대로 탐색합니다.</p></FormulaDetails>
        <ResultActions title="월세 절약 자산증가 계산 결과" lines={summary} />
        <button className="related-link" type="button" onClick={() => { window.location.href = "/calculators/goal-assets"; }}>아낀 월세를 자산계획에 반영하기 <ArrowRight size={17} /></button>
        <LegalDisclaimer />
      </section>
    </div>
  );
}

const jobDefaults: JobOfferInputs = {
  currentBase: 55_000_000,
  currentBonus: 0,
  currentBonusProbability: 70,
  currentCommute: 120_000,
  currentHousing: 1_000_000,
  currentOther: 0,
  currentCashAllowance: 0, currentWelfarePoints: 0, currentMealBenefit: 0, currentTransportBenefit: 0, currentHousingBenefit: 0,
  offerBase: 63_000_000,
  offerBonus: 8_000_000,
  offerBonusProbability: 70,
  signingBonus: 0,
  offerCommute: 180_000,
  offerHousing: 1_000_000,
  offerOther: 0,
  offerCashAllowance: 0, offerWelfarePoints: 0, offerMealBenefit: 0, offerTransportBenefit: 0, offerHousingBenefit: 0,
  offerEquityAnnual: 0, offerEquityProbability: 50,
  afterTaxRate: 78,
  investRate: 80,
  annualRate: 6,
  careerExpansion: 4,
  rejobPotential: 4,
  stability: 3,
};

export function JobOfferCalculator() {
  const [input, setInput] = useState(jobDefaults);
  const [inputMode, setInputMode] = useState<InputMode>("quick");
  const [result, setResult] = useState(() => calculateJobOffer(jobDefaults));
  const [error, setError] = useState("");
  useEffect(() => {
    const saved = loadSaved("wdl-job", jobDefaults);
    // Intentional hydration from optional device-local storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInput(saved);
    setResult(calculateJobOffer(saved));
  }, []);
  function update<K extends keyof JobOfferInputs>(key: K, value: JobOfferInputs[K]) { setInput((current) => ({ ...current, [key]: value })); }
  function calculate() {
    if (input.currentBase <= 0) return setError("현재 기본급은 0원보다 큰 값으로 입력해 주세요.");
    if (input.annualRate < 0 || input.annualRate > 20) return setError("기대수익률은 0~20% 범위로 입력해 주세요.");
    setError(""); setResult(calculateJobOffer(input));
  }
  const chartData = [
    { name: "기본급", 현재: input.currentBase, 제안: input.offerBase },
    { name: "기대 현금보상", 현재: result.currentCashCompensation, 제안: result.offerCashCompensation },
    { name: "복지 포함 총가치", 현재: result.currentExpected, 제안: result.offerExpected },
  ];
  const summary = [`판정 ${result.verdict}`, `월 실질 증가 ${formatMoney(result.monthlyDisposableIncrease)}`, `15년 지속 효과 ${formatMoney(result.continuous15Year)}`];
  return (
    <div className="calculator-grid">
      <section className="input-panel">
        <div className="panel-heading"><div><span>STEP 01</span><h2>두 회사의 확정 보상과 기대 보상을 구분해 입력해 주세요</h2></div><ShieldCheck size={22} /></div><PrivacyNote />
        <InputModeSwitch mode={inputMode} onChange={setInputMode} quickDescription="현재·제안 연봉과 성과급, 달라지는 출퇴근·주거비만 먼저 비교합니다." />
        <div className="comparison-inputs">
          <div className="field-section"><h3>현재 회사</h3><NumberField label="기본급" value={input.currentBase} onChange={(v) => update("currentBase", v)} /><NumberField label="예상 성과급" value={input.currentBonus} onChange={(v) => update("currentBonus", v)} /><RangeField label="성과급 지급 가능성" value={input.currentBonusProbability} onChange={(v) => update("currentBonusProbability", v)} />{inputMode === "detailed" && <><NumberField label="연 현금성 수당" value={input.currentCashAllowance} onChange={(v) => update("currentCashAllowance", v)} /><NumberField label="연 복지포인트" value={input.currentWelfarePoints} onChange={(v) => update("currentWelfarePoints", v)} /><NumberField label="연 식대 가치" value={input.currentMealBenefit} onChange={(v) => update("currentMealBenefit", v)} /><NumberField label="연 교통 지원" value={input.currentTransportBenefit} onChange={(v) => update("currentTransportBenefit", v)} /><NumberField label="연 주거 지원" value={input.currentHousingBenefit} onChange={(v) => update("currentHousingBenefit", v)} /></>}<NumberField label="월 출퇴근비" value={input.currentCommute} onChange={(v) => update("currentCommute", v)} /><NumberField label="월 주거비" value={input.currentHousing} onChange={(v) => update("currentHousing", v)} />{inputMode === "detailed" && <NumberField label="월 기타 직장비용" value={input.currentOther} onChange={(v) => update("currentOther", v)} />}</div>
          <div className="field-section accent-section"><h3>제안 회사</h3><NumberField label="제안 기본급" value={input.offerBase} onChange={(v) => update("offerBase", v)} /><NumberField label="예상 성과급" value={input.offerBonus} onChange={(v) => update("offerBonus", v)} /><RangeField label="성과급 지급 가능성" value={input.offerBonusProbability} onChange={(v) => update("offerBonusProbability", v)} />{inputMode === "detailed" && <><NumberField label="연 현금성 수당" value={input.offerCashAllowance} onChange={(v) => update("offerCashAllowance", v)} /><NumberField label="연 복지포인트" value={input.offerWelfarePoints} onChange={(v) => update("offerWelfarePoints", v)} /><NumberField label="연 식대 가치" value={input.offerMealBenefit} onChange={(v) => update("offerMealBenefit", v)} /><NumberField label="연 교통 지원" value={input.offerTransportBenefit} onChange={(v) => update("offerTransportBenefit", v)} /><NumberField label="연 주거 지원" value={input.offerHousingBenefit} onChange={(v) => update("offerHousingBenefit", v)} /><NumberField label="연 주식보상 평가액" value={input.offerEquityAnnual} onChange={(v) => update("offerEquityAnnual", v)} /><RangeField label="주식보상 실현 가능성" value={input.offerEquityProbability} onChange={(v) => update("offerEquityProbability", v)} /><NumberField label="사이닝 보너스" value={input.signingBonus} onChange={(v) => update("signingBonus", v)} /></>}<NumberField label="월 출퇴근비" value={input.offerCommute} onChange={(v) => update("offerCommute", v)} /><NumberField label="월 주거비" value={input.offerHousing} onChange={(v) => update("offerHousing", v)} />{inputMode === "detailed" && <NumberField label="월 기타 직장비용" value={input.offerOther} onChange={(v) => update("offerOther", v)} />}</div>
        </div>
        <div className="field-section"><h3>공통 가정</h3><div className="field-grid"><NumberField label="기대 연수익률" value={input.annualRate} onChange={(v) => update("annualRate", v)} unit="%" step={0.1} max={20} /></div>{inputMode === "detailed" && <><RangeField label="세후 반영률" value={input.afterTaxRate} onChange={(v) => update("afterTaxRate", v)} /><RangeField label="증가 소득 중 투자비율" value={input.investRate} onChange={(v) => update("investRate", v)} /></>}</div>
        {inputMode === "detailed" && <div className="score-grid"><RangeField label="직무 확장성" value={input.careerExpansion} onChange={(v) => update("careerExpansion", v)} min={1} max={5} suffix=" / 5" /><RangeField label="2~3년 후 재이직 가능성" value={input.rejobPotential} onChange={(v) => update("rejobPotential", v)} min={1} max={5} suffix=" / 5" /><RangeField label="회사 안정성" value={input.stability} onChange={(v) => update("stability", v)} min={1} max={5} suffix=" / 5" /></div>}
        <QuickAssumptionNote mode={inputMode}>세후 반영률 78%, 늘어난 소득의 80% 투자로 가정합니다. 기타 직장비용과 별도 복지·수당·주식보상은 0원입니다.</QuickAssumptionNote>
        {error && <p className="error-message" role="alert">{error}</p>}<button className="primary-button" data-testid="job-calculate" type="button" onClick={calculate}>오퍼의 15년 가치 계산하기 <ArrowRight size={18} /></button><StorageControl storageKey="wdl-job" inputs={input} />
      </section>
      <section className="result-panel" aria-live="polite">
        <QuickEstimateNotice mode={inputMode} />
        <div className="verdict-line"><span>현금흐름 변화</span><strong className={`verdict verdict-${result.verdict.replaceAll(" ", "-")}`}>{result.verdict}</strong><p>정해진 합격점이나 이직 추천이 아니라 입력한 현금·비용 차이를 요약합니다.</p></div>
        <div className="kpi-grid"><Kpi label="기본급 인상률" value={`${result.baseIncreaseRate.toFixed(1)}%`} sub={formatMoney(result.baseDifference)} /><Kpi label="월 실질 가처분 증가" value={formatMoney(result.monthlyDisposableIncrease)} tone={result.monthlyDisposableIncrease > 0 ? "green" : "rust"} sub={`비용차 ${formatMoney(result.monthlyCostDifference)}`} /><Kpi label="15년 지속 투자효과" value={formatMoney(result.continuous15Year)} tone="green" sub={`월 ${formatMoney(result.monthlyAdditionalInvestment)} 투자`} /></div>
        <div className="milestone-grid"><div><span>3년 추가 투자원금</span><strong>{formatMoney(result.threeYearPrincipal)}</strong></div><div><span>3년만 투자 후 12년 복리</span><strong>{formatMoney(result.conservative15Year)}</strong></div><div><span>사이닝 보너스 15년 효과</span><strong>{formatMoney(result.signingFutureValue)}</strong></div></div>
        <div className="chart-block"><div className="chart-heading"><h3>현금보상과 복지 포함 총가치</h3><span>성과급·주식보상은 사용자가 입력한 실현 가능성을 반영합니다</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 16, right: 10, left: 0, bottom: 0 }}><CartesianGrid stroke="#d9ded9" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tickFormatter={(v) => `${Math.round(v / 10_000_000)}천만`} width={48} tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => formatMoney(Number(v))} /><Legend /><Bar dataKey="현재" fill="#8a938e" radius={[2, 2, 0, 0]} /><Bar dataKey="제안" fill="#145c45" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        <div className="decision-dashboard"><div><span>세후 현금보상 연 차이</span><strong>{formatMoney(result.afterTaxCashDifference)}</strong><small>기본급·기대 성과급·현금성 수당만 포함</small></div><div><span>사용가능 복지 연 차이</span><strong>{formatMoney(result.spendableBenefitDifference)}</strong><small>입력한 실제 사용가치 기준</small></div><div><span>커리어 자기평가 평균</span><strong>{result.qualitativeAverage.toFixed(1)} / 5</strong><small>확장성·재이직 가능성·안정성 동일가중</small></div></div>
        <FormulaDetails><p><b>기대 현금보상</b> = 기본급 + 예상 성과급 × 지급 가능성 + 현금성 수당입니다. <b>복지 포함 총가치</b>에는 사용자가 평가한 복지와 확률가중 주식보상을 별도로 더합니다.</p><p><b>월 실질 증가</b> = 현금보상 차이 × 세후 반영률 ÷ 12 + 복지 사용가치 차이 ÷ 12 − 월 비용 차이입니다. 현금화가 불확실한 주식보상은 월 가처분소득과 투자 가능액에서 제외합니다.</p><p><b>보수 효과</b>는 추가 투자액을 36개월 납입한 뒤 12년 동안 추가 납입 없이 운용한 값입니다. 안정성 점수도 커리어 평균에 포함되지만 자동 추천에는 사용하지 않습니다.</p></FormulaDetails>
        <div className="milestone-grid"><div><span>현재 복지·수당 가치</span><strong>{formatMoney(result.currentBenefits)}</strong></div><div><span>제안 복지·수당 가치</span><strong>{formatMoney(result.offerBenefits)}</strong></div><div><span>기대 주식보상</span><strong>{formatMoney(result.expectedEquity)}</strong></div></div>
        <ResultActions title="이직 오퍼 계산 결과" lines={summary} /><button className="related-link" type="button" onClick={() => { window.location.href = "/calculators/goal-assets"; }}>추가 투자액을 자산계획에 반영하기 <ArrowRight size={17} /></button><LegalDisclaimer />
      </section>
    </div>
  );
}
