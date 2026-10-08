import { SentenceSprintPrompt } from "@/types";

export const SEED_SENTENCE_SPRINT: SentenceSprintPrompt[] = [
  // ==========================================
  // LEVEL 1: Notes / Observation -> 1 Clean Sentence
  // ==========================================
  {
    id: "ss-1a", level: 1, kind: "write", domain: "everyday_objects", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Explain clearly in one sentence why the old teddy bear could be valuable.",
    notes: ["sentimental value", "old teddy bear", "owned since age 5", "memories", "doesn't want to sell"],
  },
  {
    id: "ss-1b", level: 1, kind: "write", domain: "animals", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Explain clearly in one sentence why bees matter for our food supply.",
    notes: ["bees", "pollination", "crops", "fewer bees = fewer plants reproduce"],
  },
  {
    id: "ss-1c", level: 1, kind: "write", domain: "transport", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Explain clearly in one sentence why bike lanes make roads safer.",
    notes: ["bike lanes", "cyclists separated from cars", "fewer collisions"],
  },
  {
    id: "ss-1d", level: 1, kind: "fix", domain: "society", sentencesRequired: 1, timeLimitSeconds: 45,
    task: "Rewrite this clearly without changing the meaning.",
    weakSentence: "This will result in you not being late and make you a more time efficient person altogether.",
  },
  {
    id: "ss-1e", level: 1, kind: "stop", domain: "money_and_resources", sentencesRequired: 0, timeLimitSeconds: 20,
    task: "Tap the step where the argument has been proved.",
    steps: ["Repair the tyre", "It costs $20", "A new bike costs $500", "You save $480", "Less financial stress", "Happier", "Better wellbeing"],
    stopIndex: 3,
    stopWhy: "Saving $480 already proves repairing is cheaper. The rest is extra run-on.",
  },
  {
    id: "ss-1f", level: 1, kind: "write", domain: "technology", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Explain clearly in one sentence why backing up school files to cloud storage is useful.",
    notes: ["laptop breaks or is lost", "cloud backup", "files still safe online", "no lost homework"],
  },
  {
    id: "ss-1g", level: 1, kind: "write", domain: "health", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Explain clearly in one sentence why drinking enough water helps athletes perform.",
    notes: ["sweating during sport", "water loss", "drinking water prevents dehydration", "keeps muscles working"],
  },
  {
    id: "ss-1h", level: 1, kind: "fix", domain: "community", sentencesRequired: 1, timeLimitSeconds: 45,
    task: "Rewrite this clearly in one sentence without changing the meaning.",
    weakSentence: "Because of the reason that the park is dirty it causes children to not want to play there anymore.",
  },
  {
    id: "ss-1i", level: 1, kind: "stop", domain: "health", sentencesRequired: 0, timeLimitSeconds: 20,
    task: "Tap the step where the argument has been proved.",
    steps: ["Wash hands with soap", "Removes germs", "Prevents common illnesses", "You miss fewer school days", "Better grades", "Great future career"],
    stopIndex: 2,
    stopWhy: "Preventing common illnesses already proves soap protects health. Future career is unnecessary runaway.",
  },
  {
    id: "ss-1j", level: 1, kind: "write", domain: "rules_and_freedom", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Explain clearly in one sentence why pedestrian crossings are placed outside schools.",
    notes: ["heavy traffic at pick-up", "cars must stop at striped crossing", "students cross safely"],
  },
  {
    id: "ss-1k", level: 1, kind: "write", domain: "environment", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Explain clearly in one sentence why reusable shopping bags protect sea life.",
    notes: ["plastic bags blow into gutters", "wash into waterways", "turtles eat them by mistake"],
  },
  {
    id: "ss-1l", level: 1, kind: "write", domain: "everyday_objects", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Explain clearly in one sentence why wearing a bike helmet is necessary.",
    notes: ["hard foam shell", "absorbs impact during fall", "protects skull and brain"],
  },
  {
    id: "ss-1m", level: 1, kind: "fix", domain: "fairness", sentencesRequired: 1, timeLimitSeconds: 45,
    task: "Rewrite this clearly in one sentence without changing the meaning.",
    weakSentence: "If you take turns it makes it so everyone gets an equal go and nobody feels like it is unfair at all.",
  },
  {
    id: "ss-1n", level: 1, kind: "stop", domain: "technology", sentencesRequired: 0, timeLimitSeconds: 20,
    task: "Tap the step where the argument has been proved.",
    steps: ["Use two-factor code", "Thief only has password", "Login is rejected", "Account stays secure", "You feel peaceful", "Better life balance"],
    stopIndex: 3,
    stopWhy: "Login rejected and account secure proves two-factor works. Emotional claims are unnecessary.",
  },
  {
    id: "ss-1o", level: 1, kind: "write", domain: "money_and_resources", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Explain clearly in one sentence why cooking dinner at home saves money compared to takeaway.",
    notes: ["bulk ingredients from supermarket", "cost per meal is a few dollars", "takeaway charges high service fees"],
  },

  // ==========================================
  // LEVEL 2: Argument Supplied -> Explanation Sentence
  // ==========================================
  {
    id: "ss-2a", level: 2, kind: "write", domain: "environment", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Write one sentence that explains why this argument is true.",
    argument: "Recycling aluminium cans saves significant energy.",
  },
  {
    id: "ss-2b", level: 2, kind: "write", domain: "health", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Write one sentence that explains why this argument is true.",
    argument: "Getting eight hours of sleep helps students remember what they learn.",
  },
  {
    id: "ss-2c", level: 2, kind: "write", domain: "community", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Write one sentence that explains why this argument is true.",
    argument: "Public libraries give all families equal access to learning.",
  },
  {
    id: "ss-2d", level: 2, kind: "stop", domain: "environment", sentencesRequired: 0, timeLimitSeconds: 20,
    task: "Tap the step where the argument has been proved.",
    steps: ["Plant shade trees along footpath", "Leaves block harsh sun", "Pavement temperature drops", "People walk more", "Healthier city", "Longer lives"],
    stopIndex: 2,
    stopWhy: "Lower pavement temperature proves the cooling benefit. The rest stretches into unrelated health claims.",
  },
  {
    id: "ss-2e", level: 2, kind: "write", domain: "money_and_resources", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Write one sentence that explains why this argument is true.",
    argument: "Borrowing tools from a community shed is cheaper than buying them.",
  },
  {
    id: "ss-2f", level: 2, kind: "write", domain: "fairness", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Write one sentence that explains why this argument is true.",
    argument: "Referee decisions must be respected even when players disagree.",
  },
  {
    id: "ss-2g", level: 2, kind: "fix", domain: "technology", sentencesRequired: 1, timeLimitSeconds: 45,
    task: "Rewrite this run-on sentence cleanly into one direct sentence.",
    weakSentence: "Using calculators can make you faster at maths which is good but then people don't know mental math and that is a bad outcome.",
  },
  {
    id: "ss-2h", level: 2, kind: "stop", domain: "transport", sentencesRequired: 0, timeLimitSeconds: 20,
    task: "Tap the step where the argument has been proved.",
    steps: ["Install speed bumps outside parks", "Drivers slow down to 20 km/h", "Stopping distance is halved", "Risk of collision drops", "Fewer hospital visits", "State saves healthcare budget"],
    stopIndex: 3,
    stopWhy: "Lower collision risk proves the safety argument. State healthcare budget is unnecessary causal extension.",
  },
  {
    id: "ss-2i", level: 2, kind: "write", domain: "animals", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Write one sentence that explains why this argument is true.",
    argument: "Guide dogs should be allowed in all restaurants and shops.",
  },
  {
    id: "ss-2j", level: 2, kind: "write", domain: "science", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Write one sentence that explains why this argument is true.",
    argument: "Boiling water kills harmful bacteria before drinking.",
  },
  {
    id: "ss-2k", level: 2, kind: "write", domain: "society", sentencesRequired: 1, timeLimitSeconds: 60,
    task: "Write one sentence that explains why this argument is true.",
    argument: "Free public parks improve city living.",
  },
  {
    id: "ss-2l", level: 2, kind: "fix", domain: "health", sentencesRequired: 1, timeLimitSeconds: 45,
    task: "Rewrite this wordy sentence cleanly into one direct sentence.",
    weakSentence: "The reason that stretching before sport is good is due to it preventing muscle strains from occurring to players.",
  },

  // ==========================================
  // LEVEL 3: Notes Supplied -> 2 Connected Sentences
  // ==========================================
  {
    id: "ss-3a", level: 3, kind: "write", domain: "technology", sentencesRequired: 2, timeLimitSeconds: 90,
    task: "Write two connected sentences explaining why phones in class can hurt learning.",
    notes: ["notifications buzz in pockets", "student attention splits", "takes minutes to refocus", "comprehension drops"],
  },
  {
    id: "ss-3b", level: 3, kind: "write", domain: "conservation", sentencesRequired: 2, timeLimitSeconds: 90,
    task: "Write two connected sentences explaining why we should protect coastal wetlands.",
    notes: ["wetland mangroves absorb storm surges", "roots anchor loose soil", "stops coastal erosion and protects inland houses"],
  },
  {
    id: "ss-3c", level: 3, kind: "write", domain: "fairness", sentencesRequired: 2, timeLimitSeconds: 90,
    task: "Write two connected sentences explaining why uniform rules keep school fair.",
    notes: ["all students wear identical clothing", "removes pressure to wear expensive brand names", "reduces social comparison"],
  },
  {
    id: "ss-3d", level: 3, kind: "write", domain: "health", sentencesRequired: 2, timeLimitSeconds: 90,
    task: "Write two connected sentences explaining why eating breakfast improves morning school performance.",
    notes: ["overnight fasting lowers glucose", "morning meal refuels brain", "sustains attention during morning lessons"],
  },
  {
    id: "ss-3e", level: 3, kind: "write", domain: "animals", sentencesRequired: 2, timeLimitSeconds: 90,
    task: "Write two connected sentences explaining why domestic cats should stay indoors at night.",
    notes: ["native marsupials and birds feed at dusk", "cats are nocturnal hunters", "keeping them inside prevents wildlife loss"],
  },
  {
    id: "ss-3f", level: 3, kind: "fix", domain: "values", sentencesRequired: 2, timeLimitSeconds: 60,
    task: "Turn this repetitive sentence into two clean, connected sentences.",
    weakSentence: "When you tell the truth people will always believe you and trust you because honesty makes people believe everything you say.",
  },
  {
    id: "ss-3g", level: 3, kind: "write", domain: "transport", sentencesRequired: 2, timeLimitSeconds: 90,
    task: "Write two connected sentences explaining why school walking buses reduce morning congestion.",
    notes: ["parents take turns walking groups of children", "dozens of cars stay off residential streets", "drop-off zones flow smoothly"],
  },
  {
    id: "ss-3h", level: 3, kind: "write", domain: "money_and_resources", sentencesRequired: 2, timeLimitSeconds: 90,
    task: "Write two connected sentences explaining why second-hand school uniforms benefit families.",
    notes: ["children outgrow blazers quickly", "second-hand sales cost half retail price", "saves household budgets each term"],
  },
  {
    id: "ss-3i", level: 3, kind: "write", domain: "science", sentencesRequired: 2, timeLimitSeconds: 90,
    task: "Write two connected sentences explaining why sunscreen prevents skin damage.",
    notes: ["sun emits harmful ultraviolet radiation", "sunscreen lotion absorbs or blocks UV rays", "prevents painful burns and long-term cell harm"],
  },

  // ==========================================
  // LEVEL 4: Paragraph Core -> 3 Clean Sentences
  // ==========================================
  {
    id: "ss-4a", level: 4, kind: "write", domain: "transport", sentencesRequired: 3, timeLimitSeconds: 120,
    task: "Write three clean sentences: Claim, Causal Mechanism, and Direct Consequence.",
    notes: ["Claim: Free bus travel reduces city traffic", "Mechanism: Commuters leave cars at home to save fuel and parking", "Consequence: Fewer vehicles clog peak-hour arterial roads"],
  },
  {
    id: "ss-4b", level: 4, kind: "write", domain: "values", sentencesRequired: 3, timeLimitSeconds: 120,
    task: "Write three clean sentences: Claim, Causal Mechanism, and Direct Consequence.",
    notes: ["Claim: Practicing a musical instrument builds perseverance", "Mechanism: Hard pieces require repeated attempts through mistakes", "Consequence: Students learn that steady effort overcomes difficulty"],
  },
  {
    id: "ss-4c", level: 4, kind: "write", domain: "environment", sentencesRequired: 3, timeLimitSeconds: 120,
    task: "Write three clean sentences: Claim, Causal Mechanism, and Direct Consequence.",
    notes: ["Claim: Banning single-use plastic bags protects marine wildlife", "Mechanism: Lightweight bags drift into storm drains and wash into oceans", "Consequence: Marine turtles no longer ingest them mistaking them for jellyfish"],
  },
  {
    id: "ss-4d", level: 4, kind: "write", domain: "rules_and_freedom", sentencesRequired: 3, timeLimitSeconds: 120,
    task: "Write three clean sentences: Claim, Causal Mechanism, and Direct Consequence.",
    notes: ["Claim: Daily homework limits for primary students are sensible", "Mechanism: Excessive worksheets cut into restorative sleep and family dinner", "Consequence: Moderate 20-minute tasks maintain practice without burnout"],
  },
  {
    id: "ss-4e", level: 4, kind: "write", domain: "health", sentencesRequired: 3, timeLimitSeconds: 120,
    task: "Write three clean sentences: Claim, Causal Mechanism, and Direct Consequence.",
    notes: ["Claim: Daily recess outside improves afternoon classroom focus", "Mechanism: Physical play burns restless energy and resets working memory", "Consequence: Students return to desks ready to engage with complex tasks"],
  },
  {
    id: "ss-4f", level: 4, kind: "write", domain: "community", sentencesRequired: 3, timeLimitSeconds: 120,
    task: "Write three clean sentences: Claim, Causal Mechanism, and Direct Consequence.",
    notes: ["Claim: Community gardens foster neighbourhood bonds", "Mechanism: Residents collaborate to water plots and divide fresh harvests", "Consequence: Strangers become trusted neighbours through shared daily work"],
  },
  {
    id: "ss-4g", level: 4, kind: "write", domain: "technology", sentencesRequired: 3, timeLimitSeconds: 120,
    task: "Write three clean sentences: Claim, Causal Mechanism, and Direct Consequence.",
    notes: ["Claim: Teaching basic coding in primary school develops logical thinking", "Mechanism: Debugging code forces students to trace errors step by step", "Consequence: Children apply methodical problem-solving to other school subjects"],
  },

  // ==========================================
  // LEVEL 5: 3 Planned Arguments -> 3 Core Sentences Rapidly
  // ==========================================
  {
    id: "ss-5a", level: 5, kind: "write", domain: "science", sentencesRequired: 3, timeLimitSeconds: 150,
    task: "Write one clear explanation sentence for each of the three arguments (3 sentences total).",
    notes: [
      "Health Lens: Regular cardiovascular exercise strengthens the heart muscle.",
      "Cognitive Lens: Physical movement boosts blood circulation and brain oxygenation.",
      "Emotional Lens: Exercise triggers endorphins that reduce anxiety after school.",
    ],
  },
  {
    id: "ss-5b", level: 5, kind: "write", domain: "culture", sentencesRequired: 3, timeLimitSeconds: 150,
    task: "Write one clear explanation sentence for each of the three arguments (3 sentences total).",
    notes: [
      "Education Lens: Museums allow students to examine authentic historical artefacts.",
      "Civic Lens: Community exhibitions preserve local immigrant stories for future generations.",
      "Economy Lens: Cultural institutions attract regional tourists who support local businesses.",
    ],
  },
  {
    id: "ss-5c", level: 5, kind: "write", domain: "environment", sentencesRequired: 3, timeLimitSeconds: 150,
    task: "Write one clear explanation sentence for each of the three arguments (3 sentences total).",
    notes: [
      "Waste Lens: Composting food scraps diverts organic matter from rotting in landfill.",
      "Emissions Lens: Less landfill waste reduces methane gas releases into the atmosphere.",
      "Soil Lens: Finished compost enriches garden soil with natural nutrients.",
    ],
  },
  {
    id: "ss-5d", level: 5, kind: "write", domain: "technology", sentencesRequired: 3, timeLimitSeconds: 150,
    task: "Write one clear explanation sentence for each of the three arguments (3 sentences total).",
    notes: [
      "Safety Lens: Two-factor authentication blocks unauthorised logins even if a password leaks.",
      "Privacy Lens: Strong encryption keeps sensitive personal messages unreadable to eavesdroppers.",
      "Control Lens: Regular software updates patch security flaws before hackers can exploit them.",
    ],
  },
  {
    id: "ss-5e", level: 5, kind: "write", domain: "rules_and_freedom", sentencesRequired: 3, timeLimitSeconds: 150,
    task: "Write one clear explanation sentence for each of the three arguments (3 sentences total).",
    notes: [
      "Safety Lens: Compulsory bicycle helmet laws prevent traumatic brain injuries during falls.",
      "Fairness Lens: Clear road rules ensure all cyclists share pathways predictably with pedestrians.",
      "Healthcare Lens: Fewer severe collisions reduce emergency hospital admissions and public costs.",
    ],
  },
  {
    id: "ss-5f", level: 5, kind: "write", domain: "money_and_resources", sentencesRequired: 3, timeLimitSeconds: 150,
    task: "Write one clear explanation sentence for each of the three arguments (3 sentences total).",
    notes: [
      "Budget Lens: Weekly meal planning ensures families only purchase groceries they actually eat.",
      "Waste Lens: Storing leftover portions eliminates food spoilage before expiration dates.",
      "Time Lens: Cooking larger batches frees weekday evenings from repetitive cooking chores.",
    ],
  },
  {
    id: "ss-5g", level: 5, kind: "write", domain: "community", sentencesRequired: 3, timeLimitSeconds: 150,
    task: "Write one clear explanation sentence for each of the three arguments (3 sentences total).",
    notes: [
      "Civic Lens: Community tree planting fosters pride in local public parks.",
      "Climate Lens: Dense leaf canopies reduce urban heat island effects on residential streets.",
      "Wildlife Lens: Native eucalyptus and acacia trees provide essential nesting habitat for urban birds.",
    ],
  },
];
