import { calculatePerformance } from "./metrics";
import { screenCompany, selectLatestFundamentals } from "./rules";
import type { BacktestResult, BenchmarkRow, CostConfig, Exclusion, FundamentalRow, PortfolioConfig, PriceRow, ScreeningConfig, ScreenedCompany, Trade } from "./types";

type Holding = { ticker: string; companyName: string; sector: string; shares: number; entryPrice: number; passCount: number; validCount: number };

const addMonths = (date: string, months: number) => {
  const [year, month, day] = date.split("-").map(Number);
  const sourceMonthEnd = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const targetStart = new Date(Date.UTC(year, month - 1 + months, 1));
  const targetMonthEnd = new Date(Date.UTC(targetStart.getUTCFullYear(), targetStart.getUTCMonth() + 1, 0)).getUTCDate();
  targetStart.setUTCDate(day === sourceMonthEnd ? targetMonthEnd : Math.min(day, targetMonthEnd));
  return targetStart.toISOString().slice(0, 10);
};

const daysBetween = (start: string, end: string) => Math.max((Date.parse(end) - Date.parse(start)) / 86_400_000, 0);
const monthIndex = (date: string) => {
  const [year, month] = date.split("-").map(Number);
  return year * 12 + month - 1;
};

export function nextTradingDate(dates: string[], signalDate: string) {
  return dates.find(date => date > signalDate) ?? null;
}

export function buildRebalanceSchedule(startDate: string, endDate: string, months: number, tradingDates: string[]) {
  const schedule: Array<{ signalDate: string; executionDate: string }> = [];
  const interval = Math.max(Math.floor(months), 1);
  for (let signalDate = startDate; signalDate < endDate; signalDate = addMonths(signalDate, interval)) {
    const executionDate = nextTradingDate(tradingDates, signalDate);
    if (executionDate && executionDate <= endDate) schedule.push({ signalDate, executionDate });
  }
  return schedule;
}

export function equalWeights(count: number, maxPositionWeight: number) {
  if (count <= 0) return [];
  const weight = Math.min(1 / count, Math.max(maxPositionWeight, 0) / 100);
  return Array.from({ length: count }, () => weight);
}

function selectWithCappedWeights(rows: ScreenedCompany[], config: PortfolioConfig) {
  const limit = Math.min(Math.max(Math.floor(config.maxHoldings), 0), rows.length);
  const requiredSectors = Math.min(Math.max(Math.ceil(100 / Math.max(config.maxSectorWeight, 0.0001)), 1), limit);
  const selected: ScreenedCompany[] = [];
  const selectedTickers = new Set<string>();
  const sectors = new Set<string>();
  for (const row of rows) {
    if (selected.length >= requiredSectors) break;
    if (sectors.has(row.sector)) continue;
    selected.push(row);
    selectedTickers.add(row.ticker);
    sectors.add(row.sector);
  }
  for (const row of rows) {
    if (selected.length >= limit) break;
    if (selectedTickers.has(row.ticker)) continue;
    selected.push(row);
    selectedTickers.add(row.ticker);
  }
  const baseWeights = equalWeights(selected.length, config.maxPositionWeight);
  const sectorCounts = new Map<string, number>();
  for (const row of selected) sectorCounts.set(row.sector, (sectorCounts.get(row.sector) ?? 0) + 1);
  const sectorCap = Math.max(config.maxSectorWeight, 0) / 100;
  const weights = selected.map((row, index) => Math.min(baseWeights[index], sectorCap / Math.max(sectorCounts.get(row.sector) ?? 1, 1)));
  return { selected, weights };
}

