// src/components/ui/premium/MpinHeader.tsx
//
// Shared top zone for every MPIN screen: an optional back button, a
// centred heading + supporting copy, and an optional identity block
// (avatar + name) for the "Welcome back" verify screen. Kept separate
// from AuthShell's own header because MPIN screens are single-purpose
// full-bleed canvases, not card-over-wave auth screens.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText, initial } from './tokens';

type Props = {
  onBack?: () => void;
  /** Shows an avatar-monogram + name above the heading (the "Welcome back" verify screen). */
  identityName?: string;
  eyebrow?: string;
  title: string;
  caption?: string;
  style?: ViewStyle;
};

function MpinHeader({ onBack, identityName, eyebrow, title, caption, style }: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const avatarSize = moderateScale(64);

  return (
    <View style={[s.wrap, style]}>
      {!!onBack && (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={({ pressed }) => [
            s.back,
            {
              width: moderateScale(38),
              height: moderateScale(38),
              borderRadius: SIZES.radius.md,
              borderColor: COLORS.hairlineBold,
              opacity: pressed ? 0.55 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={SIZES.icon.md} color={COLORS.inkPrimary} />
        </Pressable>
      )}

      <View style={s.center}>
        {!!identityName && (
          <View
            style={[
              s.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                backgroundColor: COLORS.primaryPale,
                borderColor: COLORS.primary,
                marginBottom: SIZES.margin.lg,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: FONTS.family.semiBold,
                fontSize: moderateScale(24),
                color: COLORS.primary,
              }}
            >
              {initial(identityName)}
            </Text>
          </View>
        )}

        {!!eyebrow && (
          <Text style={[asText(FONTS.eyebrow), { color: COLORS.primaryInk, marginBottom: 6, textAlign: 'center' }]}>
            {eyebrow}
          </Text>
        )}

        <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary, textAlign: 'center' }]}>
          {title}
        </Text>

        {!!caption && (
          <Text
            style={[
              asText(FONTS.micro),
              { color: COLORS.inkSecondary, marginTop: 8, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
            ]}
          >
            {caption}
          </Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center' },
  back: { alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  center: { alignItems: 'center', marginTop: 4 },
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});

export default memo(MpinHeader);
