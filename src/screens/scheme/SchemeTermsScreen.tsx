// src/screens/scheme/SchemeTermsScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   Hero states which scheme is being agreed to, with its key facts as
//   a hairline strip. The body reads like a legal document: scheme
//   terms as a SummaryCard of fact rows first (what actually differs
//   between schemes), then the general clauses as a numbered rail with
//   a reading-progress indicator.
//
//   Consent moved OUT of the footer stack into its own PaymentTile
//   above the pinned bar, so the checkbox is a deliberate target
//   rather than fine print wedged against the CTA.
//
// WHY THIS IS BETTER UX
//   • Scheme-specific facts are tabulated instead of prose bullets, so
//     "how many instalments, fixed or flexible, is enrolment open" is
//     answerable in one glance.
//   • A scroll-progress rule shows how much of the agreement remains,
//     which the previous unbounded list did not.
//   • The join control is pinned and always visible with its disabled
//     reason stated inline, instead of appearing only at the bottom.
//
// REUSED (unchanged business logic)
//   Route param `scheme` (ApiScheme), METAL_LABEL, navigation target
//   SchemeJoin. The COMMON_TERMS copy is preserved verbatim.
//
// NEW UI COMPONENTS
//   ScreenCanvas, PageHeader, SummaryCard, PaymentTile,
//   BottomActionBar, SectionHeading, StatusChip
// ─────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { METAL_LABEL } from '../../types/Scheme/Scheme';

import {
  ScreenCanvas,
  PageHeader,
  SummaryCard,
  PaymentTile,
  BottomActionBar,
  SectionHeading,
  StatusChip,
  asText,
  clamp01,
  type SummaryRow,
} from '../../components/ui/premium';

type RouteProps = RouteProp<RootStackParamList, 'SchemeTerms'>;
type NavProps = NativeStackNavigationProp<RootStackParamList, 'SchemeTerms'>;

// ── Common T&C (unchanged copy) ──────────────────────────────────
const COMMON_TERMS = [
  'All investments are subject to market risks. Please read all scheme-related documents carefully before investing.',
  'Rangas DigiGold is regulated under applicable laws and guidelines for gold savings schemes.',
  'Investors must complete KYC verification before joining any scheme. PAN card and Aadhaar details are mandatory.',
  'The company reserves the right to modify scheme terms with 30 days prior notice to enrolled members.',
  'In case of default or late payment, a penalty of 2% per month on the outstanding amount will be levied.',
  'Disputes arising from scheme participation shall be subject to the jurisdiction of courts in Chennai, Tamil Nadu.',
  'Any misrepresentation of personal information may lead to immediate cancellation of scheme membership without refund.',
  'Metal purity and weight will be certified by a government-approved hallmarking centre at the time of redemption.',
  'The scheme maturity value is calculated based on prevailing metal rates on the date of redemption.',
  'Nominee details must be provided at the time of enrolment and can be updated only once per scheme tenure.',
  'Digital receipts will be issued for every installment payment. Physical receipts are available on request.',
  'The company will not be held liable for losses arising due to force majeure events including natural calamities, war, or government directives.',
];

