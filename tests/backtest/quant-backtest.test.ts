import { describe, expect, it } from "vitest";
import { buildRebalanceSchedule, equalWeights, nextTradingDate, runBacktest } from "../../app/lib/backtest/engine";
import { adaptJournalRecord, journalSummary, replayJournal } from "../../app/lib/backtest/journal-adapter";
import { calculatePerformance, deriveFundamentals, twoYearCagr } from "../../app/lib/backtest/metrics";
import { defaultScreeningConfig, evaluateRules, screenCompany, selectLatestFundamentals } from "../../app/lib/backtest/rules";
import { validateDatasets } from "../../app/lib/backtest/validation";
import type { BenchmarkRow, CostConfig, FundamentalRow, PortfolioConfig, PriceRow, ScreeningConfig } from "../../app/lib/backtest/types";

const fundamental = (override: Partial<FundamentalRow> = {}): FundamentalRow => ({
  availableDate: "2020-03-31", fiscalPeriodEnd: "2019-12-31", ticker: "AAA", companyName: "가상전자", market: "가상시장", sector: "정보기술", marketCap: 1_000_000_000_000,
  companyPer: 10, sectorPer: 15, forwardPer: 9, pbr: 1, evEbitda: 6, fcfYield: 5, dividendYield: 2,
  revenueY2: 100, revenueY1: 110, revenueY0: 121, opIncomeY2: 10, opIncomeY1: 12, opIncomeY0: 15,
  roe: 12, roic: 14, netIncome: 10, operatingCashFlow: 12, capex: 3, debtRatio: 80, netDebtEbitda: 1.5, interestCoverage: 8,
  fairValue: null, currency: "KRW", listingDate: "2010-01-01", delistingDate: "", ...override,
});
const screening: ScreeningConfig = { ...defaultScreeningConfig, enabledRules: { ...defaultScreeningConfig.enabledRules } };
const prices: PriceRow[] = [
  { date: "2020-04-01", ticker: "AAA", adjustedClose: 100, open: null, close: null, volume: 1000 },
  { date: "2020-04-02", ticker: "AAA", adjustedClose: 101, open: null, close: null, volume: 1000 },
  { date: "2020-05-01", ticker: "AAA", adjustedClose: 105, open: null, close: null, volume: 1000 },
  { date: "2020-06-01", ticker: "AAA", adjustedClose: 90, open: null, close: null, volume: 1000 },
  { date: "2020-07-01", ticker: "AAA", adjustedClose: 110, open: null, close: null, volume: 1000 },
  { date: "2020-07-02", ticker: "AAA", adjustedClose: 112, open: null, close: null, volume: 1000 },
];
const portfolio: PortfolioConfig = { startDate: "2020-03-31", endDate: "2020-07-02", initialCapital: 10_000_000, monthlyContribution: 0, rebalanceMonths: 3, maxHoldings: 10, minHoldings: 1, maxPositionWeight: 100, maxSectorWeight: 100, minMarketCap: 0, allowCash: true };
const costs: CostConfig = { buyCost: 0, sellCost: 0, slippage: 0, sellTax: 0, annualCost: 0, riskFreeRate: 0 };

describe("파생 재무지표", () => {
  it("1. 매출 CAGR을 계산한다", () => expect(twoYearCagr(100, 121)).toBeCloseTo(10, 8));
  it("2. Y-2에서 Y0는 두 개의 연간 구간이다", () => expect(twoYearCagr(100, 144)).toBeCloseTo(20, 8));
  it("3. 영업이익 시작값이 음수이면 CAGR은 N/A다", () => expect(twoYearCagr(-10, 20)).toBeNull());
  it("4. 순이익이 0 이하이면 현금전환율은 N/A다", () => expect(deriveFundamentals(fundamental({ netIncome: 0 })).cashConversion).toBeNull());
  it("5. FCF는 영업현금흐름에서 양수 CAPEX를 차감한다", () => expect(deriveFundamentals(fundamental()).estimatedFcf).toBe(9));
  it("6. 업종 PER 할인율을 계산한다", () => expect(deriveFundamentals(fundamental()).perDiscount).toBeCloseTo(33.3333, 3));
  it("7. 영업이익률 변화를 %p로 계산한다", () => expect(deriveFundamentals(fundamental()).opMarginChange).toBeCloseTo(2.39669, 3));
});

