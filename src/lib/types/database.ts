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
      access_logs: {
        Row: {
          access_point_id: string
          contact_id: string | null
          created_at: string
          direction: string | null
          id: string
          logged_at: string
          logged_by: string | null
          method: string | null
          notes: string | null
          photo_url: string | null
          tenant_id: string
          vehicle_registration_id: string | null
          visitor_name: string | null
          visitor_pass_id: string | null
        }
        Insert: {
          access_point_id: string
          contact_id?: string | null
          created_at?: string
          direction?: string | null
          id?: string
          logged_at?: string
          logged_by?: string | null
          method?: string | null
          notes?: string | null
          photo_url?: string | null
          tenant_id: string
          vehicle_registration_id?: string | null
          visitor_name?: string | null
          visitor_pass_id?: string | null
        }
        Update: {
          access_point_id?: string
          contact_id?: string | null
          created_at?: string
          direction?: string | null
          id?: string
          logged_at?: string
          logged_by?: string | null
          method?: string | null
          notes?: string | null
          photo_url?: string | null
          tenant_id?: string
          vehicle_registration_id?: string | null
          visitor_name?: string | null
          visitor_pass_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_access_point_id_fkey"
            columns: ["access_point_id"]
            isOneToOne: false
            referencedRelation: "access_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_vehicle_registration_id_fkey"
            columns: ["vehicle_registration_id"]
            isOneToOne: false
            referencedRelation: "vehicle_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_visitor_pass_id_fkey"
            columns: ["visitor_pass_id"]
            isOneToOne: false
            referencedRelation: "visitor_passes"
            referencedColumns: ["id"]
          },
        ]
      }
      access_points: {
        Row: {
          access_code: string | null
          association_id: string
          created_at: string
          gate_system_id: string | null
          gate_system_type: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          notes: string | null
          operating_hours: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          access_code?: string | null
          association_id: string
          created_at?: string
          gate_system_id?: string | null
          gate_system_type?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          notes?: string | null
          operating_hours?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          access_code?: string | null
          association_id?: string
          created_at?: string
          gate_system_id?: string | null
          gate_system_type?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          notes?: string | null
          operating_hours?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_points_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_points_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_number: string
          account_type: string
          association_id: string
          balance: number
          created_at: string
          fund_id: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          sub_type: string | null
          tenant_id: string
        }
        Insert: {
          account_number: string
          account_type: string
          association_id: string
          balance?: number
          created_at?: string
          fund_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          sub_type?: string | null
          tenant_id: string
        }
        Update: {
          account_number?: string
          account_type?: string
          association_id?: string
          balance?: number
          created_at?: string
          fund_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          sub_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          category: string
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          points: number
          rarity: string
          tenant_id: string
        }
        Insert: {
          category: string
          created_at?: string
          criteria?: Json
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          points?: number
          rarity?: string
          tenant_id: string
        }
        Update: {
          category?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          rarity?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      action_items: {
        Row: {
          assigned_to: string | null
          association_id: string
          category: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json
          parent_id: string | null
          priority: string
          source_id: string | null
          source_type: string | null
          status: string
          tags: string[] | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          association_id: string
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          parent_id?: string | null
          priority?: string
          source_id?: string | null
          source_type?: string | null
          status?: string
          tags?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          association_id?: string
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          parent_id?: string | null
          priority?: string
          source_id?: string | null
          source_type?: string | null
          status?: string
          tags?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          advance_booking_days: number | null
          amenity_id: string | null
          association_id: string
          cancellation_hours: number | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          end_date: string | null
          end_time: string | null
          fee_amount: number | null
          fee_type: string | null
          guest_fee_amount: number | null
          guests_allowed: boolean | null
          id: string
          instructor_bio: string | null
          instructor_name: string | null
          instructor_photo_url: string | null
          is_featured: boolean | null
          is_recurring: boolean | null
          level: string | null
          location: string | null
          max_age: number | null
          max_capacity: number | null
          max_guests_per_registration: number | null
          metadata: Json | null
          min_age: number | null
          min_participants: number | null
          name: string
          photo_url: string | null
          recurrence_rule: string | null
          registration_closes_at: string | null
          registration_opens_at: string | null
          registration_required: boolean | null
          residents_only: boolean | null
          start_date: string | null
          start_time: string | null
          status: string
          tenant_id: string
          updated_at: string | null
          waitlist_enabled: boolean | null
        }
        Insert: {
          advance_booking_days?: number | null
          amenity_id?: string | null
          association_id: string
          cancellation_hours?: number | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          end_time?: string | null
          fee_amount?: number | null
          fee_type?: string | null
          guest_fee_amount?: number | null
          guests_allowed?: boolean | null
          id?: string
          instructor_bio?: string | null
          instructor_name?: string | null
          instructor_photo_url?: string | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          level?: string | null
          location?: string | null
          max_age?: number | null
          max_capacity?: number | null
          max_guests_per_registration?: number | null
          metadata?: Json | null
          min_age?: number | null
          min_participants?: number | null
          name: string
          photo_url?: string | null
          recurrence_rule?: string | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          registration_required?: boolean | null
          residents_only?: boolean | null
          start_date?: string | null
          start_time?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
          waitlist_enabled?: boolean | null
        }
        Update: {
          advance_booking_days?: number | null
          amenity_id?: string | null
          association_id?: string
          cancellation_hours?: number | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          end_time?: string | null
          fee_amount?: number | null
          fee_type?: string | null
          guest_fee_amount?: number | null
          guests_allowed?: boolean | null
          id?: string
          instructor_bio?: string | null
          instructor_name?: string | null
          instructor_photo_url?: string | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          level?: string | null
          location?: string | null
          max_age?: number | null
          max_capacity?: number | null
          max_guests_per_registration?: number | null
          metadata?: Json | null
          min_age?: number | null
          min_participants?: number | null
          name?: string
          photo_url?: string | null
          recurrence_rule?: string | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          registration_required?: boolean | null
          residents_only?: boolean | null
          start_date?: string | null
          start_time?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
          waitlist_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "activity_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_attendance: {
        Row: {
          attended: boolean
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          registration_id: string
          session_id: string
          tenant_id: string
        }
        Insert: {
          attended: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          registration_id: string
          session_id: string
          tenant_id: string
        }
        Update: {
          attended?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          registration_id?: string
          session_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_attendance_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendance_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "activity_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "activity_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          tenant_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          tenant_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_registrations: {
        Row: {
          activity_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          charge_id: string | null
          contact_id: string | null
          created_at: string | null
          fee_charged: number | null
          guest_count: number | null
          guest_names: string[] | null
          id: string
          metadata: Json | null
          notes: string | null
          participant_age: number | null
          participant_name: string
          payment_status: string | null
          property_id: string | null
          refund_issued: boolean | null
          registered_by: string | null
          session_id: string | null
          status: string
          stripe_payment_intent: string | null
          tenant_id: string
          updated_at: string | null
          waitlist_position: number | null
        }
        Insert: {
          activity_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          charge_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          fee_charged?: number | null
          guest_count?: number | null
          guest_names?: string[] | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          participant_age?: number | null
          participant_name: string
          payment_status?: string | null
          property_id?: string | null
          refund_issued?: boolean | null
          registered_by?: string | null
          session_id?: string | null
          status?: string
          stripe_payment_intent?: string | null
          tenant_id: string
          updated_at?: string | null
          waitlist_position?: number | null
        }
        Update: {
          activity_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          charge_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          fee_charged?: number | null
          guest_count?: number | null
          guest_names?: string[] | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          participant_age?: number | null
          participant_name?: string
          payment_status?: string | null
          property_id?: string | null
          refund_issued?: boolean | null
          registered_by?: string | null
          session_id?: string | null
          status?: string
          stripe_payment_intent?: string | null
          tenant_id?: string
          updated_at?: string | null
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_registrations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_registrations_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_registrations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_registrations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_registrations_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "activity_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_registrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_sessions: {
        Row: {
          activity_id: string
          attended_count: number | null
          cancellation_reason: string | null
          created_at: string | null
          end_time: string
          id: string
          instructor_name: string | null
          location: string | null
          max_capacity: number | null
          notes: string | null
          registered_count: number | null
          session_date: string
          start_time: string
          status: string
          tenant_id: string
          waitlist_count: number | null
        }
        Insert: {
          activity_id: string
          attended_count?: number | null
          cancellation_reason?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          instructor_name?: string | null
          location?: string | null
          max_capacity?: number | null
          notes?: string | null
          registered_count?: number | null
          session_date: string
          start_time: string
          status?: string
          tenant_id: string
          waitlist_count?: number | null
        }
        Update: {
          activity_id?: string
          attended_count?: number | null
          cancellation_reason?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          instructor_name?: string | null
          location?: string | null
          max_capacity?: number | null
          notes?: string | null
          registered_count?: number | null
          session_date?: string
          start_time?: string
          status?: string
          tenant_id?: string
          waitlist_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      adjusting_entry_templates: {
        Row: {
          association_id: string
          created_at: string
          description: string | null
          entry_type: string
          frequency: string
          id: string
          is_active: boolean
          last_generated_period: string | null
          lines: Json
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          association_id: string
          created_at?: string
          description?: string | null
          entry_type?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_generated_period?: string | null
          lines?: Json
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          description?: string | null
          entry_type?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_generated_period?: string | null
          lines?: Json
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adjusting_entry_templates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjusting_entry_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tasks: {
        Row: {
          approval_request_id: string | null
          association_id: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          input: Json
          model: string | null
          output: Json
          status: string
          task_type: string
          tenant_id: string
          tokens_used: number | null
        }
        Insert: {
          approval_request_id?: string | null
          association_id?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          model?: string | null
          output?: Json
          status?: string
          task_type: string
          tenant_id: string
          tokens_used?: number | null
        }
        Update: {
          approval_request_id?: string | null
          association_id?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          model?: string | null
          output?: Json
          status?: string
          task_type?: string
          tenant_id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_tasks_approval_request_id_fkey"
            columns: ["approval_request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tasks_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      airport_rules: {
        Row: {
          association_id: string
          ctaf_frequency: string | null
          emergency_contact: string | null
          id: string
          max_noise_db: number | null
          minimum_insurance_coverage: number | null
          noise_curfew_end: string | null
          noise_curfew_start: string | null
          published_vfr_procedures: string | null
          required_certificates: string[] | null
          runway_identifier: string | null
          speed_limit_mph: number | null
          tenant_id: string
          unicom_frequency: string | null
          updated_at: string
          yield_rules: string | null
        }
        Insert: {
          association_id: string
          ctaf_frequency?: string | null
          emergency_contact?: string | null
          id?: string
          max_noise_db?: number | null
          minimum_insurance_coverage?: number | null
          noise_curfew_end?: string | null
          noise_curfew_start?: string | null
          published_vfr_procedures?: string | null
          required_certificates?: string[] | null
          runway_identifier?: string | null
          speed_limit_mph?: number | null
          tenant_id: string
          unicom_frequency?: string | null
          updated_at?: string
          yield_rules?: string | null
        }
        Update: {
          association_id?: string
          ctaf_frequency?: string | null
          emergency_contact?: string | null
          id?: string
          max_noise_db?: number | null
          minimum_insurance_coverage?: number | null
          noise_curfew_end?: string | null
          noise_curfew_start?: string | null
          published_vfr_procedures?: string | null
          required_certificates?: string[] | null
          runway_identifier?: string | null
          speed_limit_mph?: number | null
          tenant_id?: string
          unicom_frequency?: string | null
          updated_at?: string
          yield_rules?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "airport_rules_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "airport_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      amenities: {
        Row: {
          advance_days: number
          association_id: string
          capacity: number | null
          created_at: string
          deposit_amount: number | null
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          max_duration_hours: number
          name: string
          operating_hours: Json
          photos: Json
          rental_fee: number | null
          requires_deposit: boolean
          rules: string | null
          tenant_id: string
        }
        Insert: {
          advance_days?: number
          association_id: string
          capacity?: number | null
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          max_duration_hours?: number
          name: string
          operating_hours?: Json
          photos?: Json
          rental_fee?: number | null
          requires_deposit?: boolean
          rules?: string | null
          tenant_id: string
        }
        Update: {
          advance_days?: number
          association_id?: string
          capacity?: number | null
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          max_duration_hours?: number
          name?: string
          operating_hours?: Json
          photos?: Json
          rental_fee?: number | null
          requires_deposit?: boolean
          rules?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenities_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_bookings: {
        Row: {
          amenity_id: string | null
          association_id: string
          contact_id: string | null
          created_at: string | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          end_time: string
          guest_count: number | null
          id: string
          notes: string | null
          property_id: string | null
          start_time: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amenity_id?: string | null
          association_id: string
          contact_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          end_time: string
          guest_count?: number | null
          id?: string
          notes?: string | null
          property_id?: string | null
          start_time: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amenity_id?: string | null
          association_id?: string
          contact_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          end_time?: string
          guest_count?: number | null
          id?: string
          notes?: string | null
          property_id?: string | null
          start_time?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amenity_bookings_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_reservations: {
        Row: {
          amenity_id: string
          association_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          deposit_paid: boolean
          end_time: string
          fee_paid: boolean
          guest_count: number | null
          id: string
          notes: string | null
          purpose: string | null
          reserved_by: string
          start_time: string
          status: string
          tenant_id: string
        }
        Insert: {
          amenity_id: string
          association_id: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          deposit_paid?: boolean
          end_time: string
          fee_paid?: boolean
          guest_count?: number | null
          id?: string
          notes?: string | null
          purpose?: string | null
          reserved_by: string
          start_time: string
          status?: string
          tenant_id: string
        }
        Update: {
          amenity_id?: string
          association_id?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          deposit_paid?: boolean
          end_time?: string
          fee_paid?: boolean
          guest_count?: number | null
          id?: string
          notes?: string | null
          purpose?: string | null
          reserved_by?: string
          start_time?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenity_reservations_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_reservations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ap_approver_roles: {
        Row: {
          association_id: string | null
          created_at: string | null
          id: string
          role: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          association_id?: string | null
          created_at?: string | null
          id?: string
          role: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          association_id?: string | null
          created_at?: string | null
          id?: string
          role?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ap_approver_roles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_approver_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_approver_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ap_bill_lines: {
        Row: {
          account_id: string
          amount: number
          bill_id: string
          created_at: string
          description: string | null
          id: string
          property_id: string | null
          quantity: number
          tenant_id: string
          unit_price: number
        }
        Insert: {
          account_id: string
          amount?: number
          bill_id: string
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string | null
          quantity?: number
          tenant_id: string
          unit_price?: number
        }
        Update: {
          account_id?: string
          amount?: number
          bill_id?: string
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string | null
          quantity?: number
          tenant_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "ap_bill_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bill_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "ap_bill_lines_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "ap_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bill_lines_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bill_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ap_bills: {
        Row: {
          amount_paid: number
          approval_chain: Json
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          association_id: string
          avidexchange_invoice_id: string | null
          avidexchange_status: string | null
          balance_due: number | null
          bill_date: string
          bill_number: string | null
          bill_type: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          invoice_image_url: string | null
          is_1099: boolean
          journal_entry_id: string | null
          memo: string | null
          status: string
          subtotal: number
          tax_amount: number
          tenant_id: string
          total_amount: number
          updated_at: string
          vendor_id: string
          work_order_id: string | null
        }
        Insert: {
          amount_paid?: number
          approval_chain?: Json
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          association_id: string
          avidexchange_invoice_id?: string | null
          avidexchange_status?: string | null
          balance_due?: number | null
          bill_date: string
          bill_number?: string | null
          bill_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          invoice_image_url?: string | null
          is_1099?: boolean
          journal_entry_id?: string | null
          memo?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id: string
          total_amount?: number
          updated_at?: string
          vendor_id: string
          work_order_id?: string | null
        }
        Update: {
          amount_paid?: number
          approval_chain?: Json
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          association_id?: string
          avidexchange_invoice_id?: string | null
          avidexchange_status?: string | null
          balance_due?: number | null
          bill_date?: string
          bill_number?: string | null
          bill_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          invoice_image_url?: string | null
          is_1099?: boolean
          journal_entry_id?: string | null
          memo?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
          updated_at?: string
          vendor_id?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ap_bills_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bills_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_bills_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ap_payment_applications: {
        Row: {
          amount: number
          ap_payment_id: string
          bill_id: string
          created_at: string
          id: string
          tenant_id: string
        }
        Insert: {
          amount: number
          ap_payment_id: string
          bill_id: string
          created_at?: string
          id?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          ap_payment_id?: string
          bill_id?: string
          created_at?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ap_payment_applications_ap_payment_id_fkey"
            columns: ["ap_payment_id"]
            isOneToOne: false
            referencedRelation: "ap_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payment_applications_ap_payment_id_fkey"
            columns: ["ap_payment_id"]
            isOneToOne: false
            referencedRelation: "check_register"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "ap_payment_applications_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "ap_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payment_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ap_payments: {
        Row: {
          amount: number
          association_id: string
          avidexchange_payment_id: string | null
          bank_account_id: string
          batch_id: string | null
          check_number: string | null
          created_at: string
          created_by: string | null
          id: string
          journal_entry_id: string | null
          memo: string | null
          payment_date: string
          payment_method: string
          status: string
          tenant_id: string
          vendor_id: string
        }
        Insert: {
          amount: number
          association_id: string
          avidexchange_payment_id?: string | null
          bank_account_id: string
          batch_id?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          payment_date: string
          payment_method: string
          status?: string
          tenant_id: string
          vendor_id: string
        }
        Update: {
          amount?: number
          association_id?: string
          avidexchange_payment_id?: string | null
          bank_account_id?: string
          batch_id?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          payment_date?: string
          payment_method?: string
          status?: string
          tenant_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ap_payments_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payment_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          association_id: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          metadata: Json
          request_type: string
          requested_by: string
          resource_id: string | null
          resource_type: string
          status: string
          tenant_id: string
          title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          association_id?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          request_type: string
          requested_by: string
          resource_id?: string | null
          resource_type: string
          status?: string
          tenant_id: string
          title: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          association_id?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          request_type?: string
          requested_by?: string
          resource_id?: string | null
          resource_type?: string
          status?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_thresholds: {
        Row: {
          auto_approve_under: number
          created_at: string
          director_approval_under: number
          id: string
          manager_approval_under: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_approve_under?: number
          created_at?: string
          director_approval_under?: number
          id?: string
          manager_approval_under?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_approve_under?: number
          created_at?: string
          director_approval_under?: number
          id?: string
          manager_approval_under?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ar_aging_snapshots: {
        Row: {
          association_id: string
          charge_type: string
          created_at: string
          external_charge_id: string | null
          id: string
          month_01: number
          month_02: number
          month_03: number
          month_04: number
          month_05: number
          month_06: number
          month_07: number
          month_08: number
          month_09: number
          month_10: number
          month_11: number
          month_12: number
          snapshot_date: string
          source: string
          tenant_id: string
          total: number | null
        }
        Insert: {
          association_id: string
          charge_type: string
          created_at?: string
          external_charge_id?: string | null
          id?: string
          month_01?: number
          month_02?: number
          month_03?: number
          month_04?: number
          month_05?: number
          month_06?: number
          month_07?: number
          month_08?: number
          month_09?: number
          month_10?: number
          month_11?: number
          month_12?: number
          snapshot_date?: string
          source?: string
          tenant_id: string
          total?: number | null
        }
        Update: {
          association_id?: string
          charge_type?: string
          created_at?: string
          external_charge_id?: string | null
          id?: string
          month_01?: number
          month_02?: number
          month_03?: number
          month_04?: number
          month_05?: number
          month_06?: number
          month_07?: number
          month_08?: number
          month_09?: number
          month_10?: number
          month_11?: number
          month_12?: number
          snapshot_date?: string
          source?: string
          tenant_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ar_aging_snapshots_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_aging_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arc_committee_members: {
        Row: {
          active: boolean | null
          association_id: string | null
          id: string
          role: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          association_id?: string | null
          id?: string
          role?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          association_id?: string | null
          id?: string
          role?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arc_committee_members_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arc_committee_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arc_project_types: {
        Row: {
          active: boolean | null
          auto_approve_minor: boolean | null
          description: string | null
          id: string
          name: string
          required_documents: string[] | null
          requires_site_visit: boolean | null
          sort_order: number | null
          tenant_id: string
          typical_review_days: number | null
        }
        Insert: {
          active?: boolean | null
          auto_approve_minor?: boolean | null
          description?: string | null
          id?: string
          name: string
          required_documents?: string[] | null
          requires_site_visit?: boolean | null
          sort_order?: number | null
          tenant_id: string
          typical_review_days?: number | null
        }
        Update: {
          active?: boolean | null
          auto_approve_minor?: boolean | null
          description?: string | null
          id?: string
          name?: string
          required_documents?: string[] | null
          requires_site_visit?: boolean | null
          sort_order?: number | null
          tenant_id?: string
          typical_review_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "arc_project_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arc_request_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          request_id: string
          tenant_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          request_id: string
          tenant_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          request_id?: string
          tenant_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arc_request_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "arc_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arc_request_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arc_request_history: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
          request_id: string
          tenant_id: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          request_id: string
          tenant_id: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          request_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arc_request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "arc_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arc_request_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arc_requests: {
        Row: {
          actual_completion_date: string | null
          association_id: string
          conditions: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          number: number
          property_id: string
          proposed_completion_date: string | null
          proposed_start_date: string | null
          request_type: string
          status: string
          submitted_by: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          association_id: string
          conditions?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          number?: never
          property_id: string
          proposed_completion_date?: string | null
          proposed_start_date?: string | null
          request_type?: string
          status?: string
          submitted_by?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          association_id?: string
          conditions?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          number?: never
          property_id?: string
          proposed_completion_date?: string | null
          proposed_start_date?: string | null
          request_type?: string
          status?: string
          submitted_by?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "arc_requests_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arc_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arc_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arc_reviews: {
        Row: {
          comments: string | null
          conditions: string | null
          created_at: string
          id: string
          request_id: string
          reviewer_id: string
          tenant_id: string
          vote: string
        }
        Insert: {
          comments?: string | null
          conditions?: string | null
          created_at?: string
          id?: string
          request_id: string
          reviewer_id: string
          tenant_id: string
          vote: string
        }
        Update: {
          comments?: string | null
          conditions?: string | null
          created_at?: string
          id?: string
          request_id?: string
          reviewer_id?: string
          tenant_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "arc_reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "arc_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arc_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arc_submission_history: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          status_from: string | null
          status_to: string
          submission_id: string
          tenant_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status_from?: string | null
          status_to: string
          submission_id: string
          tenant_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status_from?: string | null
          status_to?: string
          submission_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arc_submission_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "arc_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arc_submission_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      arc_submissions: {
        Row: {
          approval_conditions: string | null
          assigned_at: string | null
          assigned_to: string | null
          association_id: string
          contractor_email: string | null
          contractor_insurance: boolean | null
          contractor_license: string | null
          contractor_name: string | null
          contractor_phone: string | null
          created_at: string | null
          decision_at: string | null
          denial_reason: string | null
          documents: Json | null
          estimated_cost: number | null
          expires_at: string | null
          id: string
          owner_signature: string | null
          owner_signed_at: string | null
          project_description: string
          project_end_date: string | null
          project_start_date: string | null
          project_type_id: string | null
          project_type_name: string
          property_id: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string | null
          submission_number: string
          submitted_at: string | null
          submitter_email: string
          submitter_id: string
          submitter_name: string
          submitter_phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          approval_conditions?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          association_id: string
          contractor_email?: string | null
          contractor_insurance?: boolean | null
          contractor_license?: string | null
          contractor_name?: string | null
          contractor_phone?: string | null
          created_at?: string | null
          decision_at?: string | null
          denial_reason?: string | null
          documents?: Json | null
          estimated_cost?: number | null
          expires_at?: string | null
          id?: string
          owner_signature?: string | null
          owner_signed_at?: string | null
          project_description: string
          project_end_date?: string | null
          project_start_date?: string | null
          project_type_id?: string | null
          project_type_name: string
          property_id?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string | null
          submission_number: string
          submitted_at?: string | null
          submitter_email: string
          submitter_id: string
          submitter_name: string
          submitter_phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          approval_conditions?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          association_id?: string
          contractor_email?: string | null
          contractor_insurance?: boolean | null
          contractor_license?: string | null
          contractor_name?: string | null
          contractor_phone?: string | null
          created_at?: string | null
          decision_at?: string | null
          denial_reason?: string | null
          documents?: Json | null
          estimated_cost?: number | null
          expires_at?: string | null
          id?: string
          owner_signature?: string | null
          owner_signed_at?: string | null
          project_description?: string
          project_end_date?: string | null
          project_start_date?: string | null
          project_type_id?: string | null
          project_type_name?: string
          property_id?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string | null
          submission_number?: string
          submitted_at?: string | null
          submitter_email?: string
          submitter_id?: string
          submitter_name?: string
          submitter_phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arc_submissions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arc_submissions_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "arc_project_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arc_submissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arc_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_posting_config: {
        Row: {
          association_id: string
          auto_post: boolean
          billing_day: number
          created_at: string
          due_day: number
          gl_account_id: string | null
          id: string
          late_after_days: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          association_id: string
          auto_post?: boolean
          billing_day?: number
          created_at?: string
          due_day?: number
          gl_account_id?: string | null
          id?: string
          late_after_days?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          auto_post?: boolean
          billing_day?: number
          created_at?: string
          due_day?: number
          gl_account_id?: string | null
          id?: string
          late_after_days?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_posting_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: true
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_posting_config_gl_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_posting_config_gl_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "assessment_posting_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_posting_runs: {
        Row: {
          association_id: string
          id: string
          notes: string | null
          period_month: number
          period_year: number
          posted_at: string
          posted_by: string | null
          status: string
          tenant_id: string
          total_amount: number
          units_posted: number
        }
        Insert: {
          association_id: string
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          posted_at?: string
          posted_by?: string | null
          status?: string
          tenant_id: string
          total_amount?: number
          units_posted?: number
        }
        Update: {
          association_id?: string
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          posted_at?: string
          posted_by?: string | null
          status?: string
          tenant_id?: string
          total_amount?: number
          units_posted?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_posting_runs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_posting_runs_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_posting_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_schedule_properties: {
        Row: {
          amount_override: number | null
          assessment_schedule_id: string
          created_at: string
          id: string
          property_id: string
          tenant_id: string
        }
        Insert: {
          amount_override?: number | null
          assessment_schedule_id: string
          created_at?: string
          id?: string
          property_id: string
          tenant_id: string
        }
        Update: {
          amount_override?: number | null
          assessment_schedule_id?: string
          created_at?: string
          id?: string
          property_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_schedule_properties_assessment_schedule_id_fkey"
            columns: ["assessment_schedule_id"]
            isOneToOne: false
            referencedRelation: "assessment_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_schedule_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_schedule_properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_schedules: {
        Row: {
          amount: number
          applies_to: string
          association_id: string
          created_at: string
          day_of_month: number | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          name: string
          receivable_account_id: string
          revenue_account_id: string
          schedule_type: string
          start_date: string
          tenant_id: string
        }
        Insert: {
          amount: number
          applies_to?: string
          association_id: string
          created_at?: string
          day_of_month?: number | null
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          name: string
          receivable_account_id: string
          revenue_account_id: string
          schedule_type: string
          start_date: string
          tenant_id: string
        }
        Update: {
          amount?: number
          applies_to?: string
          association_id?: string
          created_at?: string
          day_of_month?: number | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string
          receivable_account_id?: string
          revenue_account_id?: string
          schedule_type?: string
          start_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_schedules_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_schedules_receivable_account_id_fkey"
            columns: ["receivable_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_schedules_receivable_account_id_fkey"
            columns: ["receivable_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "assessment_schedules_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_schedules_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "assessment_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          association_id: string
          category: string
          condition: string | null
          created_at: string
          expected_life_years: number | null
          id: string
          install_date: string | null
          location: string | null
          manufacturer: string | null
          model_number: string | null
          name: string
          notes: string | null
          photos: Json
          replacement_cost: number | null
          serial_number: string | null
          status: string
          tenant_id: string
          warranty_expires: string | null
        }
        Insert: {
          association_id: string
          category: string
          condition?: string | null
          created_at?: string
          expected_life_years?: number | null
          id?: string
          install_date?: string | null
          location?: string | null
          manufacturer?: string | null
          model_number?: string | null
          name: string
          notes?: string | null
          photos?: Json
          replacement_cost?: number | null
          serial_number?: string | null
          status?: string
          tenant_id: string
          warranty_expires?: string | null
        }
        Update: {
          association_id?: string
          category?: string
          condition?: string | null
          created_at?: string
          expected_life_years?: number | null
          id?: string
          install_date?: string | null
          location?: string | null
          manufacturer?: string | null
          model_number?: string | null
          name?: string
          notes?: string | null
          photos?: Json
          replacement_cost?: number | null
          serial_number?: string | null
          status?: string
          tenant_id?: string
          warranty_expires?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      association_assignments: {
        Row: {
          association_id: string
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_assignments_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      association_managers: {
        Row: {
          association_id: string
          created_at: string
          id: string
          is_primary: boolean
          manager_name: string
          role: string
          source: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          manager_name: string
          role?: string
          source?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          manager_name?: string
          role?: string
          source?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_managers_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_managers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      association_service_tiers: {
        Row: {
          association_id: string
          billing_frequency: string | null
          contracted_units: number | null
          created_at: string | null
          effective_date: string
          expiry_date: string | null
          feature_overrides: Json | null
          id: string
          monthly_rate: number | null
          notes: string | null
          status: string | null
          tenant_id: string
          tier_definition_id: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          association_id: string
          billing_frequency?: string | null
          contracted_units?: number | null
          created_at?: string | null
          effective_date: string
          expiry_date?: string | null
          feature_overrides?: Json | null
          id?: string
          monthly_rate?: number | null
          notes?: string | null
          status?: string | null
          tenant_id: string
          tier_definition_id: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          billing_frequency?: string | null
          contracted_units?: number | null
          created_at?: string | null
          effective_date?: string
          expiry_date?: string | null
          feature_overrides?: Json | null
          id?: string
          monthly_rate?: number | null
          notes?: string | null
          status?: string | null
          tenant_id?: string
          tier_definition_id?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "association_service_tiers_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: true
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_service_tiers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_service_tiers_tier_definition_id_fkey"
            columns: ["tier_definition_id"]
            isOneToOne: false
            referencedRelation: "service_tier_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      association_settings: {
        Row: {
          association_id: string
          id: string
          setting_key: string
          settings_data: Json
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          association_id: string
          id?: string
          setting_key: string
          settings_data?: Json
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          association_id?: string
          id?: string
          setting_key?: string
          settings_data?: Json
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "association_settings_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          airport_identifier: string | null
          boundary_geojson: Json | null
          city: string | null
          community_subtype: string | null
          country: string
          county: string | null
          county_id: string | null
          created_at: string
          external_code: string | null
          external_id: string | null
          external_source: string | null
          fha_approval_expiry: string | null
          fha_approved: boolean
          fiscal_year_start_month: number | null
          id: string
          is_age_restricted: boolean
          latitude: number | null
          longitude: number | null
          map_zoom_level: number | null
          min_resident_age: number | null
          name: string
          nickname: string | null
          runway_length_ft: number | null
          runway_surface: string | null
          settings: Json
          state: string | null
          status: string
          tenant_id: string
          total_lots: number | null
          type: string
          unit_count: number | null
          updated_at: string
          va_approved: boolean
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          airport_identifier?: string | null
          boundary_geojson?: Json | null
          city?: string | null
          community_subtype?: string | null
          country?: string
          county?: string | null
          county_id?: string | null
          created_at?: string
          external_code?: string | null
          external_id?: string | null
          external_source?: string | null
          fha_approval_expiry?: string | null
          fha_approved?: boolean
          fiscal_year_start_month?: number | null
          id?: string
          is_age_restricted?: boolean
          latitude?: number | null
          longitude?: number | null
          map_zoom_level?: number | null
          min_resident_age?: number | null
          name: string
          nickname?: string | null
          runway_length_ft?: number | null
          runway_surface?: string | null
          settings?: Json
          state?: string | null
          status?: string
          tenant_id: string
          total_lots?: number | null
          type: string
          unit_count?: number | null
          updated_at?: string
          va_approved?: boolean
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          airport_identifier?: string | null
          boundary_geojson?: Json | null
          city?: string | null
          community_subtype?: string | null
          country?: string
          county?: string | null
          county_id?: string | null
          created_at?: string
          external_code?: string | null
          external_id?: string | null
          external_source?: string | null
          fha_approval_expiry?: string | null
          fha_approved?: boolean
          fiscal_year_start_month?: number | null
          id?: string
          is_age_restricted?: boolean
          latitude?: number | null
          longitude?: number | null
          map_zoom_level?: number | null
          min_resident_age?: number | null
          name?: string
          nickname?: string | null
          runway_length_ft?: number | null
          runway_surface?: string | null
          settings?: Json
          state?: string | null
          status?: string
          tenant_id?: string
          total_lots?: number | null
          type?: string
          unit_count?: number | null
          updated_at?: string
          va_approved?: boolean
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "associations_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          affected_records: Json | null
          association_id: string
          audit_run_id: string
          category: string
          created_at: string
          description: string
          id: string
          recommended_action: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tenant_id: string
          title: string
        }
        Insert: {
          affected_records?: Json | null
          association_id: string
          audit_run_id: string
          category: string
          created_at?: string
          description: string
          id?: string
          recommended_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string
          tenant_id: string
          title: string
        }
        Update: {
          affected_records?: Json | null
          association_id?: string
          audit_run_id?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          recommended_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_run_id_fkey"
            columns: ["audit_run_id"]
            isOneToOne: false
            referencedRelation: "audit_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          association_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          resource_id: string | null
          resource_type: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          association_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_type: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          association_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_runs: {
        Row: {
          association_id: string
          completed_at: string | null
          created_by: string | null
          critical_count: number | null
          findings_count: number | null
          id: string
          run_type: string
          started_at: string
          status: string
          summary: Json | null
          tenant_id: string
        }
        Insert: {
          association_id: string
          completed_at?: string | null
          created_by?: string | null
          critical_count?: number | null
          findings_count?: number | null
          id?: string
          run_type: string
          started_at?: string
          status?: string
          summary?: Json | null
          tenant_id: string
        }
        Update: {
          association_id?: string
          completed_at?: string | null
          created_by?: string | null
          critical_count?: number | null
          findings_count?: number | null
          id?: string
          run_type?: string
          started_at?: string
          status?: string
          summary?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_runs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_schedules: {
        Row: {
          created_at: string
          description: string | null
          endpoint: string
          id: string
          is_active: boolean
          last_run_at: string | null
          last_run_result: Json | null
          last_run_status: string | null
          name: string
          schedule_day: number | null
          schedule_hour: number
          schedule_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_result?: Json | null
          last_run_status?: string | null
          name: string
          schedule_day?: number | null
          schedule_hour?: number
          schedule_type?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_result?: Json | null
          last_run_status?: string | null
          name?: string
          schedule_day?: number | null
          schedule_hour?: number
          schedule_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      autopay_enrollments: {
        Row: {
          association_id: string
          contact_id: string
          created_at: string
          day_of_month: number | null
          id: string
          is_active: boolean
          max_amount: number | null
          payment_method_last4: string | null
          payment_method_type: string
          property_id: string
          stripe_customer_id: string
          stripe_payment_method_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          association_id: string
          contact_id: string
          created_at?: string
          day_of_month?: number | null
          id?: string
          is_active?: boolean
          max_amount?: number | null
          payment_method_last4?: string | null
          payment_method_type: string
          property_id: string
          stripe_customer_id: string
          stripe_payment_method_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          contact_id?: string
          created_at?: string
          day_of_month?: number | null
          id?: string
          is_active?: boolean
          max_amount?: number | null
          payment_method_last4?: string | null
          payment_method_type?: string
          property_id?: string
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "autopay_enrollments_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autopay_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autopay_enrollments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autopay_enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bai2_imports: {
        Row: {
          id: string
          tenant_id: string
          file_name: string
          import_date: string
          as_of_date: string | null
          account_count: number
          transaction_count: number
          status: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          file_name: string
          import_date?: string
          as_of_date?: string | null
          account_count?: number
          transaction_count?: number
          status?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          file_name?: string
          import_date?: string
          as_of_date?: string | null
          account_count?: number
          transaction_count?: number
          status?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bai2_imports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bai2_imports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bai2_transactions: {
        Row: {
          id: string
          import_id: string
          tenant_id: string
          bank_account_number: string
          type_code: number
          amount: number
          bank_reference: string | null
          customer_reference: string | null
          text_description: string | null
          funds_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          import_id: string
          tenant_id: string
          bank_account_number: string
          type_code: number
          amount: number
          bank_reference?: string | null
          customer_reference?: string | null
          text_description?: string | null
          funds_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          import_id?: string
          tenant_id?: string
          bank_account_number?: string
          type_code?: number
          amount?: number
          bank_reference?: string | null
          customer_reference?: string | null
          text_description?: string | null
          funds_type?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bai2_transactions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bai2_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bai2_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ballot_audit_log: {
        Row: {
          ballot_id: string
          details: Json | null
          event_at: string | null
          event_by: string | null
          event_type: string
          id: string
          ip_address: string | null
          tenant_id: string
        }
        Insert: {
          ballot_id: string
          details?: Json | null
          event_at?: string | null
          event_by?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          tenant_id: string
        }
        Update: {
          ballot_id?: string
          details?: Json | null
          event_at?: string | null
          event_by?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_audit_log_ballot_id_fkey"
            columns: ["ballot_id"]
            isOneToOne: false
            referencedRelation: "ballots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_audit_log_event_by_fkey"
            columns: ["event_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ballot_candidates: {
        Row: {
          ballot_question_id: string
          bio: string | null
          candidate_name: string
          contact_id: string | null
          created_at: string | null
          elected: boolean | null
          id: string
          photo_url: string | null
          property_address: string | null
          sort_order: number | null
          tenant_id: string
          votes_received: number | null
        }
        Insert: {
          ballot_question_id: string
          bio?: string | null
          candidate_name: string
          contact_id?: string | null
          created_at?: string | null
          elected?: boolean | null
          id?: string
          photo_url?: string | null
          property_address?: string | null
          sort_order?: number | null
          tenant_id: string
          votes_received?: number | null
        }
        Update: {
          ballot_question_id?: string
          bio?: string | null
          candidate_name?: string
          contact_id?: string | null
          created_at?: string | null
          elected?: boolean | null
          id?: string
          photo_url?: string | null
          property_address?: string | null
          sort_order?: number | null
          tenant_id?: string
          votes_received?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ballot_candidates_ballot_question_id_fkey"
            columns: ["ballot_question_id"]
            isOneToOne: false
            referencedRelation: "ballot_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_candidates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_candidates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ballot_eligible_voters: {
        Row: {
          ballot_id: string
          contact_id: string
          email_address: string | null
          has_electronic_consent: boolean | null
          has_voted: boolean | null
          id: string
          phone_number: string | null
          property_id: string | null
          proxy_document_url: string | null
          proxy_holder_name: string | null
          tenant_id: string
          token_expires_at: string | null
          token_issued_at: string | null
          voted_at: string | null
          voted_method: string | null
          votes_entitled: number | null
          voting_token: string | null
          voting_unit: string | null
        }
        Insert: {
          ballot_id: string
          contact_id: string
          email_address?: string | null
          has_electronic_consent?: boolean | null
          has_voted?: boolean | null
          id?: string
          phone_number?: string | null
          property_id?: string | null
          proxy_document_url?: string | null
          proxy_holder_name?: string | null
          tenant_id: string
          token_expires_at?: string | null
          token_issued_at?: string | null
          voted_at?: string | null
          voted_method?: string | null
          votes_entitled?: number | null
          voting_token?: string | null
          voting_unit?: string | null
        }
        Update: {
          ballot_id?: string
          contact_id?: string
          email_address?: string | null
          has_electronic_consent?: boolean | null
          has_voted?: boolean | null
          id?: string
          phone_number?: string | null
          property_id?: string | null
          proxy_document_url?: string | null
          proxy_holder_name?: string | null
          tenant_id?: string
          token_expires_at?: string | null
          token_issued_at?: string | null
          voted_at?: string | null
          voted_method?: string | null
          votes_entitled?: number | null
          voting_token?: string | null
          voting_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ballot_eligible_voters_ballot_id_fkey"
            columns: ["ballot_id"]
            isOneToOne: false
            referencedRelation: "ballots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_eligible_voters_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_eligible_voters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_eligible_voters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ballot_items: {
        Row: {
          created_at: string
          description: string | null
          election_id: string
          id: string
          item_type: string
          options: Json
          position: string | null
          position_count: number | null
          sort_order: number | null
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          election_id: string
          id?: string
          item_type: string
          options?: Json
          position?: string | null
          position_count?: number | null
          sort_order?: number | null
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          election_id?: string
          id?: string
          item_type?: string
          options?: Json
          position?: string | null
          position_count?: number | null
          sort_order?: number | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_items_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ballot_questions: {
        Row: {
          abstain_votes: number | null
          ballot_id: string
          description: string | null
          display_results: boolean | null
          id: string
          no_votes: number | null
          question_number: number
          question_type: string
          required_approval_percentage: number | null
          seats_available: number | null
          sort_order: number | null
          tenant_id: string
          term_years: number | null
          title: string
          total_votes: number | null
          yes_votes: number | null
        }
        Insert: {
          abstain_votes?: number | null
          ballot_id: string
          description?: string | null
          display_results?: boolean | null
          id?: string
          no_votes?: number | null
          question_number: number
          question_type: string
          required_approval_percentage?: number | null
          seats_available?: number | null
          sort_order?: number | null
          tenant_id: string
          term_years?: number | null
          title: string
          total_votes?: number | null
          yes_votes?: number | null
        }
        Update: {
          abstain_votes?: number | null
          ballot_id?: string
          description?: string | null
          display_results?: boolean | null
          id?: string
          no_votes?: number | null
          question_number?: number
          question_type?: string
          required_approval_percentage?: number | null
          seats_available?: number | null
          sort_order?: number | null
          tenant_id?: string
          term_years?: number | null
          title?: string
          total_votes?: number | null
          yes_votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ballot_questions_ballot_id_fkey"
            columns: ["ballot_id"]
            isOneToOne: false
            referencedRelation: "ballots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_questions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ballots: {
        Row: {
          association_id: string
          ballot_type: string
          certified_by: string | null
          challenge_deadline: string | null
          challenge_filed: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          inspector_appointed_date: string | null
          inspector_email: string | null
          inspector_name: string | null
          is_secret_ballot: boolean
          meeting_id: string | null
          metadata: Json | null
          notes: string | null
          notice_sent_date: string | null
          quorum_met: boolean | null
          quorum_percentage: number | null
          results_certified_at: string | null
          status: string
          tenant_id: string
          title: string
          total_eligible_voters: number | null
          updated_at: string | null
          voting_closes_at: string
          voting_opens_at: string
        }
        Insert: {
          association_id: string
          ballot_type: string
          certified_by?: string | null
          challenge_deadline?: string | null
          challenge_filed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          inspector_appointed_date?: string | null
          inspector_email?: string | null
          inspector_name?: string | null
          is_secret_ballot?: boolean
          meeting_id?: string | null
          metadata?: Json | null
          notes?: string | null
          notice_sent_date?: string | null
          quorum_met?: boolean | null
          quorum_percentage?: number | null
          results_certified_at?: string | null
          status?: string
          tenant_id: string
          title: string
          total_eligible_voters?: number | null
          updated_at?: string | null
          voting_closes_at: string
          voting_opens_at: string
        }
        Update: {
          association_id?: string
          ballot_type?: string
          certified_by?: string | null
          challenge_deadline?: string | null
          challenge_filed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          inspector_appointed_date?: string | null
          inspector_email?: string | null
          inspector_name?: string | null
          is_secret_ballot?: boolean
          meeting_id?: string | null
          metadata?: Json | null
          notes?: string | null
          notice_sent_date?: string | null
          quorum_met?: boolean | null
          quorum_percentage?: number | null
          results_certified_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
          total_eligible_voters?: number | null
          updated_at?: string | null
          voting_closes_at?: string
          voting_opens_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballots_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballots_certified_by_fkey"
            columns: ["certified_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballots_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number_last4: string | null
          account_type: string
          association_id: string
          bank_name: string
          created_at: string
          current_balance: number
          gl_account_id: string
          id: string
          is_active: boolean
          last_reconciled_balance: number | null
          last_reconciled_date: string | null
          routing_number: string | null
          tenant_id: string
        }
        Insert: {
          account_name: string
          account_number_last4?: string | null
          account_type?: string
          association_id: string
          bank_name: string
          created_at?: string
          current_balance?: number
          gl_account_id: string
          id?: string
          is_active?: boolean
          last_reconciled_balance?: number | null
          last_reconciled_date?: string | null
          routing_number?: string | null
          tenant_id: string
        }
        Update: {
          account_name?: string
          account_number_last4?: string | null
          account_type?: string
          association_id?: string
          bank_name?: string
          created_at?: string
          current_balance?: number
          gl_account_id?: string
          id?: string
          is_active?: boolean
          last_reconciled_balance?: number | null
          last_reconciled_date?: string | null
          routing_number?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_gl_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_gl_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "bank_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliation_items: {
        Row: {
          bank_transaction_id: string | null
          created_at: string
          id: string
          is_cleared: boolean
          journal_line_id: string | null
          reconciliation_id: string
          tenant_id: string
        }
        Insert: {
          bank_transaction_id?: string | null
          created_at?: string
          id?: string
          is_cleared?: boolean
          journal_line_id?: string | null
          reconciliation_id: string
          tenant_id: string
        }
        Update: {
          bank_transaction_id?: string | null
          created_at?: string
          id?: string
          is_cleared?: boolean
          journal_line_id?: string | null
          reconciliation_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_items_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_items_journal_line_id_fkey"
            columns: ["journal_line_id"]
            isOneToOne: false
            referencedRelation: "journal_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_items_journal_line_id_fkey"
            columns: ["journal_line_id"]
            isOneToOne: false
            referencedRelation: "owner_ledger"
            referencedColumns: ["line_id"]
          },
          {
            foreignKeyName: "bank_reconciliation_items_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliations: {
        Row: {
          bank_account_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          difference: number | null
          gl_balance: number
          id: string
          reconciled_balance: number | null
          statement_balance: number
          statement_date: string
          status: string
          tenant_id: string
        }
        Insert: {
          bank_account_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          difference?: number | null
          gl_balance: number
          id?: string
          reconciled_balance?: number | null
          statement_balance: number
          statement_date: string
          status?: string
          tenant_id: string
        }
        Update: {
          bank_account_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          difference?: number | null
          gl_balance?: number
          id?: string
          reconciled_balance?: number | null
          statement_balance?: number
          statement_date?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          category: string | null
          created_at: string
          description: string
          id: string
          import_batch_id: string | null
          journal_entry_id: string | null
          match_status: string
          plaid_transaction_id: string | null
          post_date: string | null
          reference: string | null
          tenant_id: string
          transaction_date: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          category?: string | null
          created_at?: string
          description: string
          id?: string
          import_batch_id?: string | null
          journal_entry_id?: string | null
          match_status?: string
          plaid_transaction_id?: string | null
          post_date?: string | null
          reference?: string | null
          tenant_id: string
          transaction_date: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          import_batch_id?: string | null
          journal_entry_id?: string | null
          match_status?: string
          plaid_transaction_id?: string | null
          post_date?: string | null
          reference?: string | null
          tenant_id?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_sheets: {
        Row: {
          admin_fee: number | null
          amenity_fee: number | null
          association_id: string
          base_management_fee: number
          created_at: string | null
          id: string
          late_fee_share: number | null
          notes: string | null
          per_unit_fee: number | null
          period_month: number
          period_year: number
          status: string | null
          tenant_id: string
          total_fee: number
          unit_count: number | null
        }
        Insert: {
          admin_fee?: number | null
          amenity_fee?: number | null
          association_id: string
          base_management_fee: number
          created_at?: string | null
          id?: string
          late_fee_share?: number | null
          notes?: string | null
          per_unit_fee?: number | null
          period_month: number
          period_year: number
          status?: string | null
          tenant_id: string
          total_fee: number
          unit_count?: number | null
        }
        Update: {
          admin_fee?: number | null
          amenity_fee?: number | null
          association_id?: string
          base_management_fee?: number
          created_at?: string | null
          id?: string
          late_fee_share?: number | null
          notes?: string | null
          per_unit_fee?: number | null
          period_month?: number
          period_year?: number
          status?: string | null
          tenant_id?: string
          total_fee?: number
          unit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_sheets_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_sheets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      board_certifications: {
        Row: {
          association_id: string
          certificate_number: string | null
          completed_date: string
          contact_id: string
          course_provider: string | null
          created_at: string | null
          document_url: string | null
          expiry_date: string
          id: string
          method: string
          status: string
          tenant_id: string
        }
        Insert: {
          association_id: string
          certificate_number?: string | null
          completed_date: string
          contact_id: string
          course_provider?: string | null
          created_at?: string | null
          document_url?: string | null
          expiry_date: string
          id?: string
          method: string
          status?: string
          tenant_id: string
        }
        Update: {
          association_id?: string
          certificate_number?: string | null
          completed_date?: string
          contact_id?: string
          course_provider?: string | null
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string
          id?: string
          method?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_certifications_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_certifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_certifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      board_documents: {
        Row: {
          added_at: string | null
          added_by: string | null
          association_id: string
          board_only: boolean | null
          category: string | null
          description: string | null
          document_id: string
          id: string
          tenant_id: string
          title: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          association_id: string
          board_only?: boolean | null
          category?: string | null
          description?: string | null
          document_id: string
          id?: string
          tenant_id: string
          title?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          association_id?: string
          board_only?: boolean | null
          category?: string | null
          description?: string | null
          document_id?: string
          id?: string
          tenant_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_documents_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      board_education_records: {
        Row: {
          board_member_id: string
          certificate_url: string | null
          completion_date: string | null
          course_name: string
          created_at: string
          expiration_date: string | null
          hours_completed: number
          id: string
          provider: string | null
          requirement_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          board_member_id: string
          certificate_url?: string | null
          completion_date?: string | null
          course_name: string
          created_at?: string
          expiration_date?: string | null
          hours_completed?: number
          id?: string
          provider?: string | null
          requirement_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          board_member_id?: string
          certificate_url?: string | null
          completion_date?: string | null
          course_name?: string
          created_at?: string
          expiration_date?: string | null
          hours_completed?: number
          id?: string
          provider?: string | null
          requirement_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_education_records_board_member_id_fkey"
            columns: ["board_member_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_education_records_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "board_education_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_education_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      board_education_requirements: {
        Row: {
          applies_to: string
          created_at: string
          description: string | null
          hours_required: number
          id: string
          is_active: boolean
          recurrence: string
          requirement_type: string
          source: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          applies_to?: string
          created_at?: string
          description?: string | null
          hours_required?: number
          id?: string
          is_active?: boolean
          recurrence?: string
          requirement_type: string
          source?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          applies_to?: string
          created_at?: string
          description?: string | null
          hours_required?: number
          id?: string
          is_active?: boolean
          recurrence?: string
          requirement_type?: string
          source?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_education_requirements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      board_members: {
        Row: {
          association_id: string
          bio: string | null
          committee_memberships: string[] | null
          contact_id: string
          created_at: string
          elected_via: string | null
          election_id: string | null
          id: string
          is_active: boolean | null
          position: string
          tenant_id: string
          term_end: string | null
          term_start: string
          user_id: string | null
        }
        Insert: {
          association_id: string
          bio?: string | null
          committee_memberships?: string[] | null
          contact_id: string
          created_at?: string
          elected_via?: string | null
          election_id?: string | null
          id?: string
          is_active?: boolean | null
          position: string
          tenant_id: string
          term_end?: string | null
          term_start: string
          user_id?: string | null
        }
        Update: {
          association_id?: string
          bio?: string | null
          committee_memberships?: string[] | null
          contact_id?: string
          created_at?: string
          elected_via?: string | null
          election_id?: string | null
          id?: string
          is_active?: boolean | null
          position?: string
          tenant_id?: string
          term_end?: string | null
          term_start?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_members_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      board_resolutions: {
        Row: {
          association_id: string
          body: string
          category: string | null
          created_at: string
          created_by: string | null
          effective_date: string | null
          expires_at: string | null
          id: string
          meeting_id: string | null
          passed_at: string | null
          resolution_number: string
          status: string
          superseded_by: string | null
          tenant_id: string
          title: string
          vote_abstain: number | null
          vote_deadline: string | null
          vote_no: number | null
          vote_yes: number | null
        }
        Insert: {
          association_id: string
          body: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          expires_at?: string | null
          id?: string
          meeting_id?: string | null
          passed_at?: string | null
          resolution_number: string
          status?: string
          superseded_by?: string | null
          tenant_id: string
          title: string
          vote_abstain?: number | null
          vote_deadline?: string | null
          vote_no?: number | null
          vote_yes?: number | null
        }
        Update: {
          association_id?: string
          body?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          expires_at?: string | null
          id?: string
          meeting_id?: string | null
          passed_at?: string | null
          resolution_number?: string
          status?: string
          superseded_by?: string | null
          tenant_id?: string
          title?: string
          vote_abstain?: number | null
          vote_deadline?: string | null
          vote_no?: number | null
          vote_yes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "board_resolutions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_resolutions_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "board_resolutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_resolutions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          account_id: string
          annual_amount: number
          budget_id: string
          created_at: string
          id: string
          m01: number
          m02: number
          m03: number
          m04: number
          m05: number
          m06: number
          m07: number
          m08: number
          m09: number
          m10: number
          m11: number
          m12: number
          notes: string | null
          tenant_id: string
        }
        Insert: {
          account_id: string
          annual_amount?: number
          budget_id: string
          created_at?: string
          id?: string
          m01?: number
          m02?: number
          m03?: number
          m04?: number
          m05?: number
          m06?: number
          m07?: number
          m08?: number
          m09?: number
          m10?: number
          m11?: number
          m12?: number
          notes?: string | null
          tenant_id: string
        }
        Update: {
          account_id?: string
          annual_amount?: number
          budget_id?: string
          created_at?: string
          id?: string
          m01?: number
          m02?: number
          m03?: number
          m04?: number
          m05?: number
          m06?: number
          m07?: number
          m08?: number
          m09?: number
          m10?: number
          m11?: number
          m12?: number
          notes?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          association_id: string
          created_at: string
          fiscal_year: number
          fund_id: string
          id: string
          name: string
          status: string
          tenant_id: string
          total_expense: number
          total_revenue: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          association_id: string
          created_at?: string
          fiscal_year: number
          fund_id: string
          id?: string
          name: string
          status?: string
          tenant_id: string
          total_expense?: number
          total_revenue?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          association_id?: string
          created_at?: string
          fiscal_year?: number
          fund_id?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
          total_expense?: number
          total_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          association_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          is_all_day: boolean
          is_public: boolean
          location: string | null
          recurrence_end: string | null
          recurrence_rule: string | null
          source_id: string | null
          source_type: string | null
          start_date: string
          tenant_id: string
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          association_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          is_public?: boolean
          location?: string | null
          recurrence_end?: string | null
          recurrence_rule?: string | null
          source_id?: string | null
          source_type?: string | null
          start_date: string
          tenant_id: string
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          is_public?: boolean
          location?: string | null
          recurrence_end?: string | null
          recurrence_rule?: string | null
          source_id?: string | null
          source_type?: string | null
          start_date?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      call_dispositions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_followup: boolean | null
          sort_order: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_followup?: boolean | null
          sort_order?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_followup?: boolean | null
          sort_order?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_dispositions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          agent_user_id: string | null
          association_id: string | null
          caller_name: string | null
          contact_id: string | null
          created_at: string
          direction: string
          disposition: string | null
          duration_seconds: number | null
          ended_at: string | null
          followup_date: string | null
          followup_notes: string | null
          followup_required: boolean | null
          id: string
          linked_id: string | null
          linked_type: string | null
          notes: string | null
          phone_number: string | null
          property_id: string | null
          recording_url: string | null
          started_at: string
          teams_call_id: string | null
          teams_meeting_url: string | null
          tenant_id: string
        }
        Insert: {
          agent_user_id?: string | null
          association_id?: string | null
          caller_name?: string | null
          contact_id?: string | null
          created_at?: string
          direction: string
          disposition?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          followup_date?: string | null
          followup_notes?: string | null
          followup_required?: boolean | null
          id?: string
          linked_id?: string | null
          linked_type?: string | null
          notes?: string | null
          phone_number?: string | null
          property_id?: string | null
          recording_url?: string | null
          started_at?: string
          teams_call_id?: string | null
          teams_meeting_url?: string | null
          tenant_id: string
        }
        Update: {
          agent_user_id?: string | null
          association_id?: string | null
          caller_name?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: string
          disposition?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          followup_date?: string | null
          followup_notes?: string | null
          followup_required?: boolean | null
          id?: string
          linked_id?: string | null
          linked_type?: string | null
          notes?: string | null
          phone_number?: string | null
          property_id?: string | null
          recording_url?: string | null
          started_at?: string
          teams_call_id?: string | null
          teams_meeting_url?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      call_queue_members: {
        Row: {
          created_at: string
          id: string
          last_call_at: string | null
          max_concurrent_calls: number | null
          priority: number | null
          queue_name: string
          skills: string[] | null
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_call_at?: string | null
          max_concurrent_calls?: number | null
          priority?: number | null
          queue_name?: string
          skills?: string[] | null
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_call_at?: string | null
          max_concurrent_calls?: number | null
          priority?: number | null
          queue_name?: string
          skills?: string[] | null
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_queue_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      career_goals: {
        Row: {
          category: string
          created_at: string | null
          goal: string
          id: string
          manager_notes: string | null
          status: string
          target_date: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          goal: string
          id?: string
          manager_notes?: string | null
          status?: string
          target_date?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          goal?: string
          id?: string
          manager_notes?: string | null
          status?: string
          target_date?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_goals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_deliveries: {
        Row: {
          certificate_request_id: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_method: string | null
          governing_docs_urls: string[] | null
          id: string
          includes_governing_docs: boolean | null
          tenant_id: string
        }
        Insert: {
          certificate_request_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          governing_docs_urls?: string[] | null
          id?: string
          includes_governing_docs?: boolean | null
          tenant_id: string
        }
        Update: {
          certificate_request_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          governing_docs_urls?: string[] | null
          id?: string
          includes_governing_docs?: boolean | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_deliveries_certificate_request_id_fkey"
            columns: ["certificate_request_id"]
            isOneToOne: false
            referencedRelation: "certificate_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_line_items: {
        Row: {
          amount: number
          category: string
          certificate_id: string
          created_at: string
          description: string
          id: string
          period_end: string | null
          period_start: string | null
          sort_order: number
          tenant_id: string
        }
        Insert: {
          amount?: number
          category: string
          certificate_id: string
          created_at?: string
          description: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          sort_order?: number
          tenant_id: string
        }
        Update: {
          amount?: number
          category?: string
          certificate_id?: string
          created_at?: string
          description?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_line_items_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificate_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_line_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_questionnaire: {
        Row: {
          association_id: string
          authorized_representative_date: string | null
          authorized_representative_name: string | null
          authorized_representative_title: string | null
          created_at: string | null
          foreclosure_details: string | null
          has_pending_foreclosure: boolean | null
          has_receivership: boolean | null
          has_recorded_liens: boolean | null
          id: string
          lien_details: string | null
          property_id: string | null
          receivership_details: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          association_id: string
          authorized_representative_date?: string | null
          authorized_representative_name?: string | null
          authorized_representative_title?: string | null
          created_at?: string | null
          foreclosure_details?: string | null
          has_pending_foreclosure?: boolean | null
          has_receivership?: boolean | null
          has_recorded_liens?: boolean | null
          id?: string
          lien_details?: string | null
          property_id?: string | null
          receivership_details?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          authorized_representative_date?: string | null
          authorized_representative_name?: string | null
          authorized_representative_title?: string | null
          created_at?: string | null
          foreclosure_details?: string | null
          has_pending_foreclosure?: boolean | null
          has_receivership?: boolean | null
          has_recorded_liens?: boolean | null
          id?: string
          lien_details?: string | null
          property_id?: string | null
          receivership_details?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_questionnaire_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_questionnaire_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_questionnaire_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_requests: {
        Row: {
          association_id: string
          balance_as_of_date: string | null
          balance_snapshot: number | null
          balance_snapshot_items: Json | null
          created_at: string
          delivered_date: string | null
          due_date: string | null
          fee: number
          id: string
          is_rush: boolean
          issued_date: string | null
          notes: string | null
          number: number
          property_id: string
          request_type: string
          requester_company: string | null
          requester_email: string | null
          requester_name: string
          requester_phone: string | null
          rush_fee: number
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          association_id: string
          balance_as_of_date?: string | null
          balance_snapshot?: number | null
          balance_snapshot_items?: Json | null
          created_at?: string
          delivered_date?: string | null
          due_date?: string | null
          fee?: number
          id?: string
          is_rush?: boolean
          issued_date?: string | null
          notes?: string | null
          number?: never
          property_id: string
          request_type: string
          requester_company?: string | null
          requester_email?: string | null
          requester_name: string
          requester_phone?: string | null
          rush_fee?: number
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          balance_as_of_date?: string | null
          balance_snapshot?: number | null
          balance_snapshot_items?: Json | null
          created_at?: string
          delivered_date?: string | null
          due_date?: string | null
          fee?: number
          id?: string
          is_rush?: boolean
          issued_date?: string | null
          notes?: string | null
          number?: never
          property_id?: string
          request_type?: string
          requester_company?: string | null
          requester_email?: string | null
          requester_name?: string
          requester_phone?: string | null
          rush_fee?: number
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_requests_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          amount: number
          amount_paid: number
          assessment_schedule_id: string | null
          association_id: string
          balance_due: number | null
          charge_date: string
          charge_type: string
          created_at: string
          description: string
          due_date: string
          id: string
          journal_entry_id: string | null
          period_label: string | null
          property_id: string
          special_assessment_id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          assessment_schedule_id?: string | null
          association_id: string
          balance_due?: number | null
          charge_date: string
          charge_type: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          journal_entry_id?: string | null
          period_label?: string | null
          property_id: string
          special_assessment_id?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          assessment_schedule_id?: string | null
          association_id?: string
          balance_due?: number | null
          charge_date?: string
          charge_type?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          journal_entry_id?: string | null
          period_label?: string | null
          property_id?: string
          special_assessment_id?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charges_assessment_schedule_id_fkey"
            columns: ["assessment_schedule_id"]
            isOneToOne: false
            referencedRelation: "assessment_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_special_assessment_id_fkey"
            columns: ["special_assessment_id"]
            isOneToOne: false
            referencedRelation: "special_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_actions: {
        Row: {
          action_date: string
          action_type: string
          amount_owed: number
          association_id: string
          created_at: string
          created_by: string | null
          document_path: string | null
          id: string
          notes: string | null
          property_id: string
          tenant_id: string
        }
        Insert: {
          action_date: string
          action_type: string
          amount_owed: number
          association_id: string
          created_at?: string
          created_by?: string | null
          document_path?: string | null
          id?: string
          notes?: string | null
          property_id: string
          tenant_id: string
        }
        Update: {
          action_date?: string
          action_type?: string
          amount_owed?: number
          association_id?: string
          created_at?: string
          created_by?: string | null
          document_path?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_actions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_actions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_actions_v2: {
        Row: {
          action_date: string
          action_type: string
          amount_owed: number
          assigned_to: string | null
          association_id: string
          created_at: string
          created_by: string
          id: string
          next_action_date: string | null
          next_action_type: string | null
          notes: string | null
          property_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          action_date?: string
          action_type: string
          amount_owed?: number
          assigned_to?: string | null
          association_id: string
          created_at?: string
          created_by: string
          id?: string
          next_action_date?: string | null
          next_action_type?: string | null
          notes?: string | null
          property_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          action_date?: string
          action_type?: string
          amount_owed?: number
          assigned_to?: string | null
          association_id?: string
          created_at?: string
          created_by?: string
          id?: string
          next_action_date?: string | null
          next_action_type?: string | null
          notes?: string | null
          property_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_actions_v2_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_actions_v2_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_actions_v2_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_escalation_log: {
        Row: {
          action: string
          association_id: string
          auto_executed: boolean
          balance_at_action: number
          contact_id: string | null
          days_overdue_at_action: number
          executed_at: string
          executed_by: string | null
          id: string
          notes: string | null
          property_id: string
          result: string | null
          rule_id: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          association_id: string
          auto_executed?: boolean
          balance_at_action: number
          contact_id?: string | null
          days_overdue_at_action: number
          executed_at?: string
          executed_by?: string | null
          id?: string
          notes?: string | null
          property_id: string
          result?: string | null
          rule_id?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          association_id?: string
          auto_executed?: boolean
          balance_at_action?: number
          contact_id?: string | null
          days_overdue_at_action?: number
          executed_at?: string
          executed_by?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          result?: string | null
          rule_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_escalation_log_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_escalation_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_escalation_log_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_escalation_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_escalation_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "collection_escalation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_escalation_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_escalation_rules: {
        Row: {
          action_type: string
          association_id: string
          created_at: string
          days_overdue: number
          description: string | null
          id: string
          is_active: boolean
          sort_order: number
          tenant_id: string
        }
        Insert: {
          action_type: string
          association_id: string
          created_at?: string
          days_overdue: number
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          tenant_id: string
        }
        Update: {
          action_type?: string
          association_id?: string
          created_at?: string
          days_overdue?: number
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_escalation_rules_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_escalation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          available_variables: Json | null
          body: string
          category: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          subject: string | null
          tenant_id: string | null
        }
        Insert: {
          available_variables?: Json | null
          body: string
          category: string
          channel: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          subject?: string | null
          tenant_id?: string | null
        }
        Update: {
          available_variables?: Json | null
          body?: string
          category?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          subject?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      community_health_scores: {
        Row: {
          association_id: string
          calculated_at: string | null
          communication_score: number | null
          compliance_score: number | null
          financial_score: number | null
          governance_score: number | null
          id: string
          maintenance_score: number | null
          overall_score: number | null
          score_trend: string | null
          tenant_id: string
        }
        Insert: {
          association_id: string
          calculated_at?: string | null
          communication_score?: number | null
          compliance_score?: number | null
          financial_score?: number | null
          governance_score?: number | null
          id?: string
          maintenance_score?: number | null
          overall_score?: number | null
          score_trend?: string | null
          tenant_id: string
        }
        Update: {
          association_id?: string
          calculated_at?: string | null
          communication_score?: number | null
          compliance_score?: number | null
          financial_score?: number | null
          governance_score?: number | null
          id?: string
          maintenance_score?: number | null
          overall_score?: number | null
          score_trend?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_health_scores_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_health_scores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      community_offboarding: {
        Row: {
          assigned_to: string | null
          association_id: string
          checklist: Json
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reason: string | null
          status: string
          tenant_id: string
          termination_date: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          association_id: string
          checklist?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          status?: string
          tenant_id: string
          termination_date?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          association_id?: string
          checklist?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          status?: string
          tenant_id?: string
          termination_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_offboarding_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_offboarding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      community_onboarding: {
        Row: {
          actual_go_live_date: string | null
          assigned_to: string | null
          association_id: string | null
          checklist: Json
          contract_id: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string | null
          notes: string | null
          status: string
          target_go_live_date: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_go_live_date?: string | null
          assigned_to?: string | null
          association_id?: string | null
          checklist?: Json
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          status?: string
          target_go_live_date?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_go_live_date?: string | null
          assigned_to?: string | null
          association_id?: string | null
          checklist?: Json
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          status?: string
          target_go_live_date?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_onboarding_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_onboarding_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_onboarding_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_onboarding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      community_vehicles: {
        Row: {
          aircraft_make: string | null
          aircraft_model: string | null
          aircraft_year: number | null
          association_id: string
          color: string | null
          contact_id: string | null
          created_at: string
          faa_registration_expiry: string | null
          id: string
          insurance_company: string | null
          insurance_expiry: string | null
          insurance_policy_number: string | null
          license_plate: string | null
          license_state: string | null
          lot_id: string | null
          make: string | null
          metadata: Json
          model: string | null
          n_number: string | null
          notes: string | null
          property_id: string | null
          registered_date: string | null
          rv_height_ft: number | null
          rv_length_ft: number | null
          slide_out_count: number | null
          status: string
          tenant_id: string
          updated_at: string
          vehicle_type: string
          vin: string | null
          year: number | null
        }
        Insert: {
          aircraft_make?: string | null
          aircraft_model?: string | null
          aircraft_year?: number | null
          association_id: string
          color?: string | null
          contact_id?: string | null
          created_at?: string
          faa_registration_expiry?: string | null
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          license_plate?: string | null
          license_state?: string | null
          lot_id?: string | null
          make?: string | null
          metadata?: Json
          model?: string | null
          n_number?: string | null
          notes?: string | null
          property_id?: string | null
          registered_date?: string | null
          rv_height_ft?: number | null
          rv_length_ft?: number | null
          slide_out_count?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
          vehicle_type: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          aircraft_make?: string | null
          aircraft_model?: string | null
          aircraft_year?: number | null
          association_id?: string
          color?: string | null
          contact_id?: string | null
          created_at?: string
          faa_registration_expiry?: string | null
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          license_plate?: string | null
          license_state?: string | null
          lot_id?: string | null
          make?: string | null
          metadata?: Json
          model?: string | null
          n_number?: string | null
          notes?: string | null
          property_id?: string | null
          registered_date?: string | null
          rv_height_ft?: number | null
          rv_length_ft?: number | null
          slide_out_count?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vehicle_type?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_vehicles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_vehicles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_vehicles_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_vehicles_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_action_templates: {
        Row: {
          assigned_role: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date_formula: string | null
          frequency: string | null
          id: string
          is_active: boolean
          priority: string
          tenant_id: string
          title: string
        }
        Insert: {
          assigned_role?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date_formula?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          tenant_id: string
          title: string
        }
        Update: {
          assigned_role?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date_formula?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          tenant_id?: string
          title?: string
        }
        Relationships: []
      }
      compliance_checklist_items: {
        Row: {
          association_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_date: string | null
          evidence_document_id: string | null
          fiscal_year: number | null
          id: string
          notes: string | null
          requirement_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          association_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          evidence_document_id?: string | null
          fiscal_year?: number | null
          id?: string
          notes?: string | null
          requirement_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          association_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          evidence_document_id?: string | null
          fiscal_year?: number | null
          id?: string
          notes?: string | null
          requirement_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_checklist_items_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_checklist_items_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_checklist_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_deadlines: {
        Row: {
          association_id: string
          checklist_item_id: string | null
          created_at: string
          deadline_date: string
          fiscal_year: number | null
          id: string
          reminder_sent_at: string | null
          requirement_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          association_id: string
          checklist_item_id?: string | null
          created_at?: string
          deadline_date: string
          fiscal_year?: number | null
          id?: string
          reminder_sent_at?: string | null
          requirement_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          association_id?: string
          checklist_item_id?: string | null
          created_at?: string
          deadline_date?: string
          fiscal_year?: number | null
          id?: string
          reminder_sent_at?: string | null
          requirement_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_deadlines_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_deadlines_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "compliance_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_deadlines_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_deadlines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirement_templates: {
        Row: {
          chapter: string
          community_types: string[]
          created_at: string
          deadline_formula: string
          description: string
          frequency: string
          id: string
          is_active: boolean
          notes: string | null
          requirement_key: string
          state: string
          statute_citation: string | null
          title: string
        }
        Insert: {
          chapter: string
          community_types?: string[]
          created_at?: string
          deadline_formula: string
          description: string
          frequency: string
          id?: string
          is_active?: boolean
          notes?: string | null
          requirement_key: string
          state?: string
          statute_citation?: string | null
          title: string
        }
        Update: {
          chapter?: string
          community_types?: string[]
          created_at?: string
          deadline_formula?: string
          description?: string
          frequency?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          requirement_key?: string
          state?: string
          statute_citation?: string | null
          title?: string
        }
        Relationships: []
      }
      compliance_requirements: {
        Row: {
          association_types: string[]
          created_at: string
          deadline_formula: string | null
          frequency: string | null
          id: string
          is_active: boolean
          penalty_description: string | null
          reference_url: string | null
          requirement_text: string
          requirement_type: string
          section: string
          statute_chapter: string
        }
        Insert: {
          association_types?: string[]
          created_at?: string
          deadline_formula?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          penalty_description?: string | null
          reference_url?: string | null
          requirement_text: string
          requirement_type: string
          section: string
          statute_chapter: string
        }
        Update: {
          association_types?: string[]
          created_at?: string
          deadline_formula?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          penalty_description?: string | null
          reference_url?: string | null
          requirement_text?: string
          requirement_type?: string
          section?: string
          statute_chapter?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string
          created_at: string
          email: string | null
          external_id: string | null
          external_source: string | null
          first_name: string
          id: string
          identity_verified: boolean
          identity_verified_at: string | null
          last_name: string
          phone: string | null
          preferred_language: string
          state: string | null
          tenant_id: string
          type: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          external_id?: string | null
          external_source?: string | null
          first_name: string
          id?: string
          identity_verified?: boolean
          identity_verified_at?: string | null
          last_name: string
          phone?: string | null
          preferred_language?: string
          state?: string | null
          tenant_id: string
          type?: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          external_id?: string | null
          external_source?: string | null
          first_name?: string
          id?: string
          identity_verified?: boolean
          identity_verified_at?: string | null
          last_name?: string
          phone?: string | null
          preferred_language?: string
          state?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_deliverables: {
        Row: {
          association_id: string
          category: string
          contract_id: string | null
          created_at: string
          day_of_month: number | null
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          association_id: string
          category?: string
          contract_id?: string | null
          created_at?: string
          day_of_month?: number | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          category?: string
          contract_id?: string | null
          created_at?: string
          day_of_month?: number | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_deliverables_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_deliverables_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_deliverables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          merge_fields: Json
          name: string
          pandadoc_template_id: string | null
          template_body: string
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          merge_fields?: Json
          name: string
          pandadoc_template_id?: string | null
          template_body: string
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          merge_fields?: Json
          name?: string
          pandadoc_template_id?: string | null
          template_body?: string
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          association_id: string | null
          cancellation_notice_days: number | null
          created_at: string
          created_by: string | null
          document_url: string | null
          id: string
          initial_setup_fee: number | null
          lead_id: string | null
          merge_values: Json
          monthly_fee: number | null
          pandadoc_document_id: string | null
          pandadoc_sent_at: string | null
          pandadoc_signed_at: string | null
          pandadoc_status: string | null
          pandadoc_viewed_at: string | null
          schedule_b_items: Json
          signed_by_email: string | null
          signed_by_name: string | null
          status: string
          storage_path: string | null
          template_id: string | null
          tenant_id: string
          term_end_date: string | null
          term_start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          association_id?: string | null
          cancellation_notice_days?: number | null
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          id?: string
          initial_setup_fee?: number | null
          lead_id?: string | null
          merge_values?: Json
          monthly_fee?: number | null
          pandadoc_document_id?: string | null
          pandadoc_sent_at?: string | null
          pandadoc_signed_at?: string | null
          pandadoc_status?: string | null
          pandadoc_viewed_at?: string | null
          schedule_b_items?: Json
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string
          storage_path?: string | null
          template_id?: string | null
          tenant_id: string
          term_end_date?: string | null
          term_start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          association_id?: string | null
          cancellation_notice_days?: number | null
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          id?: string
          initial_setup_fee?: number | null
          lead_id?: string | null
          merge_values?: Json
          monthly_fee?: number | null
          pandadoc_document_id?: string | null
          pandadoc_sent_at?: string | null
          pandadoc_signed_at?: string | null
          pandadoc_status?: string | null
          pandadoc_viewed_at?: string | null
          schedule_b_items?: Json
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string
          storage_path?: string | null
          template_id?: string | null
          tenant_id?: string
          term_end_date?: string | null
          term_start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      counties: {
        Row: {
          appraiser_api_type: string | null
          appraiser_url: string | null
          county_fips: string
          county_name: string
          id: string
          notes: string | null
          population: number | null
          state: string
        }
        Insert: {
          appraiser_api_type?: string | null
          appraiser_url?: string | null
          county_fips: string
          county_name: string
          id?: string
          notes?: string | null
          population?: number | null
          state?: string
        }
        Update: {
          appraiser_api_type?: string | null
          appraiser_url?: string | null
          county_fips?: string
          county_name?: string
          id?: string
          notes?: string | null
          population?: number | null
          state?: string
        }
        Relationships: []
      }
      deliverable_completions: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          days_late: number | null
          deliverable_id: string
          evidence_url: string | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          days_late?: number | null
          deliverable_id: string
          evidence_url?: string | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          days_late?: number | null
          deliverable_id?: string
          evidence_url?: string | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_completions_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "contract_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_completions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      depreciation_entries: {
        Row: {
          accumulated_total: number
          created_at: string
          depreciation_amount: number
          fixed_asset_id: string
          id: string
          journal_entry_id: string | null
          period_date: string
          tenant_id: string
        }
        Insert: {
          accumulated_total: number
          created_at?: string
          depreciation_amount: number
          fixed_asset_id: string
          id?: string
          journal_entry_id?: string | null
          period_date: string
          tenant_id: string
        }
        Update: {
          accumulated_total?: number
          created_at?: string
          depreciation_amount?: number
          fixed_asset_id?: string
          id?: string
          journal_entry_id?: string | null
          period_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "depreciation_entries_fixed_asset_id_fkey"
            columns: ["fixed_asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depreciation_entries_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depreciation_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_projects: {
        Row: {
          actual_completion: string | null
          association_id: string
          created_at: string
          description: string | null
          developer_contact_id: string | null
          estimated_completion: string | null
          id: string
          lots_completed: number | null
          lots_sold: number | null
          lots_under_construction: number | null
          metadata: Json
          name: string
          notes: string | null
          phase_name: string | null
          start_date: string | null
          status: string
          tenant_id: string
          total_lots: number | null
          updated_at: string
        }
        Insert: {
          actual_completion?: string | null
          association_id: string
          created_at?: string
          description?: string | null
          developer_contact_id?: string | null
          estimated_completion?: string | null
          id?: string
          lots_completed?: number | null
          lots_sold?: number | null
          lots_under_construction?: number | null
          metadata?: Json
          name: string
          notes?: string | null
          phase_name?: string | null
          start_date?: string | null
          status?: string
          tenant_id: string
          total_lots?: number | null
          updated_at?: string
        }
        Update: {
          actual_completion?: string | null
          association_id?: string
          created_at?: string
          description?: string | null
          developer_contact_id?: string | null
          estimated_completion?: string | null
          id?: string
          lots_completed?: number | null
          lots_sold?: number | null
          lots_under_construction?: number | null
          metadata?: Json
          name?: string
          notes?: string | null
          phase_name?: string | null
          start_date?: string | null
          status?: string
          tenant_id?: string
          total_lots?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_projects_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_projects_developer_contact_id_fkey"
            columns: ["developer_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          association_id: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          sort_order: number
          tenant_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
          tenant_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_categories_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_downloads: {
        Row: {
          contact_id: string | null
          document_id: string
          downloaded_at: string
          id: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          contact_id?: string | null
          document_id: string
          downloaded_at?: string
          id?: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          contact_id?: string | null
          document_id?: string
          downloaded_at?: string
          id?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_downloads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_naming_rules: {
        Row: {
          active: boolean | null
          association_id: string | null
          created_at: string | null
          description: string | null
          document_category: string
          example: string | null
          id: string
          pattern: string
          sort_order: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          association_id?: string | null
          created_at?: string | null
          description?: string | null
          document_category: string
          example?: string | null
          id?: string
          pattern: string
          sort_order?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          association_id?: string | null
          created_at?: string | null
          description?: string | null
          document_category?: string
          example?: string | null
          id?: string
          pattern?: string
          sort_order?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_naming_rules_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_naming_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          association_id: string
          category_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_public: boolean
          mime_type: string | null
          property_id: string | null
          tenant_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          association_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_public?: boolean
          mime_type?: string | null
          property_id?: string | null
          tenant_id: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          association_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_public?: boolean
          mime_type?: string | null
          property_id?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      elections: {
        Row: {
          allow_proxies: boolean | null
          anonymous_voting: boolean | null
          association_id: string
          certified_at: string | null
          certified_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          election_type: string
          id: string
          meeting_id: string | null
          nomination_end: string | null
          nomination_start: string | null
          quorum_achieved: number | null
          quorum_required: number | null
          results_published_at: string | null
          status: string
          tenant_id: string
          title: string
          total_eligible_voters: number | null
          total_proxies_received: number | null
          total_votes_cast: number | null
          voting_end: string
          voting_method: string | null
          voting_start: string
        }
        Insert: {
          allow_proxies?: boolean | null
          anonymous_voting?: boolean | null
          association_id: string
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          election_type: string
          id?: string
          meeting_id?: string | null
          nomination_end?: string | null
          nomination_start?: string | null
          quorum_achieved?: number | null
          quorum_required?: number | null
          results_published_at?: string | null
          status?: string
          tenant_id: string
          title: string
          total_eligible_voters?: number | null
          total_proxies_received?: number | null
          total_votes_cast?: number | null
          voting_end: string
          voting_method?: string | null
          voting_start: string
        }
        Update: {
          allow_proxies?: boolean | null
          anonymous_voting?: boolean | null
          association_id?: string
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          election_type?: string
          id?: string
          meeting_id?: string | null
          nomination_end?: string | null
          nomination_start?: string | null
          quorum_achieved?: number | null
          quorum_required?: number | null
          results_published_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
          total_eligible_voters?: number | null
          total_proxies_received?: number | null
          total_votes_cast?: number | null
          voting_end?: string
          voting_method?: string | null
          voting_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "elections_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      electronic_voting_consents: {
        Row: {
          association_id: string
          consent_date: string | null
          consent_document_url: string | null
          consent_ip_address: string | null
          consent_method: string | null
          consented: boolean
          contact_id: string
          created_at: string | null
          email_address: string | null
          id: string
          phone_number: string | null
          property_id: string | null
          revocation_method: string | null
          revoked: boolean | null
          revoked_date: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          association_id: string
          consent_date?: string | null
          consent_document_url?: string | null
          consent_ip_address?: string | null
          consent_method?: string | null
          consented?: boolean
          contact_id: string
          created_at?: string | null
          email_address?: string | null
          id?: string
          phone_number?: string | null
          property_id?: string | null
          revocation_method?: string | null
          revoked?: boolean | null
          revoked_date?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          consent_date?: string | null
          consent_document_url?: string | null
          consent_ip_address?: string | null
          consent_method?: string | null
          consented?: boolean
          contact_id?: string
          created_at?: string | null
          email_address?: string | null
          id?: string
          phone_number?: string | null
          property_id?: string | null
          revocation_method?: string | null
          revoked?: boolean | null
          revoked_date?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "electronic_voting_consents_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronic_voting_consents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronic_voting_consents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronic_voting_consents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          association_id: string
          created_at: string
          display_name: string | null
          email_address: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          ms_subscription_id: string | null
          ms_user_id: string | null
          tenant_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          display_name?: string | null
          email_address: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          ms_subscription_id?: string | null
          ms_user_id?: string | null
          tenant_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          display_name?: string | null
          email_address?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          ms_subscription_id?: string | null
          ms_user_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          ai_summary: string | null
          association_id: string
          body_html: string | null
          body_preview: string | null
          cc_addresses: Json
          contact_id: string | null
          created_at: string
          email_account_id: string
          from_address: string | null
          from_name: string | null
          id: string
          importance: string | null
          is_read: boolean
          linked_resource_id: string | null
          linked_resource_type: string | null
          ms_message_id: string | null
          property_id: string | null
          received_at: string | null
          sentiment: string | null
          sentiment_score: number | null
          status: string
          subject: string | null
          tenant_id: string
          thread_id: string | null
          to_addresses: Json
        }
        Insert: {
          ai_summary?: string | null
          association_id: string
          body_html?: string | null
          body_preview?: string | null
          cc_addresses?: Json
          contact_id?: string | null
          created_at?: string
          email_account_id: string
          from_address?: string | null
          from_name?: string | null
          id?: string
          importance?: string | null
          is_read?: boolean
          linked_resource_id?: string | null
          linked_resource_type?: string | null
          ms_message_id?: string | null
          property_id?: string | null
          received_at?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          status?: string
          subject?: string | null
          tenant_id: string
          thread_id?: string | null
          to_addresses?: Json
        }
        Update: {
          ai_summary?: string | null
          association_id?: string
          body_html?: string | null
          body_preview?: string | null
          cc_addresses?: Json
          contact_id?: string | null
          created_at?: string
          email_account_id?: string
          from_address?: string | null
          from_name?: string | null
          id?: string
          importance?: string | null
          is_read?: boolean
          linked_resource_id?: string | null
          linked_resource_type?: string | null
          ms_message_id?: string | null
          property_id?: string | null
          received_at?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          status?: string
          subject?: string | null
          tenant_id?: string
          thread_id?: string | null
          to_addresses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_rules: {
        Row: {
          action: string
          action_config: Json
          association_id: string
          created_at: string
          id: string
          is_active: boolean
          match_pattern: string
          match_type: string
          name: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          action: string
          action_config?: Json
          association_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          match_pattern: string
          match_type: string
          name: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          action?: string
          action_config?: Json
          association_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          match_pattern?: string
          match_type?: string
          name?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_rules_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_outbox: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          retry_count: number
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_outbox_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_requests: {
        Row: {
          amount: number
          cam_name: string | null
          certificate_url: string | null
          community: string | null
          course_name: string | null
          created_at: string | null
          date_incurred: string
          description: string
          id: string
          observer_name: string | null
          oncall_date: string | null
          oncall_hours: number | null
          oncall_rate: number | null
          provider: string | null
          receipt_url: string | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          ride_along_purpose: string | null
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          amount: number
          cam_name?: string | null
          certificate_url?: string | null
          community?: string | null
          course_name?: string | null
          created_at?: string | null
          date_incurred: string
          description: string
          id?: string
          observer_name?: string | null
          oncall_date?: string | null
          oncall_hours?: number | null
          oncall_rate?: number | null
          provider?: string | null
          receipt_url?: string | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          ride_along_purpose?: string | null
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          amount?: number
          cam_name?: string | null
          certificate_url?: string | null
          community?: string | null
          course_name?: string | null
          created_at?: string | null
          date_incurred?: string
          description?: string
          id?: string
          observer_name?: string | null
          oncall_date?: string | null
          oncall_hours?: number | null
          oncall_rate?: number | null
          provider?: string | null
          receipt_url?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          ride_along_purpose?: string | null
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_integrations: {
        Row: {
          category: string | null
          config: Json
          connected_by: string | null
          created_at: string
          credentials: Json
          display_name: string
          error_message: string | null
          id: string
          last_sync_at: string | null
          provider: string
          status: string
          sync_frequency: string | null
          tenant_id: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          category?: string | null
          config?: Json
          connected_by?: string | null
          created_at?: string
          credentials?: Json
          display_name: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          provider: string
          status?: string
          sync_frequency?: string | null
          tenant_id: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          category?: string | null
          config?: Json
          connected_by?: string | null
          created_at?: string
          credentials?: Json
          display_name?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          status?: string
          sync_frequency?: string | null
          tenant_id?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_periods: {
        Row: {
          association_id: string
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          period_month: number
          period_year: number
          status: string
          tenant_id: string
        }
        Insert: {
          association_id: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          period_month: number
          period_year: number
          status?: string
          tenant_id: string
        }
        Update: {
          association_id?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          period_month?: number
          period_year?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_periods_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          accum_depr_account_id: string | null
          acquisition_cost: number
          acquisition_date: string
          asset_account_id: string | null
          asset_name: string
          association_id: string
          category: string
          created_at: string
          declining_balance_rate: number | null
          depr_expense_account_id: string | null
          depreciation_method: string
          description: string | null
          disposal_amount: number | null
          disposed_date: string | null
          id: string
          salvage_value: number
          status: string
          tenant_id: string
          total_units: number | null
          units_used: number | null
          updated_at: string
          useful_life_months: number
        }
        Insert: {
          accum_depr_account_id?: string | null
          acquisition_cost: number
          acquisition_date: string
          asset_account_id?: string | null
          asset_name: string
          association_id: string
          category?: string
          created_at?: string
          declining_balance_rate?: number | null
          depr_expense_account_id?: string | null
          depreciation_method?: string
          description?: string | null
          disposal_amount?: number | null
          disposed_date?: string | null
          id?: string
          salvage_value?: number
          status?: string
          tenant_id: string
          total_units?: number | null
          units_used?: number | null
          updated_at?: string
          useful_life_months: number
        }
        Update: {
          accum_depr_account_id?: string | null
          acquisition_cost?: number
          acquisition_date?: string
          asset_account_id?: string | null
          asset_name?: string
          association_id?: string
          category?: string
          created_at?: string
          declining_balance_rate?: number | null
          depr_expense_account_id?: string | null
          depreciation_method?: string
          description?: string | null
          disposal_amount?: number | null
          disposed_date?: string | null
          id?: string
          salvage_value?: number
          status?: string
          tenant_id?: string
          total_units?: number | null
          units_used?: number | null
          updated_at?: string
          useful_life_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_accum_depr_account_id_fkey"
            columns: ["accum_depr_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_accum_depr_account_id_fkey"
            columns: ["accum_depr_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "fixed_assets_asset_account_id_fkey"
            columns: ["asset_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_asset_account_id_fkey"
            columns: ["asset_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "fixed_assets_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_depr_expense_account_id_fkey"
            columns: ["depr_expense_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_depr_expense_account_id_fkey"
            columns: ["depr_expense_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "fixed_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      funds: {
        Row: {
          association_id: string
          created_at: string
          fund_type: string
          id: string
          is_default: boolean
          name: string
          tenant_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          fund_type: string
          id?: string
          is_default?: boolean
          name: string
          tenant_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          fund_type?: string
          id?: string
          is_default?: boolean
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funds_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_letters: {
        Row: {
          association_id: string
          body: string
          created_at: string
          created_by: string | null
          delivery_method: string
          id: string
          property_id: string | null
          recipient_address: string | null
          recipient_email: string | null
          recipient_name: string
          sent_at: string | null
          source_id: string | null
          source_type: string | null
          status: string
          subject: string
          template_id: string | null
          tenant_id: string
        }
        Insert: {
          association_id: string
          body: string
          created_at?: string
          created_by?: string | null
          delivery_method?: string
          id?: string
          property_id?: string | null
          recipient_address?: string | null
          recipient_email?: string | null
          recipient_name: string
          sent_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          subject: string
          template_id?: string | null
          tenant_id: string
        }
        Update: {
          association_id?: string
          body?: string
          created_at?: string
          created_by?: string | null
          delivery_method?: string
          id?: string
          property_id?: string | null
          recipient_address?: string | null
          recipient_email?: string | null
          recipient_name?: string
          sent_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_letters_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_letters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_letters_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "letter_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_letters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      golf_handicap_history: {
        Row: {
          course_rating: number
          differential: number
          gross_score: number
          id: string
          membership_id: string
          posted_at: string
          slope_rating: number
        }
        Insert: {
          course_rating: number
          differential: number
          gross_score: number
          id?: string
          membership_id: string
          posted_at?: string
          slope_rating: number
        }
        Update: {
          course_rating?: number
          differential?: number
          gross_score?: number
          id?: string
          membership_id?: string
          posted_at?: string
          slope_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "golf_handicap_history_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "golf_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      golf_memberships: {
        Row: {
          association_id: string
          contact_id: string
          created_at: string
          expiry_date: string | null
          handicap_index: number | null
          id: string
          is_active: boolean
          membership_number: string | null
          monthly_dues: number | null
          notes: string | null
          start_date: string
          tenant_id: string
          tier: string
        }
        Insert: {
          association_id: string
          contact_id: string
          created_at?: string
          expiry_date?: string | null
          handicap_index?: number | null
          id?: string
          is_active?: boolean
          membership_number?: string | null
          monthly_dues?: number | null
          notes?: string | null
          start_date: string
          tenant_id: string
          tier?: string
        }
        Update: {
          association_id?: string
          contact_id?: string
          created_at?: string
          expiry_date?: string | null
          handicap_index?: number | null
          id?: string
          is_active?: boolean
          membership_number?: string | null
          monthly_dues?: number | null
          notes?: string | null
          start_date?: string
          tenant_id?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "golf_memberships_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "golf_memberships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      golf_tee_times: {
        Row: {
          association_id: string
          cart_included: boolean | null
          contact_id: string
          created_at: string
          greens_fee: number | null
          holes: number
          id: string
          membership_id: string | null
          notes: string | null
          players: number
          status: string
          tee_date: string
          tee_time: string
          tenant_id: string
        }
        Insert: {
          association_id: string
          cart_included?: boolean | null
          contact_id: string
          created_at?: string
          greens_fee?: number | null
          holes?: number
          id?: string
          membership_id?: string | null
          notes?: string | null
          players?: number
          status?: string
          tee_date: string
          tee_time: string
          tenant_id: string
        }
        Update: {
          association_id?: string
          cart_included?: boolean | null
          contact_id?: string
          created_at?: string
          greens_fee?: number | null
          holes?: number
          id?: string
          membership_id?: string | null
          notes?: string | null
          players?: number
          status?: string
          tee_date?: string
          tee_time?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "golf_tee_times_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "golf_tee_times_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "golf_tee_times_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "golf_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_breadcrumbs: {
        Row: {
          accuracy: number | null
          altitude: number | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          reference_id: string | null
          reference_type: string | null
          source: string
          speed: number | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          reference_id?: string | null
          reference_type?: string | null
          source?: string
          speed?: number | null
          tenant_id: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          reference_id?: string | null
          reference_type?: string | null
          source?: string
          speed?: number | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_breadcrumbs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      home_inventory: {
        Row: {
          brand: string | null
          category: string
          created_at: string | null
          expected_lifespan_years: number | null
          id: string
          last_service_date: string | null
          model: string | null
          name: string
          next_service_due: string | null
          notes: string | null
          owner_id: string | null
          photos: string[] | null
          property_id: string
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          tenant_id: string
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          created_at?: string | null
          expected_lifespan_years?: number | null
          id?: string
          last_service_date?: string | null
          model?: string | null
          name: string
          next_service_due?: string | null
          notes?: string | null
          owner_id?: string | null
          photos?: string[] | null
          property_id: string
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          tenant_id: string
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string | null
          expected_lifespan_years?: number | null
          id?: string
          last_service_date?: string | null
          model?: string | null
          name?: string
          next_service_due?: string | null
          notes?: string | null
          owner_id?: string | null
          photos?: string[] | null
          property_id?: string
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          tenant_id?: string
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_inventory_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_inventory_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      home_maintenance_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          maintenance_item_id: string
          notes: string | null
          status_from: string | null
          status_to: string
          tenant_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          maintenance_item_id: string
          notes?: string | null
          status_from?: string | null
          status_to: string
          tenant_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          maintenance_item_id?: string
          notes?: string | null
          status_from?: string | null
          status_to?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_maintenance_history_maintenance_item_id_fkey"
            columns: ["maintenance_item_id"]
            isOneToOne: false
            referencedRelation: "home_maintenance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_maintenance_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      home_maintenance_items: {
        Row: {
          actual_cost: number | null
          arc_submission_id: string | null
          category: string
          completed_date: string | null
          created_at: string | null
          description: string | null
          documents: string[] | null
          id: string
          next_due_date: string | null
          notes: string | null
          owner_id: string | null
          photos: string[] | null
          priority: string | null
          property_id: string
          quoted_cost: number | null
          recurrence_pattern: string | null
          recurring: boolean | null
          requires_arc_approval: boolean | null
          scheduled_date: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
          warranty_expiry: string | null
          warranty_notes: string | null
        }
        Insert: {
          actual_cost?: number | null
          arc_submission_id?: string | null
          category: string
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          documents?: string[] | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          owner_id?: string | null
          photos?: string[] | null
          priority?: string | null
          property_id: string
          quoted_cost?: number | null
          recurrence_pattern?: string | null
          recurring?: boolean | null
          requires_arc_approval?: boolean | null
          scheduled_date?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          warranty_expiry?: string | null
          warranty_notes?: string | null
        }
        Update: {
          actual_cost?: number | null
          arc_submission_id?: string | null
          category?: string
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          documents?: string[] | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          owner_id?: string | null
          photos?: string[] | null
          priority?: string | null
          property_id?: string
          quoted_cost?: number | null
          recurrence_pattern?: string | null
          recurring?: boolean | null
          requires_arc_approval?: boolean | null
          scheduled_date?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          warranty_expiry?: string | null
          warranty_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_maintenance_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_maintenance_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_maintenance_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_interactions: {
        Row: {
          association_id: string | null
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          occurred_at: string
          sentiment: string | null
          source_id: string | null
          source_type: string | null
          summary: string | null
          tenant_id: string
        }
        Insert: {
          association_id?: string | null
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          occurred_at?: string
          sentiment?: string | null
          source_id?: string | null
          source_type?: string | null
          summary?: string | null
          tenant_id: string
        }
        Update: {
          association_id?: string | null
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          occurred_at?: string
          sentiment?: string | null
          source_id?: string | null
          source_type?: string | null
          summary?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_interactions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_profiles: {
        Row: {
          communication_score: number | null
          compliance_score: number | null
          contact_id: string
          created_at: string
          first_interaction_at: string | null
          id: string
          interaction_count: number | null
          last_interaction_at: string | null
          notes: string | null
          open_violations: number | null
          payment_score: number | null
          properties: Json | null
          risk_level: string | null
          score: number | null
          tenant_id: string
          total_balance: number | null
          total_violations: number | null
          total_work_orders: number | null
          updated_at: string | null
        }
        Insert: {
          communication_score?: number | null
          compliance_score?: number | null
          contact_id: string
          created_at?: string
          first_interaction_at?: string | null
          id?: string
          interaction_count?: number | null
          last_interaction_at?: string | null
          notes?: string | null
          open_violations?: number | null
          payment_score?: number | null
          properties?: Json | null
          risk_level?: string | null
          score?: number | null
          tenant_id: string
          total_balance?: number | null
          total_violations?: number | null
          total_work_orders?: number | null
          updated_at?: string | null
        }
        Update: {
          communication_score?: number | null
          compliance_score?: number | null
          contact_id?: string
          created_at?: string
          first_interaction_at?: string | null
          id?: string
          interaction_count?: number | null
          last_interaction_at?: string | null
          notes?: string | null
          open_violations?: number | null
          payment_score?: number | null
          properties?: Json | null
          risk_level?: string | null
          score?: number | null
          tenant_id?: string
          total_balance?: number | null
          total_violations?: number | null
          total_work_orders?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeowner_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          association_id: string | null
          contact_id: string
          created_at: string
          document_country: string | null
          document_type: string | null
          id: string
          metadata: Json
          purpose: string | null
          purpose_resource_id: string | null
          requested_by: string | null
          status: string
          stripe_report_id: string | null
          stripe_session_id: string | null
          tenant_id: string
          verification_type: string
          verified_at: string | null
          verified_dob: string | null
          verified_name: string | null
        }
        Insert: {
          association_id?: string | null
          contact_id: string
          created_at?: string
          document_country?: string | null
          document_type?: string | null
          id?: string
          metadata?: Json
          purpose?: string | null
          purpose_resource_id?: string | null
          requested_by?: string | null
          status?: string
          stripe_report_id?: string | null
          stripe_session_id?: string | null
          tenant_id: string
          verification_type?: string
          verified_at?: string | null
          verified_dob?: string | null
          verified_name?: string | null
        }
        Update: {
          association_id?: string | null
          contact_id?: string
          created_at?: string
          document_country?: string | null
          document_type?: string | null
          id?: string
          metadata?: Json
          purpose?: string | null
          purpose_resource_id?: string | null
          requested_by?: string | null
          status?: string
          stripe_report_id?: string | null
          stripe_session_id?: string | null
          tenant_id?: string
          verification_type?: string
          verified_at?: string | null
          verified_dob?: string | null
          verified_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_items: {
        Row: {
          created_at: string
          id: string
          inspection_id: string
          item_label: string
          item_type: string
          notes: string | null
          photos: Json
          result: string | null
          sort_order: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_id: string
          item_label: string
          item_type: string
          notes?: string | null
          photos?: Json
          result?: string | null
          sort_order?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_id?: string
          item_label?: string
          item_type?: string
          notes?: string | null
          photos?: Json
          result?: string | null
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_templates: {
        Row: {
          association_id: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          items: Json
          name: string
          tenant_id: string
        }
        Insert: {
          association_id?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          name: string
          tenant_id: string
        }
        Update: {
          association_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_templates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          association_id: string
          completed_at: string | null
          created_at: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          inspector_id: string | null
          location_description: string | null
          notes: string | null
          number: number
          overall_rating: string | null
          property_id: string | null
          started_at: string
          status: string
          template_id: string | null
          tenant_id: string
          weather: string | null
        }
        Insert: {
          association_id: string
          completed_at?: string | null
          created_at?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          inspector_id?: string | null
          location_description?: string | null
          notes?: string | null
          number?: never
          overall_rating?: string | null
          property_id?: string | null
          started_at?: string
          status?: string
          template_id?: string | null
          tenant_id: string
          weather?: string | null
        }
        Update: {
          association_id?: string
          completed_at?: string | null
          created_at?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          inspector_id?: string | null
          location_description?: string | null
          notes?: string | null
          number?: never
          overall_rating?: string | null
          property_id?: string | null
          started_at?: string
          status?: string
          template_id?: string | null
          tenant_id?: string
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          adjuster_email: string | null
          adjuster_name: string | null
          adjuster_phone: string | null
          amount_claimed: number | null
          amount_paid: number | null
          claim_number: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          incident_date: string
          notes: string | null
          policy_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          amount_claimed?: number | null
          amount_paid?: number | null
          claim_number?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          incident_date: string
          notes?: string | null
          policy_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          amount_claimed?: number | null
          amount_paid?: number | null
          claim_number?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          incident_date?: string
          notes?: string | null
          policy_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          agent_email: string | null
          agent_name: string | null
          agent_phone: string | null
          association_id: string
          carrier: string
          coverage_amount: number | null
          created_at: string
          deductible: number | null
          document_id: string | null
          end_date: string
          id: string
          notes: string | null
          policy_number: string
          policy_type: string
          premium: number | null
          start_date: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          association_id: string
          carrier: string
          coverage_amount?: number | null
          created_at?: string
          deductible?: number | null
          document_id?: string | null
          end_date: string
          id?: string
          notes?: string | null
          policy_number: string
          policy_type: string
          premium?: number | null
          start_date: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          association_id?: string
          carrier?: string
          coverage_amount?: number | null
          created_at?: string
          deductible?: number | null
          document_id?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          policy_number?: string
          policy_type?: string
          premium?: number | null
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          errors: Json | null
          id: string
          integration_id: string | null
          metadata: Json | null
          provider: string
          records_failed: number
          records_synced: number
          started_at: string
          status: string
          sync_type: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          provider: string
          records_failed?: number
          records_synced?: number
          started_at?: string
          status?: string
          sync_type?: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          provider?: string
          records_failed?: number
          records_synced?: number
          started_at?: string
          status?: string
          sync_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "external_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          provider: string
          retry_count: number
          tenant_id: string
          webhook_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          provider: string
          retry_count?: number
          tenant_id: string
          webhook_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          provider?: string
          retry_count?: number
          tenant_id?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_webhook_events_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "integration_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_webhooks: {
        Row: {
          created_at: string
          endpoint_url: string
          events: string[]
          id: string
          integration_id: string
          is_active: boolean
          secret: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          endpoint_url: string
          events?: string[]
          id?: string
          integration_id: string
          is_active?: boolean
          secret?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          endpoint_url?: string
          events?: string[]
          id?: string
          integration_id?: string
          is_active?: boolean
          secret?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_webhooks_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "external_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inter_fund_transfers: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          association_id: string
          created_at: string
          created_by: string | null
          description: string | null
          from_fund_id: string
          id: string
          journal_entry_id: string | null
          status: string
          tenant_id: string
          to_fund_id: string
          transfer_date: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          association_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          from_fund_id: string
          id?: string
          journal_entry_id?: string | null
          status?: string
          tenant_id: string
          to_fund_id: string
          transfer_date: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          association_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          from_fund_id?: string
          id?: string
          journal_entry_id?: string | null
          status?: string
          tenant_id?: string
          to_fund_id?: string
          transfer_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "inter_fund_transfers_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inter_fund_transfers_from_fund_id_fkey"
            columns: ["from_fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inter_fund_transfers_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inter_fund_transfers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inter_fund_transfers_to_fund_id_fkey"
            columns: ["to_fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          assigned_at: string | null
          assigned_to_contact_id: string | null
          assigned_to_property_id: string | null
          association_id: string
          barcode: string | null
          category_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json
          name: string
          notes: string | null
          quantity: number
          serial_number: string | null
          status: string
          storage_location: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to_contact_id?: string | null
          assigned_to_property_id?: string | null
          association_id: string
          barcode?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          notes?: string | null
          quantity?: number
          serial_number?: string | null
          status?: string
          storage_location?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to_contact_id?: string | null
          assigned_to_property_id?: string | null
          association_id?: string
          barcode?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          notes?: string | null
          quantity?: number
          serial_number?: string | null
          status?: string
          storage_location?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_assigned_to_contact_id_fkey"
            columns: ["assigned_to_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_assigned_to_property_id_fkey"
            columns: ["assigned_to_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          contact_id: string | null
          created_at: string
          id: string
          item_id: string
          notes: string | null
          performed_by: string | null
          property_id: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          performed_by?: string | null
          property_id?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          performed_by?: string | null
          property_id?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_imports: {
        Row: {
          ap_bill_id: string | null
          association_id: string
          created_at: string
          document_path: string | null
          due_date: string | null
          external_id: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          line_items: Json
          ocr_confidence: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_system: string
          status: string
          tenant_id: string
          total_amount: number | null
          vendor_id: string | null
          vendor_name_raw: string | null
        }
        Insert: {
          ap_bill_id?: string | null
          association_id: string
          created_at?: string
          document_path?: string | null
          due_date?: string | null
          external_id?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          line_items?: Json
          ocr_confidence?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_system: string
          status?: string
          tenant_id: string
          total_amount?: number | null
          vendor_id?: string | null
          vendor_name_raw?: string | null
        }
        Update: {
          ap_bill_id?: string | null
          association_id?: string
          created_at?: string
          document_path?: string | null
          due_date?: string | null
          external_id?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          line_items?: Json
          ocr_confidence?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_system?: string
          status?: string
          tenant_id?: string
          total_amount?: number | null
          vendor_id?: string | null
          vendor_name_raw?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_imports_ap_bill_id_fkey"
            columns: ["ap_bill_id"]
            isOneToOne: false
            referencedRelation: "ap_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_imports_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_imports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_imports_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          association_id: string
          created_at: string
          created_by: string | null
          description: string | null
          entry_date: string
          id: string
          reference_number: string | null
          source: string | null
          source_id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date: string
          id?: string
          reference_number?: string | null
          source?: string | null
          source_id?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          reference_number?: string | null
          source?: string | null
          source_id?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          contact_id: string | null
          created_at: string
          credit: number
          debit: number
          description: string | null
          id: string
          journal_entry_id: string
          property_id: string | null
          tenant_id: string
        }
        Insert: {
          account_id: string
          contact_id?: string | null
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id: string
          property_id?: string | null
          tenant_id: string
        }
        Update: {
          account_id?: string
          contact_id?: string | null
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
          property_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "journal_lines_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_rules: {
        Row: {
          county_id: string | null
          effective_date: string | null
          id: string
          notes: string | null
          rule_key: string
          rule_type: string
          rule_value: string
          state: string
          statute_citation: string | null
        }
        Insert: {
          county_id?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          rule_key: string
          rule_type: string
          rule_value: string
          state?: string
          statute_citation?: string | null
        }
        Update: {
          county_id?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          rule_key?: string
          rule_type?: string
          rule_value?: string
          state?: string
          statute_citation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_rules_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_snapshots: {
        Row: {
          avg_response_hours: number | null
          avg_work_order_days: number | null
          cash_on_hand: number | null
          collection_rate: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          monthly_revenue: number | null
          open_requests: number | null
          open_violations: number | null
          open_work_orders: number | null
          outstanding_ar: number | null
          period: string
          snapshot_date: string
          tenant_id: string
          total_associations: number | null
          total_employees: number | null
          total_properties: number | null
          total_units: number | null
          violations_resolved_this_period: number | null
          work_orders_completed_this_period: number | null
          ytd_revenue: number | null
        }
        Insert: {
          avg_response_hours?: number | null
          avg_work_order_days?: number | null
          cash_on_hand?: number | null
          collection_rate?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          monthly_revenue?: number | null
          open_requests?: number | null
          open_violations?: number | null
          open_work_orders?: number | null
          outstanding_ar?: number | null
          period: string
          snapshot_date: string
          tenant_id: string
          total_associations?: number | null
          total_employees?: number | null
          total_properties?: number | null
          total_units?: number | null
          violations_resolved_this_period?: number | null
          work_orders_completed_this_period?: number | null
          ytd_revenue?: number | null
        }
        Update: {
          avg_response_hours?: number | null
          avg_work_order_days?: number | null
          cash_on_hand?: number | null
          collection_rate?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          monthly_revenue?: number | null
          open_requests?: number | null
          open_violations?: number | null
          open_work_orders?: number | null
          outstanding_ar?: number | null
          period?: string
          snapshot_date?: string
          tenant_id?: string
          total_associations?: number | null
          total_employees?: number | null
          total_properties?: number | null
          total_units?: number | null
          violations_resolved_this_period?: number | null
          work_orders_completed_this_period?: number | null
          ytd_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      late_fee_policies: {
        Row: {
          amount: number | null
          association_id: string
          created_at: string
          fee_type: string
          grace_period_days: number
          id: string
          is_active: boolean
          min_balance: number
          name: string
          rate: number | null
          revenue_account_id: string
          tenant_id: string
        }
        Insert: {
          amount?: number | null
          association_id: string
          created_at?: string
          fee_type: string
          grace_period_days?: number
          id?: string
          is_active?: boolean
          min_balance?: number
          name: string
          rate?: number | null
          revenue_account_id: string
          tenant_id: string
        }
        Update: {
          amount?: number | null
          association_id?: string
          created_at?: string
          fee_type?: string
          grace_period_days?: number
          id?: string
          is_active?: boolean
          min_balance?: number
          name?: string
          rate?: number | null
          revenue_account_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "late_fee_policies_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_fee_policies_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_fee_policies_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "late_fee_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          lead_id: string
          metadata: Json
          occurred_at: string
          tenant_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id: string
          metadata?: Json
          occurred_at?: string
          tenant_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string
          metadata?: Json
          occurred_at?: string
          tenant_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address_line1: string | null
          assigned_to: string | null
          association_id: string | null
          association_name: string
          association_type: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_title: string | null
          county: string | null
          created_at: string
          created_by: string | null
          estimated_annual_value: number | null
          estimated_monthly_fee: number | null
          id: string
          lost_at: string | null
          lost_reason: string | null
          metadata: Json
          notes: string | null
          source_id: string | null
          stage: string
          stage_changed_at: string
          state: string | null
          tenant_id: string
          unit_count: number | null
          updated_at: string
          won_at: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          assigned_to?: string | null
          association_id?: string | null
          association_name: string
          association_type?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_title?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          estimated_annual_value?: number | null
          estimated_monthly_fee?: number | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          metadata?: Json
          notes?: string | null
          source_id?: string | null
          stage?: string
          stage_changed_at?: string
          state?: string | null
          tenant_id: string
          unit_count?: number | null
          updated_at?: string
          won_at?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          assigned_to?: string | null
          association_id?: string | null
          association_name?: string
          association_type?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_title?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          estimated_annual_value?: number | null
          estimated_monthly_fee?: number | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          metadata?: Json
          notes?: string | null
          source_id?: string | null
          stage?: string
          stage_changed_at?: string
          state?: string | null
          tenant_id?: string
          unit_count?: number | null
          updated_at?: string
          won_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_templates: {
        Row: {
          association_id: string | null
          body_template: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          merge_fields: Json
          name: string
          subject: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          association_id?: string | null
          body_template: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          merge_fields?: Json
          name: string
          subject: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          association_id?: string | null
          body_template?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          merge_fields?: Json
          name?: string
          subject?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_templates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lien_records: {
        Row: {
          amount: number
          association_id: string
          attorney_firm: string | null
          attorney_name: string | null
          county: string | null
          created_at: string
          filed_date: string | null
          id: string
          lien_type: string
          notes: string | null
          property_id: string
          recording_date: string | null
          recording_number: string | null
          satisfied_date: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          association_id: string
          attorney_firm?: string | null
          attorney_name?: string | null
          county?: string | null
          created_at?: string
          filed_date?: string | null
          id?: string
          lien_type?: string
          notes?: string | null
          property_id: string
          recording_date?: string | null
          recording_number?: string | null
          satisfied_date?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          association_id?: string
          attorney_firm?: string | null
          attorney_name?: string | null
          county?: string | null
          created_at?: string
          filed_date?: string | null
          id?: string
          lien_type?: string
          notes?: string | null
          property_id?: string
          recording_date?: string | null
          recording_number?: string | null
          satisfied_date?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lien_records_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      liens: {
        Row: {
          association_id: string
          attorney_email: string | null
          attorney_fees: number | null
          attorney_file_number: string | null
          attorney_firm: string | null
          attorney_name: string | null
          attorney_phone: string | null
          book_page: string | null
          county: string | null
          covered_charge_ids: string[] | null
          created_at: string | null
          created_by: string | null
          demand_letter_date: string | null
          documents: Json | null
          filed_date: string | null
          foreclosure_case_number: string | null
          foreclosure_referred_date: string | null
          id: string
          instrument_number: string | null
          interest_amount: number | null
          lien_amount: number
          lien_type: string
          metadata: Json | null
          notes: string | null
          notice_of_intent_date: string | null
          other_fees: number | null
          paid_in_full_date: string | null
          payment_plan_id: string | null
          principal_amount: number
          property_id: string
          recorded_date: string | null
          release_date: string | null
          settlement_amount: number | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          association_id: string
          attorney_email?: string | null
          attorney_fees?: number | null
          attorney_file_number?: string | null
          attorney_firm?: string | null
          attorney_name?: string | null
          attorney_phone?: string | null
          book_page?: string | null
          county?: string | null
          covered_charge_ids?: string[] | null
          created_at?: string | null
          created_by?: string | null
          demand_letter_date?: string | null
          documents?: Json | null
          filed_date?: string | null
          foreclosure_case_number?: string | null
          foreclosure_referred_date?: string | null
          id?: string
          instrument_number?: string | null
          interest_amount?: number | null
          lien_amount: number
          lien_type?: string
          metadata?: Json | null
          notes?: string | null
          notice_of_intent_date?: string | null
          other_fees?: number | null
          paid_in_full_date?: string | null
          payment_plan_id?: string | null
          principal_amount: number
          property_id: string
          recorded_date?: string | null
          release_date?: string | null
          settlement_amount?: number | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          attorney_email?: string | null
          attorney_fees?: number | null
          attorney_file_number?: string | null
          attorney_firm?: string | null
          attorney_name?: string | null
          attorney_phone?: string | null
          book_page?: string | null
          county?: string | null
          covered_charge_ids?: string[] | null
          created_at?: string | null
          created_by?: string | null
          demand_letter_date?: string | null
          documents?: Json | null
          filed_date?: string | null
          foreclosure_case_number?: string | null
          foreclosure_referred_date?: string | null
          id?: string
          instrument_number?: string | null
          interest_amount?: number | null
          lien_amount?: number
          lien_type?: string
          metadata?: Json | null
          notes?: string | null
          notice_of_intent_date?: string | null
          other_fees?: number | null
          paid_in_full_date?: string | null
          payment_plan_id?: string | null
          principal_amount?: number
          property_id?: string
          recorded_date?: string | null
          release_date?: string | null
          settlement_amount?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liens_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liens_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lockbox_batches: {
        Row: {
          id: string
          tenant_id: string
          association_id: string | null
          file_name: string
          upload_date: string
          status: string
          matched_count: number
          exception_count: number
          total_amount: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          association_id?: string | null
          file_name: string
          upload_date?: string
          status?: string
          matched_count?: number
          exception_count?: number
          total_amount?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          association_id?: string | null
          file_name?: string
          upload_date?: string
          status?: string
          matched_count?: number
          exception_count?: number
          total_amount?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lockbox_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lockbox_batches_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lockbox_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lockbox_items: {
        Row: {
          id: string
          batch_id: string
          tenant_id: string
          lockbox_date: string
          association_external_id: string
          account_external_id: string
          check_amount: number
          check_number: string
          matched_owner_id: string | null
          matched_charge_id: string | null
          status: string
          match_method: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          tenant_id: string
          lockbox_date: string
          association_external_id: string
          account_external_id: string
          check_amount: number
          check_number: string
          matched_owner_id?: string | null
          matched_charge_id?: string | null
          status?: string
          match_method?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          batch_id?: string
          tenant_id?: string
          lockbox_date?: string
          association_external_id?: string
          account_external_id?: string
          check_amount?: number
          check_number?: string
          matched_owner_id?: string | null
          matched_charge_id?: string | null
          status?: string
          match_method?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lockbox_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "lockbox_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lockbox_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lockbox_items_matched_owner_id_fkey"
            columns: ["matched_owner_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_occupancies: {
        Row: {
          contact_id: string | null
          created_at: string
          id: string
          is_current: boolean
          lot_id: string
          move_in_date: string | null
          move_out_date: string | null
          notes: string | null
          occupancy_type: string | null
          tenant_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          id?: string
          is_current?: boolean
          lot_id: string
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          occupancy_type?: string | null
          tenant_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          id?: string
          is_current?: boolean
          lot_id?: string
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          occupancy_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lot_occupancies_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_occupancies_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_occupancies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          annual_lot_rent: number | null
          association_id: string
          block: string | null
          created_at: string
          electric_amp_service: number | null
          hangar_door_height_ft: number | null
          hangar_door_width_ft: number | null
          hangar_type: string | null
          has_cable: boolean
          has_electric: boolean
          has_natural_gas: boolean
          has_sewer: boolean
          has_water: boolean
          has_wifi: boolean
          id: string
          lot_address: string | null
          lot_length_ft: number | null
          lot_number: string
          lot_type: string
          lot_width_ft: number | null
          max_rv_height_ft: number | null
          max_rv_length_ft: number | null
          metadata: Json
          monthly_lot_rent: number | null
          notes: string | null
          property_id: string | null
          section: string | null
          slide_outs_allowed: number | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          annual_lot_rent?: number | null
          association_id: string
          block?: string | null
          created_at?: string
          electric_amp_service?: number | null
          hangar_door_height_ft?: number | null
          hangar_door_width_ft?: number | null
          hangar_type?: string | null
          has_cable?: boolean
          has_electric?: boolean
          has_natural_gas?: boolean
          has_sewer?: boolean
          has_water?: boolean
          has_wifi?: boolean
          id?: string
          lot_address?: string | null
          lot_length_ft?: number | null
          lot_number: string
          lot_type?: string
          lot_width_ft?: number | null
          max_rv_height_ft?: number | null
          max_rv_length_ft?: number | null
          metadata?: Json
          monthly_lot_rent?: number | null
          notes?: string | null
          property_id?: string | null
          section?: string | null
          slide_outs_allowed?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          annual_lot_rent?: number | null
          association_id?: string
          block?: string | null
          created_at?: string
          electric_amp_service?: number | null
          hangar_door_height_ft?: number | null
          hangar_door_width_ft?: number | null
          hangar_type?: string | null
          has_cable?: boolean
          has_electric?: boolean
          has_natural_gas?: boolean
          has_sewer?: boolean
          has_water?: boolean
          has_wifi?: boolean
          id?: string
          lot_address?: string | null
          lot_length_ft?: number | null
          lot_number?: string
          lot_type?: string
          lot_width_ft?: number | null
          max_rv_height_ft?: number | null
          max_rv_length_ft?: number | null
          metadata?: Json
          monthly_lot_rent?: number | null
          notes?: string | null
          property_id?: string | null
          section?: string | null
          slide_outs_allowed?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_log: {
        Row: {
          completed_at: string
          completed_by: string | null
          condition_after: string | null
          cost: number | null
          created_at: string
          id: string
          notes: string | null
          photos: Json
          schedule_id: string
          tenant_id: string
          work_order_id: string | null
        }
        Insert: {
          completed_at?: string
          completed_by?: string | null
          condition_after?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          photos?: Json
          schedule_id: string
          tenant_id: string
          work_order_id?: string | null
        }
        Update: {
          completed_at?: string
          completed_by?: string | null
          condition_after?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          photos?: Json
          schedule_id?: string
          tenant_id?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_log_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "maintenance_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_log_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          association_id: string
          category: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          id: string
          notes: string | null
          photos: Json | null
          priority: string | null
          property_id: string | null
          status: string | null
          submitted_at: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          association_id: string
          category?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          photos?: Json | null
          priority?: string | null
          property_id?: string | null
          status?: string | null
          submitted_at?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          category?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          photos?: Json | null
          priority?: string | null
          property_id?: string | null
          status?: string | null
          submitted_at?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          asset_id: string | null
          association_id: string
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          description: string | null
          estimated_cost: number | null
          frequency: string
          id: string
          is_active: boolean
          last_completed: string | null
          month_of_year: number | null
          next_due: string | null
          priority: string
          tenant_id: string
          title: string
          vendor_id: string | null
        }
        Insert: {
          asset_id?: string | null
          association_id: string
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          estimated_cost?: number | null
          frequency: string
          id?: string
          is_active?: boolean
          last_completed?: string | null
          month_of_year?: number | null
          next_due?: string | null
          priority?: string
          tenant_id: string
          title: string
          vendor_id?: string | null
        }
        Update: {
          asset_id?: string | null
          association_id?: string
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          estimated_cost?: number | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_completed?: string | null
          month_of_year?: number | null
          next_due?: string | null
          priority?: string
          tenant_id?: string
          title?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      management_companies: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          default_management_fee: number | null
          default_per_unit_fee: number | null
          ein: string | null
          email: string | null
          fiscal_year_start_month: number | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          tenant_id: string
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          default_management_fee?: number | null
          default_per_unit_fee?: number | null
          ein?: string | null
          email?: string | null
          fiscal_year_start_month?: number | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          default_management_fee?: number | null
          default_per_unit_fee?: number | null
          ein?: string | null
          email?: string | null
          fiscal_year_start_month?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      management_company_accounts: {
        Row: {
          account_number: string
          account_type: string
          balance: number | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          sub_type: string | null
          tenant_id: string
        }
        Insert: {
          account_number: string
          account_type: string
          balance?: number | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sub_type?: string | null
          tenant_id: string
        }
        Update: {
          account_number?: string
          account_type?: string
          balance?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sub_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_company_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_company_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "management_company_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_company_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      management_company_expenses: {
        Row: {
          account_id: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string | null
          check_number: string | null
          company_id: string
          created_at: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          receipt_url: string | null
          status: string
          tenant_id: string
          vendor_name: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          check_number?: string | null
          company_id: string
          created_at?: string
          description: string
          expense_date: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string
          tenant_id: string
          vendor_name?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          check_number?: string | null
          company_id?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string
          tenant_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_company_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "management_company_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_company_expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_company_expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      management_company_journal_entries: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          id: string
          reference_number: string | null
          source: string | null
          source_id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          entry_date: string
          id?: string
          reference_number?: string | null
          source?: string | null
          source_id?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          id?: string
          reference_number?: string | null
          source?: string | null
          source_id?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_company_journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_company_journal_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      management_company_journal_lines: {
        Row: {
          account_id: string
          association_id: string | null
          credit: number | null
          debit: number | null
          description: string | null
          id: string
          journal_entry_id: string
          tenant_id: string
        }
        Insert: {
          account_id: string
          association_id?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
          tenant_id: string
        }
        Update: {
          account_id?: string
          association_id?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_company_journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "management_company_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_company_journal_lines_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_company_journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "management_company_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_company_journal_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      management_fee_schedules: {
        Row: {
          amount: number
          association_id: string
          company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          fee_type: string
          frequency: string
          id: string
          is_active: boolean | null
          notes: string | null
          per_unit_amount: number | null
          revenue_account_id: string | null
          start_date: string
          tenant_id: string
        }
        Insert: {
          amount: number
          association_id: string
          company_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          fee_type: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          per_unit_amount?: number | null
          revenue_account_id?: string | null
          start_date: string
          tenant_id: string
        }
        Update: {
          amount?: number
          association_id?: string
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          fee_type?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          per_unit_amount?: number | null
          revenue_account_id?: string | null
          start_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_fee_schedules_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_fee_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_fee_schedules_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "management_company_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_fee_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      management_revenue_entries: {
        Row: {
          amount: number
          association_id: string
          company_id: string
          created_at: string
          fee_schedule_id: string | null
          id: string
          invoice_number: string | null
          invoiced_at: string | null
          journal_entry_id: string | null
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          recognized_at: string | null
          status: string
          tenant_id: string
          unit_count: number | null
        }
        Insert: {
          amount: number
          association_id: string
          company_id: string
          created_at?: string
          fee_schedule_id?: string | null
          id?: string
          invoice_number?: string | null
          invoiced_at?: string | null
          journal_entry_id?: string | null
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          recognized_at?: string | null
          status?: string
          tenant_id: string
          unit_count?: number | null
        }
        Update: {
          amount?: number
          association_id?: string
          company_id?: string
          created_at?: string
          fee_schedule_id?: string | null
          id?: string
          invoice_number?: string | null
          invoiced_at?: string | null
          journal_entry_id?: string | null
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          recognized_at?: string | null
          status?: string
          tenant_id?: string
          unit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "management_revenue_entries_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_revenue_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_revenue_entries_fee_schedule_id_fkey"
            columns: ["fee_schedule_id"]
            isOneToOne: false
            referencedRelation: "management_fee_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_revenue_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_ce_records: {
        Row: {
          category: string
          certificate_url: string | null
          completion_date: string
          course_name: string
          created_at: string
          hours: number
          id: string
          portfolio_id: string
          provider: string | null
          tenant_id: string
        }
        Insert: {
          category?: string
          certificate_url?: string | null
          completion_date: string
          course_name: string
          created_at?: string
          hours: number
          id?: string
          portfolio_id: string
          provider?: string | null
          tenant_id: string
        }
        Update: {
          category?: string
          certificate_url?: string | null
          completion_date?: string
          course_name?: string
          created_at?: string
          hours?: number
          id?: string
          portfolio_id?: string
          provider?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_ce_records_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "manager_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_ce_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_performance_snapshots: {
        Row: {
          created_at: string
          deliverable_score: number | null
          financial_score: number | null
          id: string
          metrics: Json
          overall_score: number | null
          period_end: string
          period_start: string
          portfolio_id: string
          response_score: number | null
          satisfaction_score: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          deliverable_score?: number | null
          financial_score?: number | null
          id?: string
          metrics?: Json
          overall_score?: number | null
          period_end: string
          period_start: string
          portfolio_id: string
          response_score?: number | null
          satisfaction_score?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          deliverable_score?: number | null
          financial_score?: number | null
          id?: string
          metrics?: Json
          overall_score?: number | null
          period_end?: string
          period_start?: string
          portfolio_id?: string
          response_score?: number | null
          satisfaction_score?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_performance_snapshots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "manager_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_performance_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_portfolio_assignments: {
        Row: {
          assigned_at: string
          association_id: string
          created_at: string
          id: string
          portfolio_id: string
          role: string
          status: string
          tenant_id: string
        }
        Insert: {
          assigned_at?: string
          association_id: string
          created_at?: string
          id?: string
          portfolio_id: string
          role?: string
          status?: string
          tenant_id: string
        }
        Update: {
          assigned_at?: string
          association_id?: string
          created_at?: string
          id?: string
          portfolio_id?: string
          role?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_portfolio_assignments_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_portfolio_assignments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "manager_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_portfolio_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_portfolios: {
        Row: {
          ce_hours_completed: number
          ce_hours_required: number
          created_at: string
          id: string
          license_expiration: string | null
          license_number: string | null
          max_associations: number | null
          notes: string | null
          specializations: string[] | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ce_hours_completed?: number
          ce_hours_required?: number
          created_at?: string
          id?: string
          license_expiration?: string | null
          license_number?: string | null
          max_associations?: number | null
          notes?: string | null
          specializations?: string[] | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ce_hours_completed?: number
          ce_hours_required?: number
          created_at?: string
          id?: string
          license_expiration?: string | null
          license_number?: string | null
          max_associations?: number | null
          notes?: string | null
          specializations?: string[] | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_portfolios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_transition_steps: {
        Row: {
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          status: string
          step_order: number
          tenant_id: string
          title: string
          transition_id: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          status?: string
          step_order: number
          tenant_id: string
          title: string
          transition_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          status?: string
          step_order?: number
          tenant_id?: string
          title?: string
          transition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_transition_steps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_transition_steps_transition_id_fkey"
            columns: ["transition_id"]
            isOneToOne: false
            referencedRelation: "manager_transitions"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_transitions: {
        Row: {
          association_id: string
          completed_at: string | null
          created_at: string
          from_portfolio_id: string
          id: string
          initiated_at: string
          initiated_by: string | null
          notes: string | null
          reason: string
          status: string
          target_completion_date: string | null
          tenant_id: string
          to_portfolio_id: string
        }
        Insert: {
          association_id: string
          completed_at?: string | null
          created_at?: string
          from_portfolio_id: string
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          notes?: string | null
          reason?: string
          status?: string
          target_completion_date?: string | null
          tenant_id: string
          to_portfolio_id: string
        }
        Update: {
          association_id?: string
          completed_at?: string | null
          created_at?: string
          from_portfolio_id?: string
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          notes?: string | null
          reason?: string
          status?: string
          target_completion_date?: string | null
          tenant_id?: string
          to_portfolio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_transitions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_transitions_from_portfolio_id_fkey"
            columns: ["from_portfolio_id"]
            isOneToOne: false
            referencedRelation: "manager_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_transitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_transitions_to_portfolio_id_fkey"
            columns: ["to_portfolio_id"]
            isOneToOne: false
            referencedRelation: "manager_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      marina_pumpout_logs: {
        Row: {
          fee_charged: number | null
          gallons: number | null
          id: string
          notes: string | null
          serviced_at: string
          slip_id: string
          technician_id: string | null
          tenant_id: string
          vessel_id: string | null
        }
        Insert: {
          fee_charged?: number | null
          gallons?: number | null
          id?: string
          notes?: string | null
          serviced_at?: string
          slip_id: string
          technician_id?: string | null
          tenant_id: string
          vessel_id?: string | null
        }
        Update: {
          fee_charged?: number | null
          gallons?: number | null
          id?: string
          notes?: string | null
          serviced_at?: string
          slip_id?: string
          technician_id?: string | null
          tenant_id?: string
          vessel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marina_pumpout_logs_slip_id_fkey"
            columns: ["slip_id"]
            isOneToOne: false
            referencedRelation: "marina_slips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marina_pumpout_logs_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "marina_vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      marina_slips: {
        Row: {
          association_id: string
          beam_ft: number | null
          created_at: string
          depth_ft: number | null
          has_electric: boolean | null
          has_sewer: boolean | null
          has_water: boolean | null
          id: string
          length_ft: number | null
          monthly_rate: number | null
          notes: string | null
          slip_number: string
          slip_type: string
          status: string
          tenant_id: string
        }
        Insert: {
          association_id: string
          beam_ft?: number | null
          created_at?: string
          depth_ft?: number | null
          has_electric?: boolean | null
          has_sewer?: boolean | null
          has_water?: boolean | null
          id?: string
          length_ft?: number | null
          monthly_rate?: number | null
          notes?: string | null
          slip_number: string
          slip_type?: string
          status?: string
          tenant_id: string
        }
        Update: {
          association_id?: string
          beam_ft?: number | null
          created_at?: string
          depth_ft?: number | null
          has_electric?: boolean | null
          has_sewer?: boolean | null
          has_water?: boolean | null
          id?: string
          length_ft?: number | null
          monthly_rate?: number | null
          notes?: string | null
          slip_number?: string
          slip_type?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marina_slips_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      marina_vessels: {
        Row: {
          contact_id: string
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          insurance_carrier: string | null
          insurance_expiry: string | null
          insurance_policy: string | null
          is_liveaboard: boolean | null
          length_ft: number | null
          make: string | null
          model: string | null
          registration_number: string | null
          slip_id: string | null
          state_registered: string | null
          tenant_id: string
          vessel_name: string
          vessel_type: string | null
          year: number | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          insurance_carrier?: string | null
          insurance_expiry?: string | null
          insurance_policy?: string | null
          is_liveaboard?: boolean | null
          length_ft?: number | null
          make?: string | null
          model?: string | null
          registration_number?: string | null
          slip_id?: string | null
          state_registered?: string | null
          tenant_id: string
          vessel_name: string
          vessel_type?: string | null
          year?: number | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          insurance_carrier?: string | null
          insurance_expiry?: string | null
          insurance_policy?: string | null
          is_liveaboard?: boolean | null
          length_ft?: number | null
          make?: string | null
          model?: string | null
          registration_number?: string | null
          slip_id?: string | null
          state_registered?: string | null
          tenant_id?: string
          vessel_name?: string
          vessel_type?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marina_vessels_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marina_vessels_slip_id_fkey"
            columns: ["slip_id"]
            isOneToOne: false
            referencedRelation: "marina_slips"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_agenda_items: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          item_type: string
          meeting_id: string
          order_number: number
          presenter: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          item_type?: string
          meeting_id: string
          order_number: number
          presenter?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          item_type?: string
          meeting_id?: string
          order_number?: number
          presenter?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          attended: boolean
          contact_id: string
          created_at: string
          id: string
          meeting_id: string
          role: string
          tenant_id: string
        }
        Insert: {
          attended?: boolean
          contact_id: string
          created_at?: string
          id?: string
          meeting_id: string
          role?: string
          tenant_id: string
        }
        Update: {
          attended?: boolean
          contact_id?: string
          created_at?: string
          id?: string
          meeting_id?: string
          role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_votes: {
        Row: {
          abstain_count: number
          agenda_item_id: string
          created_at: string
          id: string
          motion: string
          no_count: number
          notes: string | null
          result: string
          tenant_id: string
          yes_count: number
        }
        Insert: {
          abstain_count?: number
          agenda_item_id: string
          created_at?: string
          id?: string
          motion: string
          no_count?: number
          notes?: string | null
          result: string
          tenant_id: string
          yes_count?: number
        }
        Update: {
          abstain_count?: number
          agenda_item_id?: string
          created_at?: string
          id?: string
          motion?: string
          no_count?: number
          notes?: string | null
          result?: string
          tenant_id?: string
          yes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "meeting_votes_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "meeting_agenda_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_votes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          association_id: string
          calendar_event_id: string | null
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          location: string | null
          meeting_date: string
          meeting_type: string
          minutes_document_id: string | null
          notes: string | null
          start_time: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
          virtual_link: string | null
        }
        Insert: {
          association_id: string
          calendar_event_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          meeting_type?: string
          minutes_document_id?: string | null
          notes?: string | null
          start_time?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
          virtual_link?: string | null
        }
        Update: {
          association_id?: string
          calendar_event_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_type?: string
          minutes_document_id?: string | null
          notes?: string | null
          start_time?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_minutes_document_id_fkey"
            columns: ["minutes_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_readings: {
        Row: {
          amount_billed: number | null
          consumption: number | null
          created_at: string
          id: string
          lot_id: string
          meter_type: string
          notes: string | null
          previous_reading: number | null
          rate_per_unit: number | null
          read_by: string | null
          reading_date: string
          reading_value: number
          tenant_id: string
          units: string
        }
        Insert: {
          amount_billed?: number | null
          consumption?: number | null
          created_at?: string
          id?: string
          lot_id: string
          meter_type: string
          notes?: string | null
          previous_reading?: number | null
          rate_per_unit?: number | null
          read_by?: string | null
          reading_date: string
          reading_value: number
          tenant_id: string
          units?: string
        }
        Update: {
          amount_billed?: number | null
          consumption?: number | null
          created_at?: string
          id?: string
          lot_id?: string
          meter_type?: string
          notes?: string | null
          previous_reading?: number | null
          rate_per_unit?: number | null
          read_by?: string | null
          reading_date?: string
          reading_value?: number
          tenant_id?: string
          units?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_inspections: {
        Row: {
          address: string | null
          association_id: string
          building_name: string
          created_at: string
          created_by: string | null
          findings: string | null
          id: string
          inspection_date: string | null
          inspector_license: string | null
          inspector_name: string | null
          next_due_date: string | null
          phase: string
          remediation_deadline: string | null
          report_document_id: string | null
          status: string
          stories: number
          tenant_id: string
          total_units: number | null
          year_built: number
        }
        Insert: {
          address?: string | null
          association_id: string
          building_name: string
          created_at?: string
          created_by?: string | null
          findings?: string | null
          id?: string
          inspection_date?: string | null
          inspector_license?: string | null
          inspector_name?: string | null
          next_due_date?: string | null
          phase?: string
          remediation_deadline?: string | null
          report_document_id?: string | null
          status?: string
          stories: number
          tenant_id: string
          total_units?: number | null
          year_built: number
        }
        Update: {
          address?: string | null
          association_id?: string
          building_name?: string
          created_at?: string
          created_by?: string | null
          findings?: string | null
          id?: string
          inspection_date?: string | null
          inspector_license?: string | null
          inspector_name?: string | null
          next_due_date?: string | null
          phase?: string
          remediation_deadline?: string | null
          report_document_id?: string | null
          status?: string
          stories?: number
          tenant_id?: string
          total_units?: number | null
          year_built?: number
        }
        Relationships: [
          {
            foreignKeyName: "milestone_inspections_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_inspections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          announcement: boolean | null
          arc_status_change: boolean | null
          ballot_closed: boolean | null
          ballot_opened: boolean | null
          ballot_reminder: boolean | null
          document_published: boolean | null
          email: boolean | null
          id: string
          in_app: boolean | null
          maintenance_due: boolean | null
          meeting_reminder: boolean | null
          payment_due: boolean | null
          payment_late: boolean | null
          payment_received: boolean | null
          push: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          quiet_hours_timezone: string | null
          sms: boolean | null
          tenant_id: string
          user_id: string
          violation_closed: boolean | null
          violation_hearing_scheduled: boolean | null
          violation_issued: boolean | null
          work_order_completed: boolean | null
          work_order_created: boolean | null
          work_order_status_change: boolean | null
        }
        Insert: {
          announcement?: boolean | null
          arc_status_change?: boolean | null
          ballot_closed?: boolean | null
          ballot_opened?: boolean | null
          ballot_reminder?: boolean | null
          document_published?: boolean | null
          email?: boolean | null
          id?: string
          in_app?: boolean | null
          maintenance_due?: boolean | null
          meeting_reminder?: boolean | null
          payment_due?: boolean | null
          payment_late?: boolean | null
          payment_received?: boolean | null
          push?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string | null
          sms?: boolean | null
          tenant_id: string
          user_id: string
          violation_closed?: boolean | null
          violation_hearing_scheduled?: boolean | null
          violation_issued?: boolean | null
          work_order_completed?: boolean | null
          work_order_created?: boolean | null
          work_order_status_change?: boolean | null
        }
        Update: {
          announcement?: boolean | null
          arc_status_change?: boolean | null
          ballot_closed?: boolean | null
          ballot_opened?: boolean | null
          ballot_reminder?: boolean | null
          document_published?: boolean | null
          email?: boolean | null
          id?: string
          in_app?: boolean | null
          maintenance_due?: boolean | null
          meeting_reminder?: boolean | null
          payment_due?: boolean | null
          payment_late?: boolean | null
          payment_received?: boolean | null
          push?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string | null
          sms?: boolean | null
          tenant_id?: string
          user_id?: string
          violation_closed?: boolean | null
          violation_hearing_scheduled?: boolean | null
          violation_issued?: boolean | null
          work_order_completed?: boolean | null
          work_order_created?: boolean | null
          work_order_status_change?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          channel: string | null
          created_at: string
          error_message: string | null
          event_type: string | null
          id: string
          is_read: boolean
          link: string | null
          metadata: Json | null
          read_at: string | null
          resource_id: string | null
          resource_type: string | null
          sent_at: string | null
          source_id: string | null
          status: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          channel?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          sent_at?: string | null
          source_id?: string | null
          status?: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          channel?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          sent_at?: string | null
          source_id?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      occupancies: {
        Row: {
          contact_id: string
          created_at: string
          end_date: string | null
          id: string
          is_primary: boolean
          occupancy_type: string
          property_id: string
          start_date: string
          tenant_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean
          occupancy_type: string
          property_id: string
          start_date: string
          tenant_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean
          occupancy_type?: string
          property_id?: string
          start_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "occupancies_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupancies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupancies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_processes: {
        Row: {
          association_id: string
          checklist_progress: Json
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          id: string
          key_fob_issued: boolean
          move_date: string | null
          move_type: string
          notes: string | null
          parking_assigned: string | null
          property_id: string
          screening_data: Json | null
          screening_status: string | null
          status: string
          template_id: string | null
          tenant_id: string
          welcome_packet_sent: boolean
        }
        Insert: {
          association_id: string
          checklist_progress?: Json
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key_fob_issued?: boolean
          move_date?: string | null
          move_type: string
          notes?: string | null
          parking_assigned?: string | null
          property_id: string
          screening_data?: Json | null
          screening_status?: string | null
          status?: string
          template_id?: string | null
          tenant_id: string
          welcome_packet_sent?: boolean
        }
        Update: {
          association_id?: string
          checklist_progress?: Json
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key_fob_issued?: boolean
          move_date?: string | null
          move_type?: string
          notes?: string | null
          parking_assigned?: string | null
          property_id?: string
          screening_data?: Json | null
          screening_status?: string | null
          status?: string
          template_id?: string | null
          tenant_id?: string
          welcome_packet_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_processes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_processes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_processes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_processes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_processes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          association_id: string
          created_at: string
          id: string
          is_active: boolean
          items: Json
          move_type: string
          name: string
          tenant_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json
          move_type: string
          name: string
          tenant_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json
          move_type?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_templates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      oncall_schedule: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_primary: boolean | null
          notes: string | null
          office: string | null
          start_date: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          office?: string | null
          start_date: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          office?: string | null
          start_date?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oncall_schedule_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oncall_schedule_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_payment_intents: {
        Row: {
          amount: number
          association_id: string
          contact_id: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          journal_entry_id: string | null
          metadata: Json
          net_amount: number
          paid_at: string | null
          payment_method_type: string
          processing_fee: number
          property_id: string
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          association_id: string
          contact_id?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          journal_entry_id?: string | null
          metadata?: Json
          net_amount?: number
          paid_at?: string | null
          payment_method_type: string
          processing_fee?: number
          property_id: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          association_id?: string
          contact_id?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          journal_entry_id?: string | null
          metadata?: Json
          net_amount?: number
          paid_at?: string | null
          payment_method_type?: string
          processing_fee?: number
          property_id?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_payment_intents_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_payment_intents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_payment_intents_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_payment_intents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_payment_intents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_statements: {
        Row: {
          association_id: string
          balance_forward: number
          created_at: string
          ending_balance: number
          html_content: string | null
          id: string
          period_end: string
          period_start: string
          property_id: string
          sent_at: string | null
          statement_date: string
          status: string
          tenant_id: string
          total_charges: number
          total_payments: number
        }
        Insert: {
          association_id: string
          balance_forward?: number
          created_at?: string
          ending_balance?: number
          html_content?: string | null
          id?: string
          period_end: string
          period_start: string
          property_id: string
          sent_at?: string | null
          statement_date?: string
          status?: string
          tenant_id: string
          total_charges?: number
          total_payments?: number
        }
        Update: {
          association_id?: string
          balance_forward?: number
          created_at?: string
          ending_balance?: number
          html_content?: string | null
          id?: string
          period_end?: string
          period_start?: string
          property_id?: string
          sent_at?: string | null
          statement_date?: string
          status?: string
          tenant_id?: string
          total_charges?: number
          total_payments?: number
        }
        Relationships: [
          {
            foreignKeyName: "owner_statements_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_statements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_statements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_periods: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_applications: {
        Row: {
          amount: number
          applied_at: string
          charge_id: string
          id: string
          payment_journal_entry_id: string
          tenant_id: string
        }
        Insert: {
          amount: number
          applied_at?: string
          charge_id: string
          id?: string
          payment_journal_entry_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          applied_at?: string
          charge_id?: string
          id?: string
          payment_journal_entry_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_applications_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_applications_payment_journal_entry_id_fkey"
            columns: ["payment_journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_batch_items: {
        Row: {
          amount: number
          ap_payment_id: string | null
          batch_id: string
          bill_id: string
          check_number: string | null
          id: string
          status: string | null
          vendor_id: string
        }
        Insert: {
          amount: number
          ap_payment_id?: string | null
          batch_id: string
          bill_id: string
          check_number?: string | null
          id?: string
          status?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number
          ap_payment_id?: string | null
          batch_id?: string
          bill_id?: string
          check_number?: string | null
          id?: string
          status?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_batch_items_ap_payment_id_fkey"
            columns: ["ap_payment_id"]
            isOneToOne: false
            referencedRelation: "ap_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batch_items_ap_payment_id_fkey"
            columns: ["ap_payment_id"]
            isOneToOne: false
            referencedRelation: "check_register"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "payment_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payment_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batch_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "ap_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batch_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_batches: {
        Row: {
          association_id: string | null
          avid_export_file_url: string | null
          bank_account_id: string | null
          batch_date: string
          batch_name: string
          check_number_end: string | null
          check_number_start: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          item_count: number
          nacha_file_url: string | null
          nacha_trace_number: string | null
          notes: string | null
          payment_method: string
          status: string
          submitted_at: string | null
          tenant_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          association_id?: string | null
          avid_export_file_url?: string | null
          bank_account_id?: string | null
          batch_date: string
          batch_name: string
          check_number_end?: string | null
          check_number_start?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_count?: number
          nacha_file_url?: string | null
          nacha_trace_number?: string | null
          notes?: string | null
          payment_method: string
          status?: string
          submitted_at?: string | null
          tenant_id: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          association_id?: string | null
          avid_export_file_url?: string | null
          bank_account_id?: string | null
          batch_date?: string
          batch_name?: string
          check_number_end?: string | null
          check_number_start?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_count?: number
          nacha_file_url?: string | null
          nacha_trace_number?: string | null
          notes?: string | null
          payment_method?: string
          status?: string
          submitted_at?: string | null
          tenant_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_batches_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batches_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plan_installments: {
        Row: {
          association_id: string
          balance_remaining: number
          created_at: string
          created_by: string | null
          end_date: string | null
          frequency: string
          id: string
          installment_amount: number
          installments_paid: number
          installments_total: number
          next_due_date: string | null
          plan_name: string
          property_id: string
          start_date: string
          status: string
          tenant_id: string
          total_amount: number
        }
        Insert: {
          association_id: string
          balance_remaining: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          installment_amount: number
          installments_paid?: number
          installments_total: number
          next_due_date?: string | null
          plan_name: string
          property_id: string
          start_date: string
          status?: string
          tenant_id: string
          total_amount: number
        }
        Update: {
          association_id?: string
          balance_remaining?: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          installment_amount?: number
          installments_paid?: number
          installments_total?: number
          next_due_date?: string | null
          plan_name?: string
          property_id?: string
          start_date?: string
          status?: string
          tenant_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_plan_installments_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plan_installments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plan_installments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          association_id: string
          auto_charge: boolean | null
          created_at: string | null
          created_by: string | null
          down_payment: number | null
          end_date: string
          frequency: string
          id: string
          installment_amount: number
          notes: string | null
          property_id: string
          start_date: string
          status: string
          stripe_payment_method_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          association_id: string
          auto_charge?: boolean | null
          created_at?: string | null
          created_by?: string | null
          down_payment?: number | null
          end_date: string
          frequency: string
          id?: string
          installment_amount: number
          notes?: string | null
          property_id: string
          start_date: string
          status?: string
          stripe_payment_method_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          association_id?: string
          auto_charge?: boolean | null
          created_at?: string | null
          created_by?: string | null
          down_payment?: number | null
          end_date?: string
          frequency?: string
          id?: string
          installment_amount?: number
          notes?: string | null
          property_id?: string
          start_date?: string
          status?: string
          stripe_payment_method_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reconciliation: {
        Row: {
          amount: number
          association_id: string
          created_at: string
          external_id: string | null
          id: string
          journal_entry_id: string | null
          match_confidence: number | null
          match_type: string | null
          matched_charge_id: string | null
          matched_property_id: string | null
          notes: string | null
          payer_email: string | null
          payer_name: string | null
          payment_date: string
          payment_source: string
          reconciled_at: string | null
          reconciled_by: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          association_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          journal_entry_id?: string | null
          match_confidence?: number | null
          match_type?: string | null
          matched_charge_id?: string | null
          matched_property_id?: string | null
          notes?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_date: string
          payment_source: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          association_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          journal_entry_id?: string | null
          match_confidence?: number | null
          match_type?: string | null
          matched_charge_id?: string | null
          matched_property_id?: string | null
          notes?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_date?: string
          payment_source?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reconciliation_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_matched_charge_id_fkey"
            columns: ["matched_charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_matched_property_id_fkey"
            columns: ["matched_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          created_at: string
          deductions: Json
          export_format: string | null
          exported_at: string | null
          gross_pay: number
          id: string
          net_pay: number | null
          overtime_hours: number
          overtime_pay: number
          pay_period_id: string
          regular_hours: number
          regular_pay: number
          staff_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          deductions?: Json
          export_format?: string | null
          exported_at?: string | null
          gross_pay?: number
          id?: string
          net_pay?: number | null
          overtime_hours?: number
          overtime_pay?: number
          pay_period_id: string
          regular_hours?: number
          regular_pay?: number
          staff_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          deductions?: Json
          export_format?: string | null
          exported_at?: string | null
          gross_pay?: number
          id?: string
          net_pay?: number | null
          overtime_hours?: number
          overtime_pay?: number
          pay_period_id?: string
          regular_hours?: number
          regular_pay?: number
          staff_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_pay_period_id_fkey"
            columns: ["pay_period_id"]
            isOneToOne: false
            referencedRelation: "pay_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          id: string
          is_allowed: boolean
          resource: string
          role: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          is_allowed?: boolean
          resource: string
          role: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          is_allowed?: boolean
          resource?: string
          role?: string
        }
        Relationships: []
      }
      plaid_accounts: {
        Row: {
          account_subtype: string | null
          account_type: string | null
          association_id: string | null
          available_balance: number | null
          bank_account_id: string | null
          created_at: string
          currency_code: string | null
          current_balance: number | null
          id: string
          is_active: boolean
          mask: string | null
          name: string
          official_name: string | null
          plaid_account_id: string
          plaid_item_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_subtype?: string | null
          account_type?: string | null
          association_id?: string | null
          available_balance?: number | null
          bank_account_id?: string | null
          created_at?: string
          currency_code?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean
          mask?: string | null
          name: string
          official_name?: string | null
          plaid_account_id: string
          plaid_item_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_subtype?: string | null
          account_type?: string | null
          association_id?: string | null
          available_balance?: number | null
          bank_account_id?: string | null
          created_at?: string
          currency_code?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean
          mask?: string | null
          name?: string
          official_name?: string | null
          plaid_account_id?: string
          plaid_item_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plaid_accounts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plaid_accounts_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plaid_accounts_plaid_item_id_fkey"
            columns: ["plaid_item_id"]
            isOneToOne: false
            referencedRelation: "plaid_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plaid_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plaid_items: {
        Row: {
          access_token_encrypted: string
          created_at: string
          error_message: string | null
          external_integration_id: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          item_id: string
          last_sync_at: string | null
          status: string
          sync_cursor: string | null
          tenant_id: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string
          error_message?: string | null
          external_integration_id?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          item_id: string
          last_sync_at?: string | null
          status?: string
          sync_cursor?: string | null
          tenant_id: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          error_message?: string | null
          external_integration_id?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          item_id?: string
          last_sync_at?: string | null
          status?: string
          sync_cursor?: string | null
          tenant_id?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plaid_items_external_integration_id_fkey"
            columns: ["external_integration_id"]
            isOneToOne: false
            referencedRelation: "external_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plaid_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          source_id: string | null
          source_type: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          source_id?: string | null
          source_type?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          source_id?: string | null
          source_type?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_reports: {
        Row: {
          association_id: string
          calcium_hardness: number | null
          combined_chlorine: number | null
          corrective_actions: string | null
          created_at: string
          cyanuric_acid: number | null
          free_chlorine: number | null
          id: string
          notes: string | null
          ph: number | null
          photos: Json
          pool_name: string
          report_date: string
          reported_by: string | null
          status: string
          tenant_id: string
          total_alkalinity: number | null
          total_dissolved_solids: number | null
          water_clarity: string | null
          water_temperature: number | null
        }
        Insert: {
          association_id: string
          calcium_hardness?: number | null
          combined_chlorine?: number | null
          corrective_actions?: string | null
          created_at?: string
          cyanuric_acid?: number | null
          free_chlorine?: number | null
          id?: string
          notes?: string | null
          ph?: number | null
          photos?: Json
          pool_name?: string
          report_date: string
          reported_by?: string | null
          status?: string
          tenant_id: string
          total_alkalinity?: number | null
          total_dissolved_solids?: number | null
          water_clarity?: string | null
          water_temperature?: number | null
        }
        Update: {
          association_id?: string
          calcium_hardness?: number | null
          combined_chlorine?: number | null
          corrective_actions?: string | null
          created_at?: string
          cyanuric_acid?: number | null
          free_chlorine?: number | null
          id?: string
          notes?: string | null
          ph?: number | null
          photos?: Json
          pool_name?: string
          report_date?: string
          reported_by?: string | null
          status?: string
          tenant_id?: string
          total_alkalinity?: number | null
          total_dissolved_solids?: number | null
          water_clarity?: string | null
          water_temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_reports_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_items: {
        Row: {
          active: boolean | null
          association_id: string
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number
          sku: string | null
          tax_rate: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          association_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price: number
          sku?: string | null
          tax_rate?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          association_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number
          sku?: string | null
          tax_rate?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_items_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_products: {
        Row: {
          association_id: string
          barcode: string | null
          category: string
          compare_at_price: number | null
          cost: number | null
          created_at: string | null
          department: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_available_online: boolean | null
          is_taxable: boolean | null
          is_time_based: boolean | null
          low_stock_threshold: number | null
          member_price: number | null
          metadata: Json | null
          name: string
          price: number
          revenue_account_id: string | null
          sku: string | null
          sort_order: number | null
          stock_quantity: number | null
          tax_rate: number | null
          tenant_id: string
          track_inventory: boolean | null
          updated_at: string | null
        }
        Insert: {
          association_id: string
          barcode?: string | null
          category: string
          compare_at_price?: number | null
          cost?: number | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available_online?: boolean | null
          is_taxable?: boolean | null
          is_time_based?: boolean | null
          low_stock_threshold?: number | null
          member_price?: number | null
          metadata?: Json | null
          name: string
          price: number
          revenue_account_id?: string | null
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          tax_rate?: number | null
          tenant_id: string
          track_inventory?: boolean | null
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          barcode?: string | null
          category?: string
          compare_at_price?: number | null
          cost?: number | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available_online?: boolean | null
          is_taxable?: boolean | null
          is_time_based?: boolean | null
          low_stock_threshold?: number | null
          member_price?: number | null
          metadata?: Json | null
          name?: string
          price?: number
          revenue_account_id?: string | null
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          tax_rate?: number | null
          tenant_id?: string
          track_inventory?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_products_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_products_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_products_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "pos_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_terminals: {
        Row: {
          amenity_id: string | null
          association_id: string
          created_at: string | null
          device_type: string | null
          id: string
          label: string
          last_seen_at: string | null
          location_name: string
          serial_number: string | null
          status: string | null
          stripe_location_id: string | null
          stripe_terminal_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amenity_id?: string | null
          association_id: string
          created_at?: string | null
          device_type?: string | null
          id?: string
          label: string
          last_seen_at?: string | null
          location_name: string
          serial_number?: string | null
          status?: string | null
          stripe_location_id?: string | null
          stripe_terminal_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amenity_id?: string | null
          association_id?: string
          created_at?: string | null
          device_type?: string | null
          id?: string
          label?: string
          last_seen_at?: string | null
          location_name?: string
          serial_number?: string | null
          status?: string | null
          stripe_location_id?: string | null
          stripe_terminal_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_terminals_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_terminals_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_terminals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_transaction_items: {
        Row: {
          activity_registration_id: string | null
          amenity_reservation_id: string | null
          discount_amount: number | null
          id: string
          line_total: number
          name: string
          notes: string | null
          product_id: string | null
          quantity: number
          revenue_account_id: string | null
          sku: string | null
          tax_amount: number | null
          tenant_id: string
          transaction_id: string
          unit_price: number
        }
        Insert: {
          activity_registration_id?: string | null
          amenity_reservation_id?: string | null
          discount_amount?: number | null
          id?: string
          line_total: number
          name: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          revenue_account_id?: string | null
          sku?: string | null
          tax_amount?: number | null
          tenant_id: string
          transaction_id: string
          unit_price: number
        }
        Update: {
          activity_registration_id?: string | null
          amenity_reservation_id?: string | null
          discount_amount?: number | null
          id?: string
          line_total?: number
          name?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          revenue_account_id?: string | null
          sku?: string | null
          tax_amount?: number | null
          tenant_id?: string
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_transaction_items_activity_registration_id_fkey"
            columns: ["activity_registration_id"]
            isOneToOne: false
            referencedRelation: "activity_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transaction_items_amenity_reservation_id_fkey"
            columns: ["amenity_reservation_id"]
            isOneToOne: false
            referencedRelation: "amenity_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pos_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transaction_items_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transaction_items_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "pos_transaction_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "pos_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_transactions: {
        Row: {
          association_id: string
          cashier_id: string | null
          charge_id: string | null
          charged_to_account: boolean | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          customer_name: string | null
          department: string | null
          discount_amount: number | null
          id: string
          metadata: Json | null
          notes: string | null
          payment_method: string
          payment_status: string
          property_id: string | null
          receipt_email: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          split_payments: Json | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_reader_id: string | null
          subtotal: number
          tax_amount: number | null
          tenant_id: string
          terminal_id: string | null
          tip_amount: number | null
          total_amount: number
          transaction_number: string
        }
        Insert: {
          association_id: string
          cashier_id?: string | null
          charge_id?: string | null
          charged_to_account?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          department?: string | null
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_method: string
          payment_status?: string
          property_id?: string | null
          receipt_email?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          split_payments?: Json | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_reader_id?: string | null
          subtotal: number
          tax_amount?: number | null
          tenant_id: string
          terminal_id?: string | null
          tip_amount?: number | null
          total_amount: number
          transaction_number: string
        }
        Update: {
          association_id?: string
          cashier_id?: string | null
          charge_id?: string | null
          charged_to_account?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          department?: string | null
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_method?: string
          payment_status?: string
          property_id?: string | null
          receipt_email?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          split_payments?: Json | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_reader_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tenant_id?: string
          terminal_id?: string | null
          tip_amount?: number | null
          total_amount?: number
          transaction_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_transactions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          association_id: string
          builder_name: string | null
          certificate_of_occupancy_date: string | null
          city: string | null
          construction_end_date: string | null
          construction_start_date: string | null
          country: string
          created_at: string
          developer_id: string | null
          expected_completion: string | null
          external_id: string | null
          external_source: string | null
          id: string
          latitude: number | null
          longitude: number | null
          lot_number: string | null
          map_pin_color: string | null
          model_name: string | null
          parcel_boundary: Json | null
          phase_name: string | null
          property_lifecycle: string | null
          property_type: string
          state: string | null
          status: string
          tenant_id: string
          unit_number: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          association_id: string
          builder_name?: string | null
          certificate_of_occupancy_date?: string | null
          city?: string | null
          construction_end_date?: string | null
          construction_start_date?: string | null
          country?: string
          created_at?: string
          developer_id?: string | null
          expected_completion?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          lot_number?: string | null
          map_pin_color?: string | null
          model_name?: string | null
          parcel_boundary?: Json | null
          phase_name?: string | null
          property_lifecycle?: string | null
          property_type?: string
          state?: string | null
          status?: string
          tenant_id: string
          unit_number: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          association_id?: string
          builder_name?: string | null
          certificate_of_occupancy_date?: string | null
          city?: string | null
          construction_end_date?: string | null
          construction_start_date?: string | null
          country?: string
          created_at?: string
          developer_id?: string | null
          expected_completion?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          lot_number?: string | null
          map_pin_color?: string | null
          model_name?: string | null
          parcel_boundary?: Json | null
          phase_name?: string | null
          property_lifecycle?: string | null
          property_type?: string
          state?: string | null
          status?: string
          tenant_id?: string
          unit_number?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      property_appraiser_records: {
        Row: {
          assessed_value: number | null
          bathrooms: number | null
          bedrooms: number | null
          building_details: Json | null
          building_sqft: number | null
          county: string | null
          created_at: string
          data_source: string | null
          fetch_status: string | null
          id: string
          land_use: string | null
          last_fetched_at: string | null
          last_updated: string
          legal_owner_mailing_address: string | null
          legal_owner_name: string | null
          lot_sqft: number | null
          market_value: number | null
          mismatch_notes: string | null
          owner_name_matches: boolean | null
          parcel_id: string | null
          property_id: string
          property_image_url: string | null
          raw_data: Json
          tenant_id: string
          updated_at: string
          year_built: number | null
        }
        Insert: {
          assessed_value?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_details?: Json | null
          building_sqft?: number | null
          county?: string | null
          created_at?: string
          data_source?: string | null
          fetch_status?: string | null
          id?: string
          land_use?: string | null
          last_fetched_at?: string | null
          last_updated?: string
          legal_owner_mailing_address?: string | null
          legal_owner_name?: string | null
          lot_sqft?: number | null
          market_value?: number | null
          mismatch_notes?: string | null
          owner_name_matches?: boolean | null
          parcel_id?: string | null
          property_id: string
          property_image_url?: string | null
          raw_data?: Json
          tenant_id: string
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          assessed_value?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_details?: Json | null
          building_sqft?: number | null
          county?: string | null
          created_at?: string
          data_source?: string | null
          fetch_status?: string | null
          id?: string
          land_use?: string | null
          last_fetched_at?: string | null
          last_updated?: string
          legal_owner_mailing_address?: string | null
          legal_owner_name?: string | null
          lot_sqft?: number | null
          market_value?: number | null
          mismatch_notes?: string | null
          owner_name_matches?: boolean | null
          parcel_id?: string | null
          property_id?: string
          property_image_url?: string | null
          raw_data?: Json
          tenant_id?: string
          updated_at?: string
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_appraiser_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_appraiser_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      proxies: {
        Row: {
          created_at: string
          document_id: string | null
          election_id: string
          granted_at: string
          granter_contact_id: string
          granter_property_id: string
          holder_contact_id: string
          id: string
          instructions: string | null
          revoked_at: string | null
          scope: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          election_id: string
          granted_at?: string
          granter_contact_id: string
          granter_property_id: string
          holder_contact_id: string
          id?: string
          instructions?: string | null
          revoked_at?: string | null
          scope?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          election_id?: string
          granted_at?: string
          granter_contact_id?: string
          granter_property_id?: string
          holder_contact_id?: string
          id?: string
          instructions?: string | null
          revoked_at?: string | null
          scope?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proxies_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proxies_granter_contact_id_fkey"
            columns: ["granter_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proxies_granter_property_id_fkey"
            columns: ["granter_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proxies_holder_contact_id_fkey"
            columns: ["holder_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proxies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pto_balances: {
        Row: {
          id: string
          personal_hours_total: number | null
          personal_hours_used: number | null
          sick_hours_total: number | null
          sick_hours_used: number | null
          tenant_id: string
          user_id: string
          vacation_hours_total: number | null
          vacation_hours_used: number | null
          year: number
        }
        Insert: {
          id?: string
          personal_hours_total?: number | null
          personal_hours_used?: number | null
          sick_hours_total?: number | null
          sick_hours_used?: number | null
          tenant_id: string
          user_id: string
          vacation_hours_total?: number | null
          vacation_hours_used?: number | null
          year: number
        }
        Update: {
          id?: string
          personal_hours_total?: number | null
          personal_hours_used?: number | null
          sick_hours_total?: number | null
          sick_hours_used?: number | null
          tenant_id?: string
          user_id?: string
          vacation_hours_total?: number | null
          vacation_hours_used?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "pto_balances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pto_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pto_requests: {
        Row: {
          created_at: string | null
          end_date: string
          hours_requested: number
          id: string
          leave_type: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          hours_requested: number
          id?: string
          leave_type: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          hours_requested?: number
          id?: string
          leave_type?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pto_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pto_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pto_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // Manually added — present in live schema but missing from last type
      // generation. Remove these two blocks after regenerating types.
      manager_performance_metrics: {
        Row: {
          avg_response_time_hours: number | null
          collections_rate: number | null
          communities_managed: number | null
          created_at: string
          id: string
          period_end: string | null
          period_start: string | null
          revenue_managed: number | null
          tenant_id: string
          total_doors: number | null
          user_id: string
          violations_closed: number | null
          violations_opened: number | null
          work_orders_closed: number | null
          work_orders_opened: number | null
        }
        Insert: {
          avg_response_time_hours?: number | null
          collections_rate?: number | null
          communities_managed?: number | null
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          revenue_managed?: number | null
          tenant_id: string
          total_doors?: number | null
          user_id: string
          violations_closed?: number | null
          violations_opened?: number | null
          work_orders_closed?: number | null
          work_orders_opened?: number | null
        }
        Update: {
          avg_response_time_hours?: number | null
          collections_rate?: number | null
          communities_managed?: number | null
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          revenue_managed?: number | null
          tenant_id?: string
          total_doors?: number | null
          user_id?: string
          violations_closed?: number | null
          violations_opened?: number | null
          work_orders_closed?: number | null
          work_orders_opened?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_performance_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      qbo_entity_sync: {
        Row: {
          created_at: string
          entity_type: string
          error_message: string | null
          id: string
          last_synced_at: string
          sync_status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          error_message?: string | null
          id?: string
          last_synced_at?: string
          sync_status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          last_synced_at?: string
          sync_status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qbo_entity_sync_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      qbo_account_mapping: {
        Row: {
          created_at: string
          id: string
          last_synced_at: string | null
          qbo_account_id: string
          qbo_account_name: string | null
          tenant_id: string
          vera_account_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          qbo_account_id: string
          qbo_account_name?: string | null
          tenant_id: string
          vera_account_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          qbo_account_id?: string
          qbo_account_name?: string | null
          tenant_id?: string
          vera_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qbo_account_mapping_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qbo_account_mapping_vera_account_id_fkey"
            columns: ["vera_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qbo_account_mapping_vera_account_id_fkey"
            columns: ["vera_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      qbo_sync_log: {
        Row: {
          association_id: string | null
          completed_at: string | null
          created_by: string | null
          direction: string
          error_message: string | null
          id: string
          metadata: Json | null
          records_failed: number
          records_synced: number
          started_at: string
          status: string
          sync_type: string
          tenant_id: string
        }
        Insert: {
          association_id?: string | null
          completed_at?: string | null
          created_by?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_failed?: number
          records_synced?: number
          started_at?: string
          status?: string
          sync_type: string
          tenant_id: string
        }
        Update: {
          association_id?: string | null
          completed_at?: string | null
          created_by?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_failed?: number
          records_synced?: number
          started_at?: string
          status?: string
          sync_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qbo_sync_log_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qbo_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start: string
        }
        Update: {
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      recurring_work_order_templates: {
        Row: {
          assigned_to: string | null
          association_id: string
          category: string | null
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          description: string | null
          end_date: string | null
          estimated_cost: number | null
          frequency: string
          id: string
          is_active: boolean
          last_generated_date: string | null
          next_due_date: string | null
          priority: string
          start_date: string
          tenant_id: string
          title: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          association_id: string
          category?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          end_date?: string | null
          estimated_cost?: number | null
          frequency: string
          id?: string
          is_active?: boolean
          last_generated_date?: string | null
          next_due_date?: string | null
          priority?: string
          start_date?: string
          tenant_id: string
          title: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          association_id?: string
          category?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          end_date?: string | null
          estimated_cost?: number | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_generated_date?: string | null
          next_due_date?: string | null
          priority?: string
          start_date?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_work_order_templates_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_work_order_templates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_work_order_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_work_order_templates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      renter_insurance_certificates: {
        Row: {
          association_id: string
          carrier: string
          contact_id: string
          coverage_amount: number | null
          created_at: string
          document_name: string | null
          document_url: string | null
          effective_date: string | null
          expiration_date: string
          id: string
          notes: string | null
          policy_number: string
          property_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          association_id: string
          carrier: string
          contact_id: string
          coverage_amount?: number | null
          created_at?: string
          document_name?: string | null
          document_url?: string | null
          effective_date?: string | null
          expiration_date: string
          id?: string
          notes?: string | null
          policy_number: string
          property_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          carrier?: string
          contact_id?: string
          coverage_amount?: number | null
          created_at?: string
          document_name?: string | null
          document_url?: string | null
          effective_date?: string | null
          expiration_date?: string
          id?: string
          notes?: string | null
          policy_number?: string
          property_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renter_insurance_certificates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renter_insurance_certificates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renter_insurance_certificates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reserve_components: {
        Row: {
          annual_contribution: number
          association_id: string
          category: string
          condition: string | null
          created_at: string
          current_reserve: number
          description: string | null
          id: string
          inflation_rate: number | null
          last_replaced: string | null
          name: string
          notes: string | null
          percent_funded: number | null
          remaining_life_years: number
          replacement_cost: number
          tenant_id: string
          useful_life_years: number
        }
        Insert: {
          annual_contribution?: number
          association_id: string
          category: string
          condition?: string | null
          created_at?: string
          current_reserve?: number
          description?: string | null
          id?: string
          inflation_rate?: number | null
          last_replaced?: string | null
          name: string
          notes?: string | null
          percent_funded?: number | null
          remaining_life_years: number
          replacement_cost: number
          tenant_id: string
          useful_life_years: number
        }
        Update: {
          annual_contribution?: number
          association_id?: string
          category?: string
          condition?: string | null
          created_at?: string
          current_reserve?: number
          description?: string | null
          id?: string
          inflation_rate?: number | null
          last_replaced?: string | null
          name?: string
          notes?: string | null
          percent_funded?: number | null
          remaining_life_years?: number
          replacement_cost?: number
          tenant_id?: string
          useful_life_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "reserve_components_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserve_components_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reserve_studies: {
        Row: {
          association_id: string
          created_at: string
          id: string
          notes: string | null
          percent_funded: number | null
          prepared_by: string | null
          projections: Json
          recommended_annual_contribution: number | null
          status: string
          study_date: string
          tenant_id: string
          total_fully_funded: number
          total_reserve_balance: number
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          notes?: string | null
          percent_funded?: number | null
          prepared_by?: string | null
          projections?: Json
          recommended_annual_contribution?: number | null
          status?: string
          study_date: string
          tenant_id: string
          total_fully_funded?: number
          total_reserve_balance?: number
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          percent_funded?: number | null
          prepared_by?: string | null
          projections?: Json
          recommended_annual_contribution?: number | null
          status?: string
          study_date?: string
          tenant_id?: string
          total_fully_funded?: number
          total_reserve_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "reserve_studies_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserve_studies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      resolution_votes: {
        Row: {
          board_member_id: string
          id: string
          resolution_id: string
          tenant_id: string
          vote: string
          voted_at: string
        }
        Insert: {
          board_member_id: string
          id?: string
          resolution_id: string
          tenant_id: string
          vote: string
          voted_at?: string
        }
        Update: {
          board_member_id?: string
          id?: string
          resolution_id?: string
          tenant_id?: string
          vote?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolution_votes_board_member_id_fkey"
            columns: ["board_member_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_votes_resolution_id_fkey"
            columns: ["resolution_id"]
            isOneToOne: false
            referencedRelation: "board_resolutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_votes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      returned_mail: {
        Row: {
          association_id: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          new_address: string | null
          notes: string | null
          original_address: string
          property_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          return_date: string
          return_reason: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          association_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          new_address?: string | null
          notes?: string | null
          original_address: string
          property_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          return_date: string
          return_reason?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          association_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          new_address?: string | null
          notes?: string | null
          original_address?: string
          property_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          return_date?: string
          return_reason?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "returned_mail_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returned_mail_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returned_mail_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returned_mail_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returned_mail_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_along_visits: {
        Row: {
          association_id: string | null
          cam_user_id: string
          created_at: string | null
          id: string
          notes: string | null
          observer_name: string
          observer_role: string | null
          purpose: string
          scheduled_date: string
          status: string | null
          tenant_id: string
        }
        Insert: {
          association_id?: string | null
          cam_user_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          observer_name: string
          observer_role?: string | null
          purpose: string
          scheduled_date: string
          status?: string | null
          tenant_id: string
        }
        Update: {
          association_id?: string | null
          cam_user_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          observer_name?: string
          observer_role?: string | null
          purpose?: string
          scheduled_date?: string
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_along_visits_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_along_visits_cam_user_id_fkey"
            columns: ["cam_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_along_visits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          tenant_id: string
          user_agent: string | null
          user_id: string
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          tenant_id: string
          user_agent?: string | null
          user_id: string
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tier_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          features: Json
          id: string
          is_active: boolean | null
          monthly_minimum: number | null
          monthly_price_per_unit: number | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean | null
          monthly_minimum?: number | null
          monthly_price_per_unit?: number | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean | null
          monthly_minimum?: number | null
          monthly_price_per_unit?: number | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      special_assessments: {
        Row: {
          affected_units: number
          allows_installments: boolean
          approved_by: string | null
          ar_account_id: string | null
          assessment_date: string | null
          association_id: string
          board_meeting_id: string | null
          board_minutes_document_id: string | null
          board_vote_date: string | null
          board_vote_result: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          fund_id: string | null
          id: string
          installment_count: number
          installment_frequency: string
          metadata: Json
          name: string
          notes: string | null
          per_unit_amount: number
          purpose: string
          revenue_account_id: string | null
          status: string
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          affected_units?: number
          allows_installments?: boolean
          approved_by?: string | null
          ar_account_id?: string | null
          assessment_date?: string | null
          association_id: string
          board_meeting_id?: string | null
          board_minutes_document_id?: string | null
          board_vote_date?: string | null
          board_vote_result?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          fund_id?: string | null
          id?: string
          installment_count?: number
          installment_frequency?: string
          metadata?: Json
          name: string
          notes?: string | null
          per_unit_amount: number
          purpose: string
          revenue_account_id?: string | null
          status?: string
          tenant_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          affected_units?: number
          allows_installments?: boolean
          approved_by?: string | null
          ar_account_id?: string | null
          assessment_date?: string | null
          association_id?: string
          board_meeting_id?: string | null
          board_minutes_document_id?: string | null
          board_vote_date?: string | null
          board_vote_result?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          fund_id?: string | null
          id?: string
          installment_count?: number
          installment_frequency?: string
          metadata?: Json
          name?: string
          notes?: string | null
          per_unit_amount?: number
          purpose?: string
          revenue_account_id?: string | null
          status?: string
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_assessments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_assessments_ar_account_id_fkey"
            columns: ["ar_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_assessments_ar_account_id_fkey"
            columns: ["ar_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "special_assessments_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_assessments_board_meeting_id_fkey"
            columns: ["board_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_assessments_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_assessments_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_assessments_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "special_assessments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_configurations: {
        Row: {
          allowed_for_roles: Json
          client_id: string | null
          config: Json
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_internal: boolean
          provider: string
          tenant_domain: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          allowed_for_roles?: Json
          client_id?: string | null
          config?: Json
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          is_internal?: boolean
          provider: string
          tenant_domain?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          allowed_for_roles?: Json
          client_id?: string | null
          config?: Json
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_internal?: boolean
          provider?: string
          tenant_domain?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_records: {
        Row: {
          assigned_associations: Json
          contact_id: string | null
          created_at: string
          department: string | null
          emergency_contact: Json | null
          employee_id: string | null
          employment_type: string
          end_date: string | null
          id: string
          job_title: string
          metadata: Json
          notes: string | null
          pay_frequency: string
          pay_rate: number
          pay_type: string
          paylocity_company_id: string | null
          paylocity_employee_id: string | null
          start_date: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_associations?: Json
          contact_id?: string | null
          created_at?: string
          department?: string | null
          emergency_contact?: Json | null
          employee_id?: string | null
          employment_type?: string
          end_date?: string | null
          id?: string
          job_title: string
          metadata?: Json
          notes?: string | null
          pay_frequency?: string
          pay_rate: number
          pay_type?: string
          paylocity_company_id?: string | null
          paylocity_employee_id?: string | null
          start_date: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_associations?: Json
          contact_id?: string | null
          created_at?: string
          department?: string | null
          emergency_contact?: Json | null
          employee_id?: string | null
          employment_type?: string
          end_date?: string | null
          id?: string
          job_title?: string
          metadata?: Json
          notes?: string | null
          pay_frequency?: string
          pay_rate?: number
          pay_type?: string
          paylocity_company_id?: string | null
          paylocity_employee_id?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_records_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_accounts: {
        Row: {
          association_id: string
          charges_enabled: boolean
          created_at: string
          default_bank_account_id: string | null
          id: string
          metadata: Json
          onboarding_complete: boolean
          payouts_enabled: boolean
          status: string
          stripe_account_id: string
          stripe_account_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          association_id: string
          charges_enabled?: boolean
          created_at?: string
          default_bank_account_id?: string | null
          id?: string
          metadata?: Json
          onboarding_complete?: boolean
          payouts_enabled?: boolean
          status?: string
          stripe_account_id: string
          stripe_account_type?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          charges_enabled?: boolean
          created_at?: string
          default_bank_account_id?: string | null
          id?: string
          metadata?: Json
          onboarding_complete?: boolean
          payouts_enabled?: boolean
          status?: string
          stripe_account_id?: string
          stripe_account_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_accounts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: true
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_accounts_default_bank_account_id_fkey"
            columns: ["default_bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          stripe_account_id: string | null
          stripe_event_id: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          stripe_account_id?: string | null
          stripe_event_id: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          stripe_account_id?: string | null
          stripe_event_id?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      structural_integrity_reserve_studies: {
        Row: {
          annual_contribution: number | null
          association_id: string
          components: Json
          created_at: string
          created_by: string | null
          current_reserve_balance: number | null
          document_id: string | null
          expires_at: string | null
          fully_funded_balance: number | null
          funding_method: string | null
          id: string
          milestone_inspection_id: string | null
          notes: string | null
          preparer: string | null
          preparer_license: string | null
          status: string
          study_date: string
          tenant_id: string
          threshold_funded_balance: number | null
        }
        Insert: {
          annual_contribution?: number | null
          association_id: string
          components?: Json
          created_at?: string
          created_by?: string | null
          current_reserve_balance?: number | null
          document_id?: string | null
          expires_at?: string | null
          fully_funded_balance?: number | null
          funding_method?: string | null
          id?: string
          milestone_inspection_id?: string | null
          notes?: string | null
          preparer?: string | null
          preparer_license?: string | null
          status?: string
          study_date: string
          tenant_id: string
          threshold_funded_balance?: number | null
        }
        Update: {
          annual_contribution?: number | null
          association_id?: string
          components?: Json
          created_at?: string
          created_by?: string | null
          current_reserve_balance?: number | null
          document_id?: string | null
          expires_at?: string | null
          fully_funded_balance?: number | null
          funding_method?: string | null
          id?: string
          milestone_inspection_id?: string | null
          notes?: string | null
          preparer?: string | null
          preparer_license?: string | null
          status?: string
          study_date?: string
          tenant_id?: string
          threshold_funded_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "structural_integrity_reserve_studi_milestone_inspection_id_fkey"
            columns: ["milestone_inspection_id"]
            isOneToOne: false
            referencedRelation: "milestone_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structural_integrity_reserve_studies_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structural_integrity_reserve_studies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sunbiz_filings: {
        Row: {
          association_id: string
          confirmation_number: string | null
          created_at: string | null
          due_date: string
          filed_date: string | null
          id: string
          notes: string | null
          status: string
          tenant_id: string
          year: number
        }
        Insert: {
          association_id: string
          confirmation_number?: string | null
          created_at?: string | null
          due_date: string
          filed_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          tenant_id: string
          year: number
        }
        Update: {
          association_id?: string
          confirmation_number?: string | null
          created_at?: string | null
          due_date?: string
          filed_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          tenant_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sunbiz_filings_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sunbiz_filings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_campaigns: {
        Row: {
          association_id: string
          closes_at: string | null
          created_at: string
          created_by: string | null
          id: string
          sent_at: string | null
          status: string
          template_id: string
          tenant_id: string
          title: string
          total_responses: number | null
          total_sent: number | null
        }
        Insert: {
          association_id: string
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          template_id: string
          tenant_id: string
          title: string
          total_responses?: number | null
          total_sent?: number | null
        }
        Update: {
          association_id?: string
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          template_id?: string
          tenant_id?: string
          title?: string
          total_responses?: number | null
          total_sent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_campaigns_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answers: Json
          campaign_id: string
          contact_id: string | null
          id: string
          is_anonymous: boolean
          nps_score: number | null
          overall_rating: number | null
          property_id: string | null
          submitted_at: string
          tenant_id: string
        }
        Insert: {
          answers?: Json
          campaign_id: string
          contact_id?: string | null
          id?: string
          is_anonymous?: boolean
          nps_score?: number | null
          overall_rating?: number | null
          property_id?: string | null
          submitted_at?: string
          tenant_id: string
        }
        Update: {
          answers?: Json
          campaign_id?: string
          contact_id?: string | null
          id?: string
          is_anonymous?: boolean
          nps_score?: number | null
          overall_rating?: number | null
          property_id?: string | null
          submitted_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "survey_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          questions: Json
          survey_type: string
          target_audience: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          questions?: Json
          survey_type?: string
          target_audience?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          questions?: Json
          survey_type?: string
          target_audience?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
          tenant_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
          tenant_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          bg_color: string | null
          category: string
          color: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          bg_color?: string | null
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          bg_color?: string | null
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_1099_records: {
        Row: {
          box_amounts: Json
          created_at: string
          id: string
          recipient_address: Json | null
          recipient_name: string
          recipient_tin_last4: string | null
          status: string
          tax_filing_id: string
          tenant_id: string
          total_amount: number
          vendor_id: string
        }
        Insert: {
          box_amounts?: Json
          created_at?: string
          id?: string
          recipient_address?: Json | null
          recipient_name: string
          recipient_tin_last4?: string | null
          status?: string
          tax_filing_id: string
          tenant_id: string
          total_amount?: number
          vendor_id: string
        }
        Update: {
          box_amounts?: Json
          created_at?: string
          id?: string
          recipient_address?: Json | null
          recipient_name?: string
          recipient_tin_last4?: string | null
          status?: string
          tax_filing_id?: string
          tenant_id?: string
          total_amount?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_1099_records_tax_filing_id_fkey"
            columns: ["tax_filing_id"]
            isOneToOne: false
            referencedRelation: "tax_filings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_1099_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_1099_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_filings: {
        Row: {
          association_id: string | null
          confirmation_number: string | null
          created_at: string
          deadline_date: string | null
          filed_at: string | null
          filing_data: Json
          filing_type: string
          id: string
          notes: string | null
          prepared_at: string | null
          prepared_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tax_year: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          association_id?: string | null
          confirmation_number?: string | null
          created_at?: string
          deadline_date?: string | null
          filed_at?: string | null
          filing_data?: Json
          filing_type: string
          id?: string
          notes?: string | null
          prepared_at?: string | null
          prepared_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_year: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          association_id?: string | null
          confirmation_number?: string | null
          created_at?: string
          deadline_date?: string | null
          filed_at?: string | null
          filing_data?: Json
          filing_type?: string
          id?: string
          notes?: string | null
          prepared_at?: string | null
          prepared_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_year?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_filings_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_filings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_w2_records: {
        Row: {
          created_at: string
          employee_name: string
          employee_ssn_last4: string | null
          federal_tax_withheld: number
          id: string
          local_tax_withheld: number
          local_wages: number
          medicare_tax: number
          medicare_wages: number
          other_compensation: Json | null
          social_security_tax: number
          social_security_wages: number
          staff_record_id: string
          state_tax_withheld: number
          state_wages: number
          tax_filing_id: string
          tenant_id: string
          wages_tips_compensation: number
        }
        Insert: {
          created_at?: string
          employee_name: string
          employee_ssn_last4?: string | null
          federal_tax_withheld?: number
          id?: string
          local_tax_withheld?: number
          local_wages?: number
          medicare_tax?: number
          medicare_wages?: number
          other_compensation?: Json | null
          social_security_tax?: number
          social_security_wages?: number
          staff_record_id: string
          state_tax_withheld?: number
          state_wages?: number
          tax_filing_id: string
          tenant_id: string
          wages_tips_compensation?: number
        }
        Update: {
          created_at?: string
          employee_name?: string
          employee_ssn_last4?: string | null
          federal_tax_withheld?: number
          id?: string
          local_tax_withheld?: number
          local_wages?: number
          medicare_tax?: number
          medicare_wages?: number
          other_compensation?: Json | null
          social_security_tax?: number
          social_security_wages?: number
          staff_record_id?: string
          state_tax_withheld?: number
          state_wages?: number
          tax_filing_id?: string
          tenant_id?: string
          wages_tips_compensation?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_w2_records_staff_record_id_fkey"
            columns: ["staff_record_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_w2_records_tax_filing_id_fkey"
            columns: ["tax_filing_id"]
            isOneToOne: false
            referencedRelation: "tax_filings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_w2_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_memberships: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      thread_messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          sender_id: string | null
          tenant_id: string
          thread_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          sender_id?: string | null
          tenant_id: string
          thread_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          tenant_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          association_id: string | null
          created_at: string
          id: string
          source_id: string | null
          source_type: string | null
          status: string
          subject: string
          tenant_id: string
          thread_type: string
        }
        Insert: {
          association_id?: string | null
          created_at?: string
          id?: string
          source_id?: string | null
          source_type?: string | null
          status?: string
          subject: string
          tenant_id: string
          thread_type: string
        }
        Update: {
          association_id?: string | null
          created_at?: string
          id?: string
          source_id?: string | null
          source_type?: string | null
          status?: string
          subject?: string
          tenant_id?: string
          thread_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          association_id: string | null
          break_minutes: number
          clock_in: string
          clock_in_address: string | null
          clock_in_latitude: number | null
          clock_in_longitude: number | null
          clock_out: string | null
          clock_out_address: string | null
          clock_out_latitude: number | null
          clock_out_longitude: number | null
          created_at: string
          hours_worked: number | null
          id: string
          notes: string | null
          overtime_hours: number | null
          staff_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          association_id?: string | null
          break_minutes?: number
          clock_in: string
          clock_in_address?: string | null
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_out?: string | null
          clock_out_address?: string | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          created_at?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          staff_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          association_id?: string | null
          break_minutes?: number
          clock_in?: string
          clock_in_address?: string | null
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_out?: string | null
          clock_out_address?: string | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          created_at?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          staff_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          context: string | null
          created_at: string
          id: string
          key: string
          locale: string
          tenant_id: string
          updated_at: string
          value: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          key: string
          locale: string
          tenant_id: string
          updated_at?: string
          value: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          key?: string
          locale?: string
          tenant_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          context: Json | null
          earned_at: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          context?: Json | null
          earned_at?: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          context?: Json | null
          earned_at?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          auth_provider: string | null
          calendar_token: string | null
          contact_id: string | null
          created_at: string
          external_id: string | null
          id: string
          is_active: boolean
          preferred_language: string
          role: string
          sso_managed: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auth_provider?: string | null
          calendar_token?: string | null
          contact_id?: string | null
          created_at?: string
          external_id?: string | null
          id: string
          is_active?: boolean
          preferred_language?: string
          role?: string
          sso_managed?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auth_provider?: string | null
          calendar_token?: string | null
          contact_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          is_active?: boolean
          preferred_language?: string
          role?: string
          sso_managed?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_accounts: {
        Row: {
          account_number: string | null
          association_id: string
          created_at: string
          id: string
          is_active: boolean
          meter_number: string | null
          monthly_budget_amount: number | null
          notes: string | null
          service_address: string | null
          tenant_id: string
          updated_at: string
          utility_type: string
          vendor_id: string | null
        }
        Insert: {
          account_number?: string | null
          association_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          meter_number?: string | null
          monthly_budget_amount?: number | null
          notes?: string | null
          service_address?: string | null
          tenant_id: string
          updated_at?: string
          utility_type?: string
          vendor_id?: string | null
        }
        Update: {
          account_number?: string | null
          association_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          meter_number?: string | null
          monthly_budget_amount?: number | null
          notes?: string | null
          service_address?: string | null
          tenant_id?: string
          updated_at?: string
          utility_type?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utility_accounts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_accounts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vantaca_import_log: {
        Row: {
          completed_at: string | null
          error_details: Json | null
          id: string
          import_type: string
          records_errored: number
          records_inserted: number
          records_skipped: number
          records_total: number
          records_updated: number
          source_file: string | null
          started_at: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          error_details?: Json | null
          id?: string
          import_type: string
          records_errored?: number
          records_inserted?: number
          records_skipped?: number
          records_total?: number
          records_updated?: number
          source_file?: string | null
          started_at?: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          error_details?: Json | null
          id?: string
          import_type?: string
          records_errored?: number
          records_inserted?: number
          records_skipped?: number
          records_total?: number
          records_updated?: number
          source_file?: string | null
          started_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vantaca_import_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_registrations: {
        Row: {
          association_id: string
          color: string | null
          contact_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_primary: boolean | null
          make: string | null
          model: string | null
          notes: string | null
          parking_space: string | null
          plate_number: string | null
          plate_state: string | null
          property_id: string
          registered_at: string | null
          status: string
          sticker_number: string | null
          tenant_id: string
          vehicle_type: string | null
          year: number | null
        }
        Insert: {
          association_id: string
          color?: string | null
          contact_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_primary?: boolean | null
          make?: string | null
          model?: string | null
          notes?: string | null
          parking_space?: string | null
          plate_number?: string | null
          plate_state?: string | null
          property_id: string
          registered_at?: string | null
          status?: string
          sticker_number?: string | null
          tenant_id: string
          vehicle_type?: string | null
          year?: number | null
        }
        Update: {
          association_id?: string
          color?: string | null
          contact_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_primary?: boolean | null
          make?: string | null
          model?: string | null
          notes?: string | null
          parking_space?: string | null
          plate_number?: string | null
          plate_state?: string | null
          property_id?: string
          registered_at?: string | null
          status?: string
          sticker_number?: string | null
          tenant_id?: string
          vehicle_type?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_registrations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_registrations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_registrations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_registrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contracts: {
        Row: {
          annual_amount: number | null
          association_id: string
          auto_renewal: boolean
          cancellation_notice_days: number
          contract_number: string | null
          created_at: string
          description: string | null
          document_url: string | null
          escalation_frequency: string | null
          escalation_rate: number | null
          id: string
          insurance_required: boolean
          monthly_amount: number | null
          next_escalation_date: string | null
          notes: string | null
          renewal_notice_days: number
          service_type: string
          status: string
          tenant_id: string
          term_end_date: string | null
          term_start_date: string
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          annual_amount?: number | null
          association_id: string
          auto_renewal?: boolean
          cancellation_notice_days?: number
          contract_number?: string | null
          created_at?: string
          description?: string | null
          document_url?: string | null
          escalation_frequency?: string | null
          escalation_rate?: number | null
          id?: string
          insurance_required?: boolean
          monthly_amount?: number | null
          next_escalation_date?: string | null
          notes?: string | null
          renewal_notice_days?: number
          service_type?: string
          status?: string
          tenant_id: string
          term_end_date?: string | null
          term_start_date: string
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          annual_amount?: number | null
          association_id?: string
          auto_renewal?: boolean
          cancellation_notice_days?: number
          contract_number?: string | null
          created_at?: string
          description?: string | null
          document_url?: string | null
          escalation_frequency?: string | null
          escalation_rate?: number | null
          id?: string
          insurance_required?: boolean
          monthly_amount?: number | null
          next_escalation_date?: string | null
          notes?: string | null
          renewal_notice_days?: number
          service_type?: string
          status?: string
          tenant_id?: string
          term_end_date?: string | null
          term_start_date?: string
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contracts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_insurance_certificates: {
        Row: {
          additional_insured: boolean
          association_id: string | null
          certificate_url: string | null
          coverage_amount: number | null
          created_at: string
          deductible: number | null
          effective_date: string
          expiration_date: string
          id: string
          insurer_name: string
          policy_number: string | null
          policy_type: string
          status: string
          tenant_id: string
          updated_at: string
          vendor_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          additional_insured?: boolean
          association_id?: string | null
          certificate_url?: string | null
          coverage_amount?: number | null
          created_at?: string
          deductible?: number | null
          effective_date: string
          expiration_date: string
          id?: string
          insurer_name: string
          policy_number?: string | null
          policy_type?: string
          status?: string
          tenant_id: string
          updated_at?: string
          vendor_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          additional_insured?: boolean
          association_id?: string | null
          certificate_url?: string | null
          coverage_amount?: number | null
          created_at?: string
          deductible?: number | null
          effective_date?: string
          expiration_date?: string
          id?: string
          insurer_name?: string
          policy_number?: string | null
          policy_type?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          vendor_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_insurance_certificates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_insurance_certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_insurance_certificates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_relationship_disclosures: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          disclosed_at: string | null
          employee_user_id: string
          id: string
          relationship_description: string
          tenant_id: string
          vendor_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          disclosed_at?: string | null
          employee_user_id: string
          id?: string
          relationship_description: string
          tenant_id: string
          vendor_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          disclosed_at?: string | null
          employee_user_id?: string
          id?: string
          relationship_description?: string
          tenant_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_relationship_disclosures_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_relationship_disclosures_employee_user_id_fkey"
            columns: ["employee_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_relationship_disclosures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_relationship_disclosures_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          ach_account_number: string | null
          ach_routing_number: string | null
          avidexchange_vendor_id: string | null
          category: string | null
          contact_name: string | null
          created_at: string
          default_expense_account_id: string | null
          email: string | null
          id: string
          invoice_address: string | null
          invoice_contact_email: string | null
          invoice_contact_name: string | null
          is_1099_eligible: boolean
          is_1099_vendor: boolean | null
          name: string
          payment_method_preference: string | null
          phone: string | null
          remittance_email: string | null
          status: string
          tax_id_last4: string | null
          tenant_id: string
          updated_at: string
          w9_on_file: boolean | null
          w9_received: boolean
        }
        Insert: {
          ach_account_number?: string | null
          ach_routing_number?: string | null
          avidexchange_vendor_id?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string
          default_expense_account_id?: string | null
          email?: string | null
          id?: string
          invoice_address?: string | null
          invoice_contact_email?: string | null
          invoice_contact_name?: string | null
          is_1099_eligible?: boolean
          is_1099_vendor?: boolean | null
          name: string
          payment_method_preference?: string | null
          phone?: string | null
          remittance_email?: string | null
          status?: string
          tax_id_last4?: string | null
          tenant_id: string
          updated_at?: string
          w9_on_file?: boolean | null
          w9_received?: boolean
        }
        Update: {
          ach_account_number?: string | null
          ach_routing_number?: string | null
          avidexchange_vendor_id?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string
          default_expense_account_id?: string | null
          email?: string | null
          id?: string
          invoice_address?: string | null
          invoice_contact_email?: string | null
          invoice_contact_name?: string | null
          is_1099_eligible?: boolean
          is_1099_vendor?: boolean | null
          name?: string
          payment_method_preference?: string | null
          phone?: string | null
          remittance_email?: string | null
          status?: string
          tax_id_last4?: string | null
          tenant_id?: string
          updated_at?: string
          w9_on_file?: boolean | null
          w9_received?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vendors_default_expense_account_id_fkey"
            columns: ["default_expense_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_default_expense_account_id_fkey"
            columns: ["default_expense_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "vendors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      violation_history: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
          tenant_id: string
          violation_id: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          tenant_id: string
          violation_id: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          tenant_id?: string
          violation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "violation_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "violation_history_violation_id_fkey"
            columns: ["violation_id"]
            isOneToOne: false
            referencedRelation: "violations"
            referencedColumns: ["id"]
          },
        ]
      }
      violation_types: {
        Row: {
          association_id: string
          category: string
          created_at: string
          default_grace_period_days: number
          default_severity: string
          description: string | null
          fine_amount: number | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
        }
        Insert: {
          association_id: string
          category?: string
          created_at?: string
          default_grace_period_days?: number
          default_severity?: string
          description?: string | null
          fine_amount?: number | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
        }
        Update: {
          association_id?: string
          category?: string
          created_at?: string
          default_grace_period_days?: number
          default_severity?: string
          description?: string | null
          fine_amount?: number | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "violation_types_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "violation_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      violations: {
        Row: {
          assigned_to: string | null
          association_id: string
          created_at: string
          description: string | null
          due_date: string | null
          external_id: string | null
          external_source: string | null
          fine_amount: number | null
          homeowner_name: string | null
          id: string
          last_note_date: string | null
          last_note_text: string | null
          location_description: string | null
          number: number
          photos: Json
          property_address: string | null
          property_id: string | null
          reported_by: string | null
          resolved_date: string | null
          severity: string
          source: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
          violation_category: string | null
          violation_step: string | null
          violation_type_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          association_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          external_id?: string | null
          external_source?: string | null
          fine_amount?: number | null
          homeowner_name?: string | null
          id?: string
          last_note_date?: string | null
          last_note_text?: string | null
          location_description?: string | null
          number?: never
          photos?: Json
          property_address?: string | null
          property_id?: string | null
          reported_by?: string | null
          resolved_date?: string | null
          severity?: string
          source?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
          violation_category?: string | null
          violation_step?: string | null
          violation_type_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          association_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          external_id?: string | null
          external_source?: string | null
          fine_amount?: number | null
          homeowner_name?: string | null
          id?: string
          last_note_date?: string | null
          last_note_text?: string | null
          location_description?: string | null
          number?: never
          photos?: Json
          property_address?: string | null
          property_id?: string | null
          reported_by?: string | null
          resolved_date?: string | null
          severity?: string
          source?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          violation_category?: string | null
          violation_step?: string | null
          violation_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "violations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "violations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "violations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "violations_violation_type_id_fkey"
            columns: ["violation_type_id"]
            isOneToOne: false
            referencedRelation: "violation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_passes: {
        Row: {
          approved_by: string | null
          association_id: string
          created_at: string
          created_by: string | null
          id: string
          max_uses: number | null
          notes: string | null
          pass_type: string
          property_id: string
          qr_code: string
          recurrence_rule: string | null
          status: string
          tenant_id: string
          times_used: number | null
          valid_from: string
          valid_until: string
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          visitor_company: string | null
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          approved_by?: string | null
          association_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          max_uses?: number | null
          notes?: string | null
          pass_type: string
          property_id: string
          qr_code?: string
          recurrence_rule?: string | null
          status?: string
          tenant_id: string
          times_used?: number | null
          valid_from: string
          valid_until: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          visitor_company?: string | null
          visitor_email?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          approved_by?: string | null
          association_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          max_uses?: number | null
          notes?: string | null
          pass_type?: string
          property_id?: string
          qr_code?: string
          recurrence_rule?: string | null
          status?: string
          tenant_id?: string
          times_used?: number | null
          valid_from?: string
          valid_until?: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          visitor_company?: string | null
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_passes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_passes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_passes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          ballot_item_id: string
          created_at: string
          election_id: string
          id: string
          ip_address: string | null
          is_proxy: boolean | null
          proxy_id: string | null
          selections: Json
          tenant_id: string
          voted_at: string
          voter_contact_id: string
          voter_property_id: string
        }
        Insert: {
          ballot_item_id: string
          created_at?: string
          election_id: string
          id?: string
          ip_address?: string | null
          is_proxy?: boolean | null
          proxy_id?: string | null
          selections?: Json
          tenant_id: string
          voted_at?: string
          voter_contact_id: string
          voter_property_id: string
        }
        Update: {
          ballot_item_id?: string
          created_at?: string
          election_id?: string
          id?: string
          ip_address?: string | null
          is_proxy?: boolean | null
          proxy_id?: string | null
          selections?: Json
          tenant_id?: string
          voted_at?: string
          voter_contact_id?: string
          voter_property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_ballot_item_id_fkey"
            columns: ["ballot_item_id"]
            isOneToOne: false
            referencedRelation: "ballot_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_contact_id_fkey"
            columns: ["voter_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_property_id_fkey"
            columns: ["voter_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      votes_cast: {
        Row: {
          ballot_id: string
          ballot_question_id: string
          candidate_id: string | null
          cast_at: string | null
          id: string
          ip_address: string | null
          is_anonymous: boolean | null
          ranked_choices: Json | null
          tenant_id: string
          vote_hash: string | null
          vote_value: string | null
          voting_token: string
          write_in_text: string | null
        }
        Insert: {
          ballot_id: string
          ballot_question_id: string
          candidate_id?: string | null
          cast_at?: string | null
          id?: string
          ip_address?: string | null
          is_anonymous?: boolean | null
          ranked_choices?: Json | null
          tenant_id: string
          vote_hash?: string | null
          vote_value?: string | null
          voting_token: string
          write_in_text?: string | null
        }
        Update: {
          ballot_id?: string
          ballot_question_id?: string
          candidate_id?: string | null
          cast_at?: string | null
          id?: string
          ip_address?: string | null
          is_anonymous?: boolean | null
          ranked_choices?: Json | null
          tenant_id?: string
          vote_hash?: string | null
          vote_value?: string | null
          voting_token?: string
          write_in_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_cast_ballot_id_fkey"
            columns: ["ballot_id"]
            isOneToOne: false
            referencedRelation: "ballots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_cast_ballot_question_id_fkey"
            columns: ["ballot_question_id"]
            isOneToOne: false
            referencedRelation: "ballot_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_cast_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "ballot_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_cast_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      withholding_config: {
        Row: {
          created_at: string
          federal_rates: Json
          futa_rate: number
          futa_wage_base: number
          id: string
          local_rates: Json
          medicare_rate: number
          social_security_rate: number
          social_security_wage_base: number
          state_code: string
          state_rates: Json
          tax_year: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          federal_rates?: Json
          futa_rate?: number
          futa_wage_base?: number
          id?: string
          local_rates?: Json
          medicare_rate?: number
          social_security_rate?: number
          social_security_wage_base?: number
          state_code?: string
          state_rates?: Json
          tax_year: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          federal_rates?: Json
          futa_rate?: number
          futa_wage_base?: number
          id?: string
          local_rates?: Json
          medicare_rate?: number
          social_security_rate?: number
          social_security_wage_base?: number
          state_code?: string
          state_rates?: Json
          tax_year?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withholding_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          new_value: string | null
          old_value: string | null
          tenant_id: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          tenant_id: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          tenant_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_events_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          storage_path: string
          tenant_id: string
          uploaded_by: string | null
          work_order_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          storage_path: string
          tenant_id: string
          uploaded_by?: string | null
          work_order_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          storage_path?: string
          tenant_id?: string
          uploaded_by?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_photos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_photos_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          association_id: string
          category: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          is_recurring: boolean
          location_description: string | null
          next_due_date: string | null
          number: number
          parent_recurring_id: string | null
          priority: string
          property_id: string | null
          recurrence_day_of_month: number | null
          recurrence_day_of_week: number | null
          recurrence_end_date: string | null
          recurrence_frequency: string | null
          reported_by: string | null
          scheduled_date: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          association_id: string
          category?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          is_recurring?: boolean
          location_description?: string | null
          next_due_date?: string | null
          number?: never
          parent_recurring_id?: string | null
          priority?: string
          property_id?: string | null
          recurrence_day_of_month?: number | null
          recurrence_day_of_week?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          reported_by?: string | null
          scheduled_date?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          association_id?: string
          category?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          is_recurring?: boolean
          location_description?: string | null
          next_due_date?: string | null
          number?: never
          parent_recurring_id?: string | null
          priority?: string
          property_id?: string | null
          recurrence_day_of_month?: number | null
          recurrence_day_of_week?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          reported_by?: string | null
          scheduled_date?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_parent_recurring_id_fkey"
            columns: ["parent_recurring_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_node_results: {
        Row: {
          duration_ms: number | null
          error: string | null
          executed_at: string
          id: string
          node_id: string
          node_type: string
          output: Json | null
          run_id: string
          status: string
        }
        Insert: {
          duration_ms?: number | null
          error?: string | null
          executed_at?: string
          id?: string
          node_id: string
          node_type: string
          output?: Json | null
          run_id: string
          status: string
        }
        Update: {
          duration_ms?: number | null
          error?: string | null
          executed_at?: string
          id?: string
          node_id?: string
          node_type?: string
          output?: Json | null
          run_id?: string
          status?: string
        }
        Relationships: []
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          started_at: string | null
          status: string | null
          tenant_id: string
          trigger_data: Json | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          tenant_id: string
          trigger_data?: Json | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          trigger_data?: Json | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_scheduled_resumes: {
        Row: {
          context_snapshot: Json
          created_at: string
          id: string
          processed_at: string | null
          resume_at: string
          resume_node_id: string
          run_id: string
          status: string
          workflow_id: string
        }
        Insert: {
          context_snapshot?: Json
          created_at?: string
          id?: string
          processed_at?: string | null
          resume_at: string
          resume_node_id: string
          run_id: string
          status?: string
          workflow_id: string
        }
        Update: {
          context_snapshot?: Json
          created_at?: string
          id?: string
          processed_at?: string | null
          resume_at?: string
          resume_node_id?: string
          run_id?: string
          status?: string
          workflow_id?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          edges: Json | null
          id: string
          name: string
          nodes: Json | null
          status: string | null
          tenant_id: string
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          edges?: Json | null
          id?: string
          name: string
          nodes?: Json | null
          status?: string | null
          tenant_id: string
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          edges?: Json | null
          id?: string
          name?: string
          nodes?: Json | null
          status?: string | null
          tenant_id?: string
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      check_register: {
        Row: {
          amount: number | null
          association_id: string | null
          bank_account_name: string | null
          bank_name: string | null
          check_number: string | null
          memo: string | null
          payment_date: string | null
          payment_id: string | null
          payment_method: string | null
          status: string | null
          tenant_id: string | null
          vendor_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ap_payments_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_ledger: {
        Row: {
          account_name: string | null
          account_number: string | null
          account_type: string | null
          association_id: string | null
          contact_id: string | null
          created_at: string | null
          credit: number | null
          debit: number | null
          entry_date: string | null
          entry_description: string | null
          entry_status: string | null
          line_description: string | null
          line_id: string | null
          property_id: string | null
          reference_number: string | null
          tenant_id: string | null
          unit_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_balance: {
        Row: {
          account_id: string | null
          account_name: string | null
          account_number: string | null
          account_type: string | null
          association_id: string | null
          fund_id: string | null
          fund_name: string | null
          net_balance: number | null
          tenant_id: string | null
          total_credits: number | null
          total_debits: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_aged_receivables: {
        Args: { p_as_of_date?: string; p_association_id: string }
        Returns: {
          contact_name: string
          current_balance: number
          days_120_plus: number
          days_30: number
          days_60: number
          days_90: number
          property_id: string
          total_due: number
          unit_number: string
        }[]
      }
      get_balance_sheet: {
        Args: {
          p_as_of_date: string
          p_association_id: string
          p_fund_id: string
        }
        Returns: {
          account_id: string
          account_name: string
          account_number: string
          account_type: string
          balance: number
        }[]
      }
      get_budget_vs_actual: {
        Args: { p_budget_id: string; p_through_month: number }
        Returns: {
          account_id: string
          account_name: string
          account_number: string
          account_type: string
          annual_budget: number
          variance: number
          variance_pct: number
          ytd_actual: number
          ytd_budget: number
        }[]
      }
      get_cash_flow_statement: {
        Args: {
          p_association_id: string
          p_end_date: string
          p_fund_id: string
          p_start_date: string
        }
        Returns: {
          amount: number
          line_item: string
          section: string
        }[]
      }
      get_consolidated_balance_sheet: {
        Args: { p_as_of_date: string; p_tenant_id: string }
        Returns: {
          account_id: string
          account_name: string
          account_number: string
          account_type: string
          association_id: string
          association_name: string
          balance: number
        }[]
      }
      get_consolidated_income_statement: {
        Args: { p_end_date: string; p_start_date: string; p_tenant_id: string }
        Returns: {
          account_id: string
          account_name: string
          account_number: string
          account_type: string
          actual_amount: number
          association_id: string
          association_name: string
        }[]
      }
      get_gl_detail: {
        Args: {
          p_account_id: string
          p_association_id: string
          p_end_date: string
          p_start_date: string
        }
        Returns: {
          credit: number
          debit: number
          description: string
          entry_date: string
          journal_entry_id: string
          reference_number: string
          running_balance: number
          source: string
        }[]
      }
      get_income_statement: {
        Args: {
          p_association_id: string
          p_end_date: string
          p_fund_id: string
          p_start_date: string
        }
        Returns: {
          account_id: string
          account_name: string
          account_number: string
          account_type: string
          actual_amount: number
        }[]
      }
      get_tenant_id: { Args: never; Returns: string }
      seed_default_escalation_rules: {
        Args: { p_association_id: string; p_tenant_id: string }
        Returns: undefined
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
