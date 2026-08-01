"use client";

import { useState } from "react";
import { ArrowRight, Copy, Download, Plus, Printer, RefreshCw, Trash2 } from "lucide-react";
import { calculateDcaComparison, calculateRebalancing, type DcaInputs, type RebalanceAsset, type RebalanceInputs } from "../lib/investment-management";
import { formatMoney, formatPeriod } from "../lib/finance";
import { EditableNumberInput } from "./EditableNumberInput";
import { InputModeSwitch, QuickAssumptionNote, QuickEstimateNotice, type InputMode } from "./InputModeSwitch";
import { LegalDisclaimer } from "./SiteChrome";

function Field({ label, value, onChange, unit = "원", min = 0, max = 10_000_000_000, hint, readOnly = false, integer = false }: { label: string; value: number; onChange: (value: number) => void; unit?: string; min?: number; max?: number; hint?: string; readOnly?: boolean; integer?: boolean }) {
  const money = unit === "원";
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap"><EditableNumberInput value={value} onValueChange={onChange} min={min} max={max} decimalPlaces={money || integer ? 0 : 2} format={money ? "money" : "plain"} readOnly={readOnly} aria-readonly={readOnly} aria-label={label} /><span>{unit}</span></span><small>{money && value ? formatMoney(value) : hint ?? " "}</small></label>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="field"><span className="field-label">{label}</span><span className="select-wrap"><select value={value} onChange={event => onChange(event.target.value)}>{children}</select></span></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="mini-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>;
}

const dcaDefaults: DcaInputs = { amount: 30_000_000, waitingCash: 20_000_000, dcaMonths: 6, annualReturn: 7, cashRate: 2.5, dropPercent: 20, dropMonth: 6, years: 5, essentialExpenses: 2_500_000, emergencyMonths: 6, plannedCashUse: 0, stressTolerance: 3 };

