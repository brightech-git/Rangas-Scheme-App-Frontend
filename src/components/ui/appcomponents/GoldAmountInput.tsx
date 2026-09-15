// Shared dual amount/weight input used by BuyGoldScreen (step 2) and
// PayInstallmentScreen (flexible / lumpsum modes).
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText, money, SummaryCard, SectionHeading, type SummaryRow } from '../premium';

type Props = {
  // controlled values
  amountInput: string;
  weightInput: string;
  onAmountChange: (v: string) => void;
  onWeightChange: (v: string) => void;
  goldRate: number;
  ratesLoading?: boolean;
  // minimum amount from scheme COMMAMT
  minAmount?: number;
  // optional breakdown rows shown below the inputs
  breakdownRows?: SummaryRow[];
  // optional preset quick-select amounts (shown when provided)
  presets?: number[];
  onPresetPress?: (v: number) => void;
};

export default function GoldAmountInput({
  amountInput,
  weightInput,
  onAmountChange,
  onWeightChange,
  goldRate,
  ratesLoading,
  minAmount,
  breakdownRows,
  presets,
  onPresetPress,
}: Props) {
  const { COLORS, FONTS, SIZES } = useTheme();
  const enteredAmount = parseFloat(amountInput) || 0;
  const belowMin = minAmount != null && enteredAmount > 0 && enteredAmount < minAmount;

  return (
    <>
      <SectionHeading
        // eyebrow="Enter"
        title="Amount or weight"
        caption="Type in either box — the other updates automatically"
      />

      {/* Side-by-side amount / weight boxes */}
      <View style={[s.dualRow, { marginTop: SIZES.margin.lg }]}>
        <View style={[s.equalBox, { borderRadius: SIZES.radius.tile, borderColor: COLORS.hairline, backgroundColor: COLORS.canvasElevated }]}>
          <Text style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary }]}>Amount (₹)</Text>
          <TextInput
            value={amountInput}
            onChangeText={onAmountChange}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={COLORS.inkMuted}
            selectionColor={COLORS.primary}
            style={[asText(FONTS.displaySm), s.equalValue, { color: COLORS.inkPrimary }]}
          />
        </View>

        <View style={[s.arrowBadge, { backgroundColor: COLORS.canvasElevated, borderColor: COLORS.hairline }]}>
          <Ionicons name="swap-horizontal" size={18} color={COLORS.inkTertiary} />
        </View>

        <View style={[s.equalBox, { borderRadius: SIZES.radius.tile, borderColor: COLORS.hairline, backgroundColor: COLORS.canvasElevated }]}>
          <Text style={[asText(FONTS.eyebrow), { color: COLORS.inkTertiary }]}>Weight (g)</Text>
          <TextInput
            value={weightInput}
            onChangeText={onWeightChange}
            keyboardType="decimal-pad"
            placeholder="0.0000"
            placeholderTextColor={COLORS.inkMuted}
            selectionColor={COLORS.primary}
            style={[asText(FONTS.displaySm), s.equalValue, { color: COLORS.inkPrimary }]}
          />
        </View>
      </View>

      <Text style={[asText(FONTS.micro), { color: COLORS.inkMuted, marginTop: 8, fontSize: 10 }]}>
        {ratesLoading && goldRate === 0
          ? 'Loading rate…'
          : goldRate > 0
          ? `At ${money(goldRate)} / g · 916 (22K)`
          : '—'}
      </Text>

      {minAmount != null && (
        <Text style={[asText(FONTS.micro), { color: belowMin ? COLORS.error : COLORS.inkMuted, marginTop: 4, fontSize: 10 }]}>
          {belowMin
            ? `Minimum amount is ${money(minAmount)}`
            : `Min. amount: ${money(minAmount)}`}
        </Text>
      )}

      {/* Quick-select presets */}
      {presets && presets.length > 0 && onPresetPress && (
        <View style={[s.presetRow, { marginTop: SIZES.margin.md }]}>
          {presets.map((p) => {
            const on = amountInput === String(p);
            return (
              <View
                key={p}
                style={[s.preset, { borderRadius: SIZES.radius.pill, borderColor: on ? COLORS.primary : COLORS.hairline, borderWidth: on ? 1.5 : 1, backgroundColor: COLORS.canvasElevated }]}
              >
                <Text
                  onPress={() => onPresetPress(p)}
                  style={[asText(FONTS.microBold), { color: on ? COLORS.primary : COLORS.inkSecondary, paddingVertical: SIZES.padding.sm, paddingHorizontal: 4 }]}
                >
                  {money(p)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Breakdown summary */}
      {breakdownRows && breakdownRows.length > 0 && (
        <View style={{ marginTop: SIZES.layout.section }}>
          <SectionHeading eyebrow="Order" title="Breakdown" />
          <SummaryCard rows={breakdownRows} style={{ marginTop: SIZES.margin.lg }} />
        </View>
      )}

      {/* Disclaimer */}
      <View style={[s.note, { marginTop: SIZES.layout.block }]}>
        <Ionicons name="information-circle-outline" size={SIZES.icon.sm} color={COLORS.inkMuted} />
        <Text style={[asText(FONTS.micro), { color: COLORS.inkMuted, flex: 1, fontSize: 10 }]}>
          Rates are indicative and refresh on load. The final price is confirmed at checkout.
        </Text>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  dualRow:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  arrowBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  equalBox:   { flex: 1, minHeight: 88, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 14, overflow: 'hidden' },
  equalValue: { marginTop: 6, padding: 0, includeFontPadding: false, textAlignVertical: 'center' },
  presetRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  preset:     { flexGrow: 1, flexBasis: '22%', alignItems: 'center' },
  note:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});