describe("정량 규칙", () => {
  const result = evaluateRules(fundamental(), screening);
  it("8. 업종 PER 이하를 통과한다", () => expect(result.find(rule => rule.key === "per")?.value).toBe(true));
  it("9. 선행 PER 개선을 통과한다", () => expect(result.find(rule => rule.key === "forwardPer")?.value).toBe(true));
  it("10. ROIC 기준을 판정한다", () => expect(result.find(rule => rule.key === "roic")?.value).toBe(true));
  it("11. 부채비율 기준을 판정한다", () => expect(evaluateRules(fundamental({ debtRatio: 250 }), screening).find(rule => rule.key === "debtRatio")?.value).toBe(false));
  it("12. 순차입금/EBITDA 기준을 판정한다", () => expect(evaluateRules(fundamental({ netDebtEbitda: 4 }), screening).find(rule => rule.key === "netDebtEbitda")?.value).toBe(false));
  it("13. 이자보상배율 기준을 판정한다", () => expect(evaluateRules(fundamental({ interestCoverage: 2 }), screening).find(rule => rule.key === "interestCoverage")?.value).toBe(false));
  it("14. N/A 분모 제외 방식은 유효 기준만 센다", () => expect(screenCompany(fundamental({ sectorPer: null }), screening).validCount).toBe(9));
  it("15. 최소 통과 개수를 적용한다", () => expect(screenCompany(fundamental(), { ...screening, minimumPass: 10 }).eligible).toBe(true));
  it("16. N/A 종목 제외 방식은 누락값이 있으면 제외한다", () => expect(screenCompany(fundamental({ sectorPer: null }), { ...screening, naHandling: "exclude-stock" }).eligible).toBe(false));
  it("17. 전체 조건 방식은 모든 유효 기준을 요구한다", () => expect(screenCompany(fundamental({ debtRatio: 250 }), { ...screening, mode: "all" }).eligible).toBe(false));
});

describe("시점과 포트폴리오", () => {
  it("18. 공개일 당일이 아닌 다음 거래일을 찾는다", () => expect(nextTradingDate(["2020-03-31", "2020-04-01"], "2020-03-31")).toBe("2020-04-01"));
  it("19. 공개일 이전 가격을 반환하지 않는다", () => expect(nextTradingDate(["2020-03-30", "2020-03-31"], "2020-03-31")).toBeNull());
  it("20. 당시 공개된 최신 재무행만 고른다", () => { const rows = [fundamental({ availableDate: "2019-03-31" }), fundamental({ availableDate: "2020-03-31", companyPer: 11 }), fundamental({ availableDate: "2021-03-31", companyPer: 12 })]; expect(selectLatestFundamentals(rows, "2020-06-01")[0].companyPer).toBe(11); });
  it("21. 동일가중을 계산한다", () => expect(equalWeights(4, 100)).toEqual([.25, .25, .25, .25]));
  it("22. 종목당 최대 비중을 적용하고 나머지는 현금으로 둔다", () => expect(equalWeights(2, 20)).toEqual([.2, .2]));
  it("23. 분기 리밸런싱 일정을 만든다", () => expect(buildRebalanceSchedule("2020-03-31", "2020-07-02", 3, prices.map(row => row.date))).toEqual([{ signalDate: "2020-03-31", executionDate: "2020-04-01" }, { signalDate: "2020-07-01", executionDate: "2020-07-02" }]));
  it("24. 업종 한도가 낮으면 포트폴리오 비중을 제한한다", () => { const second = fundamental({ ticker: "BBB", companyName: "가상2", availableDate: "2020-03-31" }); const secondPrices = prices.map(row => ({ ...row, ticker: "BBB" })); const result = runBacktest({ fundamentals: [fundamental(), second], prices: [...prices, ...secondPrices], benchmark: [], screening, portfolio: { ...portfolio, maxSectorWeight: 50, maxPositionWeight: 50 }, costs }); expect(result.latestHoldings.reduce((sum, row) => sum + row.weight, 0)).toBeLessThanOrEqual(50.01); });
  it("25. 거래비용을 최종자산과 총비용에 반영한다", () => { const free = runBacktest({ fundamentals: [fundamental()], prices, benchmark: [], screening, portfolio, costs }); const paid = runBacktest({ fundamentals: [fundamental()], prices, benchmark: [], screening, portfolio, costs: { ...costs, buyCost: 1, sellCost: 1 } }); expect(paid.performance.finalValue).toBeLessThan(free.performance.finalValue); expect(paid.performance.totalCosts).toBeGreaterThan(0); });
});

