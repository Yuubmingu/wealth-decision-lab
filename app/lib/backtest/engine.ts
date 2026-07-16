import { calculatePerformance } from "./metrics";
import { screenCompany, selectLatestFundamentals } from "./rules";
import type { BacktestResult, BenchmarkRow, CostConfig, Exclusion, FundamentalRow, PortfolioConfig, PriceRow, ScreeningConfig, ScreenedCompany, Trade } from "./types";

type Holding = { ticker: string; companyName: string; sector: string; shares: number; entryPrice: number; passCount: number; validCount: number };

const addMonths = (date: string, months: number) => {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
};

export function nextTradingDate(dates: string[], signalDate: string) {
  return dates.find(date => date > signalDate) ?? null;
}

export function buildRebalanceSchedule(startDate: string, endDate: string, months: number, tradingDates: string[]) {
  const schedule: Array<{ signalDate: string; executionDate: string }> = [];
  for (let signalDate = startDate; signalDate < endDate; signalDate = addMonths(signalDate, months)) {
    const executionDate = nextTradingDate(tradingDates, signalDate);
    if (executionDate && executionDate <= endDate) schedule.push({ signalDate, executionDate });
  }
  return schedule;
}

export function equalWeights(count: number, maxPositionWeight: number) {
  if (count <= 0) return [];
  const weight = Math.min(1 / count, maxPositionWeight / 100);
  return Array.from({ length: count }, () => weight);
}

function enforceSectorLimit(rows: ScreenedCompany[], config: PortfolioConfig) {
  let selected = rows.slice(0, config.maxHoldings);
  while (selected.length > 1) {
    const weight = Math.min(1 / selected.length, config.maxPositionWeight / 100);
    const counts = new Map<string, number>();
    for (const row of selected) counts.set(row.sector, (counts.get(row.sector) ?? 0) + 1);
    const overSector = [...counts].find(([, count]) => count * weight * 100 > config.maxSectorWeight + 0.0001)?.[0];
    if (!overSector) break;
    const removeIndex = selected.map(row => row.sector).lastIndexOf(overSector);
    selected = selected.filter((_, index) => index !== removeIndex);
  }
  return selected;
}

