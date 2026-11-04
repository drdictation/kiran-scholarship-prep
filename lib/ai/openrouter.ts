import { z } from "zod";
import type {
  SentenceRetrainingDrillType,
  SentenceRetrainingErrorType,
  SentenceRetrainingEvaluation,
  RetrainingConstraintType,
} from "@/types";

export const DEFAULT_MODEL =
  process.env.OPENROUTER_PRIMARY_MODEL || "openai/gpt-6.1-sol";

export async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  modelOverride?: string,
  maxTokens: number = 750,
  maxRetries: number = 1
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[OpenRouter] Evaluation aborted: MISSING_API_KEY");
    throw new Error("MISSING_API_KEY");
  }

  const selectedModel =
    modelOverride ||
    process.env.OPENROUTER_PRIMARY_MODEL ||
    DEFAULT_MODEL;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://scholarship-writing-lab.vercel.app",
          "X-Title": "Scholarship Writing Lab",
        },
        body: JSON.stringify({
          model: selectedModel,
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const safeSnippet = errorText.slice(0, 200).replace(/sk-or-[a-zA-Z0-9-]+/g, "[REDACTED]");
        console.error(
          `[OpenRouter] HTTP ${response.status} for model="${selectedModel}" (attempt ${attempt + 1}/${maxRetries + 1}): ${safeSnippet}`
        );
        const isTransient = response.status === 429 || response.status >= 500;
        lastError = new Error(`OPENROUTER_HTTP_${response.status}: ${safeSnippet}`);
        if (isTransient && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 350));
          continue;
        }
        throw lastError;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        console.error(
          `[OpenRouter] Empty content for model="${selectedModel}" (attempt ${attempt + 1}/${maxRetries + 1})`
        );
        lastError = new Error("OPENROUTER_EMPTY_CONTENT");
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 350));
          continue;
        }
        throw lastError;
      }

      // Strip markdown code fences or conversational wrappers
      let cleaned = content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned
          .replace(/^```(?:json)?\s*\n?/i, "")
          .replace(/\n?```\s*$/i, "")
          .trim();
      }
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
      }

      try {
        return JSON.parse(cleaned);
      } catch (err: any) {
        console.error(
          `[OpenRouter] JSON parse failure on model="${selectedModel}" (attempt ${attempt + 1}/${maxRetries + 1}): ${err.message}`
        );
        lastError = new Error(`MALFORMED_JSON: ${err.message}`);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 350));
          continue;
        }
        throw lastError;
      }
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isNonRetryable =
        lastError.message.startsWith("OPENROUTER_HTTP_400") ||
        lastError.message.startsWith("OPENROUTER_HTTP_401") ||
        lastError.message.startsWith("OPENROUTER_HTTP_403") ||
        lastError.message.startsWith("OPENROUTER_HTTP_404") ||
        lastError.message === "MISSING_API_KEY";
      if (isNonRetryable || attempt >= maxRetries) {
        throw lastError;
      }
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  throw lastError || new Error("OPENROUTER_REQUEST_FAILED");
}

// Zod schemas for strict output validation
export const IdeaSprintSchema = z.object({
  valid: z.boolean(),
  distinctCount: z.number().min(0).max(3),
  totalRawScore: z.number().min(0).max(6).default(0),
  scorePercentage: z.number().min(0).max(100).default(0),
  arguments: z.array(
    z.object({
      index: z.number(),
      text: z.string(),
      score: z.number().min(0).max(2).default(0),
      relevant: z.boolean(),
      category: z.string().optional(),
      isLabelOnly: z.boolean().optional(),
      feedback: z.string().optional(),
    })
  ),
  duplicateNotes: z.array(z.string()).optional(),
  feedback: z.string(),
  xpAwarded: z.number(),
});

export const CausalChainSchema = z.object({
  valid: z.boolean(),
  score: z.number().min(0).max(5),
  scorePercentage: z.number().min(0).max(100),
  advancement: z.boolean(),
  causalConnection: z.boolean(),
  specificity: z.boolean(),
  proportionality: z.boolean(),
  noCircularity: z.boolean(),
  severityInflationDetected: z.boolean().default(false),
  feedback: z.string(),
  xpAwarded: z.number(),
});