export function LumpSumVsDcaCalculator() {
  const [input, setInput] = useState(dcaDefaults);
  const [inputMode, setInputMode] = useState<InputMode>("quick");
  const [result, setResult] = useState(() => calculateDcaComparison(dcaDefaults));
  const update = <K extends keyof DcaInputs>(key: K, value: DcaInputs[K]) => setInput(current => ({ ...current, [key]: value }));
  return <div className="calculator-grid"><section className="input-panel"><div className="panel-heading"><div><span>STEP 01 · STRATEGY</span><h2>목돈과 분할매수 조건을 입력해 주세요</h2></div></div>
    <InputModeSwitch mode={inputMode} onChange={setInputMode} quickDescription="투자금·분할기간·예상수익률·하락폭만으로 일시투자와 분할매수를 먼저 비교합니다." />
    <div className="field-section"><h3>투자금과 안전자금</h3><div className="field-grid"><Field label="투자할 목돈" value={input.amount} onChange={value => update("amount", value)} /><Field label="투자 후 남길 대기 현금" value={input.waitingCash} onChange={value => update("waitingCash", value)} /><Field label="월 필수생활비" value={input.essentialExpenses} onChange={value => update("essentialExpenses", value)} /><Field label="목표 비상자금" value={input.emergencyMonths} onChange={value => update("emergencyMonths", value)} unit="개월" max={24} integer />{inputMode === "detailed" && <Field label="기간 내 사용할 예정 현금" value={input.plannedCashUse} onChange={value => update("plannedCashUse", value)} />}</div></div>
    <div className="field-section"><h3>분할매수와 시장 가정</h3><div className="period-buttons"><span>분할매수 기간</span>{[3, 6, 12, 24].map(months => <button type="button" key={months} className={input.dcaMonths === months ? "active" : ""} aria-pressed={input.dcaMonths === months} onClick={() => update("dcaMonths", months)}>{months}개월</button>)}</div><div className="field-grid"><Field label="월별 분할금액" value={input.amount / Math.max(input.dcaMonths, 1)} onChange={() => undefined} hint="목돈 ÷ 분할기간으로 자동 계산" readOnly /><Field label="예상 연수익률" value={input.annualReturn} onChange={value => update("annualReturn", value)} unit="%" min={-20} max={40} />{inputMode === "detailed" && <Field label="대기 현금 이자율" value={input.cashRate} onChange={value => update("cashRate", value)} unit="%" max={20} />}<Field label="초기 하락폭" value={input.dropPercent} onChange={value => update("dropPercent", value)} unit="%" max={90} />{inputMode === "detailed" && <Field label="중간 하락 발생시점" value={input.dropMonth} onChange={value => update("dropMonth", value)} unit="개월" min={1} max={120} integer />}<Field label="전체 투자기간" value={input.years} onChange={value => update("years", value)} unit="년" min={1} max={30} integer />{inputMode === "detailed" && <Field label="손실 스트레스 감내도" value={input.stressTolerance} onChange={value => update("stressTolerance", value)} unit="/ 5" min={1} max={5} />}</div></div>
    <QuickAssumptionNote mode={inputMode}>대기 현금 이자율 연 2.5%, 중간 하락은 6개월째, 예정된 현금 사용은 0원으로 둡니다.</QuickAssumptionNote>
    <button type="button" className="primary-button" data-testid="dca-calculate" onClick={() => setResult(calculateDcaComparison(input))}>세 가지 시장에서 비교하기 <ArrowRight size={17} /></button>
  </section><section className="result-panel" aria-live="polite"><QuickEstimateNotice mode={inputMode} /><div className="verdict-line"><span>안전자금·시장가정 요약</span><strong className="verdict">{result.verdict}</strong><p>입력한 가정의 종료금액을 설명하며 투자 방식을 추천하지 않습니다.</p></div>
    <div className="kpi-grid"><div className="kpi"><span>상승 지속 시 일시투자</span><strong>{formatMoney(result.results[0].lump.value)}</strong></div><div className="kpi"><span>상승 지속 시 분할매수</span><strong>{formatMoney(result.results[0].dca.value)}</strong></div><div className="kpi"><span>상승 가정 종료액 차이</span><strong>{formatMoney(Math.abs(result.results[0].difference))}</strong></div></div>
    <div className="scenario-cards">{result.results.map(scenario => <article key={scenario.key}><div><span>{scenario.label}</span><strong className={scenario.difference >= 0 ? "positive" : "negative"}>{Math.abs(scenario.difference) < 1 ? "종료금액 유사" : scenario.difference >= 0 ? "일시투자 종료액 큼" : "분할매수 종료액 큼"}</strong></div><dl><div><dt>일시투자 예상자산</dt><dd>{formatMoney(scenario.lump.value)}</dd></div><div><dt>분할매수 예상자산</dt><dd>{formatMoney(scenario.dca.value)}</dd></div><div><dt>분할 대기이자</dt><dd>{formatMoney(scenario.dca.interest)}</dd></div><div><dt>최대 평가손실</dt><dd>일시 {formatMoney(scenario.lump.maxLoss)} · 분할 {formatMoney(scenario.dca.maxLoss)}</dd></div><div><dt>종료액 차이</dt><dd>{formatMoney(Math.abs(scenario.difference))}</dd></div></dl></article>)}</div>
    <div className="decision-dashboard"><div><span>급락 후 가격 회복 추정</span><strong>{result.recoveryMonths === null ? "수익률 가정상 계산 불가" : formatPeriod(result.recoveryMonths)}</strong><small>추가 하락 없이 기대수익률로 회복 가정</small></div><div className={result.reserve >= result.requiredReserve ? "safe" : "danger"}><span>사용계획 반영 후 현금</span><strong>{formatMoney(result.reserve)}</strong><small>필요 비상자금 {formatMoney(result.requiredReserve)}</small></div><div><span>상승 가정 기회비용</span><strong>{formatMoney(result.opportunityCost)}</strong><small>음수이면 0으로 표시</small></div></div>
    <div className="warning-strip"><span>{result.stressNote}</span></div><details className="formula-details"><summary>계산 근거와 판정 기준 보기</summary><div><p>일시투자는 시작 시점에 전액을 투자하고, 분할매수는 선택한 기간 동안 같은 금액을 매월 말 투자합니다. 투자 전 현금 이자는 이자 반영 전 잔액을 기준으로 계산합니다.</p><p>상승 지속, 1개월 차 급락, 지정한 달의 급락을 각각 계산합니다. 급락 이후에는 동일한 기대수익률로 움직인다고 가정합니다.</p><p>안전자금 충족 여부와 시나리오 종료금액을 요약할 뿐 투자 적합성이나 매수 시점을 판정하지 않습니다.</p></div></details><LegalDisclaimer />
  </section></div>;
}

