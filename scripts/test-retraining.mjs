// Test script for Sentence Retraining Mode evaluation & rules
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=== Testing Sentence Retraining Mode Evaluator & Rules ===\n");

// Read OPENROUTER_API_KEY from .env.local if present
let apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  const match = envContent.match(/OPENROUTER_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

async function evaluate(payload) {
  // Test via fetch if next server is running or test directly via evaluate logic
  // We can call OpenRouter directly with the same system prompt to verify strict grading calibration
  const systemPrompt = `You are a calibrated, strict Australian Grade 5 scholarship exam writing coach evaluating a single sentence in "Sentence Retraining Mode".
Your goal is to eliminate habitual awkward constructions, vague openings, and superficial synonyms, ensuring the student writes clear, natural, logically complete sentences independently.

DRILL TYPE: ${payload.drillType}
${payload.originalSentence ? `ORIGINAL AWKWARD SENTENCE: "${payload.originalSentence}"` : ""}
${payload.context ? `CONTEXT: "${payload.context}"` : ""}
${payload.notes ? `NOTES PROVIDED: ${JSON.stringify(payload.notes)}` : ""}
${payload.constraintDescription ? `MANDATORY CONSTRAINT: "${payload.constraintDescription}"` : ""}
${payload.proposition ? `UNSEEN PROPOSITION: "${payload.proposition}"` : ""}
REFERENCE MODEL ANSWER: "${payload.modelAnswer}"

EVALUATION RUBRIC (Score each dimension 0, 1, or 2):
1. clarity (0-2): Meaning is instantly clear to a reader without ambiguity.
2. naturalness (0-2): Fluent Australian English sentence construction (no awkward phrasing, no bizarre collocations like 'spew less money' or 'block shade', no comma splices).
3. precision (0-2): Uses concrete terms; avoids abstract empty claims like 'become healthier', 'build communities', 'make things better', 'good', 'things'.
4. causalCompleteness (0-2): Fully explains the logical mechanism (not merely stating a benefit without explaining what causes it).
5. compliance (0-2): Strict compliance with prompt requirements, constraints, and instructions.

STRICT SCORING ANCHOR RULE:
- Total score = sum of the 5 dimensions (0 to 10).
- A sentence CANNOT score above 6/10 if it contains a significant awkward construction, incorrect causal relationship, superficial synonym rewrite, or vague wording that obscures its meaning.
- A grammatically correct sentence must NOT be penalised merely for being simple.
- Do NOT reward unnecessary complexity, sophisticated vocabulary or length.
- "passed" is true ONLY IF score >= 7 AND no significant defect exists.

DEFECT TAXONOMY (Identify ONE principal defect if unsuccessful):
- VAGUE_SUBJECT: e.g. "This helps...", "This provides...", "This can make...", "It is good"
- VAGUE_VERB: e.g. "helps", "provides", "makes things"
- AWKWARD_COLLOCATION: e.g. "block shade", "spew less money", "cost substantially higher"
- MISSING_MECHANISM: states benefit without the physical/logical cause
- GRAMMATICAL_ERROR: agreement, tense, or syntax error
- REPETITION: repeating same root idea or restating premise
- UNNECESSARY_WORDS: wordy filler, padding, or exceeding word limits
- SENTENCE_FRAGMENT: incomplete thought or clause
- RUN_ON_SENTENCE: comma splice or run-on sentences without conjunction
- MEANING_CHANGED: altered premise or superficial synonym swap retaining broken structure

Return JSON strictly adhering to:
{
  "valid": true,
  "score": number (0 to 10),
  "passed": boolean (true if score >= 7 and no defect),
  "clarity": number (0 to 2),
  "naturalness": number (0 to 2),
  "precision": number (0 to 2),
  "causalCompleteness": number (0 to 2),
  "compliance": number (0 to 2),
  "defect": "VAGUE_SUBJECT" | "VAGUE_VERB" | "AWKWARD_COLLOCATION" | "MISSING_MECHANISM" | "GRAMMATICAL_ERROR" | "REPETITION" | "UNNECESSARY_WORDS" | "SENTENCE_FRAGMENT" | "RUN_ON_SENTENCE" | "MEANING_CHANGED" | null,
  "problematicPhrase": "exact problematic phrase",
  "feedback": "One short sentence identifying defect and giving fix",
  "structuralDifference": "One short sentence explaining structural difference from model answer",
  "prohibitedOpening": "opening phrase if vague or null",
  "xpAwarded": number
}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-6.1-sol",
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `STUDENT RESPONSE:\n"${payload.studentText}"` },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${err}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function runTests() {
  console.log("--- 1. Testing REBUILD Drill ---");

  // 1A. Bad Rebuild: Vague opening & abstract outcomes
  console.log("Testing 1A: Bad rebuild (vague opening 'This can help' + abstract outcome)...");
  const res1A = await evaluate({
    drillType: "rebuild",
    originalSentence: "This can help people become healthier and build communities.",
    context: "Replacing central car parks with public parks.",
    modelAnswer: "Public parks give residents space to exercise and meet neighbours, improving their physical health and social connections.",
    studentText: "This can help people become healthier and build communities.",
  });
  console.log("Result 1A:", {
    score: res1A.score,
    passed: res1A.passed,
    defect: res1A.defect,
    feedback: res1A.feedback,
  });
  assert(!res1A.passed, "Bad rebuild must fail");
  assert(res1A.score <= 6, "Bad rebuild score must be <= 6");
  console.log("✓ 1A correctly failed\n");

  // 1B. Superficial synonym rebuild: "This can assist citizens become fitter and construct communities."
  console.log("Testing 1B: Superficial synonym swap...");
  const res1B = await evaluate({
    drillType: "rebuild",
    originalSentence: "This can help people become healthier and build communities.",
    context: "Replacing central car parks with public parks.",
    modelAnswer: "Public parks give residents space to exercise and meet neighbours, improving their physical health and social connections.",
    studentText: "This can assist citizens become fitter and construct communities.",
  });
  console.log("Result 1B:", {
    score: res1B.score,
    passed: res1B.passed,
    defect: res1B.defect,
    feedback: res1B.feedback,
  });
  assert(!res1B.passed, "Superficial synonym swap must fail");
  assert(res1B.score <= 6, "Superficial synonym swap score must be <= 6");
  console.log("✓ 1B correctly failed\n");

  // 1C. Good Rebuild: Concrete subject, observable actions, logical consequence
  console.log("Testing 1C: Good rebuild...");
  const res1C = await evaluate({
    drillType: "rebuild",
    originalSentence: "This can help people become healthier and build communities.",
    context: "Replacing central car parks with public parks.",
    modelAnswer: "Public parks give residents space to exercise and meet neighbours, improving their physical health and social connections.",
    studentText: "Public parks give residents space to exercise and meet neighbours, improving their physical health and social connections.",
  });
  console.log("Result 1C:", {
    score: res1C.score,
    passed: res1C.passed,
    clarity: res1C.clarity,
    causalCompleteness: res1C.causalCompleteness,
    feedback: res1C.feedback,
  });
  assert(res1C.passed, "Good rebuild must pass");
  assert(res1C.score >= 7, "Good rebuild score must be >= 7");
  console.log("✓ 1C correctly passed\n");

  console.log("--- 2. Testing CONSTRAINED CONSTRUCTION Drill ---");

  // 2A. Bad Constrained: Constraint broken (avoid vague words)
  console.log("Testing 2A: Constraint broken ('avoid vague words' violated by using 'helps' and 'better')...");
  const res2A = await evaluate({
    drillType: "constrained",
    notes: [
      "Trees planted in school playgrounds",
      "Dense canopy blocks harsh direct sunlight",
      "Students stay cooler during summer recess",
    ],
    constraintDescription: "Avoid vague words such as 'things', 'good', 'better', or 'helps'.",
    modelAnswer: "Mature trees shelter school playgrounds so students remain cool beneath dense leaves during hot lunch breaks.",
    studentText: "Trees in playgrounds help children feel better because shade is good.",
  });
  console.log("Result 2A:", {
    score: res2A.score,
    passed: res2A.passed,
    defect: res2A.defect,
    feedback: res2A.feedback,
  });
  assert(!res2A.passed, "Violated constraint must fail");
  assert(res2A.score <= 6, "Score must be capped at 6");
  console.log("✓ 2A correctly failed\n");

  // 2B. Good Constrained: Complies with constraint, clear causal mechanism
  console.log("Testing 2B: Good constrained construction...");
  const res2B = await evaluate({
    drillType: "constrained",
    notes: [
      "Trees planted in school playgrounds",
      "Dense canopy blocks harsh direct sunlight",
      "Students stay cooler during summer recess",
    ],
    constraintDescription: "Explain the mechanism using 'because', 'by', or 'so'.",
    modelAnswer: "Mature trees shelter school playgrounds so students remain cool beneath dense leaves during hot lunch breaks.",
    studentText: "Mature trees shelter school playgrounds so students remain cool beneath dense leaves during hot lunch breaks.",
  });
  console.log("Result 2B:", {
    score: res2B.score,
    passed: res2B.passed,
    causalCompleteness: res2B.causalCompleteness,
    feedback: res2B.feedback,
  });
  assert(res2B.passed, "Good constrained sentence must pass");
  assert(res2B.score >= 7, "Score must be >= 7");
  console.log("✓ 2B correctly passed\n");

  console.log("--- 3. Testing INDEPENDENT SENTENCE Drill ---");

  // 3A. Bad Independent: Vague assertion without causal mechanism
  console.log("Testing 3A: Bad independent sentence (vague, missing mechanism)...");
  const res3A = await evaluate({
    drillType: "independent",
    proposition: "Public transport in Australian capital cities should be completely free for all commuters.",
    modelAnswer: "Abolishing public transport fares encourages motorists to commute by train instead of driving, easing highway gridlock and city smog.",
    studentText: "Free public transport helps everyone and makes things better for people.",
  });
  console.log("Result 3A:", {
    score: res3A.score,
    passed: res3A.passed,
    defect: res3A.defect,
    feedback: res3A.feedback,
  });
  assert(!res3A.passed, "Vague independent sentence must fail");
  assert(res3A.score <= 6, "Score must be <= 6");
  console.log("✓ 3A correctly failed\n");

  // 3B. Good Independent: Strong proposition-specific argument with observable mechanism
  console.log("Testing 3B: Good independent sentence...");
  const res3B = await evaluate({
    drillType: "independent",
    proposition: "Public transport in Australian capital cities should be completely free for all commuters.",
    modelAnswer: "Abolishing public transport fares encourages motorists to commute by train instead of driving, easing highway gridlock and city smog.",
    studentText: "Abolishing public transport fares encourages motorists to commute by train instead of driving, easing highway gridlock and city smog.",
  });
  console.log("Result 3B:", {
    score: res3B.score,
    passed: res3B.passed,
    clarity: res3B.clarity,
    causalCompleteness: res3B.causalCompleteness,
    feedback: res3B.feedback,
  });
  assert(res3B.passed, "Good independent sentence must pass");
  assert(res3B.score >= 7, "Score must be >= 7");
  console.log("✓ 3B correctly passed\n");

  console.log("=== ALL TEST CASES PASSED SUCCESSFULLY ===");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
