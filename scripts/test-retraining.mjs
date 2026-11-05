// Automated test suite for Sentence Retraining Mode
// - Deterministic tests run by default (no external network required, CI-safe)
// - Live OpenRouter calibration tests run when --live flag or LIVE_AI_TESTS=1 is provided

import assert from "node:assert";
import fs from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Register path alias resolver for @/* and next/server in Node ESM
const loaderCode = `
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") {
    return nextResolve("next/server.js", context);
  }
  if (specifier === "@/types") {
    return {
      shortCircuit: true,
      url: "data:text/javascript,export const LogicCategory={};export const LogicAttemptRecord={};export const LogicDiagnosticProfile={};export const LogicCategoryStat={};export const PerceivedDifficulty={};export const LogicQuestion={};"
    };
  }
  if (specifier.startsWith("@/")) {
    const base = path.resolve(process.cwd(), specifier.slice(2));
    for (const ext of [".ts", ".tsx", "/index.ts", ".js", ""]) {
      if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) {
        return nextResolve(pathToFileURL(base + ext).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
`;
register(
  "data:text/javascript," + encodeURIComponent(loaderCode),
  pathToFileURL("./")
);

const {
  SentenceRetrainingSchema,
  buildSentenceRetrainingPrompts,
  computeRetrainingScoreAndVerdict,
  evaluateSentenceRetraining,
} = await import("../lib/ai/openrouter.ts");
const { SEED_SENTENCE_RETRAINING } = await import(
  "../lib/content/seed-sentence-retraining.ts"
);
const {
  classifyRetrainingAttemptProvenance,
  getRetrainingState,
  updateRetrainingMastery,
  logAttempt,
  getAttempts,
  getProfile,
  buildRetrainingSession,
  getGrammaticalPatternKey,
  checkRetrainingExposureBeforeSubmit,
  recordRetrainingExposure,
  getRetrainingAnalytics,
} = await import("../lib/storage.ts");
const {
  createFirstDraftInputState,
  handleFirstDraftKeyDown,
  handleCompositionStart,
  handleCompositionUpdate,
  handleCompositionEnd,
  applyFirstDraftChange,
  getEnforcedCursorPosition,
  lockFirstDraftState,
  computeRetrainingTimingMetrics,
  classifyFirstDraftQualityBand,
} = await import("../lib/retraining-input-controller.ts");
const { POST } = await import("../app/api/evaluate/route.ts");
const { NextRequest } = await import("next/server.js");

// Simple in-memory localStorage mock for deterministic client/storage tests
function installMockLocalStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  globalThis.window = globalThis;
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  return store;
}

async function callEvaluateRoute(payload) {
  const req = new NextRequest("http://localhost:3000/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      exerciseType: "sentence_retraining",
      payload,
    }),
  });
  const res = await POST(req);
  const body = await res.json();
  return { status: res.status, ok: res.ok, body };
}

/* ============================================================================
   PART 1: DETERMINISTIC UNIT & REGRESSION TESTS (CI-Safe, Zero Network Calls)
   ============================================================================ */
