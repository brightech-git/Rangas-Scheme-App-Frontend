// src/screens/buygold/BuyGoldScreen.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '../../theme';
import type { ThemeContextType } from '../../theme/types';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { ratesService } from '../../api/services/ratesService';
import { RatesResponse } from '../../types/Rates/Rates';
import SubPageHeader from '../../components/ui/SubPageHeader';
import { useToast } from '../../components/ui/Toast';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = 'amount' | 'weight';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];
const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function BuyGoldScreen() {
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const theme = useTheme();
  const { COLORS, SIZES } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('amount');
  const [input, setInput] = useState('1000');

  const load = () => {
    setLoading(true);
    ratesService.getRates().then(setRates).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const goldRate = rates?.gold?.currentRate ?? 0; // ₹ per gram (916)

  const { amount, grams } = useMemo(() => {
    const val = parseFloat(input.replace(/[^0-9.]/g, '')) || 0;
    if (mode === 'amount') {
      return { amount: val, grams: goldRate > 0 ? val / goldRate : 0 };
    }
    return { amount: val * goldRate, grams: val };
  }, [input, mode, goldRate]);

  const onBuy = () => {
    if (amount <= 0) { toast.info('Enter an amount', { message: 'Please enter how much gold to buy.' }); return; }
    // Instant digital-gold purchase is not yet available — guide the user to the
    // supported savings path (schemes) rather than take a payment we can't fulfil.
    toast.info('Instant buy coming soon', {
      message: 'Meanwhile, you can start a gold savings scheme.',
      duration: 3500,
    });
    (navigation as any).navigate('Main', { screen: 'Scheme' });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.background }]} edges={['top']}>
      <SubPageHeader title="Buy Gold" subtitle="Digital gold · 916 (22K)" />

      {loading && !rates ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <View style={styles.body}>

          {/* Live rate card */}
          <View style={styles.rateCard}>
            <View style={styles.rateIcon}>
              <Ionicons name="diamond" size={22} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rateLabel}>Live Gold Rate · 916</Text>
              <Text style={styles.rateValue}>{goldRate > 0 ? `${inr(goldRate)} / g` : '—'}</Text>
            </View>
            <TouchableOpacity onPress={load} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="refresh" size={20} color={COLORS.whiteOpacity70} />
            </TouchableOpacity>
          </View>

          {/* Mode toggle */}
          <View style={styles.toggle}>
            {(['amount', 'weight'] as Mode[]).map((m) => {
              const active = mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.toggleBtn, active && { backgroundColor: COLORS.primary }]}
                  onPress={() => { setMode(m); setInput(m === 'amount' ? '1000' : '1'); }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.toggleTxt, { color: active ? COLORS.white : COLORS.textSecondary }]}>
                    {m === 'amount' ? 'By Amount (₹)' : 'By Weight (g)'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Input */}
          <View style={styles.inputBox}>
            <Text style={styles.inputPrefix}>{mode === 'amount' ? '₹' : ''}</Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={(v) => setInput(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.textTertiary}
            />
            <Text style={styles.inputSuffix}>{mode === 'weight' ? 'g' : ''}</Text>
          </View>

          {/* Quick amounts (amount mode) */}
          {mode === 'amount' && (
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((q) => (
                <TouchableOpacity key={q} style={styles.quickChip} onPress={() => setInput(String(q))} activeOpacity={0.8}>
                  <Text style={styles.quickTxt}>₹{q.toLocaleString('en-IN')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Conversion summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>You pay</Text>
              <Text style={styles.summaryValue}>{inr(Math.round(amount))}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>You get (approx.)</Text>
              <Text style={[styles.summaryValue, { color: COLORS.secondaryDark }]}>{grams.toFixed(4)} g</Text>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity style={styles.buyBtn} onPress={onBuy} activeOpacity={0.9}>
            <Ionicons name="cart-outline" size={20} color={COLORS.white} />
            <Text style={styles.buyBtnTxt}>Buy Gold</Text>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            Rates are indicative and refresh on load. Final price is confirmed at checkout.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = ({ COLORS, FONTS, SIZES, SHADOWS }: ThemeContextType) =>
  StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    body: { flex: 1, padding: SIZES.padding.lg, gap: SIZES.md },

    rateCard: {
      flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
      backgroundColor: COLORS.primary, borderRadius: SIZES.radius.xl,
      padding: SIZES.padding.xl, ...SHADOWS.orange,
    },
    rateIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.goldOpacity20, alignItems: 'center', justifyContent: 'center' },
    rateLabel: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.sm, color: COLORS.whiteOpacity70 },
    rateValue: { fontFamily: FONTS.family.bold, fontSize: SIZES.heading.h4, color: COLORS.white, marginTop: 2 },

    toggle: { flexDirection: 'row', backgroundColor: COLORS.backgroundSecondary, borderRadius: SIZES.radius.lg, padding: 4, gap: 4 },
    toggleBtn: { flex: 1, paddingVertical: SIZES.padding.md, borderRadius: SIZES.radius.md, alignItems: 'center' },
    toggleTxt: { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.sm },

    inputBox: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: COLORS.card, borderRadius: SIZES.radius.lg,
      borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: SIZES.padding.lg,
    },
    inputPrefix: { fontFamily: FONTS.family.bold, fontSize: SIZES.heading.h4, color: COLORS.textPrimary },
    input: { flex: 1, fontFamily: FONTS.family.bold, fontSize: SIZES.heading.h4, color: COLORS.textPrimary, paddingVertical: SIZES.padding.lg },
    inputSuffix: { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.lg, color: COLORS.textTertiary },

    quickRow: { flexDirection: 'row', gap: SIZES.sm },
    quickChip: {
      flex: 1, alignItems: 'center', paddingVertical: SIZES.padding.md,
      borderRadius: SIZES.radius.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
    },
    quickTxt: { fontFamily: FONTS.family.medium, fontSize: SIZES.font.sm, color: COLORS.textSecondary },

    summary: { backgroundColor: COLORS.card, borderRadius: SIZES.radius.lg, padding: SIZES.padding.lg, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.xs },
    summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    summaryLabel: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.md, color: COLORS.textSecondary },
    summaryValue: { fontFamily: FONTS.family.bold, fontSize: SIZES.font.lg, color: COLORS.textPrimary },
    summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginVertical: SIZES.md },

    buyBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
      backgroundColor: COLORS.primary, height: SIZES.button.height.lg, borderRadius: SIZES.radius.lg, ...SHADOWS.orange,
    },
    buyBtnTxt: { fontFamily: FONTS.family.bold, fontSize: SIZES.font.lg, color: COLORS.white, letterSpacing: 0.3 },
    disclaimer: { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xs, color: COLORS.textTertiary, textAlign: 'center', marginTop: SIZES.sm },
  });
