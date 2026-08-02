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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          business_address: string
          business_email: string
          business_name: string
          business_phone: string
          id: boolean
          receipt_footer: string
          tax_rate: number
          updated_at: string
          whatsapp_number: string
          whatsapp_template: string
        }
        Insert: {
          business_address?: string
          business_email?: string
          business_name?: string
          business_phone?: string
          id?: boolean
          receipt_footer?: string
          tax_rate?: number
          updated_at?: string
          whatsapp_number?: string
          whatsapp_template?: string
        }
        Update: {
          business_address?: string
          business_email?: string
          business_name?: string
          business_phone?: string
          id?: boolean
          receipt_footer?: string
          tax_rate?: number
          updated_at?: string
          whatsapp_number?: string
          whatsapp_template?: string
        }
        Relationships: []
      }
      email_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed?: boolean
          created_at?: string
          email: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed?: boolean
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_rate_limits: {
        Row: {
          client_key: string
          created_at: string
          id: string
        }
        Insert: {
          client_key: string
          created_at?: string
          id?: string
        }
        Update: {
          client_key?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      muffins: {
        Row: {
          created_at: string
          description: string
          earns_points: boolean
          flavour: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          points_value: number
          price: number
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          earns_points?: boolean
          flavour?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          points_value?: number
          price?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          earns_points?: boolean
          flavour?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          points_value?: number
          price?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          muffin_id: string | null
          muffin_name: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          muffin_id?: string | null
          muffin_name: string
          order_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          muffin_id?: string | null
          muffin_name?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_muffin_id_fkey"
            columns: ["muffin_id"]
            isOneToOne: false
            referencedRelation: "muffins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_paid: number | null
          cashier_name: string | null
          collected_at: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          discount: number
          id: string
          is_student: boolean
          is_walk_in: boolean
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          phone: string | null
          points_awarded: number
          reference: string
          reward_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          amount_paid?: number | null
          cashier_name?: string | null
          collected_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          discount?: number
          id?: string
          is_student?: boolean
          is_walk_in?: boolean
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          phone?: string | null
          points_awarded?: number
          reference?: string
          reward_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          amount_paid?: number | null
          cashier_name?: string | null
          collected_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          discount?: number
          id?: string
          is_student?: boolean
          is_walk_in?: boolean
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          phone?: string | null
          points_awarded?: number
          reference?: string
          reward_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      production_costs: {
        Row: {
          created_at: string
          id: string
          name: string
          quantity: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          quantity?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      production_settings: {
        Row: {
          batch_yield: number
          id: boolean
          selling_price: number
          updated_at: string
        }
        Insert: {
          batch_yield?: number
          id?: boolean
          selling_price?: number
          updated_at?: string
        }
        Update: {
          batch_yield?: number
          id?: boolean
          selling_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          points: number
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          points?: number
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          points?: number
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          customer_name: string
          id: string
          is_approved: boolean
          order_id: string | null
          order_reference: string | null
          rating: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_approved?: boolean
          order_id?: string | null
          order_reference?: string | null
          rating?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_approved?: boolean
          order_id?: string | null
          order_reference?: string | null
          rating?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_settings: {
        Row: {
          expiry_days: number
          id: boolean
          is_active: boolean
          min_redemption_points: number
          points_per_muffin: number
          points_per_purchase: number
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value: number
          updated_at: string
        }
        Insert: {
          expiry_days?: number
          id?: boolean
          is_active?: boolean
          min_redemption_points?: number
          points_per_muffin?: number
          points_per_purchase?: number
          reward_type?: Database["public"]["Enums"]["reward_type"]
          reward_value?: number
          updated_at?: string
        }
        Update: {
          expiry_days?: number
          id?: boolean
          is_active?: boolean
          min_redemption_points?: number
          points_per_muffin?: number
          points_per_purchase?: number
          reward_type?: Database["public"]["Enums"]["reward_type"]
          reward_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      reward_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          order_id: string | null
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string | null
          points: number
          reason?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string | null
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          points_spent: number
          redeemed_at: string | null
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value: number
          status: Database["public"]["Enums"]["reward_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          points_spent?: number
          redeemed_at?: string | null
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value?: number
          status?: Database["public"]["Enums"]["reward_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          points_spent?: number
          redeemed_at?: string | null
          reward_type?: Database["public"]["Enums"]["reward_type"]
          reward_value?: number
          status?: Database["public"]["Enums"]["reward_status"]
          user_id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      order_status: "pending" | "approved" | "ready" | "collected" | "cancelled"
      payment_method: "cash" | "eft"
      reward_status: "active" | "redeemed" | "expired"
      reward_type: "free_muffin" | "percent_discount" | "fixed_discount"
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
      app_role: ["admin", "customer"],
      order_status: ["pending", "approved", "ready", "collected", "cancelled"],
      payment_method: ["cash", "eft"],
      reward_status: ["active", "redeemed", "expired"],
      reward_type: ["free_muffin", "percent_discount", "fixed_discount"],
    },
  },
} as const
