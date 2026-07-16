import { deriveFundamentals } from "./metrics";
import type { DerivedFundamentals, FundamentalRow, RuleResult, ScreeningConfig, ScreenedCompany } from "./types";

export const defaultEnabledRules: ScreeningConfig["enabledRules"] = {
  per: true,
  forwardPer: true,
  revenueGrowth: true,
  margin: true,
  roic: true,
  cashConversion: true,
  fcf: true,
  debtRatio: true,
  netDebtEbitda: true,
  interestCoverage: true,
};

export const defaultScreeningConfig: ScreeningConfig = {
  mode: "minimum",
  minimumPass: 7,
  minimumValid: 7,
  naHandling: "exclude-denominator",
  requiredReturn: 10,
  cashConversionMin: 80,
  debtRatioMax: 200,
  netDebtEbitdaMax: 3,
  interestCoverageMin: 3,
  enabledRules: defaultEnabledRules,
  excludedSectors: ["은행", "보험", "증권", "기타 금융", "금융", "리츠", "REITs", "유틸리티"],
};

const compare = (condition: boolean, values: Array<number | null>, detail: string): Pick<RuleResult, "value" | "detail"> => ({
  value: values.some(value => value === null || !Number.isFinite(value)) ? null : condition,
  detail,
});

export function evaluateRules(row: FundamentalRow | DerivedFundamentals, config: ScreeningConfig): RuleResult[] {
  const data = "revenueCagr" in row ? row : deriveFundamentals(row);
  const rules: RuleResult[] = [
    { key: "per", label: "업종 PER 이하", ...compare((data.companyPer ?? 0) > 0 && (data.sectorPer ?? 0) > 0 && (data.companyPer ?? 0) <= (data.sectorPer ?? 0), [data.companyPer, data.sectorPer], "기업·업종 PER은 모두 양수여야 합니다.") },
    { key: "forwardPer", label: "선행 PER 개선", ...compare((data.forwardPer ?? 0) > 0 && (data.companyPer ?? 0) > 0 && (data.forwardPer ?? 0) <= (data.companyPer ?? 0), [data.forwardPer, data.companyPer], "선행 PER이 현재 PER 이하여야 합니다.") },
    { key: "revenueGrowth", label: "매출 성장", value: data.revenueCagr === null ? null : data.revenueCagr > 0, detail: "Y-2에서 Y0까지 두 연간 구간의 CAGR입니다." },
    { key: "margin", label: "영업이익률 유지·개선", ...compare((data.opMarginY0 ?? 0) >= (data.opMarginY2 ?? 0), [data.opMarginY0, data.opMarginY2], "최근 영업이익률이 Y-2 이상이어야 합니다.") },
    { key: "roic", label: "ROIC가 요구수익률 이상", value: data.roic === null ? null : data.roic >= config.requiredReturn, detail: `요구수익률 ${config.requiredReturn}%` },
    { key: "cashConversion", label: "현금전환율 기준", value: data.cashConversion === null ? null : data.cashConversion >= config.cashConversionMin, detail: `기준 ${config.cashConversionMin}%` },
    { key: "fcf", label: "잉여현금흐름 흑자", value: data.estimatedFcf === null ? null : data.estimatedFcf > 0, detail: "영업현금흐름에서 CAPEX를 차감합니다." },
    { key: "debtRatio", label: "부채비율 기준", value: data.debtRatio === null ? null : data.debtRatio <= config.debtRatioMax, detail: `상한 ${config.debtRatioMax}%` },
    { key: "netDebtEbitda", label: "순차입금/EBITDA 기준", value: data.netDebtEbitda === null ? null : data.netDebtEbitda <= config.netDebtEbitdaMax, detail: `상한 ${config.netDebtEbitdaMax}배` },
    { key: "interestCoverage", label: "이자보상배율 기준", value: data.interestCoverage === null ? null : data.interestCoverage >= config.interestCoverageMin, detail: `하한 ${config.interestCoverageMin}배` },
  ];
  return rules.filter(rule => config.enabledRules[rule.key]);
}

export function screenCompany(row: FundamentalRow, config: ScreeningConfig): ScreenedCompany {
  const derived = deriveFundamentals(row);
  const rules = evaluateRules(derived, config);
  const passCount = rules.filter(rule => rule.value === true).length;
  const validCount = rules.filter(rule => rule.value !== null).length;
  const hasNa = validCount !== rules.length;
  let eligible = false;
  if (config.naHandling === "exclude-stock" && hasNa) eligible = false;
  else if (config.mode === "all") eligible = config.naHandling === "fail" ? passCount === rules.length : validCount > 0 && passCount === validCount;
  else eligible = validCount >= config.minimumValid && passCount >= config.minimumPass;
  return { ...derived, rules, passCount, validCount, passRate: validCount ? passCount / validCount : 0, eligible };
}

export function selectLatestFundamentals(rows: FundamentalRow[], asOfDate: string): FundamentalRow[] {
  const latest = new Map<string, FundamentalRow>();
  for (const row of rows) {
    if (row.availableDate > asOfDate) continue;
    const previous = latest.get(row.ticker);
    if (!previous || previous.availableDate < row.availableDate) latest.set(row.ticker, row);
  }
  return [...latest.values()];
}