export const WhatHappensNextSchema = z.object({
  valid: z.boolean(),
  advancesReasoning: z.boolean(),
  repeatsPreviousIdea: z.boolean(),
  causalLinkValid: z.boolean(),
  isPlausible: z.boolean().default(true),
  isProportionate: z.boolean().default(true),
  severityInflationDetected: z.boolean().default(false),
  feedback: z.string(),
  score: z.number().min(0).max(5),
  xpAwarded: z.number(),
});

export const ExampleEngineSchema = z.object({
  valid: z.boolean(),
  isConcrete: z.boolean(),
  isRealistic: z.boolean().default(true),
  isRelevant: z.boolean(),
  isConcise: z.boolean().default(true),
  failureMode: z
    .enum([
      "GOOD",
      "TOO_GENERAL",
      "REASON_RESTATED",
      "UNREALISTIC",
      "OVERCOMPLICATED",
      "OVERDRAMATIC",
    ])
    .default("GOOD"),
  hasSpecificPerson: z.boolean().optional(),
  hasContext: z.boolean().optional(),
  hasObservableAction: z.boolean().optional(),
  feedback: z.string(),
  score: z.number().min(0).max(5),
  xpAwarded: z.number(),
});

export const ArgumentBuilderSchema = z.object({
  valid: z.boolean(),
  score: z.number().min(0).max(3),
  scorePercentage: z.number().min(0).max(100),
  argumentQuality: z.enum([
    "PROPOSITION_SPECIFIC",
    "VAGUE_OR_INCOMPLETE",
    "CATEGORY_RESTATEMENT",
    "IRRELEVANT",
  ]),
  feedback: z.string(),
  xpAwarded: z.number(),
});

export const BuildParagraphSchema = z.object({
  valid: z.boolean(),
  functionsDetected: z.object({
    reason: z.boolean(),
    explanation: z.boolean(),
    example: z.boolean(),
    consequence: z.boolean(),
    link: z.boolean(),
  }),
  scores: z.object({
    reasoningQuality: z.number().min(0).max(100),
    repetition: z.number().min(0).max(100),
    specificity: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
  }),
  overallScore: z.number().min(0).max(100),
  feedback: z.string(),
  xpAwarded: z.number(),
});

export const FixWeakLinkSchema = z.object({
  valid: z.boolean(),
  identifiedCorrectWeakIndex: z.boolean(),
  rewriteScore: z.number().min(0).max(5),
  scorePercentage: z.number().min(0).max(100),
  feedback: z.string(),
  xpAwarded: z.number(),
});

export const SentenceForgeSchema = z.object({
  valid: z.boolean(),
  combinedSuccessfully: z.boolean(),
  usesLogicalConjunction: z.boolean(),
  feedback: z.string(),
  xpAwarded: z.number(),
});

export const ThreeParagraphPlanSchema = z.object({
  valid: z.boolean(),
  positionClear: z.boolean(),
  distinctCount: z.number(),
  argumentsQuality: z.string(),
  feedback: z.string(),
  score: z.number().min(0).max(100),
  xpAwarded: z.number(),
});

const SentenceEvalSchema = z.object({
  field: z.enum(["SAY", "WHY", "EXAMPLE", "RESULT", "LINK"]),
  label: z.string().default(""),
  text: z.string().default(""),
  score: z.number().min(1).max(5),
  feedback: z.string(),
  performsFunction: z.boolean(),
  advancesArgument: z.boolean(),
});

