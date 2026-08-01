"use client";

import { SlidersHorizontal, Zap } from "lucide-react";

export type InputMode = "quick" | "detailed";

export function InputModeSwitch({
  mode,
  onChange,
  quickDescription = "꼭 필요한 값만 입력하고 나머지는 화면에 안내된 기본값으로 추정합니다.",
  detailedDescription = "세금·비용·수익률 같은 조건을 직접 조정해 더 자세히 계산합니다.",
}: {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
  quickDescription?: string;
  detailedDescription?: string;
}) {
  return (
    <div className="input-mode-switch" aria-label="계산 입력 방식">
      <div className="input-mode-buttons" role="group" aria-label="빠른 계산 또는 상세 계산 선택">
        <button type="button" className={mode === "quick" ? "active" : ""} aria-pressed={mode === "quick"} onClick={() => onChange("quick")}>
          <Zap size={16} />
          <span><b>빠른 계산</b><small>초보자 추천</small></span>
        </button>
        <button type="button" className={mode === "detailed" ? "active" : ""} aria-pressed={mode === "detailed"} onClick={() => onChange("detailed")}>
          <SlidersHorizontal size={16} />
          <span><b>상세 계산</b><small>직접 조정</small></span>
        </button>
      </div>
      <p>{mode === "quick" ? <>{quickDescription} 상세 계산에서 바꾼 값은 다시 숨겨도 유지됩니다.</> : detailedDescription}</p>
    </div>
  );
}

export function QuickAssumptionNote({ mode, children }: { mode: InputMode; children: React.ReactNode }) {
  if (mode !== "quick") return null;
  return <div className="quick-assumption-note"><b>빠른 계산 기본값</b><span>{children}</span></div>;
}

export function QuickEstimateNotice({ mode, label = "빠른 계산 결과" }: { mode: InputMode; label?: string }) {
  if (mode !== "quick") return null;
  return <p className="quick-estimate-notice"><b>{label}</b> · 입력하지 않은 항목은 기본 가정을 사용한 대략적인 값입니다. 상세 계산에서 모두 조정할 수 있습니다.</p>;
}
