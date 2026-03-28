# BestMe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a learning web app for Fred (2nd grader) covering math drills and Chinese character dictation with spaced repetition, gamified with points and achievements.

**Architecture:** Next.js App Router full-stack app with SQLite via Prisma. Server Actions for data mutations, client components for interactive practice pages. Web Speech API for dictation TTS.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS 4, Prisma + SQLite, Web Speech API, Recharts (charts), vitest + React Testing Library (tests)

---

## File Structure

```
prisma/
  schema.prisma              - Database schema (all models)

src/
  app/
    layout.tsx               - Root layout, global nav, points display
    page.tsx                  - Home page (module selection cards)
    math/
      page.tsx               - Specialty selection + config
      practice/
        page.tsx             - Practice session (timer + input + judging)
      result/
        page.tsx             - Result summary + error review
    chinese/
      page.tsx               - Chinese module home (today's tasks overview)
      notebooks/
        page.tsx             - Notebook CRUD (create/rename/switch/archive)
      characters/
        page.tsx             - Character library (grouped by lesson, status toggle)
      import/
        page.tsx             - Batch import characters
      dictation/
        page.tsx             - Dictation session (TTS + next button)
      dictation/review/
        page.tsx             - Review answers (show correct, mark right/wrong)
    dashboard/
      page.tsx               - Data dashboard (trends, calendar, achievements)
    api/
      math/
        questions/route.ts   - Generate questions API
        sessions/route.ts    - Save practice session
      chinese/
        today/route.ts       - Get today's review tasks
        dictation/route.ts   - Save dictation results
        characters/route.ts  - Import/update characters
        notebooks/route.ts   - Notebook CRUD
      points/route.ts        - Get points & achievements
      dashboard/route.ts     - Dashboard data aggregation

  lib/
    prisma.ts                - Prisma client singleton
    math/
      generators.ts          - Question generators for 3 specialties
      generators.test.ts     - Tests for generators
    chinese/
      pinyin.ts              - Pinyin lookup/generation
      pinyin.test.ts         - Tests for pinyin
      spaced-repetition.ts   - Ebbinghaus scheduling algorithm
      spaced-repetition.test.ts - Tests for spaced repetition
    points/
      engine.ts              - Points calculation + achievement checks
      engine.test.ts         - Tests for points engine
      achievements.ts        - Achievement definitions

  components/
    Timer.tsx                - Countdown/stopwatch timer
    NumericInput.tsx         - Large touch-friendly number input for iPad
    ProgressBar.tsx          - Progress indicator
    AchievementBadge.tsx     - Achievement badge display
    HeatmapCalendar.tsx      - GitHub-style heatmap calendar
    TrendChart.tsx           - Line chart for trends (wraps Recharts)
    ModuleCard.tsx           - Home page module selection card
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `prisma/schema.prisma`, `src/lib/prisma.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `tailwind.config.ts`, `vitest.config.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/tristan/projects/qiu/bestme
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. If directory not empty, confirm overwrite.

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client recharts pinyin-pro
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- `pinyin-pro`: Chinese pinyin generation library
- `recharts`: Charts for dashboard
- `vitest` + `@testing-library`: Testing

- [ ] **Step 3: Configure vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Initialize Prisma with SQLite**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 5: Define database schema**

Write `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./bestme.db"
}

// -- Chinese Module --

model Notebook {
  id        Int      @id @default(autoincrement())
  name      String
  isActive  Boolean  @default(false)
  archived  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  characters Character[]
}

model Character {
  id         Int      @id @default(autoincrement())
  char       String
  pinyin     String
  lesson     String   @default("")
  status     String   @default("unlearned") // unlearned, learning, mastered
  notebookId Int

  notebook   Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)
  reviews    CharacterReview[]

  @@unique([char, notebookId])
}

model CharacterReview {
  id          Int      @id @default(autoincrement())
  characterId Int
  correct     Boolean
  reviewDate  DateTime @default(now())

  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
}

model ReviewSchedule {
  id          Int      @id @default(autoincrement())
  characterId Int      @unique
  nextReview  DateTime
  interval    Int      @default(0) // index into intervals array: [1,2,4,7,15]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// -- Math Module --

model MathSession {
  id         Int      @id @default(autoincrement())
  specialty  String   // multiplication, carrying, two-digit
  totalCount Int
  correctCount Int
  totalTime  Int      // milliseconds
  createdAt  DateTime @default(now())

  questions  MathQuestion[]
}

model MathQuestion {
  id         Int      @id @default(autoincrement())
  sessionId  Int
  expression String   // e.g. "7 × 8"
  answer     Int      // correct answer
  userAnswer Int
  correct    Boolean
  timeMs     Int      // time spent on this question in ms

  session    MathSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model MathErrorBook {
  id         Int      @id @default(autoincrement())
  specialty  String
  expression String
  answer     Int
  errorCount Int      @default(1)
  lastError  DateTime @default(now())

  @@unique([specialty, expression])
}

// -- Points & Achievements --

model PointsLog {
  id        Int      @id @default(autoincrement())
  points    Int
  reason    String
  createdAt DateTime @default(now())
}

model Achievement {
  id         Int      @id @default(autoincrement())
  key        String   @unique
  name       String
  unlockedAt DateTime @default(now())
}

model DailyCheckin {
  id        Int      @id @default(autoincrement())
  date      String   @unique // YYYY-MM-DD
  math      Boolean  @default(false)
  chinese   Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

- [ ] **Step 6: Generate Prisma client and create DB**

```bash
npx prisma db push
```

- [ ] **Step 7: Create Prisma client singleton**

Write `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 8: Create placeholder home page**

Write `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">BestMe</h1>
    </main>
  );
}
```

- [ ] **Step 9: Verify setup**

```bash
npm run build
npm run test
```

Both should succeed (no tests yet, build confirms Next.js + Prisma wiring).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json prisma/ src/ tailwind.config.ts vitest.config.ts tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs .gitignore public/
git commit -m "feat: scaffold Next.js project with Prisma SQLite"
```

---

### Task 2: Math Question Generators

**Files:**
- Create: `src/lib/math/generators.ts`, `src/lib/math/generators.test.ts`

- [ ] **Step 1: Write failing tests for multiplication generator**

Write `src/lib/math/generators.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  generateMultiplication,
  generateCarrying,
  generateTwoDigit,
} from "./generators";

describe("generateMultiplication", () => {
  it("generates the requested number of questions", () => {
    const questions = generateMultiplication(20);
    expect(questions).toHaveLength(20);
  });

  it("each question has factors between 1-9", () => {
    const questions = generateMultiplication(50);
    for (const q of questions) {
      expect(q.a).toBeGreaterThanOrEqual(1);
      expect(q.a).toBeLessThanOrEqual(9);
      expect(q.b).toBeGreaterThanOrEqual(1);
      expect(q.b).toBeLessThanOrEqual(9);
      expect(q.answer).toBe(q.a * q.b);
      expect(q.expression).toBe(`${q.a} × ${q.b}`);
    }
  });

  it("does not repeat expressions within one session", () => {
    const questions = generateMultiplication(20);
    const expressions = questions.map((q) => q.expression);
    expect(new Set(expressions).size).toBe(20);
  });
});

describe("generateCarrying", () => {
  it("generates the requested number of questions", () => {
    const questions = generateCarrying(20);
    expect(questions).toHaveLength(20);
  });

  it("addition: both operands <= 10, result > 10 and <= 20", () => {
    const questions = generateCarrying(100);
    for (const q of questions) {
      if (q.expression.includes("+")) {
        expect(q.a).toBeGreaterThanOrEqual(2);
        expect(q.a).toBeLessThanOrEqual(10);
        expect(q.b).toBeGreaterThanOrEqual(2);
        expect(q.b).toBeLessThanOrEqual(10);
        expect(q.answer).toBeGreaterThan(10);
        expect(q.answer).toBeLessThanOrEqual(20);
      }
    }
  });

  it("subtraction: minuend 11-20, result >= 0", () => {
    const questions = generateCarrying(100);
    for (const q of questions) {
      if (q.expression.includes("−")) {
        expect(q.a).toBeGreaterThanOrEqual(11);
        expect(q.a).toBeLessThanOrEqual(20);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe("generateTwoDigit", () => {
  it("generates the requested number of questions", () => {
    const questions = generateTwoDigit(20);
    expect(questions).toHaveLength(20);
  });

  it("involves at least one two-digit number, result 0-100", () => {
    const questions = generateTwoDigit(100);
    for (const q of questions) {
      const hasTwoDigit = q.a >= 10 || q.b >= 10;
      expect(hasTwoDigit).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(100);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/math/generators.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement generators**

Write `src/lib/math/generators.ts`:

```typescript
export interface MathProblem {
  a: number;
  b: number;
  answer: number;
  expression: string;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateMultiplication(count: number): MathProblem[] {
  // Build all possible multiplication facts (1-9 × 1-9)
  const all: MathProblem[] = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      all.push({ a, b, answer: a * b, expression: `${a} × ${b}` });
    }
  }
  return shuffle(all).slice(0, count);
}

export function generateCarrying(count: number): MathProblem[] {
  const all: MathProblem[] = [];

  // Addition: a + b where both <= 10, sum > 10
  for (let a = 2; a <= 10; a++) {
    for (let b = 2; b <= 10; b++) {
      if (a + b > 10 && a + b <= 20) {
        all.push({ a, b, answer: a + b, expression: `${a} + ${b}` });
      }
    }
  }

  // Subtraction: a - b where a is 11-20, b <= 10, result >= 0
  for (let a = 11; a <= 20; a++) {
    for (let b = 2; b <= 10; b++) {
      if (a - b >= 0 && a - b <= 10) {
        all.push({ a, b, answer: a - b, expression: `${a} − ${b}` });
      }
    }
  }

  return shuffle(all).slice(0, count);
}

