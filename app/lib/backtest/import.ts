import type { CostConfig, JournalRecord, PortfolioConfig, RuleKey, ScreeningConfig } from "./types";

const MAX_JSON_BYTES = 5 * 1024 * 1024;
const MAX_JOURNAL_RECORDS = 200;
const ruleKeys: RuleKey[] = ["per", "forwardPer", "revenueGrowth", "margin", "roic", "cashConversion", "fcf", "debtRatio", "netDebtEbitda", "interestCoverage"];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: string) {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseJson(text: string) {
  if (new Blob([text]).size > MAX_JSON_BYTES) throw new Error("JSON 파일은 5MB 이하여야 합니다.");
  return JSON.parse(text) as unknown;
}

function finite(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function sanitizeJournalRecord(value: unknown): JournalRecord {
  if (!object(value) || Object.keys(value).length > 100) throw new Error("투자 기록 항목 형식이 올바르지 않습니다.");
  const result: JournalRecord = {};
  for (const [key, field] of Object.entries(value)) {
    if (key.length > 80) throw new Error("투자 기록의 필드명이 너무 깁니다.");
    if (typeof field === "string") {
      if (field.length > 10_000) throw new Error("투자 기록의 텍스트는 항목당 10,000자 이하여야 합니다.");
      result[key] = field;
    } else if (typeof field === "number") {
      if (!Number.isFinite(field) || Math.abs(field) > 1_000_000_000_000_000) throw new Error("투자 기록 숫자 범위를 확인해 주세요.");
      result[key] = field;
    } else if (field === null || typeof field === "boolean") result[key] = field;
    else throw new Error("투자 기록은 문자열·숫자·참/거짓 값만 포함할 수 있습니다.");
  }
  if (result.decisionDate !== undefined && (typeof result.decisionDate !== "string" || !validDate(result.decisionDate))) throw new Error("투자 기록의 결정일은 실제 존재하는 YYYY-MM-DD 날짜여야 합니다.");
  return result;
}

export function parseJournalJson(text: string, respectExpiry = false): JournalRecord[] {
  const parsed = parseJson(text);
  const envelope = object(parsed) ? parsed : null;
  if (respectExpiry && envelope && envelope.expiresAt !== undefined) {
    if (!finite(envelope.expiresAt, 0, Number.MAX_SAFE_INTEGER)) throw new Error("저장 만료정보가 올바르지 않습니다.");
    if (envelope.expiresAt <= Date.now()) return [];
  }
  const rawRecords = Array.isArray(parsed) ? parsed : envelope?.records;
  if (!Array.isArray(rawRecords)) throw new Error("records 배열이 필요합니다.");
  if (rawRecords.length > MAX_JOURNAL_RECORDS) throw new Error(`투자 기록은 ${MAX_JOURNAL_RECORDS}건까지만 불러올 수 있습니다.`);
  return rawRecords.map(sanitizeJournalRecord);
}

export function parseStoredJournalJson(text: string): { records: JournalRecord[]; expired: boolean } {
  const parsed = parseJson(text);
  if (!object(parsed)) throw new Error("저장된 투자 기록 형식이 올바르지 않습니다.");
  if (!finite(parsed.expiresAt, 0, Number.MAX_SAFE_INTEGER)) throw new Error("저장 만료정보가 올바르지 않습니다.");
  if (parsed.expiresAt <= Date.now()) return { records: [], expired: true };
  if (!Array.isArray(parsed.records)) throw new Error("records 배열이 필요합니다.");
  if (parsed.records.length > MAX_JOURNAL_RECORDS) throw new Error(`투자 기록은 ${MAX_JOURNAL_RECORDS}건까지만 불러올 수 있습니다.`);
  return { records: parsed.records.map(sanitizeJournalRecord), expired: false };
}

export type ImportedStrategy = {
  screening?: Omit<Partial<ScreeningConfig>, "enabledRules"> & { enabledRules?: Partial<Record<RuleKey, boolean>> };
  portfolio?: Partial<PortfolioConfig>;
  costs?: Partial<CostConfig>;
};

export function parseStrategyJson(text: string): ImportedStrategy {
  const parsed = parseJson(text);
  if (!object(parsed)) throw new Error("전략 JSON 최상위 값은 객체여야 합니다.");
  const output: ImportedStrategy = {};

  if (parsed.screening !== undefined) {
    if (!object(parsed.screening)) throw new Error("screening 형식이 올바르지 않습니다.");
    const source = parsed.screening;
    const screening: ImportedStrategy["screening"] = {};
    if (source.mode !== undefined) { if (source.mode !== "all" && source.mode !== "minimum") throw new Error("mode 값을 확인해 주세요."); screening.mode = source.mode; }
    if (source.naHandling !== undefined) { if (!['exclude-denominator', 'fail', 'exclude-stock'].includes(String(source.naHandling))) throw new Error("naHandling 값을 확인해 주세요."); screening.naHandling = source.naHandling as ScreeningConfig["naHandling"]; }
    for (const [key, min, max] of [["minimumPass", 1, 10], ["minimumValid", 1, 10], ["requiredReturn", -100, 500], ["cashConversionMin", -1000, 5000], ["debtRatioMax", 0, 10000], ["netDebtEbitdaMax", -100, 1000], ["interestCoverageMin", -1000, 10000]] as const) {
      if (source[key] !== undefined) { if (!finite(source[key], min, max)) throw new Error(`${key} 숫자 범위를 확인해 주세요.`); (screening as Record<string, unknown>)[key] = source[key]; }
    }
    if (source.enabledRules !== undefined) {
      if (!object(source.enabledRules)) throw new Error("enabledRules 형식이 올바르지 않습니다.");
      const enabledRules: Partial<Record<RuleKey, boolean>> = {};
      for (const key of ruleKeys) if (source.enabledRules[key] !== undefined) { if (typeof source.enabledRules[key] !== "boolean") throw new Error(`${key} 규칙 값은 참/거짓이어야 합니다.`); enabledRules[key] = source.enabledRules[key] as boolean; }
      screening.enabledRules = enabledRules;
    }
    if (source.excludedSectors !== undefined) {
      if (!Array.isArray(source.excludedSectors) || source.excludedSectors.length > 50 || source.excludedSectors.some(value => typeof value !== "string" || value.length > 100)) throw new Error("excludedSectors 형식을 확인해 주세요.");
      screening.excludedSectors = source.excludedSectors as string[];
    }
    output.screening = screening;
  }

  if (parsed.portfolio !== undefined) {
    if (!object(parsed.portfolio)) throw new Error("portfolio 형식이 올바르지 않습니다.");
    const source = parsed.portfolio;
    const portfolio: Partial<PortfolioConfig> = {};
    for (const key of ["startDate", "endDate"] as const) if (source[key] !== undefined) { if (typeof source[key] !== "string" || !validDate(source[key])) throw new Error(`${key} 날짜 형식을 확인해 주세요.`); portfolio[key] = source[key]; }
    for (const [key, min, max] of [["initialCapital", 0, 10_000_000_000_000], ["monthlyContribution", 0, 10_000_000_000], ["maxHoldings", 1, 100], ["minHoldings", 1, 100], ["maxPositionWeight", 0.01, 100], ["maxSectorWeight", 0.01, 100], ["minMarketCap", 0, 10_000_000_000_000_000]] as const) {
      if (source[key] !== undefined) { if (!finite(source[key], min, max)) throw new Error(`${key} 숫자 범위를 확인해 주세요.`); (portfolio as Record<string, unknown>)[key] = source[key]; }
    }
    if (source.rebalanceMonths !== undefined) { if (![1, 3, 6, 12].includes(Number(source.rebalanceMonths))) throw new Error("rebalanceMonths 값을 확인해 주세요."); portfolio.rebalanceMonths = source.rebalanceMonths as PortfolioConfig["rebalanceMonths"]; }
    if (source.allowCash !== undefined) { if (typeof source.allowCash !== "boolean") throw new Error("allowCash 값은 참/거짓이어야 합니다."); portfolio.allowCash = source.allowCash; }
    output.portfolio = portfolio;
  }

  if (parsed.costs !== undefined) {
    if (!object(parsed.costs)) throw new Error("costs 형식이 올바르지 않습니다.");
    const source = parsed.costs;
    const costs: Partial<CostConfig> = {};
    for (const [key, min, max] of [["buyCost", 0, 10], ["sellCost", 0, 10], ["slippage", 0, 20], ["sellTax", 0, 50], ["annualCost", 0, 20], ["riskFreeRate", -100, 100]] as const) {
      if (source[key] !== undefined) { if (!finite(source[key], min, max)) throw new Error(`${key} 숫자 범위를 확인해 주세요.`); (costs as Record<string, unknown>)[key] = source[key]; }
    }
    output.costs = costs;
  }
  if (!output.screening && !output.portfolio && !output.costs) throw new Error("screening, portfolio, costs 중 하나가 필요합니다.");
  return output;
}
