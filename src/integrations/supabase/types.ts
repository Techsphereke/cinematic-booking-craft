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
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          attendees: number | null
          booking_ref: string
          client_user_id: string | null
          created_at: string
          deposit_amount: number
          email: string
          end_time: string
          estimated_total: number
          event_date: string
          event_type: string
          full_name: string
          hourly_rate: number
          id: string
          location: string
          phone: string
          remaining_balance: number
          service_id: string | null
          special_notes: string | null
          start_time: string
          status: string
          stripe_balance_payment_intent: string | null
          stripe_balance_session_id: string | null
          stripe_deposit_payment_intent: string | null
          stripe_deposit_session_id: string | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          attendees?: number | null
          booking_ref: string
          client_user_id?: string | null
          created_at?: string
          deposit_amount: number
          email: string
          end_time: string
          estimated_total: number
          event_date: string
          event_type: string
          full_name: string
          hourly_rate: number
          id?: string
          location: string
          phone: string
          remaining_balance: number
          service_id?: string | null
          special_notes?: string | null
          start_time: string
          status?: string
          stripe_balance_payment_intent?: string | null
          stripe_balance_session_id?: string | null
          stripe_deposit_payment_intent?: string | null
          stripe_deposit_session_id?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          attendees?: number | null
          booking_ref?: string
          client_user_id?: string | null
          created_at?: string
          deposit_amount?: number
          email?: string
          end_time?: string
          estimated_total?: number
          event_date?: string
          event_type?: string
          full_name?: string
          hourly_rate?: number
          id?: string
          location?: string
          phone?: string
          remaining_balance?: number
          service_id?: string | null
          special_notes?: string | null
          start_time?: string
          status?: string
          stripe_balance_payment_intent?: string | null
          stripe_balance_session_id?: string | null
          stripe_deposit_payment_intent?: string | null
          stripe_deposit_session_id?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio: {
        Row: {
          category: string
          created_at: string
          description: string | null
          featured: boolean
          id: string
          image_url: string
          sort_order: number | null
          title: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url: string
          sort_order?: number | null
          title: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string
          sort_order?: number | null
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          booking_id: string | null
          client_user_id: string
          content_locked: boolean
          created_at: string
          description: string | null
          full_gallery_urls: string[] | null
          full_video_url: string | null
          id: string
          preview_gallery_urls: string[] | null
          preview_video_url: string | null
          status: string
          title: string
          updated_at: string
          watermarked: boolean
        }
        Insert: {
          booking_id?: string | null
          client_user_id: string
          content_locked?: boolean
          created_at?: string
          description?: string | null
          full_gallery_urls?: string[] | null
          full_video_url?: string | null
          id?: string
          preview_gallery_urls?: string[] | null
          preview_video_url?: string | null
          status?: string
          title: string
          updated_at?: string
          watermarked?: boolean
        }
        Update: {
          booking_id?: string | null
          client_user_id?: string
          content_locked?: boolean
          created_at?: string
          description?: string | null
          full_gallery_urls?: string[] | null
          full_video_url?: string | null
          id?: string
          preview_gallery_urls?: string[] | null
          preview_video_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          watermarked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "projects_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          admin_notes: string | null
          budget_range: string | null
          created_at: string
          email: string
          event_date: string | null
          event_type: string
          full_name: string
          guests_estimate: number | null
          id: string
          location: string | null
          message: string
          phone: string
          service_interest: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          budget_range?: string | null
          created_at?: string
          email: string
          event_date?: string | null
          event_type: string
          full_name: string
          guests_estimate?: number | null
          id?: string
          location?: string | null
          message: string
          phone: string
          service_interest: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          budget_range?: string | null
          created_at?: string
          email?: string
          event_date?: string | null
          event_type?: string
          full_name?: string
          guests_estimate?: number | null
          id?: string
          location?: string | null
          message?: string
          phone?: string
          service_interest?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          hourly_rate: number
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hourly_rate?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hourly_rate?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_booking_ref: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
