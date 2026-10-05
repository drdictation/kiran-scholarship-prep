import { z } from "zod";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || "google/gemini-2.5-flash";

export async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  modelOverride?: string,
  maxTokens: number = 750
) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("MISSING_API_KEY");
  }

  const selectedModel = modelOverride || DEFAULT_MODEL;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
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
    const errorText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content received from OpenRouter");
  }

  return JSON.parse(content);
}

// Zod schemas for strict output validation
export const IdeaSprintSchema = z.object({
  valid: z.boolean(),
  distinctCount: z.number().min(0).max(3),
  arguments: z.array(
    z.object({
      index: z.number(),
      text: z.string(),
      relevant: z.boolean(),
      category: z.string().optional(),
    })
  ),
  duplicateNotes: z.array(z.string()).optional(),
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
  score: z.number().min(1).max(5),
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
  score: z.number().min(1).max(5),
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
