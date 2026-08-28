// src/components/ui/premium/MpinSuccessState.tsx
//
// Premium completion screen shared by every MPIN flow that ends in
// success (create, reset via OTP, change from Settings). A gold
// checkmark disc with a soft glow, a short headline/description, and
// a primary CTA -- no confetti, no bounce, one quiet scale+fade in.

import React, { memo, useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme';
import { asText } from './tokens';
import PremiumButton from './PremiumButton';

type Props = {
  title?: string;
  description?: string;
  note?: string;
  ctaLabel?: string;
  onContinue: () => void;
  loading?: boolean;
};

function MpinSuccessState({
  title = 'MPIN Updated Successfully',
  description = 'Your MPIN has been updated securely.',
  note,
  ctaLabel = 'Continue',
  onContinue,
  loading = false,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const badge = moderateScale(96);

  return (
    <View style={[s.wrap, { backgroundColor: COLORS.canvas }]}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <View style={[s.glow, { width: badge * 1.9, height: badge * 1.9, borderRadius: (badge * 1.9) / 2, backgroundColor: COLORS.goldOpacity20 }]} />
        <LinearGradient
          colors={COLORS.gradient.goldFoil as [string, string, ...string[]]}
          start={{ x: 0.15, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={[
            s.badge,
            {
              width: badge,
              height: badge,
              borderRadius: badge / 2,
              marginBottom: SIZES.margin.xxl,
            },
          ]}
        >
          <Ionicons name="checkmark" size={moderateScale(48)} color={COLORS.textOnGold} />
        </LinearGradient>

        <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary, textAlign: 'center' }]}>
          {title}
        </Text>
        <Text
          style={[
            asText(FONTS.micro),
            { color: COLORS.inkSecondary, textAlign: 'center', marginTop: 10, lineHeight: 19, maxWidth: 280 },
          ]}
        >
          {description}
        </Text>
      </Animated.View>

      <View style={s.bottom}>
        <PremiumButton label={ctaLabel} size="lg" onPress={onContinue} loading={loading} />
        {!!note && (
          <Text
            style={[
              asText(FONTS.micro),
              { color: COLORS.inkTertiary, textAlign: 'center', marginTop: SIZES.margin.lg, lineHeight: 18 },
            ]}
          >
            {note}
          </Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  glow: { position: 'absolute', alignSelf: 'center' },
  badge: { alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', bottom: 48, left: 32, right: 32 },
});

export default memo(MpinSuccessState);
