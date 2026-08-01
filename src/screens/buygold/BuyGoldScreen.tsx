// src/screens/buygold/BuyGoldScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   A calculator, so the input IS the hero. The amount field sits in
//   the dark zone at display size with the live rate directly beneath
//   it, and the converted figure updates in place. Presets are a
//   hairline lattice on paper; the commit control is a pinned
//   BottomActionBar that always shows what is being bought.
//
// WHY THIS IS BETTER UX
//   • Typing and its result are adjacent and both above the fold —
//     previously the conversion summary sat below the presets and
//     could be pushed off-screen by the keyboard.
//   • The pinned bar means the buy action is reachable with the
//     keyboard open, which the old flex-spacer layout could not do.
//   • Amount/weight switching preserves the equivalent value instead
//     of resetting to a default, so the member doesn't lose their
//     place.
//
// REUSED (unchanged business logic)
//   ratesService.getRates, useToast, navigation target Main>Scheme.
//   The "instant buy coming soon" guard is preserved verbatim.
//
// NEW UI COMPONENTS
//   ScreenCanvas, PageHeader, BottomActionBar, SummaryCard,
//   PaymentTile, SectionHeading, SkeletonBlock
// ─────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { ratesService } from '../../api/services/ratesService';
import { RatesResponse } from '../../types/Rates/Rates';
import { useToast } from '../../components/ui/Toast';

import {
  ScreenCanvas,
  PageHeader,
  BottomActionBar,
  SummaryCard,
  SectionHeading,
  SkeletonBlock,
  asText,
  money,
  type SummaryRow,
} from '../../components/ui/premium';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = 'amount' | 'weight';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 25000];

