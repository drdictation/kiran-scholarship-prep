import { Topic } from "@/types";

export const THINKING_LENSES = [
  "People & Health",
  "Safety & Wellbeing",
  "Money & Resources",
  "Environment & Nature",
  "Fairness & Rights",
  "Freedom & Responsibility",
  "Learning & Education",
  "Community & Society",
  "Convenience & Practicality",
  "Future / Long-Term Impact",
];

export const SEED_TOPICS: Topic[] = [
  // Environment
  {
    id: "env-1",
    text: "Single-use plastics should be completely banned.",
    domain: "environment",
    difficulty: 1,
    thinkingLenses: ["Environment & Nature", "Money & Resources", "Convenience & Practicality"],
  },
  {
    id: "env-2",
    text: "Cities should plant more trees along every street.",
    domain: "environment",
    difficulty: 1,
    thinkingLenses: ["Environment & Nature", "People & Health", "Community & Society"],
  },
  {
    id: "env-3",
    text: "Protecting endangered wildlife is worth spending public money on.",
    domain: "environment",
    difficulty: 2,
    thinkingLenses: ["Environment & Nature", "Money & Resources", "Future / Long-Term Impact"],
  },
  {
    id: "env-4",
    text: "We should repair broken items rather than replace them with new ones.",
    domain: "environment",
    difficulty: 2,
    thinkingLenses: ["Money & Resources", "Environment & Nature", "Learning & Education"],
  },
  {
    id: "env-5",
    text: "Penalties for littering in public parks should be doubled.",
    domain: "environment",
    difficulty: 2,
    thinkingLenses: ["Fairness & Rights", "Environment & Nature", "Community & Society"],
  },
  {
    id: "env-6",
    text: "Solar panels should be compulsory on all new buildings.",
    domain: "environment",
    difficulty: 3,
    thinkingLenses: ["Future / Long-Term Impact", "Money & Resources", "Freedom & Responsibility"],
  },

  // Technology
  {
    id: "tech-1",
    text: "Relying on technology weakens our problem-solving skills.",
    domain: "technology",
    difficulty: 2,
    thinkingLenses: ["Learning & Education", "Convenience & Practicality", "People & Health"],
  },
  {
    id: "tech-2",
    text: "Robots and machines should do dangerous jobs instead of humans.",
    domain: "technology",
    difficulty: 1,
    thinkingLenses: ["Safety & Wellbeing", "People & Health", "Money & Resources"],
  },
  {
    id: "tech-3",
    text: "Physical cash should disappear completely in favour of digital payments.",
    domain: "technology",
    difficulty: 3,
    thinkingLenses: ["Convenience & Practicality", "Safety & Wellbeing", "Fairness & Rights"],
  },
  {
    id: "tech-4",
    text: "Artificial intelligence will improve society more than it harms it.",
    domain: "technology",
    difficulty: 3,
    thinkingLenses: ["Future / Long-Term Impact", "Learning & Education", "Safety & Wellbeing"],
  },
  {
    id: "tech-5",
    text: "Screen-free days should be practiced regularly by everyone.",
    domain: "technology",
    difficulty: 2,
    thinkingLenses: ["People & Health", "Community & Society", "Freedom & Responsibility"],
  },

  // Society & Community
  {
    id: "soc-1",
    text: "Public libraries are still essential in the digital era.",
    domain: "society",
    difficulty: 2,
    thinkingLenses: ["Learning & Education", "Community & Society", "Fairness & Rights"],
  },
  {
    id: "soc-2",
    text: "Museums and art galleries should be completely free to the public.",
    domain: "society",
    difficulty: 2,
    thinkingLenses: ["Learning & Education", "Fairness & Rights", "Money & Resources"],
  },
  {
    id: "soc-3",
    text: "Everyone should volunteer to help their local community.",
    domain: "society",
    difficulty: 2,
    thinkingLenses: ["Community & Society", "Learning & Education", "Freedom & Responsibility"],
  },
  {
    id: "soc-4",
    text: "Neighbours should make a conscious effort to know each other better.",
    domain: "society",
    difficulty: 1,
    thinkingLenses: ["Safety & Wellbeing", "Community & Society", "People & Health"],
  },
  {
    id: "soc-5",
    text: "Cities should have fewer car parks and more public parks.",
    domain: "society",
    difficulty: 2,
    thinkingLenses: ["Environment & Nature", "People & Health", "Community & Society"],
  },

  // Rules, Freedom & Responsibility
  {
    id: "rule-1",
    text: "Rules and limits make life better, not worse.",
    domain: "rules_and_freedom",
    difficulty: 3,
    thinkingLenses: ["Safety & Wellbeing", "Fairness & Rights", "Freedom & Responsibility"],
  },
  {
    id: "rule-2",
    text: "Having too many choices can make people less happy.",
    domain: "rules_and_freedom",
    difficulty: 4,
    thinkingLenses: ["People & Health", "Convenience & Practicality", "Future / Long-Term Impact"],
  },
  {
    id: "rule-3",
    text: "Rewards are more effective than punishments in guiding behaviour.",
    domain: "rules_and_freedom",
    difficulty: 3,
    thinkingLenses: ["Learning & Education", "People & Health", "Fairness & Rights"],
  },
  {
    id: "rule-4",
    text: "Young people should be allowed to make their own mistakes.",
    domain: "rules_and_freedom",
    difficulty: 3,
    thinkingLenses: ["Learning & Education", "Safety & Wellbeing", "Freedom & Responsibility"],
  },
  {
    id: "rule-5",
    text: "Sometimes breaking a minor rule is justified for a greater good.",
    domain: "rules_and_freedom",
    difficulty: 4,
    thinkingLenses: ["Fairness & Rights", "Safety & Wellbeing", "Community & Society"],
  },

  // Money & Resources
  {
    id: "mon-1",
    text: "Spending money on experiences is more rewarding than buying possessions.",
    domain: "money_and_resources",
    difficulty: 2,
    thinkingLenses: ["People & Health", "Future / Long-Term Impact", "Money & Resources"],
  },
  {
    id: "mon-2",
    text: "Cheap products often cost society more in the long run.",
    domain: "money_and_resources",
    difficulty: 3,
    thinkingLenses: ["Environment & Nature", "Money & Resources", "Future / Long-Term Impact"],
  },
  {
    id: "mon-3",
    text: "Advertising encourages people to buy things they do not need.",
    domain: "money_and_resources",
    difficulty: 2,
    thinkingLenses: ["Money & Resources", "People & Health", "Freedom & Responsibility"],
  },
  {
    id: "mon-4",
    text: "Wasting food is a serious problem that requires government intervention.",
    domain: "money_and_resources",
    difficulty: 3,
    thinkingLenses: ["Environment & Nature", "Money & Resources", "Fairness & Rights"],
  },

  // Animals
  {
    id: "ani-1",
    text: "Keeping wild animals in zoos is no longer acceptable.",
    domain: "animals",
    difficulty: 2,
    thinkingLenses: ["Fairness & Rights", "Learning & Education", "Environment & Nature"],
  },
  {
    id: "ani-2",
    text: "Humans have a duty to protect animal habitats even when it limits city growth.",
    domain: "animals",
    difficulty: 3,
    thinkingLenses: ["Environment & Nature", "Future / Long-Term Impact", "Fairness & Rights"],
  },
  {
    id: "ani-3",
    text: "Pets should only be adopted from shelters rather than bought from breeders.",
    domain: "animals",
    difficulty: 2,
    thinkingLenses: ["Fairness & Rights", "Safety & Wellbeing", "Community & Society"],
  },

  // Health & Lifestyle
  {
    id: "hea-1",
    text: "Playing team sports teaches lessons that cannot be learned in a classroom.",
    domain: "health",
    difficulty: 1,
    thinkingLenses: ["Learning & Education", "Community & Society", "People & Health"],
  },
  {
    id: "hea-2",
    text: "Convenience foods do more harm than good in modern families.",
    domain: "health",
    difficulty: 2,
    thinkingLenses: ["People & Health", "Money & Resources", "Convenience & Practicality"],
  },
  {
    id: "hea-3",
    text: "Everyone needs regular time to be bored and do nothing.",
    domain: "health",
    difficulty: 3,
    thinkingLenses: ["People & Health", "Learning & Education", "Future / Long-Term Impact"],
  },
  {
    id: "hea-4",
    text: "Sleep should be treated just as seriously as diet and exercise.",
    domain: "health",
    difficulty: 2,
    thinkingLenses: ["People & Health", "Learning & Education", "Safety & Wellbeing"],
  },

  // Ideas & Values
  {
    id: "val-1",
    text: "Failure is a necessary step towards achieving genuine success.",
    domain: "values",
    difficulty: 2,
    thinkingLenses: ["Learning & Education", "People & Health", "Future / Long-Term Impact"],
  },
  {
    id: "val-2",
    text: "Being kind is more important than being clever.",
    domain: "values",
    difficulty: 2,
    thinkingLenses: ["Community & Society", "People & Health", "Fairness & Rights"],
  },
  {
    id: "val-3",
    text: "True courage means taking action despite feeling afraid.",
    domain: "values",
    difficulty: 3,
    thinkingLenses: ["People & Health", "Learning & Education", "Freedom & Responsibility"],
  },
  {
    id: "val-4",
    text: "Being busy does not mean a person is being productive.",
    domain: "values",
    difficulty: 4,
    thinkingLenses: ["Convenience & Practicality", "People & Health", "Future / Long-Term Impact"],
  },
  {
    id: "val-5",
    text: "Old traditions should only be preserved if they still serve a good purpose.",
    domain: "values",
    difficulty: 4,
    thinkingLenses: ["Community & Society", "Future / Long-Term Impact", "Fairness & Rights"],
  },

  // Science & Progress
  {
    id: "sci-1",
    text: "Spending billions exploring deep space is worth the cost.",
    domain: "science",
    difficulty: 3,
    thinkingLenses: ["Learning & Education", "Money & Resources", "Future / Long-Term Impact"],
  },
  {
    id: "sci-2",
    text: "Scientific inventions create new moral responsibilities for humanity.",
    domain: "science",
    difficulty: 4,
    thinkingLenses: ["Safety & Wellbeing", "Future / Long-Term Impact", "Freedom & Responsibility"],
  },

  // Culture & Communication
  {
    id: "cul-1",
    text: "Reading books builds deeper imagination than watching movies.",
    domain: "culture",
    difficulty: 2,
    thinkingLenses: ["Learning & Education", "People & Health", "Convenience & Practicality"],
  },
  {
    id: "cul-2",
    text: "Learning a second language should be mandatory for all primary students.",
    domain: "culture",
    difficulty: 3,
    thinkingLenses: ["Learning & Education", "Community & Society", "Future / Long-Term Impact"],
  },
];
