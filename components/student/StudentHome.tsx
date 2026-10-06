"use client";

import { useState, useEffect } from "react";
import { StudentProfile, ExerciseType } from "@/types";
import { getProfile, LEVEL_TIERS, pickUnseenItem } from "@/lib/storage";
import { SEED_TOPICS } from "@/lib/content/seed-topics";
import {
  SEED_CAUSAL_CHAINS,
  SEED_ARGUMENT_BUILDER,
  SEED_EXAMPLE_PROMPTS,
  SEED_FIX_WEAK_LINK,
  SEED_ONE_STEP_ONLY,
  SEED_BUILD_PARAGRAPH,
  SEED_SENTENCE_FORGE,
} from "@/lib/content/seed-drills";
import { DailyQuestSession } from "@/components/student/DailyQuestSession";
import { IdeaSprint } from "@/components/games/IdeaSprint";
import { CausalChain } from "@/components/games/CausalChain";
import { ArgumentBuilder } from "@/components/games/ArgumentBuilder";
import { BuildTheParagraph } from "@/components/games/BuildTheParagraph";
import { ExampleEngine } from "@/components/games/ExampleEngine";
import { FixWeakLink } from "@/components/games/FixWeakLink";
import { OneStepOnly } from "@/components/games/OneStepOnly";
import { RepeatVsAdd } from "@/components/games/RepeatVsAdd";
import { SentenceForge } from "@/components/games/SentenceForge";
import { ThreeParagraphPlan } from "@/components/games/ThreeParagraphPlan";
import {
  Flame,
  Sparkles,
  Zap,
  Target,
  Clock,
  BookOpen,
  ArrowRight,
  Trophy,
  ShieldCheck,
  TrendingUp,
  Layers,
  Footprints,
  Link2Off,
  PenTool,
} from "lucide-react";

