import { screenCompany } from "./rules";
import type { FundamentalRow, JournalRecord, JournalReplayRow, PriceRow, ScreeningConfig } from "./types";

const n = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : value === "" || value === null || value === undefined ? null : Number.isFinite(Number(value)) ? Number(value) : null;
const s = (value: unknown) => String(value ?? "").trim();
const addMonths = (date: string, months: number) => { const value = new Date(`${date}T00:00:00Z`); value.setUTCMonth(value.getUTCMonth() + months); return value.toISOString().slice(0, 10); };

export function adaptJournalRecord(record: JournalRecord): { id: string; name: string; ticker: string; decisionDate: string; entryPrice: number | null; entryType: JournalReplayRow["entryType"]; actualReturn: number | null; expectedReturn: number | null; worstLoss: number | null; fundamental: FundamentalRow } {
  const actualEntry = n(record.entryPrice);
  const virtualEntry = n(record.currentPrice);
  return {
    id: s(record.id) || `legacy-${s(record.ticker)}-${s(record.decisionDate)}`,
    name: s(record.investmentName) || "이름 없는 종목",
    ticker: s(record.ticker),
    decisionDate: s(record.decisionDate),
    entryPrice: actualEntry ?? virtualEntry,
    entryType: actualEntry !== null ? "실제 매수가" : virtualEntry !== null ? "가상 검토가" : "가격 없음",
    actualReturn: n(record.actualReturn),
    expectedReturn: n(record.expectedReturn),
    worstLoss: n(record.worstLoss),
    fundamental: {
      availableDate: s(record.decisionDate), fiscalPeriodEnd: s(record.decisionDate), ticker: s(record.ticker), companyName: s(record.investmentName), market: s(record.market), sector: s(record.industry), marketCap: n(record.marketCap) ?? 0,
      companyPer: n(record.per), sectorPer: n(record.industryPer), forwardPer: n(record.forwardPer), pbr: n(record.pbr), evEbitda: n(record.evEbitda), fcfYield: n(record.fcfYield), dividendYield: n(record.dividendYield),
      revenueY2: n(record.revenueOld), revenueY1: n(record.revenueMid), revenueY0: n(record.revenueRecent), opIncomeY2: n(record.operatingProfitOld), opIncomeY1: n(record.operatingProfitMid), opIncomeY0: n(record.operatingProfitRecent),
      roe: n(record.roe), roic: n(record.roic), netIncome: n(record.netIncome), operatingCashFlow: n(record.operatingCashFlow), capex: n(record.capex), debtRatio: n(record.debtRatio), netDebtEbitda: n(record.netDebtEbitda), interestCoverage: n(record.interestCoverage), fairValue: n(record.estimatedValue), currency: "", listingDate: "", delistingDate: "",
    },
  };
}

function priceAtOrAfter(rows: PriceRow[], date: string) { return rows.find(row => row.date >= date)?.adjustedClose ?? null; }

export function replayJournal(records: JournalRecord[], prices: PriceRow[], screening: ScreeningConfig): JournalReplayRow[] {
  const pricesByTicker = new Map<string, PriceRow[]>();
  for (const row of prices.sort((a, b) => a.date.localeCompare(b.date))) pricesByTicker.set(row.ticker, [...(pricesByTicker.get(row.ticker) ?? []), row]);
  return records.map(record => {
    const adapted = adaptJournalRecord(record);
    const stockPrices = (pricesByTicker.get(adapted.ticker) ?? []).filter(row => row.date >= adapted.decisionDate);
    const firstPrice = adapted.entryPrice ?? priceAtOrAfter(stockPrices, adapted.decisionDate);
    const returnsFor = (months: number) => { const exit = priceAtOrAfter(stockPrices, addMonths(adapted.decisionDate, months)); return firstPrice && exit ? (exit / firstPrice - 1) * 100 : null; };
    const pathReturns = firstPrice ? stockPrices.map(row => (row.adjustedClose / firstPrice - 1) * 100) : [];
    let peak = firstPrice ?? 0;
    let mdd: number | null = firstPrice ? 0 : null;
    for (const price of stockPrices) { peak = Math.max(peak, price.adjustedClose); if (peak > 0) mdd = Math.min(mdd ?? 0, (price.adjustedClose / peak - 1) * 100); }
    const screened = screenCompany(adapted.fundamental, screening);
    const referenceReturn = adapted.actualReturn ?? returnsFor(12);
    return {
      id: adapted.id, investmentName: adapted.name, ticker: adapted.ticker, decisionDate: adapted.decisionDate, entryType: adapted.entryType, actualReturn: adapted.actualReturn, passCount: screened.passCount, validCount: screened.validCount,
      horizonReturns: { "1개월": returnsFor(1), "3개월": returnsFor(3), "6개월": returnsFor(6), "12개월": returnsFor(12), "24개월": returnsFor(24), "36개월": returnsFor(36) },
      maxRise: pathReturns.length ? Math.max(...pathReturns) : null, maxFall: pathReturns.length ? Math.min(...pathReturns) : null, mdd,
      expectedReturnMet: referenceReturn === null || adapted.expectedReturn === null ? null : referenceReturn >= adapted.expectedReturn,
      worstLossExceeded: pathReturns.length === 0 || adapted.worstLoss === null ? null : Math.min(...pathReturns) < -Math.abs(adapted.worstLoss),
    };
  });
}

export function journalSummary(rows: JournalReplayRow[]) {
  const outcomes = rows.map(row => row.actualReturn).filter((value): value is number => value !== null);
  const sorted = [...outcomes].sort((a, b) => a - b);
  const median = sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2 : null;
  return {
    total: rows.length,
    completed: outcomes.length,
    averageReturn: outcomes.length ? outcomes.reduce((sum, value) => sum + value, 0) / outcomes.length : null,
    medianReturn: median,
    winRate: outcomes.length ? outcomes.filter(value => value > 0).length / outcomes.length * 100 : null,
    averageRulePass: rows.length ? rows.reduce((sum, row) => sum + row.passCount, 0) / rows.length : 0,
    sampleWarning: rows.length < 10 ? "기록이 10건 미만이므로 통계 해석에 사용하면 안 됩니다." : rows.length < 30 ? "표본이 적어 참고 수준으로만 해석해야 합니다." : rows.length < 100 ? "제한적인 분석이 가능합니다. 업종과 시장 구성을 함께 확인하세요." : "표본 구성과 시장 국면을 점검한 뒤 해석하세요.",
  };
}

