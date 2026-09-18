import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { theme } from '../theme';
import { formatDateTime } from '../utils/format';

interface TicketCardProps {
  label: string;
  title: string;
  startsAt: string | Date;
  venue?: string;
  participant?: string;
  quantity?: number;
  ticketCode: string;
  timeZone?: string;
  status?: string;
  compact?: boolean;
}

const voidStatuses = new Set(['CANCELLED', 'WITHDRAWN']);

/** ATH-992-TX01-INF — grouped so it can be read aloud at a gate. */
function formatTicketCode(code: string) {
  const clean = String(code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const tail = clean.slice(-9).padStart(9, '0');
  return `ATH-${tail.slice(0, 3)}-${tail.slice(3, 6)}-${tail.slice(6)}`;
}

/**
 * The entry pass, following the branded ticket in the latest designs: a green
 * gradient head carrying the wordmark and event name, a dark body of details,
 * then a perforated cut above the scan code.
 *
 * The QR stays on a white plate regardless of theme — scanners need the
 * contrast, and that plate is the one place light-on-dark is wrong.
 */
export const TicketCard = ({
  label,
  title,
  startsAt,
  venue,
  participant,
  quantity,
  ticketCode,
  timeZone,
  status,
  compact = false,
}: TicketCardProps) => {
  const isVoid = status ? voidStatuses.has(status) : false;

  return (
    <View style={[styles.ticket, compact && styles.compact, isVoid && styles.ticketVoid]}>
      <LinearGradient
        colors={isVoid ? ['#241717', '#150F0F'] : ['#123C1F', '#0E2416']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.head}
      >
        <Text style={styles.wordmark}>Athzy</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <TicketRow icon="calendar-outline" label="DATE & TIME" value={formatDateTime(startsAt, timeZone)} />
        <TicketRow icon="location-outline" label="VENUE" value={venue || 'Venue to be announced'} />
        {participant ? <TicketRow icon="person-outline" label="PARTICIPANT" value={participant} /> : null}
        {quantity && quantity > 1 ? <TicketRow icon="ticket-outline" label="TICKETS" value={String(quantity)} /> : null}
      </View>

      <View style={styles.cut}>
        <View style={styles.notchLeft} />
        <View style={styles.dash} />
        <View style={styles.notchRight} />
      </View>

      <View style={styles.scanArea}>
        {isVoid ? (
          <>
            <Ionicons name="close-circle-outline" size={30} color={theme.colors.error} />
            <Text style={styles.voidText}>
              {status === 'WITHDRAWN' ? 'ENTRY WITHDRAWN' : 'RESERVATION CANCELLED'}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.qr}>
              <QRCode
                value={`athzy://booking/${ticketCode}`}
                size={compact ? 116 : 136}
                backgroundColor="#FFFFFF"
                color="#0A0A0A"
              />
            </View>
            <Text style={styles.code}>{formatTicketCode(ticketCode)}</Text>
            <Text style={styles.scanHint}>Show this code at the gate</Text>
          </>
        )}
      </View>
    </View>
  );
};

const TicketRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
  <View style={styles.row}>
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={17} color={theme.colors.textSecondary} />
    </View>
    <View style={styles.rowCopy}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  ticket: {
    width: '100%',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
  },
  ticketVoid: { borderColor: 'rgba(240,68,68,0.28)' },
  compact: { maxWidth: 380, alignSelf: 'center' },

  head: { padding: theme.spacing.l, paddingBottom: theme.spacing.m },
  wordmark: {
    color: theme.colors.primary,
    fontFamily: theme.font.extrabold,
    fontSize: 17,
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  label: { ...theme.typography.label, color: theme.colors.textSecondary, marginTop: theme.spacing.m },
  title: { ...theme.typography.h3, fontSize: 20, marginTop: 5 },

  body: { paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.s, paddingBottom: theme.spacing.m },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, marginTop: theme.spacing.m },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { ...theme.typography.label, fontSize: 11, color: theme.colors.textMuted },
  rowValue: { ...theme.typography.bodySmall, color: theme.colors.text, fontFamily: theme.font.semibold, marginTop: 3 },

  cut: { flexDirection: 'row', alignItems: 'center' },
  notchLeft: { width: 22, height: 22, borderRadius: 11, marginLeft: -11, backgroundColor: theme.colors.background },
  notchRight: { width: 22, height: 22, borderRadius: 11, marginRight: -11, backgroundColor: theme.colors.background },
  dash: { flex: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.borderStrong },

  scanArea: { alignItems: 'center', paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.l },
  qr: { padding: 12, borderRadius: theme.borderRadius.m, backgroundColor: '#FFFFFF' },
  code: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontFamily: theme.font.bold,
    letterSpacing: 2.5,
    marginTop: theme.spacing.m,
  },
  scanHint: { ...theme.typography.caption, fontSize: 11, marginTop: 5 },

  voidText: {
    ...theme.typography.label,
    color: theme.colors.error,
    fontSize: 13,
    marginTop: theme.spacing.m,
    paddingBottom: theme.spacing.l,
  },
});
