// src/components/ui/CustomAlert.tsx

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  BackHandler,
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';

const { width } = Dimensions.get('window');
const CARD_W = Math.min(width * 0.86, 360);

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'gold' | 'confirm';

export type AlertButton = {
  label: string;
  onPress?: () => void;
  style?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export type CustomAlertProps = {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  buttons?: AlertButton[];
  dismissible?: boolean;
  onDismiss?: () => void;
  loading?: boolean;
  autoDismiss?: number;
};

// ─────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────
function Spinner() {
  const { COLORS, moderateScale } = useTheme();
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 900, useNativeDriver: true })
    ).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[{
      width: moderateScale(52), height: moderateScale(52),
      borderRadius: moderateScale(26),
      borderWidth: 4,
      borderColor: COLORS.primaryPale,
      borderTopColor: COLORS.primary,
      transform: [{ rotate: spin }],
    }]} />
  );
}

// ─────────────────────────────────────────────────────────────────
// Alert icon with pulse ring
// ─────────────────────────────────────────────────────────────────
function AlertIcon({ iconName, iconColor, iconBg, ringColor, loading }: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  ringColor: string;
  loading: boolean;
}) {
  const { moderateScale } = useTheme();
  const pulse  = useRef(new Animated.Value(1)).current;
  const ringOp = useRef(new Animated.Value(0.6)).current;
  const popIn  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(popIn, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 200, delay: 120 }).start();
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.spring(pulse,  { toValue: 1.18, useNativeDriver: true, speed: 3 }),
          Animated.timing(ringOp, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(pulse,  { toValue: 1, useNativeDriver: true, speed: 3 }),
          Animated.timing(ringOp, { toValue: 0.6, duration: 400, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  if (loading) {
    return (
      <View style={{ width: moderateScale(80), height: moderateScale(80), alignItems: 'center', justifyContent: 'center', marginVertical: moderateScale(12) }}>
        <Spinner />
      </View>
    );
  }

  return (
    <Animated.View style={{ width: moderateScale(80), height: moderateScale(80), alignItems: 'center', justifyContent: 'center', marginVertical: moderateScale(12), transform: [{ scale: popIn }] }}>
      <Animated.View style={{ position: 'absolute', width: moderateScale(72), height: moderateScale(72), borderRadius: moderateScale(36), backgroundColor: ringColor, transform: [{ scale: pulse }], opacity: ringOp }} />
      <View style={{ width: moderateScale(60), height: moderateScale(60), borderRadius: moderateScale(30), backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={iconName} size={moderateScale(32)} color={iconColor} />
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Single button
// ─────────────────────────────────────────────────────────────────
function AlertBtn({ btn, onDismiss, isLast }: { btn: AlertButton; onDismiss?: () => void; isLast: boolean }) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 24 }).start();

  const handlePress = () => { btn.onPress?.(); onDismiss?.(); };
  const btnStyle = btn.style ?? 'primary';

  const bgColor     = btnStyle === 'primary' ? COLORS.primary : btnStyle === 'danger' ? COLORS.error : 'transparent';
  const borderColor = btnStyle === 'secondary' ? COLORS.primary : btnStyle === 'ghost' ? COLORS.border : 'transparent';
  const textColor   = btnStyle === 'primary' || btnStyle === 'danger' ? COLORS.white : btnStyle === 'secondary' ? COLORS.primary : COLORS.textSecondary;
  const hasBorder   = btnStyle === 'secondary' || btnStyle === 'ghost';

  return (
    <TouchableOpacity onPress={handlePress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1} style={{ flex: 1 }}>
      <Animated.View style={[{
        height: moderateScale(46),
        borderRadius: SIZES.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SIZES.padding.md,
        backgroundColor: bgColor,
        transform: [{ scale: scaleAnim }],
      },
        hasBorder && { borderWidth: 1.5, borderColor },
        !isLast && { marginRight: SIZES.margin.sm },
      ]}>
        <Text style={{ fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.md, letterSpacing: 0.3, color: textColor }}>
          {btn.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────
// CustomAlert
// ─────────────────────────────────────────────────────────────────
export default function CustomAlert({
  visible,
  type        = 'info',
  title,
  message,
  iconName,
  buttons     = [{ label: 'OK', style: 'primary' }],
  dismissible = true,
  onDismiss,
  loading     = false,
  autoDismiss = 0,
}: CustomAlertProps) {
  const { COLORS, FONTS, SIZES, SHADOWS, moderateScale } = useTheme();

  const backdropOp = useRef(new Animated.Value(0)).current;
  const cardScale  = useRef(new Animated.Value(0.8)).current;
  const cardOp     = useRef(new Animated.Value(0)).current;
  const cardY      = useRef(new Animated.Value(30)).current;
  const shakeX     = useRef(new Animated.Value(0)).current;

  // ── Type config ──────────────────────────────
  const typeConfig = {
    success: { icon: 'checkmark-circle' as const, iconColor: COLORS.success,   iconBg: 'rgba(123,174,58,0.12)',  ringColor: 'rgba(123,174,58,0.25)',  accentBar: COLORS.success },
    error:   { icon: 'close-circle'     as const, iconColor: COLORS.error,     iconBg: 'rgba(220,38,38,0.1)',    ringColor: 'rgba(220,38,38,0.2)',    accentBar: COLORS.error },
    warning: { icon: 'warning'          as const, iconColor: COLORS.warning,   iconBg: COLORS.orangeOpacity10,  ringColor: COLORS.orangeOpacity30,   accentBar: COLORS.warning },
    info:    { icon: 'information-circle' as const, iconColor: COLORS.info,    iconBg: 'rgba(59,130,246,0.1)',   ringColor: 'rgba(59,130,246,0.2)',   accentBar: COLORS.info },
    gold:    { icon: 'star'             as const, iconColor: COLORS.secondary, iconBg: COLORS.goldOpacity10,    ringColor: COLORS.goldOpacity30,     accentBar: COLORS.secondary },
    confirm: { icon: 'help-circle'      as const, iconColor: COLORS.primary,   iconBg: COLORS.orangeOpacity10,  ringColor: COLORS.orangeOpacity20,   accentBar: COLORS.primary },
  };

  const cfg = typeConfig[type];
  const resolvedIcon = iconName ?? cfg.icon;

  // ── Animations ───────────────────────────────
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOp, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(cardScale,  { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 200 }),
        Animated.timing(cardOp,     { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(cardY,      { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 200 }),
      ]).start();

      if (type === 'error') {
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue:  8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue:  6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue:  0, duration: 60, useNativeDriver: true }),
          ]).start();
        }, 200);
      }
    } else {
      Animated.parallel([
        Animated.timing(backdropOp, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(cardOp,     { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.spring(cardScale,  { toValue: 0.85, useNativeDriver: true, damping: 20 }),
        Animated.timing(cardY,      { toValue: 20, duration: 180, useNativeDriver: true }),
      ]).start(() => { cardScale.setValue(0.8); cardY.setValue(30); shakeX.setValue(0); });
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !autoDismiss) return;
    const t = setTimeout(() => onDismiss?.(), autoDismiss);
    return () => clearTimeout(t);
  }, [visible, autoDismiss]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dismissible) onDismiss?.();
      return true;
    });
    return () => sub.remove();
  }, [visible, dismissible]);

  const handleBackdrop = useCallback(() => {
    if (dismissible && !loading) onDismiss?.();
  }, [dismissible, loading, onDismiss]);

  if (!visible) return null;
