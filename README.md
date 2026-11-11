# Scholarship Writing & Logic Lab

Deliberate micro-drill web application designed for a Grade 5 Australian student preparing for competitive private school scholarship examinations (such as ACER, Edutest, AAS).

Replaces passive full-length essay writing and generic test papers with targeted 5–15 minute micro-drills evaluating core cognitive skills in writing, causal progression, deductive logic, and sentence-level mechanics.

> 🤖 **AI Agents & Contributors**: For a complete, token-optimized architecture specification, data schemas, and file map, read [ARCHITECTURE.md](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/ARCHITECTURE.md) and [AGENTS.md](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/AGENTS.md).

---

## Architecture Overview

- **Framework**: Next.js 14.2 (App Router) + React 18.3 + TypeScript + Tailwind CSS.
- **AI Evaluation**: Server-side evaluation in [app/api/evaluate/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/evaluate/route.ts) via OpenRouter ([lib/ai/openrouter.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts)). Validated by strict Zod schemas. Default model: `openai/gpt-6.1-sol` (configurable per profile).
- **Offline / Deterministic Fallback**: All drills operate with offline heuristic grading and pre-authored seed questions when no API key is configured.
- **Client Storage**: LocalStorage v3 persistence via [lib/storage.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/storage.ts) (`PROFILE_KEY`, `ATTEMPTS_KEY`, `LOGIC_ATTEMPTS_KEY`, `SPRINT_KEY`, `RETRAINING_KEY`).
- **External Audit / Sync**:
  - Markdown audit dossier export for LLM evaluation ([lib/export-audit.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/export-audit.ts)).
  - Real-time attempt webhook dispatch via Google Apps Script integration ([app/api/sync-sheet/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/sync-sheet/route.ts)).
- **Calibration & Test Automation**:
  - 18-case deterministic retraining test suite in [scripts/test-retraining.mjs](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/test-retraining.mjs) (`npm run test`).
  - Educational heuristics and seed bank verification in [scripts/test-logic.mjs](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/test-logic.mjs).
  - 30-case benchmark calibration suite in [scripts/run-calibration.mjs](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/run-calibration.mjs) verifying evaluator diagnosis precision ([scripts/calibration-results.json](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/calibration-results.json)).

---

## Directory Structure

