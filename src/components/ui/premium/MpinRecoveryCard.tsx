// src/components/ui/premium/MpinRecoveryCard.tsx
//
// A single recovery-method option on the Forgot MPIN screen: icon,
// title, description, trailing arrow. Only methods the backend
// actually exposes should ever be passed to this -- it renders
// whatever it's given, it doesn't invent options.

import React, { memo } from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

function MpinRecoveryCard({ icon, title, description, onPress, disabled, style }: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const iconBox = moderateScale(46);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: COLORS.canvasElevated,
          borderColor: COLORS.hairline,
          borderRadius: SIZES.radius.panel,
          padding: SIZES.padding.lg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View
        style={[
          s.iconBox,
          {
            width: iconBox,
            height: iconBox,
            borderRadius: SIZES.radius.md,
            backgroundColor: COLORS.primaryPale,
          },
        ]}
      >
        <Ionicons name={icon as any} size={SIZES.icon.lg} color={COLORS.primary} />
      </View>

      <View style={s.textCol}>
        <Text style={[asText(FONTS.bodyMedium), { color: COLORS.inkPrimary, fontFamily: FONTS.family.semiBold }]}>
          {title}
        </Text>
        <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, marginTop: 3, lineHeight: 17 }]}>
          {description}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={SIZES.icon.sm} color={COLORS.inkMuted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1 },
  iconBox: { alignItems: 'center', justifyContent: 'center' },
  textCol: { flex: 1 },
});

export default memo(MpinRecoveryCard);
