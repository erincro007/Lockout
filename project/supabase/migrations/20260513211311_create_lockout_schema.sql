/*
  # Lockout App — Initial Schema

  ## Summary
  Creates all core tables for the Lockout fitness tracker app.
  Note: groups table created first, then profiles (with FK to groups), then dependent tables.
*/

-- groups table (must come before profiles due to FK)
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  invite_code text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  avatar_url text,
  email text,
  water_goal_oz int NOT NULL DEFAULT 64,
  cal_goal int NOT NULL DEFAULT 2000,
  theme text NOT NULL DEFAULT 'blue' CHECK (theme IN ('blue','pink','purple','red','green')),
  show_macros boolean NOT NULL DEFAULT true,
  protein_pct int NOT NULL DEFAULT 30,
  carbs_pct int NOT NULL DEFAULT 40,
  fat_pct int NOT NULL DEFAULT 30,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  today_layout jsonb NOT NULL DEFAULT '[
    {"module":"workout","visible":true},
    {"module":"water","visible":true},
    {"module":"nutrition","visible":true},
    {"module":"sleep","visible":true},
    {"module":"steps","visible":true},
    {"module":"gratitude","visible":true}
  ]'::jsonb,
  terra_user_id text,
  gratitude_reminder_enabled boolean NOT NULL DEFAULT true,
  gratitude_reminder_time time NOT NULL DEFAULT '20:00',
  weekly_reminder_enabled boolean NOT NULL DEFAULT false,
  weekly_reminder_day text NOT NULL DEFAULT 'sunday',
  weekly_reminder_time time NOT NULL DEFAULT '09:00',
  auto_post_workout boolean NOT NULL DEFAULT true,
  auto_post_water_goal boolean NOT NULL DEFAULT true,
  auto_post_cal_goal boolean NOT NULL DEFAULT false,
  auto_post_steps_goal boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add FK from groups.created_by to profiles now that profiles exists
ALTER TABLE groups ADD CONSTRAINT groups_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- groups policies
CREATE POLICY "Group members can view their group"
  ON groups FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM profiles WHERE id = auth.uid() AND group_id IS NOT NULL
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creator can update group"
  ON groups FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view group members profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    group_id IS NOT NULL AND
    group_id IN (
      SELECT group_id FROM profiles p2 WHERE p2.id = auth.uid() AND p2.group_id IS NOT NULL
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- days table
CREATE TABLE IF NOT EXISTS days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  water_oz int NOT NULL DEFAULT 0,
  gratitude text NOT NULL DEFAULT '',
  steps int,
  steps_source text NOT NULL DEFAULT 'manual' CHECK (steps_source IN ('manual','terra')),
  sleep_hours numeric,
  sleep_note text NOT NULL DEFAULT '',
  sleep_source text NOT NULL DEFAULT 'manual' CHECK (sleep_source IN ('manual','terra')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own days"
  ON days FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own days"
  ON days FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own days"
  ON days FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- food_entries table
CREATE TABLE IF NOT EXISTS food_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal text NOT NULL CHECK (meal IN ('B','L','D','S')),
  food_name text NOT NULL,
  serving_grams numeric,
  calories numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  source text CHECK (source IN ('off','usda','custom')),
  source_id text,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food entries"
  ON food_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own food entries"
  ON food_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own food entries"
  ON food_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own food entries"
  ON food_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL DEFAULT '',
  duration_min numeric,
  calories_burned numeric,
  avg_hr numeric,
  max_hr numeric,
  notes text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','planned','terra')),
  terra_workout_id text UNIQUE,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- workout_templates table
CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT '',
  duration_min numeric,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout templates"
  ON workout_templates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own workout templates"
  ON workout_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own workout templates"
  ON workout_templates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own workout templates"
  ON workout_templates FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- weeks table
CREATE TABLE IF NOT EXISTS weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  commit_to text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weeks"
  ON weeks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own weeks"
  ON weeks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own weeks"
  ON weeks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'manual' CHECK (type IN ('manual','auto_workout','auto_goal_water','auto_goal_cal','auto_goal_steps')),
  body text NOT NULL DEFAULT '',
  photo_url text,
  tag text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view posts"
  ON posts FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM profiles WHERE id = auth.uid() AND group_id IS NOT NULL
    )
  );

CREATE POLICY "Group members can insert posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    group_id IN (
      SELECT group_id FROM profiles WHERE id = auth.uid() AND group_id IS NOT NULL
    )
  );

CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- reactions table
CREATE TABLE IF NOT EXISTS reactions (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, user_id, emoji)
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view reactions"
  ON reactions FOR SELECT
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM posts WHERE group_id IN (
        SELECT group_id FROM profiles WHERE id = auth.uid() AND group_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Group members can insert reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    post_id IN (
      SELECT id FROM posts WHERE group_id IN (
        SELECT group_id FROM profiles WHERE id = auth.uid() AND group_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can delete own reactions"
  ON reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM posts WHERE group_id IN (
        SELECT group_id FROM profiles WHERE id = auth.uid() AND group_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Group members can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    post_id IN (
      SELECT id FROM posts WHERE group_id IN (
        SELECT group_id FROM profiles WHERE id = auth.uid() AND group_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Authors can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_days_user_date ON days(user_id, date);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_posts_group_created ON posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
