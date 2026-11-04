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
} = await import("../lib/storage.ts");
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
