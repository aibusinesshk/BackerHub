export type Locale = 'en' | 'zh-TW' | 'zh-HK';
export type Currency = 'USD' | 'TWD' | 'HKD';
export type Region = 'TW' | 'HK' | 'OTHER';
export type UserRole = 'investor' | 'player' | 'both';
export type PlayerColorTone = 'red' | 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'rose' | 'gold';

export interface Player {
  id: string;
  displayName: string;
  displayNameZh?: string;
  avatarUrl: string;
  region: Region;
  isVerified: boolean;
  memberSince: string;
  stats: PlayerStats;
  bio: string;
  bioZh?: string;
  hendonMobUrl?: string;
  colorTone?: PlayerColorTone;
}

export interface PlayerStats {
  lifetimeROI: number;
  totalTournaments: number;
  cashRate: number;
  totalStakedValue: number;
  avgFinish: string;
  biggestWin: number;
  monthlyROI: MonthlyROI[];
}

export interface MonthlyROI {
  month: string;
  roi: number;
}

export interface Tournament {
  id: string;
  name: string;
  nameZh?: string;
  venue: string;
  venueZh?: string;
  date: string;
  buyIn: number;
  guaranteedPool: number;
  type: 'MTT' | 'SNG' | 'SAT' | 'HU';
  game: 'NLHE' | 'PLO' | 'Mixed';
  region: Region;
}

export interface StakingListing {
  id: string;
  playerId: string;
  player: Player;
  tournament: Tournament;
  markup: number;
  totalActionOffered: number;
  actionSold: number;
  minThreshold: number;
  status: ListingStatus;
  registrationProofUrl: string | null;
  registrationConfirmedAt: string | null;
  prizeDepositConfirmed: boolean;
  prizeDepositAmount: number;
  deadlineRegistration: string | null;
  deadlineResult: string | null;
  deadlineDeposit: string | null;
  createdAt: string;
}

export type ListingStatus =
  | 'active'
  | 'filled'
  | 'buy_in_released'
  | 'registered'
  | 'in_progress'
  | 'pending_result'
  | 'pending_deposit'
  | 'settled'
  | 'cancelled';

export interface TournamentResult {
  id: string;
  listingId: string;
  playerId: string;
  tournamentResult: 'win' | 'loss' | 'cancelled';
  prizeAmount: number;
  totalEntries: number | null;
  finishPosition: number | null;
  proofUrl: string | null;
  notes: string | null;
  status: 'pending_review' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
}

export interface PlayerReliability {
  tournamentsSettledOnTime: number;
  tournamentsDefaulted: number;
  reliabilityScore: number;
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'payout' | 'refund' | 'fee' | 'deposit' | 'withdrawal' | 'prize_deposit' | 'buy_in_release';
  listingId?: string;
  amount: number;
  currency: Currency;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  description: string;
  descriptionZh?: string;
}

export interface Review {
  id: string;
  playerId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  commentZh?: string;
  createdAt: string;
}

export interface MockUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  region: Region;
  avatarUrl: string;
}

export type PackageStatus =
  | 'active'
  | 'filled'
  | 'in_progress'
  | 'pending_result'
  | 'settled'
  | 'cancelled';

export interface PackageListing {
  id: string;
  playerId: string;
  player: Player;
  festivalName: string;
  festivalNameZh?: string;
  festivalBrand: string;
  venue: string;
  venueZh?: string;
  region: Region;
  festivalStart: string;
  festivalEnd: string;
  markup: number;
  totalActionOffered: number;
  actionSold: number;
  minThreshold: number;
  budgetMin: number;
  budgetMax: number;
  plannedEventsMin: number;
  plannedEventsMax: number;
  notes?: string;
  notesZh?: string;
  status: PackageStatus;
  entries: PackageEntry[];
  createdAt: string;
}

export interface PackageEntry {
  id: string;
  packageId: string;
  tournamentId?: string;
  eventName: string;
  eventNameZh?: string;
  buyIn: number;
  bulletNumber: number;
  result: 'pending' | 'win' | 'loss' | 'cancelled' | null;
  prizeAmount: number;
  finishPosition?: number;
  totalEntries?: number;
  proofUrl?: string;
  playedAt?: string;
  createdAt: string;
}

export interface AIProofVerification {
  id: string;
  listingId: string;
  userId: string;
  proofType: 'buyin' | 'prize';
  overallScore: number;
  recommendation: 'auto_approve' | 'manual_review' | 'auto_reject';
  summary: string | null;
  extractedTournamentName: string | null;
  extractedBuyIn: number | null;
  extractedPrizeAmount: number | null;
  extractedFinishPosition: number | null;
  extractedTotalEntries: number | null;
  extractedDate: string | null;
  extractedPlayerName: string | null;
  dataConsistencyScore: number | null;
  imageAnalysis: { quality: number; authenticity: number };
  flags: Array<{ code: string; severity: string; message: string }>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  modelUsed: string | null;
  processingTimeMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface PlatformStats {
  totalBacked: number;
  tournamentsStaked: number;
  activePlayers: number;
  avgROI: number;
  prizeDistributions: number;
  countriesServed: number;
}
