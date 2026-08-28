// src/components/ui/premium/MpinSecurityHint.tsx
//
// The quiet "your MPIN is protected" reassurance line the brief calls
// for -- subtle, small, never shouty. Used at the bottom of Create/
// Verify screens.

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  text?: string;
};

function MpinSecurityHint({ text = 'Your MPIN is protected and never displayed while you enter it.' }: Props) {
  const { COLORS, FONTS } = useTheme();
  return (
    <View style={s.row}>
      <Ionicons name="lock-closed" size={11} color={COLORS.inkTertiary} />
      <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, textAlign: 'center', flexShrink: 1 }]}>
        {text}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 32 },
});

export default memo(MpinSecurityHint);
