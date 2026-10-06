import {
  RepeatVsAddExercise,
  WhatHappensNextPrompt,
  CausalChainPrompt,
  ExampleEnginePrompt,
  SentenceForgePrompt,
  ArgumentBuilderPrompt,
  FixWeakLinkPrompt,
  OneStepOnlyPrompt,
  BuildParagraphPrompt,
} from "@/types";

/* ============================================================
   1. ARGUMENT BUILDER (Convert Broad Category Lens -> Argument)
   ============================================================ */
export const SEED_ARGUMENT_BUILDER: ArgumentBuilderPrompt[] = [
  {
    id: "ab-1",
    topic: "Museums and galleries should be completely free to the public.",
    domain: "society",
    lens: "Fairness",
    sampleStrongArgument:
      "Free admission allows families with low incomes to learn about history and culture even if they cannot afford expensive tickets.",
    weakExample: "It is fair.",
  },
  {
    id: "ab-2",
    topic: "Space exploration is worth the high financial cost.",
    domain: "science",
    lens: "Health",
    sampleStrongArgument:
      "Technologies developed for astronauts in space can be adapted into life-saving medical scanners and treatments for patients on Earth.",
    weakExample: "It helps health.",
  },
  {
    id: "ab-3",
    topic: "Single-use plastic water bottles should be banned.",
    domain: "environment",
    lens: "Money & Resources",
    sampleStrongArgument:
      "Cities spend millions of dollars cleaning up plastic litter from stormwater drains and waterways that could be prevented with refillable bottles.",
    weakExample: "It saves money.",
  },
  {
    id: "ab-4",
    topic: "Schools should teach practical financial skills.",
    domain: "money_and_resources",
    lens: "Safety & Wellbeing",
    sampleStrongArgument:
      "Understanding budgeting protects young adults from predatory lenders and high-interest debt that causes severe financial stress.",
    weakExample: "Safety.",
  },
  {
    id: "ab-5",
    topic: "Repairing broken appliances is better than buying new ones.",
    domain: "money_and_resources",
    lens: "Environment",
    sampleStrongArgument:
      "Replacing individual broken parts keeps functional machines running and prevents toxic heavy metals in circuit boards from entering landfills.",
    weakExample: "Environment.",
  },
  {
    id: "ab-6",
    topic: "Public transport should be cheaper or free.",
    domain: "society",
    lens: "Convenience & Practicality",
    sampleStrongArgument:
      "Affordable fares persuade daily drivers to commute by train, freeing up congested roads for emergency vehicles and commercial freight.",
    weakExample: "It is convenient.",
  },
  {
    id: "ab-7",
    topic: "Keeping wild animals in zoos is no longer acceptable.",
    domain: "animals",
    lens: "Fairness & Rights",
    sampleStrongArgument:
      "Confining intelligent predators to artificial enclosures deprives them of natural roaming territories and hunting behaviours.",
    weakExample: "Animal rights.",
  },
  {
    id: "ab-8",
    topic: "Children should have mandatory screen-free time each day.",
    domain: "health",
    lens: "People & Health",
    sampleStrongArgument:
      "Stepping away from backlit devices reduces eye fatigue and encourages physical movement that strengthens growing muscles and bones.",
    weakExample: "Health.",
  },
  {
    id: "ab-9",
    topic: "Learning a second language should be mandatory for all primary students.",
    domain: "culture",
    lens: "Learning & Education",
    sampleStrongArgument:
      "Practicing a new language trains the brain to switch between different grammar rules, strengthening overall memory and problem-solving skills.",
    weakExample: "Education.",
  },
  {
    id: "ab-10",
    topic: "Cities should have fewer car parks and more public parks.",
    domain: "society",
    lens: "Community & Society",
    sampleStrongArgument:
      "Replacing paved parking lots with shared green spaces gives neighbourhood residents a welcoming place to meet, exercise, and socialize.",
    weakExample: "Community.",
  },
];

/* ============================================================
   2. CAUSAL CHAIN (Immediate Effect -> Consequence -> Significance)
   ============================================================ */
