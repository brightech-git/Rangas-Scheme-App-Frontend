// src/components/ui/premium/FloatingWidget.tsx
//
// Small dark pill that floats above scrolling content — used for a live
// rate ticker on Home and a "next due" nudge on scheme screens. Slides
// in on mount and can be dismissed.

import React, { memo, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  /** Leading icon */
  icon?: string;
  /** Micro-caps lead text */
  label: string;
  /** Bold trailing value */
  value?: string;
  /** Tint for the icon and value */
  accent?: string;
  /** Tappable action */
  onPress?: () => void;
  /** Shows an X on the right */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** 'top' slides down, 'bottom' slides up */
  from?: 'top' | 'bottom';
  /** Live pulse dot next to the icon */
  live?: boolean;
  style?: ViewStyle;
};

function FloatingWidget({
  icon = 'trending-up',
  label,
  value,
  accent,
  onPress,
  dismissible = false,
  onDismiss,
  from = 'bottom',
  live = false,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, SHADOWS } = useTheme();
  const [visible, setVisible] = useState(true);

  const slide = useRef(new Animated.Value(from === 'bottom' ? 40 : -40)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const tint = accent ?? COLORS.heroAccent;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        damping: 16,
        stiffness: 140,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slide, fade]);

  useEffect(() => {
    if (!live) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live, pulse]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slide, {
        toValue: from === 'bottom' ? 40 : -40,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  if (!visible) return null;

  const Wrapper: React.ElementType = onPress ? Pressable : View;

  return (
    <Animated.View
      style={[
        s.wrap,
        {
          opacity: fade,
          transform: [{ translateY: slide }],
        },
        style,
      ]}
    >
      <Wrapper
        onPress={onPress}
        style={[
          s.pill,
          {
            borderRadius: SIZES.radius.pill,
            backgroundColor: COLORS.heroElevated,
            borderColor: COLORS.heroHairlineBold,
            paddingHorizontal: SIZES.padding.xl,
            paddingVertical: SIZES.padding.md,
          },
          SHADOWS.float as ViewStyle,
        ]}
      >
        <View style={s.iconWrap}>
          <Ionicons name={icon as any} size={SIZES.icon.sm} color={tint} />
          {live && (
            <Animated.View
              style={[
                s.pulseDot,
                {
                  backgroundColor: tint,
                  opacity: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.25, 1],
                  }),
                },
              ]}
            />
          )}
        </View>

        <Text
          numberOfLines={1}
          style={[asText(FONTS.micro), { color: COLORS.heroTextTertiary }]}
        >
          {label}
        </Text>

        {!!value && (
          <Text
            numberOfLines={1}
            style={[asText(FONTS.microBold), { color: tint }]}
          >
            {value}
          </Text>
        )}

        {dismissible && (
          <Pressable onPress={handleDismiss} hitSlop={10}>
            <Ionicons
              name="close"
              size={SIZES.icon.sm}
              color={COLORS.heroTextMuted}
            />
          </Pressable>
        )}
      </Wrapper>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  iconWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
});

export default memo(FloatingWidget);