export default function BuyGoldScreen() {
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('amount');
  const [input, setInput] = useState('1000');

  // ── Data (identical call to before) ──
  const load = useCallback(() => {
    setLoading(true);
    ratesService
      .getRates()
      .then(setRates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goldRate = rates?.gold?.currentRate ?? 0; // ₹ per gram (916)

  const { amount, weight } = useMemo(() => {
    const val = parseFloat(input.replace(/[^0-9.]/g, '')) || 0;
    if (mode === 'amount') {
      return { amount: val, weight: goldRate > 0 ? val / goldRate : 0 };
    }
    return { amount: val * goldRate, weight: val };
  }, [input, mode, goldRate]);

  // Switching mode carries the equivalent value across
  const switchMode = useCallback(
    (m: Mode) => {
      if (m === mode) return;
      if (m === 'weight') setInput(weight > 0 ? weight.toFixed(4) : '1');
      else setInput(amount > 0 ? String(Math.round(amount)) : '1000');
      setMode(m);
    },
    [mode, amount, weight],
  );

  // ── Preserved business guard ──
  const onBuy = useCallback(() => {
    if (amount <= 0) {
      toast.info('Enter an amount', {
        message: 'Please enter how much gold to buy.',
      });
      return;
    }
    // Instant digital-gold purchase is not yet available — guide the user to the
    // supported savings path (schemes) rather than take a payment we can't fulfil.
    toast.info('Instant buy coming soon', {
      message: 'Meanwhile, you can start a gold savings scheme.',
      duration: 3500,
    });
    (navigation as any).navigate('Main', { screen: 'Scheme' });
  }, [amount, toast, navigation]);

  const breakdown: SummaryRow[] = useMemo(
    () => [
      { label: 'Live rate · 916 (22K)', value: `${money(goldRate)} / g` },
      {
        label: mode === 'amount' ? 'Amount entered' : 'Weight entered',
        value:
          mode === 'amount'
            ? money(amount)
            : `${weight.toFixed(4)} g`,
      },
      {
        label: mode === 'amount' ? 'Gold received' : 'Amount payable',
        value:
          mode === 'amount' ? `${weight.toFixed(4)} g` : money(amount),
        highlight: true,
      },
      { label: 'Total payable', value: money(Math.round(amount)), total: true },
    ],
    [goldRate, mode, amount, weight],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenCanvas
        overlap={moderateScale(24)}
        paddingBottom={moderateScale(40)}
        header={
          <PageHeader
            eyebrow="Digital gold · 916"
            title="Buy gold"
            bleedBottom={moderateScale(24)}
            actions={[{ icon: 'refresh-outline', onPress: load }]}
          >
            {/* ── Mode rail ── */}
            <View
              style={[
                s.rail,
                {
                  marginTop: SIZES.margin.xxl,
                  borderColor: COLORS.heroHairline,
                  borderRadius: SIZES.radius.tile,
                },
              ]}
            >
              {(['amount', 'weight'] as Mode[]).map((m, i) => {
                const on = m === mode;
                return (
                  <Pressable
                    key={m}
                    onPress={() => switchMode(m)}
                    style={({ pressed }) => [
                      s.railItem,
                      {
                        paddingVertical: SIZES.padding.md,
                        borderLeftWidth:
                          i === 0 ? 0 : StyleSheet.hairlineWidth,
                        borderLeftColor: COLORS.heroHairline,
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        asText(FONTS.microBold),
                        {
                          color: on
                            ? COLORS.heroTextPrimary
                            : COLORS.heroTextMuted,
                        },
                      ]}
                    >
                      {m === 'amount' ? 'By amount' : 'By weight'}
                    </Text>
                    {on && (
                      <View
                        style={[
                          s.railMark,
                          { backgroundColor: COLORS.heroAccent },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* ── The input, at display size ── */}
            <View style={{ marginTop: SIZES.margin.xxl }}>
              <Text
                style={[
                  asText(FONTS.eyebrow),
                  { color: COLORS.heroTextTertiary },
                ]}
              >
                {mode === 'amount' ? 'You pay' : 'You want'}
              </Text>

              <View style={s.inputRow}>
                {mode === 'amount' && (
                  <Text
                    style={[
                      asText(FONTS.displayXL),
                      { color: COLORS.heroTextSecondary },
                    ]}
                  >
                    ₹
                  </Text>
                )}
                <TextInput
                  value={input}
                  onChangeText={(v) => setInput(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.heroTextMuted}
                  selectionColor={COLORS.heroAccent}
                  style={[
                    asText(FONTS.displayXL),
                    {
                      color: COLORS.heroTextPrimary,
                      flex: 1,
                      padding: 0,
                    },
                  ]}
                />
                {mode === 'weight' && (
                  <Text
                    style={[
                      asText(FONTS.displaySm),
                      { color: COLORS.heroTextSecondary },
                    ]}
                  >
                    g
                  </Text>
                )}
              </View>

              <View
                style={[
                  s.convRow,
                  {
                    marginTop: SIZES.margin.md,
                    paddingTop: SIZES.padding.md,
                    borderTopColor: COLORS.heroHairline,
                  },
                ]}
              >
                {loading && !rates ? (
                  <SkeletonBlock width="60%" height={14} surface="hero" />
                ) : (
                  <>
                    <Text
                      style={[
                        asText(FONTS.micro),
                        { color: COLORS.heroTextTertiary },
                      ]}
                    >
                      {mode === 'amount' ? 'You get' : 'You pay'}
                    </Text>
                    <Text
                      style={[
                        asText(FONTS.numeral),
                        { color: COLORS.heroAccent },
                      ]}
                    >
                      {mode === 'amount'
                        ? `${weight.toFixed(4)} g`
                        : money(Math.round(amount))}
                    </Text>
                  </>
                )}
              </View>

              <Text
                style={[
                  asText(FONTS.micro),
                  { color: COLORS.heroTextMuted, marginTop: 6, fontSize: 10 },
                ]}
              >
                At {goldRate > 0 ? `${money(goldRate)} / g` : '—'} · 916 (22K)
              </Text>
            </View>
          </PageHeader>
        }
        footer={
          <BottomActionBar
            label="Total payable"
            value={money(Math.round(amount))}
            note={`${weight.toFixed(4)} g of 916 gold`}
            actionLabel="Buy gold"
            actionVariant="gold"
            disabled={amount <= 0}
            onAction={onBuy}
          />
        }
      >
        {/* ── Presets ── */}
        {mode === 'amount' && (
          <View style={{ marginTop: SIZES.layout.sectionTight }}>
            <SectionHeading eyebrow="Shortcuts" title="Common amounts" />

            <View style={[s.presetGrid, { marginTop: SIZES.margin.lg }]}>
              {QUICK_AMOUNTS.map((q) => {
                const on = String(q) === input;
                return (
                  <Pressable
                    key={q}
                    onPress={() => setInput(String(q))}
                    style={({ pressed }) => [
                      s.preset,
                      {
                        borderRadius: SIZES.radius.tile,
                        borderColor: on ? COLORS.primary : COLORS.hairline,
                        borderWidth: on ? 1.5 : 1,
                        backgroundColor: COLORS.canvasElevated,
                        paddingVertical: SIZES.padding.lg,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        asText(FONTS.microBold),
                        { color: on ? COLORS.primary : COLORS.inkPrimary },
                      ]}
                    >
                      {money(q)}
                    </Text>
                    <Text
                      style={[
                        asText(FONTS.micro),
                        { color: COLORS.inkTertiary, fontSize: 9 },
                      ]}
                    >
                      {goldRate > 0 ? `${(q / goldRate).toFixed(3)} g` : '—'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Order breakdown ── */}
        <View style={{ marginTop: SIZES.layout.section }}>
          <SectionHeading eyebrow="Order" title="Breakdown" />
          <SummaryCard rows={breakdown} style={{ marginTop: SIZES.margin.lg }} />
        </View>

        {/* ── Disclaimer ── */}
        <View style={[s.note, { marginTop: SIZES.layout.block }]}>
          <Ionicons
            name="information-circle-outline"
            size={SIZES.icon.sm}
            color={COLORS.inkMuted}
          />
          <Text
            style={[
              asText(FONTS.micro),
              { color: COLORS.inkMuted, flex: 1, fontSize: 10 },
            ]}
          >
            Rates are indicative and refresh on load. The final price is
            confirmed at checkout.
          </Text>
        </View>
      </ScreenCanvas>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  rail: { flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
  railItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  railMark: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    borderRadius: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  preset: {
    width: '31.5%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});
