import fs from "fs";
import path from "path";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SELECTED_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || "openai/gpt-6.1-sol";

if (!OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY in environment!");
  process.exit(1);
}

const TEST_CASES = [
  // --- 1 to 10: Build the bridge ---
  {
    id: 1,
    taskType: "build_the_bridge",
    promptTitle: "Playground Trees & Summer Comfort",
    context: {
      pointA: "A school plants large shade trees around its outdoor playground.",
      conclusionC: "The playground becomes significantly more comfortable for students during hot summer days.",
    },
    modelAnswer: "As the trees grow, their leaves provide shade and reduce the amount of direct sunlight reaching the playground.",
    response: "Trees are good for playgrounds.",
    expectedCategory: "UNDEREXPLAINED",
    notes: "Weak answer from spec: conclusion without mechanism",
  },
  {
    id: 2,
    taskType: "build_the_bridge",
    promptTitle: "Playground Trees & Summer Comfort",
    context: {
      pointA: "A school plants large shade trees around its outdoor playground.",
      conclusionC: "The playground becomes significantly more comfortable for students during hot summer days.",
    },
    modelAnswer: "As the trees grow, their leaves provide shade and reduce the amount of direct sunlight reaching the playground.",
    response: "As the trees grow, their leaves provide shade and reduce the amount of direct sunlight reaching the playground equipment.",
    expectedCategory: "CLEAR_COMPLETE",
    notes: "Good answer from spec: bridges trees -> shade -> comfort with no waste",
  },
  {
    id: 3,
    taskType: "build_the_bridge",
    promptTitle: "Playground Trees & Summer Comfort",
    context: {
      pointA: "A school plants large shade trees around its outdoor playground.",
      conclusionC: "The playground becomes significantly more comfortable for students during hot summer days.",
    },
    modelAnswer: "As the trees grow, their leaves provide shade and reduce the amount of direct sunlight reaching the playground.",
    response: "The trees provide shade, which makes children cooler, which makes them happier, which improves their wellbeing and could make them perform better at school.",
    expectedCategory: "OVEREXPLAINED",
    notes: "Over-explained answer from spec: runaway causal extension into happiness/wellbeing/grades",
  },
  {
    id: 4,
    taskType: "build_the_bridge",
    promptTitle: "Dining Table Repair vs Replacement",
    context: {
      pointA: "A family repairs the single broken leg of its sturdy dining table for $30.",
      conclusionC: "Repairing the table is much better value than replacing it.",
    },
    modelAnswer: "A new dining table might cost hundreds of dollars, so repairing the only broken part for $30 avoids paying for an entirely new table.",
    response: "Repairing is better.",
    expectedCategory: "UNDEREXPLAINED",
    notes: "Vague restatement without comparison or mechanism",
  },
  {
    id: 5,
    taskType: "build_the_bridge",
    promptTitle: "Dining Table Repair vs Replacement",
    context: {
      pointA: "A family repairs the single broken leg of its sturdy dining table for $30.",
      conclusionC: "Repairing the table is much better value than replacing it.",
    },
    modelAnswer: "A new dining table might cost hundreds of dollars, so repairing the only broken part for $30 avoids paying for an entirely new table.",
    response: "Repairing is cheaper.",
    expectedCategory: "RESTATES_CLAIM",
    notes: "Spec diagnosis: too close to restating conclusion C without mechanism",
  },
  {
    id: 6,
    taskType: "build_the_bridge",
    promptTitle: "Dining Table Repair vs Replacement",
    context: {
      pointA: "A family repairs the single broken leg of its sturdy dining table for $30.",
      conclusionC: "Repairing the table is much better value than replacing it.",
    },
    modelAnswer: "A new dining table might cost hundreds of dollars, so repairing the only broken part for $30 avoids paying for an entirely new table.",
    response: "Replacing one broken table leg costs much less than buying a new table.",
    expectedCategory: "CLEAR_COMPLETE",
    notes: "Spec diagnosis: concise complete comparison",
  },
  {
    id: 7,
    taskType: "build_the_bridge",
    promptTitle: "Dining Table Repair vs Replacement",
    context: {
      pointA: "A family repairs the single broken leg of its sturdy dining table for $30.",
      conclusionC: "Repairing the table is much better value than replacing it.",
    },
    modelAnswer: "A new dining table might cost hundreds of dollars, so repairing the only broken part for $30 avoids paying for an entirely new table.",
    response: "Replacing the leg saves money, which reduces stress and improves wellbeing.",
    expectedCategory: "OVEREXPLAINED",
    notes: "Spec diagnosis: point complete after saving money; stress/wellbeing is runaway",
  },
  {
    id: 8,
    taskType: "build_the_bridge",
    promptTitle: "Dining Table Repair vs Replacement",
    context: {
      pointA: "A family repairs the single broken leg of its sturdy dining table for $30.",
      conclusionC: "Repairing the table is much better value than replacing it.",
    },
    modelAnswer: "A new dining table might cost hundreds of dollars, so repairing the only broken part for $30 avoids paying for an entirely new table.",
    response: "Replacing the leg is more affordable because it costs less money.",
    expectedCategory: "REPETITIVE",
    notes: "Spec diagnosis: circular / tautological reason",
  },
  {
    id: 9,
    taskType: "build_the_bridge",
    promptTitle: "Dining Table Repair vs Replacement",
    context: {
      pointA: "A family repairs the single broken leg of its sturdy dining table for $30.",
      conclusionC: "Repairing the table is much better value than replacing it.",
    },
    modelAnswer: "A new dining table might cost hundreds of dollars, so repairing the only broken part for $30 avoids paying for an entirely new table.",
    response: "Fixing anything is always faster and cheaper than replacing it.",
    expectedCategory: "OVERGENERALISATION",
    notes: "Spec diagnosis: unjustified absolute claim with 'always'",
  },
  {
    id: 10,
    taskType: "build_the_bridge",
    promptTitle: "Dining Table Repair vs Replacement",
    context: {
      pointA: "A family repairs the single broken leg of its sturdy dining table for $30.",
      conclusionC: "Repairing the table is much better value than replacing it.",
    },
    modelAnswer: "A new dining table might cost hundreds of dollars, so repairing the only broken part for $30 avoids paying for an entirely new table.",
    response: "Repairing the table's leg would make the table more affordable.",
    expectedCategory: "AWKWARD_CONSTRUCTION",
    notes: "Spec diagnosis: awkward / imprecise construction (repair doesn't make table affordable)",
  },

  // --- 11 to 20: Say it clearly ---
  {
    id: 11,
    taskType: "say_it_clearly",
    promptTitle: "Maya's School Journey",
    context: {
      facts: [
        "Maya lives 800 metres from school.",
        "Her parents normally drive her.",
        "The drive takes ten minutes because of traffic.",
        "Walking takes twelve minutes.",
        "She wants more daily exercise.",
      ],
      question: "Explain one advantage of Maya walking to school.",
    },
    modelAnswer: "Walking to school would give Maya regular exercise while adding only two minutes to her journey.",
    response: "Walking would be better for Maya.",
    expectedCategory: "UNDEREXPLAINED",
    notes: "Spec diagnosis: conclusion without mechanism",
  },
  {
    id: 12,
    taskType: "say_it_clearly",
    promptTitle: "Maya's School Journey",
    context: {
      facts: [
        "Maya lives 800 metres from school.",
        "Her parents normally drive her.",
        "The drive takes ten minutes because of traffic.",
        "Walking takes twelve minutes.",
        "She wants more daily exercise.",
      ],
      question: "Explain one advantage of Maya walking to school.",
    },
    modelAnswer: "Walking to school would give Maya regular exercise while adding only two minutes to her journey.",
    response: "Walking would give Maya exercise.",
    expectedCategory: "MISSING_LOGICAL_STEP",
    notes: "Spec note: better but basic; misses comparison or specific facts",
  },
  {
    id: 13,
    taskType: "say_it_clearly",
    promptTitle: "Maya's School Journey",
    context: {
      facts: [
        "Maya lives 800 metres from school.",
        "Her parents normally drive her.",
        "The drive takes ten minutes because of traffic.",
        "Walking takes twelve minutes.",
        "She wants more daily exercise.",
      ],
      question: "Explain one advantage of Maya walking to school.",
    },
    modelAnswer: "Walking to school would give Maya regular exercise while adding only two minutes to her journey.",
    response: "Walking to school would give Maya regular exercise while adding only two minutes to her journey.",
    expectedCategory: "CLEAR_COMPLETE",
    notes: "Spec diagnosis: CLEAR_COMPLETE",
  },
  {
    id: 14,
    taskType: "say_it_clearly",
    promptTitle: "Maya's School Journey",
    context: {
      facts: [
        "Maya lives 800 metres from school.",
        "Her parents normally drive her.",
        "The drive takes ten minutes because of traffic.",
        "Walking takes twelve minutes.",
        "She wants more daily exercise.",
      ],
      question: "Explain one advantage of Maya walking to school.",
    },
    modelAnswer: "Walking to school would give Maya regular exercise while adding only two minutes to her journey.",
    response: "Walking would give Maya exercise, which could improve her fitness, make her healthier, improve her mood, reduce stress and perhaps help her concentrate better at school.",
    expectedCategory: "OVEREXPLAINED",
    notes: "Spec diagnosis: OVEREXPLAINED / UNNECESSARY_CAUSAL_EXTENSION",
  },
  {
    id: 15,
    taskType: "say_it_clearly",
    promptTitle: "Replacing Lost Library Books",
    context: {
      facts: [
        "Library book costs $25.",
        "Student loses it.",
        "School has to buy another copy.",
        "20 students lose books during the year.",
      ],
      question: "Explain why students should look after library books.",
    },
    modelAnswer: "When students lose library books, the school must spend money replacing them instead of using that money for other resources.",
    response: "Losing books is bad because schools don't like it.",
    expectedCategory: "UNDEREXPLAINED",
    notes: "Spec note: missing relevant mechanism",
  },
  {
    id: 16,
    taskType: "say_it_clearly",
    promptTitle: "Replacing Lost Library Books",
    context: {
      facts: [
        "Library book costs $25.",
        "Student loses it.",
        "School has to buy another copy.",
        "20 students lose books during the year.",
      ],
      question: "Explain why students should look after library books.",
    },
    modelAnswer: "When students lose library books, the school must spend money replacing them instead of using that money for other resources.",
    response: "When students lose library books, the school must spend money replacing them instead of using that money for other resources.",
    expectedCategory: "CLEAR_COMPLETE",
    notes: "Spec note: excellent Grade 5 explanation",
  },
  {
    id: 17,
    taskType: "say_it_clearly",
    promptTitle: "Replacing Lost Library Books",
    context: {
      facts: [
        "Library book costs $25.",
        "Student loses it.",
        "School has to buy another copy.",
        "20 students lose books during the year.",
      ],
      question: "Explain why students should look after library books.",
    },
    modelAnswer: "When students lose library books, the school must spend money replacing them instead of using that money for other resources.",
    response: "The school loses money, which could mean fewer resources, which could make lessons worse, which could lower students' grades and affect their future.",
    expectedCategory: "OVEREXPLAINED",
    notes: "Spec note: chain becomes speculative and unnecessary",
  },
  {
    id: 18,
    taskType: "say_it_clearly",
    promptTitle: "Replacing Lost Library Books",
    context: {
      facts: [
        "Library book costs $25.",
        "Student loses it.",
        "School has to buy another copy.",
        "20 students lose books during the year.",
      ],
      question: "Explain why students should look after library books.",
    },
    modelAnswer: "When students lose library books, the school must spend money replacing them instead of using that money for other resources.",
    response: "Every single student who loses a book will cause the entire library to shut down completely.",
    expectedCategory: "OVERGENERALISATION",
    notes: "Absurd absolute / catastrophic inflation",
  },
  {
    id: 19,
    taskType: "say_it_clearly",
    promptTitle: "Maya's School Journey",
    context: {
      facts: [
        "Maya lives 800 metres from school.",
        "Her parents normally drive her.",
        "The drive takes ten minutes because of traffic.",
        "Walking takes twelve minutes.",
        "She wants more daily exercise.",
      ],
      question: "Explain one advantage of Maya walking to school.",
    },
    modelAnswer: "Walking to school would give Maya regular exercise while adding only two minutes to her journey.",
    response: "This will result in Maya not being late and make her a more time efficient person altogether.",
    expectedCategory: "AWKWARD_CONSTRUCTION",
    notes: "Kiran's exact writing habit: awkward prepositional phrase and syntax",
  },
  {
    id: 20,
    taskType: "say_it_clearly",
    promptTitle: "Maya's School Journey",
    context: {
      facts: [
        "Maya lives 800 metres from school.",
        "Her parents normally drive her.",
        "The drive takes ten minutes because of traffic.",
        "Walking takes twelve minutes.",
        "She wants more daily exercise.",
      ],
      question: "Explain one advantage of Maya walking to school.",
    },
    modelAnswer: "Walking to school would give Maya regular exercise while adding only two minutes to her journey.",
    response: "Cars produce carbon emissions which damage the ozone layer.",
    expectedCategory: "OFF_TOPIC",
    notes: "Fails to answer the question about Maya's direct advantage",
  },

  // --- 21 to 30: Cut the waste & Borderlines ---
  {
    id: 21,
    taskType: "cut_the_waste",
    promptTitle: "Bicycle Petrol Savings",
    context: {
      originalText: "Riding a bicycle to a nearby shop can save money because a bicycle does not need petrol. Petrol costs money, and spending money can make families stressed. Stress can make people unhappy and being unhappy can affect people's wellbeing.",
      goalProposition: "Explain why riding a bicycle to nearby shops saves money.",
    },
    modelAnswer: "Riding a bicycle to a nearby shop can save money because it does not require petrol.",
    response: "Riding a bicycle to a nearby shop can save money because it does not require petrol.",
    expectedCategory: "CLEAR_COMPLETE",
    notes: "Spec example 1: perfectly cut, sufficient, do not penalise for brevity",
  },
  {
    id: 22,
    taskType: "cut_the_waste",
    promptTitle: "Playground Bins & Litter",
    context: {
      originalText: "If students put rubbish in bins, less rubbish will be left on the playground. A cleaner playground looks nicer, which makes students happier. Happy students may enjoy school more, which might make them work harder and eventually achieve better results.",
      goalProposition: "Explain why bins help keep the school clean.",
    },
    modelAnswer: "If students put their rubbish in bins, less litter will be left around the playground, keeping the school cleaner.",
    response: "If students put their rubbish in bins, less litter will be left around the playground, keeping the school cleaner.",
    expectedCategory: "CLEAR_COMPLETE",
    notes: "Spec example 2: everything after cleanliness removed",
  },
  {
    id: 23,
    taskType: "cut_the_waste",
    promptTitle: "Bicycle Petrol Savings",
    context: {
      originalText: "Riding a bicycle to a nearby shop can save money because a bicycle does not need petrol. Petrol costs money, and spending money can make families stressed. Stress can make people unhappy and being unhappy can affect people's wellbeing.",
      goalProposition: "Explain why riding a bicycle to nearby shops saves money.",
    },
    modelAnswer: "Riding a bicycle to a nearby shop can save money because it does not require petrol.",
    response: "Riding saves petrol which saves money and prevents stress.",
    expectedCategory: "OVEREXPLAINED",
    notes: "Failed to cut the stress tail completely",
  },
  {
    id: 24,
    taskType: "cut_the_waste",
    promptTitle: "Playground Bins & Litter",
    context: {
      originalText: "If students put rubbish in bins, less rubbish will be left on the playground. A cleaner playground looks nicer, which makes students happier. Happy students may enjoy school more, which might make them work harder and eventually achieve better results.",
      goalProposition: "Explain why bins help keep the school clean.",
    },
    modelAnswer: "If students put their rubbish in bins, less litter will be left around the playground, keeping the school cleaner.",
    response: "Bins are good.",
    expectedCategory: "UNDEREXPLAINED",
    notes: "Over-cut to the point of deleting the causal mechanism",
  },
  {
    id: 25,
    taskType: "build_the_bridge",
    promptTitle: "Dog Exercise & Inactivity",
    context: {
      pointA: "A family takes their active dog on daily thirty-minute walks around the suburb.",
      conclusionC: "The dog maintains healthy cardiovascular fitness and stays physically well.",
    },
    modelAnswer: "Regular walks allow dogs to exercise, helping them maintain their fitness and preventing them from being inactive for long periods.",
    response: "Regular walks allow dogs to exercise, helping them maintain their fitness and preventing them from being inactive for long periods.",
    expectedCategory: "CLEAR_COMPLETE",
    notes: "Section 8 rule: longer, complex sentence that explains mechanism is rewarded, NOT penalised for word count",
  },
  {
    id: 26,
    taskType: "build_the_bridge",
    promptTitle: "Dog Exercise & Inactivity",
    context: {
      pointA: "A family takes their active dog on daily thirty-minute walks around the suburb.",
      conclusionC: "The dog maintains healthy cardiovascular fitness and stays physically well.",
    },
    modelAnswer: "Regular walks allow dogs to exercise, helping them maintain their fitness and preventing them from being inactive for long periods.",
    response: "Dogs need exercise because exercise is good.",
    expectedCategory: "UNDEREXPLAINED",
    notes: "Section 8 rule: artificially short sentence that avoids explaining mechanism",
  },
  {
    id: 27,
    taskType: "build_the_bridge",
    promptTitle: "Shaded Areas & Sun Protection",
    context: {
      pointA: "Schools provide shaded canvas sails over all outdoor playground equipment.",
      conclusionC: "Students are protected from excessive sun exposure during lunch play.",
    },
    modelAnswer: "Shade reduces the amount of direct sunlight reaching children while they are outside.",
    response: "Shade reduces the amount of direct ultraviolet sunlight reaching children while they are outside.",
    expectedCategory: "CLEAR_COMPLETE",
    notes: "Section 7 rule: this consequence IS the mechanism, so it MUST be rewarded",
  },
  {
    id: 28,
    taskType: "build_the_bridge",
    promptTitle: "Shaded Areas & Sun Protection",
    context: {
      pointA: "Schools provide shaded canvas sails over all outdoor playground equipment.",
      conclusionC: "Students are protected from excessive sun exposure during lunch play.",
    },
    modelAnswer: "Shade reduces the amount of direct sunlight reaching children while they are outside.",
    response: "Shade stops direct sunlight reaching students, which makes children more comfortable, which makes them happier, which improves their attitude towards school.",
    expectedCategory: "OVEREXPLAINED",
    notes: "Section 7 rule: stops sunlight is good, but later consequences into happier/attitude are unneeded",
  },
  {
    id: 29,
    taskType: "build_the_bridge",
    promptTitle: "Dining Table Repair vs Replacement",
    context: {
      pointA: "A family repairs the single broken leg of its sturdy dining table for $30.",
      conclusionC: "Repairing the table is much better value than replacing it.",
    },
    modelAnswer: "A new dining table might cost hundreds of dollars, so repairing the only broken part for $30 avoids paying for an entirely new table.",
    response: "Repairing the broken leg for $30 instead of buying a $500 table saves $470.",
    expectedCategory: "CLEAR_COMPLETE",
    notes: "Spec diagnosis: CLEAR_COMPLETE with concrete numbers",
  },
  {
    id: 30,
    taskType: "build_the_bridge",
    promptTitle: "Dining Table Repair vs Replacement",
    context: {
      pointA: "A family repairs the single broken leg of its sturdy dining table for $30.",
      conclusionC: "Repairing the table is much better value than replacing it.",
    },
    modelAnswer: "A new dining table might cost hundreds of dollars, so repairing the only broken part for $30 avoids paying for an entirely new table.",
    response: "For a small repair such as a loose table leg, fixing the damaged part may be cheaper than replacing the whole item.",
    expectedCategory: "CLEAR_COMPLETE",
    notes: "Spec diagnosis: appropriately qualified complex sentence, CLEAR_COMPLETE",
  },
];

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

