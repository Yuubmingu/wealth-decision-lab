"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BarChart3, BookOpenCheck, CheckCircle2, Copy, Download, FileJson, FileSpreadsheet, FlaskConical, Play, RotateCcw, ShieldCheck, Upload, XCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BENCHMARK_COLUMNS, FUNDAMENTAL_COLUMNS, PRICE_COLUMNS, dataDictionary, downloadText, parseBenchmarkCsv, parseFundamentalsCsv, parsePricesCsv, templates, toCsv, type ParsedDataset } from "../../lib/backtest/csv";
import { runBacktest } from "../../lib/backtest/engine";
import { parseJournalJson, parseStoredJournalJson, parseStrategyJson } from "../../lib/backtest/import";
import { journalSummary, replayJournal } from "../../lib/backtest/journal-adapter";
import { defaultScreeningConfig } from "../../lib/backtest/rules";
import { createFictionalSample } from "../../lib/backtest/sample";
import type { BacktestResult, BenchmarkRow, CostConfig, FundamentalRow, JournalRecord, PortfolioConfig, PriceRow, QualityReport, ScreeningConfig } from "../../lib/backtest/types";
import { validateDatasets } from "../../lib/backtest/validation";
import { EditableNumberInput } from "../EditableNumberInput";

const emptyParsed = <T,>(): ParsedDataset<T> => ({ rows: [], headers: [], missingColumns: [], parseErrors: [] });
const defaultPortfolio: PortfolioConfig = { startDate: "2020-04-01", endDate: "2025-12-31", initialCapital: 100_000_000, monthlyContribution: 0, rebalanceMonths: 3, maxHoldings: 20, minHoldings: 1, maxPositionWeight: 10, maxSectorWeight: 30, minMarketCap: 0, allowCash: true };
const defaultCosts: CostConfig = { buyCost: 0, sellCost: 0, slippage: 0, sellTax: 0, annualCost: 0, riskFreeRate: 2.5 };
const steps = ["방식", "데이터", "품질검사", "투자 기준", "포트폴리오", "비용", "실행", "결과"];
const money = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const percent = (value: number | null, digits = 1) => value === null || !Number.isFinite(value) ? "N/A" : `${value.toFixed(digits)}%`;

function NumberField({ label, value, onChange, unit, min = 0, max = Number.MAX_SAFE_INTEGER, step = 1 }: { label: string; value: number; onChange: (value: number) => void; unit: string; min?: number; max?: number; step?: number }) {
  return <label className="backtest-field"><span>{label}</span><span className="backtest-input"><EditableNumberInput value={value} onValueChange={onChange} min={min} max={max} decimalPlaces={step < 1 ? 2 : 0} format={unit === "원" ? "money" : "plain"} aria-label={label} /><b>{unit}</b></span></label>;
}

