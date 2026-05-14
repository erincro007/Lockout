export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          email: string | null;
          water_goal_oz: number;
          cal_goal: number;
          theme: 'blue' | 'pink' | 'purple' | 'red' | 'green';
          show_macros: boolean;
          protein_pct: number;
          carbs_pct: number;
          fat_pct: number;
          group_id: string | null;
          today_layout: Json;
          terra_user_id: string | null;
          gratitude_reminder_enabled: boolean;
          gratitude_reminder_time: string;
          weekly_reminder_enabled: boolean;
          weekly_reminder_day: string;
          weekly_reminder_time: string;
          auto_post_workout: boolean;
          auto_post_water_goal: boolean;
          auto_post_cal_goal: boolean;
          auto_post_steps_goal: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      groups: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['groups']['Row']>;
        Update: Partial<Database['public']['Tables']['groups']['Row']>;
      };
      days: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          water_oz: number;
          gratitude: string;
          steps: number | null;
          steps_source: 'manual' | 'terra';
          sleep_hours: number | null;
          sleep_note: string;
          sleep_source: 'manual' | 'terra';
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['days']['Row']> & { user_id: string; date: string };
        Update: Partial<Database['public']['Tables']['days']['Row']>;
      };
      food_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal: 'B' | 'L' | 'D' | 'S';
          food_name: string;
          serving_grams: number | null;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          source: 'off' | 'usda' | 'custom' | null;
          source_id: string | null;
          is_favorite: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['food_entries']['Row']> & {
          user_id: string; date: string; meal: 'B' | 'L' | 'D' | 'S'; food_name: string;
        };
        Update: Partial<Database['public']['Tables']['food_entries']['Row']>;
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          type: string;
          duration_min: number | null;
          calories_burned: number | null;
          avg_hr: number | null;
          max_hr: number | null;
          notes: string;
          source: 'manual' | 'planned' | 'terra';
          terra_workout_id: string | null;
          completed: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['workouts']['Row']> & { user_id: string; date: string };
        Update: Partial<Database['public']['Tables']['workouts']['Row']>;
      };
      workout_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          duration_min: number | null;
          notes: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['workout_templates']['Row']> & { user_id: string; name: string };
        Update: Partial<Database['public']['Tables']['workout_templates']['Row']>;
      };
      weeks: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          commit_to: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['weeks']['Row']> & { user_id: string; week_start: string };
        Update: Partial<Database['public']['Tables']['weeks']['Row']>;
      };
      posts: {
        Row: {
          id: string;
          group_id: string;
          author_id: string;
          type: 'manual' | 'auto_workout' | 'auto_goal_water' | 'auto_goal_cal' | 'auto_goal_steps';
          body: string;
          photo_url: string | null;
          tag: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['posts']['Row']> & { group_id: string; author_id: string };
        Update: Partial<Database['public']['Tables']['posts']['Row']>;
      };
      reactions: {
        Row: { post_id: string; user_id: string; emoji: string; created_at: string };
        Insert: { post_id: string; user_id: string; emoji: string };
        Update: never;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['comments']['Row']> & { post_id: string; author_id: string; body: string };
        Update: Partial<Database['public']['Tables']['comments']['Row']>;
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type Day = Database['public']['Tables']['days']['Row'];
export type FoodEntry = Database['public']['Tables']['food_entries']['Row'];
export type Workout = Database['public']['Tables']['workouts']['Row'];
export type WorkoutTemplate = Database['public']['Tables']['workout_templates']['Row'];
export type Week = Database['public']['Tables']['weeks']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Reaction = Database['public']['Tables']['reactions']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];

export interface TodayLayoutItem {
  module: 'workout' | 'water' | 'nutrition' | 'sleep' | 'steps' | 'gratitude';
  visible: boolean;
}
