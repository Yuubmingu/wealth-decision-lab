/**
 * 계산기 페이지 본문 콘텐츠 스키마.
 *
 * 계산기 UI 자체는 검색엔진이 읽을 수 있는 텍스트를 거의 만들지 않습니다.
 * 각 계산기가 무엇을 어떤 공식으로 계산하고, 무엇을 반영하지 않으며,
 * 결과를 어떤 순서로 읽어야 하는지를 페이지마다 고유한 본문으로 남깁니다.
 *
 * 모든 선택 항목은 계산기마다 다른 구성을 갖도록 의도적으로 optional 입니다.
 * 열 개 페이지가 같은 골격을 반복하면 본문이 길어져도 형식이 균질해집니다.
 */

/** 공식 유도 한 단계. expr 은 코드의 실제 계산식과 일치해야 합니다. */
export type FormulaStep = {
  label: string;
  expr: string;
  detail: string;
};

export type FormulaBlock = {
  heading: string;
  intro: string;
  steps: FormulaStep[];
  /** 공식 아래에 덧붙이는 단서. 반올림, 경계조건, 상한값 등. */
  note?: string;
};

/** 실제 숫자를 끝까지 따라가는 예시. 가상 숫자임을 본문에서 명시합니다. */
export type WorkedExample = {
  heading: string;
  setup: string;
  lines: { label: string; value: string }[];
  reading: string;
};

/** 결과 화면의 특정 숫자를 어떤 순서로 읽어야 하는지. */
export type ReadingStep = {
  heading: string;
  body: string[];
};

/** 계산에 넣지 않은 항목과 그 이유. 신뢰도의 핵심이라 필수입니다. */
export type Exclusion = {
  item: string;
  why: string;
};

/** 흔히 잘못 읽는 방식과 교정. */
export type Misconception = {
  claim: string;
  correction: string;
};

export type Faq = {
  q: string;
  a: string;
};

export type ContentSource = {
  publisher: string;
  title: string;
  url: string;
};

export type RelatedLink = {
  href: string;
  label: string;
  note: string;
};

export type CalculatorContent = {
  /** 라우트 경로. 슬래시 포함. */
  path: string;
  /** 섹션 상단 라벨. 페이지마다 다르게 둡니다. */
  eyebrow: string;
  /** 본문 h2. 결론을 담은 한 문장. */
  lede: string;
  /** lede 바로 아래 도입 문단. */
  intro: string[];
  formula: FormulaBlock;
  worked?: WorkedExample;
  reading: ReadingStep[];
  exclusions: Exclusion[];
  misconceptions?: Misconception[];
  faqs: Faq[];
  sources?: ContentSource[];
  related?: RelatedLink[];
  /** 마지막에 남기는 한계 문장. 계산기마다 다른 표현을 씁니다. */
  closing: string;
};