export const SEED_CAUSAL_CHAINS: CausalChainPrompt[] = [
  {
    id: "cc-1",
    topic: "Schools should teach practical financial skills.",
    domain: "money_and_resources",
    point: "Students learn how compound interest works.",
    sampleImmediate:
      "Students realise that unpaid debts grow much larger over time.",
    sampleConsequence:
      "They borrow more cautiously and avoid signing up for high-interest loans.",
    sampleSignificance:
      "This gives them long-term financial security and independence as adults.",
  },
  {
    id: "cc-2",
    topic: "Cities should plant leafy trees along every footpath.",
    domain: "environment",
    point: "Dense tree foliage shades concrete sidewalks.",
    sampleImmediate:
      "Pavement and road surfaces absorb far less solar heat during summer afternoons.",
    sampleConsequence:
      "Pedestrians and elderly residents can walk comfortably without suffering heat exhaustion.",
    sampleSignificance:
      "This creates an active, walkable city while reducing the energy needed for air conditioning.",
  },
  {
    id: "cc-3",
    topic: "Public transport should be significantly cheaper.",
    domain: "society",
    point: "Ticket fares are reduced to a nominal dollar fee.",
    sampleImmediate:
      "Thousands of daily car commuters switch to buses and trains to save money.",
    sampleConsequence:
      "Traffic volume on major arterial highways drops noticeably during peak hours.",
    sampleSignificance:
      "Commuters save hours of travel time each week while citywide exhaust emissions decrease.",
  },
  {
    id: "cc-4",
    topic: "Repairing broken items is better than buying replacements.",
    domain: "money_and_resources",
    point: "A consumer replaces a cracked phone screen instead of buying a new phone.",
    sampleImmediate:
      "The existing battery, camera, and processor continue to function normally.",
    sampleConsequence:
      "The consumer avoids spending hundreds of dollars while preventing electronics from entering landfills.",
    sampleSignificance:
      "Valuable rare-earth minerals are conserved and industrial manufacturing waste is reduced.",
  },
  {
    id: "cc-5",
    topic: "Everyone needs regular time to be bored without digital devices.",
    domain: "health",
    point: "A student spends an afternoon without access to screens or notifications.",
    sampleImmediate:
      "Without instant digital entertainment, their brain seeks internal stimulation.",
    sampleConsequence:
      "They begin inventing games, drawing, or experimenting with creative hobbies.",
    sampleSignificance:
      "This fosters independent imagination and deep problem-solving instead of passive consumption.",
  },
  {
    id: "cc-6",
    topic: "Advertising directed at children should be restricted.",
    domain: "money_and_resources",
    point: "Fast-food and toy commercials are removed from children's broadcasts.",
    sampleImmediate:
      "Young viewers are no longer bombarded with persuasive appeals for sugary snacks.",
    sampleConsequence:
      "Parents face less pester power at the supermarket and can purchase healthier meals.",
    sampleSignificance:
      "Children establish wholesome lifelong dietary habits, reducing childhood health complications.",
  },
  {
    id: "cc-7",
    topic: "Failure is a necessary step towards genuine success.",
    domain: "values",
    point: "An inventor tests a prototype machine and it breaks down immediately.",
    sampleImmediate:
      "The breakdown pinpoints the exact structural weakness in the mechanical design.",
    sampleConsequence:
      "The inventor modifies that specific component with stronger materials.",
    sampleSignificance:
      "The revised machine operates reliably, proving that mistakes guide successful innovation.",
  },
];

/* Alias for backwards compatibility */
export const SEED_WHAT_HAPPENS_NEXT: WhatHappensNextPrompt[] = SEED_CAUSAL_CHAINS.map(
  (c) => ({
    id: c.id,
    topic: c.topic,
    domain: c.domain,
    point: c.point,
    whyPrompt: `What happens because "${c.point}"?`,
    sampleNext: c.sampleImmediate,
    sampleMatter: c.sampleSignificance,
  })
);

