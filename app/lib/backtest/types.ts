export type NullableNumber = number | null;

export type FundamentalRow = {
  availableDate: string;
  fiscalPeriodEnd: string;
  ticker: string;
  companyName: string;
  market: string;
  sector: string;
  marketCap: number;
  companyPer: NullableNumber;
  sectorPer: NullableNumber;
  forwardPer: NullableNumber;
  pbr: NullableNumber;
  evEbitda: NullableNumber;
  fcfYield: NullableNumber;
  dividendYield: NullableNumber;
  revenueY2: NullableNumber;
  revenueY1: NullableNumber;
  revenueY0: NullableNumber;
  opIncomeY2: NullableNumber;
  opIncomeY1: NullableNumber;
  opIncomeY0: NullableNumber;
  roe: NullableNumber;
  roic: NullableNumber;
  netIncome: NullableNumber;
  operatingCashFlow: NullableNumber;
  capex: NullableNumber;
  debtRatio: NullableNumber;
  netDebtEbitda: NullableNumber;
  interestCoverage: NullableNumber;
  fairValue: NullableNumber;
  currency: string;
  listingDate: string;
  delistingDate: string;
};

export type PriceRow = {
  date: string;
  ticker: string;
  adjustedClose: number;
  open: NullableNumber;
  close: NullableNumber;
  volume: NullableNumber;
};

export type BenchmarkRow = {
  date: string;
  benchmarkName: string;
  adjustedClose: number;
};

export type DerivedFundamentals = FundamentalRow & {
  opMarginY2: NullableNumber;
  opMarginY1: NullableNumber;
  opMarginY0: NullableNumber;
  revenueCagr: NullableNumber;
  opIncomeCagr: NullableNumber;
  opMarginChange: NullableNumber;
  cashConversion: NullableNumber;
  estimatedFcf: NullableNumber;
  perDiscount: NullableNumber;
};

export type RuleKey =
  | "per"
  | "forwardPer"
  | "revenueGrowth"
  | "margin"
  | "roic"
  | "cashConversion"
  | "fcf"
  | "debtRatio"
  | "netDebtEbitda"
  | "interestCoverage";

export type ScreeningConfig = {
  mode: "all" | "minimum";
  minimumPass: number;
  minimumValid: number;
  naHandling: "exclude-denominator" | "fail" | "exclude-stock";
  requiredReturn: number;
  cashConversionMin: number;
  debtRatioMax: number;
  netDebtEbitdaMax: number;
  interestCoverageMin: number;
  enabledRules: Record<RuleKey, boolean>;
  excludedSectors: string[];
};

export type PortfolioConfig = {
  startDate: string;
  endDate: string;
  initialCapital: number;
  monthlyContribution: number;
  rebalanceMonths: 1 | 3 | 6 | 12;
  maxHoldings: number;
  minHoldings: number;
  maxPositionWeight: number;
  maxSectorWeight: number;
  minMarketCap: number;
  allowCash: boolean;
};

export type CostConfig = {
  buyCost: number;
  sellCost: number;
  slippage: number;
  sellTax: number;
  annualCost: number;
  riskFreeRate: number;
};

export type RuleResult = { key: RuleKey; label: string; value: boolean | null; detail: string };
export type ScreenedCompany = DerivedFundamentals & {
  rules: RuleResult[];
  passCount: number;
  validCount: number;
  passRate: number;
  eligible: boolean;
};

export type QualityIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  count: number;
};

export type QualityReport = {
  score: number;
  grade: "양호" | "제한적 사용 가능" | "주의 필요" | "백테스트 불가";
  blocked: boolean;
  issues: QualityIssue[];
  rows: { fundamentals: number; prices: number; benchmark: number };
};

export type EquityPoint = {
  date: string;
  value: number;
  benchmarkValue: number | null;
  drawdown: number;
  cashWeight: number;
};

export type Trade = {
  date: string;
  ticker: string;
  companyName: string;
  side: "매수" | "매도";
  price: number;
  amount: number;
  shares: number;
  cost: number;
  passCount: number;
  validCount: number;
  reason: string;
};

export type Exclusion = {
  date: string;
  ticker: string;
  companyName: string;
  reason: string;
};

export type Performance = {
  finalValue: number;
  cumulativeReturn: number;
  cagr: number;
  mdd: number;
  volatility: number;
  sharpe: number | null;
  benchmarkReturn: number | null;
  excessReturn: number | null;
  totalCosts: number;
  tradeCount: number;
  averageHoldings: number;
  averageCashWeight: number;
};

export type BacktestResult = {
  performance: Performance;
  equity: EquityPoint[];
  trades: Trade[];
  exclusions: Exclusion[];
  latestHoldings: Array<{ ticker: string; companyName: string; sector: string; weight: number }>;
  warnings: string[];
};

export type JournalRecord = Record<string, unknown> & { id?: string };

export type JournalReplayRow = {
  id: string;
  investmentName: string;
  ticker: string;
  decisionDate: string;
  entryType: "실제 매수가" | "가상 검토가" | "가격 없음";
  actualReturn: NullableNumber;
  passCount: number;
  validCount: number;
  horizonReturns: Record<"1개월" | "3개월" | "6개월" | "12개월" | "24개월" | "36개월", NullableNumber>;
  maxRise: NullableNumber;
  maxFall: NullableNumber;
  mdd: NullableNumber;
  expectedReturnMet: boolean | null;
  worstLossExceeded: boolean | null;
};

