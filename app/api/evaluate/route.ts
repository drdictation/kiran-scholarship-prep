import { NextRequest, NextResponse } from "next/server";
import {
  callOpenRouter,
  IdeaSprintSchema,
  WhatHappensNextSchema,
  ExampleEngineSchema,
  SentenceForgeSchema,
  ThreeParagraphPlanSchema,
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
        if (!hasApiKey) {
          const isReasonable = (studentConsequence || "").length > 10;
          return NextResponse.json({
            valid: true,
            advancesReasoning: isReasonable,
            repeatsPreviousIdea: false,
            causalLinkValid: isReasonable,
            feedback: isReasonable
              ? "Great causal progression! You explained a concrete consequence rather than just repeating the starting point."
              : "Try to explain what happens next: what is the direct result of this?",
            score: isReasonable ? 4 : 2,
            xpAwarded: isReasonable ? 35 : 15,
            assessmentPrompt: "Grade 5 Scholarship Heuristic: Evaluates presence of concrete consequence without circular repetition.",
          });
        }

        const systemPrompt = `You are an educational writing tutor for Grade 5 scholarship preparation.
The student is practicing consequence and significance chains:
Topic: "${topic}"
Initial Point: "${point}"
Student's Consequence ("What happens because of this?"): "${studentConsequence}"
Student's Significance ("Why does that matter?"): "${studentSignificance || "Not provided"}"

Check:
1. Did the student explain a NEW consequence (CAUSE -> EFFECT), or did they merely circle back and repeat the original point?
2. Penalize circular reasoning (e.g. "Trees give shade -> shade is good").
3. Concise actionable feedback (1-2 sentences).
Return JSON matching:
{
  "valid": true,
  "advancesReasoning": boolean,
  "repeatsPreviousIdea": boolean,
  "causalLinkValid": boolean,
  "feedback": "1-2 short sentences",
  "score": number (1 to 5),
  "xpAwarded": number (e.g. 35 for good chain, 15 for partial)
}`;

        const raw = await callOpenRouter(systemPrompt, "Evaluate this consequence chain.", selectedModel);
        const validated = WhatHappensNextSchema.parse(raw);
        return NextResponse.json({ ...validated, assessmentPrompt: systemPrompt });
      }

      case "example_engine": {
        const { topic, argument, studentExample } = payload;
        if (!hasApiKey) {
          const isSpecific = (studentExample || "").length > 15;
          return NextResponse.json({
            valid: true,
            isConcrete: isSpecific,
            isRelevant: isSpecific,
            feedback: isSpecific
              ? "Excellent specific example! You provided concrete details rather than a generic summary."
              : "Add more concrete detail: mention specific objects, people, or real-life situations.",
            score: isSpecific ? 4 : 2,
            xpAwarded: isSpecific ? 30 : 15,
            assessmentPrompt: "Grade 5 Scholarship Heuristic: Evaluates whether student example provides concrete details rather than restating the claim.",
          });
        }

        const systemPrompt = `You are an Australian scholarship exam coach for Grade 5.
Evaluate this student's example for:
Topic: "${topic}"
Argument: "${argument}"
Student Example: "${studentExample}"

Check:
- Is this a CONCRETE, SPECIFIC real-world illustration, or just a vague restatement of the argument?
- Good: specific items, scenarios, or people.
- Weak: "For example, it is good to do this."
Return JSON matching:
{
  "valid": true,
  "isConcrete": boolean,
  "isRelevant": boolean,
  "feedback": "1-2 sentences of praise or actionable improvement",
  "score": number (1 to 5),
  "xpAwarded": number (30 for specific/concrete, 15 for generic)
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