export function runBacktest({ fundamentals, prices, benchmark, screening, portfolio, costs }: { fundamentals: FundamentalRow[]; prices: PriceRow[]; benchmark: BenchmarkRow[]; screening: ScreeningConfig; portfolio: PortfolioConfig; costs: CostConfig }): BacktestResult {
  const validPrices = prices.filter(row => row.adjustedClose > 0 && row.date >= portfolio.startDate && row.date <= portfolio.endDate).sort((a, b) => a.date.localeCompare(b.date));
  const tradingDates = [...new Set(validPrices.map(row => row.date))].sort();
  if (tradingDates.length < 2) throw new Error("백테스트 기간에 사용할 수 있는 가격데이터가 부족합니다.");
  const priceRowsByDate = new Map<string, PriceRow[]>();
  for (const row of validPrices) priceRowsByDate.set(row.date, [...(priceRowsByDate.get(row.date) ?? []), row]);
  const benchmarkByDate = new Map(benchmark.filter(row => row.date >= portfolio.startDate && row.date <= portfolio.endDate && row.adjustedClose > 0).map(row => [row.date, row.adjustedClose]));
  const schedule = buildRebalanceSchedule(portfolio.startDate, portfolio.endDate, portfolio.rebalanceMonths, tradingDates);
  const signalByExecution = new Map(schedule.map(item => [item.executionDate, item.signalDate]));
  const lastPrice = new Map<string, number>();
  const holdings = new Map<string, Holding>();
  const trades: Trade[] = [];
  const exclusions: Exclusion[] = [];
  const holdingCounts: number[] = [];
  const rawEquity: Array<{ date: string; value: number; benchmarkValue: number | null; cashWeight: number; cashFlow?: number }> = [];
  let cash = portfolio.initialCapital;
  let totalCosts = 0;
  let previousMonth = tradingDates[0].slice(0, 7);
  let latestBenchmarkPrice: number | null = null;
  let benchmarkUnits = 0;
  let benchmarkCash = portfolio.initialCapital;

  const portfolioValue = () => cash + [...holdings.values()].reduce((sum, holding) => sum + holding.shares * (lastPrice.get(holding.ticker) ?? holding.entryPrice), 0);

  for (const date of tradingDates) {
    for (const price of priceRowsByDate.get(date) ?? []) lastPrice.set(price.ticker, price.adjustedClose);
    if (benchmarkByDate.has(date)) latestBenchmarkPrice = benchmarkByDate.get(date) ?? null;
    const currentMonth = date.slice(0, 7);
    let cashFlow = 0;
    if (currentMonth !== previousMonth) {
      cash += portfolio.monthlyContribution;
      benchmarkCash += portfolio.monthlyContribution;
      cashFlow = portfolio.monthlyContribution;
      previousMonth = currentMonth;
    }
    if (latestBenchmarkPrice && benchmarkCash > 0) { benchmarkUnits += benchmarkCash / latestBenchmarkPrice; benchmarkCash = 0; }

    const signalDate = signalByExecution.get(date);
    if (signalDate) {
      const available = selectLatestFundamentals(fundamentals, signalDate);
      const candidates: ScreenedCompany[] = [];
      for (const row of available) {
        if (screening.excludedSectors.some(sector => row.sector.toLowerCase().includes(sector.toLowerCase()))) {
          exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: `기본 제외 업종: ${row.sector || "미입력"}` });
          continue;
        }
        if (row.delistingDate && row.delistingDate < date) { exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: "리밸런싱 전에 상장폐지" }); continue; }
        if (row.listingDate && row.listingDate > signalDate) { exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: "리밸런싱 당시 미상장" }); continue; }
        if (row.marketCap < portfolio.minMarketCap) { exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: "최소 시가총액 미달" }); continue; }
        if (!lastPrice.has(row.ticker)) { exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: "다음 거래일 가격 누락" }); continue; }
        const screened = screenCompany(row, screening);
        if (!screened.eligible) { exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: `${screened.passCount}/${screened.validCount}개 기준 통과` }); continue; }
        candidates.push(screened);
      }
      candidates.sort((a, b) => b.passRate - a.passRate || b.passCount - a.passCount || b.marketCap - a.marketCap || a.ticker.localeCompare(b.ticker));
      const selected = enforceSectorLimit(candidates, portfolio);
      if (selected.length >= portfolio.minHoldings) {
        for (const holding of holdings.values()) {
          const price = lastPrice.get(holding.ticker);
          if (!price) continue;
          const gross = holding.shares * price;
          const cost = gross * (costs.sellCost + costs.slippage + costs.sellTax) / 100;
          cash += gross - cost;
          totalCosts += cost;
          trades.push({ date, ticker: holding.ticker, companyName: holding.companyName, side: "매도", price, amount: gross, shares: holding.shares, cost, passCount: holding.passCount, validCount: holding.validCount, reason: "정기 리밸런싱" });
        }
        holdings.clear();
        const valueBeforeBuy = cash;
        const weights = equalWeights(selected.length, portfolio.maxPositionWeight);
        selected.forEach((company, index) => {
          const price = lastPrice.get(company.ticker);
          if (!price) return;
          const target = valueBeforeBuy * weights[index];
          const rate = (costs.buyCost + costs.slippage) / 100;
          const gross = Math.min(target, cash / (1 + rate));
          const shares = gross / price;
          const cost = gross * rate;
          cash -= gross + cost;
          totalCosts += cost;
          holdings.set(company.ticker, { ticker: company.ticker, companyName: company.companyName, sector: company.sector, shares, entryPrice: price, passCount: company.passCount, validCount: company.validCount });
          trades.push({ date, ticker: company.ticker, companyName: company.companyName, side: "매수", price, amount: gross, shares, cost, passCount: company.passCount, validCount: company.validCount, reason: `${company.passCount}/${company.validCount}개 기준 통과` });
        });
      } else {
        exclusions.push({ date, ticker: "—", companyName: "포트폴리오", reason: `최소 보유 종목 ${portfolio.minHoldings}개를 충족하지 못해 현금 유지` });
      }
      holdingCounts.push(holdings.size);
    }

    if (costs.annualCost > 0 && rawEquity.length > 0) {
      const dailyCost = Math.max(portfolioValue(), 0) * costs.annualCost / 100 / 252;
      cash -= dailyCost;
      totalCosts += dailyCost;
    }
    const value = portfolioValue();
    rawEquity.push({ date, value, benchmarkValue: latestBenchmarkPrice ? benchmarkUnits * latestBenchmarkPrice + benchmarkCash : null, cashWeight: value > 0 ? Math.max(cash, 0) / value * 100 : 100, cashFlow });
  }

  const calculated = calculatePerformance(rawEquity, costs.riskFreeRate, totalCosts, trades.length, holdingCounts);
  const finalValue = rawEquity.at(-1)?.value ?? portfolio.initialCapital;
  const lastValue = finalValue || 1;
  const latestHoldings = [...holdings.values()].map(holding => ({ ticker: holding.ticker, companyName: holding.companyName, sector: holding.sector, weight: holding.shares * (lastPrice.get(holding.ticker) ?? holding.entryPrice) / lastValue * 100 })).sort((a, b) => b.weight - a.weight);
  const warnings = [
    "수정종가의 배당 반영 범위는 데이터 제공처마다 다릅니다. total return 데이터가 없다면 배당 재투자가 완전히 반영되지 않을 수 있습니다.",
    "상장폐지 종목과 당시 업종 정보가 빠진 데이터는 생존자 편향과 분류 편향을 만들 수 있습니다.",
  ];
  return { performance: { finalValue, cumulativeReturn: calculated.cumulativeReturn, cagr: calculated.cagr, mdd: calculated.mdd, volatility: calculated.volatility, sharpe: calculated.sharpe, benchmarkReturn: calculated.benchmarkReturn, excessReturn: calculated.excessReturn, totalCosts, tradeCount: trades.length, averageHoldings: calculated.averageHoldings, averageCashWeight: calculated.averageCashWeight }, equity: calculated.equity, trades, exclusions, latestHoldings, warnings };
}

