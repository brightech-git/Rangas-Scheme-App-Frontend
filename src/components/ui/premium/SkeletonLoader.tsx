// src/components/ui/premium/SkeletonLoader.tsx
//
// Shimmer placeholders. Exposes a low-level <Skeleton /> block plus
// ready-made shapes that mirror the real V2 components, so loading
// states have the same silhouette as the loaded screen.

import React, { memo, useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, Easing } from 'react-native';
import { useTheme } from '../../../theme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  surface?: 'light' | 'hero';
  style?: ViewStyle;
};

/** A single shimmering block. */
export const Skeleton = memo(function Skeleton({
  width = '100%',
  height = 14,
  radius,
  surface = 'light',
  style,
}: SkeletonProps) {
  const { COLORS, SIZES } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? SIZES.radius.sm,
          backgroundColor:
            surface === 'hero' ? COLORS.heroGlass : COLORS.canvasSunken,
          opacity,
        },
        style,
      ]}
    />
  );
});

// ── Ready-made silhouettes ─────────────────────────────────────

/** Mirrors <MetricCard /> */
export const SkeletonMetric = memo(function SkeletonMetric({
  flex,
  surface = 'light',
}: {
  flex?: number;
  surface?: 'light' | 'hero';
}) {
  const { COLORS, SIZES, moderateScale } = useTheme();
  return (
    <View
      style={{
        flex,
        borderWidth: 1,
        borderColor: surface === 'hero' ? COLORS.heroHairline : COLORS.hairline,
        borderRadius: SIZES.radius.tile,
        backgroundColor:
          surface === 'hero' ? COLORS.heroElevated : COLORS.canvasElevated,
        padding: SIZES.padding.lg,
        minHeight: moderateScale(96),
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Skeleton width="55%" height={9} surface={surface} />
      <Skeleton width="80%" height={22} surface={surface} />
    </View>
  );
});

/** Mirrors <SchemeCardV2 /> */
export const SkeletonSchemeCard = memo(function SkeletonSchemeCard({
  width,
  surface = 'light',
}: {
  width?: number;
  surface?: 'light' | 'hero';
}) {
  const { COLORS, SIZES } = useTheme();
  return (
    <View
      style={{
        width,
        borderWidth: 1,
        borderColor: surface === 'hero' ? COLORS.heroHairline : COLORS.hairline,
        borderRadius: SIZES.radius.panel,
        backgroundColor:
          surface === 'hero' ? COLORS.heroElevated : COLORS.canvasElevated,
        padding: SIZES.padding.xl,
        gap: 12,
      }}
    >
      <Skeleton width="35%" height={9} surface={surface} />
      <Skeleton width="70%" height={22} surface={surface} />
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        <Skeleton width="28%" height={30} surface={surface} />
        <Skeleton width="28%" height={30} surface={surface} />
        <Skeleton width="28%" height={30} surface={surface} />
      </View>
      <Skeleton width="100%" height={6} radius={3} surface={surface} />
    </View>
  );
});

/** Mirrors a <TimelineCard /> run of entries */
export const SkeletonTimeline = memo(function SkeletonTimeline({
  rows = 4,
  surface = 'light',
}: {
  rows?: number;
  surface?: 'light' | 'hero';
}) {
  const { moderateScale } = useTheme();
  const node = moderateScale(28);
  return (
    <View style={{ gap: 20 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 14 }}>
          <Skeleton
            width={node}
            height={node}
            radius={node / 2}
            surface={surface}
          />
          <View style={{ flex: 1, gap: 6, paddingTop: 3 }}>
            <Skeleton width="60%" height={11} surface={surface} />
            <Skeleton width="38%" height={9} surface={surface} />
          </View>
          <View style={{ gap: 6, alignItems: 'flex-end', paddingTop: 3 }}>
            <Skeleton width={54} height={13} surface={surface} />
            <Skeleton width={34} height={9} surface={surface} />
          </View>
        </View>
      ))}
    </View>
  );
});

/** Mirrors <HeroCard /> */
export const SkeletonHero = memo(function SkeletonHero() {
  const { COLORS, SIZES } = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: COLORS.heroHairline,
        borderRadius: SIZES.radius.hero,
        backgroundColor: COLORS.heroElevated,
        padding: SIZES.padding.xxl,
        gap: 12,
      }}
    >
      <Skeleton width="30%" height={9} surface="hero" />
      <Skeleton width="65%" height={38} surface="hero" />
      <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
        <Skeleton width="26%" height={28} surface="hero" />
        <Skeleton width="26%" height={28} surface="hero" />
        <Skeleton width="26%" height={28} surface="hero" />
      </View>
    </View>
  );
});

export default Skeleton;
