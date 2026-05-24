import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatCurrency,
  isWarrantyExpired,
  generateTag,
  getInitials,
  generateEmployeeId,
  generateLdapUsername,
} from "@/lib/utils";

// ---------------------------------------------------------------------------
// cn (class merging)
// ---------------------------------------------------------------------------
describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("resolves tailwind conflicts — last value wins", () => {
    // tailwind-merge keeps the latter utility when both target the same property
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");
  });

  it("handles conditional classes via object syntax", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe(
      "text-red-500"
    );
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe("formatDate", () => {
  it("returns em-dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns em-dash for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("formats a Date object in en-GB style (DD Mon YYYY)", () => {
    // Use a fixed UTC date to avoid timezone flakiness
    const date = new Date("2024-06-15T00:00:00.000Z");
    const result = formatDate(date);
    // Should contain the year and a short month name
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/Jun/);
  });

  it("formats an ISO string", () => {
    const result = formatDate("2025-01-01T00:00:00.000Z");
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/Jan/);
  });

  it("formats a plain date string", () => {
    const result = formatDate("2023-12-25");
    expect(result).toMatch(/2023/);
  });
});

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe("formatCurrency", () => {
  it("returns em-dash for null", () => {
    expect(formatCurrency(null)).toBe("—");
  });

  it("returns em-dash for undefined", () => {
    expect(formatCurrency(undefined)).toBe("—");
  });

  it("formats a positive integer in EUR (de-DE locale)", () => {
    const result = formatCurrency(1000);
    // de-DE uses period as thousands separator, comma as decimal
    expect(result).toContain("1.000");
    expect(result).toContain("€");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("€");
  });

  it("formats a negative amount", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("€");
    expect(result).toContain("500");
  });
});

// ---------------------------------------------------------------------------
// isWarrantyExpired
// ---------------------------------------------------------------------------
describe("isWarrantyExpired", () => {
  it("returns false for null", () => {
    expect(isWarrantyExpired(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isWarrantyExpired(undefined)).toBe(false);
  });

  it("returns true for a date in the past", () => {
    expect(isWarrantyExpired("2000-01-01")).toBe(true);
  });

  it("returns false for a date in the future", () => {
    expect(isWarrantyExpired("2099-12-31")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateTag
// ---------------------------------------------------------------------------
describe("generateTag", () => {
  it("pads single digit count to 4 places", () => {
    expect(generateTag(1)).toBe("AST-0001");
  });

  it("pads double digit count", () => {
    expect(generateTag(42)).toBe("AST-0042");
  });

  it("handles exactly 4 digits without extra padding", () => {
    expect(generateTag(1000)).toBe("AST-1000");
  });

  it("handles large numbers beyond 4 digits", () => {
    expect(generateTag(12345)).toBe("AST-12345");
  });
});

// ---------------------------------------------------------------------------
// getInitials
// ---------------------------------------------------------------------------
describe("getInitials", () => {
  it("returns initials for two-word name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns first character of a single word name", () => {
    // "Alice".split(" ") → ["Alice"], first letter → "A", slice(0,2) → "A"
    expect(getInitials("Alice")).toBe("A");
  });

  it("uppercases initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("limits result to 2 characters for longer names", () => {
    expect(getInitials("Mary Ann Jones")).toBe("MA");
  });
});

// ---------------------------------------------------------------------------
// generateEmployeeId
// ---------------------------------------------------------------------------
describe("generateEmployeeId", () => {
  it("pads single digit count", () => {
    expect(generateEmployeeId(1)).toBe("EMP-0001");
  });

  it("pads triple digit count", () => {
    expect(generateEmployeeId(123)).toBe("EMP-0123");
  });

  it("handles exactly 4 digits", () => {
    expect(generateEmployeeId(9999)).toBe("EMP-9999");
  });
});

// ---------------------------------------------------------------------------
// generateLdapUsername
// ---------------------------------------------------------------------------
describe("generateLdapUsername", () => {
  it("generates lowercase dot-separated username", () => {
    expect(generateLdapUsername("John", "Doe")).toBe("john.doe");
  });

  it("strips non-alphabetic characters (hyphens, spaces, etc.)", () => {
    expect(generateLdapUsername("Anne-Marie", "O'Brien")).toBe(
      "annemarie.obrien"
    );
  });

  it("handles all-lowercase input unchanged", () => {
    expect(generateLdapUsername("alice", "smith")).toBe("alice.smith");
  });

  it("preserves the dot separator between names", () => {
    const result = generateLdapUsername("Bob", "Taylor");
    expect(result).toMatch(/^[a-z]+\.[a-z]+$/);
  });
});