function FileDrop({ label, help, filename, optional, onFile }: { label: string; help: string; filename: string; optional?: boolean; onFile: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return <div className="upload-control">
    <input ref={input} className="visually-hidden-file" tabIndex={-1} type="file" accept=".csv,text/csv" onChange={event => { const file = event.target.files?.[0]; if (file) onFile(file); event.currentTarget.value = ""; }} />
    <button className={`upload-card ${filename ? "is-ready" : ""}`} type="button" onClick={() => input.current?.click()}>
      <span className="upload-icon">{filename ? <CheckCircle2 size={20} aria-hidden="true" /> : <Upload size={20} aria-hidden="true" />}</span>
      <span className="upload-copy"><strong>{label} {optional && <em>선택</em>}</strong><span>{filename || help}</span></span>
    </button>
  </div>;
}

function JsonFileButton({ label, onFile }: { label: string; onFile: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return <span className="file-control"><input ref={input} className="visually-hidden-file" tabIndex={-1} type="file" accept=".json,application/json" onChange={event => { const file = event.target.files?.[0]; if (file) onFile(file); event.currentTarget.value = ""; }} /><button className="file-button" type="button" onClick={() => input.current?.click()}><Upload size={17} aria-hidden="true" /> {label}</button></span>;
}

function QualityPanel({ report }: { report: QualityReport }) {
  return <section className="backtest-section quality-panel"><div className="backtest-section-head"><div><span>STEP 03</span><h2>데이터 품질검사</h2></div><div className={`quality-score ${report.blocked ? "is-blocked" : ""}`}><b>{report.score}</b><span>{report.grade}</span></div></div>
    <p className="section-note">이 점수는 투자 매력도가 아니라 업로드한 데이터로 백테스트를 신뢰할 수 있는 정도를 나타냅니다.</p>
    <div className="data-counts"><div><span>재무 행</span><strong>{report.rows.fundamentals.toLocaleString("ko-KR")}</strong></div><div><span>가격 행</span><strong>{report.rows.prices.toLocaleString("ko-KR")}</strong></div><div><span>벤치마크 행</span><strong>{report.rows.benchmark.toLocaleString("ko-KR")}</strong></div></div>
    <div className="quality-list">{report.issues.length === 0 ? <div className="quality-empty"><CheckCircle2 size={18} /> 검사된 문제를 찾지 못했습니다.</div> : report.issues.map(item => <div key={item.code} className={`quality-item ${item.severity}`}><span>{item.severity === "error" ? <XCircle size={17} /> : item.severity === "warning" ? <AlertTriangle size={17} /> : <ShieldCheck size={17} />}</span><p><strong>{item.severity === "error" ? "실행 차단" : item.severity === "warning" ? "확인 필요" : "안내"}</strong>{item.message}</p><b>{item.count.toLocaleString("ko-KR")}</b></div>)}</div>
  </section>;
}

function StrategySettings({ screening, setScreening }: { screening: ScreeningConfig; setScreening: React.Dispatch<React.SetStateAction<ScreeningConfig>> }) {
  const labels: Array<[keyof ScreeningConfig["enabledRules"], string]> = [["per", "업종 PER 이하"], ["forwardPer", "선행 PER 개선"], ["revenueGrowth", "매출 성장"], ["margin", "영업이익률 유지·개선"], ["roic", "ROIC 기준"], ["cashConversion", "현금전환율"], ["fcf", "잉여현금흐름 흑자"], ["debtRatio", "부채비율"], ["netDebtEbitda", "순차입금/EBITDA"], ["interestCoverage", "이자보상배율"]];
  const update = <K extends keyof ScreeningConfig>(key: K, value: ScreeningConfig[K]) => setScreening(current => ({ ...current, [key]: value }));
  return <section className="backtest-section"><div className="backtest-section-head"><div><span>STEP 04</span><h2>정량 투자 기준</h2></div><button className="text-button" type="button" onClick={() => setScreening(defaultScreeningConfig)}><RotateCcw size={15} /> 기본 기준</button></div>
    <div className="choice-row" role="group" aria-label="규칙 적용 방식"><button className={screening.mode === "minimum" ? "active" : ""} aria-pressed={screening.mode === "minimum"} onClick={() => update("mode", "minimum")} type="button">최소 통과 개수</button><button className={screening.mode === "all" ? "active" : ""} aria-pressed={screening.mode === "all"} onClick={() => update("mode", "all")} type="button">전체 조건 통과</button></div>
    <div className="backtest-field-grid"><NumberField label="최소 통과 기준" value={screening.minimumPass} onChange={value => update("minimumPass", value)} unit="개" min={1} max={10} /><NumberField label="최소 유효 기준" value={screening.minimumValid} onChange={value => update("minimumValid", value)} unit="개" min={1} max={10} /><NumberField label="요구수익률" value={screening.requiredReturn} onChange={value => update("requiredReturn", value)} unit="%" max={100} /><NumberField label="현금전환율 하한" value={screening.cashConversionMin} onChange={value => update("cashConversionMin", value)} unit="%" max={500} /><NumberField label="부채비율 상한" value={screening.debtRatioMax} onChange={value => update("debtRatioMax", value)} unit="%" max={2000} /><NumberField label="순차입금/EBITDA 상한" value={screening.netDebtEbitdaMax} onChange={value => update("netDebtEbitdaMax", value)} unit="배" max={100} step={.1} /><NumberField label="이자보상배율 하한" value={screening.interestCoverageMin} onChange={value => update("interestCoverageMin", value)} unit="배" max={1000} step={.1} /></div>
    <label className="select-field"><span>N/A 처리</span><select value={screening.naHandling} onChange={event => update("naHandling", event.target.value as ScreeningConfig["naHandling"])}><option value="exclude-denominator">분모에서 제외</option><option value="fail">실패 처리</option><option value="exclude-stock">해당 종목 제외</option></select></label>
    <div className="rule-toggle-grid">{labels.map(([key, label], index) => <label key={key}><input type="checkbox" checked={screening.enabledRules[key]} onChange={event => setScreening(current => ({ ...current, enabledRules: { ...current.enabledRules, [key]: event.target.checked } }))} /><span><b>{String(index + 1).padStart(2, "0")}</b>{label}</span></label>)}</div>
    <div className="sector-warning"><AlertTriangle size={18} /><p><strong>기본 제외 업종</strong> 은행·보험·증권·기타 금융·리츠·유틸리티는 일반 기업과 부채 및 현금흐름 구조가 달라 자동 제외합니다.</p></div>
  </section>;
}

function Results({ result }: { result: BacktestResult }) {
  const [tab, setTab] = useState<"core" | "risk" | "holdings" | "trades" | "exclusions">("core");
  const chartData = result.equity.filter((_, index) => index % Math.max(Math.floor(result.equity.length / 180), 1) === 0 || index === result.equity.length - 1).map(point => ({ ...point, value: Math.round(point.value), benchmarkValue: point.benchmarkValue ? Math.round(point.benchmarkValue) : null }));
  const copy = async () => navigator.clipboard.writeText(`정량 투자 기준 백테스트\n최종자산 ${money(result.performance.finalValue)}\nCAGR ${percent(result.performance.cagr)}\nMDD ${percent(result.performance.mdd)}\n누적수익률 ${percent(result.performance.cumulativeReturn)}\n※ 과거 데이터 기반 가상 시뮬레이션이며 미래 수익을 보장하지 않습니다.`);
  const exportSummary = () => downloadText("backtest-summary.json", JSON.stringify({ exportedAt: new Date().toISOString(), performance: result.performance, warnings: result.warnings }, null, 2), "application/json");
  const exportTrades = () => downloadText("backtest-trades.csv", toCsv(result.trades.map(item => ({ date: item.date, ticker: item.ticker, company_name: item.companyName, side: item.side, price: item.price, amount: item.amount, shares: item.shares, cost: item.cost, rules_passed: `${item.passCount}/${item.validCount}`, reason: item.reason }))), "text/csv;charset=utf-8");
  const exportExclusions = () => downloadText("backtest-exclusions.csv", toCsv(result.exclusions.map(item => ({ date: item.date, ticker: item.ticker, company_name: item.companyName, reason: item.reason }))), "text/csv;charset=utf-8");
  return <section className="backtest-results" aria-live="polite"><div className="result-hero"><div><span>BACKTEST COMPLETE</span><h2>과거의 기준을 결과와 위험으로 검증했습니다.</h2><p>좋은 수익률만 보지 말고 최대낙폭, 현금 비중, 거래비용과 제외 사유를 함께 확인하세요.</p></div><FlaskConical size={34} /></div>
    <div className="backtest-kpis"><article><span>최종자산</span><strong>{money(result.performance.finalValue)}</strong><small>초기자금과 추가납입 포함</small></article><article><span>CAGR</span><strong>{percent(result.performance.cagr)}</strong><small>현금흐름 조정 연복리</small></article><article><span>최대낙폭 MDD</span><strong>{percent(result.performance.mdd)}</strong><small>고점 대비 최대 하락</small></article><article><span>벤치마크 대비</span><strong>{percent(result.performance.excessReturn)}</strong><small>{result.performance.excessReturn === null ? "벤치마크 미입력" : "누적수익률 차이"}</small></article></div>
    <div className="result-tabs" role="group" aria-label="결과 보기">{[["core", "핵심 성과"], ["risk", "위험"], ["holdings", "구성"], ["trades", "거래내역"], ["exclusions", "제외 사유"]].map(([key, label]) => <button type="button" aria-pressed={tab === key} className={tab === key ? "active" : ""} key={key} onClick={() => setTab(key as typeof tab)}>{label}</button>)}</div>
    {tab === "core" && <div className="result-panel-body"><div className="chart-head"><div><h3>전략과 벤치마크 누적자산</h3><p>월 추가납입이 있으면 두 경로에 같은 금액을 반영했습니다.</p></div><div><span className="legend strategy">전략</span>{result.performance.benchmarkReturn !== null && <span className="legend benchmark">벤치마크</span>}</div></div><div className="backtest-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><CartesianGrid stroke="#e5e7e2" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={42} /><YAxis tickFormatter={value => `${Math.round(Number(value) / 10_000_000)}천만`} tick={{ fontSize: 10 }} width={48} /><Tooltip formatter={(value) => money(Number(value))} /><Line type="monotone" dataKey="value" name="전략" stroke="#0f5b43" dot={false} strokeWidth={2.3} /><Line type="monotone" dataKey="benchmarkValue" name="벤치마크" stroke="#9a7650" dot={false} strokeWidth={1.6} strokeDasharray="5 4" /></LineChart></ResponsiveContainer></div><div className="metric-table"><div><span>누적수익률</span><strong>{percent(result.performance.cumulativeReturn)}</strong></div><div><span>벤치마크 누적</span><strong>{percent(result.performance.benchmarkReturn)}</strong></div><div><span>연환산 변동성</span><strong>{percent(result.performance.volatility)}</strong></div><div><span>Sharpe Ratio</span><strong>{result.performance.sharpe === null ? "N/A" : result.performance.sharpe.toFixed(2)}</strong></div><div><span>총 거래비용</span><strong>{money(result.performance.totalCosts)}</strong></div><div><span>총 거래 횟수</span><strong>{result.performance.tradeCount.toLocaleString("ko-KR")}회</strong></div></div></div>}
    {tab === "risk" && <div className="result-panel-body"><div className="chart-head"><div><h3>Drawdown</h3><p>0% 아래 영역은 이전 고점에서 아직 회복하지 못한 정도입니다.</p></div></div><div className="backtest-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><CartesianGrid stroke="#e5e7e2" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={42} /><YAxis tickFormatter={value => `${value}%`} tick={{ fontSize: 10 }} width={42} /><Tooltip formatter={(value) => percent(Number(value))} /><Area type="monotone" dataKey="drawdown" name="낙폭" stroke="#9b4937" fill="#ead8cf" /></AreaChart></ResponsiveContainer></div><div className="risk-callout"><AlertTriangle size={19} /><p>최대낙폭 {percent(result.performance.mdd)}는 실제 투자자가 감당해야 했던 과거의 하락 구간입니다. 수익률이 높더라도 이 손실을 버티지 못하면 같은 결과를 얻기 어렵습니다.</p></div></div>}
    {tab === "holdings" && <div className="result-panel-body"><h3>마지막 리밸런싱 이후 보유 구성</h3><div className="responsive-table" role="region" aria-label="마지막 보유 구성 표" tabIndex={0}><table><thead><tr><th scope="col">종목</th><th scope="col">회사명</th><th scope="col">업종</th><th scope="col">비중</th></tr></thead><tbody>{result.latestHoldings.length ? result.latestHoldings.map(row => <tr key={row.ticker}><td>{row.ticker}</td><td>{row.companyName}</td><td>{row.sector}</td><td>{row.weight.toFixed(1)}%</td></tr>) : <tr><td colSpan={4}>마지막 시점에 보유한 종목이 없습니다.</td></tr>}</tbody></table></div><p className="table-footnote">평균 보유 종목 {result.performance.averageHoldings.toFixed(1)}개 · 평균 현금 비중 {result.performance.averageCashWeight.toFixed(1)}%</p></div>}
    {tab === "trades" && <div className="result-panel-body"><div className="table-title"><h3>거래내역</h3><button type="button" className="text-button" onClick={exportTrades}><Download size={15} /> CSV</button></div><div className="responsive-table" role="region" aria-label="백테스트 거래내역 표" tabIndex={0}><table><thead><tr><th scope="col">거래일</th><th scope="col">종목</th><th scope="col">구분</th><th scope="col">체결가</th><th scope="col">거래금액</th><th scope="col">비용</th><th scope="col">선정 근거</th></tr></thead><tbody>{result.trades.slice().reverse().map((trade, index) => <tr key={`${trade.date}-${trade.ticker}-${trade.side}-${index}`}><td>{trade.date}</td><td>{trade.companyName}<small>{trade.ticker}</small></td><td>{trade.side}</td><td>{money(trade.price)}</td><td>{money(trade.amount)}</td><td>{money(trade.cost)}</td><td>{trade.reason}</td></tr>)}</tbody></table></div></div>}
    {tab === "exclusions" && <div className="result-panel-body"><div className="table-title"><h3>제외된 종목과 사유</h3><button type="button" className="text-button" onClick={exportExclusions}><Download size={15} /> CSV</button></div><div className="responsive-table" role="region" aria-label="백테스트 제외 종목과 사유 표" tabIndex={0}><table><thead><tr><th scope="col">판정일</th><th scope="col">종목</th><th scope="col">회사명</th><th scope="col">제외 사유</th></tr></thead><tbody>{result.exclusions.slice(0, 500).map((row, index) => <tr key={`${row.date}-${row.ticker}-${index}`}><td>{row.date}</td><td>{row.ticker}</td><td>{row.companyName}</td><td>{row.reason}</td></tr>)}</tbody></table></div>{result.exclusions.length > 500 && <p className="table-footnote">화면에는 처음 500건만 표시합니다. 전체 내역은 CSV로 내려받을 수 있습니다.</p>}</div>}
    <div className="result-export"><button type="button" onClick={exportSummary}><FileJson size={17} /> 결과 요약 JSON</button><button type="button" onClick={exportTrades}><FileSpreadsheet size={17} /> 거래내역 CSV</button><button type="button" onClick={copy}><Copy size={17} /> 결과 텍스트 복사</button></div>
    <div className="backtest-disclaimer"><strong>결과 해석 주의</strong><p>백테스트는 과거 데이터와 사용자가 설정한 기준에 따른 가상 시뮬레이션입니다. 과거 성과는 미래 수익을 보장하지 않습니다. 데이터 누락, 생존자 편향, 미래정보 참조, 비용·세금, 체결가격과 유동성에 따라 실제 결과는 크게 달라질 수 있습니다.</p>{result.warnings.map(warning => <p key={warning}>· {warning}</p>)}</div>
  </section>;
}

export function QuantBacktestWorkbench() {
  const [mode, setMode] = useState<"strategy" | "journal">("strategy");
  const [fundamentals, setFundamentals] = useState<ParsedDataset<FundamentalRow>>(emptyParsed());
  const [prices, setPrices] = useState<ParsedDataset<PriceRow>>(emptyParsed());
  const [benchmark, setBenchmark] = useState<ParsedDataset<BenchmarkRow>>(emptyParsed());
  const [filenames, setFilenames] = useState({ fundamentals: "", prices: "", benchmark: "" });
  const [screening, setScreening] = useState<ScreeningConfig>(defaultScreeningConfig);
  const [portfolio, setPortfolio] = useState<PortfolioConfig>(defaultPortfolio);
  const [costs, setCosts] = useState<CostConfig>(defaultCosts);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [journalRecords, setJournalRecords] = useState<JournalRecord[]>([]);
  const [journalMessage, setJournalMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("wdl-investment-journal");
        if (saved && localStorage.getItem("wdl-investment-journal:enabled") === "true") {
          const stored = parseStoredJournalJson(saved);
          if (stored.expired) {
            localStorage.removeItem("wdl-investment-journal");
            localStorage.removeItem("wdl-investment-journal:enabled");
            setJournalMessage("90일 보관기간이 지나 저장된 투자 기록을 삭제했습니다.");
          } else setJournalRecords(stored.records);
        }
        const transferred = sessionStorage.getItem("wdl-backtest-screening");
        if (transferred) { const parsed = parseStrategyJson(JSON.stringify({ screening: JSON.parse(transferred) })).screening; if (parsed) setScreening(current => ({ ...current, ...parsed, enabledRules: { ...current.enabledRules, ...(parsed.enabledRules ?? {}) } })); sessionStorage.removeItem("wdl-backtest-screening"); setJournalMessage("투자 기록장의 정량 기준을 불러왔습니다."); }
      } catch { try { localStorage.removeItem("wdl-investment-journal"); localStorage.removeItem("wdl-investment-journal:enabled"); } catch {/* 저장소가 차단된 경우 */} setJournalMessage("저장된 기록 또는 기준을 읽지 못해 기기 저장값을 정리했습니다."); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const quality = useMemo(() => validateDatasets({ fundamentals: fundamentals.rows, prices: prices.rows, benchmark: benchmark.rows, missingFundamentalColumns: fundamentals.missingColumns, missingPriceColumns: prices.missingColumns, missingBenchmarkColumns: benchmark.missingColumns, parseErrors: [...fundamentals.parseErrors, ...prices.parseErrors, ...benchmark.parseErrors] }), [fundamentals, prices, benchmark]);
  const replay = useMemo(() => replayJournal(journalRecords, prices.rows, screening), [journalRecords, prices.rows, screening]);
  const replaySummary = useMemo(() => journalSummary(replay), [replay]);

  const readCsv = async (kind: "fundamentals" | "prices" | "benchmark", file: File) => {
    if (file.size > 50 * 1024 * 1024) { setRunError(`${file.name}은 50MB를 초과해 불러올 수 없습니다.`); return; }
    setRunError("");
    const csvText = await file.text();
    if (kind === "fundamentals") setFundamentals(parseFundamentalsCsv(csvText));
    if (kind === "prices") setPrices(parsePricesCsv(csvText));
    if (kind === "benchmark") setBenchmark(parseBenchmarkCsv(csvText));
    setFilenames(current => ({ ...current, [kind]: file.name }));
    setResult(null);
  };
  const useSample = () => { const sample = createFictionalSample(); setFundamentals({ ...emptyParsed<FundamentalRow>(), rows: sample.fundamentals, headers: [...FUNDAMENTAL_COLUMNS] }); setPrices({ ...emptyParsed<PriceRow>(), rows: sample.prices, headers: [...PRICE_COLUMNS] }); setBenchmark({ ...emptyParsed<BenchmarkRow>(), rows: sample.benchmark, headers: [...BENCHMARK_COLUMNS] }); setFilenames({ fundamentals: "가상 fundamentals.csv", prices: "가상 prices.csv", benchmark: "가상 benchmark.csv" }); setPortfolio(defaultPortfolio); setResult(null); };
  const execute = () => { setRunning(true); setRunError(""); setResult(null); window.setTimeout(() => { try { setResult(runBacktest({ fundamentals: fundamentals.rows, prices: prices.rows, benchmark: benchmark.rows, screening, portfolio, costs })); } catch (error) { setRunError(error instanceof Error ? error.message : "백테스트 실행 중 오류가 발생했습니다."); } finally { setRunning(false); } }, 80); };
  const importJournal = async (file: File) => { try { if (file.size > 5 * 1024 * 1024) throw new Error("too large"); const records = parseJournalJson(await file.text()); setJournalRecords(records); setJournalMessage(`${records.length}건의 기록을 불러왔습니다. 원본 파일은 브라우저 밖으로 전송되지 않습니다.`); } catch { setJournalMessage("5MB 이하의 올바른 투자 기록 JSON인지 확인해 주세요."); } };
  const exportStrategy = () => downloadText("quant-backtest-strategy.json", JSON.stringify({ screening, portfolio, costs }, null, 2), "application/json");
  const importStrategy = async (file: File) => { try { if (file.size > 5 * 1024 * 1024) throw new Error("too large"); const parsed = parseStrategyJson(await file.text()); if (parsed.screening) setScreening(current => ({ ...current, ...parsed.screening, enabledRules: { ...current.enabledRules, ...(parsed.screening?.enabledRules ?? {}) } })); if (parsed.portfolio) setPortfolio(current => ({ ...current, ...parsed.portfolio })); if (parsed.costs) setCosts(current => ({ ...current, ...parsed.costs })); setJournalMessage("검증된 전략 설정을 불러왔습니다."); } catch { setJournalMessage("5MB 이하이며 허용된 필드·범위를 따르는 전략 JSON인지 확인해 주세요."); } };
  const currentStep = result ? 8 : running ? 7 : fundamentals.rows.length && prices.rows.length ? quality.blocked ? 3 : 6 : 2;

  return <div className="backtest-workbench">
    <div className="privacy-ribbon"><ShieldCheck size={19} /><div><strong>업로드 파일은 이 브라우저에서만 처리합니다.</strong><span>서버 저장, 로그인, 외부 금융 API 연결이 없습니다. 새로고침하면 업로드한 파일은 제거됩니다.</span></div></div>
    <div className="backtest-mode" role="group" aria-label="백테스트 방식"><button type="button" aria-pressed={mode === "strategy"} className={mode === "strategy" ? "active" : ""} onClick={() => setMode("strategy")}><BarChart3 size={21} /><span><b>정량 기준 전략 백테스트</b><small>전체 시장 데이터로 규칙 기반 포트폴리오 검증</small></span></button><button type="button" aria-pressed={mode === "journal"} className={mode === "journal" ? "active" : ""} onClick={() => setMode("journal")}><BookOpenCheck size={21} /><span><b>내 투자 기록 사후검증</b><small>실제로 검토하거나 투자한 종목의 결과 복기</small></span></button></div>
    {journalMessage && <p className="inline-message" role="status" aria-live="polite">{journalMessage}</p>}

    {mode === "journal" ? <section className="journal-replay"><div className="journal-replay-head"><div><span>JOURNAL REPLAY</span><h2>기록 당시의 판단과 실제 결과를 비교합니다.</h2><p>내 기록 사후검증은 사용자가 실제로 검토하거나 투자한 종목의 결과를 분석합니다. 전체 시장을 대상으로 한 전략 성과를 의미하지 않습니다.</p></div><JsonFileButton label="기록 JSON 불러오기" onFile={importJournal} /></div>
      <div className="journal-price-upload"><FileDrop label="기간별 수익률용 prices.csv" help="없으면 기록장에 입력한 실제 수익률만 분석합니다." filename={filenames.prices} optional onFile={file => readCsv("prices", file)} /></div>
      <div className="replay-kpis"><div><span>전체 기록</span><strong>{replaySummary.total}건</strong></div><div><span>실제 결과 입력</span><strong>{replaySummary.completed}건</strong></div><div><span>평균 실제 수익률</span><strong>{percent(replaySummary.averageReturn)}</strong></div><div><span>중앙값 수익률</span><strong>{percent(replaySummary.medianReturn)}</strong></div><div><span>승률</span><strong>{percent(replaySummary.winRate)}</strong></div><div><span>평균 기준 통과</span><strong>{replaySummary.averageRulePass.toFixed(1)}개</strong></div></div>
      <div className="sample-warning"><AlertTriangle size={18} /><p>{replaySummary.sampleWarning}</p></div>
      <div className="responsive-table" role="region" aria-label="투자 기록 사후검증 결과 표" tabIndex={0}><table><thead><tr><th scope="col">기록</th><th scope="col">기준 통과</th><th scope="col">실제</th><th scope="col">3개월</th><th scope="col">12개월</th><th scope="col">36개월</th><th scope="col">MDD</th><th scope="col">손실 예상 초과</th></tr></thead><tbody>{replay.length ? replay.map(row => <tr key={row.id}><td>{row.investmentName}<small>{row.ticker || "티커 없음"} · {row.decisionDate}<br />{row.entryType}</small></td><td>{row.passCount}/{row.validCount}</td><td>{percent(row.actualReturn)}</td><td>{percent(row.horizonReturns["3개월"])}</td><td>{percent(row.horizonReturns["12개월"])}</td><td>{percent(row.horizonReturns["36개월"])}</td><td>{percent(row.mdd)}</td><td>{row.worstLossExceeded === null ? "확인 불가" : row.worstLossExceeded ? "초과" : "범위 내"}</td></tr>) : <tr><td colSpan={8}>이 브라우저에 저장된 투자 기록이 없습니다. 투자 기록장에서 저장하거나 JSON을 불러와 주세요.</td></tr>}</tbody></table></div>
    </section> : <>
      <ol className="backtest-stepper" aria-label="백테스트 진행 단계">{steps.map((step, index) => <li key={step} className={index + 1 <= currentStep ? "active" : ""}><span>{String(index + 1).padStart(2, "0")}</span><b>{step}</b></li>)}</ol>
      <section className="backtest-section"><div className="backtest-section-head"><div><span>STEP 02</span><h2>과거 시점 데이터를 준비합니다.</h2></div><button className="sample-button" type="button" onClick={useSample}><FlaskConical size={16} /> 가상 샘플로 체험</button></div><p className="section-note">재무기간 종료일이 아니라 실제 공개 가능일이 포함된 데이터가 필요합니다. 샘플은 화면 체험을 위한 가상 데이터이며 투자판단에 사용할 수 없습니다.</p>
        <div className="upload-grid"><FileDrop label="fundamentals.csv" help="재무정보와 available_date" filename={filenames.fundamentals} onFile={file => readCsv("fundamentals", file)} /><FileDrop label="prices.csv" help="종목별 날짜와 adjusted_close" filename={filenames.prices} onFile={file => readCsv("prices", file)} /><FileDrop label="benchmark.csv" help="비교지수 수정종가" filename={filenames.benchmark} optional onFile={file => readCsv("benchmark", file)} /></div>
        <div className="template-actions"><button type="button" onClick={() => downloadText("fundamentals-template.csv", templates.fundamentals, "text/csv;charset=utf-8")}><Download size={15} /> 재무 템플릿</button><button type="button" onClick={() => downloadText("prices-template.csv", templates.prices, "text/csv;charset=utf-8")}><Download size={15} /> 가격 템플릿</button><button type="button" onClick={() => downloadText("benchmark-template.csv", templates.benchmark, "text/csv;charset=utf-8")}><Download size={15} /> 벤치마크 템플릿</button></div>
        <details className="data-dictionary"><summary>필수 열과 데이터 사전 보기</summary><div><p><b>재무 필수 열</b>{FUNDAMENTAL_COLUMNS.join(", ")}</p><p><b>가격 필수 열</b>{PRICE_COLUMNS.join(", ")}</p>{dataDictionary.map(([key, description]) => <p key={key}><b>{key}</b>{description}</p>)}<p><b>날짜 형식</b>YYYY-MM-DD로 통일해 주세요.</p></div></details>
      </section>
      {(fundamentals.rows.length > 0 || prices.rows.length > 0) && <QualityPanel report={quality} />}
      <StrategySettings screening={screening} setScreening={setScreening} />
      <section className="backtest-section"><div className="backtest-section-head"><div><span>STEP 05</span><h2>포트폴리오 구성 조건</h2></div><span className="leverage-badge">레버리지·공매도 없음</span></div><div className="backtest-field-grid"><label className="backtest-field"><span>시작일</span><input className="date-input" type="date" value={portfolio.startDate} onChange={event => setPortfolio(current => ({ ...current, startDate: event.target.value }))} /></label><label className="backtest-field"><span>종료일</span><input className="date-input" type="date" value={portfolio.endDate} onChange={event => setPortfolio(current => ({ ...current, endDate: event.target.value }))} /></label><NumberField label="초기 투자금" value={portfolio.initialCapital} onChange={value => setPortfolio(current => ({ ...current, initialCapital: value }))} unit="원" max={10_000_000_000_000} /><NumberField label="월 추가 투자금" value={portfolio.monthlyContribution} onChange={value => setPortfolio(current => ({ ...current, monthlyContribution: value }))} unit="원" max={10_000_000_000} /><label className="select-field"><span>리밸런싱 주기</span><select value={portfolio.rebalanceMonths} onChange={event => setPortfolio(current => ({ ...current, rebalanceMonths: Number(event.target.value) as PortfolioConfig["rebalanceMonths"] }))}><option value="1">월간</option><option value="3">분기</option><option value="6">반기</option><option value="12">연간</option></select></label><NumberField label="최대 보유 종목" value={portfolio.maxHoldings} onChange={value => setPortfolio(current => ({ ...current, maxHoldings: value }))} unit="개" min={1} max={100} /><NumberField label="최소 보유 종목" value={portfolio.minHoldings} onChange={value => setPortfolio(current => ({ ...current, minHoldings: value }))} unit="개" min={1} max={100} /><NumberField label="종목당 최대 비중" value={portfolio.maxPositionWeight} onChange={value => setPortfolio(current => ({ ...current, maxPositionWeight: value }))} unit="%" min={1} max={100} /><NumberField label="업종당 최대 비중" value={portfolio.maxSectorWeight} onChange={value => setPortfolio(current => ({ ...current, maxSectorWeight: value }))} unit="%" min={1} max={100} /><NumberField label="최소 시가총액" value={portfolio.minMarketCap} onChange={value => setPortfolio(current => ({ ...current, minMarketCap: value }))} unit="원" max={10_000_000_000_000_000} /><label className="select-field"><span>조건 미달 시 현금 보유</span><select value={portfolio.allowCash ? "yes" : "no"} onChange={event => setPortfolio(current => ({ ...current, allowCash: event.target.value === "yes" }))}><option value="yes">허용</option><option value="no">허용하지 않음</option></select></label></div><p className="section-note">동일가중을 사용하며 종목·업종 한도를 넘는 금액은 현금으로 남깁니다. 최소 종목 미달인데 현금을 허용하지 않으면 모순된 설정이므로 실행을 중단하고 이유를 표시합니다.</p></section>
      <section className="backtest-section"><div className="backtest-section-head"><div><span>STEP 06</span><h2>거래비용과 비교 기준</h2></div><span className="cost-warning">기본값 0%는 결과를 과대평가할 수 있습니다.</span></div><div className="backtest-field-grid"><NumberField label="매수 거래비용" value={costs.buyCost} onChange={value => setCosts(current => ({ ...current, buyCost: value }))} unit="%" max={10} step={.01} /><NumberField label="매도 거래비용" value={costs.sellCost} onChange={value => setCosts(current => ({ ...current, sellCost: value }))} unit="%" max={10} step={.01} /><NumberField label="슬리피지" value={costs.slippage} onChange={value => setCosts(current => ({ ...current, slippage: value }))} unit="%" max={20} step={.01} /><NumberField label="매도세·기타 세금" value={costs.sellTax} onChange={value => setCosts(current => ({ ...current, sellTax: value }))} unit="%" max={50} step={.01} /><NumberField label="연간 운용비용" value={costs.annualCost} onChange={value => setCosts(current => ({ ...current, annualCost: value }))} unit="%" max={20} step={.01} /><NumberField label="무위험수익률" value={costs.riskFreeRate} onChange={value => setCosts(current => ({ ...current, riskFreeRate: value }))} unit="%" max={100} step={.1} /></div>
        <div className="strategy-actions"><button type="button" onClick={exportStrategy}><FileJson size={16} /> 전략 설정 저장</button><JsonFileButton label="전략 설정 불러오기" onFile={importStrategy} /></div>
      </section>
      <section className="run-panel"><div><span>STEP 07</span><h2>현재 설정으로 과거 성과를 계산합니다.</h2><p>각 리밸런싱 시점 이전에 공개된 최신 재무정보만 선택하고, 신호일 다음 거래일 수정종가로 가상 체결합니다.</p></div><button className="run-button" type="button" disabled={running || quality.blocked || !fundamentals.rows.length || !prices.rows.length} onClick={execute}>{running ? <><span className="spinner" /> 계산 중</> : <><Play size={19} /> 백테스트 실행</>}</button></section>
      {(runError || ((fundamentals.rows.length > 0 || prices.rows.length > 0) && quality.blocked)) && <div className="run-error" role="alert"><XCircle size={18} /><p>{runError || "실행을 막는 데이터 오류가 있습니다. 품질검사 항목을 먼저 수정해 주세요."}</p></div>}
      {result && <Results result={result} />}
    </>}
  </div>;
}
