// src/components/InAppMessageModal.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  BackHandler,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { axiosInstance } from '../api/axiosInstance';
import { NOTIFICATIONS } from '../api/endpoints';
import { AsyncStorageHelper } from '../utils/AsyncStorageHelper';
import { RootStackParamList } from '../navigation/RootNavigator';
import AppLoader from './ui/appcomponents/AppLoader';

// ── Constants ────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');
const CARD_W = Math.min(width * 0.88, 380);

const TAB_SCREENS = new Set(['Home', 'Portfolio', 'Transactions', 'BuyGold', 'Profile']);

const ANIMATION = {
  IN_BACKDROP: 250,
  IN_CARD: 220,
  OUT_BACKDROP: 150,
  OUT_CARD: 120,
  QUEUE_GAP: 300,
  NAVIGATE_DELAY: 350,
  SPRING_DAMPING: 15,
  SPRING_STIFFNESS: 180,
  SPRING_OUT_DAMPING: 20,
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: number;
  title: string;
  message: string;
  imageUrl?: string;
  screenName?: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ── Hook: message queue ──────────────────────────────────────────────────────

function useMessageQueue() {
  const queueRef = useRef<Message[]>([]);
  const [currentMsg, setCurrentMsg] = useState<Message | null>(null);
  const [visible, setVisible] = useState(false);
  const isBusy = useRef(false);

  const showNext = useCallback(() => {
    if (isBusy.current || queueRef.current.length === 0) return;
    const next = queueRef.current.shift()!;
    setCurrentMsg(next);
    setVisible(true);
  }, []);

  const enqueue = useCallback(
    (messages: Message[]) => {
      queueRef.current = messages;
      showNext();
    },
    [showNext],
  );

  return { queueRef, currentMsg, setCurrentMsg, visible, setVisible, isBusy, showNext, enqueue };
}

// ── Hook: entrance / exit animation ─────────────────────────────────────────

function useModalAnimation(visible: boolean) {
  const backdropOp = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    backdropOp.setValue(0);
    cardScale.setValue(0.85);
    cardOp.setValue(0);

    Animated.parallel([
      Animated.timing(backdropOp, {
        toValue: 1,
        duration: ANIMATION.IN_BACKDROP,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: ANIMATION.SPRING_DAMPING,
        stiffness: ANIMATION.SPRING_STIFFNESS,
        useNativeDriver: true,
      }),
      Animated.timing(cardOp, {
        toValue: 1,
        duration: ANIMATION.IN_CARD,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, backdropOp, cardScale, cardOp]);

  const animateOut = useCallback(
    (onDone: () => void) => {
      Animated.parallel([
        Animated.timing(backdropOp, {
          toValue: 0,
          duration: ANIMATION.OUT_BACKDROP,
          useNativeDriver: true,
        }),
        Animated.timing(cardOp, {
          toValue: 0,
          duration: ANIMATION.OUT_CARD,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 0.85,
          damping: ANIMATION.SPRING_OUT_DAMPING,
          useNativeDriver: true,
        }),
      ]).start(onDone);
    },
    [backdropOp, cardOp, cardScale],
  );

  return { backdropOp, cardScale, cardOp, animateOut };
}

// ── Main component ───────────────────────────────────────────────────────────

export default function InAppMessageModal() {
  const { COLORS, FONTS, SIZES, SHADOWS } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { queueRef, currentMsg, setCurrentMsg, visible, setVisible, isBusy, showNext, enqueue } =
    useMessageQueue();

  const { backdropOp, cardScale, cardOp, animateOut } = useModalAnimation(visible);

  const [navigating, setNavigating] = useState(false);

  // ── Fetch unread in-app messages on mount ────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userId = await AsyncStorageHelper.getUserId();
        if (!userId || cancelled) return;

        const res = await axiosInstance.get(NOTIFICATIONS.GET_USER(Number(userId)));
        const items: any[] = res.data?.data ?? [];

        const unread: Message[] = items
          .filter((n: any) => n.InAppMessage === true && n.IsRead === false)
          .map((n: any) => ({
            id: n.Id,
            title: n.Title ?? '',
            message: n.Message ?? '',
            imageUrl: n.ImageUrl || undefined,
            screenName: n.ScreenName || undefined,
          }));

        if (unread.length > 0 && !cancelled) {
          enqueue(unread);
        }
      } catch {
        // Silently ignore — modal is non-critical UI
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueue]);

  // ── Mark as read (fire-and-forget) ───────────────────────────────────────

  const markAsRead = useCallback(async (msg: Message) => {
    try {
      const userId = await AsyncStorageHelper.getUserId();
      if (!userId) return;
      await axiosInstance.post(NOTIFICATIONS.MARK_READ(msg.id, Number(userId)));
    } catch {
      // Silently ignore
    }
  }, []);

  // ── Dismiss ──────────────────────────────────────────────────────────────

  const dismiss = useCallback(
    (shouldNavigate = false) => {
      if (isBusy.current || !visible) return;
      isBusy.current = true;

      const screenName = currentMsg?.screenName;
      if (currentMsg) markAsRead(currentMsg);
      if (shouldNavigate && screenName) setNavigating(true);

      animateOut(() => {
        isBusy.current = false;
        setVisible(false);
        setCurrentMsg(null);

        setTimeout(showNext, ANIMATION.QUEUE_GAP);

        if (shouldNavigate && screenName) {
          if (TAB_SCREENS.has(screenName)) {
            navigation.navigate('Main' as any, { screen: screenName } as any);
          } else {
            navigation.navigate(screenName as keyof RootStackParamList as any);
          }
          setNavigating(false);
        }
      });
    },
    [
      isBusy,
      visible,
      currentMsg,
      markAsRead,
      animateOut,
      setVisible,
      setCurrentMsg,
      showNext,
      navigation,
    ],
  );

  // ── Android back button ──────────────────────────────────────────────────

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss(false);
      return true;
    });

    return () => sub.remove();
  }, [visible, dismiss]);

  // ── Early exit ───────────────────────────────────────────────────────────

  if (!currentMsg && !navigating) return null;

  const hasImage  = !!currentMsg?.imageUrl;
  const hasAction = !!currentMsg?.screenName;
  const remaining = queueRef.current.length;

  // ── Styles (inline to use theme) ────────────────────────────────────────

  const cardStyle = {
    width: CARD_W,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius?.xxl ?? 20,
    ...SHADOWS.xl,
  };

  return (
    <>
      <AppLoader visible={navigating} message="Navigating ..." />
      {!!currentMsg && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={() => dismiss(false)} accessible={false}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOp }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </TouchableWithoutFeedback>

      {/* Card container */}
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.cardWrapper}>
          {/* Close button — floats above card to avoid overflow:hidden clipping */}
          <Animated.View style={[styles.closeBtnWrapper, { opacity: cardOp }]}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => dismiss(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Dismiss notification"
              accessibilityRole="button"
            >
              <Text style={[styles.closeBtnText, { color: COLORS.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Main card */}
          <Animated.View
            style={[styles.card, cardStyle, { opacity: cardOp, transform: [{ scale: cardScale }] }]}
            accessibilityViewIsModal
            accessibilityLiveRegion="assertive"
          >
            {/* Accent bar */}
            <View style={[styles.accentBar, { backgroundColor: COLORS.primary }]} />

            {/* Hero image */}
            {hasImage && (
              <Image
                source={{ uri: currentMsg.imageUrl }}
                style={styles.image}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            )}

            {/* Text content */}
            <View style={[styles.body, !hasImage && styles.bodyNoImage]}>
              <Text
                style={[FONTS.h5, styles.title, { color: COLORS.textPrimary }]}
                numberOfLines={2}
                accessibilityRole="header"
              >
                {currentMsg.title}
              </Text>
              <Text
                style={[FONTS.body, styles.message, { color: COLORS.textSecondary }]}
                numberOfLines={5}
              >
                {currentMsg.message}
              </Text>
            </View>

            {/* Queue indicator */}
            {remaining > 0 && (
              <Text style={[FONTS.caption, styles.queueHint, { color: COLORS.textTertiary }]}>
                {remaining} more message{remaining > 1 ? 's' : ''}
              </Text>
            )}

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: COLORS.border }]} />

            {/* CTA button */}
            <TouchableOpacity
              onPress={() => dismiss(hasAction)}
              style={[styles.btn, { backgroundColor: COLORS.primary }]}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={hasAction ? `View ${currentMsg.screenName}` : 'Dismiss'}
            >
              <Text style={[FONTS.button, { color: COLORS.white }]}>
                {hasAction ? 'View' : 'Got it'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
      )}
    </>
  );
}

// ── Static styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 50,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 51,
  },
  cardWrapper: {
    position: 'relative',
  },
  card: {
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 20,
  },
  accentBar: {
    width: '100%',
    height: 4,
  },
  image: {
    width: '100%',
    height: 180,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
    width: '100%',
  },
  bodyNoImage: {
    paddingTop: 28,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    textAlign: 'center',
    lineHeight: 24,
  },
  queueHint: {
    marginTop: 4,
  },
  divider: {
    width: '85%',
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  btn: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  closeBtnWrapper: {
    position: 'absolute',
    top: -14,
    right: -14,
    zIndex: 100,
  },
  closeBtn: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  closeBtnText: {
    fontSize: 14,
    lineHeight: 16,
  },
});