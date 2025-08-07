export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      orders: {
        Row: {
          comments: string | null
          created_at: string
          description: string | null
          design_data: Json | null
          design_preview_url: string | null
          design_options: Json | null
          id: string
          payment_status: string | null
          price: number | null
          status: string
          title: string
          total_pages: number | null
          total_sections: number | null
          updated_at: string
          user_id: string
          zarinpal_authority: string | null
          zarinpal_ref_id: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          description?: string | null
          design_data?: Json | null
          design_preview_url?: string | null
          design_options?: Json | null
          id?: string
          payment_status?: string | null
          price?: number | null
          status?: string
          title: string
          total_pages?: number | null
          total_sections?: number | null
          updated_at?: string
          user_id: string
          zarinpal_authority?: string | null
          zarinpal_ref_id?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          description?: string | null
          design_data?: Json | null
          design_preview_url?: string | null
          design_options?: Json | null
          id?: string
          payment_status?: string | null
          price?: number | null
          status?: string
          title?: string
          total_pages?: number | null
          total_sections?: number | null
          updated_at?: string
          user_id?: string
          zarinpal_authority?: string | null
          zarinpal_ref_id?: string | null
        }
        Relationships: []
      }
      design_data: {
        Row: {
          id: string
          order_id: string
          page_id: string
          page_name: string
          sections: Json
          canvas_dimensions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          page_id: string
          page_name: string
          sections: Json
          canvas_dimensions: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          page_id?: string
          page_name?: string
          sections?: Json
          canvas_dimensions?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_data_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_transactions: {
        Row: {
          id: string
          order_id: string
          user_id: string
          transaction_type: string
          zarinpal_authority: string | null
          zarinpal_ref_id: string | null
          amount: number
          status: string
          gateway_response: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          user_id: string
          transaction_type: string
          zarinpal_authority?: string | null
          zarinpal_ref_id?: string | null
          amount: number
          status?: string
          gateway_response?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          user_id?: string
          transaction_type?: string
          zarinpal_authority?: string | null
          zarinpal_ref_id?: string | null
          amount?: number
          status?: string
          gateway_response?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["site_mode"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["site_mode"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["site_mode"]
          updated_at?: string
        }
        Relationships: []
      }

      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_uploads: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          wallet_id: string
          user_id: string
          type: Database["public"]["Enums"]["transaction_type"]
          status: Database["public"]["Enums"]["transaction_status"]
          amount: number
          balance_before: number
          balance_after: number
          description: string | null
          reference_id: string | null
          reference_type: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          user_id: string
          type: Database["public"]["Enums"]["transaction_type"]
          status?: Database["public"]["Enums"]["transaction_status"]
          amount: number
          balance_before: number
          balance_after: number
          description?: string | null
          reference_id?: string | null
          reference_type?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          user_id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          status?: Database["public"]["Enums"]["transaction_status"]
          amount?: number
          balance_before?: number
          balance_after?: number
          description?: string | null
          reference_id?: string | null
          reference_type?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      wireframes: {
        Row: {
          created_at: string
          data: Json
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      save_design_data: {
        Args: {
          p_order_id: string
          p_design_data: Json
        }
        Returns: string
      }
      get_design_data: {
        Args: {
          p_order_id: string
        }
        Returns: Json
      }
      process_wallet_transaction: {
        Args: {
          p_user_id: string
          p_type: Database["public"]["Enums"]["transaction_type"]
          p_amount: number
          p_description?: string | null
          p_reference_id?: string | null
          p_reference_type?: string | null
          p_metadata?: Json | null
        }
        Returns: string
      }
      refund_order_to_wallet: {
        Args: {
          p_order_id: string
        }
        Returns: string
      }
    }
    Enums: {
      site_mode:
        | "normal"
        | "temporarily_unavailable"
        | "update_mode"
        | "development_mode"
      user_role: "user" | "admin"
      transaction_type: "deposit" | "withdrawal" | "payment" | "refund" | "credit" | "debit"
      transaction_status: "pending" | "completed" | "failed" | "cancelled"
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
      site_mode: [
        "normal",
        "temporarily_unavailable",
        "update_mode",
        "development_mode",
      ],
      user_role: ["user", "admin"],
      transaction_type: ["deposit", "withdrawal", "payment", "refund", "credit", "debit"],
      transaction_status: ["pending", "completed", "failed", "cancelled"],
    },
  },
} as const
