# Scholarship Writing & Logic Lab

Deliberate micro-drill web application designed for a Grade 5 Australian student preparing for competitive private school scholarship examinations (such as ACER, Edutest, AAS).

Replaces passive full-length essay writing and generic test papers with targeted 5–15 minute micro-drills evaluating core cognitive skills in writing and deductive logic reasoning.

---

## Architecture Overview

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS.
- **AI Evaluation**: Server-side evaluation in [app/api/evaluate/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/evaluate/route.ts) via OpenRouter ([lib/ai/openrouter.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts)). Validated by strict Zod schemas. Default model: `openai/gpt-6.1-sol` (configurable per profile).
- **Offline / Deterministic Fallback**: All drills operate with offline heuristic grading and pre-authored seed questions when no API key is configured.
- **Client Storage**: LocalStorage persistence via [lib/storage.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/storage.ts) (`PROFILE_KEY`, `ATTEMPTS_KEY`, `LOGIC_ATTEMPTS_KEY`).
- **External Audit / Sync**:
  - Markdown audit dossier export for LLM evaluation ([lib/export-audit.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/export-audit.ts)).
  - Real-time attempt webhook dispatch via Google Apps Script integration ([app/api/sync-sheet/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/sync-sheet/route.ts)).
- **Calibration & Test Automation**:
  - Educational heuristics and seed bank verification in [scripts/test-logic.mjs](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/test-logic.mjs).
  - 30-case benchmark calibration suite in [scripts/run-calibration.mjs](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/run-calibration.mjs) verifying evaluator diagnosis precision ([scripts/calibration-results.json](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/calibration-results.json)).

---

## Directory Structure

```text
├── app/
│   ├── api/
│   │   ├── evaluate/route.ts    # AI prompt evaluation endpoints for each drill type
│   │   └── sync-sheet/route.ts  # Webhook forwarder for Google Sheets attempt logging
│   ├── globals.css              # Global styles & Tailwind layers
│   ├── layout.tsx               # Root HTML layout & fonts
│   └── page.tsx                 # View switcher (Student Practice Lab vs Parent Analytics)
├── components/
│   ├── games/                   # Interactive drill components (writing, logic, precision reasoning)
│   ├── parent/                  # Parent dashboard & analytics (writing mastery + logic diagnostic)
│   └── student/                 # Student home & daily quest runner
├── lib/
│   ├── ai/
│   │   └── openrouter.ts        # OpenRouter client & Zod response validation schemas
│   ├── content/
│   │   ├── seed-clear-and-complete.ts # 3-mode precision reasoning prompts (Bridge, Say Clearly, Cut Waste)
│   │   ├── seed-drills.ts       # Pre-authored drill prompts (arguments, chains, weak links, etc.)
│   │   ├── seed-logic.ts        # 13-category logic question bank & metadata
│   │   └── seed-topics.ts       # Multi-domain writing essay topics
│   ├── export-audit.ts          # Dossier generator for external AI auditing & file downloads
│   ├── logic-scoring.ts         # Diagnostic profile computation & category selection logic
│   ├── sound-effects.ts         # Audio feedback & confetti triggers
│   └── storage.ts               # LocalStorage management, attempt logging, and profile metrics
├── scripts/
│   ├── calibration-results.json # Verified 30/30 (100%) diagnosis benchmark results
│   ├── run-calibration.mjs      # Test runner evaluating AI rubric against edge cases
│   └── test-logic.mjs           # Unit tests for scoring heuristics & seed banks
├── supabase/
│   └── schema.sql               # Optional PostgreSQL schema for remote database sync
└── types/
    └── index.ts                 # TypeScript type definitions for all drills, attempts, and profiles
```

---

## Core Drills & Modules

### 1. Writing & Precision Micro-Drills (`components/games/`)

| Component | Drill Name | Target Skill | Evaluation Mechanism |
|---|---|---|---|
| `ClearAndComplete.tsx` | Clear & Complete | Precision reasoning: bridging gaps, concise claims, pruning fluff without runaway causal extension | Zod multi-attribute rubric (5 dimensions + 10 diagnostic categories) |
| `ArgumentBuilder.tsx` | Category &rarr; Argument | Converting generic themes into actionable causal claims | LLM rubric (0–3 scale) / heuristic |
| `CausalChain.tsx` | Causal Chain (What Happens Next) | *Point &rarr; Immediate &rarr; Further Consequence &rarr; Significance* | LLM advancement & proportionality check |
| `BuildTheParagraph.tsx` | Build The Paragraph | Synthesizes Reason, Explanation, Example, Consequence, Link | Multi-attribute functional scoring |
| `FixWeakLink.tsx` | Fix Weak Link | Spotting and repairing broken or circular reasoning links | Multiple-choice + rewrite evaluation |
| `OneStepOnly.tsx` | One Step Only | Avoiding skipped causal steps; identifying the immediate next step | Deterministic multiple choice |
| `ExampleEngine.tsx` | Example Engine | Real-world, concrete observable examples vs circular summaries | LLM failure mode detection |
| `RepeatVsAdd.tsx` | Repeat vs Add | Identifying semantic echo/paraphrase vs genuine progression | Instant deterministic classification |
| `SentenceForge.tsx` | Sentence Forge | Synthesizing short sentences with logical conjunctions | LLM conjunction & syntax validation |
| `ThreeParagraphPlan.tsx` | 3-Paragraph Plan | Rapid exam blueprinting under timed conditions | Lens diversity & claim clarity check |
| `ParagraphBuilder.tsx` | Paragraph Builder | Deep 5-function paragraph drafting and revision | Line-by-line function evaluation |

