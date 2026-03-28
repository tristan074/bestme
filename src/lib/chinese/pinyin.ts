import { pinyin } from "pinyin-pro";

export function getCharPinyin(char: string): string {
  return pinyin(char, { toneType: "symbol", type: "array" })[0] || char;
}

export function parseCharacters(input: string): string[] {
  const chars = input.match(/[\u4e00-\u9fff]/g);
  if (!chars) return [];
  return [...new Set(chars)];
}
