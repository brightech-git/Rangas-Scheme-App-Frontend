// src/components/ui/premium/PageHeader.tsx
//
// Sub-page header in the hero idiom. The back control is a hairline
// square in the top-left ALONE on its row; the title lives below it at
// display size and is left-aligned — never centred between two icons,
// which is what every stock mobile header does.
//
// Set `collapsed` for dense screens that need a conventional compact bar.

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

export type PageHeaderAction = {
  icon: string;
  onPress: () => void;
  badge?: number;
  /** Tints the icon gold */
  featured?: boolean;
};

type Props = {
  title: string;
  eyebrow?: string;
  caption?: string;
  onBack?: () => void;
  hideBack?: boolean;
  actions?: PageHeaderAction[];
  /** Compact single-row bar instead of the stacked display title */
  collapsed?: boolean;
  /** Extra bottom padding so content can overlap upward */
  bleedBottom?: number;
  /** Slot rendered under the title, inside the dark zone */
  children?: React.ReactNode;
  style?: ViewStyle;
};

function PageHeader({
  title,
  eyebrow,
  caption,
  onBack,
  hideBack = false,
  actions = [],
  collapsed = false,
  bleedBottom = 0,
  children,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation.canGoBack()) navigation.goBack();
  };

  const btn = moderateScale(38);
  const G = SIZES.layout.gutter;

  const IconBtn = ({ a }: { a: PageHeaderAction }) => (
    <Pressable
      onPress={a.onPress}
      hitSlop={8}
      style={({ pressed }) => [
        s.btn,
        {
          width: btn,
          height: btn,
          borderRadius: SIZES.radius.md,
          borderColor: COLORS.heroHairlineBold,
          opacity: pressed ? 0.55 : 1,
        },
      ]}
    >
      <Ionicons
        name={a.icon as any}
        size={SIZES.icon.md}
        color={a.featured ? COLORS.heroAccent : COLORS.heroTextSecondary}
      />
      {!!a.badge && a.badge > 0 && (
        <View
          style={[
            s.badge,
            { backgroundColor: COLORS.heroAccent, borderColor: COLORS.heroCanvas },
          ]}
        >
          <Text
            style={{
              fontSize: 9,
              color: COLORS.heroCanvas,
              fontFamily: FONTS.family.bold,
            }}
          >
            {a.badge > 9 ? '9+' : a.badge}
          </Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={[{ backgroundColor: COLORS.heroCanvas }, style]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.heroCanvas} />

      <LinearGradient
        colors={COLORS.gradient.heroNoir as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']}>
          <View
            style={{
              paddingHorizontal: G,
              paddingTop: SIZES.padding.md,
              paddingBottom:
                (collapsed ? SIZES.padding.lg : SIZES.padding.xxl) + bleedBottom,
            }}
          >
            {/* Control row */}
            <View style={s.controlRow}>
              {!hideBack ? (
                <Pressable
                  onPress={handleBack}
                  hitSlop={8}
                  style={({ pressed }) => [
                    s.btn,
                    {
                      width: btn,
                      height: btn,
                      borderRadius: SIZES.radius.md,
                      borderColor: COLORS.heroHairlineBold,
                      opacity: pressed ? 0.55 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="arrow-back"
                    size={SIZES.icon.md}
                    color={COLORS.heroTextPrimary}
                  />
                </Pressable>
              ) : (
                <View />
              )}

              {/* Collapsed mode puts the title inline */}
              {collapsed && (
                <Text
                  numberOfLines={1}
                  style={[
                    asText(FONTS.microBold),
                    {
                      color: COLORS.heroTextPrimary,
                      fontSize: SIZES.font.lg,
                      flex: 1,
                      marginLeft: 14,
                    },
                  ]}
                >
                  {title}
                </Text>
              )}

              <View style={s.actions}>
                {actions.map((a, i) => (
                  <IconBtn key={`${a.icon}-${i}`} a={a} />
                ))}
              </View>
            </View>

            {/* Stacked display title */}
            {!collapsed && (
              <View style={{ marginTop: SIZES.margin.xl }}>
                {!!eyebrow && (
                  <Text
                    style={[asText(FONTS.eyebrow), { color: COLORS.heroAccent }]}
                  >
                    {eyebrow}
                  </Text>
                )}
                <Text
                  numberOfLines={2}
                  style={[
                    asText(FONTS.displayMd),
                    { color: COLORS.heroTextPrimary, marginTop: eyebrow ? 3 : 0 },
                  ]}
                >
                  {title}
                </Text>
                {!!caption && (
                  <Text
                    numberOfLines={2}
                    style={[
                      asText(FONTS.micro),
                      { color: COLORS.heroTextTertiary, marginTop: 4 },
                    ]}
                  >
                    {caption}
                  </Text>
                )}
              </View>
            )}

            {children}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
});

export default memo(PageHeader);
