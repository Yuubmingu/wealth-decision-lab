import Papa from "papaparse";
import type { BenchmarkRow, FundamentalRow, PriceRow } from "./types";

export const FUNDAMENTAL_COLUMNS = [
  "available_date", "fiscal_period_end", "ticker", "company_name", "market", "sector", "market_cap", "company_per", "sector_per", "forward_per", "pbr", "ev_ebitda", "fcf_yield", "dividend_yield", "revenue_y2", "revenue_y1", "revenue_y0", "op_income_y2", "op_income_y1", "op_income_y0", "roe", "roic", "net_income", "operating_cash_flow", "capex", "debt_ratio", "net_debt_ebitda", "interest_coverage",
] as const;
export const PRICE_COLUMNS = ["date", "ticker", "adjusted_close"] as const;
export const BENCHMARK_COLUMNS = ["date", "benchmark_name", "adjusted_close"] as const;

export type ParsedDataset<T> = { rows: T[]; headers: string[]; missingColumns: string[]; parseErrors: string[] };

const numberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};
const text = (value: unknown) => String(value ?? "").trim();

function parseRaw(csvText: string, required: readonly string[]) {
  if (new Blob([csvText]).size > 50 * 1024 * 1024) {
    return { rawRows: [] as Record<string, string>[], headers: [] as string[], missingColumns: [...required], parseErrors: ["CSV 파일은 50MB 이하여야 합니다."] };
  }
  const parsed = Papa.parse<Record<string, string>>(csvText.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: header => header.trim().toLowerCase(),
  });
  const headers = (parsed.meta.fields ?? []).map(header => header.trim().toLowerCase());
  return {
    rawRows: parsed.data,
    headers,
    missingColumns: required.filter(column => !headers.includes(column)),
    parseErrors: parsed.errors.map(error => `${error.row !== undefined ? `${error.row + 2}행 · ` : ""}${error.message}`),
  };
}

export function parseFundamentalsCsv(csvText: string): ParsedDataset<FundamentalRow> {
  const parsed = parseRaw(csvText, FUNDAMENTAL_COLUMNS);
  return {
    ...parsed,
    rows: parsed.rawRows.map(row => ({
      availableDate: text(row.available_date), fiscalPeriodEnd: text(row.fiscal_period_end), ticker: text(row.ticker), companyName: text(row.company_name), market: text(row.market), sector: text(row.sector), marketCap: numberOrNull(row.market_cap) ?? 0,
      companyPer: numberOrNull(row.company_per), sectorPer: numberOrNull(row.sector_per), forwardPer: numberOrNull(row.forward_per), pbr: numberOrNull(row.pbr), evEbitda: numberOrNull(row.ev_ebitda), fcfYield: numberOrNull(row.fcf_yield), dividendYield: numberOrNull(row.dividend_yield),
      revenueY2: numberOrNull(row.revenue_y2), revenueY1: numberOrNull(row.revenue_y1), revenueY0: numberOrNull(row.revenue_y0), opIncomeY2: numberOrNull(row.op_income_y2), opIncomeY1: numberOrNull(row.op_income_y1), opIncomeY0: numberOrNull(row.op_income_y0),
      roe: numberOrNull(row.roe), roic: numberOrNull(row.roic), netIncome: numberOrNull(row.net_income), operatingCashFlow: numberOrNull(row.operating_cash_flow), capex: numberOrNull(row.capex), debtRatio: numberOrNull(row.debt_ratio), netDebtEbitda: numberOrNull(row.net_debt_ebitda), interestCoverage: numberOrNull(row.interest_coverage),
      fairValue: numberOrNull(row.fair_value), currency: text(row.currency), listingDate: text(row.listing_date), delistingDate: text(row.delisting_date),
    })),
  };
}

export function parsePricesCsv(csvText: string): ParsedDataset<PriceRow> {
  const parsed = parseRaw(csvText, PRICE_COLUMNS);
  return {
    ...parsed,
    rows: parsed.rawRows.map(row => ({ date: text(row.date), ticker: text(row.ticker), adjustedClose: numberOrNull(row.adjusted_close) ?? 0, open: numberOrNull(row.open), close: numberOrNull(row.close), volume: numberOrNull(row.volume) })),
  };
}

export function parseBenchmarkCsv(csvText: string): ParsedDataset<BenchmarkRow> {
  const parsed = parseRaw(csvText, BENCHMARK_COLUMNS);
  return {
    ...parsed,
    rows: parsed.rawRows.map(row => ({ date: text(row.date), benchmarkName: text(row.benchmark_name), adjustedClose: numberOrNull(row.adjusted_close) ?? 0 })),
  };
}

export const templates = {
  fundamentals: `${FUNDAMENTAL_COLUMNS.join(",")}\n2022-03-31,2021-12-31,AAA,가상전자,KOSPI,정보기술,1500000000000,12,18,11,1.2,7,5,2,8000,9000,10500,700,900,1200,10,14,850,1000,300,65,1.1,9\n2022-03-31,2021-12-31,BBB,가상소비재,KOSPI,경기소비재,900000000000,16,20,14,1.8,9,4,1.5,5000,5400,6000,350,390,460,12,13,330,420,120,90,1.8,6`,
  prices: `date,ticker,adjusted_close,open,high,low,close,volume\n2022-03-31,AAA,50000,49700,50500,49500,50000,1200000\n2022-04-01,AAA,51000,50200,51500,50000,51000,1300000\n2022-03-31,BBB,30000,29800,30500,29600,30000,800000\n2022-04-01,BBB,30300,30100,30600,29900,30300,850000`,
  benchmark: `date,benchmark_name,adjusted_close\n2022-03-31,가상시장지수,1000\n2022-04-01,가상시장지수,1005`,
};

export const dataDictionary = [
  ["available_date", "투자자가 해당 재무정보를 실제로 확인할 수 있었던 날짜"],
  ["fiscal_period_end", "회계기간 종료일. 종목선정 기준일로 사용하지 않음"],
  ["adjusted_close", "액면분할 등을 반영한 수정종가. 배당 반영 여부는 데이터 제공처 확인 필요"],
  ["revenue_y2~y0", "전전년부터 최근연도까지 같은 단위의 매출"],
  ["op_income_y2~y0", "전전년부터 최근연도까지 같은 단위의 영업이익"],
  ["capex", "현금 유출 방향과 무관하게 양수 지출금액으로 입력"],
] as const;

export function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: Array<Record<string, string | number | null>>) {
  const safeRows = rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => {
    if (typeof value !== "string" || !/^[=+\-@\t\r]/.test(value)) return [key, value];
    return [key, `'${value}`];
  })));
  return Papa.unparse(safeRows);
}
