// src/components/ui/premium/MpinStatusLine.tsx
//
// Fixed-height status row under the PIN dots -- loading spinner, error
// message, or a quiet hint -- so the layout never jumps as a screen
// moves between these states.

import React, { memo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  loading?: boolean;
  error?: string;
  hint?: string;
};

function MpinStatusLine({ loading, error, hint }: Props) {
  const { COLORS, FONTS } = useTheme();

  return (
    <View style={s.row}>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : error ? (
        <View style={s.errorRow}>
          <Ionicons name="alert-circle" size={13} color={COLORS.error} />
          <Text numberOfLines={2} style={[asText(FONTS.microBold), { color: COLORS.error, textAlign: 'center' }]}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text numberOfLines={1} style={[asText(FONTS.micro), { color: COLORS.inkTertiary }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { minHeight: 34, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});

export default memo(MpinStatusLine);
