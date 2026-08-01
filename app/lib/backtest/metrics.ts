import type { DerivedFundamentals, EquityPoint, FundamentalRow, NullableNumber } from "./types";

const valid = (value: NullableNumber): value is number => value !== null && Number.isFinite(value);
const ratio = (numerator: NullableNumber, denominator: NullableNumber): NullableNumber =>
  valid(numerator) && valid(denominator) && denominator !== 0 ? (numerator / denominator) * 100 : null;

export function twoYearCagr(start: NullableNumber, end: NullableNumber): NullableNumber {
  if (!valid(start) || !valid(end) || start <= 0 || end <= 0) return null;
  return (Math.pow(end / start, 1 / 2) - 1) * 100;
}

export function deriveFundamentals(row: FundamentalRow): DerivedFundamentals {
  const opMarginY2 = ratio(row.opIncomeY2, row.revenueY2);
  const opMarginY1 = ratio(row.opIncomeY1, row.revenueY1);
  const opMarginY0 = ratio(row.opIncomeY0, row.revenueY0);
  return {
    ...row,
    opMarginY2,
    opMarginY1,
    opMarginY0,
    revenueCagr: twoYearCagr(row.revenueY2, row.revenueY0),
    opIncomeCagr: twoYearCagr(row.opIncomeY2, row.opIncomeY0),
    opMarginChange: valid(opMarginY2) && valid(opMarginY0) ? opMarginY0 - opMarginY2 : null,
    cashConversion: valid(row.netIncome) && row.netIncome > 0 ? ratio(row.operatingCashFlow, row.netIncome) : null,
    estimatedFcf: valid(row.operatingCashFlow) && valid(row.capex) ? row.operatingCashFlow - row.capex : null,
    perDiscount:
      valid(row.sectorPer) && row.sectorPer > 0 && valid(row.companyPer)
        ? ((row.sectorPer - row.companyPer) / row.sectorPer) * 100
        : null,
  };
}

export function calculatePerformance(
  equity: Array<Omit<EquityPoint, "drawdown"> & { cashFlow?: number }>,
  riskFreeRate: number,
  totalCosts: number,
  tradeCount: number,
  holdingCounts: number[],
): { equity: EquityPoint[]; cumulativeReturn: number; cagr: number; mdd: number; volatility: number; sharpe: number | null; benchmarkReturn: number | null; excessReturn: number | null; averageHoldings: number; averageCashWeight: number } {
  if (equity.length < 2) {
    return { equity: equity.map(point => ({ ...point, drawdown: 0 })), cumulativeReturn: 0, cagr: 0, mdd: 0, volatility: 0, sharpe: null, benchmarkReturn: null, excessReturn: null, averageHoldings: 0, averageCashWeight: 100 };
  }
  let factor = 1;
  let peak = 1;
  let mdd = 0;
  const returns: number[] = [];
  const points: EquityPoint[] = [{ ...equity[0], drawdown: 0 }];
  let benchmarkFactor = 1;
  let hasBenchmark = equity[0].benchmarkValue !== null;
  for (let index = 1; index < equity.length; index += 1) {
    const previous = equity[index - 1];
    const current = equity[index];
    const flow = current.cashFlow ?? 0;
    const dailyReturn = previous.value > 0 ? (current.value - flow) / previous.value - 1 : 0;
    factor *= 1 + dailyReturn;
    returns.push(dailyReturn);
    peak = Math.max(peak, factor);
    const drawdown = peak > 0 ? ((factor / peak) - 1) * 100 : 0;
    mdd = Math.min(mdd, drawdown);
    points.push({ date: current.date, value: current.value, benchmarkValue: current.benchmarkValue, cashWeight: current.cashWeight, drawdown });
    if (previous.benchmarkValue !== null && current.benchmarkValue !== null) {
      const benchmarkReturn = previous.benchmarkValue > 0 ? (current.benchmarkValue - flow) / previous.benchmarkValue - 1 : 0;
      benchmarkFactor *= 1 + benchmarkReturn;
    } else {
      hasBenchmark = false;
    }
  }
  const days = Math.max((Date.parse(equity[equity.length - 1].date) - Date.parse(equity[0].date)) / 86_400_000, 1);
  const cumulativeReturn = (factor - 1) * 100;
  const cagr = (Math.pow(factor, 365 / days) - 1) * 100;
  // Each uploaded observation is one return interval. Annualize by the actual
  // observation frequency so a Friday-to-Monday move is not diluted over three
  // invented calendar-day returns. Irregular gaps are separately warned about.
  const meanReturn = returns.reduce((sum, value) => sum + value, 0) / Math.max(returns.length, 1);
  const variance = returns.length > 1
    ? returns.reduce((sum, value) => sum + Math.pow(value - meanReturn, 2), 0) / (returns.length - 1)
    : 0;
  const observationsPerYear = returns.length * 365 / days;
  const volatility = Math.sqrt(variance) * Math.sqrt(observationsPerYear) * 100;
  const sharpe = volatility > 0 ? (cagr - riskFreeRate) / volatility : null;
  const benchmarkReturn = hasBenchmark ? (benchmarkFactor - 1) * 100 : null;
  return {
    equity: points,
    cumulativeReturn,
    cagr,
    mdd,
    volatility,
    sharpe,
    benchmarkReturn,
    excessReturn: benchmarkReturn === null ? null : cumulativeReturn - benchmarkReturn,
    averageHoldings: holdingCounts.length ? holdingCounts.reduce((sum, value) => sum + value, 0) / holdingCounts.length : 0,
    averageCashWeight: points.reduce((sum, point) => sum + point.cashWeight, 0) / points.length,
  };
}
