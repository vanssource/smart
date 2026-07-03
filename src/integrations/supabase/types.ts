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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          tier: Database["public"]["Enums"]["user_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          code: string
          confidence: number | null
          created_at: string
          id: number
          is_premium: boolean
          reason: string | null
          signal: Database["public"]["Enums"]["signal_type"]
          signal_date: string
          stop_loss: number | null
          target_price: number | null
        }
        Insert: {
          code: string
          confidence?: number | null
          created_at?: string
          id?: number
          is_premium?: boolean
          reason?: string | null
          signal: Database["public"]["Enums"]["signal_type"]
          signal_date: string
          stop_loss?: number | null
          target_price?: number | null
        }
        Update: {
          code?: string
          confidence?: number | null
          created_at?: string
          id?: number
          is_premium?: boolean
          reason?: string | null
          signal?: Database["public"]["Enums"]["signal_type"]
          signal_date?: string
          stop_loss?: number | null
          target_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["code"]
          },
        ]
      }
      stock_indicators: {
        Row: {
          adx: number | null
          as_of: string
          atr: number | null
          bb_lower: number | null
          bb_middle: number | null
          bb_upper: number | null
          code: string
          ema12: number | null
          ema26: number | null
          is_premium_indicator: boolean
          macd: number | null
          macd_hist: number | null
          macd_signal: number | null
          rsi14: number | null
          sma20: number | null
          sma200: number | null
          sma50: number | null
          stoch_d: number | null
          stoch_k: number | null
          updated_at: string
        }
        Insert: {
          adx?: number | null
          as_of: string
          atr?: number | null
          bb_lower?: number | null
          bb_middle?: number | null
          bb_upper?: number | null
          code: string
          ema12?: number | null
          ema26?: number | null
          is_premium_indicator?: boolean
          macd?: number | null
          macd_hist?: number | null
          macd_signal?: number | null
          rsi14?: number | null
          sma20?: number | null
          sma200?: number | null
          sma50?: number | null
          stoch_d?: number | null
          stoch_k?: number | null
          updated_at?: string
        }
        Update: {
          adx?: number | null
          as_of?: string
          atr?: number | null
          bb_lower?: number | null
          bb_middle?: number | null
          bb_upper?: number | null
          code?: string
          ema12?: number | null
          ema26?: number | null
          is_premium_indicator?: boolean
          macd?: number | null
          macd_hist?: number | null
          macd_signal?: number | null
          rsi14?: number | null
          sma20?: number | null
          sma200?: number | null
          sma50?: number | null
          stoch_d?: number | null
          stoch_k?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_indicators_code_fkey"
            columns: ["code"]
            isOneToOne: true
            referencedRelation: "stocks"
            referencedColumns: ["code"]
          },
        ]
      }
      stock_prices: {
        Row: {
          close: number
          code: string
          date: string
          high: number | null
          id: number
          low: number | null
          open: number | null
          volume: number | null
        }
        Insert: {
          close: number
          code: string
          date: string
          high?: number | null
          id?: number
          low?: number | null
          open?: number | null
          volume?: number | null
        }
        Update: {
          close?: number
          code?: string
          date?: string
          high?: number | null
          id?: number
          low?: number | null
          open?: number | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_prices_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["code"]
          },
        ]
      }
      stocks: {
        Row: {
          code: string
          is_premium: boolean
          logo_url: string | null
          name: string
          sector: string | null
          updated_at: string
        }
        Insert: {
          code: string
          is_premium?: boolean
          logo_url?: string | null
          name: string
          sector?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          is_premium?: boolean
          logo_url?: string | null
          name?: string
          sector?: string | null
          updated_at?: string
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
      watchlist: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["code"]
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
      app_role: "admin" | "user"
      signal_type: "buy" | "sell" | "hold"
      user_tier: "free" | "premium"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user"],
      signal_type: ["buy", "sell", "hold"],
      user_tier: ["free", "premium"],
    },
  },
} as const
