// src/components/ui/premium/WaveAuthShell.tsx
//
// Auth scaffold matching the "wave header + white card" reference layout:
// a curved brand-colour band across the top with a Sign up / Sign in
// tab toggle in the corner, and a light card below holding the form.
//
// Presentation only — screens own their fields, validation and actions.
// Colours come entirely from theme tokens (COLORS.primary = brand red,
// COLORS.secondary / heroAccent = golden yellow), so this reflects
// whatever the active theme defines with no hardcoded hex.

import React, { memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

const { width: SCREEN_W } = Dimensions.get('window');

type Tab = 'signup' | 'signin';

type Props = {
  children: React.ReactNode;
  /** Which tab is active — drives the default headline text ('Create account' / 'Welcome back') */
  activeTab?: Tab;
  /** Fired when the user taps the inactive tab (only relevant if a tab toggle is rendered by the screen) */
  onTabChange?: (tab: Tab) => void;
  /** Brand mark / short title shown inside the wave */
  brandTitle?: string;
  /** Overrides the activeTab-derived headline — use for non-login/register auth flows */
  title?: string;
  /** Small line under the headline */
  subtitle?: string;
  /** Shows a translucent back button top-left in the wave */
  onBack?: () => void;
  /** Step indicator, e.g. { current: 1, total: 2 } — renders as dots under the headline */
  step?: { current: number; total: number };
  /** Pinned to the bottom, outside the scroll area */
  footer?: React.ReactNode;
  waveHeight?: number;
  style?: ViewStyle;
};

function WaveAuthShell({
  children,
  activeTab,
  onTabChange,
  brandTitle = 'Rangas DigiGold',
  title,
  subtitle,
  onBack,
  step,
  footer,
  waveHeight = 180,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale, isDark } = useTheme();

  const w = SCREEN_W;
  const h = waveHeight;

  // Smooth double-curve wave, bottom edge of the header band.
  const wavePath = `
    M0,0
    L${w},0
    L${w},${h * 0.62}
    C${w * 0.78},${h * 1.05} ${w * 0.42},${h * 0.62} 0,${h * 0.92}
    Z
  `;

  return (
    <View style={[s.root, { backgroundColor: COLORS.canvas }, style]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Wave header ───────────────────────────────────── */}
          <View style={{ height: h }}>
            <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient id="waveFill" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={COLORS.primaryLight} />
                  <Stop offset="1" stopColor={COLORS.primaryDark} />
                </SvgLinearGradient>
              </Defs>
              <Path d={wavePath} fill="url(#waveFill)" />
            </Svg>

            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
              <View style={s.waveTopRow}>
                {onBack ? (
                  <Pressable
                    onPress={onBack}
                    hitSlop={10}
                    style={({ pressed }) => [
                      s.backBtn,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={SIZES.icon.md}
                      color={COLORS.textOnPrimary}
                    />
                  </Pressable>
                ) : (
                  <Text
                    style={[
                      asText(FONTS.h5),
                      { color: COLORS.textOnPrimary, letterSpacing: 0.2 },
                    ]}
                    numberOfLines={1}
                  >
                    {brandTitle}
                  </Text>
                )}
              </View>

              <View style={s.waveHeadline}>
                <Text
                  style={[
                    asText(FONTS.displayMd),
                    { color: COLORS.textOnPrimary },
                  ]}
                >
                  {title ?? (activeTab === 'signup' ? 'Create account' : 'Welcome back')}
                </Text>
                {!!subtitle && (
                  <Text
                    style={[
                      asText(FONTS.micro),
                      { color: COLORS.textOnPrimaryMuted, marginTop: 6, lineHeight: 18 },
                    ]}
                  >
                    {subtitle}
                  </Text>
                )}

                {!!step && (
                  <View style={s.stepRow}>
                    {Array.from({ length: step.total }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          s.stepDot,
                          {
                            backgroundColor:
                              i < step.current ? COLORS.secondary : COLORS.heroHairlineBold,
                            width: i === step.current - 1 ? 20 : 8,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            </SafeAreaView>
          </View>

          {/* ── Card body ─────────────────────────────────────── */}
          <View
            style={[
              s.card,
              {
                backgroundColor: COLORS.card,
                marginTop: -moderateScale(28),
                borderTopLeftRadius: SIZES.radius.panel,
                borderTopRightRadius: SIZES.radius.panel,
                paddingHorizontal: SIZES.layout.gutter,
                paddingTop: SIZES.layout.section,
                paddingBottom: SIZES.layout.section,
              },
            ]}
          >
            {children}
          </View>
        </ScrollView>

        {!!footer && (
          <SafeAreaView edges={['bottom']} style={{ backgroundColor: COLORS.card }}>
            <View
              style={{
                paddingHorizontal: SIZES.layout.gutter,
                paddingBottom: SIZES.padding.md,
                backgroundColor: COLORS.card,
              }}
            >
              {footer}
            </View>
          </SafeAreaView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  waveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveHeadline: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  card: {
    flex: 1,
  },
});

export default memo(WaveAuthShell);
