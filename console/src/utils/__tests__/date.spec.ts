import { describe, expect, it } from "vitest";
import { toISOString, toDatetimeLocal } from "../date";

describe("date", () => {
  describe("toISOString", () => {
    it("should return an empty string if date is undefined", () => {
      expect(toISOString(undefined)).toBe("");
    });

    it("should return an empty string if date is null", () => {
      expect(toISOString(null)).toBe("");
    });

    it("should return a formatted date string in UTC timezone", () => {
      const date = new Date("2021-01-01T00:00:00Z");
      const expected = "2021-01-01T00:00:00.000Z";
      expect(toISOString(date)).toBe(expected);
    });
  });

  describe("toDatetimeLocal", () => {
    it("should return an empty string if date is undefined", () => {
      expect(toDatetimeLocal(undefined)).toBe("");
    });

    it("should return an empty string if date is null", () => {
      expect(toDatetimeLocal(null)).toBe("");
    });

    it("should return a formatted date string in the local timezone", () => {
      const date = new Date("2021-01-01T00:00:00Z");
      const expected = "2021-01-01T08:00";
      expect(toDatetimeLocal(date)).toBe(expected);
    });

    it("should return a formatted date string in the specified timezone", () => {
      const date = new Date("2021-01-01T00:00:00Z");
      const tz = "America/Los_Angeles";
      const expected = "2020-12-31T16:00";
      expect(toDatetimeLocal(date, tz)).toBe(expected);
    });
  });
});
