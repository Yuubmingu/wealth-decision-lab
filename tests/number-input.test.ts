import { describe, expect, it } from "vitest";
import { sanitizeNumericDraft } from "../app/components/EditableNumberInput";

describe("decimal number input", () => {
  it("keeps an unfinished decimal point so the next digit can be entered", () => {
    expect(sanitizeNumericDraft("4.", false, 2)).toBe("4.");
    expect(sanitizeNumericDraft("4.25", false, 2)).toBe("4.25");
  });

  it("limits percentage and interest-rate inputs to two decimal places", () => {
    expect(sanitizeNumericDraft("3.4567", false, 2)).toBe("3.45");
  });

  it("accepts a decimal comma from localized mobile keyboards", () => {
    expect(sanitizeNumericDraft("4,25", false, 2)).toBe("4.25");
    expect(sanitizeNumericDraft("4,", false, 2)).toBe("4.");
  });

  it("allows a leading minus only when the field supports negative values", () => {
    expect(sanitizeNumericDraft("-12.34", true, 2)).toBe("-12.34");
    expect(sanitizeNumericDraft("-12.34", false, 2)).toBe("12.34");
  });

  it("removes grouping separators and non-numeric characters", () => {
    expect(sanitizeNumericDraft("1,234원", false, 0)).toBe("1234");
  });
});
