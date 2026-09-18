export type ChatChannelKind = 'EVENT_WELCOME' | 'EVENT_GENERAL' | 'EVENT_ANNOUNCEMENTS' | 'DIRECT' | 'TEAM';

export type ChatChannelMapping = {
  id: string;
  streamCid: string;
  kind: ChatChannelKind;
  status: 'PENDING' | 'ACTIVE' | 'FAILED' | 'ARCHIVED';
};

export type ChatEvent = {
  id: string;
  title: string;
  imageUrl?: string | null;
  startsAt: string;
  role: string;
  chatChannels: ChatChannelMapping[];
};

export type DirectConversation = {
  user: { id: string; fullName?: string | null; avatarUrl?: string | null };
  channel: ChatChannelMapping | null;
};

export type EventWorkspace = ChatEvent & {
  endsAt: string;
  registrations: Array<{ id: string; teamName?: string | null; captainName?: string | null; roster?: Array<{ id?: string; name: string; position?: string | null; isCaptain?: boolean }> | null }>;
  kind?: 'EVENT' | 'TOURNAMENT';
  fixtures?: Array<{ id: string; date: string; time: string; team1Name: string; team2Name: string; team1Color?: string | null; team2Color?: string | null }>;
  entries?: Array<{ id: string; teamName?: string | null; captainName?: string | null; roster?: Array<{ id?: string; name: string; position?: string | null; isCaptain?: boolean }> | null }>;
  participantCount?: number;
  venue?: { id: string; name: string; address: string; city: string; timeZone: string } | null;
  sport?: { id: string; name: string; slug: string } | null;
  organizer?: { id: string; fullName?: string | null; avatarUrl?: string | null };
  tournament?: { status: string; format: string; reportingAt?: string | null; entryGate?: string | null; maxEntries: number } | null;
};

export function activeChannels(channels: ChatChannelMapping[] = []) {
  return channels.filter((channel) => channel.status === 'ACTIVE');
}

export function parseStreamCid(streamCid: string) {
  const separator = streamCid.indexOf(':');
  if (separator < 1 || separator === streamCid.length - 1) return null;
  return { type: streamCid.slice(0, separator), id: streamCid.slice(separator + 1) };
}