return (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onDismiss}
  >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleBackdrop}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.overlayDark, zIndex: 50, opacity: backdropOp }]} />
      </TouchableWithoutFeedback>

      {/* Card */}
      <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 51 }} pointerEvents="box-none">
        <Animated.View style={[{
          width: CARD_W,
          backgroundColor: COLORS.white,
          borderRadius: SIZES.radius.xxl,
          alignItems: 'center',
          paddingHorizontal: SIZES.padding.xxl,
          paddingTop: SIZES.padding.lg,
          paddingBottom: SIZES.padding.xl,
          overflow: 'hidden',
          ...SHADOWS.xl,
          opacity: cardOp,
          transform: [{ scale: cardScale }, { translateY: cardY }, { translateX: shakeX }],
        }]}>
          {/* Accent bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: cfg.accentBar, borderTopLeftRadius: SIZES.radius.xxl, borderTopRightRadius: SIZES.radius.xxl }} />

          {/* Icon */}
          <AlertIcon iconName={resolvedIcon} iconColor={cfg.iconColor} iconBg={cfg.iconBg} ringColor={cfg.ringColor} loading={loading} />

          {/* Title */}
          <Text style={[FONTS.h4, { textAlign: 'center', color: COLORS.textPrimary, marginBottom: SIZES.margin.sm }]}>{title}</Text>

          {/* Message */}
          {!!message && (
            <Text style={[FONTS.body, { textAlign: 'center', color: COLORS.textSecondary, lineHeight: moderateScale(22), paddingHorizontal: SIZES.padding.sm, marginBottom: SIZES.margin.sm }]}>
              {message}
            </Text>
          )}

          {/* Divider */}
          <View style={{ width: '100%', height: StyleSheet.hairlineWidth, backgroundColor: COLORS.borderLight, marginVertical: SIZES.margin.md }} />

          {/* Buttons */}
          {!loading && (
            <View style={{ flexDirection: 'row', width: '100%' }}>
              {buttons.map((btn, i) => (
                <AlertBtn key={i} btn={btn} onDismiss={onDismiss} isLast={i === buttons.length - 1} />
              ))}
            </View>
          )}

          {loading && (
            <Text style={[FONTS.bodySmall, { color: COLORS.textTertiary, marginTop: SIZES.margin.sm, letterSpacing: 0.3 }]}>
              Please wait…
            </Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
