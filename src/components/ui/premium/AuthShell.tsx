// src/components/ui/premium/AuthShell.tsx
//
// Normal-canvas scaffold for pre-authentication screens (login, register,
// OTP, MPIN). Uses the same body-zone surface as the rest of the app
// (ivory in light mode, espresso in dark mode) rather than a distinct
// dark hero band, so auth reads as part of the same product.
//
// Content is bottom-weighted so form fields sit within thumb reach and
// stay clear of the keyboard.

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
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  children: React.ReactNode;
  /** Micro-caps line above the title */
  eyebrow?: string;
  title: string;
  caption?: string;
  /** Shows a hairline back square top-left */
  onBack?: () => void;
  /** Pinned to the bottom, outside the scroll area */
  footer?: React.ReactNode;
  /** Step indicator, e.g. { current: 2, total: 3 } */
  step?: { current: number; total: number };
  scroll?: boolean;
  /** 'bottom' (default) keeps content thumb-reachable; 'top' for sparse screens like OTP */
  align?: 'top' | 'bottom';
  style?: ViewStyle;
};

function AuthShell({
  children,
  eyebrow,
  title,
  caption,
  onBack,
  footer,
  step,
  scroll = true,
  align = 'bottom',
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale, isDark } = useTheme();
  const G = SIZES.layout.gutter;

  const head = (
    <View style={{ paddingHorizontal: G, paddingTop: 4 }}>
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
          <Ionicons
            name="arrow-back"
            size={SIZES.icon.md}
            color={COLORS.inkPrimary}
          />
        </Pressable>
      )}

      {/* Step rule */}
      {!!step && (
        <View style={[s.stepRow, { marginTop: onBack ? SIZES.margin.xl : 0 }]}>
          {Array.from({ length: step.total }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 1.5,
                backgroundColor:
                  i < step.current ? COLORS.primary : COLORS.hairline,
              }}
            />
          ))}
        </View>
      )}

      <View
        style={{
          marginTop: step ? SIZES.margin.xl : onBack ? SIZES.margin.xxl : 0,
        }}
      >
        {!!eyebrow && (
          <Text style={[asText(FONTS.eyebrow), { color: COLORS.primaryInk }]}>
            {eyebrow}
          </Text>
        )}
        <Text
          style={[
            asText(FONTS.displayLg),
            { color: COLORS.inkPrimary, marginTop: eyebrow ? 4 : 0 },
          ]}
        >
          {title}
        </Text>
        {!!caption && (
          <Text
            style={[
              asText(FONTS.micro),
              { color: COLORS.inkSecondary, marginTop: 6, lineHeight: 19 },
            ]}
          >
            {caption}
          </Text>
        )}
      </View>
    </View>
  );

  const body = (
    <View
      style={{
        paddingHorizontal: G,
        paddingTop: SIZES.layout.section * 2,
        paddingBottom: SIZES.layout.section,
      }}
    >
      {children}
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: COLORS.canvas }, style]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.canvas}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 ,}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          {scroll ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, justifyContent: align === 'top' ? 'flex-start' : 'flex-end' }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {head}
              {body}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, justifyContent: align === 'top' ? 'flex-start' : 'flex-end' }}>
              {head}
              {body}
            </View>
          )}
        </SafeAreaView>

        {!!footer && (
          <SafeAreaView edges={['bottom']}>
            <View
              style={{
                paddingHorizontal: G,
                paddingBottom: SIZES.padding.md,
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
  back: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepRow: { flexDirection: 'row', gap: 5 },
});

export default memo(AuthShell);