async function evaluateOne(tc) {
  const userPrompt = `TASK TYPE: ${tc.taskType}
CONTEXT:
${JSON.stringify(tc.context, null, 2)}
TARGET MECHANISM TIP: ${tc.targetMechanismTip || "N/A"}
REFERENCE MODEL ANSWER: ${tc.modelAnswer || "N/A"}

STUDENT RESPONSE:
"${tc.response}"`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://scholarship-writing-lab.vercel.app",
      "X-Title": "Scholarship Writing Lab Calibration",
    },
    body: JSON.stringify({
      model: SELECTED_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 700,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${txt}`);
  }

  const json = await response.json();
  const raw = json.choices?.[0]?.message?.content;
  return JSON.parse(raw);
}

async function runAll() {
  console.log(`Starting calibration on ${TEST_CASES.length} test cases with ${SELECTED_MODEL}...\n`);
  const results = [];
  let matches = 0;

  for (const tc of TEST_CASES) {
    process.stdout.write(`[${tc.id}/30] ${tc.promptTitle} (Expected: ${tc.expectedCategory})... `);
    try {
      const data = await evaluateOne(tc);
      const diagnoses = data.diagnoses || [];

      const isMatch = diagnoses.some((d) => {
        if (d === tc.expectedCategory) return true;
        if (tc.expectedCategory === "OVEREXPLAINED" && (d === "UNNECESSARY_CAUSAL_EXTENSION" || d === "OVEREXPLAINED")) return true;
        if (tc.expectedCategory === "UNDEREXPLAINED" && (d === "MISSING_LOGICAL_STEP" || d === "UNDEREXPLAINED" || d === "RESTATES_CLAIM")) return true;
        if (tc.expectedCategory === "RESTATES_CLAIM" && (d === "UNDEREXPLAINED" || d === "MISSING_LOGICAL_STEP" || d === "RESTATES_CLAIM")) return true;
        return false;
      });

      if (isMatch) {
        matches++;
        console.log(`✓ MATCH [${diagnoses.join(", ")}] (${data.scorePercentage}%)`);
      } else {
        console.log(`✗ MISMATCH [Expected: ${tc.expectedCategory}, Got: ${diagnoses.join(", ")}] (${data.scorePercentage}%)`);
      }

      results.push({
        id: tc.id,
        prompt: tc.promptTitle,
        taskType: tc.taskType,
        studentResponse: tc.response,
        expectedCategory: tc.expectedCategory,
        evaluatorDiagnoses: diagnoses,
        isMatch,
        scores: {
          scorePercentage: data.scorePercentage,
          logicalCompleteness: data.logicalCompleteness,
          efficiency: data.efficiency,
          clarity: data.clarity,
          sentenceControl: data.sentenceControl,
          precision: data.precision,
        },
        feedback: data.feedback,
        modelAnswer: data.modelAnswer,
        notes: tc.notes,
      });

      // Small throttle between calls
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.push({
        id: tc.id,
        prompt: tc.promptTitle,
        studentResponse: tc.response,
        expectedCategory: tc.expectedCategory,
        error: err.message,
      });
    }
  }

  console.log(`\n========================================`);
  console.log(`CALIBRATION RESULTS SUMMARY:`);
  console.log(`Total test cases: ${TEST_CASES.length}`);
  console.log(`Matches: ${matches} / ${TEST_CASES.length} (${Math.round((matches / TEST_CASES.length) * 100)}%)`);
  console.log(`========================================\n`);

  const outPath = path.join(process.cwd(), "scripts", "calibration-results.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify({ summary: { total: TEST_CASES.length, matches, matchRate: `${Math.round((matches / TEST_CASES.length) * 100)}%` }, results }, null, 2)
  );
  console.log(`Detailed results saved to ${outPath}`);
}

runAll();
