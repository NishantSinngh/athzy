export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type TournamentRegistrationMode = 'INDIVIDUAL' | 'TEAM' | 'BOTH';
export type TournamentEntryType = 'INDIVIDUAL' | 'TEAM';
export type TournamentPaymentPolicy = 'FREE' | 'PAY_AT_VENUE';
export type TournamentFormat = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'GROUPS_AND_KNOCKOUT';
export type TournamentEntryStatus = 'CONFIRMED' | 'WITHDRAWN';

export type PublicProfile = {
  id: string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

export type SportSummary = {
  id: string;
  name: string;
  slug: string;
};

export type VenueSummary = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  timeZone?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type TournamentFixture = {
  id: string;
  date: string;
  time: string;
  team1Name: string;
  team2Name: string;
  team1Color?: string | null;
  team2Color?: string | null;
};

export type TournamentEntryMember = {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  isCaptain: boolean;
};

export type PublicTournamentEntry = {
  id: string;
  type: TournamentEntryType;
  teamName?: string | null;
  status: TournamentEntryStatus;
  registrant: PublicProfile;
  members: TournamentEntryMember[];
  createdAt: string;
};

export type TournamentEntry = PublicTournamentEntry & {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  acceptedTerms: boolean;
  ticketCode: string;
  paymentPolicy: TournamentPaymentPolicy;
  registrationFeeMinor: number;
  serviceFeeMinor: number;
  totalDueMinor: number;
  currency: string;
  dueAtVenue: { required: boolean; amountMinor: number; currency: string };
  withdrawnAt?: string | null;
};

export type Tournament = {
  id: string;
  eventId: string;
  title: string;
  description?: string | null;
  eventType?: string | null;
  startsAt: string;
  endsAt?: string | null;
  imageUrl?: string | null;
  skillLevel?: string | null;
  prizePool?: string | null;
  rules?: string[] | null;
  currency: string;
  organizer: PublicProfile;
  venue?: VenueSummary | null;
  sport?: SportSummary | null;
  fixtures: TournamentFixture[];
  status: TournamentStatus;
  registrationMode: TournamentRegistrationMode;
  format: TournamentFormat;
  registrationOpensAt: string;
  registrationClosesAt: string;
  maxEntries: number;
  minRosterSize: number;
  maxRosterSize: number;
  reportingAt?: string | null;
  entryGate?: string | null;
  paymentPolicy: TournamentPaymentPolicy;
  registrationFeeMinor: number;
  serviceFeeMinor: number;
  totalFeeMinor: number;
  dueAtVenue: { required: boolean; amountMinor: number; currency: string };
  entryCount: number;
  spotsRemaining: number | null;
  isFull: boolean;
  isRegistrationOpen: boolean;
  viewerEntry: TournamentEntry | null;
  entries?: PublicTournamentEntry[];
};

export type IndividualTournamentEntryInput = {
  type: 'INDIVIDUAL';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  acceptedTerms: true;
  position?: string;
};

export type TeamTournamentEntryInput = {
  type: 'TEAM';
  teamName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  acceptedTerms: true;
  members: Array<{
    name: string;
    email?: string;
    phone?: string;
    position?: string;
    isCaptain: boolean;
  }>;
};

export type CreateTournamentEntryInput = IndividualTournamentEntryInput | TeamTournamentEntryInput;

export type TournamentListParams = {
  sportId?: string;
  city?: string;
  status?: TournamentStatus;
  format?: TournamentFormat;
  registrationMode?: TournamentRegistrationMode;
  take?: number;
};

export type BookingKind = 'event' | 'tournament' | 'venue';
