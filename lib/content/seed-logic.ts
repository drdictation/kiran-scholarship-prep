import { LogicQuestion, LogicCategory } from "@/types";

export const LOGIC_CATEGORY_META: Record<
  LogicCategory,
  { name: string; description: string; seedStrength?: boolean }
> = {
  ordering_sequencing: {
    name: "Ordering / Sequencing",
    description: "Arranging items based on linear, temporal, or spatial constraints.",
    seedStrength: true,
  },
  deductive_reasoning: {
    name: "Deductive Reasoning",
    description: "Drawing logically valid and unavoidable conclusions from given premises.",
    seedStrength: true,
  },
  conditional_logic: {
    name: "Conditional Logic (If A then B)",
    description: "Understanding conditional rules without confusing converse or inverse.",
    seedStrength: false, // weakness
  },
  necessary_sufficient: {
    name: "Necessary vs Sufficient",
    description: "Distinguishing required conditions from conditions that guarantee an outcome.",
    seedStrength: false, // weakness
  },
  must_could_cannot: {
    name: "Must / Could / Cannot Be True",
    description: "Separating certain truths, possible outcomes, and logical impossibilities.",
    seedStrength: false, // constraint based
  },
  elimination_reasoning: {
    name: "Elimination Reasoning",
    description: "Systematically ruling out options through indirect constraints.",
    seedStrength: false, // weakness
  },
  truth_lie: {
    name: "Truth / Lie Logic",
    description: "Resolving statements made by reliable truth-tellers vs knights/knaves.",
    seedStrength: true,
  },
  constraint_satisfaction: {
    name: "Constraint Satisfaction",
    description: "Navigating interlocking rules to determine viable configurations.",
    seedStrength: false, // weakness
  },
  pattern_recognition: {
    name: "Pattern Recognition",
    description: "Identifying underlying structural transformations and systematic progressions.",
    seedStrength: true,
  },
  number_logic: {
    name: "Number Logic",
    description: "Deducing quantities or properties using mathematical constraints without trial-and-error.",
    seedStrength: true,
  },
  classification_odd_one: {
    name: "Classification & Odd-One-Out",
    description: "Categorizing items by essential logical properties rather than surface features.",
    seedStrength: true,
  },
  pigeonhole_guarantee: {
    name: "Pigeonhole & Worst-Case Guarantee",
    description: "Calculating the exact threshold required to guarantee a specific outcome.",
    seedStrength: false, // weakness
  },
  rule_testing_counterexample: {
    name: "Rule Testing & Disproof",
    description: "Identifying minimal tests or counterexamples required to disprove a rule (Wason-style).",
    seedStrength: false, // weakness
  },
};

