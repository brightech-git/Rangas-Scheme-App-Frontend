import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

export default function TransactionsScreen() {
  const { COLORS, FONTS, SIZES } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <Text style={{ fontFamily: FONTS.family.bold, fontSize: SIZES.font.xl, color: COLORS.textPrimary }}>
        Transactions
      </Text>
      <Text style={{ fontFamily: FONTS.family.regular, fontSize: SIZES.font.sm, color: COLORS.textSecondary, marginTop: 8 }}>
        Your transaction history will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
