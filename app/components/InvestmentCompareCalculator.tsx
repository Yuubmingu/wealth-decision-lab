"use client";

import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { formatMoney, futureValue } from "../lib/finance";
import { EditableNumberInput } from "./EditableNumberInput";
import { InputModeSwitch, QuickAssumptionNote, QuickEstimateNotice, type InputMode } from "./InputModeSwitch";
import { LegalDisclaimer } from "./SiteChrome";

type Candidate = {
  name: string;
  initial: number;
  monthly: number;
  returnRate: number;
  worstLoss: number;
  cashflow: number;
  liquidity: number;
  taxRate: number;
  studyHours: number;
  leverage: number;
  evidence: number;
  exitClarity: number;
};

type Weights = {
  growth: number;
  downside: number;
  cashflow: number;
  liquidity: number;
  burden: number;
  decisionQuality: number;
};

const defaults: Candidate[] = [
  { name: "주식·ETF", initial: 30_000_000, monthly: 500_000, returnRate: 7, worstLoss: 35, cashflow: 0, liquidity: 5, taxRate: 15.4, studyHours: 4, leverage: 0, evidence: 4, exitClarity: 4 },
  { name: "부동산·부업 등 투자안", initial: 30_000_000, monthly: 0, returnRate: 5, worstLoss: 20, cashflow: 300_000, liquidity: 2, taxRate: 15.4, studyHours: 12, leverage: 50, evidence: 3, exitClarity: 3 },
  { name: "현금성 자산 유지", initial: 30_000_000, monthly: 0, returnRate: 2.5, worstLoss: 0, cashflow: 0, liquidity: 5, taxRate: 15.4, studyHours: 0, leverage: 0, evidence: 5, exitClarity: 5 },
];

const defaultWeights: Weights = { growth: 3, downside: 3, cashflow: 2, liquidity: 2, burden: 2, decisionQuality: 2 };

function Field({ label, value, onChange, unit = "원", min = 0, max = 10_000_000_000, decimalPlaces }: { label: string; value: number; onChange: (v: number) => void; unit?: string; min?: number; max?: number; decimalPlaces?: number }) {
  const money = unit === "원";
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap"><EditableNumberInput value={value} onValueChange={onChange} min={min} max={max} decimalPlaces={decimalPlaces ?? (money ? 0 : 2)} format={money ? "money" : "plain"} aria-label={label} /><span>{unit}</span></span></label>;
}

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