/* ============================================================
   3. FIX THE WEAK LINK (Fast Diagnostic: Spot Unsupported Leaps)
   ============================================================ */
export const SEED_FIX_WEAK_LINK: FixWeakLinkPrompt[] = [
  {
    id: "fwl-1",
    topic: "Schools should teach budgeting.",
    domain: "money_and_resources",
    chain: [
      "Students learn how to track income and daily expenses.",
      "They make wiser spending decisions when shopping.",
      "They become happier.",
    ],
    weakIndex: 2,
    flawReason:
      "Sentence 3 is a vague emotional leap ('happier'). It fails to explain the tangible financial outcome.",
    suggestedRewrite:
      "As a result, they are less likely to run out of money for essential living expenses.",
  },
  {
    id: "fwl-2",
    topic: "More people should commute by bicycle.",
    domain: "environment",
    chain: [
      "Commuters choose bikes instead of cars for short trips.",
      "They become successful.",
      "Fewer vehicle exhaust fumes pollute city air.",
    ],
    weakIndex: 1,
    flawReason:
      "Sentence 2 ('become successful') is completely unrelated and skips the mechanism of cycling displacing car journeys.",
    suggestedRewrite:
      "This takes hundreds of motor vehicles off local neighbourhood streets each morning.",
  },
  {
    id: "fwl-3",
    topic: "Public libraries are still vital in the digital age.",
    domain: "society",
    chain: [
      "Libraries provide free high-speed internet and desktop computers.",
      "People use devices at the library.",
      "Low-income jobseekers can format resumes and apply for employment online.",
    ],
    weakIndex: 1,
    flawReason:
      "Sentence 2 merely restates Sentence 1 without explaining what having device access enables visitors to do.",
    suggestedRewrite:
      "Visitors who cannot afford home broadband gain an accessible workspace for important tasks.",
  },
  {
    id: "fwl-4",
    topic: "Children should participate in organized team sports.",
    domain: "health",
    chain: [
      "Players practice communicating coordinate plays during training matches.",
      "They learn to encourage teammates after mistakes and cooperate under pressure.",
      "Everything in their life gets better.",
    ],
    weakIndex: 2,
    flawReason:
      "Sentence 3 is an exaggerated, vague generalization ('everything gets better').",
    suggestedRewrite:
      "These collaborative habits help them resolve conflicts and work effectively in classroom group projects.",
  },
  {
    id: "fwl-5",
    topic: "Replacing single-use plastics with reusable alternatives.",
    domain: "environment",
    chain: [
      "Shoppers bring durable cloth bags to the supermarket.",
      "Fewer lightweight plastic bags are manufactured and discarded.",
      "The entire planet is instantly saved.",
    ],
    weakIndex: 2,
    flawReason:
      "Sentence 3 is an unrealistic, catastrophized/inflated leap rather than a proportionate ecological benefit.",
    suggestedRewrite:
      "This reduces the quantity of non-biodegradable debris washing into coastal waterways and harming marine life.",
  },
];

/* ============================================================
   4. ONE STEP ONLY (Causal Proximity: Spot Immediate Direct Effect)
   ============================================================ */