const initialAssets: RebalanceAsset[] = [
  { id: "sp500", name: "S&P500 ETF", value: 30_000_000, target: 30, change: 0, taxRate: 0, category: "ETF", leveraged: false, emergency: false },
  { id: "vti", name: "미국 전체시장", value: 20_000_000, target: 20, change: 0, taxRate: 0, category: "ETF", leveraged: false, emergency: false },
  { id: "vt", name: "전 세계 주식", value: 15_000_000, target: 10, change: 0, taxRate: 0, category: "ETF", leveraged: false, emergency: false },
  { id: "qqqm", name: "나스닥100", value: 5_000_000, target: 5, change: 0, taxRate: 0, category: "ETF", leveraged: false, emergency: false },
  { id: "btc", name: "비트코인", value: 50_000_000, target: 35, change: 0, taxRate: 0, category: "암호화폐", leveraged: false, emergency: false },
];

const rebalanceDefaults: RebalanceInputs = { assets: initialAssets, newMoney: 1_550_000, monthlyContribution: 1_550_000, threshold: 5, method: "new", feeRate: 0.1, stressAssetId: "btc", stressDrop: 50, reviewMonths: 6 };

function nextReviewDate(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function csvCell(value: string | number) {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function saveRebalancePng(result: ReturnType<typeof calculateRebalancing>, reviewMonths: number) {
  if (!result.canExecute) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 420 + result.rows.length * 54;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#f4f1e8";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#163c2b";
  context.fillRect(0, 0, canvas.width, 92);
  context.fillStyle = "#fff";
  context.font = "700 32px Pretendard, sans-serif";
  context.fillText("포트폴리오 리밸런싱 계산안", 48, 57);
  context.fillStyle = "#1d2a24";
  context.font = "700 25px Pretendard, sans-serif";
  context.fillText(result.status, 48, 145);
  context.font = "16px Pretendard, sans-serif";
  context.fillStyle = "#5d695f";
  context.fillText(`과대비중 ${result.over?.name ?? "-"} · 부족자산 ${result.under?.name ?? "-"} · 다음 점검 ${nextReviewDate(reviewMonths)}`, 48, 180);
  context.fillStyle = "#fff";
  context.fillRect(38, 214, 1124, 70 + result.rows.length * 54);
  context.fillStyle = "#1d2a24";
  context.font = "700 15px Pretendard, sans-serif";
  ["자산", "목표", "현재", "조정 후", "행동", "조정금액"].forEach((label, index) => context.fillText(label, [58, 410, 525, 640, 780, 940][index], 250));
  context.font = "15px Pretendard, sans-serif";
  result.rows.forEach((row, index) => {
    const y = 296 + index * 54;
    context.strokeStyle = "#ded9cd";
    context.beginPath();
    context.moveTo(58, y - 22);
    context.lineTo(1140, y - 22);
    context.stroke();
    context.fillStyle = "#1d2a24";
    context.fillText(row.name, 58, y);
    context.fillText(`${row.target.toFixed(1)}%`, 410, y);
    context.fillText(`${row.currentWeight.toFixed(1)}%`, 525, y);
    context.fillText(`${row.postWeight.toFixed(1)}%`, 640, y);
    context.fillText(row.action, 780, y);
    context.fillText(formatMoney(Math.abs(row.adjustment)), 940, y);
  });
  context.fillStyle = "#5d695f";
  context.font = "14px Pretendard, sans-serif";
  context.fillText("참고 계산이며 투자 권유가 아닙니다. 비용과 세금은 실제 조건을 별도로 확인해 주세요.", 48, canvas.height - 42);
  const link = document.createElement("a");
  link.download = "rebalance-result.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function RebalancingCalculator() {
  const [input, setInput] = useState(rebalanceDefaults);
  const [inputMode, setInputMode] = useState<InputMode>("quick");
  const [tab, setTab] = useState<"check" | "execute">("check");
  const [result, setResult] = useState(() => calculateRebalancing(rebalanceDefaults));
  const update = <K extends keyof RebalanceInputs>(key: K, value: RebalanceInputs[K]) => setInput(current => ({ ...current, [key]: value }));
  const updateAsset = (id: string, patch: Partial<RebalanceAsset>) => update("assets", input.assets.map(asset => asset.id === id ? { ...asset, ...patch } : asset));
  const calculate = () => setResult(calculateRebalancing(input));
  const add = () => update("assets", [...input.assets, { id: `asset-${Date.now()}`, name: "새 자산", value: 0, target: 0, change: 0, taxRate: 0, category: "기타", leveraged: false, emergency: false }]);
  const preset = (kind: "stock" | "crypto" | "crash" | "diverge") => update("assets", input.assets.map(asset => {
    const crypto = asset.category === "암호화폐";
    const stock = asset.category === "ETF" || asset.category === "개별주식";
    const change = kind === "stock" ? (stock ? 20 : 0) : kind === "crypto" ? (crypto ? 70 : 5) : kind === "crash" ? (crypto ? -60 : stock ? -30 : 0) : (stock ? 15 : crypto ? -30 : 0);
    return { ...asset, change };
  }));
  const download = () => {
    if (!result.canExecute) return;
    const rows = [["자산", "목표비중", "현재비중", "편차", "계산행동", "조정금액", "신규자금배분", "예상비용", "매도대금 적용 비용·세금"], ...result.rows.map(row => [row.name, row.target.toFixed(2), row.currentWeight.toFixed(2), row.deviation.toFixed(2), row.action, Math.round(row.adjustment), Math.round(row.newAllocation), Math.round(row.fee), Math.round(row.tax)])];
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rebalance-order.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const copy = async () => {
    if (!result.canExecute) return;
    await navigator.clipboard.writeText([`리밸런싱 상태: ${result.status}`, `허용 편차: ${input.threshold}%p`, `과대비중: ${result.over?.name ?? "-"} ${result.over?.deviation.toFixed(1) ?? "-"}%p`, `부족자산: ${result.under?.name ?? "-"} ${result.under?.deviation.toFixed(1) ?? "-"}%p`, ...result.rows.map(row => `${row.name}: ${row.action} ${formatMoney(Math.abs(row.adjustment))}`)].join("\n"));
  };

  return <div className="rebalance-shell"><InputModeSwitch mode={inputMode} onChange={setInputMode} quickDescription="자산명·평가금액·목표비중과 이번 투자금만 입력해 조정안을 만듭니다." /><div className="tool-tabs" role="group" aria-label="리밸런싱 화면"><button type="button" aria-pressed={tab === "check"} className={tab === "check" ? "active" : ""} onClick={() => setTab("check")}>1. 현재 포트폴리오 점검</button><button type="button" aria-pressed={tab === "execute"} className={tab === "execute" ? "active" : ""} onClick={() => setTab("execute")}>2. 리밸런싱 계산안</button></div>
    {tab === "check" ? <section className="input-panel"><div className="panel-heading"><div><span>ASSET ALLOCATION</span><h2>보유 자산과 목표 비중을 입력해 주세요</h2></div><button type="button" className="secondary-button" onClick={add}><Plus size={16} /> 자산 추가</button></div><div className={`asset-editor-head ${inputMode}`}><span>{inputMode === "quick" ? "자산" : "자산·종류"}</span><span>평가금액</span><span>목표비중</span>{inputMode === "detailed" && <><span>예상증감</span><span>매도대금 비용·세율</span><span>위험표시</span></>}{inputMode === "quick" && <span>삭제</span>}</div>
      {input.assets.map(asset => <fieldset className={`asset-editor ${inputMode}`} key={asset.id}><legend className="sr-only">{asset.name || "이름 미입력"} 자산 입력</legend><div className="asset-identity"><input value={asset.name} maxLength={80} aria-label={`${asset.name || "이름 미입력"} 자산 이름`} onChange={event => updateAsset(asset.id, { name: event.target.value })} />{inputMode === "detailed" && <select value={asset.category} aria-label={`${asset.name || "이름 미입력"} 자산 종류`} onChange={event => updateAsset(asset.id, { category: event.target.value })}>{["ETF", "암호화폐", "금", "채권", "현금", "부동산", "개별주식", "기타"].map(category => <option key={category}>{category}</option>)}</select>}</div><Field label="현재 평가금액" value={asset.value} onChange={value => updateAsset(asset.id, { value })} /><Field label="목표 비중" value={asset.target} onChange={value => updateAsset(asset.id, { target: value })} unit="%" max={100} />{inputMode === "detailed" && <><Field label="예상 증감률" value={asset.change} onChange={value => updateAsset(asset.id, { change: value })} unit="%" min={-100} max={500} /><Field label="매도대금 적용 비용·세율" value={asset.taxRate} onChange={value => updateAsset(asset.id, { taxRate: value })} unit="%" max={100} /></>}<div className="asset-flags">{inputMode === "detailed" && <><Toggle label="레버리지" checked={asset.leveraged} onChange={value => updateAsset(asset.id, { leveraged: value })} /><Toggle label="비상자금" checked={asset.emergency} onChange={value => updateAsset(asset.id, { emergency: value })} /></>}<button type="button" aria-label={`${asset.name || "이름 미입력"} 삭제`} onClick={() => update("assets", input.assets.filter(item => item.id !== asset.id))}><Trash2 size={15} /></button></div></fieldset>)}
      {inputMode === "detailed" && <div className="scenario-presets"><span>빠른 가격 시나리오</span><button type="button" onClick={() => preset("stock")}>주식 상승</button><button type="button" onClick={() => preset("crypto")}>코인 급등</button><button type="button" onClick={() => preset("crash")}>전체 급락</button><button type="button" onClick={() => preset("diverge")}>주식 회복·코인 침체</button></div>}<QuickAssumptionNote mode={inputMode}>현재 가격 기준, 매도대금 비용·세율 0%, 레버리지·비상자금 표시 없음으로 계산합니다.</QuickAssumptionNote><button type="button" className="primary-button" onClick={() => { calculate(); setTab("execute"); }}>리밸런싱 계산하기 <ArrowRight size={17} /></button>
    </section> : <><section className="input-panel execution-controls"><div className="field-grid"><Field label="이번 신규 투자금" value={input.newMoney} onChange={value => setInput(current => inputMode === "quick" ? { ...current, newMoney: value, monthlyContribution: value } : { ...current, newMoney: value })} />{inputMode === "detailed" && <Field label="월 정기 투자금" value={input.monthlyContribution} onChange={value => update("monthlyContribution", value)} />}<Field label="허용 편차" value={input.threshold} onChange={value => update("threshold", value)} unit="%p" max={30} />{inputMode === "detailed" && <Field label="예상 거래비용" value={input.feeRate} onChange={value => update("feeRate", value)} unit="%" max={10} />}<SelectField label="리밸런싱 방식" value={input.method} onChange={value => update("method", value as RebalanceInputs["method"])}><option value="new">A. 신규 투자금만으로 조정</option><option value="exact">B. 매수·매도로 정확히 조정</option><option value="partial">C. 허용범위까지만 부분 조정</option></SelectField>{inputMode === "detailed" && <><SelectField label="급락 테스트 자산" value={input.stressAssetId} onChange={value => update("stressAssetId", value)}>{input.assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</SelectField><Field label="급락폭" value={input.stressDrop} onChange={value => update("stressDrop", value)} unit="%" max={100} /><Field label="다음 점검까지" value={input.reviewMonths} onChange={value => update("reviewMonths", value)} unit="개월" min={1} max={24} integer /></>}</div><QuickAssumptionNote mode={inputMode}>월 투자금은 이번 신규 투자금과 같게, 거래비용 0.1%, 대표 급락 테스트 50%, 다음 점검 6개월로 둡니다.</QuickAssumptionNote><button type="button" className="primary-button" data-testid="rebalance-calculate" onClick={calculate}>계산안 다시 계산하기 <RefreshCw size={16} /></button></section>
      <section className="result-panel" aria-live="polite"><QuickEstimateNotice mode={inputMode} /><div className="verdict-line"><span>사용자 기준 상태</span><strong className="verdict">{result.status}</strong><p>최대 절대편차 {result.maxDeviation.toFixed(1)}%p · 입력한 허용 편차 {input.threshold.toFixed(2)}%p</p></div>{!result.targetValid && <div className="error-message" role="alert">목표 비중 합계가 {result.targetSum.toFixed(2)}%입니다. 100%로 맞추기 전에는 조정금액과 파일을 만들지 않습니다.</div>}
        <div className="kpi-grid"><div className="kpi"><span>가장 과대비중</span><strong>{result.over?.name ?? "—"}</strong><small>{result.over ? `${result.over.deviation >= 0 ? "+" : ""}${result.over.deviation.toFixed(1)}%p` : "—"}</small></div><div className="kpi"><span>가장 부족한 자산</span><strong>{result.under?.name ?? "—"}</strong><small>{result.under ? `${result.under.deviation.toFixed(1)}%p` : "—"}</small></div><div className="kpi"><span>계산상 매도액</span><strong>{formatMoney(result.rows.filter(row => row.adjustment < 0).reduce((sum, row) => sum - row.adjustment, 0))}</strong></div></div>
        <div className="responsive-table" role="region" aria-label="자산별 리밸런싱 계산안" tabIndex={0}><table><thead><tr><th scope="col">자산</th><th scope="col">목표 / 현재 / 조정 후</th><th scope="col">계산 행동</th><th scope="col">조정금액</th></tr></thead><tbody>{result.rows.map(row => <tr key={row.id}><th scope="row">{row.name}<small>{row.category}</small></th><td>{row.target.toFixed(1)}% / {row.currentWeight.toFixed(1)}% / {row.postWeight.toFixed(1)}%<small>목표 대비 {row.deviation > 0 ? "+" : ""}{row.deviation.toFixed(1)}%p</small></td><td>{row.action}<small>비용 반영 신규자금 배분 {formatMoney(row.newAllocation)}</small></td><td>{formatMoney(Math.abs(row.adjustment))}</td></tr>)}</tbody></table></div>
        <div className="decision-dashboard"><div><span>매도 없이 허용범위 복귀에 필요한 신규자금</span><strong>{formatMoney(result.requiredNewMoney)}</strong><small>현재 월 투자금 기준 {result.returnMonths === null ? "계산 불가" : formatPeriod(result.returnMonths)}</small></div><div><span>예상 거래비용·매도대금 비용</span><strong>{formatMoney(result.totalFee + result.totalTax)}</strong><small>거래비용 {formatMoney(result.totalFee)} · 매도대금 기준 {formatMoney(result.totalTax)}<br />다음 점검일 {nextReviewDate(input.reviewMonths)}</small></div><div><span>선택 자산 급락 시 전체 영향</span><strong>−{result.stressPortfolioRate.toFixed(1)}%</strong><small>평가손실 {formatMoney(result.stressLoss)}</small></div></div>
        {input.method === "partial" && <div className="flow-summary"><div><span>부분조정 매도총액</span><strong>{formatMoney(result.partialSellProceeds)}</strong></div><div><span>매도비용·세금 및 매수비용 반영 매수한도</span><strong>{formatMoney(result.partialBuyBudget)}</strong></div><div><span>미배분 신규자금</span><strong>{formatMoney(result.unallocatedCash)}</strong></div></div>}
        {result.risks.length > 0 && <div className="risk-list">{result.risks.map(risk => <span key={risk}>{risk}</span>)}</div>}<div className="warning-strip"><RefreshCw size={17} /><span>계산안은 주문 지시가 아닙니다. 소폭 편차는 신규 투자금으로 조정할 수 있고, 실제 양도차익 세금은 취득원가·계좌유형·거주지 세법 없이는 계산할 수 없습니다.</span></div>
        <div className="result-actions"><button className="secondary-button" type="button" disabled={!result.canExecute} onClick={download}><Download size={16} /> 주문표 CSV</button><button className="secondary-button" type="button" disabled={!result.canExecute} onClick={() => saveRebalancePng(result, input.reviewMonths)}><Download size={16} /> 결과 카드 PNG</button><button className="secondary-button" type="button" disabled={!result.canExecute} onClick={copy}><Copy size={16} /> 결과 복사</button><button className="secondary-button" type="button" onClick={() => window.print()}><Printer size={16} /> 보고서 인쇄</button></div>
        <details className="formula-details"><summary>계산식과 상태 기준 보기</summary><div><p>현재 비중 = 시나리오 반영 평가금액 ÷ 전체 평가금액. 목표금액 = 신규 투자금 반영 전체자산 × 목표비중. 비용 전 조정금액 = 목표금액 − 현재금액입니다.</p><p>최대 절대편차가 입력한 허용 편차 이하면 ‘허용범위 안’, 초과하면 ‘허용범위 밖’으로 표시합니다. 실제 계산안의 매수총액은 신규자금 + 매도총액 − 매도 거래비용 − 사용자가 입력한 매도대금 비용·세금 안에서 매수 거래비용까지 낼 수 있도록 축소합니다. 따라서 비용이 있으면 조정 후 비중이 목표와 조금 다를 수 있습니다.</p><p>자산별 비율은 양도차익 세율이 아니라 매도대금 전체에 적용할 보수적 비용·세율입니다. 실제 세금을 계산하려면 취득원가와 계좌·세법 정보가 필요합니다.</p></div></details><LegalDisclaimer />
      </section></>}
  </div>;
}
