import { describe, expect, it } from "vitest";
import { satisfiesRequires } from "../version";

describe("satisfiesRequires", () => {
  it("should return true when version satisfies required range", () => {
    expect(satisfiesRequires("2.0.0", "*")).toBe(true);
    expect(satisfiesRequires("2.0.0", "")).toBe(true);
    expect(satisfiesRequires("2.0.0", ">=2.0.0")).toBe(true);
    expect(satisfiesRequires("2.1.0", "2.0.0")).toBe(true);
  });

  it("should return false when version does not satisfy required range", () => {
    expect(satisfiesRequires("0.0.0", ">=2.2.0")).toBe(false);
    expect(satisfiesRequires("2.0.0", ">2.0.0")).toBe(false);
    expect(satisfiesRequires("2.0.0", ">=2.1.0")).toBe(false);
  });

  it("should return true when version or required range is missing", () => {
    expect(satisfiesRequires("2.0.0", undefined)).toBe(true);
    expect(satisfiesRequires(undefined, undefined)).toBe(true);
  });

  it("should return true when version satisfies required range with prerelease", () => {
    expect(satisfiesRequires("2.0.0-beta.1", ">=2.0.0-beta.1")).toBe(true);
    expect(satisfiesRequires("2.0.0-beta.1", ">=2.0.0-beta.0")).toBe(true);
    expect(satisfiesRequires("2.0.0-beta.1", ">=2.0.0-alpha.0")).toBe(true);
    expect(satisfiesRequires("2.0.0", ">=2.0.0-alpha.0")).toBe(true);
  });
});