export const SEED_ONE_STEP_ONLY: OneStepOnlyPrompt[] = [
  {
    id: "oso-1",
    statement: "More commuters choose to ride trains instead of driving cars.",
    domain: "society",
    options: [
      {
        text: "Traffic congestion on major arterial roads decreases.",
        isCorrect: true,
        reason: "Immediate direct consequence: fewer cars on the road reduces traffic volume.",
      },
      {
        text: "All citizens become completely healthy.",
        isCorrect: false,
        reason: "Too large a jump: riding the train does not instantly make everyone healthy.",
      },
      {
        text: "Trains exist in the city.",
        isCorrect: false,
        reason: "Repetition / precondition: stating that trains exist repeats the premise.",
      },
      {
        text: "Society becomes much happier.",
        isCorrect: false,
        reason: "Vague emotional generalization: fails to name a concrete mechanism.",
      },
    ],
  },
  {
    id: "oso-2",
    statement: "A council plants rows of shady trees along suburban footpaths.",
    domain: "environment",
    options: [
      {
        text: "The tree leaves absorb sunlight and shield concrete paths from direct heat.",
        isCorrect: true,
        reason: "Immediate physical effect: foliage literally blocks direct solar radiation.",
      },
      {
        text: "Global warming is entirely solved.",
        isCorrect: false,
        reason: "Absurd leap: suburban street trees do not solve global climate change single-handedly.",
      },
      {
        text: "Footpaths have trees near them.",
        isCorrect: false,
        reason: "Circular echo: merely restates the initial statement.",
      },
      {
        text: "Residents feel better.",
        isCorrect: false,
        reason: "Vague: does not explain what actually happens to the temperature or environment.",
      },
    ],
  },
  {
    id: "oso-3",
    statement: "A student spends twenty minutes reviewing class notes every evening.",
    domain: "health",
    options: [
      {
        text: "Key concepts are transferred into long-term memory before being forgotten.",
        isCorrect: true,
        reason: "Direct cognitive mechanism: regular review consolidates memory.",
      },
      {
        text: "The student will become a billionaire.",
        isCorrect: false,
        reason: "Absurd exaggerated jump: studying does not guarantee extreme wealth.",
      },
      {
        text: "The student has notes in front of them.",
        isCorrect: false,
        reason: "Repetition: describes the physical action without stating a result.",
      },
      {
        text: "They become successful.",
        isCorrect: false,
        reason: "Vague filler: 'successful' is abstract and lacks causal mechanism.",
      },
    ],
  },
  {
    id: "oso-4",
    statement: "A family repairs their leaking tap instead of ignoring it.",
    domain: "money_and_resources",
    options: [
      {
        text: "Hundreds of litres of clean water are prevented from trickling down the drain.",
        isCorrect: true,
        reason: "Immediate observable effect: fixing the seal stops clean water wastage.",
      },
      {
        text: "Water bills are lowered by fifty thousand dollars.",
        isCorrect: false,
        reason: "Exaggerated leap: leaking taps cost money, but not tens of thousands.",
      },
      {
        text: "Taps use water in the kitchen.",
        isCorrect: false,
        reason: "Repetition: basic factual restatement with zero consequence.",
      },
      {
        text: "The family feels good.",
        isCorrect: false,
        reason: "Vague emotional term with no causal mechanism.",
      },
    ],
  },
];

/* ============================================================
   5. BUILD THE PARAGRAPH (5-Function Holistic Writing)
   ============================================================ */
export const SEED_BUILD_PARAGRAPH: BuildParagraphPrompt[] = [
  {
    id: "bp-1",
    topic: "Public transport should be significantly cheaper.",
    domain: "society",
    argument: "Cheaper fares reduce vehicular traffic congestion.",
    sampleParagraph:
      "Cheaper public transport would encourage more commuters to leave their cars at home. If buses and trains cost less, workers have an immediate financial reason to avoid driving. For example, a commuter traveling into the city centre can save on costly parking garages and petrol by purchasing a cheap train ticket. With fewer cars crowding the roads, congestion eases and transit times shorten. Therefore, reducing transit fares creates a more efficient transport system for the entire city.",
  },
  {
    id: "bp-2",
    topic: "Repairing broken products saves valuable resources.",
    domain: "money_and_resources",
    argument: "Replacing only worn parts avoids the resource cost of making new goods.",
    sampleParagraph:
      "Fixing damaged appliances keeps functional materials in use rather than wasting them. Most broken devices contain only one faulty component while the rest of the machinery remains undamaged. For example, if a bicycle chain snaps, replacing just the chain restores the bike without discarding the steel frame and rubber tyres. As a result, factories consume fewer raw minerals to manufacture replacement goods. Therefore, prioritizing repairs helps society conserve finite natural resources.",
  },
  {
    id: "bp-3",
    topic: "Public libraries are vital in the modern digital age.",
    domain: "society",
    argument: "Libraries bridge the gap between people who can and cannot afford technology.",
    sampleParagraph:
      "Libraries guarantee that all citizens have fair access to modern digital tools regardless of their income. While wealthy families have private computers at home, low-income households often cannot afford high-speed internet. For instance, a student whose family lacks a home laptop can complete and submit research assignments using a library desktop. Consequently, disadvantaged students avoid falling behind in their academic schooling. Thus, free libraries remain essential pillars of community fairness.",
  },
];