async function runDeterministicTests() {
  console.log("=== PART 1: Deterministic Sentence Retraining Tests ===\n");
  let passedCount = 0;

  // 1. Schema validation: nullable optional fields
  {
    const rawWithNulls = {
      valid: true,
      score: 10,
      passed: true,
      clarity: 2,
      naturalness: 2,
      precision: 2,
      causalCompleteness: 2,
      compliance: 2,
      defect: null,
      problematicPhrase: null,
      feedback: "Clear and specific. You explain how community gardens can save families money.",
      structuralDifference: null,
      prohibitedOpening: null,
      xpAwarded: 20,
    };
    const parsed = SentenceRetrainingSchema.parse(rawWithNulls);
    assert.strictEqual(parsed.defect, undefined, "null defect must normalize to undefined");
    assert.strictEqual(parsed.problematicPhrase, undefined, "null problematicPhrase must normalize to undefined");
    assert.strictEqual(parsed.prohibitedOpening, undefined, "null prohibitedOpening must normalize to undefined");
    console.log("✓ [D1] Schema accepts null optional fields without throwing");
    passedCount++;
  }

  // 2. Schema validation: rejects malformed/missing dimensions
  {
    assert.throws(
      () =>
        SentenceRetrainingSchema.parse({
          valid: true,
          clarity: 3, // out of range
          naturalness: 2,
          precision: 2,
          causalCompleteness: 2,
          compliance: 2,
          feedback: "Test",
        }),
      { name: "ZodError" },
      "Out-of-range dimension must fail schema validation"
    );
    assert.throws(
      () =>
        SentenceRetrainingSchema.parse({
          valid: true,
          score: 10,
          passed: true,
          feedback: "Missing dimensions",
        }),
      { name: "ZodError" },
      "Missing dimensions must fail schema validation"
    );
    console.log("✓ [D2] Schema rejects missing or out-of-bounds dimension scores");
    passedCount++;
  }

  // 3. Server-side score calculation overrides inconsistent LLM total
  {
    const parsed = SentenceRetrainingSchema.parse({
      clarity: 1,
      naturalness: 1,
      precision: 1,
      causalCompleteness: 1,
      compliance: 2,
      score: 10, // inconsistent LLM total
      passed: true, // inconsistent LLM passed flag
      defect: "UNNECESSARY_WORDS",
      problematicPhrase: "due to the fact that",
      feedback: "Replace 'due to the fact that' with 'because'.",
    });
    const verdict = computeRetrainingScoreAndVerdict(parsed, {
      drillType: "independent",
      studentText: "Suburban shopping strips should replace parking due to the fact that it can make people healthier.",
    });
    assert.strictEqual(verdict.score, 6, "Server must compute 1+1+1+1+2 = 6, ignoring LLM score=10");
    assert.strictEqual(verdict.passed, false, "Score 6 must not pass");
    console.log("✓ [D3] Server-side score calculation overrides inconsistent LLM total");
    passedCount++;
  }

  // 4. Safeguard: Serious clarity or grammar failure cannot receive 9-10/10 or pass
  {
    const parsed = SentenceRetrainingSchema.parse({
      clarity: 2,
      naturalness: 0, // serious grammar failure
      precision: 2,
      causalCompleteness: 2,
      compliance: 2,
      defect: "RUN_ON_SENTENCE",
      feedback: "Join the two clauses with 'Although'.",
    });
    const verdict = computeRetrainingScoreAndVerdict(parsed, {
      drillType: "rebuild",
      studentText: "Electric buses make city air cleaner, they cost more.",
    });
    assert(verdict.score <= 6, "Serious grammar failure must be capped <= 6");
    assert.strictEqual(verdict.passed, false, "Serious grammar failure must not pass");
    console.log("✓ [D4] Serious clarity/grammar failure (0) capped at <= 6/10 and fails");
    passedCount++;
  }

  // 5. Safeguard: Minor grammatical error in an otherwise strong sentence gets proportionate deduction (8/10, not automatic failure, never 9-10/10)
  {
    const parsed = SentenceRetrainingSchema.parse({
      clarity: 2,
      naturalness: 1, // minor agreement slip
      precision: 2,
      causalCompleteness: 2,
      compliance: 2,
      defect: "GRAMMATICAL_ERROR",
      problematicPhrase: "Replacing central car parks with public parks give",
      feedback: "Use 'gives', not 'give'. Better: 'Replacing central car parks with public parks gives residents green space to exercise.'",
    });
    const verdict = computeRetrainingScoreAndVerdict(parsed, {
      drillType: "rebuild",
      studentText: "Replacing central car parks with public parks give residents green space to exercise and meet neighbours.",
    });
    assert.strictEqual(verdict.score, 8, "Minor grammar error in strong sentence should receive 8/10 proportionate deduction");
    assert(verdict.score < 9, "Grammar error must never receive 9-10/10");
    assert.strictEqual(verdict.passed, true, "Proportionate deduction on minor slip should not auto-fail an otherwise strong sentence");
    assert.strictEqual(verdict.defect, "GRAMMATICAL_ERROR");
    console.log("✓ [D5] Minor grammatical error in strong sentence receives proportionate deduction (8/10)");
    passedCount++;
  }

  // 6. Safeguard: Missing causal mechanism cannot receive full marks
  {
    const parsedZero = SentenceRetrainingSchema.parse({
      clarity: 2,
      naturalness: 2,
      precision: 1,
      causalCompleteness: 0,
      compliance: 2,
      defect: "MISSING_MECHANISM",
      feedback: "Explain how free transport reduces pollution.",
    });
    const verdictZero = computeRetrainingScoreAndVerdict(parsedZero, {
      drillType: "independent",
      studentText: "Public transport should be free because it stops global warming.",
    });
    assert(verdictZero.score <= 6 && !verdictZero.passed, "Zero causalCompleteness must fail (<=6)");

    const parsedPartial = SentenceRetrainingSchema.parse({
      clarity: 2,
      naturalness: 2,
      precision: 2,
      causalCompleteness: 1,
      compliance: 2,
      defect: "MISSING_MECHANISM",
      feedback: "Explain the intermediate step.",
    });
    const verdictPartial = computeRetrainingScoreAndVerdict(parsedPartial, {
      drillType: "independent",
      studentText: "Wider footpaths encourage residents to walk to local cafes.",
    });
    assert(verdictPartial.score <= 8, "Incomplete mechanism cannot receive 9-10/10");
    console.log("✓ [D6] Missing/incomplete causal mechanism safeguards enforced");
    passedCount++;
  }

  // 7. Safeguard: Valid short sentence (<15 words) is NOT penalised or marked SENTENCE_FRAGMENT
  {
    const parsedShort = SentenceRetrainingSchema.parse({
      clarity: 2,
      naturalness: 2,
      precision: 2,
      causalCompleteness: 2,
      compliance: 2,
      defect: null,
      feedback: "Clear and concise explanation.",
    });
    const verdictShort = computeRetrainingScoreAndVerdict(parsedShort, {
      drillType: "constrained",
      constraint: "precise_action_verb",
      studentText: "Flashing solar speed signs warn motorists, prompting drivers to brake early.",
    });
    assert.strictEqual(verdictShort.score, 10, "Concise 11-word sentence must be able to earn 10/10");
    assert.strictEqual(verdictShort.passed, true);
    assert.strictEqual(verdictShort.defect, undefined);
    console.log("✓ [D7] Valid short sentence (11 words) receives 10/10 without word-count penalty");
    passedCount++;
  }

  // 8. Drill-specific prompt & pre-checks: Example D conditional sentence is NOT forced to MISSING_MECHANISM
  {
    const exampleDInput = {
      drillType: "constrained",
      notes: [
        "Suburbs convert neglected vacant lots into shared veggie gardens",
        "Neighbours weed, water, and harvest produce together",
        "Family grocery bills fall while community friendship grows",
      ],
      constraint: "causal_conjunction",
      constraintDescription: "Clearly connect the cause and effect (for example, using 'because', 'by', 'so', 'when', or 'if').",
      studentText:
        "If suburbs convert neglected vacant lots into shared veggie gardens and neighbours weed, water, and harvest produce together, family grocery bills fall while community friendship grows.",
    };
    const { systemPrompt } = buildSentenceRetrainingPrompts(exampleDInput);
    assert(
      systemPrompt.includes("ACCEPT valid alternative constructions"),
      "Constrained prompt must instruct evaluator to accept valid alternative causal constructions"
    );
    const parsedD = SentenceRetrainingSchema.parse({
      clarity: 2,
      naturalness: 2,
      precision: 2,
      causalCompleteness: 2,
      compliance: 2,
      defect: null,
      feedback: "Clear conditional sentence connecting shared gardening to lower grocery bills.",
    });
    const verdictD = computeRetrainingScoreAndVerdict(parsedD, exampleDInput);
    assert.strictEqual(verdictD.passed, true);
    assert.notStrictEqual(verdictD.defect, "MISSING_MECHANISM");
    console.log("✓ [D8] Conditional causal sentence (Example D) is not forced to MISSING_MECHANISM");
    passedCount++;
  }

  // 9. Drill-specific prompt: targetSkillOrError is included in Rebuild prompt
  {
    const { systemPrompt } = buildSentenceRetrainingPrompts({
      drillType: "rebuild",
      targetSkillOrError: "AWKWARD_COLLOCATION",
      originalSentence: "Solar panels block shade and make electricity spew less money.",
      context: "Installing rooftop solar panels on primary schools.",
      studentText: "Rooftop solar panels convert sunlight into electricity, lowering school power bills.",
    });
    assert(
      systemPrompt.includes("AWKWARD_COLLOCATION"),
      "Rebuild prompt must include targetSkillOrError"
    );
    console.log("✓ [D9] Rebuild prompt includes targetSkillOrError");
    passedCount++;
  }

  // 10. Seed exercise audit: no arbitrary word_count_15_25 constraint remains
  {
    const wordCountExercises = SEED_SENTENCE_RETRAINING.filter(
      (item) => item.constraint === "word_count_15_25"
    );
    assert.strictEqual(
      wordCountExercises.length,
      0,
      "Seed exercises must not enforce arbitrary 15-25 word minimum counts"
    );
    console.log("✓ [D10] Seed exercises audited: 0 arbitrary minimum word-count constraints");
    passedCount++;
  }

  // 11. Test 12 (Deterministic): API failure must not award XP, update mastery, or record attempt
  {
    installMockLocalStorage();
    const initialProfile = getProfile();
    const initialState = getRetrainingState();
    const initialAttempts = getAttempts();

    let callCount = 0;
    const failingCaller = async () => {
      callCount++;
      throw new Error("OPENROUTER_HTTP_503: Service Unavailable");
    };

    await assert.rejects(
      () =>
        evaluateSentenceRetraining(
          {
            drillType: "independent",
            proposition: "Test proposition",
            studentText: "Children should be only paid an allowance when they do chores.",
          },
          failingCaller
        ),
      /OPENROUTER_HTTP_503/
    );
    assert.strictEqual(callCount, 2, "Transient API failure should retry once (2 calls total)");

    // Also test route response when API key is missing
    const prevKey = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      const routeRes = await callEvaluateRoute({
        drillType: "independent",
        proposition: "Test proposition",
        studentText: "Children should be only paid an allowance by parents when they complete household chores.",
      });
      assert.strictEqual(routeRes.status, 503);
      assert.strictEqual(routeRes.body.valid, false);
      assert.strictEqual(routeRes.body.xpAwarded, 0);
      assert.strictEqual(routeRes.body.score, undefined);
    } finally {
      if (prevKey !== undefined) process.env.OPENROUTER_API_KEY = prevKey;
    }

    assert.strictEqual(getProfile().totalXp, initialProfile.totalXp, "XP must not change on API failure");
    assert.strictEqual(
      getRetrainingState().firstAttemptCount,
      initialState.firstAttemptCount,
      "Mastery counts must not change on API failure"
    );
    assert.strictEqual(getAttempts().length, initialAttempts.length, "Attempts log must not change on API failure");
    console.log("✓ [D11] API failure returns valid=false, awards 0 XP, and leaves mastery & logs untouched");
    passedCount++;
  }

  // 12. Test 13 (Deterministic): Schema validation failure must not award XP or update mastery
  {
    installMockLocalStorage();
    let callCount = 0;
    const malformedCaller = async () => {
      callCount++;
      // Returns invalid JSON structure missing required 0-2 dimensions
      return { valid: true, score: 10, passed: true, feedback: "Great job!" };
    };

    await assert.rejects(
      () =>
        evaluateSentenceRetraining(
          {
            drillType: "independent",
            proposition: "Test proposition",
            studentText: "Replacing central car parks with public parks help people become healthier.",
          },
          malformedCaller
        ),
      { name: "ZodError" }
    );
    assert.strictEqual(callCount, 2, "Schema validation failure retries once (2 attempts total) then rejects");
    assert.strictEqual(getProfile().totalXp, 0);
    assert.strictEqual(getRetrainingState().firstAttemptCount, 0);
    assert.strictEqual(getAttempts().length, 0);
    console.log("✓ [D12] Schema validation failure rejects after 1 retry without fabricating grades or awarding XP");
    passedCount++;
  }

  // 13. Priority 7: Historical score provenance & mastery reliability flags
  {
    // Simulate pre-v2 localStorage with legacy fallback attempts and pre-v2 mastery state
    const legacyAttemptA = {
      id: "att-legacy-1",
      timestamp: Date.now() - 86400000,
      exerciseType: "sentence_retraining",
      score: 100,
      xpEarned: 20,
      durationSeconds: 30,
      feedback: "Strong, clear sentence with complete causal explanation.",
      input: "Children should be only paid an allowance by parents when they complete household chores because it can make them fitter, and want to work more.",
      details: { drillType: "independent", passed: true },
    };
    const legacyAttemptD = {
      id: "att-legacy-2",
      timestamp: Date.now() - 80000000,
      exerciseType: "sentence_retraining",
      score: 60,
      xpEarned: 2,
      durationSeconds: 40,
      feedback: "Constraint broken: use 'because', 'by', or 'so' to explain the mechanism.",
      input: "If suburbs convert neglected vacant lots into shared veggie gardens...",
      details: { drillType: "constrained", passed: false, defect: "MISSING_MECHANISM" },
    };
    const verifiedAttempt = {
      id: "att-v2-1",
      timestamp: Date.now(),
      exerciseType: "sentence_retraining",
      score: 90,
      xpEarned: 20,
      durationSeconds: 25,
      feedback: "Clear and specific. You explain how community gardens can save families money.",
      input: "Community gardens provide vegetables for local families, reducing their grocery bills.",
      details: {
        drillType: "independent",
        passed: true,
        evaluationSource: "ai",
        rubricVersion: 2,
      },
    };

    assert.strictEqual(classifyRetrainingAttemptProvenance(legacyAttemptA), "suspect_fallback");
    assert.strictEqual(classifyRetrainingAttemptProvenance(legacyAttemptD), "suspect_fallback");
    assert.strictEqual(classifyRetrainingAttemptProvenance(verifiedAttempt), "verified_ai");

    installMockLocalStorage({
      kiran_prep_attempts_log_v3: JSON.stringify([legacyAttemptA, legacyAttemptD]),
      kiran_prep_retraining_v1: JSON.stringify({
        firstAttemptCount: 5,
        firstAttemptPassCount: 4,
        retrySuccessCount: 1,
        retryTotalCount: 1,
        independentCount: 2,
        independentPassCount: 2,
        masteredSkills: {},
      }),
    });

    const stateBefore = getRetrainingState();
    assert.strictEqual(stateBefore.hasUnverifiedHistoricalData, true, "Must flag pre-v2 state as containing unverified historical data");
    assert.strictEqual(stateBefore.firstAttemptCount, 5, "Must preserve historical counts without deleting them");
    assert.strictEqual(stateBefore.verifiedAiStats.firstAttemptCount, 0, "Verified AI stats start at 0");
    assert.strictEqual(getAttempts().length, 2, "Must not delete historical attempts");
    assert.strictEqual(getAttempts()[0].score, 100, "Must not alter historical attempt scores");

    // Record a new verified AI mastery update
    const { state: stateAfter } = updateRetrainingMastery(
      "VAGUE_SUBJECT",
      "community",
      true,
      true,
      false,
      undefined
    );
    assert.strictEqual(stateAfter.firstAttemptCount, 6);
    assert.strictEqual(stateAfter.verifiedAiStats.firstAttemptCount, 1);
    assert.strictEqual(stateAfter.verifiedAiStats.firstAttemptPassCount, 1);
    console.log("✓ [D13] Historical attempts preserved and distinguished from verified AI v2 attempts");
    passedCount++;
  }

  // 14. Stage B input immutability: blocks backspace, delete, cursor moves, selection replacement, paste, and undo
  {
    let st = createFirstDraftInputState("think_first_write_once");
    st = applyFirstDraftChange(st, "Separated", { inputType: "insertText", nowMs: 1000 });
    st = applyFirstDraftChange(st, "Separated bicycle lanes", { inputType: "insertText", nowMs: 1200 });
    assert.strictEqual(st.committedText, "Separated bicycle lanes");
    assert.strictEqual(st.firstKeystrokeAt, 1000);

    // Block Backspace keydown & deleteContentBackward change
    const bsKey = handleFirstDraftKeyDown(st, { key: "Backspace" });
    assert.strictEqual(bsKey.preventDefault, true, "Backspace keydown must be prevented");
    st = applyFirstDraftChange(bsKey.state, "Separated bicycle lane", {
      inputType: "deleteContentBackward",
      nowMs: 1300,
    });
    assert.strictEqual(st.committedText, "Separated bicycle lanes", "Backspace deletion must not alter committedText");

    // Block cursor repositioning
    const leftKey = handleFirstDraftKeyDown(st, { key: "ArrowLeft" });
    assert.strictEqual(leftKey.preventDefault, true, "ArrowLeft cursor move must be prevented");
    const pos = getEnforcedCursorPosition(st, 3, 9);
    assert.strictEqual(pos.start, st.committedText.length);
    assert.strictEqual(pos.end, st.committedText.length);
    assert.strictEqual(pos.wasRepositioned, true);

    // Block mid-sentence selection replacement
    st = applyFirstDraftChange(st, "Separated car lanes", {
      inputType: "insertReplacementText",
      nowMs: 1400,
    });
    assert.strictEqual(st.committedText, "Separated bicycle lanes", "Selection replacement must be rejected");

    // Block Paste and Undo
    const pasteKey = handleFirstDraftKeyDown(st, { key: "v", metaKey: true });
    assert.strictEqual(pasteKey.preventDefault, true, "Cmd+V must be prevented");
    st = applyFirstDraftChange(pasteKey.state, "Separated bicycle lanes protect riders from traffic", {
      inputType: "insertFromPaste",
      nowMs: 1500,
    });
    assert.strictEqual(st.committedText, "Separated bicycle lanes", "Paste inputType must be rejected");

    const undoKey = handleFirstDraftKeyDown(st, { key: "z", metaKey: true });
    assert.strictEqual(undoKey.preventDefault, true, "Cmd+Z Undo must be prevented");
    st = applyFirstDraftChange(undoKey.state, "Separated", {
      inputType: "historyUndo",
      nowMs: 1600,
    });
    assert.strictEqual(st.committedText, "Separated bicycle lanes", "historyUndo must be rejected");

    // Normal appending of punctuation, spaces, and words remains allowed
    st = applyFirstDraftChange(st, "Separated bicycle lanes, protecting riders.", {
      inputType: "insertText",
      nowMs: 1700,
    });
    assert.strictEqual(st.committedText, "Separated bicycle lanes, protecting riders.");

    // Lock answer on submission
    st = lockFirstDraftState(st, 2000);
    st = applyFirstDraftChange(st, "Separated bicycle lanes, protecting riders. More", {
      inputType: "insertText",
      nowMs: 2100,
    });
    assert.strictEqual(st.committedText, "Separated bicycle lanes, protecting riders.", "Locked state must reject further edits");
    console.log("✓ [D14] Stage B input immutability blocks backspace, cursor move, selection replace, paste, and undo");
    passedCount++;
  }

  // 15. Keyboard / IME composition support & Accessible Editing mode
  {
    let st = createFirstDraftInputState("think_first_write_once");
    st = applyFirstDraftChange(st, "Caf", { inputType: "insertText", nowMs: 1000 });
    st = handleCompositionStart(st, 1100);
    assert.strictEqual(st.isComposing, true);

    // Keydowns during active IME composition must not be blocked
    const compKey = handleFirstDraftKeyDown(st, { key: "Backspace", isComposing: true });
    assert.strictEqual(compKey.preventDefault, false, "Active IME composition key events must not be blocked");

    st = handleCompositionUpdate(st, "Cafe", 1150);
    assert.strictEqual(st.displayText, "Cafe");
    st = handleCompositionEnd(st, "Café", 1200);
    assert.strictEqual(st.isComposing, false);
    assert.strictEqual(st.committedText, "Café");

    // Accessible mode allows normal editing
    let acc = createFirstDraftInputState("standard_accessible");
    acc = applyFirstDraftChange(acc, "First draft sentence", { inputType: "insertText", nowMs: 1000 });
    acc = applyFirstDraftChange(acc, "First sentence", { inputType: "deleteContentBackward", nowMs: 1200 });
    assert.strictEqual(acc.committedText, "First sentence", "Accessible mode must allow normal editing");
    console.log("✓ [D15] IME keyboard composition events and Accessible Editing mode work as expected");
    passedCount++;
  }

  // 16. Timing separation & quality-first scoring hierarchy
  {
    const timingWithin = computeRetrainingTimingMetrics({
      promptDisplayedAtMs: 0,
      inputUnlockedAtMs: 12000, // 12s prep
      firstKeystrokeAtMs: 13000,
      submittedAtMs: 43000, // 30s writing
      writingTargetSeconds: 45,
      studentText: "Separated bicycle lanes protect riders from traffic, making parents more willing to let children cycle to school.",
    });
    assert.strictEqual(timingWithin.prepDurationSeconds, 12);
    assert.strictEqual(timingWithin.writingDurationSeconds, 30);
    assert.strictEqual(timingWithin.overrunSeconds, 0);
    assert.strictEqual(timingWithin.isOverrun, false);
    assert(timingWithin.typingWpm > 0);

    const timingOverrun = computeRetrainingTimingMetrics({
      promptDisplayedAtMs: 0,
      inputUnlockedAtMs: 12000,
      firstKeystrokeAtMs: 12000,
      submittedAtMs: 70000, // 58s writing (13s overrun)
      writingTargetSeconds: 45,
      studentText: "Separated bicycle lanes protect riders from traffic, making parents more willing to let children cycle to school.",
    });
    assert.strictEqual(timingOverrun.writingDurationSeconds, 58);
    assert.strictEqual(timingOverrun.overrunSeconds, 13);
    assert.strictEqual(timingOverrun.isOverrun, true);

    assert.strictEqual(
      classifyFirstDraftQualityBand(
        { qualityScore: 95, firstDraftQualityPass: true, highQualityFirstDraft: true },
        30,
        "think_first_write_once"
      ),
      "fluent_first_draft"
    );
    assert.strictEqual(
      classifyFirstDraftQualityBand(
        { qualityScore: 95, firstDraftQualityPass: true, highQualityFirstDraft: true },
        58,
        "think_first_write_once"
      ),
      "high_quality"
    );
    assert.strictEqual(
      classifyFirstDraftQualityBand(
        { qualityScore: 80, firstDraftQualityPass: true, highQualityFirstDraft: false },
        30,
        "think_first_write_once"
      ),
      "developing"
    );
    assert.strictEqual(
      classifyFirstDraftQualityBand(
        { qualityScore: 70, firstDraftQualityPass: false, highQualityFirstDraft: false },
        20,
        "think_first_write_once"
      ),
      "not_mastered"
    );
    console.log("✓ [D16] Timing metrics and quality-first scoring hierarchy verified");
    passedCount++;
  }

  // 17. Calibration safeguards: specific audit defects, Australian English ("earnt"), and Stage C/D feedback rules
  {
    // Australian English "earnt" must not be penalised
    const ausParsed = SentenceRetrainingSchema.parse({
      grammaticalCorrectness: 1,
      clarity: 2,
      naturalness: 1,
      precision: 2,
      causalCompleteness: 2,
      compliance: 2,
      defect: "GRAMMATICAL_ERROR",
      problematicPhrase: "earnt",
      feedback: "Use 'earned' instead of 'earnt'.",
    });
    const ausVerdict = computeRetrainingScoreAndVerdict(ausParsed, {
      drillType: "independent",
      attemptStage: "first_draft",
      studentText: "Children who complete chores learn that pocket money must be earnt through effort.",
    });
    assert.strictEqual(ausVerdict.score, 10, "Australian English 'earnt' must not be penalised");
    assert.strictEqual(ausVerdict.firstDraftQualityPass, true);
    assert.strictEqual(ausVerdict.defect, undefined);

    // Specific audit defects ("cost substantially higher", "get disposed", "owners get contact", "engineering curiosity grows", "helps children's brains")
    const auditCases = [
      "Electric buses cost substantially higher than diesel buses, reducing council budgets.",
      "Plastic bags should be banned because they get disposed in landfills.",
      "Microchipping pets ensures that owners get contact quickly when pets are lost.",
      "Building solar model cars teaches students wiring skills so engineering curiosity grows.",
      "Learning a musical instrument is beneficial because it helps children's brains.",
    ];
    for (const badSentence of auditCases) {
      const lenientLlm = SentenceRetrainingSchema.parse({
        grammaticalCorrectness: 2,
        clarity: 2,
        naturalness: 2,
        precision: 2,
        causalCompleteness: 2,
        compliance: 2,
        defect: null,
        feedback: "Good sentence. Better: 'Improved model sentence.'",
      });
      const v = computeRetrainingScoreAndVerdict(lenientLlm, {
        drillType: "independent",
        attemptStage: "first_draft",
        studentText: badSentence,
      });
      assert.strictEqual(
        v.firstDraftQualityPass,
        false,
        `Audit defect sentence must not pass first-draft quality check: "${badSentence}"`
      );
      assert(v.qualityScore < 80, `Expected <80% for "${badSentence}", got ${v.qualityScore}%`);
      assert(
        !v.feedback.includes("Better:"),
        "Stage C failed first draft must never leak 'Better:' model sentence"
      );
    }

    // Stage D correction evaluation
    const stageDParsed = SentenceRetrainingSchema.parse({
      grammaticalCorrectness: 2,
      clarity: 2,
      naturalness: 2,
      precision: 2,
      causalCompleteness: 2,
      compliance: 2,
      defect: null,
      defectCorrected: true,
      feedback: "You fixed the passive phrase by writing 'are disposed of'.",
    });
    const stageDVerdict = computeRetrainingScoreAndVerdict(stageDParsed, {
      drillType: "independent",
      attemptStage: "correction",
      firstDraftText: "Plastic bags should be banned because they get disposed in landfills.",
      targetDefectToFix: "AWKWARD_COLLOCATION",
      targetPhraseToFix: "get disposed",
      studentText: "Plastic bags should be banned because they are disposed of in landfills, polluting soil.",
    });
    assert.strictEqual(stageDVerdict.defectCorrected, true);
    assert.strictEqual(stageDVerdict.qualityScore, 100);
    console.log("✓ [D17] Calibration anchors, Australian English ('earnt'), Stage C model-answer hiding, and Stage D repair check verified");
    passedCount++;
  }

  // 18. First-draft vs Stage D correction score separation, exposure history & parent analytics
  {
    installMockLocalStorage();

    // Unseen question check before first submission
    const expBefore = checkRetrainingExposureBeforeSubmit(
      "retrain-ind-1",
      "Electric buses cost substantially higher than diesel buses."
    );
    assert.strictEqual(expBefore.isUnseenQuestion, true);
    assert.strictEqual(expBefore.reusedPriorSentence, false);

    // Record failed Stage C first draft (score 60%)
    recordRetrainingExposure({
      questionId: "retrain-ind-1",
      studentText: "Electric buses cost substantially higher than diesel buses.",
      attemptStage: "first_draft",
      qualityScore: 60,
      firstDraftPassed: false,
      nowMs: 1000,
    });
    updateRetrainingMastery("AWKWARD_COLLOCATION", "transport", true, false, false, "AWKWARD_COLLOCATION", {
      editingMode: "think_first_write_once",
      isUnseenQuestion: true,
      reusedPriorSentence: false,
      attemptStage: "first_draft",
    });
    const firstDraftLog = logAttempt({
      exerciseType: "sentence_retraining",
      domain: "transport",
      questionId: "retrain-ind-1",
      score: 60,
      xpEarned: 2,
      durationSeconds: 28,
      feedback: "Costs are high, or buses cost more.",
      input: "Electric buses cost substantially higher than diesel buses.",
      details: {
        drillType: "independent",
        targetSkillOrError: "AWKWARD_COLLOCATION",
        attemptStage: "first_draft",
        editingMode: "think_first_write_once",
        passed: false,
        firstDraftQualityPass: false,
        qualityScore: 60,
        qualityBand: "not_mastered",
        prepDurationSeconds: 12,
        writingDurationSeconds: 28,
        isUnseenQuestion: true,
        reusedPriorSentence: false,
        evaluationSource: "ai",
        rubricVersion: 2,
      },
    });

    const masteryAfterFirstDraft = getProfile().skillsMastery.causal_reasoning;
    assert.strictEqual(masteryAfterFirstDraft, 60);

    // Record successful Stage D correction (score 100%)
    recordRetrainingExposure({
      questionId: "retrain-ind-1",
      studentText: "Although electric buses cost more upfront, they reduce city air pollution.",
      attemptStage: "correction",
      qualityScore: 100,
      firstDraftPassed: false,
      nowMs: 2000,
    });
    updateRetrainingMastery("AWKWARD_COLLOCATION", "transport", true, false, true, "AWKWARD_COLLOCATION", {
      editingMode: "think_first_write_once",
      attemptStage: "correction",
    });
    logAttempt({
      exerciseType: "sentence_retraining",
      domain: "transport",
      questionId: "retrain-ind-1",
      score: 100,
      xpEarned: 10,
      durationSeconds: 20,
      feedback: "Target defect repaired.",
      input: "Although electric buses cost more upfront, they reduce city air pollution.",
      details: {
        drillType: "independent",
        targetSkillOrError: "AWKWARD_COLLOCATION",
        attemptStage: "correction",
        firstDraftAttemptId: firstDraftLog.id,
        editingMode: "think_first_write_once",
        passed: true,
        defectCorrected: true,
        qualityScore: 100,
        evaluationSource: "ai",
        rubricVersion: 2,
      },
    });

    // Stage D correction must NEVER overwrite first-draft score or inflate first-attempt mastery!
    const stateAfterCorrection = getRetrainingState();
    assert.strictEqual(
      stateAfterCorrection.exposureHistory["retrain-ind-1"].firstDraftQualityScore,
      60,
      "First-draft score must not be overwritten by Stage D correction"
    );
    assert.strictEqual(
      stateAfterCorrection.exposureHistory["retrain-ind-1"].correctedQualityScore,
      100,
      "Corrected score must be stored separately"
    );
    assert.strictEqual(
      stateAfterCorrection.verifiedAiStats.firstAttemptPassCount,
      0,
      "Stage D correction must never count as a first-attempt pass"
    );
    assert.strictEqual(
      stateAfterCorrection.verifiedAiStats.retrySuccessCount,
      1,
      "Stage D correction must increment retry/correction success count"
    );
    assert.strictEqual(
      getProfile().skillsMastery.causal_reasoning,
      60,
      "Stage D correction must not overwrite rolling first-draft skill mastery"
    );

    // Reusing the corrected sentence later must be detected and blocked from unseen transfer mastery
    const reuseCheck = checkRetrainingExposureBeforeSubmit(
      "retrain-ind-2",
      "Although electric buses cost more upfront, they reduce city air pollution."
    );
    assert.strictEqual(reuseCheck.reusedPriorSentence, true, "Must detect reuse of a previously corrected sentence");

    // Verify Parent Dashboard analytics separation
    const analytics = getRetrainingAnalytics();
    assert.strictEqual(analytics.unseenFirstAttemptTotal, 1);
    assert.strictEqual(analytics.unseenFirstAttemptPassed, 0);
    assert.strictEqual(analytics.correctionTotalCount, 1);
    assert.strictEqual(analytics.correctionSuccessCount, 1);
    assert.strictEqual(analytics.medianPrepTimeSeconds, 12);
    assert.strictEqual(analytics.medianWritingTimeSeconds, 28);
    assert.strictEqual(analytics.firstDraftQualityTrend[0].qualityScore, 60);
    assert.strictEqual(analytics.firstDraftQualityTrend[0].correctedScore, 100);

    // Session builder avoids consecutive identical grammatical patterns when alternatives exist
    const session = buildRetrainingSession(SEED_SENTENCE_RETRAINING);
    assert.strictEqual(session.length, 7);
    let consecutiveSamePattern = 0;
    for (let i = 1; i < session.length; i++) {
      if (getGrammaticalPatternKey(session[i]) === getGrammaticalPatternKey(session[i - 1])) {
        consecutiveSamePattern++;
      }
    }
    assert.strictEqual(consecutiveSamePattern, 0, "Session builder must avoid consecutive identical grammatical patterns");
    console.log("✓ [D18] First-draft vs correction separation, memorisation guard, and parent analytics verified");
    passedCount++;
  }

  console.log(`\n=== PART 1 COMPLETE: ${passedCount}/${passedCount} Deterministic Tests Passed ===\n`);
}

