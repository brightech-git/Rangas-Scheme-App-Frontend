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

export default function MainHeader({ onMenuPress, onProfilePress }: Props) {
  const { COLORS, FONTS, SIZES, moderateScale, verticalScale } = useTheme();
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.username ?? 'User';
  const profilePic = (user as any)?.profilePic ?? (user as any)?.picture ?? null;

  const slideY     = useRef(new Animated.Value(-50)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const greetSlide = useRef(new Animated.Value(20)).current;
  const greetFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY,   { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 140 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      Animated.parallel([
        Animated.spring(greetSlide, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 120 }),
        Animated.timing(greetFade,  { toValue: 1, duration: 300, useNativeDriver: true }),
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

      {/* Deep red → rich red gradient */}
      <LinearGradient
        colors={['#7a0303', '#aa0404', '#cc0505']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']}>
          {/* ── Gold accent bar at very top ── */}
          <View style={styles.goldBar} />

          {/* ── Diagonal stripe decorations ── */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.stripe,
                  {
                    right: 8 + i * 20,
                    backgroundColor:
                      i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,204,0,0.07)',
                  },
                ]}
              />
            ))}
          </View>

          {/* ── Main header row ── */}
          <Animated.View
            style={[
              styles.container,
              {
                paddingHorizontal: SIZES.padding.lg,
                paddingTop: SIZES.padding.sm,
                paddingBottom: SIZES.padding.xs,
                transform: [{ translateY: slideY }],
                opacity: fadeAnim,
              },
            ]}
          >
            {/* LEFT: logo + brand */}
            <View style={styles.leftSide}>
              <View style={styles.logoRing}>
                <Image source={LOGO} resizeMode="cover" style={styles.logo} />
              </View>
              <View>
                <Text style={[styles.brandName, { fontFamily: FONTS.family.trajanBold }]}>
                  Rangas
                </Text>
                <View style={styles.tagRow}>
                  <View style={styles.goldDot} />
                  <Text style={[styles.tagline, { fontFamily: FONTS.family.regular }]}>
                    DIGIGOLD
                  </Text>
                  <View style={styles.goldDot} />
                </View>
              </View>
            </View>

            {/* RIGHT: notification + avatar */}
            <View style={styles.rightSide}>
              <AnimatedIconButton
                onPress={onMenuPress}
                bg="rgba(255,255,255,0.15)"
                size={moderateScale(40)}
              >
                <Ionicons name="notifications-outline" size={moderateScale(20)} color="#ffcc00" />
              </AnimatedIconButton>

              <AnimatedIconButton
                onPress={onProfilePress}
                bg="rgba(255,204,0,0.25)"
                size={moderateScale(40)}
              >
                {profilePic ? (
                  <Image
                    source={{ uri: profilePic }}
                    style={{
                      width: moderateScale(30),
                      height: moderateScale(30),
                      borderRadius: moderateScale(15),
                    }}
                  />
                ) : (
                  <Text style={{ fontFamily: FONTS.family.bold, fontSize: moderateScale(17), color: '#ffcc00' }}>
                    {(firstName?.[0] ?? 'U').toUpperCase()}
                  </Text>
                )}
              </AnimatedIconButton>
            </View>
          </Animated.View>

          {/* ── Greeting strip ── */}
          <Animated.View
            style={[
              styles.greetStrip,
              {
                paddingHorizontal: SIZES.padding.lg,
                paddingBottom: verticalScale(14),
                transform: [{ translateY: greetSlide }],
                opacity: greetFade,
              },
            ]}
          >
            <Text style={[styles.greetText, { fontFamily: FONTS.family.semiBold }]}>
              {getGreeting()},{' '}
              <Text style={{ fontFamily: FONTS.family.bold, color: '#ffcc00' }}>
                {firstName}
              </Text>{' '}
              👋
            </Text>
            <Text style={[styles.greetSub, { fontFamily: FONTS.family.regular }]}>
              Your gold journey continues
            </Text>
          </Animated.View>

          {/* ── Two-tone bottom accent ── */}
          <View style={styles.bottomAccent}>
            <View style={[styles.accentLeft,  { backgroundColor: '#ffcc00' }]} />
            <View style={[styles.accentRight, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

// ─── Animated icon button ─────────────────────────────────────────
function AnimatedIconButton({
  children, onPress, bg, size,
}: { children: React.ReactNode; onPress?: () => void; bg: string; size: number }) {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={() => Animated.spring(sc, { toValue: 0.85, useNativeDriver: true, speed: 40 }).start()}
      onPressOut={() => Animated.spring(sc, { toValue: 1,    useNativeDriver: true, speed: 30 }).start()}
    >
      <Animated.View
        style={[
          styles.iconBtn,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, transform: [{ scale: sc }] },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  goldBar: {
    height: 3,
    backgroundColor: '#ffcc00',
    opacity: 0.9,
  },
  stripe: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 14,
    transform: [{ rotate: '18deg' }],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 58,
  },
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,204,0,0.65)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  brandName: {
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  goldDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffcc00',
  },
  tagline: {
    fontSize: 9,
    color: '#ffcc00',
    letterSpacing: 2.5,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetStrip: {
    gap: 2,
  },
  greetText: {
    fontSize: 15,
    color: '#fff',
  },
  greetSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  bottomAccent: {
    flexDirection: 'row',
    height: 4,
  },
  accentLeft: {
    width: 60,
    borderTopRightRadius: 4,
  },
  accentRight: {
    flex: 1,
  },
});
