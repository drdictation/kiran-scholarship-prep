# AI Agent Guidelines & Context Map

> **Primary Objective**: Minimum token overhead for AI agents navigating and modifying the Scholarship Lab codebase.

---

## 1. Quick Context
- **App**: Next.js 14 App Router, TypeScript, Tailwind CSS, LocalStorage v3 client persistence.
- **Domain**: Grade 5 scholarship exam prep (ACER/Edutest/AAS) — focus on causal progression, argument distinctness, deductive logic, and sentence mechanics.
- **Primary Architecture Guide**: See [ARCHITECTURE.md](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/ARCHITECTURE.md) for full system topology, data schemas, and file map.

---

## 2. File Routing Cheatsheet

| If you need to modify... | Go directly to... |
|---|---|
| **AI Rubrics & Prompts** | [app/api/evaluate/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/evaluate/route.ts) |
| **Zod Schemas & OpenRouter Client** | [lib/ai/openrouter.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/ai/openrouter.ts) |
| **Data Types & Interfaces** | [types/index.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/types/index.ts) |
| **LocalStorage & State** | [lib/storage.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/storage.ts) |
| **Input Locking / Think-First Controller** | [lib/retraining-input-controller.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/retraining-input-controller.ts) |
| **Interactive Games (17 Drills)** | [components/games/](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/games/) |
| **Student UI & Daily Quest** | [components/student/StudentHome.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/StudentHome.tsx) & [DailyQuestSession.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/student/DailyQuestSession.tsx) |
| **Parent Dashboards & Analytics** | [components/parent/ParentDashboard.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/ParentDashboard.tsx), [LogicDashboard.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/LogicDashboard.tsx), [SentenceReviewSection.tsx](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/components/parent/SentenceReviewSection.tsx) |
| **Seed Questions & Prompts** | [lib/content/](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/content/) (`seed-clear-and-complete.ts`, `seed-sentence-retraining.ts`, `seed-logic.ts`, etc.) |
| **Unit & Calibration Tests** | [scripts/test-retraining.mjs](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/test-retraining.mjs) & [scripts/test-logic.mjs](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/scripts/test-logic.mjs) |

---

## 3. Critical Rules for AI Agents

1. **Deterministic Fallbacks**: Every AI drill in [app/api/evaluate/route.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/app/api/evaluate/route.ts) MUST retain an offline heuristic path when `OPENROUTER_API_KEY` is not present.
2. **Never Fabricate Passing Grades on API Error**: If OpenRouter fails or schema validation fails, return `valid: false` with 0 XP. Never pretend an unverified attempt succeeded.
3. **Australian English Norms**: Australian spellings (`learnt`, `earnt`, `practise` (verb), `programme`, etc.) are valid and must never be penalized as grammatical errors.
4. **Sentence Retraining Immutability**: In `SentenceRetraining.tsx`, Stage B uses [lib/retraining-input-controller.ts](file:///Users/cbasnayake/Documents/Microsaas/Kiran%20Scholarship%20PREP/lib/retraining-input-controller.ts) to block backspace/delete/paste/cursor repositioning. Do not bypass this without maintaining the accessible mode toggle.
5. **LocalStorage Key Stability**: Keys are versioned (`kiran_prep_student_profile_v3`, `kiran_prep_attempts_log_v3`, `kiran_prep_logic_attempts_v1`, `kiran_prep_sprint_v1`, `kiran_prep_retraining_v1`). Do not change these strings without migration logic.
6. **Always Run Tests**: Always run `npm run test` and `node scripts/test-logic.mjs` before concluding any edit.

---

## 4. Test Commands
```bash
npm run test               # Retraining deterministic tests (18 tests)
node scripts/test-logic.mjs # Logic scoring heuristics & seed banks
npm run build              # Next.js production build check
```
