/**
 * Weekly Aggregation Tests
 * Tests the core weekly OHLCV calculation logic.
 */
import { describe, it, expect } from "vitest";

// Pure calculation functions extracted from the aggregation logic

function calculateWeeklyOHLC(dailyRecords: Array<{ open: string; high: string; low: string; close: string }>) {
  if (!dailyRecords.length) return null;
  const weeklyOpen = parseFloat(dailyRecords[0].open);
  const weeklyClose = parseFloat(dailyRecords[dailyRecords.length - 1].close);
  const weeklyHigh = Math.max(...dailyRecords.map(r => parseFloat(r.high)));
  const weeklyLow = Math.min(...dailyRecords.map(r => parseFloat(r.low)));
  return { weeklyOpen, weeklyHigh, weeklyLow, weeklyClose };
}

function calculateWeeklyVolume(dailyRecords: Array<{ volume: string }>) {
  return dailyRecords.reduce((s, r) => s + parseFloat(r.volume), 0);
}

function calculateWeeklyPctChange(weeklyClose: number, prevWeekClose: number | null) {
  if (!prevWeekClose) return null;
  return +((weeklyClose - prevWeekClose) / prevWeekClose * 100).toFixed(4);
}

function calculateVolatility(dailyPctChanges: number[]) {
  if (!dailyPctChanges.length) return 0;
  const mean = dailyPctChanges.reduce((a, b) => a + b, 0) / dailyPctChanges.length;
  const variance = dailyPctChanges.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyPctChanges.length;
  return Math.sqrt(variance);
}

function detectDataCompleteness(actualDays: number, expectedDays: number) {
  if (actualDays === 0) return "no_data";
  if (actualDays < expectedDays) return "partial";
  return "complete";
}

const SAMPLE_WEEK = [
  { open: "165.00", high: "168.50", low: "163.00", close: "166.00", volume: "500000", percentageChange: "0.61" },
  { open: "166.00", high: "170.00", low: "165.00", close: "168.00", volume: "620000", percentageChange: "1.20" },
  { open: "168.00", high: "169.00", low: "164.00", close: "165.00", volume: "450000", percentageChange: "-1.79" },
  { open: "165.00", high: "167.00", low: "162.00", close: "163.00", volume: "380000", percentageChange: "-1.21" },
  { open: "163.00", high: "166.00", low: "161.00", close: "164.00", volume: "520000", percentageChange: "0.61" },
];

describe("Weekly OHLC Calculation", () => {
  it("weekly open equals first trading day open", () => {
    const result = calculateWeeklyOHLC(SAMPLE_WEEK);
    expect(result?.weeklyOpen).toBe(165.00);
  });

  it("weekly close equals last trading day close", () => {
    const result = calculateWeeklyOHLC(SAMPLE_WEEK);
    expect(result?.weeklyClose).toBe(164.00);
  });

  it("weekly high equals highest daily high", () => {
    const result = calculateWeeklyOHLC(SAMPLE_WEEK);
    expect(result?.weeklyHigh).toBe(170.00);
  });

  it("weekly low equals lowest daily low", () => {
    const result = calculateWeeklyOHLC(SAMPLE_WEEK);
    expect(result?.weeklyLow).toBe(161.00);
  });

  it("returns null for empty records", () => {
    expect(calculateWeeklyOHLC([])).toBeNull();
  });
});

describe("Weekly Volume Aggregation", () => {
  it("weekly volume equals sum of all daily volumes", () => {
    const total = calculateWeeklyVolume(SAMPLE_WEEK);
    expect(total).toBe(500000 + 620000 + 450000 + 380000 + 520000);
    expect(total).toBe(2470000);
  });

  it("handles single day volume", () => {
    expect(calculateWeeklyVolume([{ volume: "1000000" }])).toBe(1000000);
  });
});

describe("Weekly Percentage Change", () => {
  it("calculates correctly against previous week close", () => {
    const change = calculateWeeklyPctChange(164, 160);
    expect(change).toBeCloseTo(2.5, 2);
  });

  it("returns null when no previous week close is available", () => {
    expect(calculateWeeklyPctChange(164, null)).toBeNull();
  });

  it("handles negative weekly change", () => {
    const change = calculateWeeklyPctChange(155, 165);
    expect(change).toBeCloseTo(-6.06, 1);
  });
});

describe("Data Completeness Detection", () => {
  it("marks full 5-day week as complete", () => {
    expect(detectDataCompleteness(5, 5)).toBe("complete");
  });

  it("marks partial week as partial", () => {
    expect(detectDataCompleteness(4, 5)).toBe("partial");
  });

  it("does not treat public holiday weeks as errors when expected days differ", () => {
    // If calendar says 4 trading days (public holiday), 4 actual = complete
    expect(detectDataCompleteness(4, 4)).toBe("complete");
  });

  it("handles weeks with no data", () => {
    expect(detectDataCompleteness(0, 5)).toBe("no_data");
  });
});

describe("Weekly Volatility", () => {
  it("calculates volatility as std dev of daily pct changes", () => {
    const changes = SAMPLE_WEEK.map(r => parseFloat(r.percentageChange));
    const vol = calculateVolatility(changes);
    expect(vol).toBeGreaterThan(0);
    expect(vol).toBeLessThan(5);
  });

  it("returns zero volatility for no changes", () => {
    expect(calculateVolatility([])).toBe(0);
  });

  it("returns zero for identical daily changes (no dispersion)", () => {
    expect(calculateVolatility([1, 1, 1, 1, 1])).toBe(0);
  });
});

describe("Previous Week Comparison", () => {
  it("compares weekly close against PREVIOUS week final valid close, not daily close", () => {
    const weeklyClose = 164;
    const prevWeekClose = 160;
    const pct = calculateWeeklyPctChange(weeklyClose, prevWeekClose);
    expect(pct).toBeCloseTo(2.5, 2);
    // NOT comparing against previous day close
    const prevDayClose = 163;
    expect(calculateWeeklyPctChange(weeklyClose, prevDayClose)).not.toBeCloseTo(2.5, 2);
  });
});

describe("Idempotency", () => {
  it("same input always produces same OHLC", () => {
    const r1 = calculateWeeklyOHLC(SAMPLE_WEEK);
    const r2 = calculateWeeklyOHLC(SAMPLE_WEEK);
    expect(r1).toEqual(r2);
  });

  it("same input always produces same volume", () => {
    expect(calculateWeeklyVolume(SAMPLE_WEEK)).toBe(calculateWeeklyVolume(SAMPLE_WEEK));
  });
});
