-- Supabase PostgreSQL Schema for Scholarship Writing Lab (Single-Student Edition)

CREATE TABLE IF NOT EXISTS student_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Kiran',
  grade_level INTEGER DEFAULT 5,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  level_title TEXT DEFAULT 'Reasoning Starter',
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  exam_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profile(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL, -- e.g. 'argument_distinction', 'repeat_vs_add', 'causal_reasoning'
  mastery_score INTEGER DEFAULT 40, -- 0 to 100
  attempt_count INTEGER DEFAULT 0,
  last_practised_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, skill_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profile(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  topic TEXT,
  domain TEXT,
  input_data JSONB,
  score INTEGER,
  xp_earned INTEGER,
  duration_seconds INTEGER,
  feedback TEXT,
  misconception TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_bests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profile(id) ON DELETE CASCADE,
  metric TEXT NOT NULL, -- e.g. 'fastest_idea_sprint_seconds'
  value NUMERIC NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, metric)
);