/* ============================================================
   6. EXAMPLE ENGINE PROMPTS (Observable Scenario)
   ============================================================ */
export const SEED_EXAMPLE_PROMPTS: ExampleEnginePrompt[] = [
  {
    id: "ex-1",
    topic: "Repairing products instead of replacing them saves valuable resources.",
    domain: "money_and_resources",
    argument: "Replacing a single worn component can restore a complex machine to working order.",
    weakExample: "If an iPad breaks, you can repair it.",
    strongExampleTip:
      "Describe an observable situation: e.g. replacing a cracked screen so the remaining glass, processor, and battery stay in active use instead of manufacturing a whole new tablet.",
  },
  {
    id: "ex-2",
    topic: "Public libraries are still vital in the digital age.",
    domain: "society",
    argument: "Libraries give people access to expensive technology they may not be able to afford.",
    weakExample: "Libraries help people who do not have devices.",
    strongExampleTip:
      "Describe an observable scenario: e.g. a student whose family cannot afford a laptop using a library desktop and Wi-Fi connection to research and submit an online assignment.",
  },
  {
    id: "ex-3",
    topic: "Convenience foods do more harm than good in modern society.",
    domain: "health",
    argument: "Pre-packaged fast foods sacrifice essential nutrients for long shelf life and quick preparation.",
    weakExample: "Jack eats fast food and feels unhealthy.",
    strongExampleTip:
      "Focus on the observable event: swapping a fresh vegetable meal for an ultra-processed frozen dinner packed with preservatives, sodium, and trans fats.",
  },
  {
    id: "ex-4",
    topic: "Failure is a necessary step towards genuine success.",
    domain: "values",
    argument: "Initial mistakes expose hidden flaws that would otherwise remain unnoticed.",
    weakExample: "People make mistakes and then they win.",
    strongExampleTip:
      "Describe an observable scenario: an engineering team testing a prototype bridge that buckles under weight, allowing them to reinforce the exact joint before constructing the real crossing.",
  },
  {
    id: "ex-5",
    topic: "Free museums improve public education.",
    domain: "society",
    argument: "Eliminating ticket charges lets underprivileged students experience cultural artifacts firsthand.",
    weakExample: "Museums have paintings for everyone to see.",
    strongExampleTip:
      "Show an observable scene: a student examining an ancient Roman coin or dinosaur skeleton up close rather than only looking at textbook photographs.",
  },
];

/* ============================================================
   7. SENTENCE FORGE (Demoted Synthesis Drill)
   ============================================================ */
export const SEED_SENTENCE_FORGE: SentenceForgePrompt[] = [
  {
    id: "sf-1",
    simpleSentences: [
      "Mia was nervous about the scholarship exam.",
      "Mia walked onto the stage.",
      "The examination hall was completely silent.",
    ],
    suggestedConjunctions: ["Although", "as", "despite"],
    modelSentence:
      "Although Mia was nervous about the scholarship exam, she stepped onto the stage as the hall fell completely silent.",
  },
  {
    id: "sf-2",
    simpleSentences: [
      "Cities plant leafy trees along footpaths.",
      "Trees absorb solar heat.",
      "Pedestrians can walk comfortably on scorching summer afternoons.",
    ],
    suggestedConjunctions: ["Because", "so that", "which"],
    modelSentence:
      "Because leafy trees absorb solar heat, cities that plant them along footpaths allow pedestrians to walk comfortably even on scorching summer afternoons.",
  },
  {
    id: "sf-3",
    simpleSentences: [
      "Modern smartphones offer instant entertainment.",
      "Constantly checking notifications shortens attention spans.",
      "Many educators recommend daily screen-free periods.",
    ],
    suggestedConjunctions: ["While", "therefore", "since"],
    modelSentence:
      "While modern smartphones offer instant entertainment, constantly checking notifications shortens attention spans; therefore, many educators recommend daily screen-free periods.",
  },
  {
    id: "sf-4",
    simpleSentences: [
      "Repairing a cracked phone screen takes effort.",
      "Repairing the screen costs far less than buying a brand-new handset.",
      "It prevents toxic electronic waste from entering local landfills.",
    ],
    suggestedConjunctions: ["Even though", "not only... but also", "because"],
    modelSentence:
      "Even though repairing a cracked phone screen takes effort, it not only costs far less than buying a new handset but also prevents toxic electronic waste from entering landfills.",
  },
];

