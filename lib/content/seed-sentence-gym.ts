export type GymOperation = "builder" | "bridge" | "fix_compress" | "next_sentence";

export interface GymQuestion {
  id: string;
  type: GymOperation;
  domain: string;
  title?: string;
  notes?: string[];
  pointA?: string;
  conclusionC?: string;
  weakSentence?: string;
  sentence1?: string;
  promptInstruction: string;
  modelAnswer?: string;
}

export const SEED_GYM_QUESTIONS: GymQuestion[] = [
  // 1. Sentence Builder (Reuse notes / ideas)
  {
    id: "gym-b-1",
    type: "builder",
    domain: "transport",
    title: "Public Transport",
    notes: ["public transport", "fewer cars on the road", "less congestion", "faster journeys"],
    promptInstruction: "Combine these notes into ONE clean, controlled sentence.",
    modelAnswer: "Public transport reduces the number of cars on the road, decreasing congestion and shortening journeys.",
  },
  {
    id: "gym-b-2",
    type: "builder",
    domain: "economics",
    title: "Household Budgeting",
    notes: ["budgeting", "control spending", "save money", "unexpected expenses"],
    promptInstruction: "Combine these notes into ONE clean, controlled sentence.",
    modelAnswer: "Budgeting helps people control their spending so they can save money for unexpected expenses.",
  },
  {
    id: "gym-b-3",
    type: "builder",
    domain: "environment",
    title: "Solar Panels",
    notes: ["rooftop solar panels", "generate clean electricity", "cut coal burning", "lower emissions"],
    promptInstruction: "Combine these notes into ONE clean, controlled sentence.",
    modelAnswer: "Rooftop solar panels generate clean electricity directly from sunlight, reducing coal burning and cutting emissions.",
  },
  {
    id: "gym-b-4",
    type: "builder",
    domain: "health",
    title: "Sleep & Memory",
    notes: ["sufficient sleep", "brain consolidation", "retains information", "improved recall next day"],
    promptInstruction: "Combine these notes into ONE clean, controlled sentence.",
    modelAnswer: "Getting sufficient sleep allows the brain to consolidate new information, improving memory recall the next day.",
  },
  {
    id: "gym-b-5",
    type: "builder",
    domain: "science",
    title: "Insulation",
    notes: ["double-glazed windows", "traps air layer", "slows heat transfer", "keeps indoor temperature stable"],
    promptInstruction: "Combine these notes into ONE clean, controlled sentence.",
    modelAnswer: "Double-glazed windows trap a layer of air that slows heat transfer, keeping indoor temperatures stable.",
  },

  // 2. Causal Bridge (A -> ? -> C)
  {
    id: "gym-c-1",
    type: "bridge",
    domain: "environment",
    title: "Water Refill Stations",
    pointA: "A school installs chilled water refill stations in the yard.",
    conclusionC: "Fewer disposable plastic bottles are thrown into school bins.",
    promptInstruction: "Write the missing middle mechanism connecting A to C.",
    modelAnswer: "Students bring reusable flasks and refill them for free instead of buying single-use bottled water.",
  },
  {
    id: "gym-c-2",
    type: "bridge",
    domain: "transport",
    title: "Protected Bike Lanes",
    pointA: "A city council builds concrete-separated bike lanes alongside main roads.",
    conclusionC: "More commuters choose cycling over driving for short journeys.",
    promptInstruction: "Write the missing middle mechanism connecting A to C.",
    modelAnswer: "The physical barriers protect riders from vehicle traffic, making cycling feel safe and appealing for regular commuters.",
  },
  {
    id: "gym-c-3",
    type: "bridge",
    domain: "technology",
    title: "Search Filters",
    pointA: "An online research archive introduces strict date and topic filters.",
    conclusionC: "Researchers locate relevant historical sources in far less time.",
    promptInstruction: "Write the missing middle mechanism connecting A to C.",
    modelAnswer: "The filters automatically exclude irrelevant documents, allowing researchers to scan only matching archives directly.",
  },
  {
    id: "gym-c-4",
    type: "bridge",
    domain: "animals",
    title: "Overhead Wildlife Bridges",
    pointA: "Highway authorities construct vegetated overpasses across a busy freeway.",
    conclusionC: "Wildlife traffic collisions drop significantly in the national park corridor.",
    promptInstruction: "Write the missing middle mechanism connecting A to C.",
    modelAnswer: "Animals cross over the road canopy without ever stepping onto active traffic lanes.",
  },
  {
    id: "gym-c-5",
    type: "bridge",
    domain: "public_policy",
    title: "Off-Peak Fares",
    pointA: "The railway network cuts train ticket prices by half outside rush hour.",
    conclusionC: "Morning peak-hour carriages become noticeably less overcrowded.",
    promptInstruction: "Write the missing middle mechanism connecting A to C.",
    modelAnswer: "Travellers with flexible schedules shift their trips to the cheaper off-peak window to save money.",
  },

  // 3. Fix & Compress
  {
    id: "gym-f-1",
    type: "fix_compress",
    domain: "health",
    title: "Walking Benefits",
    weakSentence: "Walking is good because children can walk and they get exercise which makes them healthier and happier and have a better life.",
    promptInstruction: "Rewrite this clearly and efficiently in one controlled sentence.",
    modelAnswer: "Walking gives children regular physical exercise, which improves their overall health.",
  },
  {
    id: "gym-f-2",
    type: "fix_compress",
    domain: "environment",
    title: "Recycling Landfill",
    weakSentence: "One of the reasons why recycling can be considered a good thing is because when people recycle there is less rubbish that needs to go into landfill.",
    promptInstruction: "Rewrite this clearly and efficiently in one controlled sentence.",
    modelAnswer: "Recycling reduces the amount of household rubbish sent to landfill.",
  },
  {
    id: "gym-f-3",
    type: "fix_compress",
    domain: "community",
    title: "Street Lighting",
    weakSentence: "When councils install lights in streets that are dark at night, it helps people not feel scared and prevents accidents from happening which is very important.",
    promptInstruction: "Rewrite this clearly and efficiently in one controlled sentence.",
    modelAnswer: "Installing street lights brightens dark roadways, improving pedestrian safety and lowering accident risks.",
  },
  {
    id: "gym-f-4",
    type: "fix_compress",
    domain: "economics",
    title: "Buying in Bulk",
    weakSentence: "Buying items in bulk packs saves money because when you buy a lot all at once the unit price is lower so you do not have to spend as much cash in the long run.",
    promptInstruction: "Rewrite this clearly and efficiently in one controlled sentence.",
    modelAnswer: "Buying groceries in bulk lowers the unit price, reducing total household expenses over time.",
  },
  {
    id: "gym-f-5",
    type: "fix_compress",
    domain: "education",
    title: "Reviewing Notes",
    weakSentence: "Students should review their notes weekly because doing this helps them remember what the teacher said and they will not forget and therefore they will get better results.",
    promptInstruction: "Rewrite this clearly and efficiently in one controlled sentence.",
    modelAnswer: "Reviewing notes weekly reinforces key concepts, preventing forgetting before assessments.",
  },

  // 4. Next Sentence (Sentence 1 -> Add, don't repeat)
  {
    id: "gym-n-1",
    type: "next_sentence",
    domain: "community",
    title: "Free Libraries",
    sentence1: "Free public libraries give people access to computers even if they cannot afford one at home.",
    promptInstruction: "Write the NEXT sentence. Add to the reasoning — do not repeat it.",
    modelAnswer: "Jobseekers can use these internet-connected computers to prepare resumes and apply for employment online.",
  },
  {
    id: "gym-n-2",
    type: "next_sentence",
    domain: "environment",
    title: "Urban Tree Canopy",
    sentence1: "Trees planted beside buildings provide thick shade during hot summer weather.",
    promptInstruction: "Write the NEXT sentence. Add to the reasoning — do not repeat it.",
    modelAnswer: "This shields exterior walls from direct solar heat, substantially reducing the energy needed for air-conditioning.",
  },
  {
    id: "gym-n-3",
    type: "next_sentence",
    domain: "transport",
    title: "Bus Lanes",
    sentence1: "Dedicated bus lanes prevent public buses from being delayed by congested peak-hour traffic.",
    promptInstruction: "Write the NEXT sentence. Add to the reasoning — do not repeat it.",
    modelAnswer: "Because transit times become predictable and fast, more motorists choose to leave their cars at home.",
  },
  {
    id: "gym-n-4",
    type: "next_sentence",
    domain: "science",
    title: "Vaccination",
    sentence1: "Widespread vaccination exposes a population's immune systems to harmless fragments of a pathogen.",
    promptInstruction: "Write the NEXT sentence. Add to the reasoning — do not repeat it.",
    modelAnswer: "This trains antibodies to neutralise the virus quickly before an active infection can spread between hosts.",
  },
  {
    id: "gym-n-5",
    type: "next_sentence",
    domain: "space",
    title: "Reusable Rockets",
    sentence1: "Reusable rocket boosters fly back to ground launchpads after deploying their cargo into orbit.",
    promptInstruction: "Write the NEXT sentence. Add to the reasoning — do not repeat it.",
    modelAnswer: "Refurbishing existing boosters rather than building new ones drastically cuts the financial cost per satellite launch.",
  },
];