describe("성과 계산", () => {
  const equity = [{ date: "2020-01-01", value: 100, benchmarkValue: 100, cashWeight: 0 }, { date: "2020-01-02", value: 110, benchmarkValue: 105, cashWeight: 0 }, { date: "2020-01-03", value: 88, benchmarkValue: 102, cashWeight: 0 }, { date: "2021-01-01", value: 121, benchmarkValue: 110, cashWeight: 0 }];
  const performance = calculatePerformance(equity, 0, 0, 0, [1]);
  it("26. 누적수익률을 계산한다", () => expect(performance.cumulativeReturn).toBeCloseTo(21, 6));
  it("27. 실제 경과일을 반영해 CAGR을 계산한다", () => expect(performance.cagr).toBeCloseTo(20.937, 2));
  it("28. 연환산 변동성을 계산한다", () => expect(performance.volatility).toBeGreaterThan(0));
  it("29. MDD를 계산한다", () => expect(performance.mdd).toBeCloseTo(-20, 6));
  it("30. 벤치마크 수익률을 계산한다", () => expect(performance.benchmarkReturn).toBeCloseTo(10, 6));
});

describe("데이터 품질", () => {
  it("31. 빈 파일은 실행을 차단한다", () => expect(validateDatasets({ fundamentals: [], prices: [], benchmark: [] }).blocked).toBe(true));
  it("32. 필수 열 누락을 차단한다", () => expect(validateDatasets({ fundamentals: [fundamental()], prices, benchmark: [], missingFundamentalColumns: ["ticker"] }).blocked).toBe(true));
  it("33. 잘못된 날짜를 차단한다", () => expect(validateDatasets({ fundamentals: [fundamental({ availableDate: "2020-99-99" })], prices, benchmark: [] }).blocked).toBe(true));
  it("34. 미래정보 참조 위험을 차단한다", () => expect(validateDatasets({ fundamentals: [fundamental({ availableDate: "2019-01-01", fiscalPeriodEnd: "2019-12-31" })], prices, benchmark: [] }).blocked).toBe(true));
  it("35. 중복 데이터를 경고한다", () => expect(validateDatasets({ fundamentals: [fundamental(), fundamental()], prices, benchmark: [] }).issues.some(issue => issue.code === "duplicate-fundamentals")).toBe(true));
  it("36. 매우 큰 행 수를 차단한다", () => { const huge = Array.from({ length: 300_001 }, () => prices[0]); expect(validateDatasets({ fundamentals: [fundamental()], prices: huge, benchmark: [] }).issues.some(issue => issue.code === "too-large")).toBe(true); });
  it("37. 가격이 없는 재무 종목을 경고한다", () => expect(validateDatasets({ fundamentals: [fundamental({ ticker: "NO_PRICE" })], prices, benchmark: [] }).issues.some(issue => issue.code === "ticker-mismatch")).toBe(true));
});

describe("투자 기록 호환", () => {
  const legacy = { id: "1", investmentName: "과거기록", ticker: "AAA", decisionDate: "2020-04-01", currentPrice: 100, per: 10, industryPer: 15, forwardPer: 9, revenueOld: 100, revenueMid: 110, revenueRecent: 121, operatingProfitOld: 10, operatingProfitMid: 12, operatingProfitRecent: 15, roic: 14, netIncome: 10, operatingCashFlow: 12, capex: 3, debtRatio: 80, netDebtEbitda: 1.5, interestCoverage: 8, expectedReturn: 10, worstLoss: 30, actualReturn: 12 };
  it("38. 구버전 JSON을 내부 형식으로 변환한다", () => { const adapted = adaptJournalRecord(legacy); expect(adapted.name).toBe("과거기록"); expect(adapted.entryType).toBe("가상 검토가"); });
  it("39. 가격 CSV가 있으면 기간별 수익률을 계산한다", () => expect(replayJournal([legacy], prices, screening)[0].horizonReturns["3개월"]).not.toBeNull());
  it("40. 실제 결과 통계를 계산한다", () => { const summary = journalSummary(replayJournal([legacy], prices, screening)); expect(summary.completed).toBe(1); expect(summary.averageReturn).toBe(12); });
  it("41. 사용자 기록을 URL로 직렬화하지 않는다", () => { const url = "/invest/quant-backtest"; expect(url).not.toContain("과거기록"); expect(url).not.toContain("AAA"); });
});
