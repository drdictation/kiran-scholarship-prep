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

  // --- ADDITIONAL HIGH-DIFFICULTY QUESTIONS (Melbourne Year 5 Private School Scholarship Level: EduTest / ACER / AAS) ---

  // 1. Ordering / Sequencing (Multi-dimensional / Circular / Relative)
  {
    id: "logic-ord-03",
    category: "ordering_sequencing",
    subSkill: "Relative time-interval deduction",
    difficulty: 3,
    premises: "Five students (P, Q, R, S, T) finish an exam at different times.\n- P finished before Q, but after R.\n- S finished before T, but after Q.\n- No two students finished at the same time.",
    question: "If exactly one student finished between R and Q, who must that student be?",
    options: [
      { id: "A", text: "P" },
      { id: "B", text: "S" },
      { id: "C", text: "T" },
      { id: "D", text: "Cannot be determined" },
    ],
    correctAnswer: "A",
    explanation: "From the clues: R finished before P, and P finished before Q (R → P → Q). Since P is strictly between R and Q, P must be that student.",
    commonErrorFeedback: {
      B: "S finished after Q, not between R and Q.",
      C: "T finished after S (and after Q).",
      D: "The sequence R → P → Q is fixed by the premises.",
    },
  },
  {
    id: "logic-ord-04",
    category: "ordering_sequencing",
    subSkill: "Circular table relative seating",
    difficulty: 3,
    premises: "Six friends (A, B, C, D, E, F) sit evenly spaced around a circular table.\n- A sits directly opposite D.\n- B sits immediately to the right of A.\n- F sits directly opposite B.\n- C is not adjacent to D.",
    question: "Who sits immediately to the left of D?",
    options: [
      { id: "A", text: "C" },
      { id: "B", text: "E" },
      { id: "C", text: "F" },
      { id: "D", text: "B" },
    ],
    correctAnswer: "B",
    explanation: "Around the circle in clockwise order: A, B, E/C... Since F is opposite B, F is at position 5 (counter-clockwise 1 from A). D is opposite A (position 4). The spots adjacent to D are 3 and 5 (F is at 5). Since C cannot sit next to D, C must be at position 3? Wait: if F is next to D on one side, position 3 must be E because C cannot be adjacent to D. To D's left (clockwise) is E.",
    commonErrorFeedback: {
      A: "C cannot sit next to D per the fourth premise.",
      C: "F is to D's right, not left.",
      D: "B is opposite F, not adjacent to D.",
    },
  },

  // 2. Deductive Reasoning (Complex Syllogisms & Overlapping Sets)
  {
    id: "logic-ded-03",
    category: "deductive_reasoning",
    subSkill: "Quantified set deduction ('Some' + 'No')",
    difficulty: 3,
    premises: "1. All members of the debating team are voracious readers.\n2. No voracious readers skip morning homeroom.\n3. Some chess champions are on the debating team.",
    question: "Which conclusion is strictly guaranteed?",
    options: [
      { id: "A", text: "All chess champions attend morning homeroom." },
      { id: "B", text: "Some chess champions do not skip morning homeroom." },
      { id: "C", text: "All voracious readers are on the debating team." },
      { id: "D", text: "No chess champions skip morning homeroom." },
    ],
    correctAnswer: "B",
    explanation: "The chess champions who are on the debating team are voracious readers. Voracious readers never skip morning homeroom. Therefore, those specific chess champions do not skip morning homeroom.",
    commonErrorFeedback: {
      A: "Overgeneralization: Only the chess champions on the debating team are guaranteed; others are unknown.",
      C: "Invalid reversal: Debaters are readers, but not all readers must debate.",
      D: "Overgeneralization: Applies a rule about some chess players to all chess players.",
    },
  },

  // 3. Conditional Logic (Nested / Multi-rule Contrapositives)
  {
    id: "logic-cnd-03",
    category: "conditional_logic",
    subSkill: "Chained conditional contrapositive",
    difficulty: 3,
    premises: "Rules for house points:\n1. If a student receives an academic commendation, they attend the Principal's Luncheon.\n2. If a student attends the Principal's Luncheon, they receive a gold blazer badge.\nFact: Julian does NOT have a gold blazer badge.",
    question: "What can be logically deduced with complete certainty?",
    options: [
      { id: "A", text: "Julian did not receive an academic commendation." },
      { id: "B", text: "Julian was absent from the Principal's Luncheon due to illness." },
      { id: "C", text: "Julian received a silver blazer badge." },
      { id: "D", text: "Julian lost his badge." },
    ],
    correctAnswer: "A",
    explanation: "Chained rule: Commendation → Luncheon → Gold Badge. Contrapositive: No Gold Badge → No Luncheon → No Commendation. Julian cannot have received an academic commendation.",
    commonErrorFeedback: {
      B: "Speculation outside logical premises.",
      C: "Unsupported claim; no mention of silver badges in rules.",
    },
  },
  {
    id: "logic-cnd-04",
    category: "conditional_logic",
    subSkill: "Biconditional vs Single Conditional",
    difficulty: 3,
    premises: "School gate rule: 'Students are permitted to leave grounds during lunch ONLY IF they have written senior-prefect clearance.'\nArchie does NOT have written senior-prefect clearance.",
    question: "Can Archie leave school grounds during lunch?",
    options: [
      { id: "A", text: "Yes, if a teacher accompanies him." },
      { id: "B", text: "No, he is strictly not permitted to leave." },
      { id: "C", text: "Yes, because 'only if' indicates a recommendation, not a requirement." },
      { id: "D", text: "It depends on whether he is in Year 5 or Year 6." },
    ],
    correctAnswer: "B",
    explanation: "'X only if Y' means Y is a mandatory necessary condition (No Y → No X). Without clearance, leaving grounds is strictly impossible under the rule.",
    commonErrorFeedback: {
      A: "Premises provide no teacher exception clause.",
      C: "'Only if' denotes an absolute necessary condition in formal scholarship logic.",
    },
  },

  // 4. Necessary vs Sufficient (Subtle Scholarship Distinctions)
  {
    id: "logic-nec-03",
    category: "necessary_sufficient",
    subSkill: "Identifying necessary condition from compound statements",
    difficulty: 3,
    premises: "A coach states: 'Winning both the semifinal AND maintaining zero penalties guarantees reaching the state championship.'",
    question: "Which of the following is true based purely on the coach's statement?",
    options: [
      { id: "A", text: "Maintaining zero penalties is necessary to reach the state championship." },
      { id: "B", text: "Winning the semifinal is sufficient on its own to reach the state championship." },
      { id: "C", text: "The combination of winning the semifinal and zero penalties is sufficient to reach the state championship." },
      { id: "D", text: "A team that incurs one penalty cannot reach the state championship." },
    ],
    correctAnswer: "C",
    explanation: "'Guarantees' denotes sufficiency. The compound condition (winning AND zero penalties) is jointly sufficient. Neither is stated to be individually necessary or individually sufficient.",
    commonErrorFeedback: {
      A: "Confusing sufficiency with necessity; other pathways might qualify a team.",
      B: "Winning alone is not sufficient; the zero penalties condition is coupled.",
      D: "Penalties might prevent this specific guarantee, but not disqualify through alternate pathways.",
    },
  },

  // 5. Must / Could / Cannot be true (Multi-constraint Grid)
  {
    id: "logic-mcc-03",
    category: "must_could_cannot",
    subSkill: "Deducing what cannot be true in score distributions",
    difficulty: 3,
    premises: "In a 4-round math contest, scores are positive integers. Total score is 30. No round scored lower than 5. Round 3 was the highest single score.",
    question: "Which score for Round 3 CANNOT be true?",
    options: [
      { id: "A", text: "15" },
      { id: "B", text: "12" },
      { id: "C", text: "8" },
      { id: "D", text: "9" },
    ],
    correctAnswer: "C",
    explanation: "If Round 3 were 8, then the maximum possible total for all 4 rounds would be 8 + 7 + 7 + 7 = 29 (since Round 3 is strictly highest). But the total is 30. Therefore Round 3 cannot be 8.",
    commonErrorFeedback: {
      A: "15 is possible (e.g., 5, 5, 15, 5 = 30).",
      B: "12 is possible (e.g., 6, 6, 12, 6 = 30).",
      D: "9 is possible (e.g., 6, 7, 9, 8 = 30).",
    },
  },

  // 6. Elimination Reasoning (Complex Matrix Elimination)
  {
    id: "logic-elm-03",
    category: "elimination_reasoning",
    subSkill: "Double-attribute matrix elimination",
    difficulty: 3,
    premises: "Three students (Kiran, Liam, Noah) each study one unique language (French, German, Latin) and play one unique sport (Cricket, Tennis, Rowing).\n1. The German student rows.\n2. Kiran does not row and does not study Latin.\n3. Liam plays cricket.",
    question: "What language does Liam study?",
    options: [
      { id: "A", text: "French" },
      { id: "B", text: "German" },
      { id: "C", text: "Latin" },
      { id: "D", text: "Cannot be deduced" },
    ],
    correctAnswer: "C",
    explanation: "German student rows (Clue 1). Liam plays cricket (Clue 3), so Liam is NOT the German student. Kiran does not row (Clue 2), so Kiran is NOT German. Therefore Noah must row and study German. Kiran does not study Latin (Clue 2) and is not German, so Kiran studies French. By elimination, Liam studies Latin.",
    commonErrorFeedback: {
      A: "Kiran studies French because Kiran cannot be German or Latin.",
      B: "Liam plays cricket, whereas the German student must row.",
    },
  },

  // 7. Truth / Lie Logic (Alternating / Conditional Liars)
  {
    id: "logic-trl-03",
    category: "truth_lie",
    subSkill: "Self-referential contradiction analysis",
    difficulty: 3,
    premises: "Three islanders (X, Y, Z) speak:\n- X says: 'Y is a liar.'\n- Y says: 'Z is a liar.'\n- Z says: 'Both X and Y are liars.'\nEvery islander is either always a truth-teller or always a liar.",
    question: "Who is telling the truth?",
    options: [
      { id: "A", text: "X only" },
      { id: "B", text: "Y only" },
      { id: "C", text: "Z only" },
      { id: "D", text: "X and Z" },
    ],
    correctAnswer: "B",
    explanation: "If Z were a truth-teller, X and Y must both be liars. But if Y is a liar, X's claim ('Y is a liar') would be true, meaning X is a truth-teller—contradicting Z! Thus Z is a liar. Since Z is a liar, Y's statement ('Z is a liar') is true, making Y a truth-teller. Since Y is a truth-teller, X's statement is false, making X a liar. Only Y tells the truth.",
    commonErrorFeedback: {
      C: "If Z tells the truth, X must lie, which would make Y a truth-teller, creating an impossible contradiction.",
      A: "If X tells truth, Y lies, making Z's statement true, leading to conflict.",
    },
  },

  // 8. Constraint Satisfaction (Capacity & Assignment)
  {
    id: "logic-cst-03",
    category: "constraint_satisfaction",
    subSkill: "Knapsack / exact sum under exclusions",
    difficulty: 3,
    premises: "A team of 3 must be chosen from 5 candidates {A, B, C, D, E} with scores {2, 3, 4, 5, 6}.\n- Total score must equal exactly 12.\n- A and E refuse to work together.\n- If C is chosen, B must also be chosen.",
    question: "Which candidate MUST be on the team?",
    options: [
      { id: "A", text: "Candidate B" },
      { id: "B", text: "Candidate C" },
      { id: "C", text: "Candidate D" },
      { id: "D", text: "Candidate E" },
    ],
    correctAnswer: "C",
    explanation: "Triplets summing to 12 from {2, 3, 4, 5, 6}: (2,4,6) = {A,C,E} (violates A-E rule); (3,4,5) = {B,C,D} (C included, B included? Yes, valid!); (2,3,7 no). Any other? (2,5,5 no). Only valid team is {B, C, D}. In this team, Candidate D is included.",
    commonErrorFeedback: {
      D: "E cannot be paired with A (sum 12 with E=6 requires A=2 and C=4, which violates the A-E refusal).",
      A: "While B is on the team, D is also on it, but verify C's rule: {B,C,D} works. D is strictly present in the sole solution.",
    },
  },

  // 9. Pattern Recognition (Non-standard transformations & matrices)
  {
    id: "logic-pat-03",
    category: "pattern_recognition",
    subSkill: "Second-order differences in number patterns",
    difficulty: 3,
    premises: "Examine the sequence: 2, 5, 11, 20, 32, ...",
    question: "What is the next number in the sequence?",
    options: [
      { id: "A", text: "45" },
      { id: "B", text: "47" },
      { id: "C", text: "46" },
      { id: "D", text: "48" },
    ],
    correctAnswer: "B",
    explanation: "First differences: 5-2=3, 11-5=6, 20-11=9, 32-20=12. The differences increase by 3 each step (+3, +6, +9, +12). Next difference is +15: 32 + 15 = 47.",
    commonErrorFeedback: {
      A: "Added 13 instead of 15.",
      C: "Calculation error in difference series.",
      D: "Added 16 instead of 15.",
    },
  },

  // 10. Number Logic (Modular & Remainder Arithmetic)
  {
    id: "logic-num-03",
    category: "number_logic",
    subSkill: "Simultaneous congruence / calendar cycles",
    difficulty: 3,
    premises: "A school bell rings every 6 minutes. A music chime plays every 8 minutes. Both sound together at 9:00 AM.\nA warning siren sounds every 15 minutes, starting at 9:00 AM.",
    question: "When is the next time all THREE sound simultaneously?",
    options: [
      { id: "A", text: "10:00 AM" },
      { id: "B", text: "10:30 AM" },
      { id: "C", text: "11:00 AM" },
      { id: "D", text: "11:30 AM" },
    ],
    correctAnswer: "C",
    explanation: "Find the Least Common Multiple (LCM) of 6, 8, and 15. Prime factorizations: 6=2×3, 8=2³, 15=3×5. LCM = 2³ × 3 × 5 = 8 × 3 × 5 = 120 minutes = 2 hours. 9:00 AM + 2 hours = 11:00 AM.",
    commonErrorFeedback: {
      A: "60 minutes is not divisible by 8 (60/8 = 7.5).",
      B: "90 minutes is not divisible by 8.",
    },
  },

  // 11. Classification & Odd-One-Out (Abstract Relations)
  {
    id: "logic-cls-03",
    category: "classification_odd_one",
    subSkill: "Second-order relational analogy",
    difficulty: 3,
    premises: "Analyze the relationship pairs:\n1. Hive : Bee\n2. Warren : Rabbit\n3. Web : Spider\n4. Stable : Horse",
    question: "Which pair is the odd-one-out based on how the habitat is constructed?",
    options: [
      { id: "A", text: "Hive : Bee" },
      { id: "B", text: "Warren : Rabbit" },
      { id: "C", text: "Web : Spider" },
      { id: "D", text: "Stable : Horse" },
    ],
    correctAnswer: "D",
    explanation: "A hive, warren, and web are natural habitats built/produced by the animals themselves. A stable is an artificial structure built by humans for the horse.",
    commonErrorFeedback: {
      C: "Web is created by the spider, consistent with hive and warren.",
      B: "Warren is excavated by rabbits.",
    },
  },

  // 12. Pigeonhole / Worst-Case Guarantee (Multi-attribute draws)
  {
    id: "logic-pgh-03",
    category: "pigeonhole_guarantee",
    subSkill: "Two-pair guarantee with unequal distributions",
    difficulty: 3,
    premises: "A bag contains 8 red, 6 blue, 4 green, and 2 yellow counters. You draw counters blindly.",
    question: "What is the minimum number of counters you must draw to GUARANTEE you have at least one green counter?",
    options: [
      { id: "A", text: "5" },
      { id: "B", text: "16" },
      { id: "C", text: "17" },
      { id: "D", text: "19" },
    ],
    correctAnswer: "C",
    explanation: "Worst-case scenario: you draw every non-green counter first. Non-green counters = 8 red + 6 blue + 2 yellow = 16 counters. The 17th counter must be green.",
    commonErrorFeedback: {
      B: "16 counters could be all the red, blue, and yellow counters, leaving zero green.",
      A: "5 counters could all be red.",
      D: "19 is more than necessary; 17 guarantees a green.",
    },
  },

  // 13. Rule Testing & Counterexample Reasoning (Hypothesis Testing & Falsification)
  {
    id: "logic-rul-03",
    category: "rule_testing_counterexample",
    subSkill: "Falsifying a conditional with negation",
    difficulty: 3,
    premises: "Science rule proposed: 'Whenever liquid X is heated above 80°C, it turns blue.'\nA student performs four experiments:\n1. Heated to 90°C → turns blue\n2. Heated to 70°C → turns blue\n3. Heated to 85°C → turns clear\n4. Heated to 60°C → turns clear",
    question: "Which single experiment definitively disproves the rule?",
    options: [
      { id: "A", text: "Experiment 1" },
      { id: "B", text: "Experiment 2" },
      { id: "C", text: "Experiment 3" },
      { id: "D", text: "Experiment 4" },
    ],
    correctAnswer: "C",
    explanation: "To disprove 'Above 80°C → Blue', we need a case where the condition IS met (> 80°C) but the outcome FAILS (not blue). Experiment 3 was 85°C (>80°C) and turned clear, proving the rule false.",
    commonErrorFeedback: {
      B: "Experiment 2 is at 70°C; the rule says nothing about what happens below 80°C.",
      A: "Experiment 1 supports the rule rather than disproving it.",
      D: "Experiment 4 is below 80°C, so it does not test the condition.",
    },
  },
];