```text
├── app/
│   ├── api/
│   │   ├── evaluate/route.ts            # Central AI evaluation & fallback endpoints (17 drill types)
│   │   └── sync-sheet/route.ts          # Webhook forwarder for Google Sheets attempt logging
│   ├── globals.css                      # Global styles & Tailwind layers
│   ├── layout.tsx                       # Root HTML layout & fonts
│   └── page.tsx                         # View switcher (Student Practice Lab vs Parent Analytics)
├── components/
│   ├── games/                           # 17 Interactive drill components
│   │   ├── ArgumentBuilder.tsx          # Topic -> specific causal claim
│   │   ├── BuildTheParagraph.tsx        # 5-part functional paragraph synthesis
│   │   ├── CausalChain.tsx              # Stepwise causal progression chain
│   │   ├── ClearAndComplete.tsx         # Bridge / Say Clearly / Cut Waste precision reasoning
│   │   ├── ExampleEngine.tsx            # Concrete observable evidence vs circular summary
│   │   ├── FixWeakLink.tsx              # Diagnostic detection & repair of broken causal links
│   │   ├── IdeaSprint.tsx               # Timed multi-argument ideation
│   │   ├── LogicLab.tsx                 # 13-category deductive logic reasoning engine
│   │   ├── OneStepOnly.tsx              # Immediate consequence selection (anti-leap)
│   │   ├── ParagraphBuilder.tsx         # Deep 5-function drafting with line-by-line rewrite
│   │   ├── RepeatVsAdd.tsx              # Binary classifier: semantic echo vs genuine addition
│   │   ├── SentenceForge.tsx            # Logical conjunction synthesis
│   │   ├── SentenceGym.tsx              # Syntactic agility & clause manipulation workouts
│   │   ├── SentenceRetraining.tsx       # 4-stage Think-First-Write-Once retraining drill
│   │   ├── SentenceSprint.tsx           # 5-level tiered speed sentence drafting
│   │   ├── ThreeParagraphPlan.tsx       # Timed 3-lens exam blueprinting
│   │   └── WhatHappensNext.tsx          # Causal continuation without runaway chains
│   ├── parent/                          # Parent dashboards & deep analytics
│   │   ├── LogicDashboard.tsx           # 13-category logic diagnostic breakdown & speed metrics
│   │   ├── ParentDashboard.tsx          # Writing mastery (5 core metrics), model settings, dossier export
│   │   └── SentenceReviewSection.tsx    # Sentence retraining pass rates, top defects & retry success
│   └── student/                         # Student portal
│       ├── DailyQuestSession.tsx        # 3-stage adaptive daily workout sequence
│       └── StudentHome.tsx              # Progression levels, XP, streaks, and drill catalog
├── lib/
│   ├── ai/
│   │   └── openrouter.ts                # OpenRouter client & Zod response validation schemas
│   ├── content/                         # Pre-authored seed question banks & prompts
│   │   ├── seed-clear-and-complete.ts   # 3-mode precision reasoning prompts
│   │   ├── seed-drills.ts               # Core drill prompts (arguments, chains, weak links)
│   │   ├── seed-logic.ts                # 13-category logic question bank & metadata
│   │   ├── seed-sentence-gym.ts         # Sentence gym syntactic challenge prompts
│   │   ├── seed-sentence-retraining.ts  # 30 curated prompts targeting 10 sentence defects
│   │   ├── seed-sentence-sprint.ts      # 5-level tiered speed writing prompts
│   │   └── seed-topics.ts               # 15 essay domains for ideation & planning
│   ├── export-audit.ts                  # Markdown audit dossier generator & Google Drive webhook sync
│   ├── logic-scoring.ts                 # Diagnostic profile computation & category selection logic
│   ├── retraining-input-controller.ts   # Think-First-Write-Once input locking & IME handling
│   ├── sound-effects.ts                 # Web Audio API sound synthesis & confetti triggers
│   └── storage.ts                       # LocalStorage CRUD, attempt logging, and profile metrics
├── scripts/
│   ├── calibration-results.json         # Reference baseline for AI rubric calibration
│   ├── run-calibration.mjs              # Test runner evaluating AI rubric against edge cases
│   ├── test-logic.mjs                   # Unit tests for scoring heuristics & seed banks
│   └── test-retraining.mjs              # 18 deterministic unit tests for sentence retraining
├── supabase/
│   └── schema.sql                       # Optional PostgreSQL schema for remote database sync
└── types/
    └── index.ts                         # Unified TypeScript type definitions
```

---

## Core Drills & Modules

### 1. Writing & Precision Micro-Drills (`components/games/`)

