import { describe, expect, it } from "vitest";
import { formatYear, formatYearRange } from "@/lib/dates";

describe("formatYear", () => {
  it("formats BCE and CE years in English", () => {
    expect(formatYear(-550, "en")).toBe("550 BCE");
    expect(formatYear(224, "en")).toBe("224 CE");
    expect(formatYear(-3200, "en")).toBe("3200 BCE");
  });

  it("uses Persian digits and era names in Persian", () => {
    expect(formatYear(-550, "fa")).toBe("۵۵۰ پیش از میلاد");
    expect(formatYear(1501, "fa")).toBe("۱۵۰۱ میلادی");
  });

  it("rejects year 0 and fractional years", () => {
    expect(() => formatYear(0, "en")).toThrow();
    expect(() => formatYear(1.5, "en")).toThrow();
  });
});

describe("formatYearRange", () => {
  it("writes the era once when both ends share it", () => {
    expect(formatYearRange(-550, -330, "en")).toBe("550–330 BCE");
    expect(formatYearRange(224, 651, "fa")).toBe("۲۲۴–۶۵۱ میلادی");
  });

  it("writes both eras when the range crosses year 1", () => {
    expect(formatYearRange(-247, 224, "en")).toBe("247 BCE – 224 CE");
  });
});

describe("approximate years", () => {
  it("adds 'c.' / 'حدود' for circa dates", () => {
    expect(formatYear(-547, "en", true)).toBe("c. 547 BCE");
    expect(formatYear(-547, "fa", true)).toBe("حدود ۵۴۷ پیش از میلاد");
  });
});