/* ============================================================================
   PART 2: LIVE OPENROUTER CALIBRATION TESTS (14 Required Scenarios via Route)
   ============================================================================ */
async function runLiveCalibrationTests() {
  console.log("=== PART 2: Live OpenRouter Calibration Tests (14 Scenarios) ===\n");

  if (!process.env.OPENROUTER_API_KEY && fs.existsSync(".env.local")) {
    const envContent = fs.readFileSync(".env.local", "utf-8");
    const keyMatch = envContent.match(/OPENROUTER_API_KEY=(.+)/);
    if (keyMatch) process.env.OPENROUTER_API_KEY = keyMatch[1].trim();
    const modelMatch = envContent.match(/OPENROUTER_PRIMARY_MODEL=(.+)/);
    if (modelMatch) process.env.OPENROUTER_PRIMARY_MODEL = modelMatch[1].trim();
  }

  assert(
    Boolean(process.env.OPENROUTER_API_KEY),
    "OPENROUTER_API_KEY is required to run live calibration tests"
  );

  const liveCases = [
    {
      name: "1. Awkward allowance sentence (Example A) — must not receive full marks",
      payload: {
        drillType: "independent",
        proposition: "Children should be paid an allowance by parents only when they complete household chores.",
        modelAnswer: "Tying pocket money to completed chores teaches children that financial reward requires disciplined effort rather than passive entitlement.",
        studentText: "Children should be only paid an allowance by parents when they complete household chores because it can make them fitter, and want to work more.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.valid, true);
        assert(res.body.score <= 6, `Expected score <= 6, got ${res.body.score}`);
        assert.strictEqual(res.body.passed, false, "Example A must not pass");
        assert(res.body.causalCompleteness <= 1, "Implausible fitness mechanism must score <= 1 on causalCompleteness");
        assert(res.body.feedback.includes("Better:"), "Weak sentence feedback must include an improved version ('Better:')");
      },
    },
    {
      name: "2. Verbose footpath sentence (Example B) — must not receive full marks",
      payload: {
        drillType: "independent",
        proposition: "Suburban shopping strips should replace on-street parking with wider footpaths and outdoor dining.",
        modelAnswer: "Replacing on-street parking with broad pedestrian plazas attracts foot traffic to local businesses and creates safe gathering spaces for families.",
        studentText: "Suburban shopping strips should replace on-street parking with wider footpaths and outdoor dining due to the fact that it can make people healthier and exercise more.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert(res.body.score <= 7, `Expected score <= 7, got ${res.body.score}`);
        assert(res.body.score < 10, "Example B must not receive full marks");
        assert(
          res.body.naturalness <= 1 || res.body.precision <= 1 || res.body.causalCompleteness <= 1,
          "Must deduct for verbosity/vague outcome/missing mechanism"
        );
      },
    },
    {
      name: "3. Subject–verb disagreement + vague rebuild (Example C) — must be detected",
      payload: {
        drillType: "rebuild",
        targetSkillOrError: "VAGUE_SUBJECT",
        originalSentence: "This can help people become healthier and build communities.",
        context: "Replacing central car parks with public parks.",
        modelAnswer: "Public parks give residents space to exercise and meet neighbours, improving their physical health and social connections.",
        studentText: "Replacing central car parks with public parks help people become healthier and build communities.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert(res.body.score <= 6, `Expected score <= 6, got ${res.body.score}`);
        assert.strictEqual(res.body.passed, false, "Example C must not pass");
        assert(res.body.naturalness <= 1, "Subject-verb disagreement ('Replacing ... help') must deduct naturalness");
      },
    },
    {
      name: "4. Community garden conditional sentence (Example D) — must not be labelled MISSING_MECHANISM",
      payload: {
        drillType: "constrained",
        notes: [
          "Suburbs convert neglected vacant lots into shared veggie gardens",
          "Neighbours weed, water, and harvest produce together",
          "Family grocery bills fall while community friendship grows",
        ],
        constraint: "causal_conjunction",
        constraintDescription: "Clearly connect the cause and effect (for example, using 'because', 'by', 'so', 'when', or 'if').",
        modelAnswer: "Converting vacant lots into shared vegetable gardens reduces household grocery bills because local families harvest fresh produce together.",
        studentText: "If suburbs convert neglected vacant lots into shared veggie gardens and neighbours weed, water, and harvest produce together, family grocery bills fall while community friendship grows.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert.notStrictEqual(
          res.body.defect,
          "MISSING_MECHANISM",
          "Must not be labelled MISSING_MECHANISM solely because it lacks 'because'"
        );
        assert(res.body.causalCompleteness >= 1, "Conditional causal mechanism must be recognised");
        assert(res.body.score >= 7, `Expected passing score >= 7 for Example D, got ${res.body.score}`);
      },
    },
    {
      name: "5. Clear, concise sentence — should receive high marks",
      payload: {
        drillType: "independent",
        proposition: "Children should be paid an allowance by parents only when they complete household chores.",
        modelAnswer: "Tying pocket money to completed chores teaches children that financial reward requires disciplined effort rather than passive entitlement.",
        studentText: "Linking pocket money to household chores teaches children that earning money requires reliable effort.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.passed, true);
        assert(res.body.score >= 8, `Expected high score >= 8, got ${res.body.score}`);
      },
    },
    {
      name: "6. Vague subject — should be penalised",
      payload: {
        drillType: "rebuild",
        targetSkillOrError: "VAGUE_SUBJECT",
        originalSentence: "This can help people become healthier and build communities.",
        context: "Replacing central car parks with public parks.",
        modelAnswer: "Public parks give residents space to exercise and meet neighbours, improving their physical health and social connections.",
        studentText: "This helps people exercise more and makes the town nicer.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.passed, false);
        assert(res.body.score <= 6, `Expected score <= 6, got ${res.body.score}`);
      },
    },
    {
      name: "7. Circular reasoning — should be penalised",
      payload: {
        drillType: "independent",
        proposition: "Primary schools should ban single-use plastic wrap from all student lunchboxes.",
        modelAnswer: "Banning plastic packaging in school canteens compels families to pack reusable containers, stopping thousands of snack wrappers from blowing into local drains.",
        studentText: "Primary schools should ban single-use plastic wrap from lunchboxes because banning plastic wrap stops students from using plastic wrap at school.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.passed, false);
        assert(res.body.score <= 6, `Expected score <= 6 for circular reasoning, got ${res.body.score}`);
        assert(res.body.causalCompleteness <= 1);
      },
    },
    {
      name: "8. Implausible causal claims — should be penalised",
      payload: {
        drillType: "rebuild",
        targetSkillOrError: "VAGUE_VERB",
        originalSentence: "Automated library robots will provide help and make people learn faster.",
        context: "Automating library book sorting and index search.",
        modelAnswer: "Robotic sorting machines shelve returned books instantly, ensuring students can find research materials without delay.",
        studentText: "Automated library sorting robots shelve books instantly, which doubles students' IQ scores overnight.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.passed, false);
        assert(res.body.score <= 6, `Expected score <= 6 for implausible claim, got ${res.body.score}`);
        assert(res.body.causalCompleteness <= 1);
      },
    },
    {
      name: "9. Missing mechanism — should be penalised",
      payload: {
        drillType: "independent",
        proposition: "Public transport in Australian capital cities should be completely free for all commuters.",
        modelAnswer: "Abolishing public transport fares encourages motorists to commute by train instead of driving, easing highway gridlock and city smog.",
        studentText: "Making public transport free for all commuters will stop climate change.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert(res.body.causalCompleteness <= 1, "Must penalise missing mechanism between free fares and stopping climate change");
        assert(res.body.score <= 7, `Expected score <= 7, got ${res.body.score}`);
      },
    },
    {
      name: "10. Minor grammatical error in an otherwise strong sentence — proportionate deduction",
      payload: {
        drillType: "rebuild",
        targetSkillOrError: "VAGUE_SUBJECT",
        originalSentence: "This can help people become healthier and build communities.",
        context: "Replacing central car parks with public parks.",
        modelAnswer: "Public parks give residents space to exercise and meet neighbours, improving their physical health and social connections.",
        studentText: "Replacing central car parks with public parks give residents green space to jog and meet their neighbours.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert(
          res.body.score >= 7 && res.body.score <= 8,
          `Expected proportionate deduction (7-8/10), got ${res.body.score}`
        );
        assert.strictEqual(res.body.naturalness, 1, "Minor verb agreement error should score 1/2 on naturalness");
      },
    },
    {
      name: "11. Valid short sentence — must not fail due to word count",
      payload: {
        drillType: "constrained",
        notes: [
          "Solar speed signs installed outside schools",
          "Flashing displays warn speeding motorists",
          "Drivers slow down before pedestrian crossings",
        ],
        constraint: "precise_action_verb",
        constraintDescription: "Combine the notes concisely using a precise action verb (e.g., warn, alert, prompt).",
        modelAnswer: "Flashing solar speed signs outside schools warn speeding motorists, prompting drivers to slow down before crossings.",
        studentText: "Flashing solar signs outside schools warn speeding drivers, slowing traffic before crossings.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.passed, true);
        assert(res.body.score >= 8, `Expected score >= 8 for concise 12-word sentence, got ${res.body.score}`);
      },
    },
    {
      name: "12. Live API failure (invalid model ID) — must not produce passing grade or award XP",
      payload: {
        drillType: "independent",
        proposition: "Public transport in Australian capital cities should be completely free for all commuters.",
        studentText: "Abolishing public transport fares encourages motorists to take trains, reducing highway congestion.",
        selectedModel: "openai/invalid-nonexistent-model-id-999",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 503);
        assert.strictEqual(res.body.valid, false);
        assert.strictEqual(res.body.xpAwarded, 0);
        assert.strictEqual(res.body.passed, undefined);
      },
    },
    {
      name: "14. Successful live evaluation — returns valid scores, provenance metadata, and actionable feedback",
      payload: {
        drillType: "constrained",
        notes: [
          "Suburbs convert vacant lots into shared vegetable gardens",
          "Local families harvest fresh produce together",
          "Household grocery bills fall",
        ],
        constraint: "causal_conjunction",
        constraintDescription: "Clearly connect the cause and effect (for example, using 'because', 'by', 'so', 'when', or 'if').",
        modelAnswer: "Converting vacant lots into shared vegetable gardens reduces household grocery bills because local families harvest fresh produce together.",
        studentText: "Community gardens provide fresh vegetables for local families, reducing their weekly grocery bills.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.valid, true);
        assert.strictEqual(res.body.evaluationSource, "ai");
        assert.strictEqual(res.body.rubricVersion, 2);
        assert.strictEqual(
          res.body.score,
          res.body.clarity +
            res.body.naturalness +
            res.body.precision +
            res.body.causalCompleteness +
            res.body.compliance
        );
        assert(res.body.score >= 8);
        assert(typeof res.body.feedback === "string" && res.body.feedback.length > 10);
      },
    },
    {
      name: "15. Stage C collocation defect ('cost substantially higher') — fails first draft without leaking model sentence",
      payload: {
        drillType: "rebuild",
        targetSkillOrError: "AWKWARD_COLLOCATION",
        originalSentence: "Electric buses make city air cleaner, they cost more to buy at the start.",
        context: "Transitioning city bus fleets from diesel to electric.",
        modelAnswer: "Although electric buses cost more upfront, they reduce city air pollution.",
        attemptStage: "first_draft",
        studentText: "Although electric buses cost substantially higher upfront, they reduce city air pollution.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.firstDraftQualityPass, false);
        assert(res.body.qualityScore < 80, `Expected <80%, got ${res.body.qualityScore}%`);
        assert(!res.body.feedback.includes("Better:"), "Stage C must not reveal model rewrite");
      },
    },
    {
      name: "16. Australian English ('earnt') — accepted as high-quality first draft",
      payload: {
        drillType: "independent",
        proposition: "Children should be paid an allowance by parents only when they complete household chores.",
        modelAnswer: "Children should receive an allowance only after completing household chores because earning money teaches them that income requires effort.",
        attemptStage: "first_draft",
        studentText: "Children should receive pocket money only after completing household chores because they learn that income must be earnt through effort.",
      },
      verify: (res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.firstDraftQualityPass, true);
        assert(res.body.qualityScore >= 90, `Expected >=90% for Australian English sentence, got ${res.body.qualityScore}%`);
      },
    },
  ];

  for (const tc of liveCases) {
    process.stdout.write(`Running ${tc.name}... `);
    const res = await callEvaluateRoute(tc.payload);
    tc.verify(res);
    console.log(
      `PASS (status=${res.status}, score=${res.body.score ?? "N/A"}, defect=${res.body.defect ?? "none"})`
    );
    if (res.body.feedback) {
      console.log(`   Feedback: "${res.body.feedback}"`);
    }
  }

  console.log("\n=== PART 2 COMPLETE: All Live Calibration Tests Passed ===\n");
}

async function main() {
  await runDeterministicTests();
  const runLive =
    process.argv.includes("--live") || process.env.LIVE_AI_TESTS === "1";
  if (runLive) {
    await runLiveCalibrationTests();
  } else {
    console.log(
      "Skipping live OpenRouter tests (pass --live or LIVE_AI_TESTS=1 to execute live calibration suite)."
    );
  }
}

main().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