export function generateTwoDigit(count: number): MathProblem[] {
  const all: MathProblem[] = [];

  // Addition: two-digit + one/two-digit, result <= 100
  for (let a = 10; a <= 99; a += Math.floor(Math.random() * 3) + 1) {
    for (let b = 1; b <= 99; b += Math.floor(Math.random() * 5) + 1) {
      if (a + b <= 100) {
        all.push({ a, b, answer: a + b, expression: `${a} + ${b}` });
      }
    }
  }

  // Subtraction: two-digit - one/two-digit, result >= 0
  for (let a = 10; a <= 99; a += Math.floor(Math.random() * 3) + 1) {
    for (let b = 1; b <= a; b += Math.floor(Math.random() * 5) + 1) {
      if (b >= 1) {
        all.push({ a, b, answer: a - b, expression: `${a} − ${b}` });
      }
    }
  }

  return shuffle(all).slice(0, count);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/math/generators.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/
git commit -m "feat: add math question generators with tests"
```

---

### Task 3: Math Practice API Routes

**Files:**
- Create: `src/app/api/math/questions/route.ts`, `src/app/api/math/sessions/route.ts`

- [ ] **Step 1: Create questions API**

Write `src/app/api/math/questions/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateMultiplication,
  generateCarrying,
  generateTwoDigit,
} from "@/lib/math/generators";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const specialty = searchParams.get("specialty");
  const count = parseInt(searchParams.get("count") || "20", 10);

  if (!specialty || !["multiplication", "carrying", "two-digit"].includes(specialty)) {
    return NextResponse.json({ error: "Invalid specialty" }, { status: 400 });
  }

  const generators: Record<string, (n: number) => ReturnType<typeof generateMultiplication>> = {
    multiplication: generateMultiplication,
    carrying: generateCarrying,
    "two-digit": generateTwoDigit,
  };

  let questions = generators[specialty](count);

  // Mix in error book questions (up to 25% of total)
  const errorBookCount = Math.min(Math.floor(count * 0.25), 5);
  if (errorBookCount > 0) {
    const errorQuestions = await prisma.mathErrorBook.findMany({
      where: { specialty },
      orderBy: { errorCount: "desc" },
      take: errorBookCount,
    });

    if (errorQuestions.length > 0) {
      const errorProblems = errorQuestions.map((eq) => {
        const parts = eq.expression.split(/\s*[×+−]\s*/);
        return {
          a: parseInt(parts[0], 10),
          b: parseInt(parts[1], 10),
          answer: eq.answer,
          expression: eq.expression,
        };
      });
      // Replace last N questions with error book questions
      questions = [
        ...questions.slice(0, count - errorProblems.length),
        ...errorProblems,
      ];
    }
  }

  return NextResponse.json({ questions });
}
```

- [ ] **Step 2: Create sessions API (save results)**

Write `src/app/api/math/sessions/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface QuestionInput {
  expression: string;
  answer: number;
  userAnswer: number;
  correct: boolean;
  timeMs: number;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { specialty, totalTime, questions } = body as {
    specialty: string;
    totalTime: number;
    questions: QuestionInput[];
  };

  const correctCount = questions.filter((q) => q.correct).length;

  const session = await prisma.mathSession.create({
    data: {
      specialty,
      totalCount: questions.length,
      correctCount,
      totalTime,
      questions: {
        create: questions.map((q) => ({
          expression: q.expression,
          answer: q.answer,
          userAnswer: q.userAnswer,
          correct: q.correct,
          timeMs: q.timeMs,
        })),
      },
    },
  });

  // Update error book: add wrong answers, remove correct ones
  for (const q of questions) {
    if (!q.correct) {
      await prisma.mathErrorBook.upsert({
        where: {
          specialty_expression: { specialty, expression: q.expression },
        },
        create: { specialty, expression: q.expression, answer: q.answer },
        update: { errorCount: { increment: 1 }, lastError: new Date() },
      });
    } else {
      // Correct answer: decrement error count, remove if 0
      const existing = await prisma.mathErrorBook.findUnique({
        where: {
          specialty_expression: { specialty, expression: q.expression },
        },
      });
      if (existing) {
        if (existing.errorCount <= 1) {
          await prisma.mathErrorBook.delete({
            where: { id: existing.id },
          });
        } else {
          await prisma.mathErrorBook.update({
            where: { id: existing.id },
            data: { errorCount: { decrement: 1 } },
          });
        }
      }
    }
  }

  // Update daily checkin
  const today = new Date().toISOString().slice(0, 10);
  await prisma.dailyCheckin.upsert({
    where: { date: today },
    create: { date: today, math: true },
    update: { math: true },
  });

  return NextResponse.json({ sessionId: session.id, correctCount, totalCount: questions.length });
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/math/
git commit -m "feat: add math questions and sessions API routes"
```

---

### Task 4: Math UI — Specialty Selection & Practice Config

**Files:**
- Create: `src/app/math/page.tsx`, `src/components/ModuleCard.tsx`

- [ ] **Step 1: Create ModuleCard component**

Write `src/components/ModuleCard.tsx`:

```tsx
"use client";

interface ModuleCardProps {
  title: string;
  description: string;
  emoji: string;
  href: string;
}

import Link from "next/link";

export default function ModuleCard({ title, description, emoji, href }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-3 rounded-3xl bg-white p-8 shadow-lg active:scale-95 transition-transform"
    >
      <span className="text-6xl">{emoji}</span>
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-lg text-gray-500">{description}</p>
    </Link>
  );
}
```

- [ ] **Step 2: Create math specialty selection page**

Write `src/app/math/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SPECIALTIES = [
  { key: "multiplication", name: "小九九", emoji: "✖️", description: "1×1 到 9×9" },
  { key: "carrying", name: "进位加减法", emoji: "➕", description: "10以内进位" },
  { key: "two-digit", name: "两位数加减", emoji: "🔢", description: "百以内" },
] as const;

const COUNT_OPTIONS = [10, 20, 30, 50];

