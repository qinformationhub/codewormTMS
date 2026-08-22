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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string
          entity_id?: string
          entity_type: string
          id?: string
          ip_address?: string
          user_id?: string | null
          user_name?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      carriers: {
        Row: {
          address: string
          claims_ratio: number
          contact_email: string
          contact_name: string
          created_at: string
          dot_number: string
          gdp_certified: boolean
          hazmat_certified: boolean
          hazmat_safety_rating: string
          id: string
          insurance_coverage: number
          insurance_expires: string | null
          mc_number: string
          medical_approved: boolean
          name: string
          phone: string
          portal_email: string
          portal_invitation_sent_at: string | null
          portal_user_id: string | null
          reefer_certified: boolean
          security_protocol: string
          status: Database["public"]["Enums"]["entity_status"]
          temperature_capabilities: string[]
          truck_insurance: boolean
          updated_at: string
        }
        Insert: {
          address?: string
          claims_ratio?: number
          contact_email?: string
          contact_name?: string
          created_at?: string
          dot_number?: string
          gdp_certified?: boolean
          hazmat_certified?: boolean
          hazmat_safety_rating?: string
          id?: string
          insurance_coverage?: number
          insurance_expires?: string | null
          mc_number?: string
          medical_approved?: boolean
          name: string
          phone?: string
          portal_email?: string
          portal_invitation_sent_at?: string | null
          portal_user_id?: string | null
          reefer_certified?: boolean
          security_protocol?: string
          status?: Database["public"]["Enums"]["entity_status"]
          temperature_capabilities?: string[]
          truck_insurance?: boolean
          updated_at?: string
        }
        Update: {
          address?: string
          claims_ratio?: number
          contact_email?: string
          contact_name?: string
          created_at?: string
          dot_number?: string
          gdp_certified?: boolean
          hazmat_certified?: boolean
          hazmat_safety_rating?: string
          id?: string
          insurance_coverage?: number
          insurance_expires?: string | null
          mc_number?: string
          medical_approved?: boolean
          name?: string
          phone?: string
          portal_email?: string
          portal_invitation_sent_at?: string | null
          portal_user_id?: string | null
          reefer_certified?: boolean
          security_protocol?: string
          status?: Database["public"]["Enums"]["entity_status"]
          temperature_capabilities?: string[]
          truck_insurance?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      dispatch_assignments: {
        Row: {
          assigned_by: string | null
          assigned_by_name: string
          carrier_id: string
          created_at: string
          id: string
          load_id: string
          method: string
          reasoning: string | null
          score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_by_name?: string
          carrier_id: string
          created_at?: string
          id?: string
          load_id: string
          method?: string
          reasoning?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_by_name?: string
          carrier_id?: string
          created_at?: string
          id?: string
          load_id?: string
          method?: string
          reasoning?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_assignments_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_assignments_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          carrier_id: string | null
          category: string
          created_at: string
          doc_type: string
          expires_at: string | null
          file_name: string
          id: string
          load_id: string | null
          owner_type: string
          shipper_id: string | null
          status: string
          uploaded_by: string | null
          uploaded_by_name: string
        }
        Insert: {
          carrier_id?: string | null
          category?: string
          created_at?: string
          doc_type?: string
          expires_at?: string | null
          file_name: string
          id?: string
          load_id?: string | null
          owner_type?: string
          shipper_id?: string | null
          status?: string
          uploaded_by?: string | null
          uploaded_by_name?: string
        }
        Update: {
          carrier_id?: string | null
          category?: string
          created_at?: string
          doc_type?: string
          expires_at?: string | null
          file_name?: string
          id?: string
          load_id?: string | null
          owner_type?: string
          shipper_id?: string | null
          status?: string
          uploaded_by?: string | null
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          availability_status: string | null
          bio: string | null
          carrier_id: string
          certification_expiration: string | null
          certification_name: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          employment_type: string | null
          first_name: string
          id: string
          last_name: string
          license_expiration: string | null
          license_number: string | null
          license_state: string | null
          license_type: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          availability_status?: string | null
          bio?: string | null
          carrier_id: string
          certification_expiration?: string | null
          certification_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employment_type?: string | null
          first_name: string
          id?: string
          last_name: string
          license_expiration?: string | null
          license_number?: string | null
          license_state?: string | null
          license_type?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          availability_status?: string | null
          bio?: string | null
          carrier_id?: string
          certification_expiration?: string | null
          certification_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employment_type?: string | null
          first_name?: string
          id?: string
          last_name?: string
          license_expiration?: string | null
          license_number?: string | null
          license_state?: string | null
          license_type?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      epods: {
        Row: {
          carrier_id: string
          created_at: string
          delivery_location: string
          delivery_notes: string | null
          delivery_timestamp: string
          id: string
          load_id: string
          recipient_name: string
          signature_data: string
        }
        Insert: {
          carrier_id: string
          created_at?: string
          delivery_location: string
          delivery_notes?: string | null
          delivery_timestamp?: string
          id?: string
          load_id: string
          recipient_name: string
          signature_data: string
        }
        Update: {
          carrier_id?: string
          created_at?: string
          delivery_location?: string
          delivery_notes?: string | null
          delivery_timestamp?: string
          id?: string
          load_id?: string
          recipient_name?: string
          signature_data?: string
        }
        Relationships: [
          {
            foreignKeyName: "epods_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epods_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      load_exceptions: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          load_id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["exception_severity"]
          status: Database["public"]["Enums"]["exception_status"]
          type: Database["public"]["Enums"]["exception_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          load_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["exception_severity"]
          status?: Database["public"]["Enums"]["exception_status"]
          type: Database["public"]["Enums"]["exception_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          load_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["exception_severity"]
          status?: Database["public"]["Enums"]["exception_status"]
          type?: Database["public"]["Enums"]["exception_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "load_exceptions_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      load_stops: {
        Row: {
          actual_arrival: string | null
          actual_departure: string | null
          created_at: string
          id: string
          load_id: string
          location_address: string
          notes: string | null
          scheduled_arrival: string | null
          scheduled_departure: string | null
          status: Database["public"]["Enums"]["stop_status"]
          stop_number: number
          stop_type: Database["public"]["Enums"]["stop_type"]
          updated_at: string
        }
        Insert: {
          actual_arrival?: string | null
          actual_departure?: string | null
          created_at?: string
          id?: string
          load_id: string
          location_address: string
          notes?: string | null
          scheduled_arrival?: string | null
          scheduled_departure?: string | null
          status?: Database["public"]["Enums"]["stop_status"]
          stop_number: number
          stop_type: Database["public"]["Enums"]["stop_type"]
          updated_at?: string
        }
        Update: {
          actual_arrival?: string | null
          actual_departure?: string | null
          created_at?: string
          id?: string
          load_id?: string
          location_address?: string
          notes?: string | null
          scheduled_arrival?: string | null
          scheduled_departure?: string | null
          status?: Database["public"]["Enums"]["stop_status"]
          stop_number?: number
          stop_type?: Database["public"]["Enums"]["stop_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "load_stops_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      loads: {
        Row: {
          actual_completion_time: string | null
          carrier_id: string | null
          category: Database["public"]["Enums"]["freight_category"]
          commodity: string
          compliance_flags: string[]
          cost: number
          created_at: string
          created_by: string | null
          declared_value: number
          delivery_date: string | null
          destination_city: string
          destination_lat: number | null
          destination_lng: number | null
          destination_state: string
          driver_id: string | null
          emergency_contact: string
          enable_tracking: boolean
          equipment: string
          hazmat_class: string | null
          high_value: boolean
          id: string
          no_unauthorized_stops: boolean
          notes: string
          origin_city: string
          origin_lat: number | null
          origin_lng: number | null
          origin_state: string
          packing_group: string
          pickup_date: string | null
          pieces: number
          priority: Database["public"]["Enums"]["load_priority"]
          proper_shipping_name: string
          reference: string
          revenue: number
          shipper_id: string | null
          sla_breach_notified: boolean | null
          sla_deadline: string | null
          sla_status: Database["public"]["Enums"]["sla_status"]
          status: Database["public"]["Enums"]["load_status"]
          temp_max: number | null
          temp_min: number | null
          temperature_band: string
          temperature_requirement: string
          theft_risk: string
          truck_requirement: string
          un_number: string
          updated_at: string
          vehicle_id: string | null
          weight_lbs: number
          weight_unit: string
          white_glove: boolean
        }
        Insert: {
          actual_completion_time?: string | null
          carrier_id?: string | null
          category?: Database["public"]["Enums"]["freight_category"]
          commodity?: string
          compliance_flags?: string[]
          cost?: number
          created_at?: string
          created_by?: string | null
          declared_value?: number
          delivery_date?: string | null
          destination_city?: string
          destination_lat?: number | null
          destination_lng?: number | null
          destination_state?: string
          driver_id?: string | null
          emergency_contact?: string
          enable_tracking?: boolean
          equipment?: string
          hazmat_class?: string | null
          high_value?: boolean
          id?: string
          no_unauthorized_stops?: boolean
          notes?: string
          origin_city?: string
          origin_lat?: number | null
          origin_lng?: number | null
          origin_state?: string
          packing_group?: string
          pickup_date?: string | null
          pieces?: number
          priority?: Database["public"]["Enums"]["load_priority"]
          proper_shipping_name?: string
          reference: string
          revenue?: number
          shipper_id?: string | null
          sla_breach_notified?: boolean | null
          sla_deadline?: string | null
          sla_status?: Database["public"]["Enums"]["sla_status"]
          status?: Database["public"]["Enums"]["load_status"]
          temp_max?: number | null
          temp_min?: number | null
          temperature_band?: string
          temperature_requirement?: string
          theft_risk?: string
          truck_requirement?: string
          un_number?: string
          updated_at?: string
          vehicle_id?: string | null
          weight_lbs?: number
          weight_unit?: string
          white_glove?: boolean
        }
        Update: {
          actual_completion_time?: string | null
          carrier_id?: string | null
          category?: Database["public"]["Enums"]["freight_category"]
          commodity?: string
          compliance_flags?: string[]
          cost?: number
          created_at?: string
          created_by?: string | null
          declared_value?: number
          delivery_date?: string | null
          destination_city?: string
          destination_lat?: number | null
          destination_lng?: number | null
          destination_state?: string
          driver_id?: string | null
          emergency_contact?: string
          enable_tracking?: boolean
          equipment?: string
          hazmat_class?: string | null
          high_value?: boolean
          id?: string
          no_unauthorized_stops?: boolean
          notes?: string
          origin_city?: string
          origin_lat?: number | null
          origin_lng?: number | null
          origin_state?: string
          packing_group?: string
          pickup_date?: string | null
          pieces?: number
          priority?: Database["public"]["Enums"]["load_priority"]
          proper_shipping_name?: string
          reference?: string
          revenue?: number
          shipper_id?: string | null
          sla_breach_notified?: boolean | null
          sla_deadline?: string | null
          sla_status?: Database["public"]["Enums"]["sla_status"]
          status?: Database["public"]["Enums"]["load_status"]
          temp_max?: number | null
          temp_min?: number | null
          temperature_band?: string
          temperature_requirement?: string
          theft_risk?: string
          truck_requirement?: string
          un_number?: string
          updated_at?: string
          vehicle_id?: string | null
          weight_lbs?: number
          weight_unit?: string
          white_glove?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "loads_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          load_id: string | null
          message: string
          severity: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          load_id?: string | null
          message: string
          severity?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          load_id?: string | null
          message?: string
          severity?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      shippers: {
        Row: {
          address: string
          chain_of_custody: boolean
          compliance_flags: string[]
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          industry: string
          min_insurance: number
          name: string
          phone: string
          portal_email: string
          portal_invitation_sent_at: string | null
          portal_user_id: string | null
          security_level: string
          sop_documents: Json
          status: Database["public"]["Enums"]["entity_status"]
          temperature_band: string
          truck_insurance: boolean
          updated_at: string
        }
        Insert: {
          address?: string
          chain_of_custody?: boolean
          compliance_flags?: string[]
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          industry?: string
          min_insurance?: number
          name: string
          phone?: string
          portal_email?: string
          portal_invitation_sent_at?: string | null
          portal_user_id?: string | null
          security_level?: string
          sop_documents?: Json
          status?: Database["public"]["Enums"]["entity_status"]
          temperature_band?: string
          truck_insurance?: boolean
          updated_at?: string
        }
        Update: {
          address?: string
          chain_of_custody?: boolean
          compliance_flags?: string[]
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          industry?: string
          min_insurance?: number
          name?: string
          phone?: string
          portal_email?: string
          portal_invitation_sent_at?: string | null
          portal_user_id?: string | null
          security_level?: string
          sop_documents?: Json
          status?: Database["public"]["Enums"]["entity_status"]
          temperature_band?: string
          truck_insurance?: boolean
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
      vehicles: {
        Row: {
          assigned_driver_id: string | null
          capacity_lbs: number | null
          carrier_id: string
          created_at: string
          id: string
          license_plate: string | null
          make: string | null
          model: string | null
          status: string
          updated_at: string
          vehicle_id_tag: string
          vehicle_type: string
          vin: string | null
          year: number | null
        }
        Insert: {
          assigned_driver_id?: string | null
          capacity_lbs?: number | null
          carrier_id: string
          created_at?: string
          id?: string
          license_plate?: string | null
          make?: string | null
          model?: string | null
          status?: string
          updated_at?: string
          vehicle_id_tag: string
          vehicle_type: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          assigned_driver_id?: string | null
          capacity_lbs?: number | null
          carrier_id?: string
          created_at?: string
          id?: string
          license_plate?: string | null
          make?: string | null
          model?: string | null
          status?: string
          updated_at?: string
          vehicle_id_tag?: string
          vehicle_type?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_carrier_ids: { Args: { _user_id: string }; Returns: string[] }
      current_shipper_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "shipper" | "carrier"
      entity_status: "active" | "pending" | "suspended" | "inactive"
      exception_severity: "Low" | "Medium" | "High" | "Critical"
      exception_status: "Open" | "In Progress" | "Resolved"
      exception_type:
        | "Pickup Issue"
        | "Delivery Issue"
        | "Delay"
        | "Vehicle Issue"
        | "Driver Issue"
        | "Damaged Shipment"
        | "Missing Shipment"
        | "Weather"
        | "Documentation Issue"
        | "Other"
      freight_category:
        | "hazmat"
        | "medical"
        | "pharmaceutical"
        | "cold_chain"
        | "general"
      load_priority: "normal" | "priority" | "emergency"
      load_status:
        | "planning"
        | "pending_adjustment"
        | "available"
        | "booked"
        | "dispatched"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "invoiced"
        | "paid"
        | "rejected"
        | "cancelled"
      notification_type:
        | "load_created"
        | "carrier_assigned"
        | "load_dispatched"
        | "pickup_completed"
        | "in_transit"
        | "delivery_approaching"
        | "delivered"
        | "delayed"
        | "exception_raised"
        | "sla_warning"
        | "system"
      sla_status: "on_track" | "at_risk" | "met" | "breached"
      stop_status: "pending" | "arrived" | "departed" | "skipped"
      stop_type: "pickup" | "delivery"
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
      app_role: ["admin", "shipper", "carrier"],
      entity_status: ["active", "pending", "suspended", "inactive"],
      exception_severity: ["Low", "Medium", "High", "Critical"],
      exception_status: ["Open", "In Progress", "Resolved"],
      exception_type: [
        "Pickup Issue",
        "Delivery Issue",
        "Delay",
        "Vehicle Issue",
        "Driver Issue",
        "Damaged Shipment",
        "Missing Shipment",
        "Weather",
        "Documentation Issue",
        "Other",
      ],
      freight_category: [
        "hazmat",
        "medical",
        "pharmaceutical",
        "cold_chain",
        "general",
      ],
      load_priority: ["normal", "priority", "emergency"],
      load_status: [
        "planning",
        "pending_adjustment",
        "available",
        "booked",
        "dispatched",
        "picked_up",
        "in_transit",
        "delivered",
        "invoiced",
        "paid",
        "rejected",
        "cancelled",
      ],
      notification_type: [
        "load_created",
        "carrier_assigned",
        "load_dispatched",
        "pickup_completed",
        "in_transit",
        "delivery_approaching",
        "delivered",
        "delayed",
        "exception_raised",
        "sla_warning",
        "system",
      ],
      sla_status: ["on_track", "at_risk", "met", "breached"],
      stop_status: ["pending", "arrived", "departed", "skipped"],
      stop_type: ["pickup", "delivery"],
    },
  },
} as const