export const ParagraphBuilderSchema = z.object({
  valid: z.boolean(),
  clearReason: z.boolean(),
  whyAddsExplanation: z.boolean(),
  concreteRelevantExample: z.boolean(),
  logicalProportionateResult: z.boolean(),
  linkAnswersProposition: z.boolean(),
  progressionNoSemanticRepetition: z.boolean(),
  promptFidelityScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  weakestField: z.enum(["SAY", "WHY", "EXAMPLE", "RESULT", "LINK"]),
  weakestReason: z.string(),
  sentenceEvaluations: z.object({
    SAY: SentenceEvalSchema,
    WHY: SentenceEvalSchema,
    EXAMPLE: SentenceEvalSchema,
    RESULT: SentenceEvalSchema,
    LINK: SentenceEvalSchema,
  }),
  feedback: z.string(),
  xpAwarded: z.number(),
});

export const ParagraphRewriteSchema = z.object({
  valid: z.boolean(),
  field: z.enum(["SAY", "WHY", "EXAMPLE", "RESULT", "LINK"]),
  originalText: z.string(),
  rewrittenText: z.string(),
  improved: z.boolean(),
  feedback: z.string(),
  xpAwarded: z.number(),
});

export const LogicQuestionGenerationSchema = z.object({
  id: z.string(),
  category: z.string(),
  subSkill: z.string(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  premises: z.string(),
  question: z.string(),
  options: z.array(
    z.object({
      id: z.enum(["A", "B", "C", "D"]),
      text: z.string(),
    })
  ).length(4),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string(),
  commonErrorFeedback: z.record(z.string()).optional(),
  qualityVerification: z.object({
    unambiguousCorrectAnswer: z.boolean(),
    premisesSufficient: z.boolean(),
    ageAppropriateGrade5: z.boolean(),
    distractorsPlausible: z.boolean(),
  }),
});

export const ClearAndCompleteSchema = z.object({
  valid: z.boolean(),
  scorePercentage: z.number().min(0).max(100),
  logicalCompleteness: z.number().min(1).max(5),
  efficiency: z.number().min(1).max(5),
  clarity: z.number().min(1).max(5),
  sentenceControl: z.number().min(1).max(5),
  precision: z.number().min(1).max(5),
  diagnoses: z.array(
    z.enum([
      "CLEAR_COMPLETE",
      "UNDEREXPLAINED",
      "MISSING_LOGICAL_STEP",
      "RESTATES_CLAIM",
      "OVEREXPLAINED",
      "UNNECESSARY_CAUSAL_EXTENSION",
      "REPETITIVE",
      "AWKWARD_CONSTRUCTION",
      "OVERGENERALISATION",
      "OFF_TOPIC",
    ])
  ),
  feedback: z.string(),
  modelAnswer: z.string(),
  xpAwarded: z.number(),
});

export const ClearAndCompleteRewriteSchema = z.object({
  valid: z.boolean(),
  improved: z.boolean(),
  scorePercentage: z.number().min(0).max(100),
  feedback: z.string(),
  xpAwarded: z.number(),
});

export const SentenceSprintSchema = z.object({
  valid: z.boolean(),
  complete: z.number().min(1).max(5),
  clear: z.number().min(1).max(5),
  controlled: z.number().min(1).max(5),
  efficient: z.number().min(1).max(5),
  diagnosis: z
    .enum(["AWKWARD", "VERBOSE", "MISSING_STEP", "REPETITIVE", "OVEREXPLAINED", "OK"])
    .optional(),
  feedback: z.string(),
});

export const SentenceGymEvaluationSchema = z.object({
  valid: z.boolean().default(true),
  rating: z.enum(["Strong", "Almost", "Needs work"]),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  improvedSentence: z.string().optional(),
});

export const SentenceGymGenSchema = z.object({
  id: z.string(),
  type: z.enum(["builder", "bridge", "fix_compress", "next_sentence"]),
  domain: z.string(),
  title: z.string().optional(),
  notes: z.array(z.string()).optional(),
  pointA: z.string().optional(),
  conclusionC: z.string().optional(),
  weakSentence: z.string().optional(),
  sentence1: z.string().optional(),
  promptInstruction: z.string(),
  modelAnswer: z.string().optional(),
});

export const SentenceRetrainingDefectEnum = z.enum([
  "VAGUE_SUBJECT",
  "VAGUE_VERB",
  "AWKWARD_COLLOCATION",
  "MISSING_MECHANISM",
  "GRAMMATICAL_ERROR",
  "REPETITION",
  "UNNECESSARY_WORDS",
  "SENTENCE_FRAGMENT",
  "RUN_ON_SENTENCE",
  "MEANING_CHANGED",
]);

const NullableOptString = z
  .string()
  .nullable()
  .optional()
  .transform((v) =>
    v && v.trim().length > 0 && v.trim().toLowerCase() !== "null"
      ? v.trim()
      : undefined
  );

export const SentenceRetrainingSchema = z.object({
  valid: z
    .boolean()
    .nullable()
    .optional()
    .transform((v) => v ?? true),
  score: z.number().min(0).max(10).nullable().optional(),
  passed: z.boolean().nullable().optional(),
  clarity: z.number().int().min(0).max(2),
  naturalness: z.number().int().min(0).max(2),
  precision: z.number().int().min(0).max(2),
  causalCompleteness: z.number().int().min(0).max(2),
  compliance: z.number().int().min(0).max(2),
  defect: SentenceRetrainingDefectEnum.nullable()
    .optional()
    .transform((v) => v ?? undefined),
  problematicPhrase: NullableOptString,
  feedback: z.string().min(1),
  structuralDifference: NullableOptString,
  prohibitedOpening: NullableOptString,
  xpAwarded: z.number().nullable().optional(),
});

export interface SentenceRetrainingInput {
  drillType: SentenceRetrainingDrillType;
  targetSkillOrError?: SentenceRetrainingErrorType;
  originalSentence?: string;
  context?: string;
  notes?: string[];
  constraint?: RetrainingConstraintType;
  constraintDescription?: string;
  proposition?: string;
  modelAnswer?: string;
  structuralExplanation?: string;
  studentText: string;
  attemptNumber?: number;
  prohibitedOpening?: string | null;
  selectedModel?: string;
}

export function calcRetrainingXp(
  passed: boolean,
  isIndependent: boolean,
  attemptNumber: number = 1
): number {
  if (!passed) return 2;
  const base = isIndependent ? 20 : 15;
  if (attemptNumber <= 1) return base;
  if (attemptNumber === 2) return Math.round(base * 0.5);
  return Math.round(base * 0.25);
}

export function buildSentenceRetrainingPrompts(input: SentenceRetrainingInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const {
    drillType,
    targetSkillOrError,
    originalSentence,
    context,
    notes,
    constraint,
    constraintDescription,
    proposition,
    modelAnswer,
    studentText,
    attemptNumber = 1,
    prohibitedOpening,
  } = input;

  let drillSpecificSection = "";

  if (drillType === "rebuild") {
    drillSpecificSection = `DRILL MODE: REBUILD
CONTEXT: "${context || "N/A"}"
ORIGINAL AWKWARD SENTENCE TO REBUILD: "${originalSentence || "N/A"}"
TARGET PROBLEM TO FIX: "${targetSkillOrError || "VAGUE_OR_AWKWARD_CONSTRUCTION"}"
REFERENCE MODEL ANSWER: "${modelAnswer || "N/A"}"

REBUILD GRADING CRITERIA:
1. Did the student correct the targeted problem (${targetSkillOrError || "vague/awkward construction"})?
   - If the original sentence had vague outcomes (e.g. "become healthier and build communities", "makes things better") and the student merely kept those vague outcomes while pasting the context in front, penalise precision (<=1), causalCompleteness (<=1), and compliance (<=1).
2. Did the student preserve the intended meaning (combining the context and core claim accurately)?
3. Did the student produce a clear, grammatical sentence?
   - Check carefully for subject–verb agreement (e.g. gerund subjects like "Replacing central car parks with public parks" take singular verb "helps" or "gives", NOT "help" or "give").
4. Reusing necessary subject nouns from the context or original sentence is completely acceptable.`;
  } else if (drillType === "constrained") {
    drillSpecificSection = `DRILL MODE: CONSTRAINED CONSTRUCTION
NOTES PROVIDED: ${JSON.stringify(notes || [])}
CONSTRAINT TYPE: "${constraint || "N/A"}"
CONSTRAINT DESCRIPTION: "${constraintDescription || "N/A"}"
REFERENCE MODEL ANSWER: "${modelAnswer || "N/A"}"

CONSTRAINED GRADING CRITERIA:
1. Did the student communicate the essential information from the notes?
2. Did the student meet the educational purpose of the constraint?
3. Did the student produce a clear, natural, and concise sentence?
4. CRITICAL — DISTINGUISH REASONING FROM CONNECTOR FORMATTING:
   - For causal conjunction exercises, ACCEPT valid alternative constructions (such as conditional "If..., ...", temporal "When..., ...", "as", "since", or participial "-ing" clauses like ", reducing...") when they communicate the mechanism clearly.
   - NEVER diagnose "MISSING_MECHANISM" or reduce causalCompleteness solely because the student did not use the literal words "because", "by", or "so". If the causal mechanism is clearly expressed through another grammatical structure, award causalCompleteness = 2 and compliance >= 1 (or 2 if natural).`;
  } else {
    drillSpecificSection = `DRILL MODE: INDEPENDENT ARGUMENT SENTENCE
UNSEEN PROPOSITION: "${proposition || "N/A"}"
REFERENCE MODEL ANSWER: "${modelAnswer || "N/A"}"

INDEPENDENT GRADING CRITERIA:
1. Did the student express a proposition-specific argument?
2. Did the student explain a plausible reason or mechanism connecting the action/policy to a concrete outcome?
3. Did the student use clear, economical, and grammatically correct language?
4. CRITICAL: Do NOT award full marks (or passing marks) for repeating the proposition verbatim followed by a wordy connector (e.g. "due to the fact that") and a vague or implausible benefit (e.g. "because it can make them fitter, and want to work more" or "make people healthier and exercise more" without explaining how).`;
  }

  const systemPrompt = `You are a calibrated, strict Australian Grade 5 scholarship exam writing coach evaluating a single sentence in "Sentence Retraining Mode".

${drillSpecificSection}
${prohibitedOpening ? `PROHIBITED OPENING (Student must NOT begin with this): "${prohibitedOpening}"` : ""}

EVALUATION RUBRIC — Score each of the 5 dimensions independently as 0, 1, or 2:

A. clarity (0–2)
   2 = Meaning immediately understandable; pronoun references and relationships are clear.
   1 = Meaning understandable but requires rereading or contains minor ambiguity (e.g. ambiguous "it" without a clear singular noun antecedent, or awkward modifier placement like "should be only paid").
   0 = Meaning substantially unclear, contradictory, or difficult to reconstruct.

B. naturalness (0–2) [Naturalness and grammar]
   2 = Grammatically sound, natural expression without unnecessary complexity.
   1 = Minor grammatical errors (e.g. single subject–verb disagreement like "Replacing car parks ... help" in an otherwise clear sentence), awkward phrasing, or avoidable verbosity (e.g. "due to the fact that" instead of "because", or unnecessarily repeating the entire prompt).
   0 = Serious grammatical or structural problems (e.g. comma splice, run-on sentence, sentence fragment, or broken syntax) that interfere with comprehension.

C. precision (0–2)
   2 = Specific, relevant, concrete information; avoids vague or generic claims.
   1 = Relevant but somewhat vague, repetitive, or imprecise (e.g. generic outcomes like "become healthier", "build communities", "make them fitter, and want to work more").
   0 = Mostly generic, circular, irrelevant, or insufficiently specific (e.g. "makes things better", "is good for everyone").

D. causalCompleteness (0–2)
   2 = A plausible mechanism connects the action or claim to its consequence (or, for non-causal descriptive/contrast tasks, the sentence fully performs its intended explanatory function).
   1 = The causal relationship is plausible but incompletely explained (missing the intermediate step showing how the action causes the outcome, e.g. jumping from wider footpaths to "exercise more" without explaining how footpaths encourage walking).
   0 = No meaningful causal connection, circular reasoning (restating the claim as the reason), or an implausible leap (e.g. claiming household chores make children physically "fitter").

E. compliance (0–2) [Task compliance]
   2 = Meets the exercise's meaningful requirements.
   1 = Minor deviation that does not undermine the learning objective (e.g. using a clear conditional or participial clause instead of a listed conjunction, or compressing a minor descriptive modifier while preserving all core ideas).
   0 = Fails the central requirement (e.g. fails to fix the target problem in Rebuild, contradicts the original meaning, omits a whole causal step in Constrained, ignores the proposition, or copies a prohibited opening).

SCORING SAFEGUARDS:
- Do NOT penalise a sentence merely for being short. A concise 8–14 word sentence that is clear and complete earns full marks.
- Do NOT reward unnecessary complexity or length.
- Do NOT treat the presence of words like "because", "therefore", or "so" as proof of causal reasoning.
- Do NOT treat their absence as proof that causal reasoning is missing.
- Minor grammatical errors in an otherwise strong sentence should receive a proportionate deduction (naturalness = 1, defect = "GRAMMATICAL_ERROR") rather than zeros across other dimensions.

DEFECT TAXONOMY (Set "defect" to the single primary flaw if any dimension < 2, or null if all dimensions are 2):
"VAGUE_SUBJECT" | "VAGUE_VERB" | "AWKWARD_COLLOCATION" | "MISSING_MECHANISM" | "GRAMMATICAL_ERROR" | "REPETITION" | "UNNECESSARY_WORDS" | "SENTENCE_FRAGMENT" | "RUN_ON_SENTENCE" | "MEANING_CHANGED" | null

STUDENT FEEDBACK REQUIREMENTS:
Feedback must be concise, child-friendly (Grade 5), and actionable.
For each attempt:
- If the sentence is strong (score 9–10, no defect): state briefly why it works without generic praise.
  Example:
  Student: "Community gardens provide vegetables for local families, reducing their grocery bills."
  Feedback: "Clear and specific. You explain how community gardens can save families money."
- If correction is needed (any dimension < 2):
  1. State the most important problem (if there is both a grammar error like subject–verb disagreement and a missing mechanism, briefly mention both as in Example 1).
  2. Explain briefly why it affects the sentence.
  3. Provide ONE improved version prefixed with "Better: '...'".
  Example 1:
  Student: "Replacing car parks with public parks help people become healthier."
  Feedback: "Use 'helps', not 'help'. Also explain what people can do in the parks. Better: 'Replacing car parks with public parks gives residents more places to exercise.'"
  Example 2:
  Student: "Children should do chores because it makes them fitter and want to work more."
  Feedback: "The reason is unclear. Household chores are more directly connected to responsibility than fitness. Better: 'Doing household chores teaches children to contribute to their family.'"
- Never give generic praise to weak sentences. Do not overwhelm the student with multiple corrections.

Return JSON strictly matching:
{
  "valid": true,
  "clarity": 0 | 1 | 2,
  "naturalness": 0 | 1 | 2,
  "precision": 0 | 1 | 2,
  "causalCompleteness": 0 | 1 | 2,
  "compliance": 0 | 1 | 2,
  "defect": "VAGUE_SUBJECT" | "VAGUE_VERB" | "AWKWARD_COLLOCATION" | "MISSING_MECHANISM" | "GRAMMATICAL_ERROR" | "REPETITION" | "UNNECESSARY_WORDS" | "SENTENCE_FRAGMENT" | "RUN_ON_SENTENCE" | "MEANING_CHANGED" | null,
  "problematicPhrase": "exact problematic phrase from student sentence, or null",
  "feedback": "Concise actionable feedback (including Better: '...' when correction is needed)",
  "structuralDifference": "One short sentence comparing structure with model answer, or null",
  "prohibitedOpening": "Opening words to prohibit on retry if defect is VAGUE_SUBJECT, or null"
}`;

  const userPrompt = `STUDENT RESPONSE (Attempt #${attemptNumber}):
"${studentText.trim()}"`;

  return { systemPrompt, userPrompt };
}

export function computeRetrainingScoreAndVerdict(
  rawParsed: z.infer<typeof SentenceRetrainingSchema>,
  input: SentenceRetrainingInput,
  modelUsed?: string
): SentenceRetrainingEvaluation {
  const text = (input.studentText || "").trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);

  let clarity = rawParsed.clarity;
  let naturalness = rawParsed.naturalness;
  let precision = rawParsed.precision;
  let causalCompleteness = rawParsed.causalCompleteness;
  let compliance = rawParsed.compliance;
  let defect: SentenceRetrainingErrorType | undefined = rawParsed.defect;
  let problematicPhrase = rawParsed.problematicPhrase;
  let feedback = rawParsed.feedback;
  let prohibitedOpening = rawParsed.prohibitedOpening || input.prohibitedOpening || undefined;

  // Deterministic pre-check 1: Reused prohibited opening from prior attempt
  if (
    input.prohibitedOpening &&
    lower.startsWith(input.prohibitedOpening.trim().toLowerCase())
  ) {
    compliance = 0;
    clarity = Math.min(clarity, 1);
    defect = "VAGUE_SUBJECT";
    problematicPhrase = text.slice(0, input.prohibitedOpening.trim().length);
    feedback = `Do not start with '${problematicPhrase}'. Begin directly with the specific subject. Better: '${input.modelAnswer || "Name the specific action or group first."}'`;
  }

  // Deterministic pre-check 2: Exact verbatim copy of originalSentence in Rebuild mode
  if (
    input.drillType === "rebuild" &&
    input.originalSentence &&
    lower === input.originalSentence.trim().toLowerCase()
  ) {
    compliance = 0;
    defect = "REPETITION";
    problematicPhrase = text;
    feedback = `You copied the original sentence without rebuilding it. Rewrite the sentence to fix the problem. Better: '${input.modelAnswer || ""}'`;
  }

  // Deterministic pre-check 3: Incomplete fragment (< 4 words)
  if (words.length < 4) {
    clarity = Math.min(clarity, 1);
    naturalness = 0;
    causalCompleteness = 0;
    defect = "SENTENCE_FRAGMENT";
  }

  // Safeguard: If GRAMMATICAL_ERROR, RUN_ON_SENTENCE, or SENTENCE_FRAGMENT is diagnosed,
  // naturalness cannot be 2/2.
  if (
    defect === "GRAMMATICAL_ERROR" ||
    defect === "RUN_ON_SENTENCE" ||
    defect === "SENTENCE_FRAGMENT"
  ) {
    if (naturalness === 2) {
      naturalness = 1;
    }
  }

  // Safeguard: If MISSING_MECHANISM is diagnosed, causalCompleteness cannot be 2/2.
  if (defect === "MISSING_MECHANISM" && causalCompleteness === 2) {
    causalCompleteness = 1;
  }

  // Server-side sum of the 5 dimensions (never trust LLM-supplied total score)
  let score =
    clarity + naturalness + precision + causalCompleteness + compliance;

  // Safeguard 1: Serious clarity or grammar failure (0 in clarity or naturalness, or structural run-on/fragment)
  // cannot pass or receive high marks (capped at <= 6/10).
  if (
    clarity === 0 ||
    naturalness === 0 ||
    defect === "RUN_ON_SENTENCE" ||
    defect === "SENTENCE_FRAGMENT"
  ) {
    score = Math.min(score, 6);
  }

  // Safeguard 2: Any grammar/clarity impairment (naturalness <= 1 or clarity <= 1 or GRAMMATICAL_ERROR)
  // cannot receive 9–10/10 (max 8/10 for a minor error in an otherwise strong sentence).
  if (
    defect === "GRAMMATICAL_ERROR" ||
    naturalness <= 1 ||
    clarity <= 1
  ) {
    score = Math.min(score, 8);
  }

  // Safeguard 3: No meaningful causal mechanism (causalCompleteness === 0) cannot pass (capped at <= 6/10).
  // Incomplete causal mechanism (causalCompleteness === 1 or MISSING_MECHANISM) cannot receive full marks (max 8/10).
  if (causalCompleteness === 0) {
    score = Math.min(score, 6);
  } else if (causalCompleteness === 1 || defect === "MISSING_MECHANISM") {
    score = Math.min(score, 8);
  }

  // Safeguard 4: Zero on precision or compliance cannot pass (capped at <= 6/10).
  if (precision === 0 || compliance === 0 || defect === "MEANING_CHANGED") {
    score = Math.min(score, 6);
  }

  // Safeguard 5: If any defect is flagged, sentence cannot receive 10/10.
  if (defect && score === 10) {
    score = 9;
  }

  const hasZeroDimension =
    clarity === 0 ||
    naturalness === 0 ||
    precision === 0 ||
    causalCompleteness === 0 ||
    compliance === 0;

  const hasDisqualifyingDefect =
    defect === "RUN_ON_SENTENCE" ||
    defect === "SENTENCE_FRAGMENT" ||
    defect === "MEANING_CHANGED" ||
    (defect === "MISSING_MECHANISM" && causalCompleteness === 0);

  const passed = score >= 7 && !hasZeroDimension && !hasDisqualifyingDefect;
  if (!passed && score > 6) {
    score = 6;
  }

  // Set prohibitedOpening if VAGUE_SUBJECT flagged and opening starts with This/It/There
  if (
    defect === "VAGUE_SUBJECT" &&
    !prohibitedOpening &&
    /^(this|it|there)\b/i.test(text)
  ) {
    prohibitedOpening = words.slice(0, 2).join(" ");
  }

  const xpAwarded = calcRetrainingXp(
    passed,
    input.drillType === "independent",
    input.attemptNumber || 1
  );

  return {
    valid: true,
    score,
    passed,
    clarity,
    naturalness,
    precision,
    causalCompleteness,
    compliance,
    defect: defect || undefined,
    problematicPhrase: problematicPhrase || undefined,
    feedback,
    structuralDifference:
      rawParsed.structuralDifference ||
      input.structuralExplanation ||
      undefined,
    prohibitedOpening: prohibitedOpening || undefined,
    xpAwarded,
    evaluationSource: "ai",
    rubricVersion: 2,
    modelUsed: modelUsed || input.selectedModel || DEFAULT_MODEL,
  };
}