export function StudentHome() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeMode, setActiveMode] = useState<ExerciseType | "daily_quest" | null>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const refreshProfile = () => {
    setProfile(getProfile());
    setActiveMode(null);
  };

  if (!profile) return null;

  // Calculate XP progress in current level
  const currentTier = LEVEL_TIERS.find((t) => t.level === profile.level) || LEVEL_TIERS[0];
  const nextTier = LEVEL_TIERS.find((t) => t.level === profile.level + 1);
  const xpCurrentLevel = profile.totalXp - currentTier.minXp;
  const xpSpan = nextTier ? nextTier.minXp - currentTier.minXp : 1000;
  const progressPercent = Math.min(100, Math.round((xpCurrentLevel / xpSpan) * 100));

  // If in active exercise or quest
  if (activeMode === "daily_quest") {
    return (
      <DailyQuestSession
        onComplete={refreshProfile}
        onExit={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "argument_builder") {
    const prompt = pickUnseenItem(SEED_ARGUMENT_BUILDER);
    return (
      <ArgumentBuilder
        prompt={prompt}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "causal_chain" || activeMode === "what_happens_next") {
    const prompt = pickUnseenItem(SEED_CAUSAL_CHAINS);
    return (
      <CausalChain
        prompt={prompt}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "build_paragraph" || activeMode === "paragraph_builder") {
    const prompt = pickUnseenItem(SEED_BUILD_PARAGRAPH);
    return (
      <BuildTheParagraph
        prompt={prompt}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "example_engine") {
    const prompt = pickUnseenItem(SEED_EXAMPLE_PROMPTS);
    return (
      <ExampleEngine
        prompt={prompt}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "fix_weak_link") {
    const prompt = pickUnseenItem(SEED_FIX_WEAK_LINK);
    return (
      <FixWeakLink
        prompt={prompt}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "one_step_only") {
    const prompt = pickUnseenItem(SEED_ONE_STEP_ONLY);
    return (
      <OneStepOnly
        prompt={prompt}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "idea_sprint") {
    const randomTopic = pickUnseenItem(SEED_TOPICS);
    return (
      <IdeaSprint
        topic={randomTopic}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "repeat_vs_add") {
    return (
      <RepeatVsAdd
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "sentence_forge") {
    const prompt = pickUnseenItem(SEED_SENTENCE_FORGE);
    return (
      <SentenceForge
        prompt={prompt}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "three_paragraph_plan") {
    const randomTopic = pickUnseenItem(SEED_TOPICS);
    return (
      <ThreeParagraphPlan
        topic={randomTopic}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile & Streak Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-white text-xs font-bold uppercase px-3 py-1 rounded-full backdrop-blur-sm">
                Level {profile.level} • {profile.levelTitle}
              </span>
              <span className="bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                {profile.streakDays > 0
                  ? `${profile.streakDays} Day Streak!`
                  : "Start your streak today!"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
              Ready to write, {profile.name}?
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              Deliberate micro-drills to develop complete arguments and deep causal chains.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[220px]">
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span>{profile.totalXp} Total XP</span>
              <span className="text-indigo-200">
                {nextTier ? `${nextTier.minXp} XP (Lvl ${profile.level + 1})` : "Max Level"}
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-indigo-200 mt-2 flex items-center justify-between">
              <span>Next title:</span>
              <span className="font-semibold text-white">
                {nextTier ? nextTier.title : "Writing Grandmaster"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S QUEST HERO CARD */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-indigo-500/30 shadow-md relative group hover:border-indigo-500 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" /> Priority Scholarship Quest
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 8–10 mins
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Today&apos;s Training Quest</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              3 focused micro-drills targeting your main growth areas: convert broad category lenses into full arguments, build logical 3-stage causal chains, and integrate complete persuasive paragraphs.
            </p>
            <div className="flex items-center gap-3 text-xs font-semibold text-indigo-700 pt-1">
              <span>1. Category &rarr; Argument</span>
              <span>•</span>
              <span>2. Causal Progression</span>
              <span>•</span>
              <span>3. Paragraph Development</span>
            </div>
          </div>

          <button
            onClick={() => setActiveMode("daily_quest")}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl shadow-md hover:shadow-indigo-200 hover:scale-105 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            Start Today&apos;s Quest <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* HIGH PRIORITY SKILL DRILLS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" /> High-Priority Component Drills
          </h2>
          <span className="text-xs text-slate-500">Pick any individual skill (1–3 min)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Causal Chain */}
          <button
            type="button"
            onClick={() => setActiveMode("causal_chain")}
            className="p-5 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 rounded-2xl border-2 border-emerald-300 hover:border-emerald-600 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                  Priority #1
                </span>
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Causal Chain
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Point &rarr; Immediate Effect &rarr; Further Consequence &rarr; Significance. No vague jumps or repetition.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Logical Progression</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 2. Build the Paragraph */}
          <button
            type="button"
            onClick={() => setActiveMode("build_paragraph")}
            className="p-5 bg-gradient-to-br from-indigo-50/80 to-indigo-100/50 rounded-2xl border-2 border-indigo-300 hover:border-indigo-600 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                <PenTool className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-200/80 text-indigo-800 px-2 py-0.5 rounded-full">
                  Advanced Priority
                </span>
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Build the Paragraph
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Combine Reason, Explanation, Observable Example, Consequence, and Link into a cohesive paragraph.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-200 flex items-center justify-between text-xs font-bold text-indigo-700">
              <span>5-Function Architecture</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 3. Argument Builder */}
          <button
            type="button"
            onClick={() => setActiveMode("argument_builder")}
            className="p-5 bg-gradient-to-br from-sky-50/70 to-sky-100/40 rounded-2xl border-2 border-sky-300 hover:border-sky-600 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-200/80 text-sky-900 px-2 py-0.5 rounded-full">
                  Core Diagnostic
                </span>
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                Argument Builder
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Take broad lenses like &ldquo;Fairness&rdquo; or &ldquo;Health&rdquo; and convert them into complete claims.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-sky-200 flex items-center justify-between text-xs font-bold text-sky-700">
              <span>Category &rarr; Argument</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 4. Example Engine */}
          <button
            type="button"
            onClick={() => setActiveMode("example_engine")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Example Engine
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Produce an observable scene demonstrating the argument without relying on artificial character names.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Observable Evidence</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 5. Fix the Weak Link */}
          <button
            type="button"
            onClick={() => setActiveMode("fix_weak_link")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Link2Off className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Fix the Weak Link
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Spot unsupported leaps or vague outcomes in a 3-step chain and rewrite only the flawed sentence.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Detect & Repair Leaps</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 6. One Step Only */}
          <button
            type="button"
            onClick={() => setActiveMode("one_step_only")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Footprints className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                One Step Only
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Train causal proximity: identify the immediate direct effect before taking larger logical jumps.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Causal Proximity</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 7. Idea Sprint */}
          <button
            type="button"
            onClick={() => setActiveMode("idea_sprint")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Idea Sprint (Calibrated)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Generate 3 proposition-specific arguments. Category names score 0 marks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Proposition Claims</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 8. 3-Paragraph Plan */}
          <button
            type="button"
            onClick={() => setActiveMode("three_paragraph_plan")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Mini Boss: 3-Paragraph Plan
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Blueprint an entire persuasive essay with distinct arguments under exam timing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Essay Architecture</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 9. Sentence Forge (Demoted) */}
          <button
            type="button"
            onClick={() => setActiveMode("sentence_forge")}
            className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group flex flex-col justify-between opacity-80"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  Relative Strength
                </span>
              </div>
              <h3 className="font-bold text-slate-800">Sentence Forge</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Combine 3 simple sentences using conjunctions. (Demoted: not a primary bottleneck).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Sentence Combining (+15 XP)</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 10. Repeat vs Add (Diagnostic Only) */}
          <button
            type="button"
            onClick={() => setActiveMode("repeat_vs_add")}
            className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group flex flex-col justify-between opacity-80"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Diagnostic Check Only
                </span>
              </div>
              <h3 className="font-bold text-slate-800">Repeat vs Add</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Occasional check (max 3 novel questions). Not included in routine daily practice.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Diagnostic Mini-Check (+10 XP)</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
