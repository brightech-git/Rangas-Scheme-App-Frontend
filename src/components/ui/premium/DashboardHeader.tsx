// src/components/ui/premium/DashboardHeader.tsx
//
// The dark hero header. Bleeds under the status bar and is designed to
// have body content overlap it via a negative top margin.
//
// Layout is deliberately inverted vs. the old MainHeader: identity is
// SMALL and top-left as a single line of micro-caps, the greeting is
// the LARGE element, and the avatar sits alone on the right with the
// bell tucked beside it as a hairline circle — no gradient stripes,
// no decorative diagonals, no gold bar.

import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  StatusBar,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme';
import { asText, greeting, initial } from './tokens';

type Props = {
  /** Display name — drives the greeting line and the avatar initial */
  name?: string | null;
  /** Remote avatar URL, if the user has one */
  avatarUri?: string | null;
  /** Local brand mark shown as a small hairline chip */
  logo?: ImageSourcePropType;
  brand?: string;
  /** Line under the greeting */
  caption?: string;
  unreadCount?: number;
  onAvatarPress?: () => void;
  onBellPress?: () => void;
  /** Extra bottom padding so overlapping content has room */
  bleedBottom?: number;
  /** Optional slot rendered at the bottom of the hero, full width */
  children?: React.ReactNode;
};

function DashboardHeader({
  name,
  avatarUri,
  logo,
  brand = 'RANGAS',
  caption,
  unreadCount = 0,
  onAvatarPress,
  onBellPress,
  bleedBottom = 0,
  children,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const G = SIZES.layout.gutter;
  const avatarSize = moderateScale(44);
  const bellSize = moderateScale(38);

  return (
    <View style={{ backgroundColor: COLORS.heroCanvas }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.heroCanvas} />

      <LinearGradient
        colors={COLORS.gradient.heroNoir as [string, string, ...string[]]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      >
        {/* A single soft gold bloom in the top-right — the only
            decoration in the whole header. */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View
            style={[
              s.bloom,
              { backgroundColor: COLORS.heroGoldVeil, top: -moderateScale(90) },
            ]}
          />
        </View>

        <SafeAreaView edges={['top']}>
          <View
            style={{
              paddingHorizontal: G,
              paddingTop: SIZES.padding.md,
              paddingBottom: SIZES.padding.xxl + bleedBottom,
            }}
          >
            {/* ── Row 1: brand chip (small) + actions ── */}
            <View style={s.topRow}>
              <View style={s.brandChip}>
                {!!logo && (
                  <Image source={logo} style={s.brandMark} resizeMode="cover" />
                )}
                <Text
                  style={[
                    asText(FONTS.microBold),
                    { color: COLORS.white, letterSpacing: 2.5 ,fontSize: moderateScale(14),},
                  ]}
                >
                  {brand}
                </Text>
              </View>

              <View style={s.actions}>
                {/* <Pressable
                  onPress={onBellPress}
                  hitSlop={8}
                  style={({ pressed }) => [
                    s.bell,
                    {
                      width: bellSize,
                      height: bellSize,
                      borderRadius: bellSize / 2,
                      borderColor: COLORS.heroHairlineBold,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={SIZES.icon.md}
                    color={COLORS.heroTextSecondary}
                  />
                  {unreadCount > 0 && (
                    <View
                      style={[
                        s.badge,
                        {
                          backgroundColor: COLORS.heroAccent,
                          borderColor: COLORS.heroCanvas,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.badgeTxt,
                          {
                            color: COLORS.heroCanvas,
                            fontFamily: FONTS.family.bold,
                          },
                        ]}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </Pressable> */}

                <Pressable
                  onPress={onAvatarPress}
                  hitSlop={8}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={{
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: avatarSize / 2,
                        borderWidth: 1,
                        borderColor: COLORS.heroHairlineBold,
                      }}
                    />
                  ) : (
                    <View
                      style={[
                        s.avatar,
                        {
                          width: avatarSize,
                          height: avatarSize,
                          borderRadius: avatarSize / 2,
                          backgroundColor: COLORS.heroAccentSoft,
                          borderColor: COLORS.heroAccent,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: COLORS.heroAccent,
                          fontFamily: FONTS.family.semiBold,
                          fontSize: SIZES.font.lg,
                        }}
                      >
                        {initial(name)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>

            {/* ── Row 2: the greeting IS the headline ── */}
            <View style={{ marginTop: SIZES.margin.xl }}>
              <Text
                style={[
                  asText(FONTS.microBold),
                  { color: COLORS.whiteOpacity50 },
                ]}
              >
                {greeting()}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  asText(FONTS.displaySm),
                  { color: COLORS.heroTextPrimary, marginTop: 2 },
                ]}
              >
                {name?.trim() || 'Welcome'}
              </Text>
              {!!caption && (
                <Text
                  style={[
                    asText(FONTS.micro),
                    { color: COLORS.heroTextTertiary, marginTop: 4 },
                  ]}
                >
                  {caption}
                </Text>
              )}
            </View>

            {children}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  bloom: {
    position: 'absolute',
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandChip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 62, height: 62, borderRadius: 31 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: { fontSize: 9 },
});

export default memo(DashboardHeader);
