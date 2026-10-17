// src/components/ui/PoweredByFooter.tsx

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Linking, Pressable } from 'react-native';
import { useTheme } from '../../theme';

interface Props {
  style?: ViewStyle & Pick<TextStyle, 'fontSize'>;
}

export default function PoweredByFooter({ style }: Props) {
  const { COLORS, FONTS } = useTheme();
  const { fontSize, ...wrapStyle } = style ?? {};
  return (
    <View style={[s.wrap, wrapStyle]}>
      <View style={[s.line, { backgroundColor: COLORS.borderLight }]} />
      <Text style={[s.txt, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular, ...(fontSize ? { fontSize } : {}) }]}>
        Powered by{' '}
        <Text
          onPress={() => Linking.openURL('https://brightechsoftware.com/')}
          style={[s.brand, { color: COLORS.primary, fontFamily: FONTS.family.semiBold, ...(fontSize ? { fontSize } : {}) }]}
        >
          Brightech Software
        </Text>
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { alignItems: 'center', paddingVertical: 8, gap: 6 },
  row:   { flexDirection: 'row', alignItems: 'center' },
  line:  { width: 60, height: 1 },
  txt:   { fontSize: 11, letterSpacing: 0.3 },
  brand: { fontSize: 11, letterSpacing: 0.3 },
});
