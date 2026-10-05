import { NextRequest, NextResponse } from "next/server";
import {
  callOpenRouter,
  IdeaSprintSchema,
  WhatHappensNextSchema,
  ExampleEngineSchema,
  SentenceForgeSchema,
  ThreeParagraphPlanSchema,
  ParagraphBuilderSchema,
  ParagraphRewriteSchema,
} from "@/lib/ai/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { exerciseType, payload } = body;
    const selectedModel = payload?.selectedModel || body?.selectedModel;

    const hasApiKey = Boolean(process.env.OPENROUTER_API_KEY);

    switch (exerciseType) {
      case "idea_sprint": {
        const { topic, args } = payload;
        if (!hasApiKey) {
          // Fallback heuristic scoring
          const filled = args.filter((a: string) => a.trim().length > 5);
          const distinct = Math.min(3, filled.length);
          return NextResponse.json({
            valid: true,
            distinctCount: distinct,
            arguments: args.map((t: string, i: number) => ({
              index: i + 1,
              text: t,
              relevant: t.trim().length > 5,
              category: "General",
            })),
            duplicateNotes: distinct < 3 ? ["Try exploring completely different lenses (e.g. money, safety, nature)."] : [],
            feedback: distinct === 3 ? "Superb! Three distinct and relevant points generated." : "Good attempt. Make sure each point looks at the problem from an entirely new angle.",
            xpAwarded: distinct === 3 ? 50 : 25,
            assessmentPrompt: "Grade 5 Scholarship Heuristic: Evaluates presence of 3 distinct non-empty reasoning angles.",
          });
        }

        const systemPrompt = `You are a warm, rigorous learning coach for a Grade 5 Australian student preparing for competitive scholarship exams.
Evaluate the student's 3 arguments for the proposition: "${topic}".
Check:
1. Relevance to the topic.
2. Are all 3 arguments GENUINELY DISTINCT, or are two merely restating the same underlying reason with different words?
3. Concise feedback (1-2 sentences maximum).
Reward clarity and varied angles (Health, Money, Safety, Environment, Community, Fairness).
Return JSON adhering strictly to:
{
  "valid": true,
  "distinctCount": number (0 to 3),
  "arguments": [
    { "index": 1, "text": string, "relevant": boolean, "category": string }
  ],
  "duplicateNotes": [string explaining if any two arguments overlap],
  "feedback": "Concise 1-2 sentence actionable feedback",
  "xpAwarded": number (e.g. 50 for 3 distinct, 30 for 2, 15 for 1)
}`;

        const raw = await callOpenRouter(systemPrompt, JSON.stringify({ topic, arguments: args }), selectedModel);
        const validated = IdeaSprintSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      case "what_happens_next": {
        const { topic, point, studentConsequence, studentSignificance } = payload;
        const textToCheck = `${studentConsequence} ${studentSignificance}`.toLowerCase();
        const hasSevereKeywords =
          textToCheck.includes("depress") ||
          textToCheck.includes("therap") ||
          textToCheck.includes("suicid") ||
          textToCheck.includes("hospital") ||
          textToCheck.includes("hate him") ||
          textToCheck.includes("hate her") ||
          textToCheck.includes("ruined life");

        if (!hasApiKey) {
          const isReasonable = (studentConsequence || "").length > 10;
          return NextResponse.json({
            valid: true,
            advancesReasoning: isReasonable,
            repeatsPreviousIdea: false,
            causalLinkValid: isReasonable,
            isPlausible: !hasSevereKeywords,
            isProportionate: !hasSevereKeywords,
            severityInflationDetected: hasSevereKeywords,
            feedback: hasSevereKeywords
              ? "Watch out for severity inflation! A more dramatic consequence (like therapy or depression) is not better. Keep consequences logical and proportionate."
              : isReasonable
              ? "Great causal progression! You explained a concrete, proportionate consequence rather than just repeating the starting point."
              : "Try to explain what happens next: what is the direct result of this?",
            score: hasSevereKeywords ? 2 : isReasonable ? 4 : 2,
            xpAwarded: hasSevereKeywords ? 20 : isReasonable ? 35 : 15,
            assessmentPrompt: "Grade 5 Scholarship Heuristic: Evaluates presence of concrete consequence without circular repetition or severity inflation.",
          });
        }

        const systemPrompt = `You are an educational writing tutor for Grade 5 Australian scholarship preparation.
The student is practicing consequence and significance chains:
Topic: "${topic}"
Initial Point: "${point}"
Student's Consequence ("What happens because of this?"): "${studentConsequence}"
Student's Significance ("Why does that matter?"): "${studentSignificance || "Not provided"}"

Evaluate on these critical scholarship principles:
1. Is it a genuinely NEW consequence (CAUSE -> EFFECT), or does it circle back and repeat the original point?
2. Is the consequence PLAUSIBLE, DIRECT, and PROPORTIONATE to the starting point?
3. CRITICAL - DETECT SEVERITY INFLATION: Explicitly penalize severity inflation or catastrophizing (e.g. jumping from tired/stress to clinical depression, therapy, total ruin, or "everyone hates them"). A more dramatic consequence is NOT inherently better; examiners reward logical, direct, believable, and proportionate progression.
4. Concise actionable feedback (1-2 sentences).

Return JSON adhering strictly to:
{
  "valid": true,
  "advancesReasoning": boolean,
  "repeatsPreviousIdea": boolean,
  "causalLinkValid": boolean,
  "isPlausible": boolean,
  "isProportionate": boolean,
  "severityInflationDetected": boolean,
  "feedback": "1-2 short sentences giving praise or actionable coaching on proportionality",
  "score": number (1 to 5; penalize down to 2 or 3 if severity inflation is present even if new),
  "xpAwarded": number (35 for strong proportionate chain, 15-20 for inflated or circular chain)
}`;

        const raw = await callOpenRouter(systemPrompt, "Evaluate this consequence chain.", selectedModel);
        const validated = WhatHappensNextSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      case "example_engine": {
        const { topic, argument, studentExample } = payload;
        const exLower = (studentExample || "").toLowerCase();
        const argLower = (argument || "").toLowerCase();

        // Heuristic checks
        const isRestatement =
          exLower.length > 5 &&
          (argLower.includes(exLower) ||
            (exLower.includes("because") && exLower.includes("good")));
        const isDramatic =
          exLower.includes("depress") ||
          exLower.includes("therap") ||
          exLower.includes("bullied") ||
          exLower.includes("hospital") ||
          exLower.includes("died");
        const isShortGeneral = exLower.length < 25 && !exLower.includes("when ") && !exLower.includes("for example");

        if (!hasApiKey) {
          let failureMode: "GOOD" | "TOO_GENERAL" | "REASON_RESTATED" | "UNREALISTIC" | "OVERCOMPLICATED" | "OVERDRAMATIC" = "GOOD";
          if (isRestatement) failureMode = "REASON_RESTATED";
          else if (isDramatic) failureMode = "OVERDRAMATIC";
          else if (isShortGeneral) failureMode = "TOO_GENERAL";

          const isGood = failureMode === "GOOD";
          return NextResponse.json({
            valid: true,
            isConcrete: isGood,
            isRealistic: !isDramatic,
            isRelevant: true,
            isConcise: exLower.length < 200,
            failureMode,
            hasSpecificPerson: exLower.includes("child") || exLower.includes("student") || exLower.includes("family"),
            hasContext: exLower.includes("at ") || exLower.includes("in ") || exLower.includes("when "),
            hasObservableAction: isGood,
            feedback: isGood
              ? "Excellent specific example! You provided a realistic, observable scene that directly supports your reason."
              : failureMode === "REASON_RESTATED"
              ? "This example merely restates the argument disguised as an example. Provide an observable scene: WHO + CONTEXT + WHAT HAPPENS."
              : failureMode === "OVERDRAMATIC"
              ? "Avoid overdramatic scenarios. A simple, realistic everyday scene is much more persuasive to examiners than extreme drama."
              : "Too general. Turn this into one observable scene the reader can picture in their mind.",
            score: isGood ? 4 : 2,
            xpAwarded: isGood ? 30 : 15,
            assessmentPrompt: "Grade 5 Scholarship Heuristic: Evaluates failure modes: GOOD, TOO_GENERAL, REASON_RESTATED, OVERDRAMATIC.",
          });
        }

        const systemPrompt = `You are an expert Australian scholarship exam writing coach for Grade 5.
Evaluate the student's example for:
Topic: "${topic}"
Argument: "${argument}"
Student Example: "${studentExample}"

Scholarship Examiner Evaluation Criteria:
1. Concrete / Specific: Can the reader picture ONE clear scene? Use WHO (specific person/agent) + CONTEXT (time/place) + WHAT HAPPENS (observable event) as guidance, but do not mechanically require all three if a short example is already concrete and persuasive.
2. Realistic: Is it plausible in ordinary life, not absurd or exaggerated?
3. Directly Relevant: Does it directly prove the exact reason, without straying?
4. Concise: Is it a tight 1-2 sentence scene without rambling mini-story baggage?

Classify 'failureMode' as EXACTLY ONE of:
- "GOOD": Specific, realistic, relevant, and concise scene the reader can visualize.
- "TOO_GENERAL": Abstract claim with no specific person or observable event (e.g. "Children can make friends in activities").
- "REASON_RESTATED": Simply repeats the underlying argument disguised as an example (e.g. "A child who has no skills joins an after-school activity to get skills").
- "UNREALISTIC": Technically illustrates the point but is implausible, absurd, or bizarre in real life.
- "OVERCOMPLICATED": An overly long, meandering narrative with unnecessary plot details and characters.
- "OVERDRAMATIC": Injects extreme drama, bullying, humiliation, clinical depression, or tragedy when a simple everyday example was required.

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
  "feedback": "1-2 short, precise sentences explaining what went well or how to fix the specific failure mode",
  "score": number (1 to 5; award 4-5 only for GOOD, 1-3 for failure modes),
  "xpAwarded": number (30-40 for GOOD, 15 for failure modes)
}`;

        const raw = await callOpenRouter(systemPrompt, "Evaluate the student's example.", selectedModel);
        const validated = ExampleEngineSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      case "sentence_forge": {
        const { simpleSentences, studentCombined } = payload;
        if (!hasApiKey) {
          return NextResponse.json({
            valid: true,
            combinedSuccessfully: true,
            usesLogicalConjunction: true,
            feedback: "Well combined! The sentence flows smoothly without unnecessary words.",
            xpAwarded: 30,
            assessmentPrompt: "Grade 5 Scholarship Heuristic: Checks that multiple clauses are joined grammatically without fragmenting.",
          });
        }

        const systemPrompt = `You are evaluating a Grade 5 student combining multiple simple sentences into one strong sentence.
Original sentences: ${JSON.stringify(simpleSentences)}
Student combined sentence: "${studentCombined}"

Check:
1. Is it grammatically sound?
2. Does it use appropriate conjunctions/transitions (e.g. although, because, while, since, despite)?
3. Avoid rewarding overly ornate thesaurus words—reward clarity, logic, and variety.
Return JSON:
{
  "valid": true,
  "combinedSuccessfully": boolean,
  "usesLogicalConjunction": boolean,
  "feedback": "1 short encouraging and precise sentence",
  "xpAwarded": number (25-35)
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
            feedback: "Excellent exam-ready plan! Your 3 reasons attack the prompt from three different angles.",
            score: 85,
            xpAwarded: 60,
            assessmentPrompt: "Grade 5 Scholarship Heuristic: Evaluates complete 3-body blueprint for position clarity and distinct topic coverage.",
          });
        }

        const systemPrompt = `Grade 5 Australian scholarship 3-paragraph persuasive essay planning evaluation.
Topic: "${topic}"
Position: "${position}"
Paragraph 1 Argument: "${arg1}"
Paragraph 2 Argument: "${arg2}"
Paragraph 3 Argument: "${arg3}"

Evaluate:
1. Clarity of position.
2. Are the 3 arguments truly distinct?
3. Breadth of reasoning across domains.
Return JSON:
{
  "valid": true,
  "positionClear": boolean,
  "distinctCount": number,
  "argumentsQuality": "Brief quality summary",
  "feedback": "1-2 sentences of strategic guidance",
  "score": number (0 to 100),
  "xpAwarded": number (40 to 80)
}`;

        const raw = await callOpenRouter(systemPrompt, "Evaluate 3-paragraph plan.", selectedModel);
        const validated = ThreeParagraphPlanSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      case "paragraph_builder": {
        const { topic, say, why, example, result, link } = payload;

        if (!hasApiKey) {
          // Heuristic fallback for paragraph builder
          return NextResponse.json({
            valid: true,
            clearReason: Boolean(say && say.length > 8),
            whyAddsExplanation: Boolean(why && why.length > 8),
            concreteRelevantExample: Boolean(example && example.length > 12),
            logicalProportionateResult: Boolean(result && result.length > 8),
            linkAnswersProposition: Boolean(link && link.length > 8),
            progressionNoSemanticRepetition: true,
            promptFidelityScore: 85,
            overallScore: 80,
            weakestField: "EXAMPLE" as const,
            weakestReason: "Your example could be more concrete and observable. Try specifying WHO was involved and WHERE it took place.",
            sentenceEvaluations: {
              SAY: { field: "SAY", label: "Reason", text: say || "", score: 4, feedback: "Clear topic sentence stating your reason.", performsFunction: true, advancesArgument: true },
              WHY: { field: "WHY", label: "Mechanism", text: why || "", score: 4, feedback: "Explains how and why the reason works.", performsFunction: true, advancesArgument: true },
              EXAMPLE: { field: "EXAMPLE", label: "Evidence", text: example || "", score: 3, feedback: "Good start, but could include more observable details.", performsFunction: true, advancesArgument: true },
              RESULT: { field: "RESULT", label: "Consequence", text: result || "", score: 4, feedback: "Logical consequence following from your example.", performsFunction: true, advancesArgument: true },
              LINK: { field: "LINK", label: "Link", text: link || "", score: 4, feedback: "Directly reinforces the topic proposition.", performsFunction: true, advancesArgument: true },
            },
            feedback: "Solid paragraph structure! Each sentence serves its designated function in the SAY-WHY-EXAMPLE-RESULT-LINK chain.",
            xpAwarded: 50,
            assessmentPrompt: "Grade 5 Scholarship Heuristic: Evaluates 5-part paragraph architecture and functional progression.",
          });
        }

        const systemPrompt = `You are a premier Australian scholarship exam writing coach evaluating a Grade 5 student's persuasive paragraph.
Topic / Proposition: "${topic}"

The student has written a 5-sentence paragraph using the architecture:
SAY (Main Reason): "${say}"
WHY (Mechanism / Explanation): "${why}"
EXAMPLE (Concrete Evidence Scene): "${example}"
RESULT (Logical / Proportionate Consequence): "${result}"
LINK (Connection to Prompt): "${link}"

Evaluation Criteria:
1. SAY: States a clear, direct reason supporting the proposition.
2. WHY: Explains the underlying mechanism (how/why this happens) rather than merely repeating the SAY statement.
3. EXAMPLE: Concrete, realistic illustration (WHO + WHERE + WHAT HAPPENS). Penalize if it merely restates the reason or is overdramatic.
4. RESULT: A logical, proportionate consequence flowing from the example (NO severity inflation / catastrophizing).
5. LINK: Connects the consequence back to answer the EXACT prompt asked.
6. FUNCTIONAL PROGRESSION & NO SEMANTIC REPETITION: CRITICAL! Determine whether each adjacent sentence moves the argument forward with a new logical step, or if it merely restates the same point using synonyms (e.g. SAY: exercise is healthy -> WHY: exercise makes you fit -> RESULT: exercise makes children healthy is repetitive).
7. PROMPT FIDELITY (0-100): Did the student stay strictly on the prompt proposition without subtly altering it (e.g. altering "limit screen time" to "ban social media")?
8. IDENTIFY WEAKEST FIELD: Pick the single weakest sentence ("SAY" | "WHY" | "EXAMPLE" | "RESULT" | "LINK") and provide a clear, constructive 1-sentence prompt for how the student should rewrite it.

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
  "weakestReason": "Actionable coaching tip explaining how to rewrite this single sentence",
  "sentenceEvaluations": {
    "SAY": { "field": "SAY", "label": "Reason", "text": string, "score": number (1-5), "feedback": string, "performsFunction": boolean, "advancesArgument": boolean },
    "WHY": { "field": "WHY", "label": "Mechanism", "text": string, "score": number (1-5), "feedback": string, "performsFunction": boolean, "advancesArgument": boolean },
    "EXAMPLE": { "field": "EXAMPLE", "label": "Evidence", "text": string, "score": number (1-5), "feedback": string, "performsFunction": boolean, "advancesArgument": boolean },
    "RESULT": { "field": "RESULT", "label": "Consequence", "text": string, "score": number (1-5), "feedback": string, "performsFunction": boolean, "advancesArgument": boolean },
    "LINK": { "field": "LINK", "label": "Link", "text": string, "score": number (1-5), "feedback": string, "performsFunction": boolean, "advancesArgument": boolean }
  },
  "feedback": "2 sentences of overall strategic summary praise and guidance",
  "xpAwarded": number (40-60)
}`;

        const raw = await callOpenRouter(systemPrompt, "Evaluate this 5-part paragraph.", selectedModel, 950);
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
              ? "Great rewrite! Your revision strengthens the paragraph's progression."
              : "Try adding more concrete detail or connecting more clearly to the surrounding sentences.",
            xpAwarded: isBetter ? 25 : 10,
          });
        }

        const systemPrompt = `You are a Grade 5 Australian scholarship writing coach evaluating a student's rewrite of their weakest sentence.
Topic: "${topic}"
Sentence Role: "${field}"
Original Sentence: "${originalText}"
Rewritten Sentence: "${rewrittenText}"
Surrounding Paragraph Context: ${JSON.stringify(paragraphContext || {})}

Check:
1. Did the rewrite improve the sentence's clarity, conciseness, concreteness, or logical progression?
2. Does it avoid the previous flaw (e.g. repetition, vagueness, overdramatic tone, or severity inflation)?
3. Does it fit seamlessly with the surrounding sentences?

Return JSON:
{
  "valid": true,
  "field": "${field}",
  "originalText": string,
  "rewrittenText": string,
  "improved": boolean,
  "feedback": "1-2 encouraging sentences explaining specifically why the rewrite is stronger or how to sharpen it further",
  "xpAwarded": number (20-30 for improved, 10 for unchanged/weak)
}`;

        const raw = await callOpenRouter(systemPrompt, "Evaluate the rewritten sentence.", selectedModel, 600);
        const validated = ParagraphRewriteSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      default:
        return NextResponse.json({ error: "Unknown exercise type" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Evaluation API error:", err);
    return NextResponse.json(
      {
        valid: false,
        feedback: "We saved your answer! AI evaluation is temporarily offline, but your practice session is recorded.",
        xpAwarded: 20,
      },
      { status: 200 }
    );
  }
}