| Component | Drill Name | Target Skill | Evaluation Mechanism |
|---|---|---|---|
| [`ClearAndComplete.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/ClearAndComplete.tsx) | Clear & Complete | Precision reasoning: bridging gaps, concise claims, pruning fluff | Zod multi-attribute rubric (5 dimensions + 10 diagnostic categories) |
| [`SentenceRetraining.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/SentenceRetraining.tsx) | Sentence Retraining | Think-First-Write-Once mechanics; eliminates premature typing & chaotic editing | 4-stage pipeline + 6-dimension Zod score (0-10) + 10 defect types |
| [`SentenceGym.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/SentenceGym.tsx) | Sentence Gym | Syntactic agility: clause fronting, active verbs, concessive pivots | LLM rubric / heuristic validation |
| [`SentenceSprint.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/SentenceSprint.tsx) | Sentence Sprint | 5-level speed drafting with strict time targets & sentence counts | Multi-attribute scoring & speed tracking |
| [`ArgumentBuilder.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/ArgumentBuilder.tsx) | Category &rarr; Argument | Converting generic themes into actionable causal claims | LLM rubric (0–3 scale) / heuristic |
| [`CausalChain.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/CausalChain.tsx) | Causal Chain | *Point &rarr; Immediate &rarr; Further Consequence &rarr; Significance* | LLM advancement & proportionality check |
| [`WhatHappensNext.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/WhatHappensNext.tsx) | What Happens Next | Causal continuation without speculative runaway jumps | LLM advancement check |
| [`BuildTheParagraph.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/BuildTheParagraph.tsx) | Build The Paragraph | Synthesizes Reason, Explanation, Example, Consequence, Link | Multi-attribute functional scoring |
| [`ParagraphBuilder.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/ParagraphBuilder.tsx) | Paragraph Builder | Deep 5-function paragraph drafting and revision | Line-by-line function evaluation |
| [`FixWeakLink.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/FixWeakLink.tsx) | Fix Weak Link | Spotting and repairing broken or circular reasoning links | Multiple-choice + rewrite evaluation |
| [`OneStepOnly.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/OneStepOnly.tsx) | One Step Only | Avoiding skipped causal steps; identifying the immediate next step | Deterministic multiple choice |
| [`RepeatVsAdd.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/RepeatVsAdd.tsx) | Repeat vs Add | Identifying semantic echo/paraphrase vs genuine progression | Instant deterministic classification |
| [`ExampleEngine.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/ExampleEngine.tsx) | Example Engine | Real-world, concrete observable examples vs circular summaries | LLM failure mode detection |
| [`SentenceForge.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/SentenceForge.tsx) | Sentence Forge | Synthesizing short sentences with logical conjunctions | LLM conjunction & syntax validation |
| [`ThreeParagraphPlan.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/ThreeParagraphPlan.tsx) | 3-Paragraph Plan | Rapid exam blueprinting under timed conditions | Lens diversity & claim clarity check |
| [`IdeaSprint.tsx`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/IdeaSprint.tsx) | Idea Sprint | Rapid ideation producing independent, distinct arguments | Strict 0-6 score (0 for topic labels) |

---

### 2. Sentence Retraining Protocol (`components/games/SentenceRetraining.tsx`)

Designed specifically to eliminate erratic typing and chaotic backspacing in Grade 5 students:
1. **Stage A (Mental Prep)**: 10–15s mandatory lock timer. Student must mentally plan the sentence.
2. **Stage B (First Draft - Think First, Write Once)**: Backspace, delete, paste, text selection replacement, and cursor arrow keys are disabled via [lib/retraining-input-controller.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/retraining-input-controller.ts).
3. **Stage C (Diagnostic Feedback)**: Identifies problematic phrases and defects (`VAGUE_SUBJECT`, `MISSING_MECHANISM`, `AWKWARD_COLLOCATION`, etc.). Model answer is hidden if first draft failed.
4. **Stage D (Targeted Repair)**: If flawed, the student performs an isolated rewrite to fix the specific defect before the model answer is revealed.

---

### 3. Logic Reasoning (`components/games/LogicLab.tsx`)

- **13 Reasoning Categories**:
  - Sequencing, Deductive Reasoning, Conditional Logic (`If A then B`), Necessary vs Sufficient, Must/Could/Cannot, Elimination, Truth/Lie, Constraint Satisfaction, Pattern Recognition, Number Logic, Classification, Pigeonhole Guarantee, Rule Testing / Counterexample.
- **Metacognitive Calibration**: Students rate perceived difficulty (`EASY`, `MEDIUM`, `HARD`) before answering. The engine flags **Misconception Risks** (answered wrong while rating "Easy") to detect false confidence.
- **Scoring & Selection**: [lib/logic-scoring.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/logic-scoring.ts) calculates rolling accuracy, median response time, calibration scores, and prioritizes categories needing reinforcement.

---

### 4. Student & Parent Interfaces

- **Student Home** ([components/student/StudentHome.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/StudentHome.tsx)): Level progression, XP, streaks, recommended daily quest, and category-filtered practice menus.
- **Daily Quest** ([components/student/DailyQuestSession.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/DailyQuestSession.tsx)): 3-stage curated drill sequence dynamically balanced across argument building, causal mechanics, and paragraph synthesis.
- **Parent Dashboard** ([components/parent/ParentDashboard.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/ParentDashboard.tsx)):
  - Writing Mastery view across 5 primary scholarship metrics.
  - Logic Diagnostic tab ([components/parent/LogicDashboard.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/LogicDashboard.tsx)) showing strengths, weaknesses, and misconception alerts.
  - Sentence Review tab ([components/parent/SentenceReviewSection.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/SentenceReviewSection.tsx)) tracking first-draft quality pass rates, top defect patterns, and correction success.
  - Configurable LLM evaluation model and Google Apps Script sync endpoint.
  - Markdown audit dossier export for second-opinion review.

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

# 4. Run deterministic sentence retraining tests (18 tests)
npm run test

# 5. Run educational logic unit tests
node scripts/test-logic.mjs

# 6. Run live OpenRouter AI calibration suite (optional)
npm run test:live

# 7. Run production build check
npm run build
```
