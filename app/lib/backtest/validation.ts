import type { BenchmarkRow, FundamentalRow, PriceRow, QualityIssue, QualityReport } from "./types";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const isValidDate = (value: string) => {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};

function issue(severity: QualityIssue["severity"], code: string, message: string, count: number): QualityIssue {
  return { severity, code, message, count };
}

export function validateDatasets({
  fundamentals,
  prices,
  benchmark,
  missingFundamentalColumns = [],
  missingPriceColumns = [],
  missingBenchmarkColumns = [],
  parseErrors = [],
}: {
  fundamentals: FundamentalRow[];
  prices: PriceRow[];
  benchmark: BenchmarkRow[];
  missingFundamentalColumns?: string[];
  missingPriceColumns?: string[];
  missingBenchmarkColumns?: string[];
  parseErrors?: string[];
}): QualityReport {
  const issues: QualityIssue[] = [];
  if (!fundamentals.length) issues.push(issue("error", "empty-fundamentals", "재무데이터가 비어 있습니다.", 1));
  if (!prices.length) issues.push(issue("error", "empty-prices", "가격데이터가 비어 있습니다.", 1));
  if (missingFundamentalColumns.length) issues.push(issue("error", "missing-fundamental-columns", `재무데이터 필수 열 누락: ${missingFundamentalColumns.join(", ")}`, missingFundamentalColumns.length));
  if (missingPriceColumns.length) issues.push(issue("error", "missing-price-columns", `가격데이터 필수 열 누락: ${missingPriceColumns.join(", ")}`, missingPriceColumns.length));
  if (benchmark.length && missingBenchmarkColumns.length) issues.push(issue("error", "missing-benchmark-columns", `벤치마크 필수 열 누락: ${missingBenchmarkColumns.join(", ")}`, missingBenchmarkColumns.length));
  if (parseErrors.length) issues.push(issue("error", "parse-error", `CSV 해석 오류: ${parseErrors.slice(0, 2).join(" / ")}`, parseErrors.length));
  const totalRows = fundamentals.length + prices.length + benchmark.length;
  if (totalRows > 300_000) {
    issues.push(issue("error", "too-large", "전체 행이 300,000행을 초과했습니다.", totalRows));
    return {
      score: 0,
      grade: "백테스트 불가",
      blocked: true,
      issues,
      rows: { fundamentals: fundamentals.length, prices: prices.length, benchmark: benchmark.length },
    };
  }
  if (totalRows > 200_000) issues.push(issue("warning", "large-data", "200,000행 이상은 브라우저 메모리 사용량이 커질 수 있습니다.", totalRows));

  const invalidFundDates = fundamentals.filter(row => !isValidDate(row.availableDate) || !isValidDate(row.fiscalPeriodEnd)).length;
  const invalidPriceDates = prices.filter(row => !isValidDate(row.date)).length;
  const invalidBenchmarkDates = benchmark.filter(row => !isValidDate(row.date)).length;
  if (invalidFundDates + invalidPriceDates + invalidBenchmarkDates) issues.push(issue("error", "invalid-date", "YYYY-MM-DD 형식이 아니거나 존재하지 않는 날짜가 있습니다.", invalidFundDates + invalidPriceDates + invalidBenchmarkDates));
  const lookAhead = fundamentals.filter(row => isValidDate(row.availableDate) && isValidDate(row.fiscalPeriodEnd) && row.availableDate < row.fiscalPeriodEnd).length;
  if (lookAhead) issues.push(issue("error", "look-ahead", "재무정보 공개일이 회계기간 종료일보다 빠른 행이 있어 미래정보 참조 위험이 있습니다.", lookAhead));

  const fundKeys = new Set<string>();
  let duplicateFund = 0;
  for (const row of fundamentals) { const key = `${row.ticker}|${row.availableDate}`; if (fundKeys.has(key)) duplicateFund += 1; fundKeys.add(key); }
  if (duplicateFund) issues.push(issue("warning", "duplicate-fundamentals", "동일 종목·공개일의 중복 재무행이 있습니다. 마지막 행이 사용될 수 있습니다.", duplicateFund));
  const priceKeys = new Set<string>();
  let duplicatePrices = 0;
  for (const row of prices) { const key = `${row.ticker}|${row.date}`; if (priceKeys.has(key)) duplicatePrices += 1; priceKeys.add(key); }
  if (duplicatePrices) issues.push(issue("error", "duplicate-prices", "동일 종목·날짜의 중복 가격행이 있습니다. 어느 가격을 쓸지 임의로 결정하지 않도록 중복을 제거해 주세요.", duplicatePrices));

  const invalidPrices = prices.filter(row => !Number.isFinite(row.adjustedClose) || row.adjustedClose <= 0).length;
  if (invalidPrices) issues.push(issue("error", "invalid-adjusted-close", "수정종가가 없거나 0 이하인 행이 있습니다.", invalidPrices));
  const missingTickers = fundamentals.filter(row => !row.ticker).length + prices.filter(row => !row.ticker).length;
  if (missingTickers) issues.push(issue("error", "missing-ticker", "티커가 비어 있는 행이 있습니다.", missingTickers));
  const missingSector = fundamentals.filter(row => !row.sector).length;
  if (missingSector) issues.push(issue("warning", "missing-sector", "업종값이 없어 업종 한도를 적용할 수 없는 행이 있습니다.", missingSector));
  const missingSectorPer = fundamentals.filter(row => row.sectorPer === null).length;
  if (missingSectorPer) issues.push(issue("warning", "missing-sector-per", "업종 PER이 비어 있어 해당 정량 기준이 N/A가 됩니다.", missingSectorPer));
  const invalidPer = fundamentals.filter(row => row.companyPer !== null && row.companyPer <= 0).length;
  if (invalidPer) issues.push(issue("warning", "invalid-per", "PER이 0 이하인 행은 PER 기준을 N/A로 처리합니다.", invalidPer));
  const invalidRevenue = fundamentals.filter(row => [row.revenueY2, row.revenueY1, row.revenueY0].some(value => value !== null && value <= 0)).length;
  if (invalidRevenue) issues.push(issue("warning", "invalid-revenue", "매출이 0 이하인 행은 성장률 또는 마진 계산이 제한됩니다.", invalidRevenue));
  const fundTickers = new Set(fundamentals.map(row => row.ticker));
  const priceTickers = new Set(prices.map(row => row.ticker));
  const unmatched = [...fundTickers].filter(ticker => !priceTickers.has(ticker)).length;
  if (unmatched) issues.push(issue("warning", "ticker-mismatch", "재무데이터에는 있지만 가격데이터에는 없는 종목이 있습니다.", unmatched));
  const delisted = fundamentals.filter(row => row.delistingDate).length;
  if (!delisted) issues.push(issue("warning", "survivorship", "상장폐지 종목 여부를 확인할 수 없습니다. 현재 상장종목만 포함했다면 수익률이 부풀려질 수 있습니다.", 1));
  else issues.push(issue("info", "delisted-present", "상장폐지일 정보가 포함된 행이 있습니다.", delisted));
  const currencies = new Set(fundamentals.map(row => row.currency).filter(Boolean));
  if (currencies.size > 1) issues.push(issue("warning", "mixed-currency", "여러 통화가 섞여 있습니다. 환율을 반영하지 않으면 시가총액 비교가 왜곡될 수 있습니다.", currencies.size));
  if (!benchmark.length) issues.push(issue("info", "no-benchmark", "벤치마크가 없어 절대수익률만 계산합니다.", 1));

  const priceDatesByTicker = new Map<string, string[]>();
  for (const row of prices) {
    const dates = priceDatesByTicker.get(row.ticker);
    if (dates) dates.push(row.date);
    else priceDatesByTicker.set(row.ticker, [row.date]);
  }
  let staleGaps = 0;
  for (const dates of priceDatesByTicker.values()) {
    dates.sort();
    for (let index = 1; index < dates.length; index += 1) {
      const gap = (Date.parse(dates[index]) - Date.parse(dates[index - 1])) / 86_400_000;
      if (gap > 31) staleGaps += 1;
    }
  }
  if (staleGaps) issues.push(issue("warning", "stale-price-gap", "같은 종목의 가격 관측 사이에 31일을 넘는 공백이 있습니다. 공백 중에는 마지막 가격 평가가 포함될 수 있습니다.", staleGaps));

  const errorCount = issues.filter(item => item.severity === "error").reduce((sum, item) => sum + item.count, 0);
  const warningCount = issues.filter(item => item.severity === "warning").reduce((sum, item) => sum + Math.min(item.count, 10), 0);
  const score = Math.max(0, Math.round(100 - Math.min(errorCount * 18, 70) - Math.min(warningCount * 3, 30)));
  const blocked = issues.some(item => item.severity === "error");
  const grade: QualityReport["grade"] = blocked ? "백테스트 불가" : score >= 85 ? "양호" : score >= 65 ? "제한적 사용 가능" : "주의 필요";
  return { score, grade, blocked, issues, rows: { fundamentals: fundamentals.length, prices: prices.length, benchmark: benchmark.length } };
}
