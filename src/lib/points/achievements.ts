export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  emoji: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "lightning_calc", name: "闪电口算", description: "小九九20题1分钟内完成", emoji: "⚡" },
  { key: "speed_master", name: "速算小能手", description: "刷新任意专项用时记录", emoji: "🏎️" },
  { key: "hundred_chars", name: "百字英雄", description: "累计掌握100个生字", emoji: "📚" },
  { key: "streak_7", name: "坚持之星·周", description: "连续打卡7天", emoji: "⭐" },
  { key: "streak_30", name: "坚持之星·月", description: "连续打卡30天", emoji: "🌟" },
  { key: "perfect_math", name: "零失误·数学", description: "单次数学练习全对", emoji: "🎯" },
  { key: "perfect_dictation", name: "零失误·听写", description: "单次听写全对", emoji: "✨" },
];
