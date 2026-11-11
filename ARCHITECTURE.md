# Architecture & Agent Guide

> **Target Audience**: AI Agents and Developers.
> **Mission**: Deliver instant structural understanding in minimal tokens; locate exact files, API routes, state models, and drill evaluation mechanisms without recursive codebase exploration.

---

## 1. System Summary & Tech Stack

- **Domain**: Micro-drill deliberate practice platform for Grade 5 Australian scholarship exams (ACER, Edutest, AAS).
- **Core Paradigm**: 5–15 min cognitive micro-drills targeting causal depth, argument precision, deductive logic, and sentence mechanics over full-length essays.
- **Framework**: Next.js 14.2 (App Router), React 18.3, TypeScript 5.6, Tailwind CSS 3.4.
- **Runtime Environment**: Client-side state in `localStorage` + Next.js Route Handlers (`app/api/`).
- **AI Infrastructure**: OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`) via [`callOpenRouter()`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts) with strict Zod parsing and deterministic fallback heuristics when `OPENROUTER_API_KEY` is unset.
- **Default AI Model**: `openai/gpt-6.1-sol` (configurable per profile in `localStorage`).

```
[Student / Parent UI] (app/page.tsx)
       │
       ├── State Management: lib/storage.ts (LocalStorage v3)
       │       ├── Profile & XP: "kiran_prep_student_profile_v3"
       │       ├── Writing Attempts: "kiran_prep_attempts_log_v3"
       │       ├── Logic Attempts: "kiran_prep_logic_attempts_v1"
       │       ├── Sentence Sprints: "kiran_prep_sprint_v1"
       │       └── Sentence Retraining: "kiran_prep_retraining_v1"
       │
       ├── Interactive Games: components/games/ (17 drill modules)
       │       ├── Deterministic (MCQ/classification): evaluated locally
       │       ├── Heuristic Fallbacks: built-in rule engines
       │       └── AI Evaluated: POST /api/evaluate
       │
       └── Analytics & Audit:
               ├── Parent Dashboard: components/parent/
               ├── Google Sheets Webhook: POST /api/sync-sheet
               └── Markdown Dossier: lib/export-audit.ts