export default function MathPage() {
  const router = useRouter();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [count, setCount] = useState(20);

  function handleStart() {
    if (!selectedSpecialty) return;
    router.push(`/math/practice?specialty=${selectedSpecialty}&count=${count}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6">
      <h1 className="text-3xl font-bold text-center text-blue-800 mb-8">数学练习</h1>

      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto mb-8">
        {SPECIALTIES.map((s) => (
          <button
            key={s.key}
            onClick={() => setSelectedSpecialty(s.key)}
            className={`flex items-center gap-4 rounded-2xl p-6 text-left transition-all ${
              selectedSpecialty === s.key
                ? "bg-blue-500 text-white shadow-lg scale-105"
                : "bg-white text-gray-800 shadow"
            }`}
          >
            <span className="text-4xl">{s.emoji}</span>
            <div>
              <div className="text-xl font-bold">{s.name}</div>
              <div className={selectedSpecialty === s.key ? "text-blue-100" : "text-gray-400"}>
                {s.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedSpecialty && (
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">选择题数</h2>
          <div className="flex justify-center gap-3 mb-8">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`rounded-xl px-6 py-3 text-lg font-bold transition-all ${
                  count === n
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-white text-gray-600 shadow"
                }`}
              >
                {n}题
              </button>
            ))}
          </div>

          <button
            onClick={handleStart}
            className="w-full rounded-2xl bg-green-500 py-4 text-2xl font-bold text-white shadow-lg active:scale-95 transition-transform"
          >
            开始练习 🚀
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify renders**

```bash
npm run dev
```

Visit `http://localhost:3000/math` — should see specialty cards and count selector.

- [ ] **Step 4: Commit**

```bash
git add src/app/math/page.tsx src/components/ModuleCard.tsx
git commit -m "feat: add math specialty selection and practice config UI"
```

---

### Task 5: Math Practice Page (Timer + Input + Judging)

**Files:**
- Create: `src/app/math/practice/page.tsx`, `src/components/Timer.tsx`, `src/components/NumericInput.tsx`

- [ ] **Step 1: Create Timer component**

Write `src/components/Timer.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  running: boolean;
  onTick?: (ms: number) => void;
}

export default function Timer({ running, onTick }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const start = Date.now() - elapsed;
    const interval = setInterval(() => {
      const now = Date.now() - start;
      setElapsed(now);
      onTick?.(now);
    }, 100);
    return () => clearInterval(interval);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const display = `${minutes.toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="text-3xl font-mono font-bold text-gray-600">
      ⏱ {display}
    </div>
  );
}
```

- [ ] **Step 2: Create NumericInput component (iPad touch-friendly)**

Write `src/components/NumericInput.tsx`:

```tsx
"use client";

import { useState } from "react";

interface NumericInputProps {
  onSubmit: (value: number) => void;
}

export default function NumericInput({ onSubmit }: NumericInputProps) {
  const [value, setValue] = useState("");

  function handleKey(key: string) {
    if (key === "del") {
      setValue((v) => v.slice(0, -1));
    } else if (key === "ok") {
      if (value !== "") {
        onSubmit(parseInt(value, 10));
        setValue("");
      }
    } else {
      // Max 3 digits (answers are <= 100)
      if (value.length < 3) {
        setValue((v) => v + key);
      }
    }
  }

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["del", "0", "ok"],
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-48 rounded-xl bg-white p-4 text-center text-4xl font-bold text-gray-800 shadow-inner min-h-[60px]">
        {value || <span className="text-gray-300">?</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.flat().map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className={`h-16 w-20 rounded-xl text-2xl font-bold transition-all active:scale-90 ${
              key === "ok"
                ? "bg-green-500 text-white"
                : key === "del"
                  ? "bg-red-400 text-white"
                  : "bg-gray-100 text-gray-800"
            } shadow`}
          >
            {key === "del" ? "⌫" : key === "ok" ? "✓" : key}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create practice page**

Write `src/app/math/practice/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Timer from "@/components/Timer";
import NumericInput from "@/components/NumericInput";

interface Question {
  a: number;
  b: number;
  answer: number;
  expression: string;
}

interface AnsweredQuestion extends Question {
  userAnswer: number;
  correct: boolean;
  timeMs: number;
}

function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const specialty = searchParams.get("specialty") || "multiplication";
  const count = parseInt(searchParams.get("count") || "20", 10);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [questionStart, setQuestionStart] = useState(0);
  const [showFeedback, setShowFeedback] = useState<"correct" | "wrong" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/math/questions?specialty=${specialty}&count=${count}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions);
        setLoading(false);
        setTimerRunning(true);
        setQuestionStart(Date.now());
      });
  }, [specialty, count]);

  const handleAnswer = useCallback(
    (userAnswer: number) => {
      if (showFeedback) return;
      const q = questions[currentIndex];
      const correct = userAnswer === q.answer;
      const timeMs = Date.now() - questionStart;

      setAnswers((prev) => [
        ...prev,
        { ...q, userAnswer, correct, timeMs },
      ]);

      setShowFeedback(correct ? "correct" : "wrong");

      setTimeout(() => {
        setShowFeedback(null);
        if (currentIndex + 1 >= questions.length) {
          // Done — save session and go to results
          setTimerRunning(false);
          const allAnswers = [
            ...answers,
            { ...q, userAnswer, correct, timeMs },
          ];
          fetch("/api/math/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              specialty,
              totalTime: totalElapsed,
              questions: allAnswers,
            }),
          })
            .then((r) => r.json())
            .then((data) => {
              sessionStorage.setItem("mathResult", JSON.stringify({
                ...data,
                specialty,
                totalTime: totalElapsed,
                questions: allAnswers,
              }));
              router.push("/math/result");
            });
        } else {
          setCurrentIndex((i) => i + 1);
          setQuestionStart(Date.now());
        }
      }, 600);
    },
    [currentIndex, questions, questionStart, answers, specialty, totalElapsed, router, showFeedback],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
        <p className="text-2xl text-gray-500">出题中...</p>
      </div>
    );
  }

  const current = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6 flex flex-col items-center">
      {/* Header */}
      <div className="flex w-full max-w-md justify-between items-center mb-8">
        <div className="text-lg font-bold text-gray-500">
          {currentIndex + 1} / {questions.length}
        </div>
        <Timer running={timerRunning} onTick={setTotalElapsed} />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div
          className={`text-5xl font-bold transition-colors ${
            showFeedback === "correct"
              ? "text-green-500"
              : showFeedback === "wrong"
                ? "text-red-500"
                : "text-gray-800"
          }`}
        >
          {current.expression} = ?
        </div>

        {showFeedback === "wrong" && (
          <div className="text-2xl text-red-400">
            正确答案: {current.answer}
          </div>
        )}

        {!showFeedback && <NumericInput onSubmit={handleAnswer} />}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mt-8">
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PracticeContent />
    </Suspense>
  );
}
```

- [ ] **Step 4: Verify interaction**

```bash
npm run dev
```

Visit `http://localhost:3000/math` → select specialty → start → verify timer, input, and auto-advance work.

- [ ] **Step 5: Commit**

```bash
git add src/app/math/practice/ src/components/Timer.tsx src/components/NumericInput.tsx
git commit -m "feat: add math practice page with timer and numeric input"
```

---

### Task 6: Math Result Page

**Files:**
- Create: `src/app/math/result/page.tsx`

- [ ] **Step 1: Create result page**

Write `src/app/math/result/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AnsweredQuestion {
  expression: string;
  answer: number;
  userAnswer: number;
  correct: boolean;
  timeMs: number;
}

interface ResultData {
  specialty: string;
  totalTime: number;
  correctCount: number;
  totalCount: number;
  questions: AnsweredQuestion[];
}

const SPECIALTY_NAMES: Record<string, string> = {
  multiplication: "小九九",
  carrying: "进位加减法",
  "two-digit": "两位数加减",
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("mathResult");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      router.push("/math");
    }
  }, [router]);

  if (!result) return null;

  const { specialty, totalTime, correctCount, totalCount, questions } = result;
  const accuracy = Math.round((correctCount / totalCount) * 100);
  const seconds = Math.floor(totalTime / 1000);
  const minutes = Math.floor(seconds / 60);
  const timeDisplay = `${minutes}分${seconds % 60}秒`;
  const wrongQuestions = questions.filter((q) => !q.correct);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-2">
          练习完成！
        </h1>
        <p className="text-center text-gray-500 mb-8">
          {SPECIALTY_NAMES[specialty]}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-white p-4 text-center shadow">
            <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
            <div className="text-sm text-gray-400">正确率</div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow">
            <div className="text-3xl font-bold text-green-600">
              {correctCount}/{totalCount}
            </div>
            <div className="text-sm text-gray-400">答对</div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow">
            <div className="text-3xl font-bold text-orange-500">{timeDisplay}</div>
            <div className="text-sm text-gray-400">用时</div>
          </div>
        </div>

        {/* Wrong answers */}
        {wrongQuestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-red-500 mb-4">
              错题回顾 ({wrongQuestions.length}题)
            </h2>
            <div className="space-y-2">
              {wrongQuestions.map((q, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center rounded-xl bg-white p-4 shadow"
                >
                  <span className="text-lg">
                    {q.expression} = <span className="text-red-500 line-through">{q.userAnswer}</span>
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {q.answer}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href={`/math/practice?specialty=${specialty}&count=${totalCount}`}
            className="flex-1 rounded-2xl bg-blue-500 py-4 text-center text-xl font-bold text-white shadow active:scale-95 transition-transform"
          >
            再来一次
          </Link>
          <Link
            href="/math"
            className="flex-1 rounded-2xl bg-gray-200 py-4 text-center text-xl font-bold text-gray-600 shadow active:scale-95 transition-transform"
          >
            返回
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify full math flow**

```bash
npm run dev
```

Full flow: `/math` → select → practice → finish → result page with stats and error review.

- [ ] **Step 3: Commit**

```bash
git add src/app/math/result/
git commit -m "feat: add math practice result page with error review"
```

---

### Task 7: Chinese Module — Notebook & Character Management

**Files:**
- Create: `src/app/api/chinese/notebooks/route.ts`, `src/app/api/chinese/characters/route.ts`, `src/lib/chinese/pinyin.ts`, `src/lib/chinese/pinyin.test.ts`, `src/app/chinese/page.tsx`, `src/app/chinese/notebooks/page.tsx`, `src/app/chinese/characters/page.tsx`, `src/app/chinese/import/page.tsx`

- [ ] **Step 1: Write pinyin utility test**

Write `src/lib/chinese/pinyin.test.ts`:

```typescript
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
    const result = parseCharacters("春 风 花");
    expect(result).toEqual(["春", "风", "花"]);
  });

  it("parses consecutive characters", () => {
    const result = parseCharacters("春风花");
    expect(result).toEqual(["春", "风", "花"]);
  });

  it("deduplicates", () => {
    const result = parseCharacters("春 春 风");
    expect(result).toEqual(["春", "风"]);
  });

  it("ignores non-CJK characters", () => {
    const result = parseCharacters("春abc风123花");
    expect(result).toEqual(["春", "风", "花"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/chinese/pinyin.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement pinyin utility**

Write `src/lib/chinese/pinyin.ts`:

```typescript
import { pinyin } from "pinyin-pro";

export function getCharPinyin(char: string): string {
  return pinyin(char, { toneType: "symbol", type: "array" })[0] || char;
}

export function parseCharacters(input: string): string[] {
  // Match all CJK Unified Ideographs
  const chars = input.match(/[\u4e00-\u9fff]/g);
  if (!chars) return [];
  // Deduplicate while preserving order
  return [...new Set(chars)];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/chinese/pinyin.test.ts
```

Expected: PASS.

- [ ] **Step 5: Create notebooks API**

Write `src/app/api/chinese/notebooks/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const notebooks = await prisma.notebook.findMany({
    where: { archived: false },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { characters: true } },
    },
  });
  return NextResponse.json({ notebooks });
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();

  // Deactivate all others, activate new one
  await prisma.notebook.updateMany({ data: { isActive: false } });
  const notebook = await prisma.notebook.create({
    data: { name, isActive: true },
  });

  return NextResponse.json({ notebook });
}

export async function PATCH(request: NextRequest) {
  const { id, name, isActive, archived } = await request.json();

  if (isActive) {
    await prisma.notebook.updateMany({ data: { isActive: false } });
  }

  const notebook = await prisma.notebook.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(isActive !== undefined && { isActive }),
      ...(archived !== undefined && { archived }),
    },
  });

  return NextResponse.json({ notebook });
}
```

- [ ] **Step 6: Create characters API (import + status update)**

Write `src/app/api/chinese/characters/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCharacters, getCharPinyin } from "@/lib/chinese/pinyin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const notebookId = parseInt(searchParams.get("notebookId") || "0", 10);

  const characters = await prisma.character.findMany({
    where: { notebookId },
    orderBy: [{ lesson: "asc" }, { id: "asc" }],
  });

  return NextResponse.json({ characters });
}

// Batch import
export async function POST(request: NextRequest) {
  const { notebookId, text, lesson } = await request.json();
  const chars = parseCharacters(text);

  const created = [];
  for (const char of chars) {
    try {
      const record = await prisma.character.create({
        data: {
          char,
          pinyin: getCharPinyin(char),
          lesson: lesson || "",
          notebookId,
        },
      });
      created.push(record);
    } catch {
      // Skip duplicates (unique constraint)
    }
  }

  return NextResponse.json({ imported: created.length, total: chars.length });
}

// Update character status
export async function PATCH(request: NextRequest) {
  const { ids, status } = await request.json();

  await prisma.character.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  // If marking as "learning", create review schedules
  if (status === "learning") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const id of ids) {
      await prisma.reviewSchedule.upsert({
        where: { characterId: id },
        create: { characterId: id, nextReview: tomorrow, interval: 0 },
        update: { nextReview: tomorrow, interval: 0 },
      });
    }
  }

  return NextResponse.json({ updated: ids.length });
}
```

- [ ] **Step 7: Create notebooks management page**

Write `src/app/chinese/notebooks/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Notebook {
  id: number;
  name: string;
  isActive: boolean;
  _count: { characters: number };
}

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  async function fetchNotebooks() {
    const res = await fetch("/api/chinese/notebooks");
    const data = await res.json();
    setNotebooks(data.notebooks);
  }

  useEffect(() => {
    fetchNotebooks();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    await fetch("/api/chinese/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    fetchNotebooks();
  }

  async function handleActivate(id: number) {
    await fetch("/api/chinese/notebooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: true }),
    });
    fetchNotebooks();
  }

  async function handleRename(id: number) {
    if (!editName.trim()) return;
    await fetch("/api/chinese/notebooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName.trim() }),
    });
    setEditingId(null);
    fetchNotebooks();
  }

  async function handleArchive(id: number) {
    await fetch("/api/chinese/notebooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archived: true }),
    });
    fetchNotebooks();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6">
      <h1 className="text-3xl font-bold text-center text-green-800 mb-8">生字簿管理</h1>

      {/* Create new */}
      <div className="max-w-md mx-auto mb-8 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新建生字簿名称..."
          className="flex-1 rounded-xl border-2 border-green-200 px-4 py-3 text-lg focus:border-green-500 focus:outline-none"
        />
        <button
          onClick={handleCreate}
          className="rounded-xl bg-green-500 px-6 py-3 text-lg font-bold text-white active:scale-95"
        >
          新建
        </button>
      </div>

      {/* List */}
      <div className="max-w-md mx-auto space-y-3">
        {notebooks.map((nb) => (
          <div
            key={nb.id}
            className={`rounded-2xl p-5 shadow ${
              nb.isActive ? "bg-green-500 text-white" : "bg-white"
            }`}
          >
            {editingId === nb.id ? (
              <div className="flex gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2 text-gray-800"
                  autoFocus
                />
                <button
                  onClick={() => handleRename(nb.id)}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white"
                >
                  保存
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xl font-bold">{nb.name}</div>
                    <div className={nb.isActive ? "text-green-100" : "text-gray-400"}>
                      {nb._count.characters} 个字
                      {nb.isActive && " · 当前使用"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {!nb.isActive && (
                    <button
                      onClick={() => handleActivate(nb.id)}
                      className="rounded-lg bg-green-100 px-3 py-1 text-sm font-bold text-green-700"
                    >
                      切换到此
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingId(nb.id); setEditName(nb.name); }}
                    className={`rounded-lg px-3 py-1 text-sm font-bold ${
                      nb.isActive ? "bg-green-400 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    重命名
                  </button>
                  <button
                    onClick={() => handleArchive(nb.id)}
                    className={`rounded-lg px-3 py-1 text-sm font-bold ${
                      nb.isActive ? "bg-green-400 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    归档
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto mt-8">
        <Link
          href="/chinese"
          className="block text-center text-lg text-green-600 font-bold"
        >
          ← 返回语文
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create batch import page**

Write `src/app/chinese/import/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Notebook {
  id: number;
  name: string;
  isActive: boolean;
}

export default function ImportPage() {
  const router = useRouter();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [text, setText] = useState("");
  const [lesson, setLesson] = useState("");
  const [result, setResult] = useState<{ imported: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/chinese/notebooks")
      .then((r) => r.json())
      .then((data) => {
        const active = data.notebooks.find((n: Notebook) => n.isActive);
        setNotebook(active || null);
      });
  }, []);

  async function handleImport() {
    if (!notebook || !text.trim()) return;
    const res = await fetch("/api/chinese/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notebookId: notebook.id, text, lesson }),
    });
    const data = await res.json();
    setResult(data);
    setText("");
  }

  if (!notebook) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6 flex flex-col items-center justify-center">
        <p className="text-xl text-gray-500 mb-4">请先创建一个生字簿</p>
        <button
          onClick={() => router.push("/chinese/notebooks")}
          className="rounded-xl bg-green-500 px-6 py-3 text-lg font-bold text-white"
        >
          去创建
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6">
      <h1 className="text-3xl font-bold text-center text-green-800 mb-2">批量导入生字</h1>
      <p className="text-center text-gray-500 mb-8">当前生字簿: {notebook.name}</p>

      <div className="max-w-md mx-auto">
        <input
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
          placeholder="课文名称（可选，如：第3课）"
          className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-lg mb-4 focus:border-green-500 focus:outline-none"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴汉字，支持空格分隔或连续输入&#10;如：春 风 花 草 树&#10;或：春风花草树"
          rows={6}
          className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-lg mb-4 focus:border-green-500 focus:outline-none resize-none"
        />

        <button
          onClick={handleImport}
          className="w-full rounded-2xl bg-green-500 py-4 text-xl font-bold text-white shadow active:scale-95 transition-transform mb-4"
        >
          导入
        </button>

        {result && (
          <div className="rounded-xl bg-white p-4 text-center shadow">
            <p className="text-lg">
              识别 <span className="font-bold text-green-600">{result.total}</span> 个字，
              成功导入 <span className="font-bold text-green-600">{result.imported}</span> 个
              {result.total - result.imported > 0 && (
                <span className="text-gray-400">
                  （{result.total - result.imported} 个重复已跳过）
                </span>
              )}
            </p>
          </div>
        )}

        <button
          onClick={() => router.push("/chinese/characters")}
          className="w-full mt-4 rounded-2xl bg-white py-4 text-xl font-bold text-green-600 shadow active:scale-95 transition-transform"
        >
          查看生字库 →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Create character library page (status management)**

Write `src/app/chinese/characters/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Character {
  id: number;
  char: string;
  pinyin: string;
  lesson: string;
  status: string;
}

interface Notebook {
  id: number;
  name: string;
  isActive: boolean;
}

export default function CharactersPage() {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  async function fetchData() {
    const nbRes = await fetch("/api/chinese/notebooks");
    const nbData = await nbRes.json();
    const active = nbData.notebooks.find((n: Notebook) => n.isActive);
    setNotebook(active || null);

    if (active) {
      const charRes = await fetch(`/api/chinese/characters?notebookId=${active.id}`);
      const charData = await charRes.json();
      setCharacters(charData.characters);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleBatchStatus(status: string) {
    if (selected.size === 0) return;
    await fetch("/api/chinese/characters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status }),
    });
    setSelected(new Set());
    fetchData();
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllUnlearned() {
    const ids = characters.filter((c) => c.status === "unlearned").map((c) => c.id);
    setSelected(new Set(ids));
  }

  // Group by lesson
  const grouped = characters.reduce<Record<string, Character[]>>((acc, c) => {
    const key = c.lesson || "未分组";
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const statusColors: Record<string, string> = {
    unlearned: "bg-gray-100 text-gray-600",
    learning: "bg-yellow-100 text-yellow-700",
    mastered: "bg-green-100 text-green-700",
  };

  const statusLabels: Record<string, string> = {
    unlearned: "未学",
    learning: "学习中",
    mastered: "已掌握",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6">
      <h1 className="text-3xl font-bold text-center text-green-800 mb-2">生字库</h1>
      <p className="text-center text-gray-500 mb-6">{notebook?.name}</p>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="max-w-md mx-auto mb-4 flex gap-2 justify-center">
          <span className="py-2 text-gray-600">已选 {selected.size} 个</span>
          <button
            onClick={() => handleBatchStatus("learning")}
            className="rounded-lg bg-yellow-500 px-4 py-2 text-white font-bold"
          >
            标记已学
          </button>
          <button
            onClick={() => handleBatchStatus("unlearned")}
            className="rounded-lg bg-gray-400 px-4 py-2 text-white font-bold"
          >
            标记未学
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-600 font-bold"
          >
            取消
          </button>
        </div>
      )}

      {selected.size === 0 && characters.some((c) => c.status === "unlearned") && (
        <div className="max-w-md mx-auto mb-4 text-center">
          <button
            onClick={selectAllUnlearned}
            className="text-green-600 font-bold"
          >
            全选未学的字
          </button>
        </div>
      )}

      {/* Character list by lesson */}
      <div className="max-w-md mx-auto space-y-6">
        {Object.entries(grouped).map(([lesson, chars]) => (
          <div key={lesson}>
            <h2 className="text-lg font-bold text-gray-700 mb-2">{lesson}</h2>
            <div className="flex flex-wrap gap-2">
              {chars.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleSelect(c.id)}
                  className={`relative rounded-xl px-4 py-3 text-center shadow transition-all ${
                    selected.has(c.id)
                      ? "bg-blue-500 text-white ring-2 ring-blue-300"
                      : statusColors[c.status]
                  }`}
                >
                  <div className="text-2xl font-bold">{c.char}</div>
                  <div className="text-xs">{c.pinyin}</div>
                  {!selected.has(c.id) && (
                    <div className="text-xs mt-1 opacity-60">
                      {statusLabels[c.status]}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto mt-8 flex gap-4">
        <Link
          href="/chinese/import"
          className="flex-1 text-center rounded-xl bg-green-500 py-3 text-lg font-bold text-white"
        >
          导入生字
        </Link>
        <Link
          href="/chinese"
          className="flex-1 text-center rounded-xl bg-white py-3 text-lg font-bold text-green-600 shadow"
        >
          ← 返回
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Create Chinese module home page**

Write `src/app/chinese/page.tsx`:

```tsx
import Link from "next/link";

export default function ChinesePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6">
      <h1 className="text-3xl font-bold text-center text-green-800 mb-8">语文学习</h1>

      <div className="max-w-md mx-auto space-y-4">
        <Link
          href="/chinese/dictation"
          className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow active:scale-95 transition-transform"
        >
          <span className="text-4xl">🎧</span>
          <div>
            <div className="text-xl font-bold text-gray-800">今日听写</div>
            <div className="text-gray-400">复习到期的生字</div>
          </div>
        </Link>

        <Link
          href="/chinese/characters"
          className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow active:scale-95 transition-transform"
        >
          <span className="text-4xl">📖</span>
          <div>
            <div className="text-xl font-bold text-gray-800">生字库</div>
            <div className="text-gray-400">查看和管理所有生字</div>
          </div>
        </Link>

        <Link
          href="/chinese/import"
          className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow active:scale-95 transition-transform"
        >
          <span className="text-4xl">📝</span>
          <div>
            <div className="text-xl font-bold text-gray-800">批量导入</div>
            <div className="text-gray-400">导入新的生字</div>
          </div>
        </Link>

        <Link
          href="/chinese/notebooks"
          className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow active:scale-95 transition-transform"
        >
          <span className="text-4xl">📚</span>
          <div>
            <div className="text-xl font-bold text-gray-800">生字簿管理</div>
            <div className="text-gray-400">新建、切换、归档生字簿</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Verify pages render**

```bash
npm run dev
```

Test: notebooks CRUD, import characters, character library with status toggle.

- [ ] **Step 12: Commit**

```bash
git add src/lib/chinese/ src/app/api/chinese/ src/app/chinese/
git commit -m "feat: add Chinese module - notebooks, character import, library management"
```

---

### Task 8: Spaced Repetition Engine

**Files:**
- Create: `src/lib/chinese/spaced-repetition.ts`, `src/lib/chinese/spaced-repetition.test.ts`, `src/app/api/chinese/today/route.ts`, `src/app/api/chinese/dictation/route.ts`

- [ ] **Step 1: Write failing tests for spaced repetition**

Write `src/lib/chinese/spaced-repetition.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { REVIEW_INTERVALS, getNextReview, isDueForReview } from "./spaced-repetition";

describe("REVIEW_INTERVALS", () => {
  it("has the correct Ebbinghaus intervals in days", () => {
    expect(REVIEW_INTERVALS).toEqual([1, 2, 4, 7, 15]);
  });
});

describe("getNextReview", () => {
  it("returns next interval on correct answer", () => {
    const baseDate = new Date("2026-03-28");
    const result = getNextReview(0, true, baseDate);
    expect(result.interval).toBe(1);
    expect(result.nextReview.toISOString().slice(0, 10)).toBe("2026-03-30");
  });

  it("resets to interval 0 on wrong answer", () => {
    const baseDate = new Date("2026-03-28");
    const result = getNextReview(3, false, baseDate);
    expect(result.interval).toBe(0);
    expect(result.nextReview.toISOString().slice(0, 10)).toBe("2026-03-29");
  });

  it("marks as mastered after passing all intervals", () => {
    const baseDate = new Date("2026-03-28");
    const result = getNextReview(4, true, baseDate); // last interval index
    expect(result.mastered).toBe(true);
  });
});

describe("isDueForReview", () => {
  it("returns true if nextReview is today or earlier", () => {
    const today = new Date("2026-03-28");
    const past = new Date("2026-03-27");
    expect(isDueForReview(past, today)).toBe(true);
    expect(isDueForReview(today, today)).toBe(true);
  });

  it("returns false if nextReview is in the future", () => {
    const today = new Date("2026-03-28");
    const future = new Date("2026-03-29");
    expect(isDueForReview(future, today)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/chinese/spaced-repetition.test.ts
```

- [ ] **Step 3: Implement spaced repetition**

Write `src/lib/chinese/spaced-repetition.ts`:

```typescript
// Ebbinghaus-based review intervals in days
export const REVIEW_INTERVALS = [1, 2, 4, 7, 15];

export interface ReviewResult {
  interval: number; // index into REVIEW_INTERVALS
  nextReview: Date;
  mastered: boolean;
}

export function getNextReview(
  currentInterval: number,
  correct: boolean,
  fromDate: Date = new Date(),
): ReviewResult {
  if (!correct) {
    // Reset to beginning
    const nextReview = new Date(fromDate);
    nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[0]);
    return { interval: 0, nextReview, mastered: false };
  }

  const nextIntervalIndex = currentInterval + 1;

  if (nextIntervalIndex >= REVIEW_INTERVALS.length) {
    // Passed all review stages — mastered
    return { interval: currentInterval, nextReview: fromDate, mastered: true };
  }

  const nextReview = new Date(fromDate);
  nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[nextIntervalIndex]);
  return { interval: nextIntervalIndex, nextReview, mastered: false };
}

export function isDueForReview(nextReview: Date, today: Date = new Date()): boolean {
  const reviewDay = nextReview.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  return reviewDay <= todayStr;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/chinese/spaced-repetition.test.ts
```

- [ ] **Step 5: Create today's tasks API**

Write `src/app/api/chinese/today/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const activeNotebook = await prisma.notebook.findFirst({
    where: { isActive: true, archived: false },
  });

  if (!activeNotebook) {
    return NextResponse.json({ characters: [], notebookName: null });
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Find all characters with due review schedules
  const schedules = await prisma.reviewSchedule.findMany({
    where: {
      nextReview: { lte: today },
    },
    include: {
      // We need to join with character to check notebook
    },
  });

  const scheduleCharIds = schedules.map((s) => s.characterId);

  const characters = await prisma.character.findMany({
    where: {
      id: { in: scheduleCharIds },
      notebookId: activeNotebook.id,
      status: "learning",
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({
    characters,
    notebookName: activeNotebook.name,
    total: characters.length,
  });
}
```

- [ ] **Step 6: Create dictation results API**

Write `src/app/api/chinese/dictation/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextReview } from "@/lib/chinese/spaced-repetition";

interface CharResult {
  characterId: number;
  correct: boolean;
}

export async function POST(request: NextRequest) {
  const { results } = (await request.json()) as { results: CharResult[] };

  for (const r of results) {
    // Record the review
    await prisma.characterReview.create({
      data: { characterId: r.characterId, correct: r.correct },
    });

    // Get current schedule
    const schedule = await prisma.reviewSchedule.findUnique({
      where: { characterId: r.characterId },
    });

    if (schedule) {
      const { interval, nextReview, mastered } = getNextReview(
        schedule.interval,
        r.correct,
      );

      if (mastered) {
        // Mark as mastered, remove schedule
        await prisma.character.update({
          where: { id: r.characterId },
          data: { status: "mastered" },
        });
        await prisma.reviewSchedule.delete({
          where: { characterId: r.characterId },
        });
      } else {
        await prisma.reviewSchedule.update({
          where: { characterId: r.characterId },
          data: { interval, nextReview },
        });
      }
    }
  }

  // Update daily checkin
  const today = new Date().toISOString().slice(0, 10);
  await prisma.dailyCheckin.upsert({
    where: { date: today },
    create: { date: today, chinese: true },
    update: { chinese: true },
  });

  const correctCount = results.filter((r) => r.correct).length;
  return NextResponse.json({
    total: results.length,
    correct: correctCount,
    wrong: results.length - correctCount,
  });
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/chinese/spaced-repetition.ts src/lib/chinese/spaced-repetition.test.ts src/app/api/chinese/today/ src/app/api/chinese/dictation/
git commit -m "feat: add spaced repetition engine and dictation/today APIs"
```

---

### Task 9: Chinese Dictation UI

**Files:**
- Create: `src/app/chinese/dictation/page.tsx`, `src/app/chinese/dictation/review/page.tsx`

- [ ] **Step 1: Create dictation page (TTS + step through)**

Write `src/app/chinese/dictation/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CharacterTask {
  id: number;
  char: string;
  pinyin: string;
}

export default function DictationPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterTask[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chinese/today")
      .then((r) => r.json())
      .then((data) => {
        setCharacters(data.characters);
        setLoading(false);
      });
  }, []);

  function speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  }

  function handleStart() {
    setStarted(true);
    if (characters.length > 0) {
      speak(characters[0].pinyin);
    }
  }

  function handleRepeat() {
    speak(characters[currentIndex].pinyin);
  }

  function handleNext() {
    if (currentIndex + 1 >= characters.length) {
      // All done — go to review
      sessionStorage.setItem("dictationChars", JSON.stringify(characters));
      router.push("/chinese/dictation/review");
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      speak(characters[nextIdx].pinyin);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
        <p className="text-2xl text-gray-500">加载中...</p>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 p-6">
        <p className="text-4xl mb-4">🎉</p>
        <p className="text-2xl text-gray-600 mb-8">今天没有需要复习的字！</p>
        <button
          onClick={() => router.push("/chinese")}
          className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white"
        >
          返回
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 p-6">
        <h1 className="text-3xl font-bold text-green-800 mb-4">今日听写</h1>
        <p className="text-xl text-gray-500 mb-2">共 {characters.length} 个字</p>
        <p className="text-lg text-gray-400 mb-8">准备好纸和笔，点击开始</p>
        <button
          onClick={handleStart}
          className="rounded-2xl bg-green-500 px-12 py-5 text-2xl font-bold text-white shadow-lg active:scale-95 transition-transform"
        >
          开始听写 🎧
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6 flex flex-col items-center justify-center">
      {/* Progress */}
      <div className="text-lg text-gray-500 mb-8">
        第 {currentIndex + 1} / {characters.length} 个
      </div>

      {/* Current character indicator (don't show the character!) */}
      <div className="text-8xl mb-12">🔊</div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleRepeat}
          className="rounded-2xl bg-blue-500 px-8 py-5 text-xl font-bold text-white shadow-lg active:scale-95 transition-transform"
        >
          再听一遍
        </button>
        <button
          onClick={handleNext}
          className="rounded-2xl bg-green-500 px-8 py-5 text-xl font-bold text-white shadow-lg active:scale-95 transition-transform"
        >
          {currentIndex + 1 >= characters.length ? "听写完毕 ✓" : "下一个 →"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mt-12">
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / characters.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create review page (show answers, mark correct/wrong)**

Write `src/app/chinese/dictation/review/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CharacterTask {
  id: number;
  char: string;
  pinyin: string;
}

export default function DictationReviewPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterTask[]>([]);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [summary, setSummary] = useState<{ total: number; correct: number; wrong: number } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("dictationChars");
    if (stored) {
      setCharacters(JSON.parse(stored));
    } else {
      router.push("/chinese/dictation");
    }
  }, [router]);

  function toggleResult(id: number) {
    setResults((prev) => {
      const next = { ...prev };
      if (next[id] === undefined) {
        next[id] = true; // first tap = correct
      } else if (next[id] === true) {
        next[id] = false; // second tap = wrong
      } else {
        delete next[id]; // third tap = unset
      }
      return next;
    });
  }

  async function handleSubmit() {
    // Check all characters are marked
    const unmarked = characters.filter((c) => results[c.id] === undefined);
    if (unmarked.length > 0) {
      alert(`还有 ${unmarked.length} 个字没有标记对错`);
      return;
    }

    const payload = characters.map((c) => ({
      characterId: c.id,
      correct: results[c.id],
    }));

    const res = await fetch("/api/chinese/dictation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: payload }),
    });
    const data = await res.json();
    setSummary(data);
    setSubmitted(true);
  }

  if (characters.length === 0) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6">
      <h1 className="text-3xl font-bold text-center text-green-800 mb-2">对照答案</h1>
      <p className="text-center text-gray-500 mb-8">
        点击每个字标记：<span className="text-green-600 font-bold">绿色=对</span>、
        <span className="text-red-500 font-bold">红色=错</span>
      </p>

      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-4 gap-3 mb-8">
          {characters.map((c) => {
            const status = results[c.id];
            return (
              <button
                key={c.id}
                onClick={() => !submitted && toggleResult(c.id)}
                className={`rounded-2xl p-4 text-center shadow transition-all ${
                  status === true
                    ? "bg-green-500 text-white"
                    : status === false
                      ? "bg-red-500 text-white"
                      : "bg-white text-gray-800"
                }`}
              >
                <div className="text-3xl font-bold">{c.char}</div>
                <div className="text-sm">{c.pinyin}</div>
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-green-500 py-4 text-xl font-bold text-white shadow active:scale-95 transition-transform"
          >
            提交结果
          </button>
        ) : summary ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 text-center shadow">
              <div className="text-2xl font-bold text-gray-800 mb-2">听写完成！</div>
              <div className="flex justify-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-green-600">{summary.correct}</div>
                  <div className="text-gray-400">答对</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-500">{summary.wrong}</div>
                  <div className="text-gray-400">答错</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/chinese")}
              className="w-full rounded-2xl bg-green-500 py-4 text-xl font-bold text-white shadow active:scale-95 transition-transform"
            >
              返回语文
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify dictation flow**

```bash
npm run dev
```

Full flow: `/chinese/dictation` → TTS plays → step through → review page → mark correct/wrong → submit.

- [ ] **Step 4: Commit**

```bash
git add src/app/chinese/dictation/
git commit -m "feat: add dictation flow with TTS and self-grading review"
```

---

### Task 10: Points & Achievement Engine

**Files:**
- Create: `src/lib/points/achievements.ts`, `src/lib/points/engine.ts`, `src/lib/points/engine.test.ts`, `src/app/api/points/route.ts`

- [ ] **Step 1: Define achievements**

Write `src/lib/points/achievements.ts`:

```typescript
export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  emoji: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "lightning_calc",
    name: "闪电口算",
    description: "小九九20题1分钟内完成",
    emoji: "⚡",
  },
  {
    key: "speed_master",
    name: "速算小能手",
    description: "刷新任意专项用时记录",
    emoji: "🏎️",
  },
  {
    key: "hundred_chars",
    name: "百字英雄",
    description: "累计掌握100个生字",
    emoji: "📚",
  },
  {
    key: "streak_7",
    name: "坚持之星·周",
    description: "连续打卡7天",
    emoji: "⭐",
  },
  {
    key: "streak_30",
    name: "坚持之星·月",
    description: "连续打卡30天",
    emoji: "🌟",
  },
  {
    key: "perfect_math",
    name: "零失误·数学",
    description: "单次数学练习全对",
    emoji: "🎯",
  },
  {
    key: "perfect_dictation",
    name: "零失误·听写",
    description: "单次听写全对",
    emoji: "✨",
  },
];
```

- [ ] **Step 2: Write failing tests for points engine**

Write `src/lib/points/engine.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { calculateMathPoints, calculateDictationPoints, calculateStreakBonus } from "./engine";

describe("calculateMathPoints", () => {
  it("gives base 10 points for any completed session", () => {
    expect(calculateMathPoints(15, 20, false).base).toBe(10);
  });

  it("gives +5 bonus for 100% accuracy", () => {
    const result = calculateMathPoints(20, 20, false);
    expect(result.accuracyBonus).toBe(5);
  });

  it("gives no accuracy bonus for < 100%", () => {
    const result = calculateMathPoints(19, 20, false);
    expect(result.accuracyBonus).toBe(0);
  });

  it("gives +5 for new personal best time", () => {
    const result = calculateMathPoints(20, 20, true);
    expect(result.speedBonus).toBe(5);
  });

  it("calculates correct total", () => {
    const result = calculateMathPoints(20, 20, true);
    expect(result.total).toBe(20); // 10 + 5 + 5
  });
});

describe("calculateDictationPoints", () => {
  it("gives base 10 points for completed dictation", () => {
    expect(calculateDictationPoints(8, 10).base).toBe(10);
  });

  it("gives +5 bonus for all correct", () => {
    const result = calculateDictationPoints(10, 10);
    expect(result.perfectBonus).toBe(5);
  });

  it("gives correct total", () => {
    const result = calculateDictationPoints(10, 10);
    expect(result.total).toBe(15);
  });
});

describe("calculateStreakBonus", () => {
  it("returns 0 for streak < 3", () => {
    expect(calculateStreakBonus(2)).toBe(0);
  });

  it("returns 5 for streak 3-6", () => {
    expect(calculateStreakBonus(3)).toBe(5);
    expect(calculateStreakBonus(6)).toBe(5);
  });

  it("returns 10 for streak 7-29", () => {
    expect(calculateStreakBonus(7)).toBe(10);
    expect(calculateStreakBonus(29)).toBe(10);
  });

  it("returns 30 for streak >= 30", () => {
    expect(calculateStreakBonus(30)).toBe(30);
    expect(calculateStreakBonus(100)).toBe(30);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/lib/points/engine.test.ts
```

- [ ] **Step 4: Implement points engine**

Write `src/lib/points/engine.ts`:

```typescript
interface MathPointsResult {
  base: number;
  accuracyBonus: number;
  speedBonus: number;
  total: number;
}

export function calculateMathPoints(
  correct: number,
  total: number,
  isNewBestTime: boolean,
): MathPointsResult {
  const base = 10;
  const accuracyBonus = correct === total ? 5 : 0;
  const speedBonus = isNewBestTime ? 5 : 0;
  return { base, accuracyBonus, speedBonus, total: base + accuracyBonus + speedBonus };
}

interface DictationPointsResult {
  base: number;
  perfectBonus: number;
  total: number;
}

export function calculateDictationPoints(
  correct: number,
  total: number,
): DictationPointsResult {
  const base = 10;
  const perfectBonus = correct === total ? 5 : 0;
  return { base, perfectBonus, total: base + perfectBonus };
}

export function calculateStreakBonus(streak: number): number {
  if (streak >= 30) return 30;
  if (streak >= 7) return 10;
  if (streak >= 3) return 5;
  return 0;
}

export function calculateCheckinPoints(streak: number): number {
  return 5 + calculateStreakBonus(streak);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/points/engine.test.ts
```

- [ ] **Step 6: Create points API**

Write `src/app/api/points/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/points/achievements";

export async function GET() {
  const logs = await prisma.pointsLog.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalPoints = logs.reduce((sum, l) => sum + l.points, 0);

  const unlockedAchievements = await prisma.achievement.findMany({
    orderBy: { unlockedAt: "desc" },
  });

  // Merge with definitions
  const achievements = ACHIEVEMENTS.map((def) => {
    const unlocked = unlockedAchievements.find((a) => a.key === def.key);
    return {
      ...def,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt || null,
    };
  });

  return NextResponse.json({ totalPoints, achievements, recentLogs: logs.slice(0, 20) });
}
```

- [ ] **Step 7: Integrate points into math session API**

Update `src/app/api/math/sessions/route.ts` — add at the end of the POST handler, before the return:

```typescript
// --- Points calculation ---
import { calculateMathPoints } from "@/lib/points/engine";
import { ACHIEVEMENTS } from "@/lib/points/achievements";

// Check if new personal best time (only if 100% correct)
let isNewBest = false;
if (correctCount === questions.length) {
  const previousBest = await prisma.mathSession.findFirst({
    where: {
      specialty,
      correctCount: { equals: prisma.raw(`"totalCount"`) },
      id: { not: session.id },
    },
    orderBy: { totalTime: "asc" },
  });
  isNewBest = !previousBest || totalTime < previousBest.totalTime;
}

const points = calculateMathPoints(correctCount, questions.length, isNewBest);
if (points.total > 0) {
  await prisma.pointsLog.create({
    data: { points: points.total, reason: `数学练习·${specialty}` },
  });
}

// Check achievements
if (correctCount === questions.length) {
  const existing = await prisma.achievement.findUnique({
    where: { key: "perfect_math" },
  });
  if (!existing) {
    await prisma.achievement.create({ data: { key: "perfect_math", name: "零失误·数学" } });
  }
}

if (specialty === "multiplication" && questions.length >= 20 && totalTime <= 60000 && correctCount === questions.length) {
  const existing = await prisma.achievement.findUnique({
    where: { key: "lightning_calc" },
  });
  if (!existing) {
    await prisma.achievement.create({ data: { key: "lightning_calc", name: "闪电口算" } });
  }
}
```

Note: This step requires refactoring the sessions route to import and use the points engine. The exact integration point is after the error book update logic and before the final `return NextResponse.json(...)`.

- [ ] **Step 8: Integrate points into dictation API**

Update `src/app/api/chinese/dictation/route.ts` — add at the end of the POST handler, before the return:

```typescript
import { calculateDictationPoints } from "@/lib/points/engine";

const points = calculateDictationPoints(correctCount, results.length);
if (points.total > 0) {
  await prisma.pointsLog.create({
    data: { points: points.total, reason: "语文听写" },
  });
}

// Check perfect dictation achievement
if (correctCount === results.length) {
  const existing = await prisma.achievement.findUnique({
    where: { key: "perfect_dictation" },
  });
  if (!existing) {
    await prisma.achievement.create({ data: { key: "perfect_dictation", name: "零失误·听写" } });
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/points/ src/app/api/points/ src/app/api/math/sessions/route.ts src/app/api/chinese/dictation/route.ts
git commit -m "feat: add points and achievement engine with API integration"
```

---

### Task 11: Data Dashboard

**Files:**
- Create: `src/app/api/dashboard/route.ts`, `src/app/dashboard/page.tsx`, `src/components/TrendChart.tsx`, `src/components/HeatmapCalendar.tsx`, `src/components/AchievementBadge.tsx`, `src/components/ProgressBar.tsx`

- [ ] **Step 1: Create dashboard data API**

Write `src/app/api/dashboard/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Math trends: last 20 sessions per specialty
  const mathSessions = await prisma.mathSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const mathBySpecialty: Record<string, { date: string; accuracy: number; timePerQuestion: number }[]> = {};
  for (const s of mathSessions) {
    if (!mathBySpecialty[s.specialty]) mathBySpecialty[s.specialty] = [];
    mathBySpecialty[s.specialty].push({
      date: s.createdAt.toISOString().slice(0, 10),
      accuracy: Math.round((s.correctCount / s.totalCount) * 100),
      timePerQuestion: Math.round(s.totalTime / s.totalCount / 1000),
    });
  }

  // Math best records per specialty
  const specialties = ["multiplication", "carrying", "two-digit"];
  const mathBests: Record<string, { bestTime: number | null; bestAccuracy: number }> = {};
  for (const sp of specialties) {
    const best = await prisma.mathSession.findFirst({
      where: { specialty: sp, correctCount: { equals: prisma.raw(`"totalCount"`) } },
      orderBy: { totalTime: "asc" },
    });
    const sessions = await prisma.mathSession.findMany({ where: { specialty: sp } });
    const maxAcc = sessions.length > 0
      ? Math.max(...sessions.map((s) => Math.round((s.correctCount / s.totalCount) * 100)))
      : 0;
    mathBests[sp] = { bestTime: best?.totalTime || null, bestAccuracy: maxAcc };
  }

  // Math error book
  const errorBook = await prisma.mathErrorBook.findMany({
    orderBy: { errorCount: "desc" },
    take: 20,
  });

  // Chinese character stats
  const activeNotebook = await prisma.notebook.findFirst({
    where: { isActive: true, archived: false },
  });

  let charStats = { unlearned: 0, learning: 0, mastered: 0 };
  let errorChars: { char: string; pinyin: string; errorCount: number }[] = [];

  if (activeNotebook) {
    const chars = await prisma.character.findMany({
      where: { notebookId: activeNotebook.id },
    });
    charStats = {
      unlearned: chars.filter((c) => c.status === "unlearned").length,
      learning: chars.filter((c) => c.status === "learning").length,
      mastered: chars.filter((c) => c.status === "mastered").length,
    };

    // Find error-prone characters (wrong >= 2 times)
    const reviews = await prisma.characterReview.findMany({
      where: {
        correct: false,
        character: { notebookId: activeNotebook.id },
      },
      include: { character: true },
    });

    const errorMap: Record<number, { char: string; pinyin: string; count: number }> = {};
    for (const r of reviews) {
      if (!errorMap[r.characterId]) {
        errorMap[r.characterId] = { char: r.character.char, pinyin: r.character.pinyin, count: 0 };
      }
      errorMap[r.characterId].count++;
    }

    errorChars = Object.values(errorMap)
      .filter((e) => e.count >= 2)
      .sort((a, b) => b.count - a.count)
      .map((e) => ({ char: e.char, pinyin: e.pinyin, errorCount: e.count }));
  }

  // Checkin data (last 90 days)
  const checkins = await prisma.dailyCheckin.findMany({
    orderBy: { date: "desc" },
    take: 90,
  });

  // Calculate streak
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const sortedDates = checkins
    .filter((c) => c.math && c.chinese)
    .map((c) => c.date)
    .sort()
    .reverse();

  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (sortedDates[i] === expected.toISOString().slice(0, 10)) {
      streak++;
    } else {
      break;
    }
  }

  // Points
  const totalPoints = (
    await prisma.pointsLog.aggregate({ _sum: { points: true } })
  )._sum.points || 0;

  // Achievements
  const achievements = await prisma.achievement.findMany({
    orderBy: { unlockedAt: "desc" },
  });

  return NextResponse.json({
    math: { bySpecialty: mathBySpecialty, bests: mathBests, errorBook },
    chinese: { charStats, errorChars },
    checkins: checkins.map((c) => ({ date: c.date, math: c.math, chinese: c.chinese })),
    streak,
    totalPoints,
    achievements,
  });
}
```

- [ ] **Step 2: Create TrendChart component**

Write `src/components/TrendChart.tsx`:

```tsx
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrendChartProps {
  data: { date: string; value: number }[];
  color: string;
  label: string;
  unit?: string;
}

export default function TrendChart({ data, color, label, unit = "" }: TrendChartProps) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-500 mb-2">{label}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={[...data].reverse()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: number) => `${v}${unit}`} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: Create HeatmapCalendar component**

Write `src/components/HeatmapCalendar.tsx`:

```tsx
"use client";

interface CheckinDay {
  date: string;
  math: boolean;
  chinese: boolean;
}

interface HeatmapCalendarProps {
  checkins: CheckinDay[];
}

export default function HeatmapCalendar({ checkins }: HeatmapCalendarProps) {
  const checkinMap = new Map(checkins.map((c) => [c.date, c]));

  // Generate last 90 days
  const days: { date: string; level: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const c = checkinMap.get(dateStr);
    let level = 0;
    if (c) {
      if (c.math && c.chinese) level = 3;
      else if (c.math || c.chinese) level = 1;
    }
    days.push({ date: dateStr, level });
  }

  const colors = ["bg-gray-100", "bg-green-200", "bg-green-300", "bg-green-500"];

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-500 mb-2">打卡日历（近90天）</h3>
      <div className="flex flex-wrap gap-1">
        {days.map((d) => (
          <div
            key={d.date}
            title={d.date}
            className={`h-4 w-4 rounded-sm ${colors[d.level]}`}
          />
        ))}
      </div>
      <div className="flex gap-2 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-gray-100" /> 未打卡</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-green-200" /> 部分</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-green-500" /> 全勤</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create AchievementBadge and ProgressBar**

Write `src/components/AchievementBadge.tsx`:

```tsx
interface AchievementBadgeProps {
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export default function AchievementBadge({ emoji, name, description, unlocked }: AchievementBadgeProps) {
  return (
    <div
      className={`rounded-xl p-3 text-center transition-all ${
        unlocked ? "bg-white shadow" : "bg-gray-100 opacity-40"
      }`}
    >
      <div className="text-3xl">{emoji}</div>
      <div className="text-sm font-bold text-gray-700 mt-1">{name}</div>
      <div className="text-xs text-gray-400">{description}</div>
    </div>
  );
}
```

Write `src/components/ProgressBar.tsx`:

```tsx
interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

export default function ProgressBar({ label, value, max, color }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400">{value}/{max}</span>
      </div>
      <div className="h-4 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create dashboard page**

Write `src/app/dashboard/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import TrendChart from "@/components/TrendChart";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import AchievementBadge from "@/components/AchievementBadge";
import ProgressBar from "@/components/ProgressBar";
import { ACHIEVEMENTS } from "@/lib/points/achievements";

interface DashboardData {
  math: {
    bySpecialty: Record<string, { date: string; accuracy: number; timePerQuestion: number }[]>;
    bests: Record<string, { bestTime: number | null; bestAccuracy: number }>;
    errorBook: { specialty: string; expression: string; answer: number; errorCount: number }[];
  };
  chinese: {
    charStats: { unlearned: number; learning: number; mastered: number };
    errorChars: { char: string; pinyin: string; errorCount: number }[];
  };
  checkins: { date: string; math: boolean; chinese: boolean }[];
  streak: number;
  totalPoints: number;
  achievements: { key: string; name: string; unlockedAt: string }[];
}

const SPECIALTY_NAMES: Record<string, string> = {
  multiplication: "小九九",
  carrying: "进位加减法",
  "two-digit": "两位数加减",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-400">加载中...</p>
      </div>
    );
  }

  const unlockedKeys = new Set(data.achievements.map((a) => a.key));
  const { charStats } = data.chinese;
  const totalChars = charStats.unlearned + charStats.learning + charStats.mastered;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 p-6">
      <h1 className="text-3xl font-bold text-center text-purple-800 mb-8">我的数据</h1>

      <div className="max-w-lg mx-auto space-y-8">
        {/* Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 text-center shadow">
            <div className="text-3xl font-bold text-purple-600">{data.totalPoints}</div>
            <div className="text-sm text-gray-400">总积分</div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow">
            <div className="text-3xl font-bold text-orange-500">{data.streak}</div>
            <div className="text-sm text-gray-400">连续打卡</div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow">
            <div className="text-3xl font-bold text-green-600">{charStats.mastered}</div>
            <div className="text-sm text-gray-400">已掌握字</div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="rounded-2xl bg-white p-4 shadow">
          <HeatmapCalendar checkins={data.checkins} />
        </div>

        {/* Math trends */}
        <div className="rounded-2xl bg-white p-4 shadow">
          <h2 className="text-xl font-bold text-gray-700 mb-4">📐 数学趋势</h2>
          {Object.entries(data.math.bySpecialty).map(([sp, sessions]) => (
            <div key={sp} className="mb-6">
              <h3 className="text-lg font-bold text-gray-600 mb-2">{SPECIALTY_NAMES[sp]}</h3>
              <TrendChart
                data={sessions.map((s) => ({ date: s.date, value: s.accuracy }))}
                color="#3b82f6"
                label="正确率"
                unit="%"
              />
              <TrendChart
                data={sessions.map((s) => ({ date: s.date, value: s.timePerQuestion }))}
                color="#f59e0b"
                label="每题用时"
                unit="秒"
              />
            </div>
          ))}
        </div>

        {/* Math error book */}
        {data.math.errorBook.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow">
            <h2 className="text-xl font-bold text-red-500 mb-4">📕 数学错题本</h2>
            <div className="space-y-2">
              {data.math.errorBook.map((e, i) => (
                <div key={i} className="flex justify-between items-center rounded-lg bg-red-50 p-3">
                  <span className="text-lg">{e.expression} = {e.answer}</span>
                  <span className="text-sm text-red-400">错{e.errorCount}次</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chinese progress */}
        {totalChars > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow">
            <h2 className="text-xl font-bold text-gray-700 mb-4">📖 语文进度</h2>
            <div className="space-y-3">
              <ProgressBar label="已掌握" value={charStats.mastered} max={totalChars} color="bg-green-500" />
              <ProgressBar label="学习中" value={charStats.learning} max={totalChars} color="bg-yellow-500" />
              <ProgressBar label="未学" value={charStats.unlearned} max={totalChars} color="bg-gray-400" />
            </div>
          </div>
        )}

        {/* Error-prone characters */}
        {data.chinese.errorChars.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow">
            <h2 className="text-xl font-bold text-red-500 mb-4">📕 易错字</h2>
            <div className="flex flex-wrap gap-2">
              {data.chinese.errorChars.map((c, i) => (
                <div key={i} className="rounded-xl bg-red-50 px-3 py-2 text-center">
                  <div className="text-xl font-bold">{c.char}</div>
                  <div className="text-xs text-gray-400">{c.pinyin} · 错{c.errorCount}次</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="rounded-2xl bg-white p-4 shadow">
          <h2 className="text-xl font-bold text-gray-700 mb-4">🏆 成就墙</h2>
          <div className="grid grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((a) => (
              <AchievementBadge
                key={a.key}
                emoji={a.emoji}
                name={a.name}
                description={a.description}
                unlocked={unlockedKeys.has(a.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify dashboard renders**

```bash
npm run dev
```

Visit `/dashboard` — should render all sections (empty data is fine at this point).

- [ ] **Step 7: Commit**

```bash
git add src/app/api/dashboard/ src/app/dashboard/ src/components/TrendChart.tsx src/components/HeatmapCalendar.tsx src/components/AchievementBadge.tsx src/components/ProgressBar.tsx
git commit -m "feat: add data dashboard with trends, heatmap, and achievements"
```

---

### Task 12: Home Page, Navigation & Polish

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/components/BottomNav.tsx`

- [ ] **Step 1: Create bottom navigation**

Write `src/components/BottomNav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "首页", emoji: "🏠" },
  { href: "/math", label: "数学", emoji: "📐" },
  { href: "/chinese", label: "语文", emoji: "📖" },
  { href: "/dashboard", label: "数据", emoji: "📊" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide nav during practice sessions
  if (pathname.includes("/practice") || pathname.includes("/dictation")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-1 ${
                active ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Update root layout**

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "BestMe - Fred的学习助手",
  description: "数学和语文学习应用",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="pb-20">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Update home page**

Update `src/app/page.tsx`:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100 p-6 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-indigo-800 mb-2">BestMe</h1>
      <p className="text-xl text-gray-500 mb-12">Fred 的学习助手</p>

      <div className="w-full max-w-md space-y-4">
        <Link
          href="/math"
          className="flex items-center gap-6 rounded-3xl bg-white p-8 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-6xl">📐</span>
          <div>
            <div className="text-2xl font-bold text-gray-800">数学练习</div>
            <div className="text-gray-400">小九九 · 进位加减 · 两位数</div>
          </div>
        </Link>

        <Link
          href="/chinese"
          className="flex items-center gap-6 rounded-3xl bg-white p-8 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-6xl">📖</span>
          <div>
            <div className="text-2xl font-bold text-gray-800">语文学习</div>
            <div className="text-gray-400">生字听写 · 间隔复习</div>
          </div>
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center gap-6 rounded-3xl bg-white p-8 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-6xl">📊</span>
          <div>
            <div className="text-2xl font-bold text-gray-800">我的数据</div>
            <div className="text-gray-400">积分 · 成就 · 学习趋势</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/components/BottomNav.tsx
git commit -m "feat: add home page, bottom nav, and iPad-friendly layout"
```

---

### Task 13: Daily Checkin Points Integration

**Files:**
- Modify: `src/app/api/math/sessions/route.ts`, `src/app/api/chinese/dictation/route.ts`

This task wires up the daily checkin + streak bonus points. Both APIs already update `DailyCheckin`; now we add points when both math AND chinese are done for the day.

- [ ] **Step 1: Create a shared checkin points helper**

Write `src/lib/points/checkin.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { calculateCheckinPoints } from "./engine";

export async function maybeAwardCheckinPoints(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  const checkin = await prisma.dailyCheckin.findUnique({
    where: { date: today },
  });

  if (!checkin || !checkin.math || !checkin.chinese) return 0;

  // Check if already awarded today
  const alreadyAwarded = await prisma.pointsLog.findFirst({
    where: {
      reason: "每日打卡",
      createdAt: { gte: new Date(today) },
    },
  });

  if (alreadyAwarded) return 0;

  // Calculate streak
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const c = await prisma.dailyCheckin.findUnique({ where: { date: dateStr } });
    if (c?.math && c?.chinese) {
      streak++;
    } else {
      break;
    }
  }

  const points = calculateCheckinPoints(streak);
  await prisma.pointsLog.create({
    data: { points, reason: "每日打卡" },
  });

  // Check streak achievements
  if (streak >= 7) {
    await prisma.achievement.upsert({
      where: { key: "streak_7" },
      create: { key: "streak_7", name: "坚持之星·周" },
      update: {},
    });
  }
  if (streak >= 30) {
    await prisma.achievement.upsert({
      where: { key: "streak_30" },
      create: { key: "streak_30", name: "坚持之星·月" },
      update: {},
    });
  }

  return points;
}
```

- [ ] **Step 2: Call checkin helper from both APIs**

Add to the end of both `src/app/api/math/sessions/route.ts` and `src/app/api/chinese/dictation/route.ts` POST handlers (before the return):

```typescript
import { maybeAwardCheckinPoints } from "@/lib/points/checkin";

await maybeAwardCheckinPoints();
```

- [ ] **Step 3: Check hundred_chars achievement in dictation API**

Add to `src/app/api/chinese/dictation/route.ts`:

```typescript
// Check hundred chars achievement
const activeNotebook = await prisma.notebook.findFirst({
  where: { isActive: true },
});
if (activeNotebook) {
  const masteredCount = await prisma.character.count({
    where: { notebookId: activeNotebook.id, status: "mastered" },
  });
  if (masteredCount >= 100) {
    await prisma.achievement.upsert({
      where: { key: "hundred_chars" },
      create: { key: "hundred_chars", name: "百字英雄" },
      update: {},
    });
  }
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/points/checkin.ts src/app/api/math/sessions/route.ts src/app/api/chinese/dictation/route.ts
git commit -m "feat: add daily checkin points and streak achievement tracking"
```

---

### Task 14: Final Integration Test & Network Access

- [ ] **Step 1: Start dev server bound to all interfaces**

Add to `package.json` scripts:

```json
"dev:lan": "next dev -H 0.0.0.0"
```

- [ ] **Step 2: Test full flow on local browser**

```bash
npm run dev:lan
```

Test the complete flow:
1. Home → Math → select specialty → set count → practice → result
2. Home → Chinese → notebooks → create → import characters → library → mark as learned
3. Chinese → dictation → TTS plays → step through → review → submit
4. Dashboard → verify all sections render

- [ ] **Step 3: Get Mac Mini IP and test on iPad**

```bash
ipconfig getifaddr en0
```

On iPad Safari, visit `http://<IP>:3000`. Verify:
- Touch targets are large enough
- Numeric keypad works well
- TTS plays correctly
- Navigation is intuitive

- [ ] **Step 4: Final commit**

```bash
git add package.json
git commit -m "feat: add LAN dev script for iPad access"
```