export async function evaluateSentenceRetraining(
  input: SentenceRetrainingInput,
  llmCaller: typeof callOpenRouter = callOpenRouter
): Promise<SentenceRetrainingEvaluation> {
  const { systemPrompt, userPrompt } = buildSentenceRetrainingPrompts(input);
  const modelToUse =
    input.selectedModel ||
    process.env.OPENROUTER_PRIMARY_MODEL ||
    DEFAULT_MODEL;

  let lastErr: Error | null = null;

  // Limited retry (max 2 attempts total) if schema validation fails on first response
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await llmCaller(
        systemPrompt,
        userPrompt,
        modelToUse,
        1000,
        attempt === 0 ? 1 : 0
      );
      const parsed = SentenceRetrainingSchema.parse(raw);
      return computeRetrainingScoreAndVerdict(parsed, input, modelToUse);
    } catch (err: any) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      const isZod = err?.name === "ZodError";
      console.error(
        `[SentenceRetraining] Evaluation failure (attempt ${attempt + 1}/2, model="${modelToUse}", type="${isZod ? "SCHEMA_VALIDATION" : "API_ERROR"}"):`,
        isZod ? JSON.stringify(err.issues) : lastErr.message
      );
      const isNonRetryableApiError =
        lastErr.message === "MISSING_API_KEY" ||
        lastErr.message.startsWith("OPENROUTER_HTTP_400") ||
        lastErr.message.startsWith("OPENROUTER_HTTP_401") ||
        lastErr.message.startsWith("OPENROUTER_HTTP_403") ||
        lastErr.message.startsWith("OPENROUTER_HTTP_404");
      if (isNonRetryableApiError || attempt >= 1) {
        break;
      }
    }
  }

  throw lastErr || new Error("SENTENCE_RETRAINING_EVALUATION_FAILED");
}