```

---

## 2. Complete File Map

Every file in the codebase indexed by location, role, and key exports:

### `app/` (Application Shell & Routes)
| File | Role & Key Symbols |
|---|---|
| [app/layout.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/layout.tsx) | Root layout, metadata, global styles injection |
| [app/page.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/page.tsx) | Top-level view switcher: toggles between `StudentHome` and `ParentDashboard` |
| [app/globals.css](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/globals.css) | Tailwind base layers, animations, custom scrollbars |
| [app/api/evaluate/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/evaluate/route.ts) | Central AI evaluation handler. Dispatches 17 `exerciseType` switch branches to OpenRouter or offline heuristics |
| [app/api/sync-sheet/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/sync-sheet/route.ts) | Asynchronous webhook dispatcher forwarding attempt logs to Google Apps Script / Google Sheets |

### `components/games/` (17 Interactive Drills)
| Component | Exercise Type | Evaluation Strategy | Primary Role |
|---|---|---|---|
| [ClearAndComplete.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/ClearAndComplete.tsx) | `clear_and_complete`, `clear_and_complete_rewrite` | AI + Zod Rubric | 3-mode precision reasoning: Build Bridge, Say Clearly, Cut Waste |
| [SentenceRetraining.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/SentenceRetraining.tsx) | `sentence_retraining` | AI + Stage Validation | 4-stage Think-First-Write-Once immutable drafting & correction |
| [SentenceGym.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/SentenceGym.tsx) | `sentence_gym`, `generate_sentence_gym` | AI Rubric | Sentence-level structural agility & syntactic muscle building |
| [SentenceSprint.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/SentenceSprint.tsx) | `sentence_sprint` | AI + Heuristic | 5-level speed drafting with time targets and word-count guards |
| [LogicLab.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/LogicLab.tsx) | `logic_reasoning`, `generate_logic_question` | Deterministic MCQ + AI Gen | 13-category logic engine with metacognitive confidence rating |
| [ArgumentBuilder.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/ArgumentBuilder.tsx) | `argument_builder` | AI / Heuristic | Converts broad topics into specific, non-obvious causal claims |
| [CausalChain.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/CausalChain.tsx) | `causal_chain` | AI Rubric | Stepwise progression: Premise &rarr; Immediate &rarr; Further &rarr; Impact |
| [WhatHappensNext.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/WhatHappensNext.tsx) | `what_happens_next` | AI Rubric | Causal continuation without runaway speculative chains |
| [BuildTheParagraph.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/BuildTheParagraph.tsx) | `build_paragraph` | Multi-attribute AI | 5-function paragraph synthesis (Reason, Explain, Example, Impact, Link) |
| [ParagraphBuilder.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/ParagraphBuilder.tsx) | `paragraph_builder`, `paragraph_rewrite` | Line-by-line AI | Deep paragraph drafting with targeted line-by-line rewrite loop |
| [FixWeakLink.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/FixWeakLink.tsx) | `fix_weak_link` | Deterministic + AI | Diagnostic identification of broken/circular links + rewrite |
| [OneStepOnly.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/OneStepOnly.tsx) | `one_step_only` | Deterministic MCQ | Prevents leaping over logical steps; forces immediate next consequence |
| [RepeatVsAdd.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/RepeatVsAdd.tsx) | `repeat_vs_add` | Deterministic Binary | Discriminates semantic echo (repetition) from argument addition |
| [ExampleEngine.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/ExampleEngine.tsx) | `example_engine` | AI Rubric | Concrete observable evidence vs abstract circular summaries |
| [SentenceForge.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/SentenceForge.tsx) | `sentence_forge` | AI Rubric | Synthesizes clauses using logical conjunctions (whereas, because, despite) |
| [ThreeParagraphPlan.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/ThreeParagraphPlan.tsx) | `three_paragraph_plan` | AI Rubric | Rapid exam essay blueprinting across 3 distinct thinking lenses |
| [IdeaSprint.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/IdeaSprint.tsx) | `idea_sprint` | AI Rubric (0-6) | Rapid ideation producing independent, non-overlapping arguments |

### `components/student/` & `components/parent/` (Views & Dashboards)
| Component | Key Functions |
|---|---|
| [components/student/StudentHome.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/StudentHome.tsx) | Dashboard view: displays XP, streaks, level tiers, Daily Quest launcher, and full drill catalog |
| [components/student/DailyQuestSession.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/DailyQuestSession.tsx) | 3-stage curated daily workout dynamically selected based on student mastery gaps |
| [components/parent/ParentDashboard.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/ParentDashboard.tsx) | Parent analytics tab: writing mastery across 5 core metrics, model selector, webhook setup, dossier export |
| [components/parent/LogicDashboard.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/LogicDashboard.tsx) | Detailed 13-category logic breakdown, speed vs accuracy charts, and misconception alerts |
| [components/parent/SentenceReviewSection.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/SentenceReviewSection.tsx) | Sentence retraining analytics: first-draft pass rates, common grammatical/causal defects, retry success |

### `lib/` (Core Utilities & Domain Logic)
| Module | Key Functions / Types |
|---|---|
| [lib/storage.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/storage.ts) | LocalStorage CRUD: [`getProfile()`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/storage.ts#L65), [`logAttempt()`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/storage.ts#L182), [`logLogicAttempt()`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/storage.ts#L143), [`getRetrainingState()`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/storage.ts#L618), [`logRetrainingAttempt()`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/storage.ts#L716) |
| [lib/retraining-input-controller.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/retraining-input-controller.ts) | "Think First, Write Once" input locking engine: blocks backspace/paste/cursor moves, handles IME |
| [lib/logic-scoring.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/logic-scoring.ts) | [`computeLogicProfile()`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/logic-scoring.ts#L8): accuracy, calibration score, misconception risk detection, category prioritization |
| [lib/ai/openrouter.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts) | OpenRouter HTTP client, retry loops, Zod schemas for all drills, [`evaluateSentenceRetraining()`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts#L480) |
| [lib/export-audit.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/export-audit.ts) | Generates markdown audit dossiers for external LLM evaluation; syncs attempts to Google Drive webhook |
| [lib/sound-effects.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/sound-effects.ts) | Audio synthesis (Web Audio API) for success/fail sounds & confetti particle triggers |

### `lib/content/` (Seed Content Banks)
| Seed File | Content & Item Count |
|---|---|
| [seed-clear-and-complete.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/content/seed-clear-and-complete.ts) | 30+ precision reasoning prompts across Bridge, Say Clearly, Cut Waste modes |
| [seed-sentence-retraining.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/content/seed-sentence-retraining.ts) | 30 curated prompts targeting 10 grammatical and causal sentence defects |
| [seed-sentence-gym.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/content/seed-sentence-gym.ts) | Syntactic workouts: clause fronting, concessive pivots, active verbs |
| [seed-sentence-sprint.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/content/seed-sentence-sprint.ts) | 5-level tiered speed writing prompts with strict sentence & time caps |
| [seed-logic.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/content/seed-logic.ts) | 13-category logic question bank (Easy, Medium, Hard) with error feedback |
| [seed-drills.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/content/seed-drills.ts) | Arguments, causal chains, weak links, and paragraph building prompts |
| [seed-topics.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/content/seed-topics.ts) | 15 essay domains (environment, technology, rules & freedom, animals, etc.) |

### `types/` & `scripts/` (Type Contracts & Verification)
| File | Role |
|---|---|
| [types/index.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/types/index.ts) | Unified TypeScript types: `SkillId`, `ExerciseType`, `StudentProfile`, `AttemptLog`, `SentenceRetrainingPrompt`, `LogicQuestion` |
| [scripts/test-retraining.mjs](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/test-retraining.mjs) | 18 deterministic unit tests verifying sentence retraining, scoring hierarchy, input controller, and Zod schemas |
| [scripts/test-logic.mjs](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/test-logic.mjs) | Heuristic tests for logic scoring, novelty tracking, XP progression, and calibration anchors |
| [scripts/run-calibration.mjs](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/run-calibration.mjs) | 30-case benchmark runner verifying AI evaluation consistency |
| [scripts/calibration-results.json](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/calibration-results.json) | Reference baseline output of calibration suite (30/30 tests passed) |

---

## 3. Data Flow & State Lifecycle

### 3.1 LocalStorage Schema
All persistent student data lives in `localStorage` under versioned keys:

| Key | TypeScript Interface | Description |
|---|---|---|
| `kiran_prep_student_profile_v3` | [`StudentProfile`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/types/index.ts#L26) | XP, streak, levels, 5 core mastery scores (0–100), domain stats |
| `kiran_prep_attempts_log_v3` | [`AttemptLog[]`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/types/index.ts#L330) | History of all writing/reasoning drill attempts with scores & feedback |
| `kiran_prep_logic_attempts_v1` | [`LogicAttemptRecord[]`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/types/index.ts#L202) | Logic question attempts, answer choices, response time, perceived difficulty |
| `kiran_prep_sprint_v1` | `SentenceSprintState` | History and flagged sentences for speed sentence sprints |
| `kiran_prep_retraining_v1` | [`SentenceRetrainingState`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/types/index.ts#L712) | Defect frequencies, first-draft vs correction pass rates, exposure history |

### 3.2 Attempt Logging & External Sync Lifecycle
```
[User completes drill in Component]
       │
       ▼