/* ============================================================
   8. REPEAT VS ADD (OCCASIONAL DIAGNOSTIC ONLY - NOVEL PAIRS)
   ============================================================ */
export const SEED_REPEAT_VS_ADD: RepeatVsAddExercise[] = [
  {
    id: "rva-diag-1",
    topic: "Wild animal species require strictly protected habitats.",
    domain: "animals",
    sentence1: "Setting aside nature reserves guarantees that wildlife has space away from human developments.",
    sentence2: "Designated wilderness zones provide animals with undisturbed territory separated from cities.",
    correctAnswer: "REPEAT",
    explanation: "Sentence 2 uses synonyms ('wilderness zones' / 'undisturbed territory') to state the exact same point without introducing a new cause or effect.",
    difficulty: 2,
  },
  {
    id: "rva-diag-2",
    topic: "Wild animal species require strictly protected habitats.",
    domain: "animals",
    sentence1: "Setting aside nature reserves guarantees that wildlife has space away from human developments.",
    sentence2: "Consequently, migratory birds and predators can complete natural breeding cycles without highway disruptions.",
    correctAnswer: "ADD",
    explanation: "Sentence 2 introduces a specific biological consequence (breeding cycles without highway disruptions), advancing the argument.",
    difficulty: 2,
  },
  {
    id: "rva-diag-3",
    topic: "Digital devices should not be used immediately before bedtime.",
    domain: "health",
    sentence1: "Looking at bright mobile screens at night delays the body's natural sleep onset.",
    sentence2: "Checking phone displays late in the evening prevents children from falling asleep on time.",
    correctAnswer: "REPEAT",
    explanation: "Sentence 2 merely rephrases 'delays sleep onset' as 'prevents falling asleep on time'. It adds no biological explanation.",
    difficulty: 2,
  },
  {
    id: "rva-diag-4",
    topic: "Digital devices should not be used immediately before bedtime.",
    domain: "health",
    sentence1: "Looking at bright mobile screens at night delays the body's natural sleep onset.",
    sentence2: "The blue wavelength light emitted by displays suppresses the production of melatonin, the sleep hormone.",
    correctAnswer: "ADD",
    explanation: "Sentence 2 explains the biological mechanism (suppression of melatonin), adding genuine depth to the explanation.",
    difficulty: 3,
  },
  {
    id: "rva-diag-5",
    topic: "Learning to code helps students understand modern technology.",
    domain: "technology",
    sentence1: "Programming lessons reveal the software logic that powers everyday applications.",
    sentence2: "Writing code shows students how programs and digital tools actually operate behind the scenes.",
    correctAnswer: "REPEAT",
    explanation: "Sentence 2 echoes Sentence 1 using paraphrased wording without giving an example or practical outcome.",
    difficulty: 2,
  },
  {
    id: "rva-diag-6",
    topic: "Learning to code helps students understand modern technology.",
    domain: "technology",
    sentence1: "Programming lessons reveal the software logic that powers everyday applications.",
    sentence2: "This insight enables young people to question automated algorithms and make informed online safety decisions.",
    correctAnswer: "ADD",
    explanation: "Sentence 2 extends the logic to critical thinking and online safety, introducing a distinct consequence.",
    difficulty: 3,
  },
];