export const SEED_LOGIC_QUESTIONS: LogicQuestion[] = [
  // 1. Ordering / Sequencing
  {
    id: "logic-ord-01",
    category: "ordering_sequencing",
    subSkill: "Relative position ordering",
    difficulty: 1,
    premises: "In a 100m sprint: Liam finished ahead of Noah. Noah finished ahead of Ethan. Oliver finished ahead of Liam.",
    question: "Who finished in third place?",
    options: [
      { id: "A", text: "Oliver" },
      { id: "B", text: "Liam" },
      { id: "C", text: "Noah" },
      { id: "D", text: "Ethan" },
    ],
    correctAnswer: "C",
    explanation: "The complete finishing order from 1st to 4th is Oliver → Liam → Noah → Ethan. Therefore, Noah is in 3rd place.",
    commonErrorFeedback: {
      B: "Liam is in 2nd place behind Oliver.",
      D: "Ethan finished last (4th place).",
      A: "Oliver finished 1st.",
    },
  },
  {
    id: "logic-ord-02",
    category: "ordering_sequencing",
    subSkill: "Strict linear placement",
    difficulty: 2,
    premises: "Five books (A, B, C, D, E) sit on a shelf from left to right. C is immediately to the right of A. E is at the far right. B is between C and D.",
    question: "Which book is in the exact middle position (third from the left)?",
    options: [
      { id: "A", text: "Book A" },
      { id: "B", text: "Book B" },
      { id: "C", text: "Book C" },
      { id: "D", text: "Book D" },
    ],
    correctAnswer: "B",
    explanation: "Position 5 is E. A and C must be at positions 1 and 2 because B is between C and D, placing B at 3 and D at 4. Order: A, C, B, D, E. Book B is in the middle.",
    commonErrorFeedback: {
      C: "Book C is in the second position, right after A.",
      D: "Book D is in fourth position, just before E.",
    },
  },

  // 2. Deductive Reasoning
  {
    id: "logic-ded-01",
    category: "deductive_reasoning",
    subSkill: "Transitive syllogism",
    difficulty: 1,
    premises: "All marsupials are mammals. All koalas are marsupials. Barnaby is a koala.",
    question: "Which statement is guaranteed to be true?",
    options: [
      { id: "A", text: "All mammals are koalas." },
      { id: "B", text: "Barnaby is a mammal." },
      { id: "C", text: "Barnaby eats only eucalyptus leaves." },
      { id: "D", text: "Some marsupials are not mammals." },
    ],
    correctAnswer: "B",
    explanation: "Since Barnaby is a koala, and all koalas are marsupials, and all marsupials are mammals, Barnaby is necessarily a mammal.",
    commonErrorFeedback: {
      A: "Invalid reversal: All koalas are mammals does not mean all mammals are koalas.",
      C: "This may be biologically true in real life, but it cannot be deduced from the given premises.",
    },
  },
  {
    id: "logic-ded-02",
    category: "deductive_reasoning",
    subSkill: "Categorical deduction",
    difficulty: 2,
    premises: "No reptiles have fur. All snakes are reptiles. Some pets are snakes.",
    question: "What logically follows from these facts?",
    options: [
      { id: "A", text: "No pets have fur." },
      { id: "B", text: "Some pets do not have fur." },
      { id: "C", text: "All reptiles are pets." },
      { id: "D", text: "Snakes with fur are very rare." },
    ],
    correctAnswer: "B",
    explanation: "Because some pets are snakes, and no snakes have fur (since all snakes are reptiles and no reptiles have fur), those specific pet snakes do not have fur.",
    commonErrorFeedback: {
      A: "Overgeneralization: Only the pet snakes are guaranteed to lack fur; other pets (like dogs) can have fur.",
      D: "The premise states 'No reptiles have fur', making snakes with fur impossible, not merely rare.",
    },
  },

  // 3. Conditional Logic (“if A then B”)
  {
    id: "logic-cnd-01",
    category: "conditional_logic",
    subSkill: "Modus Ponens vs Fallacy of Affirming the Consequent",
    difficulty: 2,
    premises: "Rule: 'If it rains on Saturday, the soccer match is moved indoors.' On Saturday, the soccer match was moved indoors.",
    question: "What can we definitively conclude about the weather on Saturday?",
    options: [
      { id: "A", text: "It definitely rained." },
      { id: "B", text: "It definitely did not rain." },
      { id: "C", text: "It might or might not have rained." },
      { id: "D", text: "The pitch was unplayable due to heavy mud." },
    ],
    correctAnswer: "C",
    explanation: "Rain guarantees moving indoors, but the match could be moved indoors for other reasons (e.g. extreme heat or strong winds). Assuming it must have rained is the converse error.",
    commonErrorFeedback: {
      A: "Assumed converse: 'If A then B' does not mean 'If B then A'. Moving indoors could have other causes.",
      B: "There is no premise stating it could not have rained.",
    },
  },
  {
    id: "logic-cnd-02",
    category: "conditional_logic",
    subSkill: "Modus Tollens (Contrapositive)",
    difficulty: 2,
    premises: "Rule: 'If a student achieves High Distinction, they receive a gold certificate.' Maya did NOT receive a gold certificate.",
    question: "What conclusion must be true?",
    options: [
      { id: "A", text: "Maya did not achieve High Distinction." },
      { id: "B", text: "Maya failed the examination." },
      { id: "C", text: "Maya received a silver certificate." },
      { id: "D", text: "Maya was absent on the day of the exam." },
    ],
    correctAnswer: "A",
    explanation: "Contrapositive rule: If High Distinction guarantees a gold certificate, then not having a gold certificate guarantees Maya did NOT achieve High Distinction.",
    commonErrorFeedback: {
      B: "Unsupported leap: Not achieving High Distinction could mean she scored a Credit or Distinction, not failure.",
      C: "We are not told what certificate she received, only that she didn't get gold.",
    },
  },

  // 4. Necessary vs Sufficient Conditions
  {
    id: "logic-nec-01",
    category: "necessary_sufficient",
    subSkill: "Distinguishing required from guaranteeing conditions",
    difficulty: 2,
    premises: "School rule: 'To join the Robotics Club, a student must be in Grade 5 or 6.' Lucas is in Grade 5.",
    question: "Is Lucas guaranteed to be admitted to the Robotics Club?",
    options: [
      { id: "A", text: "Yes, because being in Grade 5 satisfies the requirement." },
      { id: "B", text: "No, because being in Grade 5 is necessary, but might not be sufficient." },
      { id: "C", text: "Yes, unless he prefers the Drama Club." },
      { id: "D", text: "No, only Grade 6 students are actually admitted." },
    ],
    correctAnswer: "B",
    explanation: "Grade 5 is a necessary condition (a prerequisite), but not necessarily sufficient (there could be capacity limits, permission forms, or entrance tryouts).",
    commonErrorFeedback: {
      A: "Confused necessary with sufficient: meeting a minimum prerequisite does not guarantee automatic selection.",
      D: "Contradicts the premise, which explicitly allows Grade 5 or 6.",
    },
  },
  {
    id: "logic-nec-02",
    category: "necessary_sufficient",
    subSkill: "Sufficient condition implication",
    difficulty: 3,
    premises: "Rule: 'Scoring 95% or higher on the quiz guarantees an automatic prize.' Chloe won a prize.",
    question: "Which of the following must be true?",
    options: [
      { id: "A", text: "Chloe scored at least 95%." },
      { id: "B", text: "Chloe could have scored less than 95%." },
      { id: "C", text: "Nobody scored higher than Chloe." },
      { id: "D", text: "The quiz had exactly 100 questions." },
    ],
    correctAnswer: "B",
    explanation: "Scoring 95% is sufficient to win a prize, but not stated as necessary. Prizes might also be awarded for scoring 90%, for improvement, or via a raffle.",
    commonErrorFeedback: {
      A: "Assumed necessary: 95% guarantees a prize, but lower scores might also win prizes.",
      C: "Unsupported comparison: we know nothing about other students' scores.",
    },
  },

  // 5. Must / Could / Cannot be true
  {
    id: "logic-mcc-01",
    category: "must_could_cannot",
    subSkill: "Distinguishing certainty from possibility",
    difficulty: 2,
    premises: "Premises:\n1. Alex is taller than Ben.\n2. Ben is taller than Charlie.\n3. Daniel is taller than Charlie.",
    question: "Which of the following MUST be true?",
    options: [
      { id: "A", text: "Alex is taller than Daniel." },
      { id: "B", text: "Daniel is taller than Ben." },
      { id: "C", text: "Alex is taller than Charlie." },
      { id: "D", text: "Charlie is taller than Alex." },
    ],
    correctAnswer: "C",
    explanation: "Since Alex > Ben and Ben > Charlie, transitive ordering guarantees Alex > Charlie. Daniel's height relative to Alex or Ben is unknown.",
    commonErrorFeedback: {
      A: "Could be true, but not guaranteed (Daniel could be taller than Alex).",
      B: "Could be true, but not guaranteed (Daniel could be between Ben and Charlie).",
      D: "This cannot be true because Alex > Charlie.",
    },
  },
  {
    id: "logic-mcc-02",
    category: "must_could_cannot",
    subSkill: "Identifying absolute impossibility",
    difficulty: 2,
    premises: "In a box of 10 balls, each ball is either entirely red or entirely blue. There are more red balls than blue balls.",
    question: "Which statement CANNOT be true?",
    options: [
      { id: "A", text: "There are 6 red balls and 4 blue balls." },
      { id: "B", text: "There are 9 red balls and 1 blue ball." },
      { id: "C", text: "There are 5 red balls and 5 blue balls." },
      { id: "D", text: "There are 10 red balls and 0 blue balls." },
    ],
    correctAnswer: "C",
    explanation: "If there are 5 red and 5 blue balls, the number of red balls is equal to blue balls, which directly contradicts 'more red balls than blue balls'.",
    commonErrorFeedback: {
      A: "This could be true (6 > 4).",
      D: "This could be true (10 > 0).",
      B: "This could be true (9 > 1).",
    },
  },

  // 6. Elimination Reasoning
  {
    id: "logic-elm-01",
    category: "elimination_reasoning",
    subSkill: "Process of elimination across multiple clues",
    difficulty: 2,
    premises: "Four friends—Zara, Leo, Mia, and Sam—each play a different instrument: violin, flute, drums, or piano.\n1. Neither Zara nor Sam plays the drums.\n2. Leo plays either piano or flute.\n3. Zara does not play the flute.",
    question: "What instrument must Mia play?",
    options: [
      { id: "A", text: "Violin" },
      { id: "B", text: "Flute" },
      { id: "C", text: "Drums" },
      { id: "D", text: "Piano" },
    ],
    correctAnswer: "C",
    explanation: "Who plays drums? Not Zara, not Sam (clue 1), and not Leo (plays piano or flute, clue 2). By elimination, Mia must play the drums.",
    commonErrorFeedback: {
      A: "Violin is played by Zara (since Zara does not play drums or flute, and Leo plays piano/flute).",
      B: "Mia must take drums because no one else can play them.",
    },
  },
  {
    id: "logic-elm-02",
    category: "elimination_reasoning",
    subSkill: "Indirect elimination",
    difficulty: 3,
    premises: "A mystery code has three distinct digits chosen from {1, 2, 3, 4, 5}.\n- None of the digits is even.\n- The sum of the three digits is 9.",
    question: "Which digit MUST be included in the code?",
    options: [
      { id: "A", text: "1" },
      { id: "B", text: "3" },
      { id: "C", text: "5" },
      { id: "D", text: "All three digits (1, 3, and 5)" },
    ],
    correctAnswer: "D",
    explanation: "Eliminating even numbers (2 and 4) leaves only the odd numbers {1, 3, 5}. Since the code uses three distinct digits, it must contain 1, 3, and 5 (sum: 1 + 3 + 5 = 9).",
    commonErrorFeedback: {
      A: "While 1 is included, 3 and 5 are also strictly required; D is the complete deduction.",
      B: "Incomplete elimination: all three available odd digits are forced.",
    },
  },

  // 7. Truth / Lie Problems
  {
    id: "logic-trl-01",
    category: "truth_lie",
    subSkill: "Single liar identification",
    difficulty: 2,
    premises: "One of three suspects stole the trophy. Exactly ONE suspect is lying, and two are telling the truth.\n- Arthur says: 'Barnaby stole the trophy.'\n- Barnaby says: 'I did not steal the trophy.'\n- Charlie says: 'I did not steal the trophy.'",
    question: "Who is the liar, and who stole the trophy?",
    options: [
      { id: "A", text: "Arthur is lying; Charlie stole the trophy." },
      { id: "B", text: "Barnaby is lying; Barnaby stole the trophy." },
      { id: "C", text: "Charlie is lying; Charlie stole the trophy." },
      { id: "D", text: "Arthur is lying; Arthur stole the trophy." },
    ],
    correctAnswer: "B",
    explanation: "Arthur and Barnaby make contradictory statements, so exactly one of them is lying. Since only one person lies overall, Charlie is telling the truth (not Charlie). If Arthur lies, Barnaby is innocent and nobody is left. Therefore Barnaby lies, Arthur tells truth, and Barnaby stole the trophy.",
    commonErrorFeedback: {
      A: "If Arthur is lying, then Barnaby and Charlie both tell the truth, meaning neither stole it—leaving no culprit.",
      C: "If Charlie lies, then both Arthur and Barnaby would have to tell the truth, but they contradict each other.",
    },
  },
  {
    id: "logic-trl-02",
    category: "truth_lie",
    subSkill: "Hypothesis testing on knights/knaves",
    difficulty: 3,
    premises: "On an island, Truth-tellers always tell the truth and Liars always lie. You meet Jack and Jill.\nJack says: 'At least one of us is a Liar.'",
    question: "What are Jack and Jill?",
    options: [
      { id: "A", text: "Jack is a Truth-teller, and Jill is a Liar." },
      { id: "B", text: "Jack is a Liar, and Jill is a Truth-teller." },
      { id: "C", text: "Both are Liars." },
      { id: "D", text: "Both are Truth-tellers." },
    ],
    correctAnswer: "A",
    explanation: "If Jack were a Liar, his statement 'At least one of us is a Liar' would be true, which is impossible for a Liar. Thus Jack is a Truth-teller. For his statement to be true, the other person (Jill) must be a Liar.",
    commonErrorFeedback: {
      C: "A Liar cannot say 'At least one of us is a Liar', because that would make the statement true.",
      D: "If both were Truth-tellers, Jack's statement would be false, which contradicts him being a Truth-teller.",
    },
  },

  // 8. Constraint Satisfaction
  {
    id: "logic-cst-01",
    category: "constraint_satisfaction",
    subSkill: "Interlocking seating constraints",
    difficulty: 2,
    premises: "Four students (W, X, Y, Z) sit in a single row of four chairs (1 to 4 from left to right).\n- W cannot sit next to X.\n- Y must sit in chair 1.\n- Z must sit next to W.",
    question: "Which chair MUST student X sit in?",
    options: [
      { id: "A", text: "Chair 2" },
      { id: "B", text: "Chair 3" },
      { id: "C", text: "Chair 4" },
      { id: "D", text: "Either Chair 2 or Chair 4" },
    ],
    correctAnswer: "A",
    explanation: "Chair 1 has Y. Remaining chairs are 2, 3, 4. Z must sit next to W, so {Z, W} must occupy the adjacent pair (chairs 3 and 4). That leaves chair 2 for X. (Notice W in 4 and Z in 3 ensures W is not next to X). Thus X must be in Chair 2.",
    commonErrorFeedback: {
      C: "Chair 4 is occupied by either Z or W to keep them adjacent.",
      B: "Chair 3 is occupied by either Z or W.",
    },
  },
  {
    id: "logic-cst-02",
    category: "constraint_satisfaction",
    subSkill: "Schedule conflict resolution",
    difficulty: 3,
    premises: "Three workshops (Art, Code, Drama) run across Periods 1, 2, and 3.\n- Toby cannot do Period 1.\n- Code is only offered in Period 2.\n- If Toby takes Drama, he must take it before Art.",
    question: "If Toby attends both Art and Drama, when must he take Drama?",
    options: [
      { id: "A", text: "Period 1" },
      { id: "B", text: "Period 2" },
      { id: "C", text: "Period 3" },
      { id: "D", text: "It is impossible for Toby to take Drama before Art." },
    ],
    correctAnswer: "D",
    explanation: "Toby can only attend Periods 2 and 3. Period 2 is taken by Code, leaving only one free period (Period 3). He cannot take two workshops (Drama and Art) across only one period, so taking Drama before Art is impossible.",
    commonErrorFeedback: {
      B: "Period 2 is exclusively Code, so Drama cannot be placed there.",
      A: "Toby cannot attend Period 1.",
    },
  },

  // 9. Pattern Recognition
  {
    id: "logic-pat-01",
    category: "pattern_recognition",
    subSkill: "Alternating multi-step progression",
    difficulty: 1,
    premises: "Look at the sequence: 4, 7, 6, 9, 8, 11, 10, ...",
    question: "What is the next number in this sequence?",
    options: [
      { id: "A", text: "9" },
      { id: "B", text: "12" },
      { id: "C", text: "13" },
      { id: "D", text: "14" },
    ],
    correctAnswer: "C",
    explanation: "The pattern alternates between adding 3 and subtracting 1 (+3, -1, +3, -1...). Following 10 (-1 from 11), the next step is +3: 10 + 3 = 13.",
    commonErrorFeedback: {
      A: "You repeated the -1 step instead of alternating to +3.",
      B: "Check the difference: 4->7 (+3), 6->9 (+3), 8->11 (+3), so 10 + 3 = 13.",
    },
  },
  {
    id: "logic-pat-02",
    category: "pattern_recognition",
    subSkill: "Geometric rotation rule",
    difficulty: 2,
    premises: "A symbol sequence transforms in two alternating rules: Rule 1 rotates clockwise 90 degrees; Rule 2 flips horizontally.",
    question: "Starting with 'L', after applying Rule 1 followed immediately by Rule 2, what does the letter look like?",
    options: [
      { id: "A", text: "An upside-down 'L' (rotated 180°)" },
      { id: "B", text: "A horizontal base pointing left with vertical stem going up ('⅃')" },
      { id: "C", text: "A horizontal base pointing right with vertical stem going down" },
      { id: "D", text: "The original letter 'L'" },
    ],
    correctAnswer: "A",
    explanation: "Rotating 'L' 90° clockwise points the long stem right and short arm down. Flipping horizontally mirrors left-to-right, making the long stem point left and short arm down, which is equivalent to a 180° rotation.",
    commonErrorFeedback: {
      D: "A rotation followed by a flip does not return to the original.",
      B: "Missed the effect of the horizontal reflection.",
    },
  },

  // 10. Number Logic
  {
    id: "logic-num-01",
    category: "number_logic",
    subSkill: "Simultaneous integer constraints",
    difficulty: 2,
    premises: "I am thinking of a 2-digit number.\n- Both digits are prime numbers.\n- The sum of the digits is 10.\n- The tens digit is greater than the units digit.",
    question: "What is the number?",
    options: [
      { id: "A", text: "55" },
      { id: "B", text: "73" },
      { id: "C", text: "82" },
      { id: "D", text: "91" },
    ],
    correctAnswer: "B",
    explanation: "Prime single digits are {2, 3, 5, 7}. Pairs summing to 10 are (5, 5) and (7, 3). Since tens > units, 55 is excluded (digits equal), leaving 73.",
    commonErrorFeedback: {
      A: "Digits must have tens > units; 5 is not greater than 5.",
      C: "8 is not a prime number.",
      D: "Neither 9 nor 1 is prime.",
    },
  },
  {
    id: "logic-num-02",
    category: "number_logic",
    subSkill: "Parity and divisibility constraints",
    difficulty: 2,
    premises: "A basket holds between 20 and 30 apples.\n- When grouped in pairs, 1 apple is left over.\n- When grouped into bundles of 5, none are left over.",
    question: "How many apples are in the basket?",
    options: [
      { id: "A", text: "20" },
      { id: "B", text: "24" },
      { id: "C", text: "25" },
      { id: "D", text: "30" },
    ],
    correctAnswer: "C",
    explanation: "Grouped in 5s with none left means a multiple of 5 between 20 and 30: 20, 25, or 30. Grouped in 2s with 1 left means odd. The only odd multiple of 5 here is 25.",
    commonErrorFeedback: {
      A: "20 leaves 0 remainder when paired (it is even).",
      D: "30 is even, leaving no remainder.",
      B: "24 is not a multiple of 5.",
    },
  },

  // 11. Classification & Odd-One-Out
  {
    id: "logic-cls-01",
    category: "classification_odd_one",
    subSkill: "Structural property classification",
    difficulty: 1,
    premises: "Consider the four geometric shapes: Square, Rectangle, Rhombus, Trapezium.",
    question: "Which shape is the odd-one-out based on parallel sides?",
    options: [
      { id: "A", text: "Square" },
      { id: "B", text: "Rectangle" },
      { id: "C", text: "Rhombus" },
      { id: "D", text: "Trapezium" },
    ],
    correctAnswer: "D",
    explanation: "Square, rectangle, and rhombus are all parallelograms with two pairs of parallel opposite sides. A trapezium has only one pair of parallel sides.",
    commonErrorFeedback: {
      A: "Square has 2 pairs of parallel sides like rectangle and rhombus.",
      C: "Rhombus has 2 pairs of parallel sides.",
    },
  },
  {
    id: "logic-cls-02",
    category: "classification_odd_one",
    subSkill: "Logical category membership",
    difficulty: 2,
    premises: "Look at the four words: Compass, Sundial, Clock, Hourglass.",
    question: "Which word does NOT belong with the others based on primary function?",
    options: [
      { id: "A", text: "Compass" },
      { id: "B", text: "Sundial" },
      { id: "C", text: "Clock" },
      { id: "D", text: "Hourglass" },
    ],
    correctAnswer: "A",
    explanation: "Sundial, clock, and hourglass are instruments for measuring time. A compass is an instrument for measuring magnetic orientation / direction.",
    commonErrorFeedback: {
      D: "Hourglass measures elapsed time, fitting the timekeeping group.",
      B: "Sundial measures time using solar shadows.",
    },
  },

  // 12. Pigeonhole / Worst-Case Guarantee
  {
    id: "logic-pgh-01",
    category: "pigeonhole_guarantee",
    subSkill: "Worst-case extraction guarantee",
    difficulty: 2,
    premises: "A dark drawer contains 10 black socks and 10 white socks (all identical in size and shape). You cannot see inside the drawer.",
    question: "What is the minimum number of socks you must pull out to GUARANTEE you have at least one matching pair?",
    options: [
      { id: "A", text: "2 socks" },
      { id: "B", text: "3 socks" },
      { id: "C", text: "11 socks" },
      { id: "D", text: "12 socks" },
    ],
    correctAnswer: "B",
    explanation: "There are only 2 colors (categories). In the worst-case scenario, the first 2 socks pulled are different colors (1 black, 1 white). The 3rd sock must match one of them. Thus, 3 socks guarantee a pair.",
    commonErrorFeedback: {
      A: "2 socks might happen to be a pair, but is NOT guaranteed (could be 1 black and 1 white).",
      C: "11 socks is what is needed to guarantee a specific color (e.g. at least one white), not just any matching pair.",
    },
  },
  {
    id: "logic-pgh-02",
    category: "pigeonhole_guarantee",
    subSkill: "Multi-category worst-case guarantee",
    difficulty: 3,
    premises: "A bowl has 5 red marbles, 6 green marbles, and 7 blue marbles. You pick marbles blindly.",
    question: "How many marbles must you take to GUARANTEE you hold at least 3 marbles of the SAME color?",
    options: [
      { id: "A", text: "3 marbles" },
      { id: "B", text: "7 marbles" },
      { id: "C", text: "9 marbles" },
      { id: "D", text: "15 marbles" },
    ],
    correctAnswer: "B",
    explanation: "Worst-case scenario: you draw 2 of each of the 3 colors without getting 3 of any (2 red + 2 green + 2 blue = 6 marbles). The 7th marble must complete a group of 3.",
    commonErrorFeedback: {
      A: "3 could result in 1 red, 1 green, 1 blue—no three of the same color.",
      C: "Overestimation: by marble 7 a match of 3 is mathematically unavoidable.",
    },
  },

  // 13. Rule Testing / Counterexample Reasoning
  {
    id: "logic-rul-01",
    category: "rule_testing_counterexample",
    subSkill: "Wason selection task / Disproof test",
    difficulty: 3,
    premises: "Rule under test: 'If a card has a vowel on one side, it must have an even number on the other side.'\nYou see four cards showing: [ E ] , [ K ] , [ 4 ] , [ 7 ].",
    question: "Which cards MUST you turn over to definitively test whether the rule is true?",
    options: [
      { id: "A", text: "Card [ E ] and Card [ 4 ]" },
      { id: "B", text: "Card [ E ] and Card [ 7 ]" },
      { id: "C", text: "Card [ E ] only" },
      { id: "D", text: "All four cards" },
    ],
    correctAnswer: "B",
    explanation: "To test 'Vowel → Even', you must check [E] (if its back is odd, rule is broken) and [7] (if its back is a vowel, rule is broken). Turning [4] is unnecessary because consonants can have even numbers on their back.",
    commonErrorFeedback: {
      A: "Common misconception: Turning [4] does not test the rule because the rule does not say even numbers MUST have vowels.",
      C: "Insufficient: [7] could have a vowel on the other side and disprove the rule.",
      D: "Consonant [K] cannot disprove the rule regardless of what number is on back.",
    },
  },
  {
    id: "logic-rul-02",
    category: "rule_testing_counterexample",
    subSkill: "Identifying counterexample to a universal claim",
    difficulty: 2,
    premises: "Ethan claims: 'All Australian birds can fly.'",
    question: "Which of the following would be a direct counterexample that disproves Ethan's claim?",
    options: [
      { id: "A", text: "Observing an Australian Magpie that flies swiftly." },
      { id: "B", text: "Observing an African Ostrich that cannot fly." },
      { id: "C", text: "Observing an Australian Emu that cannot fly." },
      { id: "D", text: "Observing a Sugar Glider that can glide from trees." },
    ],
    correctAnswer: "C",
    explanation: "A counterexample must satisfy the condition (be an Australian bird) but violate the claim (cannot fly). An Australian Emu is an Australian bird that cannot fly, disproving Ethan's universal statement.",
    commonErrorFeedback: {
      A: "An example supporting the rule does not disprove it.",
      B: "The Ostrich is African, not Australian, so it does not test the claim about Australian birds.",
      D: "A Sugar Glider is a marsupial mammal, not a bird.",
    },
  },
];
