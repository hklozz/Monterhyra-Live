import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://crvanwgfckcmgjhcbens.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.error('⚠️ VITE_SUPABASE_ANON_KEY saknas! Hämta den från Supabase Dashboard → Settings → API');
}

console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length || 0
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          location: string | null;
          password: string | null;
          created_at: string;
          branding: any | null;
          pricing: any | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          location?: string | null;
          password?: string | null;
          created_at?: string;
          branding?: any | null;
          pricing?: any | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          location?: string | null;
          password?: string | null;
          created_at?: string;
          branding?: any | null;
          pricing?: any | null;
        };
      };
      exhibitors: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          email: string;
          company: string | null;
          phone: string | null;
          booth_data: any | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          email: string;
          company?: string | null;
          phone?: string | null;
          booth_data?: any | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          email?: string;
          company?: string | null;
          phone?: string | null;
          booth_data?: any | null;
          status?: string;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          exhibitor_id: string | null;
          order_number: string;
          customer_name: string;
          customer_email: string;
          customer_company: string | null;
          customer_phone: string | null;
          booth_data: any;
          pricing_data: any;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exhibitor_id?: string | null;
          order_number: string;
          customer_name: string;
          customer_email: string;
          customer_company?: string | null;
          customer_phone?: string | null;
          booth_data: any;
          pricing_data: any;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exhibitor_id?: string | null;
          order_number?: string;
          customer_name?: string;
          customer_email?: string;
          customer_company?: string | null;
          customer_phone?: string | null;
          booth_data?: any;
          pricing_data?: any;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
