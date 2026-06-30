// src/components/headers/CommonHeader.tsx

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type ActionItem = {
  iconName: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  iconBg?: string;
  badge?: number;
  onPress: () => void;
  disabled?: boolean;
};

export type HeaderVariant = 'primary' | 'white' | 'gold' | 'transparent';

type Props = {
  title?: string;
  subtitle?: string;

  showBack?: boolean;
  leftIconName?: keyof typeof Ionicons.glyphMap;
  leftIconSize?: number;
  leftIconColor?: string;
  onBackPress?: () => void;
  leftActions?: ActionItem[];
  leftComponent?: React.ReactNode;

  rightActions?: ActionItem[];
  rightComponent?: React.ReactNode;

  centerComponent?: React.ReactNode;
  centerTitle?: boolean;

  variant?: HeaderVariant;
  backgroundColor?: string;
  borderBottom?: boolean;
  shadow?: boolean;
  transparent?: boolean;
  animated?: boolean;
};

// ─────────────────────────────────────────────────────────────────
// Badge dot
// ─────────────────────────────────────────────────────────────────
function BadgeDot({ count, errorColor, whiteColor, fontXxs, fontBold }: {
  count: number;
  errorColor: string;
  whiteColor: string;
  fontXxs: number;
  fontBold: string;
}) {
  return (
    <View style={[styles.badgeDot, { backgroundColor: errorColor, borderColor: whiteColor }]}>
      <Text style={[styles.badgeDotText, { color: whiteColor, fontSize: fontXxs, fontFamily: fontBold }]}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Single animated icon button
// ─────────────────────────────────────────────────────────────────
function IconBtn({
  item,
  fallbackColor,
  fallbackBg,
  iconSize,
  errorColor,
  whiteColor,
  fontXxs,
  fontBold,
  radiusMd,
  btnSize,
}: {
  item: ActionItem;
  fallbackColor: string;
  fallbackBg: string;
  iconSize: number;
  errorColor: string;
  whiteColor: string;
  fontXxs: number;
  fontBold: string;
  radiusMd: number;
  btnSize: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.84, useNativeDriver: true, speed: 40 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 24 }).start();

  return (
    <TouchableOpacity
      onPress={item.onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      activeOpacity={1}
      disabled={item.disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }], opacity: item.disabled ? 0.4 : 1 }]}>
        <View style={[styles.iconCircle, { backgroundColor: item.iconBg ?? fallbackBg, width: btnSize, height: btnSize, borderRadius: radiusMd }]}>
          <Ionicons
            name={item.iconName}
            size={item.iconSize ?? iconSize}
            color={item.iconColor ?? fallbackColor}
          />
        </View>
        {!!item.badge && item.badge > 0 && (
          <BadgeDot count={item.badge} errorColor={errorColor} whiteColor={whiteColor} fontXxs={fontXxs} fontBold={fontBold} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────
// CommonHeader
// ─────────────────────────────────────────────────────────────────
export default function CommonHeader({
  title,
  subtitle,

  showBack      = false,
  leftIconName  = 'arrow-back',
  leftIconSize,
  leftIconColor,
  onBackPress,
  leftActions   = [],
  leftComponent,

  rightActions  = [],
  rightComponent,

  centerComponent,
  centerTitle   = true,

  variant         = 'primary',
  backgroundColor,
  borderBottom    = true,
  shadow          = true,
  transparent     = false,
  animated        = true,
}: Props) {
  const { COLORS, FONTS, SIZES, SHADOWS, moderateScale, verticalScale } = useTheme();
  const navigation = useNavigation();

  const slideAnim = useRef(new Animated.Value(animated ? -40 : 0)).current;
  const fadeAnim  = useRef(new Animated.Value(animated ? 0  : 1)).current;

  React.useEffect(() => {
    if (!animated) return;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [animated]);

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  const isTransparent = transparent || variant === 'transparent';

  const resolvedBg: string = isTransparent
    ? 'transparent'
    : backgroundColor ?? (
        variant === 'gold'  ? COLORS.primaryDark
      : variant === 'white' ? COLORS.white
      : COLORS.primary
    );

  const onDark           = variant === 'primary' || variant === 'gold' || isTransparent;
  const iconFallbackColor = onDark ? COLORS.white          : COLORS.textPrimary;
  const iconFallbackBg    = onDark ? COLORS.whiteOpacity20 : COLORS.gray100;
  const titleColor        = onDark ? COLORS.white          : COLORS.textPrimary;
  const subColor          = onDark ? COLORS.whiteOpacity70 : COLORS.textSecondary;

  const backItem: ActionItem = {
    iconName:  leftIconName,
    iconSize:  leftIconSize,
    iconColor: leftIconColor,
    onPress:   handleBack,
  };

  const leftItems  = [...(showBack ? [backItem] : []), ...leftActions];
  const rightItems = rightActions;

  const btnSize   = moderateScale(38);
  const iconSize  = moderateScale(20);
  const radiusMd  = SIZES.radius.md;

  return (
    <>
      <StatusBar
        barStyle={onDark ? 'light-content' : 'dark-content'}
        backgroundColor={isTransparent ? 'transparent' : resolvedBg}
        translucent={isTransparent}
      />

      <SafeAreaView
        edges={['top']}
        style={{ backgroundColor: isTransparent ? 'transparent' : resolvedBg }}
      >
        {variant === 'gold' && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.decorCircle, { width: 130, height: 130, top: -50, right: -20, backgroundColor: COLORS.orangeOpacity20 }]} />
            <View style={[styles.decorCircle, { width: 80,  height: 80,  top: 10,  right: 90,  backgroundColor: COLORS.goldOpacity20 }]} />
            <View style={[styles.goldStrip, { backgroundColor: COLORS.secondary }]} />
          </View>
        )}

        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: verticalScale(58),
              paddingHorizontal: SIZES.padding.md,
              paddingVertical: SIZES.padding.xs,
              overflow: 'hidden',
              backgroundColor: resolvedBg,
            },
            borderBottom && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: onDark ? COLORS.whiteOpacity10 : COLORS.border,
            },
            shadow && !isTransparent && SHADOWS.sm,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
          ]}
        >
          {/* LEFT SLOT */}
          <View style={{ minWidth: moderateScale(44), maxWidth: moderateScale(140), alignItems: 'flex-start', justifyContent: 'center' }}>
            {leftComponent ? leftComponent : leftItems.length > 0 ? (
              <View style={styles.iconRow}>
                {leftItems.map((item, i) => (
                  <IconBtn
                    key={i}
                    item={item}
                    fallbackColor={iconFallbackColor}
                    fallbackBg={iconFallbackBg}
                    iconSize={iconSize}
                    errorColor={COLORS.error}
                    whiteColor={COLORS.white}
                    fontXxs={SIZES.font.xxs}
                    fontBold={FONTS.family.bold}
                    radiusMd={radiusMd}
                    btnSize={btnSize}
                  />
                ))}
              </View>
            ) : (
              <View style={{ width: moderateScale(44) }} />
            )}
          </View>

          {/* CENTER SLOT */}
          <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SIZES.padding.xs }, !centerTitle && { alignItems: 'flex-start' }]}>
            {centerComponent ? centerComponent : (
              <>
                {!!title && (
                  <Text numberOfLines={1} style={[FONTS.h5, styles.centerText, { color: titleColor }]}>
                    {title}
                  </Text>
                )}
                {!!subtitle && (
                  <Text numberOfLines={1} style={[FONTS.caption, styles.centerText, { color: subColor, marginTop: verticalScale(1) }]}>
                    {subtitle}
                  </Text>
                )}
                {!title && !subtitle && !centerComponent && (
                  <View style={styles.iconRow}>
                    <Text style={{ fontSize: SIZES.font.sm, color: onDark ? COLORS.secondary : COLORS.primary }}>✦</Text>
                    <Text style={{ fontFamily: FONTS.family.bold, fontSize: SIZES.font.xl, letterSpacing: -0.3, color: titleColor }}>
                      Digi<Text style={{ color: onDark ? COLORS.secondary : COLORS.primary }}>Gold</Text>
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* RIGHT SLOT */}
          <View style={{ minWidth: moderateScale(44), maxWidth: moderateScale(140), alignItems: 'flex-end', justifyContent: 'center' }}>
            {rightComponent ? rightComponent : rightItems.length > 0 ? (
              <View style={[styles.iconRow, { justifyContent: 'flex-end' }]}>
                {rightItems.map((item, i) => (
                  <IconBtn
                    key={i}
                    item={item}
                    fallbackColor={iconFallbackColor}
                    fallbackBg={iconFallbackBg}
                    iconSize={iconSize}
                    errorColor={COLORS.error}
                    whiteColor={COLORS.white}
                    fontXxs={SIZES.font.xxs}
                    fontBold={FONTS.family.bold}
                    radiusMd={radiusMd}
                    btnSize={btnSize}
                  />
                ))}
              </View>
            ) : (
              <View style={{ width: moderateScale(44) }} />
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Static styles (no theme values)
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrapper: {
    position: 'relative',
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 15,
    height: 15,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  badgeDotText: {
    letterSpacing: 0.2,
  },
  centerText: {
    textAlign: 'center',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  goldStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
});

if (Platform.OS === 'web') {
  (styles as any).iconWrapper = { ...(styles as any).iconWrapper, cursor: 'pointer' };
}
