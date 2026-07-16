import type { BenchmarkRow, FundamentalRow, PriceRow } from "./types";

const companies = [
  ["AAA", "가상전자", "정보기술"], ["BBB", "가상소비재", "경기소비재"], ["CCC", "가상산업", "산업재"], ["DDD", "가상헬스", "헬스케어"], ["EEE", "가상소재", "소재"], ["FFF", "가상통신", "커뮤니케이션"], ["GGG", "가상보험", "보험"], ["HHH", "가상유틸", "유틸리티"],
] as const;

const dateString = (date: Date) => date.toISOString().slice(0, 10);

export function createFictionalSample(): { fundamentals: FundamentalRow[]; prices: PriceRow[]; benchmark: BenchmarkRow[] } {
  const fundamentals: FundamentalRow[] = [];
  for (let year = 2019; year <= 2024; year += 1) {
    companies.forEach(([ticker, companyName, sector], index) => {
      const base = 800 + index * 130 + (year - 2019) * 90;
      fundamentals.push({
        availableDate: `${year + 1}-03-${String(20 + index).padStart(2, "0")}`,
        fiscalPeriodEnd: `${year}-12-31`, ticker, companyName, market: "가상시장", sector,
        marketCap: (9_000 + index * 2_000 + (year - 2019) * 500) * 100_000_000,
        companyPer: 9 + index * 1.2 + (year % 3), sectorPer: 15 + index * .8, forwardPer: 8.5 + index * 1.1 + (year % 2), pbr: 1 + index * .2, evEbitda: 5 + index * .5, fcfYield: 3 + index * .4, dividendYield: 1 + index * .25,
        revenueY2: base, revenueY1: base * 1.08, revenueY0: base * 1.18, opIncomeY2: base * (.08 + index * .005), opIncomeY1: base * (.095 + index * .005), opIncomeY0: base * (.12 + index * .005),
        roe: 9 + index, roic: 11 + index * .8, netIncome: base * .09, operatingCashFlow: base * .115, capex: base * .035, debtRatio: 55 + index * 14, netDebtEbitda: .7 + index * .32, interestCoverage: 10 - index * .6,
        fairValue: null, currency: "KRW", listingDate: "2010-01-04", delistingDate: "",
      });
    });
  }
  const prices: PriceRow[] = [];
  const benchmark: BenchmarkRow[] = [];
  const start = new Date("2020-01-01T00:00:00Z");
  const end = new Date("2025-12-31T00:00:00Z");
  let day = 0;
  for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    day += 1;
    const iso = dateString(date);
    companies.forEach(([ticker], index) => {
      const drift = .00018 + index * .000025;
      const cycle = Math.sin(day / (23 + index * 3)) * .035 + Math.sin(day / 160) * .08;
      const shock = day > 560 && day < 650 ? -.22 * Math.sin((day - 560) / 90 * Math.PI) : 0;
      const adjustedClose = (24_000 + index * 4_000) * Math.exp(drift * day) * (1 + cycle + shock * (1 + index * .08));
      prices.push({ date: iso, ticker, adjustedClose: Math.max(adjustedClose, 100), open: null, close: null, volume: 500_000 + index * 90_000 });
    });
    const benchmarkPrice = 1000 * Math.exp(.00017 * day) * (1 + Math.sin(day / 40) * .025 + (day > 560 && day < 650 ? -.18 * Math.sin((day - 560) / 90 * Math.PI) : 0));
    benchmark.push({ date: iso, benchmarkName: "가상시장지수", adjustedClose: Math.max(benchmarkPrice, 100) });
  }
  return { fundamentals, prices, benchmark };
}