[lib/storage.ts -> logAttempt() / logRetrainingAttempt()]
       │
       ├── 1. Updates LocalStorage synchronously (XP, mastery score, streak)
       ├── 2. Dispatches window custom event 'kiran_profile_updated'
       └── 3. If Google Sheet Webhook URL configured in profile:
                └── Calls POST /api/sync-sheet (background async fetch)
```

---

## 4. AI Evaluation Route Architecture (`/api/evaluate`)

The endpoint accepts `POST` with payload `{ exerciseType: string, payload: any, selectedModel?: string }`.

### Fallback Matrix
When `process.env.OPENROUTER_API_KEY` is not present:
- **Heuristic Evaluation**: Returns calibrated scoring based on keyword detection, causal connector counts, length bounds, and proposition anchoring.
- **Fail-Safe Integrity**: Prevents zero-score crashes; offline students receive immediate educational feedback.

### Key Evaluation Schemas ([lib/ai/openrouter.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts))
1. [`ClearAndCompleteSchema`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts#L380): Evaluates 5 dimensions (completeness, efficiency, clarity, control, precision) + assigns diagnoses (`CLEAR_COMPLETE`, `UNDEREXPLAINED`, `OVEREXPLAINED`, `UNNECESSARY_CAUSAL_EXTENSION`, etc.).
2. [`SentenceRetrainingSchema`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts#L450): 6 two-point sub-scores (0-2 each, total 10). Flags defects (`VAGUE_SUBJECT`, `MISSING_MECHANISM`, `AWKWARD_COLLOCATION`, etc.) and determines `firstDraftQualityPass` (&ge;80%) vs `highQualityFirstDraft` (&ge;90%).
3. [`ParagraphBuilderSchema`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts#L220): Line-by-line verification for `SAY`, `WHY`, `EXAMPLE`, `RESULT`, `LINK`.
4. [`IdeaSprintSchema`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts#L30): Enforces strict 0–6 scoring. Rejects 1-2 word topic labels with 0 points; requires distinct proposition claims.

---

## 5. Sentence Retraining Subsystem (`lib/retraining-input-controller.ts`)

Specialized drill addressing a core Grade 5 scholarship weakness: **premature typing and chaotic editing** instead of thinking first.

### 4-Stage Protocol
- **Stage A (Mental Prep)**: 10–15s countdown timer. Input is completely locked. Student must formulate the complete sentence mentally before writing.
- **Stage B (First Draft - Think First, Write Once)**:
  - Backspace, Delete, text selection replacement, Cut, Paste, and mouse repositioning are intercepted and blocked by [`handleFirstDraftKeyDown()`](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/retraining-input-controller.ts#L100).
  - Full support for IME composition events (accents, multi-key inputs).
  - Accessible mode toggle available in settings if standard editing is required.
- **Stage C (Diagnostic Feedback)**:
  - AI identifies exact problematic phrase and specific defect.
  - If draft failed, the model answer is hidden to prevent mindless copying.
- **Stage D (Targeted Repair)**:
  - If defect was detected, student rewrites specifically to fix that error.
  - Model answer revealed only after repair attempt.

### 10 Defect Types
`VAGUE_SUBJECT`, `VAGUE_VERB`, `AWKWARD_COLLOCATION`, `MISSING_MECHANISM`, `GRAMMATICAL_ERROR`, `REPETITION`, `UNNECESSARY_WORDS`, `SENTENCE_FRAGMENT`, `RUN_ON_SENTENCE`, `MEANING_CHANGED`.

---

## 6. Logic Diagnostic Engine (`lib/logic-scoring.ts`)

Evaluates 13 reasoning categories:
1. `ordering_sequencing`
2. `deductive_reasoning`
3. `conditional_logic` (If A then B, contrapositive, converses)
4. `necessary_sufficient`
5. `must_could_cannot`
6. `elimination_reasoning`
7. `truth_lie` (knights & knaves)
8. `constraint_satisfaction`
9. `pattern_recognition`
10. `number_logic`
11. `classification_odd_one`
12. `pigeonhole_guarantee`
13. `rule_testing_counterexample`

### Metacognitive Calibration
Before viewing choices, student rates perceived difficulty (`EASY`, `MEDIUM`, `HARD`).
- **Misconception Risk**: Flagged when perceived difficulty is "EASY" but answer is wrong. Highlights overconfidence on subtle trap questions.
- **Calibration Score**: Measures alignment between subjective confidence and objective correctness.

---

## 7. Developer & Agent Extension Recipes

### Recipe A: Adding a New Micro-Drill
1. **Types**: Add drill type string to `ExerciseType` in [types/index.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/types/index.ts). Define prompt and evaluation interfaces.
2. **Seed Content**: Create or append to a file in `lib/content/` (e.g. `seed-drills.ts`).
3. **AI Evaluation (if needed)**:
   - Define Zod schema in [lib/ai/openrouter.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts).
   - Add `case "your_drill_type":` in [app/api/evaluate/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/evaluate/route.ts) with prompt template and offline heuristic fallback.
4. **UI Component**: Build component in `components/games/YourDrill.tsx`. Call `logAttempt()` from `lib/storage.ts` on completion.
5. **Mounting**: Add to the drill grid in [components/student/StudentHome.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/StudentHome.tsx) and to [DailyQuestSession.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/DailyQuestSession.tsx) rotation.
6. **Tests**: Add unit test in `scripts/test-retraining.mjs` or `scripts/test-logic.mjs`.

### Recipe B: Modifying an AI Rubric
1. Locate schema in [lib/ai/openrouter.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts).
2. Locate system prompt and calibration examples in [app/api/evaluate/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/evaluate/route.ts).
3. Run `npm run test` and `node scripts/test-logic.mjs` to ensure deterministic guards and calibration anchors remain green.

---

## 8. Command Quick Reference

```bash
# Run deterministic test suite (retraining, schemas, controllers)
npm run test

# Run deterministic logic scoring & heuristic unit tests
node scripts/test-logic.mjs

# Run live OpenRouter AI calibration suite (requires OPENROUTER_API_KEY)
npm run test:live

# Start local Next.js dev server (http://localhost:3000)
npm run dev

# Production build check
npm run build
```
