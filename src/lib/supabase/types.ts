// Database types for Supabase
// These match the SQL schema and will be auto-generated later via `supabase gen types`

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          display_name_zh: string | null;
          email: string;
          role: 'investor' | 'player' | 'both';
          region: 'TW' | 'HK' | 'OTHER';
          avatar_url: string | null;
          is_verified: boolean;
          kyc_status: 'none' | 'pending' | 'approved' | 'rejected';
          kyc_approved_at: string | null;
          kyc_rejection_reason: string | null;
          kyc_reviewed_by: string | null;
          is_admin: boolean;
          bio: string | null;
          bio_zh: string | null;
          wallet_balance: number;
          hendon_mob_url: string | null;
          phone: string | null;
          social_twitter: string | null;
          social_instagram: string | null;
          social_facebook: string | null;
          color_tone: string | null;
          ai_kyc_verification_id: string | null;
          member_since: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          display_name_zh?: string | null;
          email: string;
          role: 'investor' | 'player' | 'both';
          region: 'TW' | 'HK' | 'OTHER';
          avatar_url?: string | null;
          is_verified?: boolean;
          kyc_status?: 'none' | 'pending' | 'approved' | 'rejected';
          kyc_approved_at?: string | null;
          kyc_rejection_reason?: string | null;
          kyc_reviewed_by?: string | null;
          is_admin?: boolean;
          bio?: string | null;
          bio_zh?: string | null;
          wallet_balance?: number;
          hendon_mob_url?: string | null;
          phone?: string | null;
          social_twitter?: string | null;
          social_instagram?: string | null;
          social_facebook?: string | null;
          color_tone?: string | null;
          ai_kyc_verification_id?: string | null;
          member_since?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          display_name_zh?: string | null;
          role?: 'investor' | 'player' | 'both';
          region?: 'TW' | 'HK' | 'OTHER';
          avatar_url?: string | null;
          is_verified?: boolean;
          kyc_status?: 'none' | 'pending' | 'approved' | 'rejected';
          kyc_approved_at?: string | null;
          kyc_rejection_reason?: string | null;
          kyc_reviewed_by?: string | null;
          bio?: string | null;
          bio_zh?: string | null;
          wallet_balance?: number;
          hendon_mob_url?: string | null;
          phone?: string | null;
          social_twitter?: string | null;
          social_instagram?: string | null;
          social_facebook?: string | null;
          color_tone?: string | null;
          ai_kyc_verification_id?: string | null;
          updated_at?: string;
        };
      };
      player_stats: {
        Row: {
          player_id: string;
          lifetime_roi: number;
          total_tournaments: number;
          cash_rate: number;
          total_staked_value: number;
          avg_finish: string;
          biggest_win: number;
          updated_at: string;
        };
        Insert: {
          player_id: string;
          lifetime_roi?: number;
          total_tournaments?: number;
          cash_rate?: number;
          total_staked_value?: number;
          avg_finish?: string;
          biggest_win?: number;
          updated_at?: string;
        };
        Update: {
          lifetime_roi?: number;
          total_tournaments?: number;
          cash_rate?: number;
          total_staked_value?: number;
          avg_finish?: string;
          biggest_win?: number;
          updated_at?: string;
        };
      };
      monthly_roi: {
        Row: {
          id: string;
          player_id: string;
          month: string;
          roi: number;
        };
        Insert: {
          id?: string;
          player_id: string;
          month: string;
          roi: number;
        };
        Update: {
          month?: string;
          roi?: number;
        };
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          name_zh: string | null;
          venue: string;
          venue_zh: string | null;
          date: string;
          buy_in: number;
          guaranteed_pool: number;
          type: 'MTT' | 'SNG' | 'SAT' | 'HU';
          game: 'NLHE' | 'PLO' | 'Mixed';
          region: 'TW' | 'HK' | 'OTHER';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_zh?: string | null;
          venue: string;
          venue_zh?: string | null;
          date: string;
          buy_in: number;
          guaranteed_pool: number;
          type: 'MTT' | 'SNG' | 'SAT' | 'HU';
          game: 'NLHE' | 'PLO' | 'Mixed';
          region: 'TW' | 'HK' | 'OTHER';
          created_at?: string;
        };
        Update: {
          name?: string;
          name_zh?: string | null;
          venue?: string;
          venue_zh?: string | null;
          date?: string;
          buy_in?: number;
          guaranteed_pool?: number;
          type?: 'MTT' | 'SNG' | 'SAT' | 'HU';
          game?: 'NLHE' | 'PLO' | 'Mixed';
          region?: 'TW' | 'HK' | 'OTHER';
        };
      };
      listings: {
        Row: {
          id: string;
          player_id: string;
          tournament_id: string;
          markup: number;
          total_shares_offered: number;
          shares_sold: number;
          min_threshold: number;
          status: 'active' | 'filled' | 'buy_in_released' | 'registered' | 'in_progress' | 'pending_result' | 'pending_deposit' | 'settled' | 'cancelled';
          registration_proof_url: string | null;
          registration_confirmed_at: string | null;
          prize_deposit_confirmed: boolean;
          prize_deposit_amount: number;
          deadline_registration: string | null;
          deadline_result: string | null;
          deadline_deposit: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          tournament_id: string;
          markup: number;
          total_shares_offered: number;
          shares_sold?: number;
          min_threshold?: number;
          status?: 'active' | 'filled' | 'buy_in_released' | 'registered' | 'in_progress' | 'pending_result' | 'pending_deposit' | 'settled' | 'cancelled';
          registration_proof_url?: string | null;
          deadline_registration?: string | null;
          deadline_result?: string | null;
          deadline_deposit?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          markup?: number;
          total_shares_offered?: number;
          shares_sold?: number;
          min_threshold?: number;
          status?: 'active' | 'filled' | 'buy_in_released' | 'registered' | 'in_progress' | 'pending_result' | 'pending_deposit' | 'settled' | 'cancelled';
          registration_proof_url?: string | null;
          registration_confirmed_at?: string | null;
          prize_deposit_confirmed?: boolean;
          prize_deposit_amount?: number;
          deadline_registration?: string | null;
          deadline_result?: string | null;
          deadline_deposit?: string | null;
          updated_at?: string;
        };
      };
      investments: {
        Row: {
          id: string;
          listing_id: string;
          investor_id: string;
          shares_purchased: number;
          amount_paid: number;
          currency: string;
          platform_fee: number;
          status: 'pending' | 'confirmed' | 'settled' | 'refunded';
          payment_method: string | null;
          payment_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          investor_id: string;
          shares_purchased: number;
          amount_paid: number;
          currency?: string;
          platform_fee: number;
          status?: 'pending' | 'confirmed' | 'settled' | 'refunded';
          payment_method?: string | null;
          payment_reference?: string | null;
          created_at?: string;
        };
        Update: {
          shares_purchased?: number;
          amount_paid?: number;
          currency?: string;
          platform_fee?: number;
          status?: 'pending' | 'confirmed' | 'settled' | 'refunded';
          payment_method?: string | null;
          payment_reference?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'purchase' | 'payout' | 'refund' | 'fee' | 'deposit' | 'withdrawal';
          investment_id: string | null;
          listing_id: string | null;
          amount: number;
          currency: string;
          payment_method: string | null;
          status: 'pending' | 'completed' | 'failed';
          description: string | null;
          description_zh: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'purchase' | 'payout' | 'refund' | 'fee' | 'deposit' | 'withdrawal';
          investment_id?: string | null;
          listing_id?: string | null;
          amount: number;
          currency?: string;
          payment_method?: string | null;
          status?: 'pending' | 'completed' | 'failed';
          description?: string | null;
          description_zh?: string | null;
          created_at?: string;
        };
        Update: {
          type?: 'purchase' | 'payout' | 'refund' | 'fee' | 'deposit' | 'withdrawal';
          amount?: number;
          currency?: string;
          payment_method?: string | null;
          status?: 'pending' | 'completed' | 'failed';
          description?: string | null;
          description_zh?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          player_id: string;
          reviewer_id: string;
          listing_id: string | null;
          rating: number;
          comment: string | null;
          comment_zh: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          reviewer_id: string;
          listing_id?: string | null;
          rating: number;
          comment?: string | null;
          comment_zh?: string | null;
          created_at?: string;
        };
        Update: {
          rating?: number;
          comment?: string | null;
          comment_zh?: string | null;
        };
      };
      escrow: {
        Row: {
          id: string;
          listing_id: string;
          total_held: number;
          status: 'holding' | 'settled' | 'refunded';
          tournament_result: string | null;
          prize_amount: number | null;
          settled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          total_held?: number;
          status?: 'holding' | 'settled' | 'refunded';
          tournament_result?: string | null;
          prize_amount?: number | null;
          settled_at?: string | null;
          created_at?: string;
        };
        Update: {
          total_held?: number;
          status?: 'holding' | 'settled' | 'refunded';
          tournament_result?: string | null;
          prize_amount?: number | null;
          settled_at?: string | null;
        };
      };
      testimonials: {
        Row: {
          id: string;
          name: string;
          name_zh: string | null;
          role: 'investor' | 'player';
          avatar: string | null;
          quote: string;
          quote_zh: string | null;
          region: 'TW' | 'HK' | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_zh?: string | null;
          role: 'investor' | 'player';
          avatar?: string | null;
          quote: string;
          quote_zh?: string | null;
          region?: 'TW' | 'HK' | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          name_zh?: string | null;
          role?: 'investor' | 'player';
          avatar?: string | null;
          quote?: string;
          quote_zh?: string | null;
          region?: 'TW' | 'HK' | null;
          is_active?: boolean;
        };
      };
      tournament_results: {
        Row: {
          id: string;
          listing_id: string;
          player_id: string;
          tournament_result: 'win' | 'loss' | 'cancelled';
          prize_amount: number;
          total_entries: number | null;
          finish_position: number | null;
          proof_url: string | null;
          notes: string | null;
          status: 'pending_review' | 'approved' | 'rejected';
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          player_id: string;
          tournament_result: 'win' | 'loss' | 'cancelled';
          prize_amount?: number;
          total_entries?: number | null;
          finish_position?: number | null;
          proof_url?: string | null;
          notes?: string | null;
          status?: 'pending_review' | 'approved' | 'rejected';
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Update: {
          tournament_result?: 'win' | 'loss' | 'cancelled';
          prize_amount?: number;
          total_entries?: number | null;
          finish_position?: number | null;
          proof_url?: string | null;
          notes?: string | null;
          status?: 'pending_review' | 'approved' | 'rejected';
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
        };
      };
      listing_packages: {
        Row: {
          id: string;
          player_id: string;
          festival_name: string;
          festival_name_zh: string | null;
          festival_brand: string;
          venue: string;
          venue_zh: string | null;
          region: 'TW' | 'HK' | 'OTHER';
          festival_start: string;
          festival_end: string;
          markup: number;
          total_action_offered: number;
          action_sold: number;
          min_threshold: number;
          budget_min: number;
          budget_max: number;
          planned_events_min: number;
          planned_events_max: number;
          notes: string | null;
          notes_zh: string | null;
          status: 'active' | 'filled' | 'in_progress' | 'pending_result' | 'settled' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          festival_name: string;
          festival_name_zh?: string | null;
          festival_brand: string;
          venue: string;
          venue_zh?: string | null;
          region: 'TW' | 'HK' | 'OTHER';
          festival_start: string;
          festival_end: string;
          markup: number;
          total_action_offered: number;
          action_sold?: number;
          min_threshold?: number;
          budget_min: number;
          budget_max: number;
          planned_events_min?: number;
          planned_events_max?: number;
          notes?: string | null;
          notes_zh?: string | null;
          status?: 'active' | 'filled' | 'in_progress' | 'pending_result' | 'settled' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          festival_name?: string;
          festival_name_zh?: string | null;
          festival_brand?: string;
          venue?: string;
          venue_zh?: string | null;
          region?: 'TW' | 'HK' | 'OTHER';
          festival_start?: string;
          festival_end?: string;
          markup?: number;
          total_action_offered?: number;
          action_sold?: number;
          min_threshold?: number;
          budget_min?: number;
          budget_max?: number;
          planned_events_min?: number;
          planned_events_max?: number;
          notes?: string | null;
          notes_zh?: string | null;
          status?: 'active' | 'filled' | 'in_progress' | 'pending_result' | 'settled' | 'cancelled';
          updated_at?: string;
        };
      };
      package_entries: {
        Row: {
          id: string;
          package_id: string;
          tournament_id: string | null;
          event_name: string;
          event_name_zh: string | null;
          buy_in: number;
          bullet_number: number;
          result: 'pending' | 'win' | 'loss' | 'cancelled' | null;
          prize_amount: number;
          finish_position: number | null;
          total_entries: number | null;
          proof_url: string | null;
          played_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          package_id: string;
          tournament_id?: string | null;
          event_name: string;
          event_name_zh?: string | null;
          buy_in: number;
          bullet_number?: number;
          result?: 'pending' | 'win' | 'loss' | 'cancelled' | null;
          prize_amount?: number;
          finish_position?: number | null;
          total_entries?: number | null;
          proof_url?: string | null;
          played_at?: string | null;
          created_at?: string;
        };
        Update: {
          event_name?: string;
          event_name_zh?: string | null;
          buy_in?: number;
          bullet_number?: number;
          result?: 'pending' | 'win' | 'loss' | 'cancelled' | null;
          prize_amount?: number;
          finish_position?: number | null;
          total_entries?: number | null;
          proof_url?: string | null;
          played_at?: string | null;
        };
      };
      kyc_audit_log: {
        Row: {
          id: string;
          user_id: string;
          action: 'approve' | 'reject';
          reviewed_by: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: 'approve' | 'reject';
          reviewed_by: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          reason?: string | null;
        };
      };
      ai_kyc_verifications: {
        Row: {
          id: string;
          user_id: string;
          overall_score: number;
          recommendation: 'auto_approve' | 'manual_review' | 'auto_reject';
          summary: string | null;
          id_front_analysis: Record<string, unknown>;
          id_back_analysis: Record<string, unknown>;
          selfie_analysis: Record<string, unknown>;
          address_proof_analysis: Record<string, unknown>;
          extracted_name: string | null;
          extracted_id_number: string | null;
          extracted_dob: string | null;
          extracted_address: string | null;
          extracted_doc_type: string | null;
          extracted_doc_expiry: string | null;
          face_match_score: number | null;
          flags: Array<{ code: string; severity: string; message: string }>;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          model_used: string | null;
          processing_time_ms: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          overall_score?: number;
          recommendation?: 'auto_approve' | 'manual_review' | 'auto_reject';
          summary?: string | null;
          id_front_analysis?: Record<string, unknown>;
          id_back_analysis?: Record<string, unknown>;
          selfie_analysis?: Record<string, unknown>;
          address_proof_analysis?: Record<string, unknown>;
          extracted_name?: string | null;
          extracted_id_number?: string | null;
          extracted_dob?: string | null;
          extracted_address?: string | null;
          extracted_doc_type?: string | null;
          extracted_doc_expiry?: string | null;
          face_match_score?: number | null;
          flags?: Array<{ code: string; severity: string; message: string }>;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          model_used?: string | null;
          processing_time_ms?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          overall_score?: number;
          recommendation?: 'auto_approve' | 'manual_review' | 'auto_reject';
          summary?: string | null;
          id_front_analysis?: Record<string, unknown>;
          id_back_analysis?: Record<string, unknown>;
          selfie_analysis?: Record<string, unknown>;
          address_proof_analysis?: Record<string, unknown>;
          extracted_name?: string | null;
          extracted_id_number?: string | null;
          extracted_dob?: string | null;
          extracted_address?: string | null;
          extracted_doc_type?: string | null;
          extracted_doc_expiry?: string | null;
          face_match_score?: number | null;
          flags?: Array<{ code: string; severity: string; message: string }>;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          model_used?: string | null;
          processing_time_ms?: number | null;
          completed_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type PlayerStats = Database['public']['Tables']['player_stats']['Row'];
export type MonthlyROI = Database['public']['Tables']['monthly_roi']['Row'];
export type Tournament = Database['public']['Tables']['tournaments']['Row'];
export type Listing = Database['public']['Tables']['listings']['Row'];
export type Investment = Database['public']['Tables']['investments']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Escrow = Database['public']['Tables']['escrow']['Row'];
export type Testimonial = Database['public']['Tables']['testimonials']['Row'];
export type TournamentResultRecord = Database['public']['Tables']['tournament_results']['Row'];
export type KycAuditLog = Database['public']['Tables']['kyc_audit_log']['Row'];
export type AiKycVerification = Database['public']['Tables']['ai_kyc_verifications']['Row'];

// Joined types for API responses
export type ListingWithDetails = Listing & {
  player: Profile & { player_stats: PlayerStats | null };
  tournament: Tournament;
};

export type PlayerWithStats = Profile & {
  player_stats: PlayerStats | null;
  monthly_roi: MonthlyROI[];
};

export type ListingPackage = Database['public']['Tables']['listing_packages']['Row'];
export type PackageEntry = Database['public']['Tables']['package_entries']['Row'];
