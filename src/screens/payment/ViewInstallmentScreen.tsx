// src/screens/payment/ViewInstallmentScreen.tsx

import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../theme';
import { schemeMetrics } from '../../utils/schemeMetrics';
import {
  ScreenCanvas,
  PageHeader,
  SummaryCard,
  ProgressWidget,
  TimelineCard,
  MetricCard,
  StatusChip,
  BottomActionBar,
  EmptyState,
  money,
  prettyDate,
  type SummaryRow,
  type TimelineEntry,
} from '../../components/ui/premium';

type RouteProps = RouteProp<RootStackParamList, 'ViewInstallment'>;
type NavProps = NativeStackNavigationProp<RootStackParamList, 'ViewInstallment'>;

type TabKey = 'overview' | 'details' | 'history';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'details', label: 'Details' },
  { key: 'history', label: 'History' },
];

/** History rows shown before the user taps "Show all". */
const HISTORY_PREVIEW = 4;

/** Tolerant number parse — API sends numbers as strings, sometimes empty or formatted. */
const toNum = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** Renders a value only when it actually has content. */
const text = (value: unknown, suffix = ''): string => {
  const v = String(value ?? '').trim();
  return v ? `${v}${suffix}` : '—';
};

export default function ViewInstallmentScreen() {
  const { COLORS, SIZES } = useTheme();
  const navigation = useNavigation<NavProps>();
  const { ppData } = useRoute<RouteProps>().params;

  const [tab, setTab] = useState<TabKey>('overview');
  const [showAllHistory, setShowAllHistory] = useState(false);

  const scheme = ppData.schemeSummary;
  const paid = toNum(scheme?.schemaSummaryTransBalance?.insPaid);
  const total = toNum(scheme?.instalment);
  const mx = schemeMetrics(ppData);

  const canPay = !mx.closed && (mx.remaining > 0 || (total > 0 && paid < total));

  const status = useMemo(() => {
    if (mx.state === 'completed') return { tone: 'success' as const, label: 'Completed' };
    if (mx.state === 'active') return { tone: 'gold' as const, label: 'Active' };
    return { tone: 'warning' as const, label: 'Pending' };
  }, [mx.state]);

  // Fallback palette keys so a missing token never renders invisible text.
  const c = COLORS as Record<string, unknown>;
  const str = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback);
  const tabTrack = str(c.surfaceMuted ?? c.surface ?? c.card, 'rgba(0,0,0,0.05)');
  const tabActive = str(c.card ?? c.surface, '#FFFFFF');
  const tabTextOn = str(c.text ?? c.textPrimary, '#14110C');
  const tabTextOff = str(c.textMuted ?? c.muted, '#8A8578');
  const accent = str(c.gold ?? c.primary, '#B08D46');

  /* ---------------- Overview ---------------- */

  const moneyRows: SummaryRow[] = useMemo(() => {
    const rows: SummaryRow[] = [
      { label: 'Instalments paid', value: `${paid} of ${total || '—'}` },
      { label: 'Per instalment', value: money(mx.perInstalment) },
      { label: 'Amount received', value: money(mx.invested) },
      {
        label: 'Still to pay',
        value: mx.remaining > 0 ? money(mx.remaining) : 'Fully paid',
        highlight: mx.remaining > 0,
      },
    ];
    if (mx.committed > 0) {
      rows.push({ label: 'Total commitment', value: money(mx.committed) });
    }
    return rows;
  }, [paid, total, mx]);

  /* ---------------- Details ---------------- */

  // Enrolment + member merged into one card: same subject, no reason to scroll twice.
  const detailRows: SummaryRow[] = useMemo(() => {
    const pi = ppData.personalInfo;

    const street = [pi?.doorNo, pi?.area]
      .filter((v) => v && String(v).trim())
      .join(', ');
    const region = [pi?.city, pi?.address2, pi?.state, pi?.pinCode, pi?.country]
      .filter((v) => v && String(v).trim())
      .join(', ');
    const address = [street, region].filter(Boolean).join('\n');

    const rows: SummaryRow[] = [
      { label: 'Member', value: text(ppData.pName) },
      { label: 'Member ID', value: text(pi?.personalId) },
      { label: 'Registration no.', value: text(ppData.regNo) },
      { label: 'Group code', value: text(ppData.groupCode) },
      { label: 'Scheme', value: text(scheme?.schemeName) },
      { label: 'Joined', value: ppData.joinDate ? prettyDate(ppData.joinDate) : '—' },
      { label: 'Matures', value: ppData.maturityDate ? prettyDate(ppData.maturityDate) : '—' },
      { label: 'Next due', value: ppData.nextDueDate ? prettyDate(ppData.nextDueDate) : '—' },
      {
        label: 'Mobile',
        value: [pi?.mobile, pi?.mobile2].filter(Boolean).join(' · ') || '—',
      },
      { label: 'Address', value: address || '—', multiline: true },
    ];

    return rows;
  }, [ppData, scheme]);

  /* ---------------- History ---------------- */

  const timelineEntries: TimelineEntry[] = useMemo(
    () =>
      (ppData.paymentHistoryList ?? []).map((p, i) => ({
        id: p.receiptNo ?? `receipt-${i}`,
        title: `Instalment #${p.installment}`,
        meta: `Receipt ${text(p.receiptNo)}${p.chqBank ? ` · ${p.chqBank}` : ''}`,
        value: money(toNum(p.amount)),
        subValue: p.weight ? `${p.weight} g` : undefined,
        timestamp: p.updateTime ? prettyDate(p.updateTime) : '',
        tone: 'success' as const,
        icon: 'checkmark-circle-outline',
      })),
    [ppData.paymentHistoryList],
  );

  const visibleEntries = showAllHistory
    ? timelineEntries
    : timelineEntries.slice(0, HISTORY_PREVIEW);
  const hiddenCount = timelineEntries.length - visibleEntries.length;

  return (
    <View style={[s.container, { backgroundColor: COLORS.background }]}>
      <ScreenCanvas
        overlap={SIZES.margin.xxl}
        header={
          <PageHeader
            eyebrow={scheme?.schemeSName ?? ppData.groupCode}
            title="Instalments"
            caption={`REG ${ppData.regNo} · ${ppData.groupCode}`}
            bleedBottom={SIZES.margin.xxl}
             >
            <View style={s.headerBadges}>
              <StatusChip label={status.label} tone={status.tone} surface="hero" dot />
            </View>

            {total > 0 && (
              <ProgressWidget
                surface="hero"
                paid={paid}
                total={total}
                label="Scheme progress"
                note={
                  ppData.nextDueDate
                    ? `Next due ${prettyDate(ppData.nextDueDate)}`
                    : ppData.lastPaidDate
                      ? `Last paid ${prettyDate(ppData.lastPaidDate)}`
                      : undefined
                }
                style={{ marginTop: SIZES.margin.lg }}
              />
            )}
          </PageHeader>
        }
      >
        {/* Tabs keep the whole record to about one screen instead of four */}
        <View
          style={[
            s.tabBar,
            { backgroundColor: tabTrack, marginTop: SIZES.layout.sectionTight },
          ]}
        >
          {TABS.map(({ key, label }) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[s.tab, active && { backgroundColor: tabActive }]}
              >
                <Text
                  style={[
                    s.tabLabel,
                    { color: active ? tabTextOn : tabTextOff },
                    active && s.tabLabelActive,
                  ]}
                >
                  {label}
                  {key === 'history' && timelineEntries.length > 0
                    ? ` (${timelineEntries.length})`
                    : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'overview' && (
          <View style={{ marginTop: SIZES.margin.lg, marginBottom: SIZES.margin.xl }}>
            <View style={s.metricsRow}>
              <MetricCard
                label="Received"
                value={money(mx.invested)}
                caption={`${paid} of ${total || '—'} paid`}
                icon="wallet-outline"
                tone="gold"
                flex={1}
              />
              <MetricCard
                label="Gold accrued"
                value={`${text(scheme?.totalWeight ?? '0')} g`}
                caption={`Last ${text(scheme?.lastWeight ?? '0')} g`}
                icon="sparkles-outline"
                tone="positive"
                flex={1}
              />
            </View>
            <SummaryCard rows={moneyRows} style={{ marginTop: SIZES.margin.lg }} />
          </View>
        )}

        {tab === 'details' && (
          <View style={{ marginTop: SIZES.margin.lg, marginBottom: SIZES.margin.xl }}>
            <SummaryCard rows={detailRows} />
          </View>
        )}

        {tab === 'history' && (
          <View style={{ marginTop: SIZES.margin.lg, marginBottom: SIZES.margin.xl }}>
            {visibleEntries.length > 0 ? (
              <>
                <TimelineCard entries={visibleEntries} />
                {hiddenCount > 0 && (
                  <Pressable
                    onPress={() => setShowAllHistory(true)}
                    style={[s.moreBtn, { marginTop: SIZES.margin.lg }]}
                  >
                    <Text style={[s.moreLabel, { color: accent }]}>
                      Show {hiddenCount} earlier {hiddenCount === 1 ? 'receipt' : 'receipts'}
                    </Text>
                  </Pressable>
                )}
              </>
            ) : (
              <EmptyState
                title="No receipts yet"
                body="Each instalment you pay shows up here with its receipt number and weight."
                icon="receipt-outline"
                compact
              />
            )}
          </View>
        )}
      </ScreenCanvas>

      {canPay && (
        <BottomActionBar
          label={`NEXT INSTALMENT (#${paid + 1})`}
          value={money(mx.perInstalment)}
          note={ppData.nextDueDate ? `Due ${prettyDate(ppData.nextDueDate)}` : 'Ready to pay'}
          actionLabel="Pay instalment"
          onAction={() => navigation.navigate('PayInstallment', { ppData })}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  moreBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  moreLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});