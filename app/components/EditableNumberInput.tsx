"use client";

import { useState, type InputHTMLAttributes } from "react";

type EditableNumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "type" | "inputMode"
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  decimalPlaces?: number;
  format?: "plain" | "money";
};

function formatCommittedValue(value: number, format: "plain" | "money") {
  if (!Number.isFinite(value)) return "0";
  return format === "money" ? Math.round(value).toLocaleString("ko-KR") : String(value);
}

export function sanitizeNumericDraft(value: string, allowNegative: boolean, decimalPlaces: number) {
  const trimmed = value.trim();
  const decimalCommaMatch = decimalPlaces > 0 && !trimmed.includes(".")
    ? trimmed.match(/^(-?\d*),(\d*)$/)
    : null;
  const withoutCommas = decimalCommaMatch && decimalCommaMatch[2].length <= decimalPlaces
    ? `${decimalCommaMatch[1]}.${decimalCommaMatch[2]}`
    : value.replaceAll(",", "");
  const sign = allowNegative && withoutCommas.trimStart().startsWith("-") ? "-" : "";
  const unsigned = withoutCommas.replace(/-/g, "").replace(/[^0-9.]/g, "");
  const [integer = "", ...fractionParts] = unsigned.split(".");
  if (decimalPlaces <= 0) return `${sign}${integer}`;
  const hasDecimalPoint = unsigned.includes(".");
  const fraction = fractionParts.join("").slice(0, decimalPlaces);
  return `${sign}${integer}${hasDecimalPoint ? `.${fraction}` : ""}`;
}

/**
 * 숫자 상태와 입력 중인 문자열을 분리합니다. 예를 들어 사용자가 `4.`를
 * 입력해도 부모 상태에는 4를 전달하되 화면의 점은 유지해 다음 숫자가
 * `4.25`로 이어집니다. 포커스를 벗어날 때만 표시 형식을 정리합니다.
 */
export function EditableNumberInput({
  value,
  onValueChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  decimalPlaces = 0,
  format = "plain",
  onFocus,
  onBlur,
  ...inputProps
}: EditableNumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const allowNegative = min < 0;
  const displayedValue = draft ?? formatCommittedValue(value, format);

  return (
    <input
      {...inputProps}
      type="text"
      inputMode={decimalPlaces > 0 ? "decimal" : "numeric"}
      value={displayedValue}
      onFocus={(event) => {
        setDraft(String(value));
        onFocus?.(event);
      }}
      onChange={(event) => {
        const nextDraft = sanitizeNumericDraft(event.target.value, allowNegative, decimalPlaces);
        setDraft(nextDraft);

        if (nextDraft === "" || nextDraft === "-" || nextDraft === "." || nextDraft === "-.") return;
        const parsed = Number(nextDraft);
        if (!Number.isFinite(parsed)) return;
        onValueChange(Math.min(max, Math.max(min, parsed)));
      }}
      onBlur={(event) => {
        if (draft === "" || draft === "-" || draft === "." || draft === "-.") {
          onValueChange(Math.min(max, Math.max(min, 0)));
        }
        setDraft(null);
        onBlur?.(event);
      }}
    />
  );
}
