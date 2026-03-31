// @ts-ignore
import dictionaryData from "./dictionary.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dictionary: any = dictionaryData;

export function getExampleWord(char: string): string {
  const words = dictionary[char];
  if (!words || words.length === 0) return "";
  return words[Math.floor(Math.random() * words.length)];
}
