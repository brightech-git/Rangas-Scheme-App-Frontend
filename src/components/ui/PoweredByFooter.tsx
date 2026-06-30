// src/components/ui/PoweredByFooter.tsx

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface Props {
  style?: ViewStyle;
}

export default function PoweredByFooter({ style }: Props) {
  const { COLORS, FONTS } = useTheme();
  return (
    <View style={[s.wrap, style]}>
      <View style={[s.line, { backgroundColor: COLORS.borderLight }]} />
      <Text style={[s.txt, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
        Powered by{' '}
        <Text style={[s.brand, { color: COLORS.primary, fontFamily: FONTS.family.semiBold }]}>
          Brightech Software
        </Text>
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { alignItems: 'center', paddingVertical: 8, gap: 6 },
  line:  { width: 60, height: 1 },
  txt:   { fontSize: 11, letterSpacing: 0.3 },
  brand: { fontSize: 11, letterSpacing: 0.3 },
});
