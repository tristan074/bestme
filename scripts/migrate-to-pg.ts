import Database from "better-sqlite3";
import { Client } from "pg";

const sqlite = new Database("./prisma/bestme.db");
const pg = new Client({
  host: "localhost",
  port: 5433,
  database: "bestme",
  user: "openclaw",
});

async function migrate() {
  await pg.connect();

  // Migrate Notebook
  const notebooks = sqlite.prepare("SELECT * FROM Notebook").all();
  for (const n of notebooks) {
    await pg.query(
      `INSERT INTO "Notebook" ("id", "name", "isActive", "archived", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("id") DO NOTHING`,
      [n.id, n.name, n.isActive ? 1 : 0, n.archived ? 1 : 0, n.createdAt, n.updatedAt]
    );
  }
  console.log(`Migrated ${notebooks.length} notebooks`);

  // Migrate Character
  const characters = sqlite.prepare("SELECT * FROM Character").all();
  for (const c of characters) {
    await pg.query(
      `INSERT INTO "Character" ("id", "char", "pinyin", "lesson", "status", "notebookId")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("char", "notebookId") DO NOTHING`,
      [c.id, c.char, c.pinyin, c.lesson, c.status, c.notebookId]
    );
  }
  console.log(`Migrated ${characters.length} characters`);

  // Migrate CharacterReview
  const reviews = sqlite.prepare("SELECT * FROM CharacterReview").all();
  for (const r of reviews) {
    await pg.query(
      `INSERT INTO "CharacterReview" ("id", "characterId", "correct", "reviewDate")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("id") DO NOTHING`,
      [r.id, r.characterId, r.correct ? 1 : 0, r.reviewDate]
    );
  }
  console.log(`Migrated ${reviews.length} character reviews`);

  // Migrate ReviewSchedule
  const schedules = sqlite.prepare("SELECT * FROM ReviewSchedule").all();
  for (const s of schedules) {
    await pg.query(
      `INSERT INTO "ReviewSchedule" ("id", "characterId", "nextReview", "interval", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("characterId") DO NOTHING`,
      [s.id, s.characterId, s.nextReview, s.interval, s.createdAt, s.updatedAt]
    );
  }
  console.log(`Migrated ${schedules.length} review schedules`);

  // Migrate MathSession
  const sessions = sqlite.prepare("SELECT * FROM MathSession").all();
  for (const s of sessions) {
    await pg.query(
      `INSERT INTO "MathSession" ("id", "specialty", "totalCount", "correctCount", "totalTime", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("id") DO NOTHING`,
      [s.id, s.specialty, s.totalCount, s.correctCount, s.totalTime, s.createdAt]
    );
  }
  console.log(`Migrated ${sessions.length} math sessions`);

  // Migrate MathQuestion
  const questions = sqlite.prepare("SELECT * FROM MathQuestion").all();
  for (const q of questions) {
    await pg.query(
      `INSERT INTO "MathQuestion" ("id", "sessionId", "expression", "answer", "userAnswer", "correct", "timeMs")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT ("id") DO NOTHING`,
      [q.id, q.sessionId, q.expression, q.answer, q.userAnswer, q.correct ? 1 : 0, q.timeMs]
    );
  }
  console.log(`Migrated ${questions.length} math questions`);

  // Migrate MathErrorBook
  const errors = sqlite.prepare("SELECT * FROM MathErrorBook").all();
  for (const e of errors) {
    await pg.query(
      `INSERT INTO "MathErrorBook" ("id", "specialty", "expression", "answer", "errorCount", "lastError")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("specialty", "expression") DO NOTHING`,
      [e.id, e.specialty, e.expression, e.answer, e.errorCount, e.lastError]
    );
  }
  console.log(`Migrated ${errors.length} math error book entries`);

  // Migrate PointsLog
  const points = sqlite.prepare("SELECT * FROM PointsLog").all();
  for (const p of points) {
    await pg.query(
      `INSERT INTO "PointsLog" ("id", "points", "reason", "createdAt")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("id") DO NOTHING`,
      [p.id, p.points, p.reason, p.createdAt]
    );
  }
  console.log(`Migrated ${points.length} points logs`);

  // Migrate Achievement
  const achievements = sqlite.prepare("SELECT * FROM Achievement").all();
  for (const a of achievements) {
    await pg.query(
      `INSERT INTO "Achievement" ("id", "key", "name", "unlockedAt")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("key") DO NOTHING`,
      [a.id, a.key, a.name, a.unlockedAt]
    );
  }
  console.log(`Migrated ${achievements.length} achievements`);

  // Migrate DailyCheckin
  const checkins = sqlite.prepare("SELECT * FROM DailyCheckin").all();
  for (const c of checkins) {
    await pg.query(
      `INSERT INTO "DailyCheckin" ("id", "date", "math", "chinese", "createdAt")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("date") DO NOTHING`,
      [c.id, c.date, c.math ? 1 : 0, c.chinese ? 1 : 0, c.createdAt]
    );
  }
  console.log(`Migrated ${checkins.length} daily checkins`);

  await pg.end();
  sqlite.close();
  console.log("Done!");
}

migrate().catch(console.error);
