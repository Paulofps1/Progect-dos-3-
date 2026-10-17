export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          name: string
          unlock_criteria: Json | null
          xp_reward: number | null
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id: string
          name: string
          unlock_criteria?: Json | null
          xp_reward?: number | null
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          unlock_criteria?: Json | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          body_fat: number | null
          created_at: string
          date: string
          hip: number | null
          id: string
          user_id: string
          waist: number | null
          weight: number | null
        }
        Insert: {
          body_fat?: number | null
          created_at?: string
          date: string
          hip?: number | null
          id?: string
          user_id: string
          waist?: number | null
          weight?: number | null
        }
        Update: {
          body_fat?: number | null
          created_at?: string
          date?: string
          hip?: number | null
          id?: string
          user_id?: string
          waist?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      brazilian_foods: {
        Row: {
          calories: number
          carbs: number
          category: string | null
          fat: number
          fiber: number | null
          healthier_alternative: string | null
          id: string
          name: string
          protein: number
          serving_grams: number | null
          serving_size: string | null
        }
        Insert: {
          calories?: number
          carbs?: number
          category?: string | null
          fat?: number
          fiber?: number | null
          healthier_alternative?: string | null
          id?: string
          name: string
          protein?: number
          serving_grams?: number | null
          serving_size?: string | null
        }
        Update: {
          calories?: number
          carbs?: number
          category?: string | null
          fat?: number
          fiber?: number | null
          healthier_alternative?: string | null
          id?: string
          name?: string
          protein?: number
          serving_grams?: number | null
          serving_size?: string | null
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed: boolean
          joined_at: string
          progress: Json | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          joined_at?: string
          progress?: Json | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          joined_at?: string
          progress?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number | null
          end_date: string | null
          goal: Json
          id: string
          participants_count: number | null
          reward_badge: string | null
          reward_xp: number | null
          start_date: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          goal?: Json
          id?: string
          participants_count?: number | null
          reward_badge?: string | null
          reward_xp?: number | null
          start_date?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          goal?: Json
          id?: string
          participants_count?: number | null
          reward_badge?: string | null
          reward_xp?: number | null
          start_date?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          context: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          context?: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          context?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_consumption: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          date: string
          fat: number | null
          id: string
          protein: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          date: string
          fat?: number | null
          id?: string
          protein?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          date?: string
          fat?: number | null
          id?: string
          protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      delivery_items: {
        Row: {
          calories: number | null
          carbs: number | null
          category: string | null
          description: string | null
          fat: number | null
          id: string
          image_url: string | null
          name: string
          protein: number | null
          restaurant_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          category?: string | null
          description?: string | null
          fat?: number | null
          id?: string
          image_url?: string | null
          name: string
          protein?: number | null
          restaurant_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          category?: string | null
          description?: string | null
          fat?: number | null
          id?: string
          image_url?: string | null
          name?: string
          protein?: number | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "delivery_restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_restaurants: {
        Row: {
          categories: string[] | null
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          categories?: string[] | null
          id: string
          logo_url?: string | null
          name: string
        }
        Update: {
          categories?: string[] | null
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      diets: {
        Row: {
          calories_target: number | null
          carbs_target: number | null
          created_at: string
          diet_data: Json | null
          fat_target: number | null
          id: string
          is_active: boolean | null
          name: string
          protein_target: number | null
          user_id: string
        }
        Insert: {
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string
          diet_data?: Json | null
          fat_target?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          protein_target?: number | null
          user_id: string
        }
        Update: {
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string
          diet_data?: Json | null
          fat_target?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          protein_target?: number | null
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          calories_per_min: number | null
          created_at: string
          difficulty: string
          equipment: string
          id: string
          image_url: string | null
          instructions: string | null
          is_compound: boolean | null
          modality: string
          muscle_group: string
          name: string
          secondary_muscles: string[] | null
        }
        Insert: {
          calories_per_min?: number | null
          created_at?: string
          difficulty?: string
          equipment?: string
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_compound?: boolean | null
          modality?: string
          muscle_group: string
          name: string
          secondary_muscles?: string[] | null
        }
        Update: {
          calories_per_min?: number | null
          created_at?: string
          difficulty?: string
          equipment?: string
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_compound?: boolean | null
          modality?: string
          muscle_group?: string
          name?: string
          secondary_muscles?: string[] | null
        }
        Relationships: []
      }
      favorite_meals: {
        Row: {
          created_at: string
          foods: Json
          id: string
          name: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          foods?: Json
          id?: string
          name: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          foods?: Json
          id?: string
          name?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          created_at: string
          date: string | null
          id: string
          meal_items: Json | null
          meal_type: string | null
          name: string
          time: string | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          meal_items?: Json | null
          meal_type?: string | null
          name: string
          time?: string | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          meal_items?: Json | null
          meal_type?: string | null
          name?: string
          time?: string | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          current_streak: number | null
          dietary_restrictions: string[] | null
          exercise_frequency: number | null
          first_login: boolean
          flex_calories_bonus: number | null
          flex_days: number[] | null
          full_name: string | null
          gender: string | null
          goal: string | null
          has_seen_onboarding: boolean
          height: number | null
          id: string
          is_premium: boolean
          last_active_date: string | null
          longest_streak: number | null
          meal_routine: string | null
          notification_daily: boolean
          notification_meals: boolean
          notification_tips: boolean
          notification_water: boolean
          observations: string | null
          onboarding_step: number | null
          password_created: boolean
          phone_number: string | null
          plan: string | null
          scans_remaining: number
          sleep_quality: number | null
          target_weight: number | null
          updated_at: string
          uses_supplements: boolean | null
          water_goal_ml: number | null
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          current_streak?: number | null
          dietary_restrictions?: string[] | null
          exercise_frequency?: number | null
          first_login?: boolean
          flex_calories_bonus?: number | null
          flex_days?: number[] | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          has_seen_onboarding?: boolean
          height?: number | null
          id: string
          is_premium?: boolean
          last_active_date?: string | null
          longest_streak?: number | null
          meal_routine?: string | null
          notification_daily?: boolean
          notification_meals?: boolean
          notification_tips?: boolean
          notification_water?: boolean
          observations?: string | null
          onboarding_step?: number | null
          password_created?: boolean
          phone_number?: string | null
          plan?: string | null
          scans_remaining?: number
          sleep_quality?: number | null
          target_weight?: number | null
          updated_at?: string
          uses_supplements?: boolean | null
          water_goal_ml?: number | null
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          current_streak?: number | null
          dietary_restrictions?: string[] | null
          exercise_frequency?: number | null
          first_login?: boolean
          flex_calories_bonus?: number | null
          flex_days?: number[] | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          has_seen_onboarding?: boolean
          height?: number | null
          id?: string
          is_premium?: boolean
          last_active_date?: string | null
          longest_streak?: number | null
          meal_routine?: string | null
          notification_daily?: boolean
          notification_meals?: boolean
          notification_tips?: boolean
          notification_water?: boolean
          observations?: string | null
          onboarding_step?: number | null
          password_created?: boolean
          phone_number?: string | null
          plan?: string | null
          scans_remaining?: number
          sleep_quality?: number | null
          target_weight?: number | null
          updated_at?: string
          uses_supplements?: boolean | null
          water_goal_ml?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories_per_serving: number | null
          carbs_per_serving: number | null
          category: string | null
          created_at: string
          description: string | null
          diet_type: string[] | null
          fat_per_serving: number | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: string[]
          name: string
          prep_time_min: number | null
          protein_per_serving: number | null
          servings: number | null
        }
        Insert: {
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          diet_type?: string[] | null
          fat_per_serving?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string[]
          name: string
          prep_time_min?: number | null
          protein_per_serving?: number | null
          servings?: number | null
        }
        Update: {
          calories_per_serving?: number | null
          carbs_per_serving?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          diet_type?: string[] | null
          fat_per_serving?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string[]
          name?: string
          prep_time_min?: number | null
          protein_per_serving?: number | null
          servings?: number | null
        }
        Relationships: []
      }
      recovery_mode: {
        Row: {
          activated_at: string
          bonus_xp_earned: number | null
          deactivated_at: string | null
          id: string
          is_active: boolean
          mini_goal_calories: number | null
          mini_goal_water: number | null
          reason: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string
          bonus_xp_earned?: number | null
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          mini_goal_calories?: number | null
          mini_goal_water?: number | null
          reason?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string
          bonus_xp_earned?: number | null
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          mini_goal_calories?: number | null
          mini_goal_water?: number | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          analysis_details: Json | null
          created_at: string
          energy_impact: string | null
          health_score: number | null
          id: string
          product_image: string | null
          product_name: string | null
          skin_impact: string | null
          user_id: string
          weight_impact: string | null
        }
        Insert: {
          analysis_details?: Json | null
          created_at?: string
          energy_impact?: string | null
          health_score?: number | null
          id?: string
          product_image?: string | null
          product_name?: string | null
          skin_impact?: string | null
          user_id: string
          weight_impact?: string | null
        }
        Update: {
          analysis_details?: Json | null
          created_at?: string
          energy_impact?: string | null
          health_score?: number | null
          id?: string
          product_image?: string | null
          product_name?: string | null
          skin_impact?: string | null
          user_id?: string
          weight_impact?: string | null
        }
        Relationships: []
      }
      squad_activities: {
        Row: {
          activity_text: string
          activity_type: string
          created_at: string
          id: string
          squad_id: string
          user_id: string | null
        }
        Insert: {
          activity_text: string
          activity_type: string
          created_at?: string
          id?: string
          squad_id: string
          user_id?: string | null
        }
        Update: {
          activity_text?: string
          activity_type?: string
          created_at?: string
          id?: string
          squad_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squad_activities_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          joined_at: string
          role: string
          squad_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          role?: string
          squad_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: string
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          collective_streak: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          name: string
          total_xp: number | null
        }
        Insert: {
          collective_streak?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string | null
          name: string
          total_xp?: number | null
        }
        Update: {
          collective_streak?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          name?: string
          total_xp?: number | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          badges: string[] | null
          current_streak: number
          last_activity_date: string | null
          level: number
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badges?: string[] | null
          current_streak?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badges?: string[] | null
          current_streak?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      water_consumption: {
        Row: {
          amount_ml: number
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          created_at?: string
          date: string
          id?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          active_days: number | null
          avg_calories: number | null
          avg_carbs: number | null
          avg_fat: number | null
          avg_protein: number | null
          avg_water: number | null
          created_at: string
          id: string
          insights: Json | null
          total_meals: number | null
          user_id: string
          week_end: string
          week_start: string
          weight_change: number | null
        }
        Insert: {
          active_days?: number | null
          avg_calories?: number | null
          avg_carbs?: number | null
          avg_fat?: number | null
          avg_protein?: number | null
          avg_water?: number | null
          created_at?: string
          id?: string
          insights?: Json | null
          total_meals?: number | null
          user_id: string
          week_end: string
          week_start: string
          weight_change?: number | null
        }
        Update: {
          active_days?: number | null
          avg_calories?: number | null
          avg_carbs?: number | null
          avg_fat?: number | null
          avg_protein?: number | null
          avg_water?: number | null
          created_at?: string
          id?: string
          insights?: Json | null
          total_meals?: number | null
          user_id?: string
          week_end?: string
          week_start?: string
          weight_change?: number | null
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          days_per_week: number | null
          equipment_available: string[] | null
          goal: string | null
          id: string
          is_active: boolean | null
          name: string
          plan_data: Json | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          days_per_week?: number | null
          equipment_available?: string[] | null
          goal?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          plan_data?: Json | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          days_per_week?: number | null
          equipment_available?: string[] | null
          goal?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          plan_data?: Json | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          calories_burned: number | null
          created_at: string
          date: string
          duration_min: number | null
          finished_at: string | null
          id: string
          modality: string | null
          mood: string | null
          notes: string | null
          plan_id: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          date: string
          duration_min?: number | null
          finished_at?: string | null
          id?: string
          modality?: string | null
          mood?: string | null
          notes?: string | null
          plan_id?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          date?: string
          duration_min?: number | null
          finished_at?: string | null
          id?: string
          modality?: string | null
          mood?: string | null
          notes?: string | null
          plan_id?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed: boolean | null
          created_at: string
          distance_km: number | null
          duration_sec: number | null
          exercise_id: string
          id: string
          reps: number | null
          session_id: string
          set_number: number
          weight_kg: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          distance_km?: number | null
          duration_sec?: number | null
          exercise_id: string
          id?: string
          reps?: number | null
          session_id: string
          set_number?: number
          weight_kg?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          distance_km?: number | null
          duration_sec?: number | null
          exercise_id?: string
          id?: string
          reps?: number | null
          session_id?: string
          set_number?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