export function InvestmentCompareCalculator() {
  const [items, setItems] = useState(defaults);
  const [inputMode, setInputMode] = useState<InputMode>("quick");
  const [years, setYears] = useState(10);
  const [weights, setWeights] = useState(defaultWeights);
  const update = (index: number, patch: Partial<Candidate>) => setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateWeight = (key: keyof Weights, value: number) => setWeights(current => ({ ...current, [key]: value }));

  const results = useMemo(() => {
    const weightTotal = Object.values(weights).reduce((sum, value) => sum + value, 0);
    return items.map(item => {
      const months = years * 12;
      const gross = futureValue(item.initial, item.monthly + item.cashflow, item.returnRate, months);
      const contributed = item.initial + (item.monthly + item.cashflow) * months;
      const taxableGain = Math.max(gross - contributed, 0);
      const tax = taxableGain * item.taxRate / 100;
      const afterTax = gross - tax;
      const exposureBase = Math.max(item.initial, contributed, gross);
      const lossAmount = exposureBase * item.worstLoss / 100;
      const paybackMonths = item.cashflow > 0 ? Math.ceil(item.initial / item.cashflow) : null;
      const factors: Weights = {
        growth: clampScore((item.returnRate + 30) / 80 * 100),
        downside: clampScore(100 - item.worstLoss),
        cashflow: paybackMonths ? clampScore(100 - paybackMonths / 2.4) : 0,
        liquidity: clampScore(item.liquidity / 5 * 100),
        burden: (clampScore(100 - item.studyHours) + clampScore(100 - item.leverage)) / 2,
        decisionQuality: clampScore((item.evidence + item.exitClarity) / 10 * 100),
      };
      const comparisonIndex = weightTotal > 0
        ? (Object.keys(weights) as Array<keyof Weights>).reduce((sum, key) => sum + factors[key] * weights[key], 0) / weightTotal
        : null;
      return { ...item, gross, afterTax, tax, exposureBase, lossAmount, paybackMonths, factors, comparisonIndex };
    });
  }, [items, weights, years]);

  const weightTotal = Object.values(weights).reduce((sum, value) => sum + value, 0);

  return <div className="comparison-lab"><section className="input-panel"><div className="panel-heading"><div><span>STEP 01 · OPTIONS</span><h2>최대 세 가지 투자안을 같은 기준으로 입력해 주세요</h2></div></div>
    <InputModeSwitch mode={inputMode} onChange={setInputMode} quickDescription="투자금·월 납입액·예상수익률·손실 가능성만으로 세 가지 안을 먼저 비교합니다." />
    <div className="field-grid"><Field label="비교 기간" value={years} onChange={setYears} unit="년" min={1} max={30} decimalPlaces={0} /></div>
    {inputMode === "detailed" && <div className="field-section"><h3>내가 중요하게 보는 항목</h3><p className="section-help">각 중요도를 0~5로 입력합니다. 모두 0이면 비교지수를 표시하지 않습니다.</p><div className="field-grid">
      <Field label="기대성장 중요도" value={weights.growth} onChange={value => updateWeight("growth", value)} unit="/ 5" max={5} />
      <Field label="손실방어 중요도" value={weights.downside} onChange={value => updateWeight("downside", value)} unit="/ 5" max={5} />
      <Field label="현금흐름 중요도" value={weights.cashflow} onChange={value => updateWeight("cashflow", value)} unit="/ 5" max={5} />
      <Field label="유동성 중요도" value={weights.liquidity} onChange={value => updateWeight("liquidity", value)} unit="/ 5" max={5} />
      <Field label="시간·부채부담 중요도" value={weights.burden} onChange={value => updateWeight("burden", value)} unit="/ 5" max={5} />
      <Field label="근거·철수기준 중요도" value={weights.decisionQuality} onChange={value => updateWeight("decisionQuality", value)} unit="/ 5" max={5} />
    </div></div>}
    <div className="compare-columns">{items.map((item, index) => <fieldset className="compare-option" key={index}><legend className="sr-only">{index + 1}번 투자안: {item.name || "이름 미입력"}</legend><input className="option-name" value={item.name} maxLength={80} onChange={event => update(index, { name: event.target.value })} aria-label={`${index + 1}번 투자안 이름`} /><Field label="초기 투입금" value={item.initial} onChange={value => update(index, { initial: value })} /><Field label="월 추가 투자" value={item.monthly} onChange={value => update(index, { monthly: value })} /><Field label="연 기대수익률" value={item.returnRate} onChange={value => update(index, { returnRate: value })} unit="%" min={-30} max={50} /><Field label="최악의 손실" value={item.worstLoss} onChange={value => update(index, { worstLoss: value })} unit="%" max={100} /><Field label="월 순현금흐름" value={item.cashflow} onChange={value => update(index, { cashflow: value })} />{inputMode === "detailed" && <><Field label="현금화 용이성" value={item.liquidity} onChange={value => update(index, { liquidity: value })} unit="/ 5" min={1} max={5} /><Field label="수익 과세율" value={item.taxRate} onChange={value => update(index, { taxRate: value })} unit="%" max={60} /><Field label="월 필요 공부시간" value={item.studyHours} onChange={value => update(index, { studyHours: value })} unit="시간" max={100} /><Field label="레버리지 비율" value={item.leverage} onChange={value => update(index, { leverage: value })} unit="%" max={100} /><Field label="투자 근거의 강도" value={item.evidence} onChange={value => update(index, { evidence: value })} unit="/ 5" min={1} max={5} /><Field label="매도·철수 기준 명확성" value={item.exitClarity} onChange={value => update(index, { exitClarity: value })} unit="/ 5" min={1} max={5} /></>}</fieldset>)}</div>
    <QuickAssumptionNote mode={inputMode}>수익 과세율 15.4%와 현재 중요도 설정을 사용합니다. 현금흐름·유동성·시간·레버리지까지 비교하려면 상세 계산을 선택하세요.</QuickAssumptionNote>
  </section><section className="result-panel" aria-live="polite"><div className="panel-heading"><div><span>STEP 02 · COMPARISON</span><h2>입력 순서대로 보는 시나리오 비교</h2></div></div><QuickEstimateNotice mode={inputMode} /><div className="verdict-line"><span>사용자 가중치</span><strong className="verdict">합계 {weightTotal.toFixed(1)}</strong><p>비교지수는 순위나 투자 추천이 아니라 사용자가 정한 중요도를 같은 척도에 적용한 참고값입니다.</p></div>
    <div className="candidate-results">{results.map((item, index) => <article key={`${item.name}-${index}`} className="candidate-result"><div><span>투자안 {index + 1}</span><h3>{item.name}</h3></div><strong>{item.comparisonIndex === null ? "가중치 미설정" : `비교지수 ${item.comparisonIndex.toFixed(1)}`}</strong><dl><div><dt>{years}년 세후 예상자산</dt><dd>{formatMoney(item.afterTax)}</dd></div><div><dt>추정 과세액</dt><dd>{formatMoney(item.tax)}</dd></div><div><dt>기간 중 추정 최대노출 기준 손실액</dt><dd>−{formatMoney(item.lossAmount)}</dd></div><div><dt>손실 계산 기준 자산</dt><dd>{formatMoney(item.exposureBase)}</dd></div><div><dt>현금흐름 원금회수기간</dt><dd>{item.paybackMonths ? `${Math.ceil(item.paybackMonths / 12)}년` : "현금흐름만으로 계산 불가"}</dd></div><div><dt>근거·철수기준 지수</dt><dd>{item.factors.decisionQuality.toFixed(0)} / 100</dd></div></dl></article>)}</div>
    <div className="warning-strip"><ShieldAlert size={17} /><span>비교지수의 환산 범위도 단순화된 가정입니다. 예상수익률, 세금, 레버리지와 최악 손실을 실제 상품 구조에 맞게 검증하고 원자료를 함께 기록해 주세요.</span></div>
    <details className="formula-details"><summary>예상자산·손실·비교지수 계산식 보기</summary><div><p>세전 예상자산은 연 기대수익률을 유효 월수익률로 환산해 초기금과 매월 말 추가 투자금·순현금흐름이 같은 수익률로 재투자된다고 가정합니다. 과세액은 예상자산에서 누적 투입액을 뺀 양수 이익에 입력 과세율을 곱한 단순 추정입니다.</p><p>최악 손실액 = 입력 손실률 × 초기금·누적 투입액·세전 예상자산 중 가장 큰 금액입니다. 실제 손실 시점의 노출액을 예측하는 값이 아니라, 월납입을 무시해 0원으로 표시하지 않기 위한 보수적 계획값입니다.</p><p>성장 점수는 연수익률 −30%~50%를 0~100으로 선형 환산하고, 손실방어는 100−손실률, 유동성은 5점 척도를 100점으로 환산합니다. 현금흐름은 단순 원금회수기간이 0개월이면 100점, 240개월이면 0점이며 그 밖은 범위 안으로 제한합니다.</p><p>시간·부채부담 점수는 ‘100−월 공부시간’과 ‘100−레버리지 비율’의 평균, 판단근거 점수는 근거와 철수기준의 5점 척도 합계를 100점으로 환산합니다. 최종 비교지수는 각 점수 × 사용자가 입력한 중요도의 가중평균이며 통계적 기대수익이나 투자 추천이 아닙니다.</p></div></details><LegalDisclaimer /></section></div>;
}
