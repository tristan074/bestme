import { describe, it, expect } from "vitest";
import { getCharPinyin, parseCharacters } from "./pinyin";

describe("getCharPinyin", () => {
  it("returns pinyin for a common character", () => {
    const result = getCharPinyin("春");
    expect(result).toBe("chūn");
  });
  it("returns pinyin for multiple characters", () => {
    const result = getCharPinyin("花");
    expect(result).toBe("huā");
  });
});

describe("parseCharacters", () => {
  it("parses space-separated characters", () => {
    expect(parseCharacters("春 风 花")).toEqual(["春", "风", "花"]);
  });
  it("parses consecutive characters", () => {
    expect(parseCharacters("春风花")).toEqual(["春", "风", "花"]);
  });
  it("deduplicates", () => {
    expect(parseCharacters("春 春 风")).toEqual(["春", "风"]);
  });
  it("ignores non-CJK characters", () => {
    expect(parseCharacters("春abc风123花")).toEqual(["春", "风", "花"]);
  });
});