#### The Clear & Complete Reasoning Engine
Designed specifically to prevent the two major pitfalls of Grade 5 scholarship candidates:
1. **Under-explaining**: Leaping directly from premise to conclusion with missing mechanism (`UNDEREXPLAINED`, `MISSING_LOGICAL_STEP`).
2. **Over-explaining**: Continuing past proof into speculative runaway chains like "save money &rarr; less stress &rarr; happier &rarr; better marks" (`OVEREXPLAINED`, `UNNECESSARY_CAUSAL_EXTENSION`).

Operates across 3 task modalities:
- **Build the Bridge**: Point A and Conclusion C are given; student must supply the missing causal bridge B.
- **Say It Clearly**: Extract relevant facts and link them into one clear argument with zero fluff.
- **Cut the Waste**: Given bloated, runaway reasoning, prune the waste while keeping the causal proof intact.

### 2. Logic Reasoning (`components/games/LogicLab.tsx`)

- **Diagnostic & Targeted Modes**: Evaluates 13 reasoning sub-disciplines:
  - Sequencing, Deductive Reasoning, Conditional Logic (`If A then B`), Necessary vs Sufficient, Must/Could/Cannot, Elimination, Truth/Lie, Constraint Satisfaction, Pattern Recognition, Number Logic, Classification, Pigeonhole Guarantee, Rule Testing / Counterexample.
- **Metacognitive Calibration**: Students rate perceived difficulty (`EASY`, `MEDIUM`, `HARD`) before answering. The engine flags **Misconception Risks** (answered wrong while rating "Easy") to detect false confidence.
- **Scoring & Selection**: [lib/logic-scoring.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/logic-scoring.ts) calculates rolling accuracy, median response time, calibration scores, and prioritizes categories needing reinforcement.

### 3. Student & Parent Interfaces

- **Student Home** ([components/student/StudentHome.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/StudentHome.tsx)): Level progression, XP, streaks, recommended daily quest, and category-filtered practice menus.
- **Daily Quest** ([components/student/DailyQuestSession.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/DailyQuestSession.tsx)): 3-stage curated drill sequence dynamically balanced across argument building, causal mechanics, and paragraph synthesis.
- **Parent Dashboard** ([components/parent/ParentDashboard.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/ParentDashboard.tsx)):
  - Writing Mastery view across 5 primary scholarship metrics.
  - Logic Diagnostic tab ([components/parent/LogicDashboard.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/LogicDashboard.tsx)) showing strengths, weaknesses, and misconception alerts.
  - Configurable LLM evaluation model and Google Apps Script sync endpoint.
  - Markdown audit dossier export for second-opinion review.

---

## Developer Guide: Adding a New Module

To add a new drill or exercise type:

1. **Define Types** in [types/index.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/types/index.ts):
   - Add new `ExerciseType` and prompt/evaluation interfaces.
2. **Seed Content** in `lib/content/`:
   - Export initial seed prompts in [lib/content/seed-drills.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/content/seed-drills.ts) (or dedicated module bank like `seed-clear-and-complete.ts`) for offline play and variety.
3. **Add AI Evaluator (if LLM-evaluated)**:
   - In [lib/ai/openrouter.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts), define the Zod schema.
   - In [app/api/evaluate/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/evaluate/route.ts), add the switch case, system prompt rubric, calibration anchors, and fallback logic.
4. **Build Game Component** in `components/games/`:
   - Follow existing component patterns (`ClearAndComplete.tsx`, `ArgumentBuilder.tsx`, `OneStepOnly.tsx`).
   - Call `logAttempt()` from [lib/storage.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/storage.ts) on submission.
5. **Mount in UI**:
   - Register in [components/student/StudentHome.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/StudentHome.tsx) and [DailyQuestSession.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/DailyQuestSession.tsx) if part of the daily quest rotation.
6. **Calibration / Verification**:
   - Add test cases to `scripts/` to ensure deterministic scoring and LLM rubric stability.

---

## Development & Test Commands

```bash
# 1. Install dependencies
npm install

# 2. Local environment configuration
cp .env.example .env.local
# Set OPENROUTER_API_KEY in .env.local

# 3. Start local development server
npm run dev

# 4. Run educational logic unit tests
node scripts/test-logic.mjs

# 5. Run 30-case rubric calibration test
node scripts/run-calibration.mjs

# 6. Run production build check
npm run build
```
