import { NextRequest, NextResponse } from "next/server";
import {
  callOpenRouter,
  IdeaSprintSchema,
  CausalChainSchema,
  WhatHappensNextSchema,
  ExampleEngineSchema,
  ArgumentBuilderSchema,
  BuildParagraphSchema,
  FixWeakLinkSchema,
  SentenceForgeSchema,
  ThreeParagraphPlanSchema,
  ParagraphBuilderSchema,
  ParagraphRewriteSchema,
  LogicQuestionGenerationSchema,
  ClearAndCompleteSchema,
  ClearAndCompleteRewriteSchema,
  SentenceSprintSchema,
} from "@/lib/ai/openrouter";

const VAGUE_TERMS = [
  "happier",
  "happy",
  "better",
  "successful",
  "success",
  "wellbeing",
  "affected",
  "good",
  "bad",
  "nice",
];

const CATEGORY_WORDS = [
  "health",
  "money",
  "safety",
  "environment",
  "community",
  "fairness",
  "education",
  "happiness",
  "wellbeing",
  "freedom",
  "nature",
  "society",
  "finance",
  "values",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { exerciseType, payload } = body;
    const selectedModel = payload?.selectedModel || body?.selectedModel;

    const hasApiKey = Boolean(process.env.OPENROUTER_API_KEY);

    switch (exerciseType) {
      /* ============================================================
         1. IDEA SPRINT (Strict 0-6 Scoring, Independent Points)
         ============================================================ */
      case "idea_sprint": {
        const { topic, args } = payload;
        const ideas = Array.isArray(args) ? args : [];

        if (!hasApiKey) {
          // Heuristic fallback
          let totalRaw = 0;
          const evaluatedArgs = ideas.map((text: string, i: number) => {
            const clean = (text || "").trim().toLowerCase();
            const words = clean.split(/\s+/).filter(Boolean);

            let score = 0;
            let isLabelOnly = false;
            let feedback = "";

            if (words.length <= 2 && CATEGORY_WORDS.includes(clean)) {
              score = 0;
              isLabelOnly = true;
              feedback = "Category label only; state a complete proposition-specific claim.";
            } else if (clean.length < 15 || clean.startsWith("it helps ") || clean.startsWith("it is good")) {
              score = 1;
              feedback = "Relevant but vague; specify the exact mechanism.";
            } else if (clean.length >= 25) {
              score = 2;
              feedback = "Clear, proposition-specific claim.";
            } else {
              score = 1;
              feedback = "Needs more specific causal detail.";
            }

            totalRaw += score;
            return {
              index: i + 1,
              text,
              score,
              relevant: score > 0,
              category: "General",
              isLabelOnly,
              feedback,
            };
          });

          // Check distinctness among valid arguments
          const validArgs = evaluatedArgs.filter((a) => a.score > 0);
          const distinct = validArgs.length;
          const scorePercentage = Math.round((totalRaw / 6) * 100);

          return NextResponse.json({
            valid: true,
            distinctCount: distinct,
            totalRawScore: totalRaw,
            scorePercentage,
            arguments: evaluatedArgs,
            duplicateNotes: totalRaw < 4 ? ["Category labels are not arguments. Turn broad themes into complete claims."] : [],
            feedback:
              totalRaw >= 5
                ? "Strong idea sprint with proposition-specific arguments."
                : totalRaw <= 2
                ? "You wrote category names or vague claims. Turn each lens into a complete argument."
                : "Good start, but one or more points need a concrete causal claim.",
            xpAwarded: Math.max(10, Math.round((totalRaw / 6) * 45)),
            assessmentPrompt: "Grade 5 Scholarship Heuristic: 0=label/irrelevant, 1=vague, 2=proposition-specific argument.",
          });
        }

        const systemPrompt = `You are a strict, calibrated Grade 5 Australian scholarship exam writing coach.
Evaluate 3 ideas for the proposition: "${topic}".

CORE DIAGNOSIS & RULES:
- Category names (e.g. "Health", "Money", "Environment", "Happiness", "Education") are NOT arguments and score ZERO.
- A point only counts as an argument if it contains a proposition-specific claim with an observable mechanism.
- Score each of the 3 ideas independently (0, 1, or 2):
  0 = label only / irrelevant / incomprehensible (e.g. "Health", "Money", "Wider thinking")
  1 = relevant but vague (e.g. "It can help health", "It affects money")
  2 = clear proposition-specific argument (e.g. "Research developed for space travel leads to medical inventions used on Earth")

DISTINCTNESS:
- Only judge distinctness AFTER determining that ideas are valid arguments (score > 0).
- Category labels must NEVER receive 100% distinctness or 100% total score!
- If valid arguments overlap or repeat the same underlying reason with synonyms, flag in 'duplicateNotes' and penalize distinctCount.

CALIBRATION ANCHORS:
- "Health / Money / Wider thinking" on "Reading develops imagination" -> Low score (~17-33%, 1 or 2 total out of 6). Labels are not arguments.
- Three arguments that merely repeat the same point ("Readers picture characters in mind / Books allow mental images / Reading imagines unseen events") -> Overlapping; penalize distinctCount.

FEEDBACK RULE:
- Maximum 2 sentences: Sentence 1 identifies the exact problem; Sentence 2 gives the immediate fix. Avoid generic praise like "Great job" unless totalRawScore >= 5.

Return JSON adhering strictly to:
{
  "valid": true,
  "distinctCount": number (0 to 3),
  "totalRawScore": number (0 to 6, sum of 3 argument scores),
  "scorePercentage": number (0 to 100: 6=100, 5=83, 4=67, 3=50, 2=33, 1=17, 0=0),
  "arguments": [
    {
      "index": 1,
      "text": string,
      "score": number (0, 1, or 2),
      "relevant": boolean,
      "category": string,
      "isLabelOnly": boolean,
      "feedback": "1 short diagnostic sentence"
    }
  ],
  "duplicateNotes": [string explaining if any points overlap or repeat],
  "feedback": "Max 2 sentences: 1 identifying the problem, 1 giving the immediate fix",
  "xpAwarded": number (e.g. 45 for 6/6, 35 for 5/6, 25 for 4/6, 15 for 3/6, 10 for <=2)
}`;

        const raw = await callOpenRouter(
          systemPrompt,
          JSON.stringify({ topic, arguments: ideas }),
          selectedModel
        );
        const validated = IdeaSprintSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      /* ============================================================
         2. CAUSAL CHAIN / WHAT HAPPENS NEXT (3-Stage Causal Progression)
         ============================================================ */
      case "causal_chain":
      case "what_happens_next": {
        const {
          topic,
          point,
          immediateEffect,
          furtherConsequence,
          significance,
          studentConsequence,
          studentSignificance,
        } = payload;

        // Support both old and new payload naming
        const step1 = (immediateEffect || studentConsequence || "").trim();
        const step2 = (furtherConsequence || "").trim();
        const step3 = (significance || studentSignificance || "").trim();

        const combinedText = `${step1} ${step2} ${step3}`.toLowerCase();

        const hasVagueWords = VAGUE_TERMS.some((w) =>
          combinedText.match(new RegExp(`\\b${w}\\b`, "i"))
        );
        const hasSevereKeywords =
          combinedText.includes("depress") ||
          combinedText.includes("therap") ||
          combinedText.includes("suicid") ||
          combinedText.includes("hospital") ||
          combinedText.includes("ruined life") ||
          combinedText.includes("hate him");

        if (!hasApiKey) {
          const isTooShort = step1.length < 15 || (step2 && step2.length < 15) || step3.length < 15;
          let score = 5;
          if (hasSevereKeywords) score = 2;
          else if (hasVagueWords) score = 2;
          else if (isTooShort) score = 2;
          else score = 4;

          const percentage = Math.round((score / 5) * 100);

          return NextResponse.json({
            valid: true,
            score,
            scorePercentage: percentage,
            advancement: score >= 3,
            causalConnection: score >= 3,
            specificity: !hasVagueWords,
            proportionality: !hasSevereKeywords,
            noCircularity: true,
            severityInflationDetected: hasSevereKeywords,
            feedback: hasVagueWords
              ? "You used vague terms like happier/successful instead of a concrete effect. Specify what tangible change occurs."
              : hasSevereKeywords
              ? "Watch out for exaggerated leaps; keep consequences realistic and proportionate."
              : "Clear causal progression moving logically from cause to consequence to significance.",
            xpAwarded: score >= 4 ? 40 : score >= 3 ? 25 : 15,
            assessmentPrompt: "Grade 5 Scholarship Causal Chain Rubric: 0-5 scale on Advancement, Causal Connection, Specificity, Proportionality, No Circularity.",
          });
        }

        const systemPrompt = `You are an expert Australian scholarship exam writing coach for Grade 5.
Evaluate this 3-stage CAUSAL CHAIN:
Topic: "${topic}"
Starting Point: "${point}"

Student's Steps:
Step 1: Immediate Effect (What literally happens next?): "${step1}"
Step 2: Further Consequence (What happens because of that?): "${step2 || "Skipped / not provided"}"
Step 3: Significance (Why does this matter?): "${step3}"

GRADING DIMENSIONS:
A. Advancement: Does each step introduce something genuinely new, or does it circle back and repeat?
B. Causal Connection: Would step B reasonably happen because of step A?
C. Specificity: Does the student describe a concrete effect instead of vague terms ("happier", "better", "successful", "wellbeing", "affected", "good", "bad")?
D. Proportionality: No absurd or exaggerated leap / catastrophizing (e.g. jumping from minor event to depression, ruin, therapy).
E. No Circularity: The final sentence must NOT simply restate the original claim.

SCORING (0 to 5):
5: Clear 3-stage causal progression; specific, plausible, non-repetitive, zero vague filler terms.
4: Strong progression with one slightly vague link.
3: Basic causal idea but one major weak/vague step (e.g. jumped to "happier" or skips mechanism).
2: Mostly vague, partially circular, or poorly connected.
1: Very weak / repetitive.
0: Irrelevant.

DO NOT give 4 or 5 merely because the student wrote 3 sentences!
DO NOT give 4 or 5 if endings are vague like "people become happier" or "they become successful".

FEEDBACK RULE:
Maximum 2 sentences:
Sentence 1: Identify the exact weak link or flaw.
Sentence 2: Give the immediate concrete fix.

Return JSON adhering strictly to:
{
  "valid": true,
  "score": number (0 to 5),
  "scorePercentage": number (0 to 100: 5=100, 4=80, 3=60, 2=40, 1=20, 0=0),
  "advancement": boolean,
  "causalConnection": boolean,
  "specificity": boolean,
  "proportionality": boolean,
  "noCircularity": boolean,
  "severityInflationDetected": boolean,
  "feedback": "Max 2 sentences: 1 problem, 1 immediate fix",
  "xpAwarded": number (40 for 5, 30 for 4, 20 for 3, 10 for <=2)
}`;

        const raw = await callOpenRouter(
          systemPrompt,
          "Evaluate this causal chain.",
          selectedModel
        );
        const validated = CausalChainSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      /* ============================================================
         3. EXAMPLE ENGINE (Observable Scenario, No Compulsory Name)
         ============================================================ */
      case "example_engine": {
        const { topic, argument, studentExample } = payload;
        const exText = (studentExample || "").trim();
        const exLower = exText.toLowerCase();

        if (!hasApiKey) {
          const isTooShort = exText.length < 25;
          const isRestatement = exLower.includes("because") && exLower.length < 40;
          let failureMode: "GOOD" | "TOO_GENERAL" | "REASON_RESTATED" | "UNREALISTIC" | "OVERCOMPLICATED" | "OVERDRAMATIC" = "GOOD";
          let score = 4;

          if (isRestatement) {
            failureMode = "REASON_RESTATED";
            score = 2;
          } else if (isTooShort) {
            failureMode = "TOO_GENERAL";
            score = 2;
          }

          return NextResponse.json({
            valid: true,
            isConcrete: score >= 4,
            isRealistic: true,
            isRelevant: true,
            isConcise: exText.length < 220,
            failureMode,
            hasSpecificPerson: false,
            hasContext: true,
            hasObservableAction: score >= 4,
            feedback:
              score >= 4
                ? "Observable scenario that clearly demonstrates the argument."
                : "This statement merely restates the reason. Describe a specific, observable event showing what actually happens.",
            score,
            xpAwarded: score >= 4 ? 35 : 15,
            assessmentPrompt: "Grade 5 Scholarship Example Rubric: Concrete situation + observable action demonstrating argument.",
          });
        }

        const systemPrompt = `You are an expert Australian scholarship exam writing coach for Grade 5.
Evaluate the student's example for:
Topic: "${topic}"
Argument: "${argument}"
Student's Example: "${studentExample}"

CRITICAL INSTRUCTIONS:
- The goal is: A specific, observable scenario that demonstrates the argument.
- Ask: "Could an examiner picture what actually happened, and does that event demonstrate the argument?"
- DO NOT require a character name (e.g. "Jack"). A named person is NOT what makes evidence strong!
- Reject restatements disguised as examples (e.g. "If an iPad breaks, you can repair it" vs strong: "If an iPad has a cracked screen, replacing only the glass allows the tablet to remain in use rather than manufacturing a new device").

SCORE (0 to 5):
5: Concrete situation + observable action + clearly demonstrates the argument.
4: Useful and specific but missing one minor detail.
3: Relevant example but somewhat generic.
2: Mostly a restatement disguised as an example.
1: Vague / poorly connected.
0: Irrelevant.

FAILURE MODES:
- "GOOD": Concrete scenario demonstrating the argument.
- "TOO_GENERAL": Abstract claim with no observable event.
- "REASON_RESTATED": Simply rephrases the argument with "for example".
- "UNREALISTIC": Absurd in real life.
- "OVERCOMPLICATED": Rambling unnecessary narrative.
- "OVERDRAMATIC": Injects extreme catastrophe, humiliation, or drama.

FEEDBACK RULE:
Maximum 2 sentences: Sentence 1 identifies the flaw; Sentence 2 gives the concrete fix.

Return JSON adhering strictly to:
{
  "valid": true,
  "isConcrete": boolean,
  "isRealistic": boolean,
  "isRelevant": boolean,
  "isConcise": boolean,
  "failureMode": "GOOD" | "TOO_GENERAL" | "REASON_RESTATED" | "UNREALISTIC" | "OVERCOMPLICATED" | "OVERDRAMATIC",
  "hasSpecificPerson": boolean,
  "hasContext": boolean,
  "hasObservableAction": boolean,
  "feedback": "Max 2 sentences: 1 problem, 1 immediate fix",
  "score": number (0 to 5),
  "xpAwarded": number (35 for 5, 28 for 4, 18 for 3, 10 for <=2)
}`;

        const raw = await callOpenRouter(
          systemPrompt,
          "Evaluate the student's example.",
          selectedModel
        );
        const validated = ExampleEngineSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      /* ============================================================
         4. ARGUMENT BUILDER (Convert Category Lens -> Full Argument)
         ============================================================ */
      case "argument_builder": {
        const { topic, lens, studentArgument } = payload;
        const argText = (studentArgument || "").trim();
        const argLower = argText.toLowerCase();

        if (!hasApiKey) {
          const isCategoryOnly =
            argText.split(/\s+/).length <= 3 &&
            (argLower.includes(lens.toLowerCase()) || argLower.startsWith("it is "));
          let score = 3;
          let quality: "PROPOSITION_SPECIFIC" | "VAGUE_OR_INCOMPLETE" | "CATEGORY_RESTATEMENT" | "IRRELEVANT" =
            "PROPOSITION_SPECIFIC";

          if (argText.length < 8 || isCategoryOnly) {
            score = 1;
            quality = "CATEGORY_RESTATEMENT";
          } else if (argText.length < 30) {
            score = 2;
            quality = "VAGUE_OR_INCOMPLETE";
          }

          const scorePercentage = score === 3 ? 100 : score === 2 ? 67 : 33;

          return NextResponse.json({
            valid: true,
            score,
            scorePercentage,
            argumentQuality: quality,
            feedback:
              score === 3
                ? "Excellent conversion! You turned the category into a clear, proposition-specific causal argument."
                : score === 2
                ? "You stated a general point, but omitted the mechanism. Explain how and why this happens."
                : "You merely restated the category name. Turn the lens into a complete claim explaining why it matters.",
            xpAwarded: score === 3 ? 35 : score === 2 ? 20 : 10,
            assessmentPrompt: "Grade 5 Scholarship Argument Builder Rubric: 0-3 scale on category-to-argument conversion.",
          });
        }

        const systemPrompt = `You are a strict Grade 5 Australian scholarship writing coach.
The student was given:
Topic: "${topic}"
Lens / Category: "${lens}"
Student's response turning "${lens}" into ONE complete argument: "${argText}"

SCORING (0 to 3):
3: Clear, proposition-specific causal argument (e.g. Lens: Fairness -> "Free museums allow families with low incomes to learn about history and culture even if they cannot afford admission fees").
2: Relevant claim but vague or incomplete (e.g. "Free museums are good for people who do not have money").
1: Category restatement (e.g. "It is fair", "Fairness is important", "Fairness").
0: Irrelevant.

FEEDBACK RULE:
Maximum 2 sentences:
Sentence 1: State whether this is an argument or merely a category restatement.
Sentence 2: Give the immediate fix to make it proposition-specific.

Return JSON adhering strictly to:
{
  "valid": true,
  "score": number (0 to 3),
  "scorePercentage": number (0 to 100: 3=100, 2=67, 1=33, 0=0),
  "argumentQuality": "PROPOSITION_SPECIFIC" | "VAGUE_OR_INCOMPLETE" | "CATEGORY_RESTATEMENT" | "IRRELEVANT",
  "feedback": "Max 2 sentences: 1 problem, 1 immediate fix",
  "xpAwarded": number (35 for 3, 20 for 2, 10 for 1, 0 for 0)
}`;

        const raw = await callOpenRouter(
          systemPrompt,
          "Evaluate argument builder response.",
          selectedModel
        );
        const validated = ArgumentBuilderSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      /* ============================================================
         5. BUILD THE PARAGRAPH (Holistic 5-Function Paragraph)
         ============================================================ */
      case "build_paragraph": {
        const { topic, argument, paragraphText } = payload;
        const text = (paragraphText || "").trim();

        if (!hasApiKey) {
          const words = text.split(/\s+/).length;
          const hasReason = text.length > 20;
          const hasExample = text.toLowerCase().includes("for example") || text.toLowerCase().includes("for instance") || words > 40;
          const hasConsequence = text.toLowerCase().includes("as a result") || text.toLowerCase().includes("consequently") || text.toLowerCase().includes("therefore");
          const hasLink = text.toLowerCase().includes("therefore") || text.toLowerCase().includes("thus") || text.toLowerCase().includes("overall");

          const score = Math.min(85, Math.max(40, Math.round((words / 70) * 85)));

          return NextResponse.json({
            valid: true,
            functionsDetected: {
              reason: hasReason,
              explanation: words > 30,
              example: hasExample,
              consequence: hasConsequence,
              link: hasLink,
            },
            scores: {
              reasoningQuality: score,
              repetition: 80,
              specificity: score - 5,
              clarity: 80,
            },
            overallScore: score,
            feedback: "Your paragraph covers the core functions well. Ensure your example gives a concrete observable scenario rather than restating the reason.",
            xpAwarded: 45,
            assessmentPrompt: "Grade 5 Scholarship Paragraph Development: Assesses Reason, Explanation, Example, Consequence, Link.",
          });
        }

        const systemPrompt = `You are an elite Australian scholarship writing coach evaluating a Grade 5 student's persuasive paragraph.
Topic: "${topic}"
Core Argument: "${argument}"
Student Paragraph: "${text}"

EVALUATION INSTRUCTIONS:
1. Identify whether each FUNCTION is present in the paragraph:
   - Reason (Topic claim)
   - Explanation (Underlying mechanism of how/why)
   - Example (Concrete observable scenario, NOT merely restating reason)
   - Consequence (Logical, proportionate outcome)
   - Link back to proposition (Reinforcing the stance on the prompt)

2. Separately score (0 to 100):
   - reasoningQuality: depth of causal connection
   - repetition: 100 = completely non-repetitive; heavily penalize circular paraphrasing
   - specificity: concrete observable detail vs abstract words (e.g. happier, better, success)
   - clarity: concise, coherent syntax

3. Overall Score (0 to 100 with meaningful headroom):
   - 90-100: Exceptional scholarship-level paragraph
   - 75-89: Strong, well-reasoned, clearly improvable
   - 60-74: Adequate / basic coverage
   - 40-59: Significant weakness (circular, vague endings, missing mechanism)
   - 1-39: Incomplete or poor attempt
   Do NOT give 100% simply because all 5 components technically appear!

4. Feedback: Maximum 2 sentences. Sentence 1 diagnoses the weakest link. Sentence 2 gives the exact rewrite direction.

Return JSON adhering strictly to:
{
  "valid": true,
  "functionsDetected": {
    "reason": boolean,
    "explanation": boolean,
    "example": boolean,
    "consequence": boolean,
    "link": boolean
  },
  "scores": {
    "reasoningQuality": number (0 to 100),
    "repetition": number (0 to 100),
    "specificity": number (0 to 100),
    "clarity": number (0 to 100)
  },
  "overallScore": number (0 to 100),
  "feedback": "Max 2 sentences: 1 problem, 1 immediate fix",
  "xpAwarded": number (20 to 60)
}`;

        const raw = await callOpenRouter(
          systemPrompt,
          "Evaluate paragraph development.",
          selectedModel,
          850
        );
        const validated = BuildParagraphSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      /* ============================================================
         6. FIX THE WEAK LINK
         ============================================================ */
      case "fix_weak_link": {
        const { topic, chain, weakIndex, studentSelectedWeakIndex, studentRewrite } = payload;
        const correctIndex = Number(weakIndex);
        const chosenIndex = Number(studentSelectedWeakIndex);
        const rewrite = (studentRewrite || "").trim();

        const pickedCorrect = chosenIndex === correctIndex;

        if (!hasApiKey) {
          const rewriteOk = rewrite.length > 20 && !VAGUE_TERMS.some((w) => rewrite.toLowerCase().includes(w));
          const score = pickedCorrect ? (rewriteOk ? 85 : 60) : 35;
          return NextResponse.json({
            valid: true,
            identifiedCorrectWeakIndex: pickedCorrect,
            rewriteScore: pickedCorrect && rewriteOk ? 5 : 3,
            scorePercentage: score,
            feedback: pickedCorrect
              ? "Correct identification of the weak link! Your revision adds the concrete step that was missing."
              : `Sentence ${correctIndex + 1} was the weakest link because it skipped the logical mechanism.`,
            xpAwarded: score >= 70 ? 35 : 15,
            assessmentPrompt: "Grade 5 Scholarship Fix Weak Link Rubric: Identifies unsupported leap and rewrites with causal mechanism.",
          });
        }

        const systemPrompt = `You are a Grade 5 Australian scholarship writing coach.
Topic: "${topic}"
3-Stage Chain:
1. "${chain[0]}"
2. "${chain[1]}"
3. "${chain[2]}"

The flawed sentence was intended to be Sentence ${correctIndex + 1}.
Student selected Sentence ${chosenIndex + 1}.
Student's rewritten replacement sentence: "${rewrite}"

EVALUATION:
1. Did the student select the correct weakest sentence?
2. Does the rewritten replacement introduce a genuine, concrete causal mechanism instead of an unsupported leap or vague restatement?

Return JSON:
{
  "valid": true,
  "identifiedCorrectWeakIndex": boolean,
  "rewriteScore": number (0 to 5),
  "scorePercentage": number (0 to 100),
  "feedback": "Max 2 sentences: 1 diagnosing their choice and rewrite, 1 immediate fix",
  "xpAwarded": number (10 to 40)
}`;

        const raw = await callOpenRouter(
          systemPrompt,
          "Evaluate weak link rewrite.",
          selectedModel
        );
        const validated = FixWeakLinkSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      /* ============================================================
         Legacy / Supporting Drills: Paragraph Builder (Guided)
         ============================================================ */
      case "paragraph_builder": {
        const { topic, say, why, example, result, link } = payload;
        const combined = `${say} ${why} ${example} ${result} ${link}`;

        if (!hasApiKey) {
          return NextResponse.json({
            valid: true,
            clearReason: Boolean(say && say.length > 8),
            whyAddsExplanation: Boolean(why && why.length > 8),
            concreteRelevantExample: Boolean(example && example.length > 12),
            logicalProportionateResult: Boolean(result && result.length > 8),
            linkAnswersProposition: Boolean(link && link.length > 8),
            progressionNoSemanticRepetition: true,
            promptFidelityScore: 80,
            overallScore: 75,
            weakestField: "EXAMPLE" as const,
            weakestReason: "Describe an observable situation that demonstrates the argument rather than generalities.",
            sentenceEvaluations: {
              SAY: { field: "SAY", label: "Reason", text: say || "", score: 4, feedback: "Direct reason supporting proposition.", performsFunction: true, advancesArgument: true },
              WHY: { field: "WHY", label: "Mechanism", text: why || "", score: 4, feedback: "Explains mechanism.", performsFunction: true, advancesArgument: true },
              EXAMPLE: { field: "EXAMPLE", label: "Evidence", text: example || "", score: 3, feedback: "Needs more observable detail.", performsFunction: true, advancesArgument: true },
              RESULT: { field: "RESULT", label: "Consequence", text: result || "", score: 4, feedback: "Logical consequence.", performsFunction: true, advancesArgument: true },
              LINK: { field: "LINK", label: "Link", text: link || "", score: 4, feedback: "Reinforces proposition.", performsFunction: true, advancesArgument: true },
            },
            feedback: "Solid paragraph architecture. Ensure each step advances reasoning without repeating.",
            xpAwarded: 40,
            assessmentPrompt: "Grade 5 Scholarship Heuristic: Evaluates 5-part paragraph progression.",
          });
        }

        const systemPrompt = `You are a premier Australian scholarship exam writing coach evaluating a Grade 5 student's persuasive paragraph.
Topic / Proposition: "${topic}"

Architecture:
SAY (Reason): "${say}"
WHY (Mechanism): "${why}"
EXAMPLE (Evidence): "${example}"
RESULT (Consequence): "${result}"
LINK (Connection): "${link}"

Check for:
1. Proposition-specific reason (not just a category label).
2. Mechanism in WHY (how/why it works).
3. Observable scenario in EXAMPLE (no requirement for names like Jack).
4. Proportionate RESULT (no catastrophizing).
5. Exact prompt connection in LINK.
6. NO SEMANTIC REPETITION between adjacent sentences.

Return JSON adhering strictly to:
{
  "valid": true,
  "clearReason": boolean,
  "whyAddsExplanation": boolean,
  "concreteRelevantExample": boolean,
  "logicalProportionateResult": boolean,
  "linkAnswersProposition": boolean,
  "progressionNoSemanticRepetition": boolean,
  "promptFidelityScore": number (0 to 100),
  "overallScore": number (0 to 100),
  "weakestField": "SAY" | "WHY" | "EXAMPLE" | "RESULT" | "LINK",
  "weakestReason": "Actionable 1-sentence prompt for rewriting this single sentence",
  "sentenceEvaluations": {
    "SAY": { "field": "SAY", "label": "Reason", "text": string, "score": number (1-5), "feedback": string, "performsFunction": boolean, "advancesArgument": boolean },
    "WHY": { "field": "WHY", "label": "Mechanism", "text": string, "score": number (1-5), "feedback": string, "performsFunction": boolean, "advancesArgument": boolean },
    "EXAMPLE": { "field": "EXAMPLE", "label": "Evidence", "text": string, "score": number (1-5), "feedback": string, "performsFunction": boolean, "advancesArgument": boolean },
    "RESULT": { "field": "RESULT", "label": "Consequence", "text": string, "score": number (1-5), "feedback": string, "performsFunction": boolean, "advancesArgument": boolean },
    "LINK": { "field": "LINK", "label": "Link", "text": string, "score": number (1-5), "feedback": string, "performsFunction": boolean, "advancesArgument": boolean }
  },
  "feedback": "Max 2 sentences: 1 problem, 1 immediate fix",
  "xpAwarded": number (30 to 50)
}`;

        const raw = await callOpenRouter(systemPrompt, "Evaluate 5-part paragraph.", selectedModel, 950);
        const validated = ParagraphBuilderSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      case "paragraph_rewrite": {
        const { topic, field, originalText, rewrittenText, paragraphContext } = payload;
        if (!hasApiKey) {
          const isBetter = (rewrittenText || "").length > 10 && rewrittenText !== originalText;
          return NextResponse.json({
            valid: true,
            field,
            originalText,
            rewrittenText,
            improved: isBetter,
            feedback: isBetter
              ? "Good revision. Your change improves the causal mechanism."
              : "Try adding more concrete detail or connecting more clearly to the surrounding sentences.",
            xpAwarded: isBetter ? 20 : 10,
          });
        }

        const systemPrompt = `Evaluate a Grade 5 student's rewrite of their weakest sentence.
Topic: "${topic}"
Role: "${field}"
Original: "${originalText}"
Rewrite: "${rewrittenText}"
Context: ${JSON.stringify(paragraphContext || {})}

Return JSON:
{
  "valid": true,
  "field": "${field}",
  "originalText": string,
  "rewrittenText": string,
  "improved": boolean,
  "feedback": "Max 2 sentences: 1 problem/success, 1 immediate fix",
  "xpAwarded": number (15 to 25)
}`;

        const raw = await callOpenRouter(systemPrompt, "Evaluate rewritten sentence.", selectedModel, 500);
        const validated = ParagraphRewriteSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      case "sentence_forge": {
        const { simpleSentences, studentCombined } = payload;
        if (!hasApiKey) {
          return NextResponse.json({
            valid: true,
            combinedSuccessfully: true,
            usesLogicalConjunction: true,
            feedback: "Sentences joined cleanly with logical transition.",
            xpAwarded: 15,
          });
        }

        const systemPrompt = `Grade 5 sentence combining evaluation.
Sentences: ${JSON.stringify(simpleSentences)}
Combined: "${studentCombined}"

Return JSON:
{
  "valid": true,
  "combinedSuccessfully": boolean,
  "usesLogicalConjunction": boolean,
  "feedback": "Max 2 sentences: 1 problem/success, 1 immediate fix",
  "xpAwarded": number (10 to 15)
}`;

        const raw = await callOpenRouter(systemPrompt, "Evaluate sentence combining.", selectedModel);
        const validated = SentenceForgeSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      case "three_paragraph_plan": {
        const { topic, position, arg1, arg2, arg3 } = payload;
        if (!hasApiKey) {
          return NextResponse.json({
            valid: true,
            positionClear: Boolean(position),
            distinctCount: 3,
            argumentsQuality: "Solid planning structure with distinct reasoning branches.",
            feedback: "Solid essay blueprint. Ensure each body paragraph has a distinct causal mechanism.",
            score: 80,
            xpAwarded: 50,
          });
        }

        const systemPrompt = `Grade 5 Australian scholarship 3-paragraph persuasive essay planning evaluation.
Topic: "${topic}"
Position: "${position}"
Arg 1: "${arg1}"
Arg 2: "${arg2}"
Arg 3: "${arg3}"

Check:
1. Position clarity.
2. Are arguments proposition-specific claims (NOT just category labels like Health or Money)?
3. Are arguments truly distinct from each other?

Return JSON:
{
  "valid": true,
  "positionClear": boolean,
  "distinctCount": number,
  "argumentsQuality": "Brief quality summary",
  "feedback": "Max 2 sentences: 1 problem, 1 immediate fix",
  "score": number (0 to 100),
  "xpAwarded": number (30 to 60)
}`;

        const raw = await callOpenRouter(systemPrompt, "Evaluate 3-paragraph plan.", selectedModel);
        const validated = ThreeParagraphPlanSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      /* ============================================================
         Logic Reasoning: Dynamic Question Generation with Internal Quality Verification
         ============================================================ */
      case "generate_logic_question": {
        const { targetCategory, difficulty } = payload || {};
        const cat = targetCategory || "conditional_logic";
        const diff = difficulty || 2;

        if (!hasApiKey) {
          return NextResponse.json(
            { error: "No API key configured for dynamic question generation" },
            { status: 503 }
          );
        }

        const systemPrompt = `You are a specialized test designer for Grade 5 Australian selective school scholarship exams (e.g. EduTest, ACER, Victorian Selective).
Generate ONE fresh, diagnostic multiple-choice logic question for:
Category: "${cat}"
Difficulty: Level ${diff} (1=Easy, 2=Medium, 3=Hard)

STRICT QUALITY CONTROL & REQUIREMENTS:
1. AGE APPROPRIATE: Designed for strong 10-11 year old students. Solvable in 30-90 seconds without specialist knowledge.
2. ZERO AMBIGUITY: Exactly ONE unambiguously correct answer. All premises must be sufficient.
3. QUALITY CONTROL VERIFICATION:
   - verify that no alternate interpretation creates a second answer
   - verify that all premises are sufficient
   - verify answer explanation logically follows
   - ensure 3 plausible distractors (not absurd giveaways)
4. ERROR DIAGNOSIS: Provide 'commonErrorFeedback' mapping each wrong option (A, B, C, or D) to the likely reasoning error (e.g. reversed conditional, assumed converse, missed constraint, incomplete elimination).
5. FORMAT: 4 options (A, B, C, D).

Return JSON adhering strictly to:
{
  "id": "gen-logic-${Date.now()}",
  "category": "${cat}",
  "subSkill": "Specific logic sub-skill tested",
  "difficulty": ${diff},
  "premises": "Clear concise scenario context or rules",
  "question": "The specific question prompt",
  "options": [
    { "id": "A", "text": "Option A" },
    { "id": "B", "text": "Option B" },
    { "id": "C", "text": "Option C" },
    { "id": "D", "text": "Option D" }
  ],
  "correctAnswer": "A" | "B" | "C" | "D",
  "explanation": "1-3 concise sentences explaining the reasoning method",
  "commonErrorFeedback": {
    "A": "Diagnostic note if A chosen incorrectly",
    "B": "Diagnostic note if B chosen incorrectly",
    "C": "Diagnostic note if C chosen incorrectly",
    "D": "Diagnostic note if D chosen incorrectly"
  },
  "qualityVerification": {
    "unambiguousCorrectAnswer": true,
    "premisesSufficient": true,
    "ageAppropriateGrade5": true,
    "distractorsPlausible": true
  }
}`;

        const raw = await callOpenRouter(
          systemPrompt,
          `Generate verified logic question for category ${cat}`,
          selectedModel,
          850
        );
        const validated = LogicQuestionGenerationSchema.parse(raw);

        // Quality check rejection
        if (
          !validated.qualityVerification.unambiguousCorrectAnswer ||
          !validated.qualityVerification.premisesSufficient
        ) {
          return NextResponse.json(
            { error: "Question failed internal quality verification." },
            { status: 422 }
          );
        }

        return NextResponse.json(validated);
      }

      /* ============================================================
         CLEAR & COMPLETE: REASONING DRILL (Calibrated for Grade 5 Scholarship)
         ============================================================ */
      case "clear_and_complete": {
        const {
          taskType,
          context,
          modelAnswer,
          targetMechanismTip,
          studentText,
        } = payload;

        const cleanText = (studentText || "").trim();

        if (!hasApiKey) {
          // Heuristic fallback if API key is absent
          const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
          const isTooShort = wordCount < 5;
          const isRunaway = wordCount > 28;

          const completeness = isTooShort ? 2 : 4;
          const efficiency = isRunaway ? 2 : 5;
          const clarity = 4;
          const sentenceCtrl = 4;
          const precision = 4;

          const diagnoses = [];
          if (isTooShort) diagnoses.push("UNDEREXPLAINED");
          else if (isRunaway) diagnoses.push("OVEREXPLAINED");
          else diagnoses.push("CLEAR_COMPLETE");

          const score = Math.round(((completeness + efficiency + clarity + sentenceCtrl + precision) / 25) * 100);

          return NextResponse.json({
            valid: true,
            scorePercentage: score,
            logicalCompleteness: completeness,
            efficiency,
            clarity,
            sentenceControl: sentenceCtrl,
            precision,
            diagnoses,
            feedback: isRunaway
              ? "You explained the core connection, but added extra consequences. Stop once the point is proved."
              : isTooShort
              ? "You stated a conclusion without explaining the physical or logical mechanism."
              : "Clear, complete reasoning with no wasted steps.",
            modelAnswer: modelAnswer || "A complete and concise demonstration of the point.",
            xpAwarded: score >= 80 ? 35 : 20,
          });
        }

        const systemPrompt = `You are an expert Australian Grade 5 scholarship-writing reasoning evaluator and coach.
You are evaluating a student's answer in a targeted reasoning drill called "Clear & Complete".

CORE EDUCATIONAL PROBLEM:
The student historically under-explained (leaving out causal bridges). After being taught to explain the steps, he now sometimes over-explains by adding unnecessary causal chains (e.g. table repair -> save money -> less stress -> better wellbeing).
The target is NEITHER minimum brevity NOR bloated length.
The target is: "Use the fewest words and logical steps necessary to make the reasoning completely clear."
Find the exact middle point:
1. Too little explanation -> reader must make an assumption / fill in the jump.
2. Enough explanation -> every necessary logical connection is present.
3. Too much explanation -> point is already established, but writer continues into unnecessary consequences/details.

CRITICAL DISTINCTIONS:
- NECESSARY VS UNNECESSARY CONSEQUENCES: A consequence is NOT automatically unnecessary. Sometimes a consequence IS the mechanism! (e.g. "Shade reduces direct sunlight reaching children" is a necessary consequence). But continuing to: "which makes them happier, which improves school performance" is an UNNECESSARY causal runaway.
- Ask: "At what point was the proposition adequately demonstrated?" Reasoning after that point is UNNECESSARY_CAUSAL_EXTENSION unless it materially strengthens the core proof.
- DO NOT TRAIN ARTIFICIALLY SHORT WRITING: Simple assertions like "Dogs need exercise because exercise is good" or "Repairing is cheaper" are UNDEREXPLAINED or RESTATES_CLAIM. A well-controlled complex sentence that explains the mechanism is rewarded.
- SEPARATE LOGICAL REASONING FROM SENTENCE QUALITY: Awkward phrasing (e.g. "This will result in you not being late and make you a more time efficient person altogether") should be flagged as AWKWARD_CONSTRUCTION, not necessarily OVEREXPLAINED.
- QUALIFICATION / PRECISION: Reward appropriately qualified claims (e.g. "can reduce costs") over unjustified absolutes ("always faster and cheaper" -> OVERGENERALISATION).

TASK TYPES:
1. "build_the_bridge": Point A and Conclusion C are given. Student must supply the missing causal bridge B.
2. "say_it_clearly": Student is given facts and a question. They must extract relevant facts and connect them logically without runaway chains.
3. "cut_the_waste": Student is given a bloated/over-explained argument and must strip away unnecessary reasoning while preserving complete logic.

CALIBRATION ANCHORS & DIAGNOSTIC CLASSIFICATIONS (Use one or more flags):
- "CLEAR_COMPLETE": Full causal bridge established with no wasted reasoning. (e.g. "For a small repair such as a loose table leg, fixing the damaged part may be cheaper than replacing the whole item" IS CLEAR_COMPLETE because it provides the qualifying comparison; "Walking to school would give Maya regular exercise while adding only two minutes to her journey" IS CLEAR_COMPLETE).
- "UNDEREXPLAINED": Major logical jump; conclusion without mechanism (e.g. "Trees are good for playgrounds", "Walking would be better", "Repairing is better").
- "MISSING_LOGICAL_STEP": Left out a crucial intermediary causal connection (e.g. When asked for Maya's advantage, "Walking would give Maya exercise" is MISSING_LOGICAL_STEP because it omits the key trade-off/time comparison from the facts; it is too basic).
- "RESTATES_CLAIM": Paraphrases or re-asserts the conclusion instead of providing the mechanism (e.g. "Repairing is cheaper" when asked to prove it's better value).
- "OVEREXPLAINED": Continues past the complete argument into speculative/unneeded details.
- "UNNECESSARY_CAUSAL_EXTENSION": Unnecessary domino chain (e.g. table repair -> save money -> less stress -> better wellbeing).
- "REPETITIVE": Circular reasoning, tautologies, or repeating the same idea with different words (e.g. "Replacing the leg is more affordable because it costs less money" merely repeats affordable/costs less without establishing comparison).
- "AWKWARD_CONSTRUCTION": Clunky phrasing, unnatural syntax, category errors, or imprecise phrasing (e.g. "Repairing the table's leg would make the table more affordable" - repairs don't make an existing table affordable, they save replacement costs; or "This will result in you not being late and make you a more time efficient person altogether"). Flag AWKWARD_CONSTRUCTION whenever phrasing is unnatural or logically imprecise even if the general gist is clear.
- "OVERGENERALISATION": Unjustified sweeping absolutes ("always", "everyone", "every single", "completely impossible").
- "OFF_TOPIC": Fails to address the given proposition or facts.

SCORING DIMENSIONS (Each 1 to 5):
- logicalCompleteness (1-5): Does reader have every necessary step? (1=major gap, 3=understandable but reader must infer, 5=complete causal reasoning).
- efficiency (1-5): Does response stop once the point is established? (1=substantial runaway, 3=some unnecessary padding, 5=no wasted reasoning).
- clarity (1-5): Can reasoning be understood immediately?
- sentenceControl (1-5): Grammar, syntax, conjunctions, natural Grade 5 construction.
- precision (1-5): Appropriately qualified claims vs unjustified absolutes.
- scorePercentage: Overall weighted percentage (0-100). If logicalCompleteness is 5 and efficiency is 5, score should be >= 90%. If OVEREXPLAINED or UNDEREXPLAINED, score accordingly.

FEEDBACK REQUIREMENTS:
- Feedback MUST be short, concrete, and child-facing (Grade 5 level).
- Identify EXACTLY where the reasoning became complete (e.g., "You proved your point after '...'. Stop there.") OR exactly what bridge was missing (e.g., "You jumped from X to Y. Explain how X causes Y.").
- Never give generic praise like "Good job! Try to be more concise."

Return JSON strictly matching this schema:
{
  "valid": true,
  "scorePercentage": number (0-100),
  "logicalCompleteness": number (1-5),
  "efficiency": number (1-5),
  "clarity": number (1-5),
  "sentenceControl": number (1-5),
  "precision": number (1-5),
  "diagnoses": array of ["CLEAR_COMPLETE" | "UNDEREXPLAINED" | "MISSING_LOGICAL_STEP" | "RESTATES_CLAIM" | "OVEREXPLAINED" | "UNNECESSARY_CAUSAL_EXTENSION" | "REPETITIVE" | "AWKWARD_CONSTRUCTION" | "OVERGENERALISATION" | "OFF_TOPIC"],
  "feedback": "Concrete Grade 5 feedback pointing directly to the boundary or missing link",
  "modelAnswer": "One clean Grade 5 model sentence showing complete logic with zero waste",
  "xpAwarded": number (10-40)
}`;

        const userPrompt = `TASK TYPE: ${taskType}
CONTEXT:
${JSON.stringify(context, null, 2)}
TARGET MECHANISM TIP: ${targetMechanismTip || "N/A"}
REFERENCE MODEL ANSWER: ${modelAnswer || "N/A"}

STUDENT RESPONSE:
"${cleanText}"`;

        const raw = await callOpenRouter(
          systemPrompt,
          userPrompt,
          selectedModel,
          700
        );

        const validated = ClearAndCompleteSchema.parse(raw);
        return NextResponse.json(validated);
      }

      case "clear_and_complete_rewrite": {
        const {
          taskType,
          originalStudentText,
          previousFeedback,
          rewrittenText,
        } = payload;

        const cleanOriginal = (originalStudentText || "").trim();
        const cleanRewrite = (rewrittenText || "").trim();

        if (!hasApiKey) {
          return NextResponse.json({
            valid: true,
            improved: cleanRewrite.length > 10 && cleanRewrite !== cleanOriginal,
            scorePercentage: 85,
            feedback: "Rewrite logged. You addressed the feedback directly.",
            xpAwarded: 25,
          });
        }

        const systemPrompt = `You are a Grade 5 Australian scholarship exam writing coach.
Evaluate a student's immediate rewrite of their reasoning sentence.
Check whether the rewrite specifically addressed the identified weakness (e.g. cut the runaway extension, filled the missing bridge, or smoothed out awkward construction) while keeping the reasoning complete.

Return JSON matching:
{
  "valid": true,
  "improved": boolean,
  "scorePercentage": number (0-100),
  "feedback": "Short 1-2 sentence child-facing feedback on whether the rewrite fixed the problem",
  "xpAwarded": number (10-30)
}`;

        const userPrompt = `ORIGINAL ANSWER:
"${cleanOriginal}"

PREVIOUS FEEDBACK GIVEN:
"${previousFeedback}"

STUDENT REWRITE:
"${cleanRewrite}"`;

        const raw = await callOpenRouter(
          systemPrompt,
          userPrompt,
          selectedModel,
          400
        );

        const validated = ClearAndCompleteRewriteSchema.parse(raw);
        return NextResponse.json(validated);
      }

      case "sentence_sprint": {
        const { task, notes, argument, weakSentence, sentencesRequired, studentText } = payload;
        const text = String(studentText || "").trim();
        const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);

        if (!hasApiKey) {
          const words = text.split(/\s+/).filter(Boolean);
          const maxWords = 28 * (sentencesRequired || 1);
          const source = (notes || []).join(" ") + " " + (argument || weakSentence || "");
          const keys = source.toLowerCase().match(/[a-z]{5,}/g) || [];
          const lower = text.toLowerCase();
          const hits = keys.filter((k) => lower.includes(k.slice(0, 5))).length;
          const complete = hits >= 2 && words.length >= 6 ? 4 : 2;
          const controlled = sentences.length === (sentencesRequired || 1) && /^[A-Z]/.test(text) && /[.!?]$/.test(text) ? 4 : 2;
          const efficient = words.length <= maxWords ? 4 : 2;
          const clear = (text.match(/\band\b/gi) || []).length <= 2 * (sentencesRequired || 1) ? 4 : 3;
          return NextResponse.json({
            valid: true, complete, clear, controlled, efficient,
            diagnosis: efficient < 4 ? "VERBOSE" : controlled < 4 ? "AWKWARD" : complete < 4 ? "MISSING_STEP" : "OK",
            feedback: "Offline marking: add an API key for full feedback.",
          });
        }

        const systemPrompt = `You mark a Grade 5 Australian student's scholarship writing sprint.
TASK: ${task}
${notes ? `NOTES: ${JSON.stringify(notes)}` : ""}
${argument ? `ARGUMENT: ${argument}` : ""}
${weakSentence ? `ORIGINAL SENTENCE TO REWRITE (meaning must stay the same): "${weakSentence}"` : ""}
SENTENCES REQUIRED: ${sentencesRequired}
STUDENT WROTE: "${text}"

Score each 1-5:
- complete: states the necessary connection (cause -> effect) so the idea is proved
- clear: reader understands immediately
- controlled: grammatically well built, correct number of sentences
- efficient: stops once the idea is proved; no unnecessary extra ideas
Length itself is NOT scored. A plain, natural Grade 5 sentence earns full marks.
NEVER rewrite or suggest an adult-sophisticated version. Do NOT give a model answer.
If the sentence is weak, say in 1-2 short Grade 5 sentences what is wrong (e.g. which idea is not needed or which link is missing), without writing the fixed sentence.

Return JSON: {"valid":true,"complete":n,"clear":n,"controlled":n,"efficient":n,"diagnosis":"AWKWARD"|"VERBOSE"|"MISSING_STEP"|"REPETITIVE"|"OVEREXPLAINED"|"OK","feedback":"..."}`;

        const raw = await callOpenRouter(systemPrompt, "Mark the sprint sentence(s).", selectedModel, 400);
        return NextResponse.json(SentenceSprintSchema.parse(raw));
      }

      default:
        return NextResponse.json({ error: "Unknown exercise type" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Evaluation API error:", err);
    return NextResponse.json(
      {
        valid: false,
        feedback: "Practice recorded. AI evaluation temporarily unavailable.",
        xpAwarded: 15,
      },
      { status: 200 }
    );
  }
}
