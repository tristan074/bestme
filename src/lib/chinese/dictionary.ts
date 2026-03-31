import dictionary from "./dictionary.json";

export function getExampleWord(char: string): string {
  const words = (dictionary as Record<string, string[]>)[char];
  if (!words || words.length === 0) return "";
  // Return a random word from the list for variety
  return words[Math.floor(Math.random() * words.length)];
}
