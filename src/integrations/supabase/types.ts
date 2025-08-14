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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      analytics_metrics: {
        Row: {
          avg_time_to_qualify: string | null
          block_rate: string | null
          client_id: string | null
          created_at: string
          date: string
          id: string
          leads_per_day: string | null
          qualification_rate: string | null
          response_rate: string | null
          updated_at: string
        }
        Insert: {
          avg_time_to_qualify?: string | null
          block_rate?: string | null
          client_id?: string | null
          created_at?: string
          date?: string
          id?: string
          leads_per_day?: string | null
          qualification_rate?: string | null
          response_rate?: string | null
          updated_at?: string
        }
        Update: {
          avg_time_to_qualify?: string | null
          block_rate?: string | null
          client_id?: string | null
          created_at?: string
          date?: string
          id?: string
          leads_per_day?: string | null
          qualification_rate?: string | null
          response_rate?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_config: {
        Row: {
          client_id: string
          client_name: string
          created_at: string | null
          google_sheet_id: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          sms_limit: number | null
          sms_used: number | null
          subscription_plan: string | null
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_messaging_service_sid: string | null
          twilio_phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          client_name: string
          created_at?: string | null
          google_sheet_id?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          sms_limit?: number | null
          sms_used?: number | null
          subscription_plan?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_messaging_service_sid?: string | null
          twilio_phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          client_name?: string
          created_at?: string | null
          google_sheet_id?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          sms_limit?: number | null
          sms_used?: number | null
          subscription_plan?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_messaging_service_sid?: string | null
          twilio_phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_invites: {
        Row: {
          accepted_at: string | null
          client_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by_user_id: string | null
          role: string
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by_user_id?: string | null
          role?: string
        }
        Update: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by_user_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_settings: {
        Row: {
          client_id: string
          client_name: string
          created_at: string | null
          google_sheet_id: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          sms_limit: number | null
          sms_used: number | null
          subscription_plan: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          client_name: string
          created_at?: string | null
          google_sheet_id?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          sms_limit?: number | null
          sms_used?: number | null
          subscription_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          client_name?: string
          created_at?: string | null
          google_sheet_id?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          sms_limit?: number | null
          sms_used?: number | null
          subscription_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          api_key: string | null
          company: string | null
          created_at: string | null
          created_by_user_id: string | null
          domain: string | null
          email: string
          id: string
          industry: string | null
          is_setup_complete: boolean | null
          name: string
          phone: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          company?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          domain?: string | null
          email: string
          id?: string
          industry?: string | null
          is_setup_complete?: boolean | null
          name: string
          phone?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          company?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          domain?: string | null
          email?: string
          id?: string
          industry?: string | null
          is_setup_complete?: boolean | null
          name?: string
          phone?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone_e164: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_e164: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_e164?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          client_id: string | null
          contact_id: string
          created_at: string
          id: string
          last_msg_at: string | null
          status: string
        }
        Insert: {
          client_id?: string | null
          contact_id: string
          created_at?: string
          id?: string
          last_msg_at?: string | null
          status?: string
        }
        Update: {
          client_id?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          last_msg_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          processed_rows: number | null
          sheet_name: string | null
          status: string | null
          total_rows: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          processed_rows?: number | null
          sheet_name?: string | null
          status?: string | null
          total_rows?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          processed_rows?: number | null
          sheet_name?: string | null
          status?: string | null
          total_rows?: number | null
        }
        Relationships: []
      }
      lead_phone_mapping: {
        Row: {
          campaign_name: string | null
          client_id: string
          created_at: string | null
          id: string
          last_contacted: string | null
          phone_number: string
        }
        Insert: {
          campaign_name?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          last_contacted?: string | null
          phone_number: string
        }
        Update: {
          campaign_name?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          last_contacted?: string | null
          phone_number?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          ai_classification_reason: string | null
          ai_tag: string | null
          city: string | null
          client_id: string | null
          created_at: string
          date_added: string | null
          email: string | null
          first_name: string | null
          id: string
          last_classification_at: string | null
          last_name: string | null
          list_name: string | null
          metadata: Json | null
          phone: string | null
          state: string | null
          status: string
          updated_at: string
          uploaded_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          ai_classification_reason?: string | null
          ai_tag?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          date_added?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_classification_at?: string | null
          last_name?: string | null
          list_name?: string | null
          metadata?: Json | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          uploaded_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          ai_classification_reason?: string | null
          ai_tag?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          date_added?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_classification_at?: string | null
          last_name?: string | null
          list_name?: string | null
          metadata?: Json | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          uploaded_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          ai_summary: Json | null
          body: string
          client_id: string | null
          conversation_id: string
          created_at: string
          direction: string
          id: string
          twilio_sid: string | null
        }
        Insert: {
          ai_summary?: Json | null
          body: string
          client_id?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          twilio_sid?: string | null
        }
        Update: {
          ai_summary?: Json | null
          body?: string
          client_id?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          client_id: string
          created_at: string
          first_name: string | null
          id: string
          invited_at: string | null
          last_name: string | null
          onboarded_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          client_id?: string
          created_at?: string
          first_name?: string | null
          id?: string
          invited_at?: string | null
          last_name?: string | null
          onboarded_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          first_name?: string | null
          id?: string
          invited_at?: string | null
          last_name?: string | null
          onboarded_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_client_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_client_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_twilio_credentials: {
        Args: { client_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
