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
          is_admin: boolean;
          bio: string | null;
          bio_zh: string | null;
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
          is_admin?: boolean;
          bio?: string | null;
          bio_zh?: string | null;
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
          bio?: string | null;
          bio_zh?: string | null;
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
          status: 'active' | 'filled' | 'cancelled' | 'completed' | 'settled' | 'in_progress' | 'pending_result';
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
          status?: 'active' | 'filled' | 'cancelled' | 'completed' | 'settled' | 'in_progress' | 'pending_result';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          markup?: number;
          total_shares_offered?: number;
          shares_sold?: number;
          min_threshold?: number;
          status?: 'active' | 'filled' | 'cancelled' | 'completed' | 'settled' | 'in_progress' | 'pending_result';
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

// Joined types for API responses
export type ListingWithDetails = Listing & {
  player: Profile & { player_stats: PlayerStats | null };
  tournament: Tournament;
};

export type PlayerWithStats = Profile & {
  player_stats: PlayerStats | null;
  monthly_roi: MonthlyROI[];
};