export function runBacktest({ fundamentals, prices, benchmark, screening, portfolio, costs }: { fundamentals: FundamentalRow[]; prices: PriceRow[]; benchmark: BenchmarkRow[]; screening: ScreeningConfig; portfolio: PortfolioConfig; costs: CostConfig }): BacktestResult {
  if (portfolio.startDate >= portfolio.endDate) throw new Error("종료일은 시작일보다 뒤여야 합니다.");
  if (portfolio.minHoldings > portfolio.maxHoldings) throw new Error("최소 보유 종목은 최대 보유 종목보다 클 수 없습니다.");
  const seenPriceKeys = new Set<string>();
  for (const row of prices) {
    const key = `${row.ticker}|${row.date}`;
    if (seenPriceKeys.has(key)) throw new Error("동일 종목·날짜의 중복 가격행을 제거한 뒤 다시 실행해 주세요.");
    seenPriceKeys.add(key);
  }
  const validPrices = prices.filter(row => row.adjustedClose > 0 && row.date >= portfolio.startDate && row.date <= portfolio.endDate).sort((a, b) => a.date.localeCompare(b.date));
  const tradingDates = [...new Set(validPrices.map(row => row.date))].sort();
  if (tradingDates.length < 2) throw new Error("백테스트 기간에 사용할 수 있는 가격데이터가 부족합니다.");

  const priceRowsByDate = new Map<string, PriceRow[]>();
  for (const row of validPrices) {
    const rows = priceRowsByDate.get(row.date);
    if (rows) rows.push(row);
    else priceRowsByDate.set(row.date, [row]);
  }
  const benchmarkByDate = new Map(benchmark.filter(row => row.date >= portfolio.startDate && row.date <= portfolio.endDate && row.adjustedClose > 0).map(row => [row.date, row.adjustedClose]));
  const benchmarkEnabled = benchmarkByDate.size > 0;
  const schedule = buildRebalanceSchedule(portfolio.startDate, portfolio.endDate, portfolio.rebalanceMonths, tradingDates);
  const signalByExecution = new Map(schedule.map(item => [item.executionDate, item.signalDate]));
  const lastPrice = new Map<string, number>();
  const lastPriceDate = new Map<string, string>();
  const delistingDates = new Map<string, string>();
  for (const row of fundamentals) {
    if (!row.delistingDate) continue;
    const current = delistingDates.get(row.ticker);
    if (!current || row.delistingDate < current) delistingDates.set(row.ticker, row.delistingDate);
  }
  const holdings = new Map<string, Holding>();
  const trades: Trade[] = [];
  const exclusions: Exclusion[] = [];
  const holdingCounts: number[] = [];
  const rawEquity: Array<{ date: string; value: number; benchmarkValue: number | null; cashWeight: number; cashFlow?: number }> = [{ date: portfolio.startDate, value: portfolio.initialCapital, benchmarkValue: benchmarkEnabled ? portfolio.initialCapital : null, cashWeight: 100, cashFlow: 0 }];
  let cash = portfolio.initialCapital;
  let totalCosts = 0;
  let previousDate = portfolio.startDate;
  let previousContributionMonth = monthIndex(portfolio.startDate);
  let latestBenchmarkPrice: number | null = null;
  let benchmarkUnits = 0;
  let benchmarkCash = portfolio.initialCapital;

  const portfolioValue = () => cash + [...holdings.values()].reduce((sum, holding) => sum + holding.shares * (lastPrice.get(holding.ticker) ?? holding.entryPrice), 0);
  const sellAllAtFreshPrices = (date: string, todayPrices: Map<string, number>, reason: string) => {
    const missing = [...holdings.values()].filter(holding => !todayPrices.has(holding.ticker));
    if (missing.length) {
      for (const holding of missing) exclusions.push({ date, ticker: holding.ticker, companyName: holding.companyName, reason: "리밸런싱 실행일 가격 누락으로 전체 교체를 건너뜀" });
      return false;
    }
    for (const holding of holdings.values()) {
      const price = todayPrices.get(holding.ticker)!;
      const gross = holding.shares * price;
      const cost = gross * (costs.sellCost + costs.slippage + costs.sellTax) / 100;
      cash += gross - cost;
      totalCosts += cost;
      trades.push({ date, ticker: holding.ticker, companyName: holding.companyName, side: "매도", price, amount: gross, shares: holding.shares, cost, passCount: holding.passCount, validCount: holding.validCount, reason });
    }
    holdings.clear();
    return true;
  };

  for (const date of tradingDates) {
    const todayPrices = new Map<string, number>();
    for (const price of priceRowsByDate.get(date) ?? []) {
      lastPrice.set(price.ticker, price.adjustedClose);
      lastPriceDate.set(price.ticker, date);
      todayPrices.set(price.ticker, price.adjustedClose);
    }
    if (benchmarkByDate.has(date)) latestBenchmarkPrice = benchmarkByDate.get(date) ?? null;

    const elapsedMonths = Math.max(monthIndex(date) - previousContributionMonth, 0);
    const contribution = portfolio.monthlyContribution * elapsedMonths;
    if (contribution > 0) {
      cash += contribution;
      benchmarkCash += contribution;
    }
    previousContributionMonth = monthIndex(date);
    if (latestBenchmarkPrice && benchmarkCash > 0) {
      benchmarkUnits += benchmarkCash / latestBenchmarkPrice;
      benchmarkCash = 0;
    }

    for (const holding of [...holdings.values()]) {
      const delistingDate = delistingDates.get(holding.ticker);
      if (!delistingDate || date < delistingDate) continue;
      const price = todayPrices.get(holding.ticker) ?? 0;
      const gross = holding.shares * price;
      const cost = gross * (costs.sellCost + costs.slippage + costs.sellTax) / 100;
      cash += gross - cost;
      totalCosts += cost;
      trades.push({ date, ticker: holding.ticker, companyName: holding.companyName, side: "매도", price, amount: gross, shares: holding.shares, cost, passCount: holding.passCount, validCount: holding.validCount, reason: price > 0 ? "상장폐지일 입력에 따른 청산" : "상장폐지 후 가격 누락으로 0원 처리" });
      exclusions.push({ date, ticker: holding.ticker, companyName: holding.companyName, reason: price > 0 ? "상장폐지일 가격으로 청산" : "상장폐지 가격·회수금 정보가 없어 보수적으로 0원 처리" });
      holdings.delete(holding.ticker);
    }

    const signalDate = signalByExecution.get(date);
    if (signalDate) {
      const available = selectLatestFundamentals(fundamentals, signalDate);
      const candidates: ScreenedCompany[] = [];
      for (const row of available) {
        if (screening.excludedSectors.some(sector => row.sector.toLowerCase().includes(sector.toLowerCase()))) {
          exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: `기본 제외 업종: ${row.sector || "미입력"}` });
          continue;
        }
        if (row.delistingDate && row.delistingDate <= date) { exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: "리밸런싱 전에 상장폐지" }); continue; }
        if (row.listingDate && row.listingDate > signalDate) { exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: "리밸런싱 당시 미상장" }); continue; }
        if (row.marketCap < portfolio.minMarketCap) { exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: "최소 시가총액 미달" }); continue; }
        if (!todayPrices.has(row.ticker)) { exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: "실행일 가격 누락(과거 가격 대체 사용 안 함)" }); continue; }
        const screened = screenCompany(row, screening);
        if (!screened.eligible) { exclusions.push({ date, ticker: row.ticker, companyName: row.companyName, reason: `${screened.passCount}/${screened.validCount}개 기준 통과` }); continue; }
        candidates.push(screened);
      }
      candidates.sort((a, b) => b.passRate - a.passRate || b.passCount - a.passCount || b.marketCap - a.marketCap || a.ticker.localeCompare(b.ticker));
      const { selected, weights } = selectWithCappedWeights(candidates, portfolio);

      if (selected.length < portfolio.minHoldings) {
        exclusions.push({ date, ticker: "—", companyName: "포트폴리오", reason: `선정 ${selected.length}개로 최소 보유 종목 ${portfolio.minHoldings}개 미달` });
        if (!portfolio.allowCash) throw new Error("최소 보유 종목을 충족하지 못했고 현금 보유도 허용하지 않아 실행할 수 없습니다.");
        sellAllAtFreshPrices(date, todayPrices, "최소 보유 종목 미달로 현금 전환");
      } else {
        const investedWeight = weights.reduce((sum, weight) => sum + weight, 0);
        if (!portfolio.allowCash && investedWeight < 0.999999) throw new Error("종목당 최대 비중 때문에 현금이 남습니다. 현금 보유를 허용하거나 비중 한도를 높여 주세요.");
        if (sellAllAtFreshPrices(date, todayPrices, "정기 리밸런싱")) {
          const valueBeforeBuy = cash;
          const rate = (costs.buyCost + costs.slippage) / 100;
          const grossBuyTotal = Math.min(valueBeforeBuy * investedWeight, valueBeforeBuy / (1 + rate));
          selected.forEach((company, index) => {
            const price = todayPrices.get(company.ticker);
            if (!price) return;
            const gross = investedWeight > 0 ? grossBuyTotal * weights[index] / investedWeight : 0;
            const shares = gross / price;
            const cost = gross * rate;
            cash -= gross + cost;
            totalCosts += cost;
            holdings.set(company.ticker, { ticker: company.ticker, companyName: company.companyName, sector: company.sector, shares, entryPrice: price, passCount: company.passCount, validCount: company.validCount });
            trades.push({ date, ticker: company.ticker, companyName: company.companyName, side: "매수", price, amount: gross, shares, cost, passCount: company.passCount, validCount: company.validCount, reason: `${company.passCount}/${company.validCount}개 기준 통과` });
          });
        }
      }
      holdingCounts.push(holdings.size);
    }

    const elapsedDays = daysBetween(previousDate, date);
    if (costs.annualCost > 0 && elapsedDays > 0) {
      const periodCost = Math.max(portfolioValue(), 0) * (1 - Math.pow(1 - Math.min(costs.annualCost / 100, 0.999999), elapsedDays / 365));
      cash -= periodCost;
      totalCosts += periodCost;
    }
    previousDate = date;
    const value = portfolioValue();
    rawEquity.push({ date, value, benchmarkValue: benchmarkEnabled ? benchmarkUnits * (latestBenchmarkPrice ?? 0) + benchmarkCash : null, cashWeight: value > 0 ? Math.max(cash, 0) / value * 100 : 100, cashFlow: contribution });
  }

  const calculated = calculatePerformance(rawEquity, costs.riskFreeRate, totalCosts, trades.length, holdingCounts);
  const finalValue = rawEquity.at(-1)?.value ?? portfolio.initialCapital;
  const lastValue = finalValue || 1;
  const latestHoldings = [...holdings.values()].map(holding => ({ ticker: holding.ticker, companyName: holding.companyName, sector: holding.sector, weight: holding.shares * (lastPrice.get(holding.ticker) ?? holding.entryPrice) / lastValue * 100 })).sort((a, b) => b.weight - a.weight);
  const staleHoldings = [...holdings.values()].filter(holding => daysBetween(lastPriceDate.get(holding.ticker) ?? portfolio.startDate, portfolio.endDate) > 31).length;
  const warnings = [
    "수정종가의 배당 반영 범위는 데이터 제공처마다 다릅니다. total return 데이터가 없다면 배당 재투자가 완전히 반영되지 않을 수 있습니다.",
    "상장폐지 회수금이 없으면 상장폐지일 이후 가치를 0원으로 처리합니다. 실제 회수금이 있다면 가격 데이터에 반영해야 합니다.",
    "연환산 변동성은 관측 수익률의 표본 표준편차와 실제 관측 빈도로 계산합니다. 불규칙한 가격 간격이나 긴 공백은 결과를 왜곡할 수 있습니다.",
    ...(staleHoldings ? [`종료일 기준 31일 넘게 가격이 갱신되지 않은 보유 종목이 ${staleHoldings}개 있어 마지막 관측가 평가가 포함됩니다.`] : []),
  ];
  return { performance: { finalValue, cumulativeReturn: calculated.cumulativeReturn, cagr: calculated.cagr, mdd: calculated.mdd, volatility: calculated.volatility, sharpe: calculated.sharpe, benchmarkReturn: calculated.benchmarkReturn, excessReturn: calculated.excessReturn, totalCosts, tradeCount: trades.length, averageHoldings: calculated.averageHoldings, averageCashWeight: calculated.averageCashWeight }, equity: calculated.equity, trades, exclusions, latestHoldings, warnings };
}
