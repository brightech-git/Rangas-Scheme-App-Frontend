// src/screens/splash/SplashScreen.tsx
//
// ─────────────────────────────────────────────────────────────────
// NEW SCREEN
//
// LAYOUT
//   Full noir. A gold hairline ring draws itself around the brand
//   monogram while the app resolves its initial route, with the
//   wordmark and a thin indeterminate rule beneath. No spinner.
//
// WHY THIS IS BETTER UX
//   RootNavigator previously showed a bare ActivityIndicator on a
//   plain background while it read AsyncStorage and decided where to
//   send the user. That reads as a stall. This gives the same wait a
//   branded, intentional feel and matches the noir auth screens the
//   user is usually about to land on.
//
// NOTE
//   Purely presentational — it renders while RootNavigator's own
//   bootstrap effect runs and unmounts when `initialRoute` resolves.
//   No navigation, storage or API access of its own.
// ─────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  StatusBar,
  Easing,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { asText } from '../../components/ui/premium';

type Props = {
  logo?: ImageSourcePropType;
  brand?: string;
  tagline?: string;
};

export default function SplashScreen({
  logo,
  brand = 'RANGAS',
  tagline = 'DIGIGOLD',
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1300,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [fade, rise, sweep]);

  const ring = moderateScale(96);

  const spin = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const barShift = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-moderateScale(90), moderateScale(90)],
  });

  return (
    <View style={[s.root, { backgroundColor: COLORS.heroCanvas }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.heroCanvas} />

      <LinearGradient
        colors={COLORS.gradient.heroNoir as [string, string, ...string[]]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[s.bloom, { backgroundColor: COLORS.heroGoldVeil }]} />
      </View>

      <Animated.View
        style={[
          s.center,
          { opacity: fade, transform: [{ translateY: rise }] },
        ]}
      >
        {/* Rotating gold arc around a static monogram */}
        <View
          style={{
            width: ring,
            height: ring,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View
            style={[
              s.arc,
              {
                width: ring,
                height: ring,
                borderRadius: ring / 2,
                borderColor: COLORS.heroHairline,
                borderTopColor: COLORS.heroAccent,
                transform: [{ rotate: spin }],
              },
            ]}
          />

          {logo ? (
            <Image
              source={logo}
              resizeMode="cover"
              style={{
                width: ring * 0.56,
                height: ring * 0.56,
                borderRadius: ring * 0.28,
              }}
            />
          ) : (
            <Text
              style={{
                fontFamily: FONTS.family.trajanBold,
                fontSize: moderateScale(30),
                color: COLORS.heroAccent,
                letterSpacing: 1,
              }}
            >
              R
            </Text>
          )}
        </View>

        <Text
          style={[
            asText(FONTS.displayMd),
            {
              color: COLORS.heroTextPrimary,
              marginTop: SIZES.margin.xxl,
              letterSpacing: 4,
            },
          ]}
        >
          {brand}
        </Text>

        <Text
          style={[
            asText(FONTS.eyebrow),
            { color: COLORS.heroAccent, marginTop: 4, letterSpacing: 5 },
          ]}
        >
          {tagline}
        </Text>

        {/* Indeterminate hairline */}
        <View
          style={[
            s.track,
            {
              width: moderateScale(120),
              marginTop: SIZES.layout.section,
              backgroundColor: COLORS.heroHairline,
            },
          ]}
        >
          <Animated.View
            style={[
              s.trackFill,
              {
                width: moderateScale(46),
                backgroundColor: COLORS.heroAccent,
                transform: [{ translateX: barShift }],
              },
            ]}
          />
        </View>
      </Animated.View>

      <Animated.Text
        style={[
          asText(FONTS.micro),
          {
            opacity: fade,
            color: COLORS.heroTextMuted,
            textAlign: 'center',
            fontSize: 10,
            paddingBottom: moderateScale(28),
          },
        ]}
      >
        Secured savings · Hallmarked metal
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  bloom: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  arc: { position: 'absolute', borderWidth: 2 },
  track: { height: 2, borderRadius: 1, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 1 },
});