export default function SchemeTermsScreen() {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route = useRoute<RouteProps>();
  const { scheme } = route.params;

  const [accepted, setAccepted] = useState(false);
  const [progress, setProgress] = useState(0);

  const mLabel = METAL_LABEL[scheme.MetalType] ?? scheme.MetalType;
  const isFixed = scheme.FixedIns === 'Y';
  const canJoin = scheme.ADDNEWMEMBER === 'Y';

  // ── Preserved business logic ──
  const handleJoin = useCallback(() => {
    if (!accepted) return;
    navigation.navigate('SchemeJoin', { scheme });
  }, [accepted, navigation, scheme]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const scrollable = contentSize.height - layoutMeasurement.height;
      setProgress(scrollable > 0 ? clamp01(contentOffset.y / scrollable) : 1);
    },
    [],
  );

  // ── Scheme-specific facts, tabulated ──
  const schemeFacts: SummaryRow[] = useMemo(
    () => [
      { label: 'Scheme code', value: scheme.SchemeSName },
      { label: 'Metal', value: mLabel, highlight: true },
      { label: 'Instalments', value: String(scheme.Instalment) },
      {
        label: 'Instalment amount',
        value: isFixed ? 'Fixed each month' : 'Flexible each month',
      },
      {
        label: 'Ledger',
        value:
          scheme.WeightLedger === 'Y'
            ? 'Weight + amount tracked'
            : 'Amount only',
      },
      {
        label: 'Scheme type',
        value:
          scheme.SCHEMETYPE === 'A' ? 'Amount-based' : String(scheme.SCHEMETYPE),
      },
      {
        label: 'New enrolment',
        value: canJoin ? 'Open' : 'Closed',
      },
    ],
    [scheme, mLabel, isFixed, canJoin],
  );

  // ── Prose clauses that are genuinely scheme-specific ──
  const schemeClauses = useMemo(
    () => [
      `This scheme covers ${scheme.Instalment} instalments for ${mLabel} savings.`,
      isFixed
        ? 'Instalment type: Fixed – the same amount is paid each month.'
        : 'Instalment type: Flexible – the amount may vary each month.',
      `Only ${mLabel.toLowerCase()} purchases are eligible under this scheme.`,
      'Early exit before completing all instalments will result in forfeiture of bonus and may attract a processing fee.',
    ],
    [scheme.Instalment, mLabel, isFixed],
  );

  return (
    <ScreenCanvas
      overlap={moderateScale(24)}
      paddingBottom={moderateScale(40)}
      scrollProps={{ onScroll, scrollEventThrottle: 32 }}
      header={
        <PageHeader
          eyebrow="Before you join"
          title="Terms & conditions"
          caption={scheme.schemeName}
          bleedBottom={moderateScale(24)}
        >
          {/* Fact strip */}
          <View
            style={[
              s.factStrip,
              {
                marginTop: SIZES.margin.xxl,
                paddingTop: SIZES.padding.lg,
                borderTopColor: COLORS.heroHairline,
              },
            ]}
          >
            {[
              { label: 'Instalments', value: String(scheme.Instalment) },
              { label: 'Amount', value: isFixed ? 'Fixed' : 'Flexible' },
              { label: 'Metal', value: mLabel },
            ].map((f, i) => (
              <React.Fragment key={f.label}>
                {i > 0 && (
                  <View
                    style={[s.vRule, { backgroundColor: COLORS.heroHairline }]}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      asText(FONTS.micro),
                      { color: COLORS.heroTextMuted, fontSize: 10 },
                    ]}
                  >
                    {f.label}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      asText(FONTS.numeralSm),
                      { color: COLORS.heroTextPrimary, marginTop: 3 },
                    ]}
                  >
                    {f.value}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Reading progress */}
          <View
            style={[
              s.progressTrack,
              {
                marginTop: SIZES.margin.xl,
                backgroundColor: COLORS.heroHairline,
              },
            ]}
          >
            <View
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                borderRadius: 1.5,
                backgroundColor: COLORS.heroAccent,
              }}
            />
          </View>
          <Text
            style={[
              asText(FONTS.micro),
              { color: COLORS.heroTextMuted, marginTop: 6, fontSize: 10 },
            ]}
          >
            {Math.round(progress * 100)}% read
          </Text>
        </PageHeader>
      }
      footer={
        <BottomActionBar
          actionLabel={canJoin ? 'Join scheme' : 'Enrolment closed'}
          onAction={handleJoin}
          disabled={!accepted || !canJoin}
          helper={
            <PaymentTile
              marker="check"
              selected={accepted}
              title="I accept the terms & conditions"
              subtitle={`I have read and agree to all terms and general guidelines of ${scheme.schemeName}.`}
              onPress={() => setAccepted((p) => !p)}
              disabled={!canJoin}
            />
          }
        />
      }
    >
      {/* ── Scheme specifics ── */}
      <View style={{ marginTop: SIZES.layout.sectionTight }}>
        <SectionHeading
          eyebrow="This scheme"
          title="Specifics"
          caption="What differs from other schemes"
        />
        <SummaryCard rows={schemeFacts} style={{ marginTop: SIZES.margin.lg }} />
      </View>

      {!canJoin && (
        <StatusChip
          tone="warning"
          icon="lock-closed-outline"
          label="This scheme is not accepting new members"
          style={{ marginTop: SIZES.margin.lg }}
        />
      )}

      {/* ── Scheme clauses ── */}
      <View style={{ marginTop: SIZES.layout.section }}>
        <SectionHeading eyebrow="Scheme rules" title="Conditions" />
        <View style={{ marginTop: SIZES.margin.lg, gap: 12 }}>
          {schemeClauses.map((c, i) => (
            <View key={i} style={s.clauseRow}>
              <View style={[s.bullet, { backgroundColor: COLORS.metalGold }]} />
              <Text
                style={[
                  asText(FONTS.micro),
                  { color: COLORS.inkSecondary, flex: 1, lineHeight: 19 },
                ]}
              >
                {c}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── General terms ── */}
      <View style={{ marginTop: SIZES.layout.section }}>
        <SectionHeading
          eyebrow="Applies to all schemes"
          title="General terms"
          count={COMMON_TERMS.length}
        />

        <View
          style={[
            s.legalBlock,
            {
              marginTop: SIZES.margin.lg,
              borderRadius: SIZES.radius.panel,
              borderColor: COLORS.hairline,
              backgroundColor: COLORS.canvasElevated,
            },
          ]}
        >
          {COMMON_TERMS.map((term, idx) => (
            <View
              key={idx}
              style={[
                s.legalRow,
                {
                  paddingHorizontal: SIZES.padding.xl,
                  paddingVertical: SIZES.padding.lg,
                  borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: COLORS.hairline,
                },
              ]}
            >
              <Text
                style={[
                  asText(FONTS.micro),
                  {
                    color: COLORS.inkMuted,
                    width: 22,
                    fontSize: 10,
                    lineHeight: 19,
                  },
                ]}
              >
                {String(idx + 1).padStart(2, '0')}
              </Text>
              <Text
                style={[
                  asText(FONTS.micro),
                  { color: COLORS.inkSecondary, flex: 1, lineHeight: 19 },
                ]}
              >
                {term}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenCanvas>
  );
}

const s = StyleSheet.create({
  factStrip: { flexDirection: 'row', borderTopWidth: 1 },
  vRule: { width: 1, alignSelf: 'stretch', marginHorizontal: 12 },
  progressTrack: { height: 3, borderRadius: 1.5, overflow: 'hidden' },
  clauseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 5, height: 5, borderRadius: 2.5, marginTop: 7 },
  legalBlock: { borderWidth: 1, overflow: 'hidden' },
  legalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
});
