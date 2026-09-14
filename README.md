# Scholarship Writing Lab

A focused, single-student web application designed for a Grade 5 Australian student preparing for competitive private school scholarship exams.

The app replaces passive whole-essay writing with **deliberate micro-drills** (5–15 minutes) targeting the core cognitive skills examiners look for:
1. **Generating Distinct Arguments**: Brainstorming 3 completely different reasons using diverse thinking lenses.
2. **Avoiding Repetition**: Catching echoes and paraphrasing (*Repeat vs Add*).
3. **Causal Reasoning**: Developing *Point &rarr; Result &rarr; Why it matters* consequence chains.
4. **Concrete Evidence**: Giving specific real-world examples rather than circular summaries.
5. **Sentence Combining**: Synthesizing ideas cleanly with logical conjunctions.
6. **3-Paragraph Essay Blueprinting**: Exam-speed mini-boss battle for rapid essay planning.

---

## Key Features

- **Zero Login Friction**: No passwords, sign-ups, or login walls. Kiran opens the site and immediately starts his daily quest.
- **Frictionless Parent Analytics**: Switch directly between Kiran's practice view and the Parent Analytics dashboard with one click in the header.
- **Instant + AI Hybrid**: Deterministic drills (like *Repeat vs Add*) run instantly with pre-authored seed questions; deep reasoning drills (*Idea Sprint*, *What Happens Next*) are evaluated server-side via OpenRouter using fast, cost-effective models (**Google Gemini 2.5 Flash** or **OpenAI GPT-4o-mini**).
- **Graceful Offline Fallback**: Even without an OpenRouter API key configured, the app includes heuristic evaluation and seed prompts so it is fully playable right out of the box.
- **Local Persistence & Supabase Ready**: Automatically saves attempts, XP, streaks, personal bests, and rolling mastery scores in browser storage, with a turnkey Supabase SQL migration schema ready for multi-device sync.

---

## Quick Start (Local)

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_PRIMARY_MODEL=google/gemini-2.5-flash
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Vercel Deployment

1. Push this repository to GitHub.
2. Import the repo into [Vercel](https://vercel.com).
3. In the Vercel project settings, add your Environment Variables:
   - `OPENROUTER_API_KEY`: your OpenRouter API key
   - `OPENROUTER_PRIMARY_MODEL`: `google/gemini-2.5-flash`
4. Deploy! The application will run smoothly on Vercel's free tier.
