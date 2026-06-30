// src/components/ui/MainHeader.tsx

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { useAppSelector } from '../../store/hooks';
import LOGO from '../../assets/company/logo.png';

type Props = {
  onMenuPress?: () => void;
  onProfilePress?: () => void;
  location?: string;
};

export default function MainHeader({ onMenuPress, onProfilePress}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale, verticalScale } = useTheme();
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.username ?? 'User';
  const profilePic = (user as any)?.profilePic ?? (user as any)?.picture ?? null;

  const slideY = useRef(new Animated.Value(-40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stripSlide = useRef(new Animated.Value(-20)).current;
  const stripFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 150 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      // Greeting strip animates in after header settles
      Animated.parallel([
        Animated.spring(stripSlide, { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 120 }),
        Animated.timing(stripFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient
        colors={COLORS.gradient.orangeDeep as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']}>
          {/* Decorative circles */}
          <View pointerEvents="none" style={[styles.circle1, { backgroundColor: COLORS.whiteOpacity10 }]} />
          <View pointerEvents="none" style={[styles.circle2, { backgroundColor: COLORS.goldOpacity20 }]} />

          {/* ── Main header row ── */}
          <Animated.View
            style={[
              styles.container,
              {
                paddingHorizontal: SIZES.padding.container,
                paddingVertical: SIZES.padding.xs,
                minHeight: verticalScale(70),
                transform: [{ translateY: slideY }],
                opacity: fadeAnim,
              },
            ]}
          >
            {/* LEFT: logo + brand */}
            <View style={styles.leftContainer}>
              <View style={styles.brandContainer}>
                <View style={styles.logoWrapper}>
                  <Image source={LOGO} resizeMode="cover" style={styles.logo} />
                </View>
                <View>
                  <Text style={{
                    fontFamily: FONTS.family.trajanBold,
                    fontSize: SIZES.font.xl,
                    color: COLORS.white,
                    lineHeight: moderateScale(24),
                  }}>
                    Rangas
                  </Text>
                  <Text style={{
                    fontFamily: FONTS.family.trajanBold,
                    fontSize: SIZES.font.xs,
                    color: COLORS.primaryPale,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                  }}>
                    DigiGold
                  </Text>
                </View>
              </View>
            </View>

            {/* RIGHT: profile avatar → Profile tab (Google picture, else name initial) */}
            <AnimatedIconButton onPress={onProfilePress} bg={COLORS.whiteOpacity20} size={moderateScale(42)}>
              {profilePic ? (
                <Image
                  source={{ uri: profilePic }}
                  style={{ width: moderateScale(32), height: moderateScale(32), borderRadius: moderateScale(16) }}
                />
              ) : (
                <Text style={{
                  fontFamily: FONTS.family.bold,
                  fontSize: moderateScale(18),
                  color: COLORS.white,
                }}>
                  {(firstName?.[0] ?? 'U').toUpperCase()}
                </Text>
              )}
            </AnimatedIconButton>
          </Animated.View>

          {/* ── Greeting strip (inside gradient, below header row) ── */}
          <Animated.View
            style={[
              styles.greetingStrip,
              {
                paddingHorizontal: SIZES.padding.container,
                paddingBottom: verticalScale(12),
                transform: [{ translateY: stripSlide }],
                opacity: stripFade,
              },
            ]}
          >
            {/* Locatiing row */}
            <View style={styles.greetingRow}>
              <Text style={{
                fontFamily: FONTS.family.semiBold ?? FONTS.family.bold,
                fontSize: SIZES.font.lg,
                color: COLORS.white,
              }}>
                {getGreeting()}, {firstName} 👋
              </Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

// ─── Reusable animated icon button ───────────────────────────────────────────

function AnimatedIconButton({ children, onPress, bg, size }: {
  children: React.ReactNode;
  onPress?: () => void;
  bg: string;
  size: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 40 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()}
    >
      <Animated.View style={[
        styles.iconBtn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, transform: [{ scale }] },
      ]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 100,
    top: -50,
    right: -30,
  },
  circle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: 20,
    right: 80,
  },
  greetingStrip: {
    gap: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    opacity: 0.85,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});