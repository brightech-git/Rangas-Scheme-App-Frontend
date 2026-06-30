// components/AppSchemeCard.tsx
//
// ─────────────────────────────────────────────────────────────────
// USAGE EXAMPLES
// ─────────────────────────────────────────────────────────────────
//
// 1. Default full card
//   <AppSchemeCard
//     variant="default"
//     scheme={scheme}
//     onPress={() => navigation.navigate('SchemeDetail', { id: scheme.id })}
//     onBuy={(id) => navigation.navigate('BuyScheme', { id })}
//     onDetails={(id) => navigation.navigate('SchemeDetail', { id })}
//   />
//
// 2. Horizontal list card
//   <AppSchemeCard variant="horizontal" scheme={scheme} onPress={...} />
//
// 3. Mini grid card  (use inside a 2-col FlatList)
//   <AppSchemeCard variant="mini" scheme={scheme} onPress={...} />
//
// 4. Loading skeleton
//   <AppSchemeCard variant="default" scheme={scheme} loading />
//
// 5. Expired / closed state
//   <AppSchemeCard variant="default" scheme={{ ...scheme, status: 'expired' }} onRedeem={...} />
// ─────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ImageSourcePropType, Animated,
  ViewStyle, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
export type SchemeStatus = 'active' | 'expired' | 'closing' | 'new' | 'trending';
export type SchemeVariant = 'default' | 'horizontal' | 'mini';
export type SchemeCategory = 'Investment' | 'Savings' | 'Jewellery' | 'Bonds' | 'Chit' | string;

export type SchemeData = {
  id: string;
  name: string;
  description: string;
  category: SchemeCategory;
  status: SchemeStatus;
  purity: '24K' | '22K' | '18K';
  returns: string;           // e.g. "12.4%"
  minAmount: number;         // in ₹
  duration?: string;         // e.g. "11 months"
  rating?: number;           // 0–5
  reviewCount?: number;
  tags?: string[];
  progress?: number;         // 0–100 — for active schemes
  nextDueDate?: string;      // e.g. "15 Jun 2026"
  monthlyAmount?: number;
  accumulatedAmount?: number;
  isFeatured?: boolean;
  /** Remote URL string OR local require() number */
  image?: string | ImageSourcePropType;
};

export type AppSchemeCardProps = {
  variant?: SchemeVariant;
  scheme: SchemeData;
  loading?: boolean;
  wishlisted?: boolean;
  style?: ViewStyle;
  onPress?: (id: string) => void;
  onBuy?: (id: string) => void;
  onDetails?: (id: string) => void;
  onRedeem?: (id: string) => void;
  onWishlistToggle?: (id: string, wishlisted: boolean) => void;
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<SchemeStatus, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',    color: '#FFFFFF', bg: '#7BAE3A' },
  expired:  { label: 'Closed',    color: '#FFFFFF', bg: '#6B7280' },
  closing:  { label: 'Closing',   color: '#FFFFFF', bg: '#DC2626' },
  new:      { label: 'New',       color: '#FFFFFF', bg: '#FF971D' },
  trending: { label: 'Trending',  color: '#FFFFFF', bg: '#FF971D' },
};

function resolveImageSource(
  image?: string | ImageSourcePropType,
): ImageSourcePropType | null {
  if (!image) return null;
  if (typeof image === 'string') return { uri: image };
  return image as ImageSourcePropType;
}

// ─────────────────────────────────────────────────────────────────
// Shimmer block (skeleton)
// ─────────────────────────────────────────────────────────────────
function Shimmer({
  width, height, borderRadius = 8, style,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,    duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#E5E7EB', opacity: anim },
        style,
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Image with uri/local/fallback support
// ─────────────────────────────────────────────────────────────────
function SchemeImage({
  image, height, gradientColors, children,
}: {
  image?: string | ImageSourcePropType;
  height: number;
  gradientColors: [string, string, ...string[]];
  children?: React.ReactNode;
}) {
  const [imgError, setImgError] = useState(false);
  const src = resolveImageSource(image);
  const showImage = src && !imgError;

  return (
    <View style={{ height, overflow: 'hidden' }}>
      {showImage ? (
        <Image
          source={src}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Stat block
// ─────────────────────────────────────────────────────────────────
function StatBlock({
  value, label, valueColor, bgColor,
}: {
  value: string; label: string; valueColor: string; bgColor: string;
}) {
  return (
    <View style={[styles.statBlock, { backgroundColor: bgColor }]}>
      <Text style={[styles.statVal, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(100, Math.max(0, value)),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [value]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: color }]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Wishlist button
// ─────────────────────────────────────────────────────────────────
function WishlistBtn({
  active, onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
    onToggle();
  };
  return (
    <TouchableOpacity onPress={handlePress} style={styles.wishlistBtn} activeOpacity={0.8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={active ? 'heart' : 'heart-outline'}
          size={18}
          color={active ? '#DC2626' : '#9CA3AF'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────
// Expired overlay
// ─────────────────────────────────────────────────────────────────
function ExpiredOverlay({ onRedeem, id }: { onRedeem?: (id: string) => void; id: string }) {
  const { COLORS, FONTS, SIZES } = useTheme();
  return (
    <View style={styles.expiredOverlay} pointerEvents="box-none">
      <View style={[styles.expiredPill, { backgroundColor: COLORS.white, borderColor: COLORS.border }]}>
        <Ionicons name="lock-closed-outline" size={12} color={COLORS.textTertiary} />
        <Text style={[styles.expiredText, { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.xs, color: COLORS.textTertiary }]}>
          {' '}Scheme closed
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// DEFAULT VARIANT — full card
// ─────────────────────────────────────────────────────────────────
function DefaultCard({
  scheme, loading, wishlisted, onPress, onBuy, onDetails, onRedeem, onWishlistToggle,
}: AppSchemeCardProps) {
  const { COLORS, FONTS, SIZES, SHADOWS, moderateScale } = useTheme();
  const [isWishlisted, setIsWishlisted] = useState(wishlisted ?? false);
  const isExpired = scheme.status === 'expired';
  const statusCfg = STATUS_CONFIG[scheme.status];

  const toggleWish = useCallback(() => {
    const next = !isWishlisted;
    setIsWishlisted(next);
    onWishlistToggle?.(scheme.id, next);
  }, [isWishlisted]);

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: COLORS.card }]}>
        <Shimmer width="100%" height={140} borderRadius={0} />
        <View style={{ padding: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Shimmer width={80} height={22} borderRadius={20} />
            <Shimmer width={60} height={22} borderRadius={20} style={{ marginLeft: 'auto' }} />
          </View>
          <Shimmer width="70%" height={14} />
          <Shimmer width="100%" height={10} />
          <Shimmer width="85%" height={10} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Shimmer width="31%" height={52} borderRadius={10} />
            <Shimmer width="31%" height={52} borderRadius={10} />
            <Shimmer width="31%" height={52} borderRadius={10} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Shimmer width="48%" height={42} borderRadius={12} />
            <Shimmer width="48%" height={42} borderRadius={12} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: COLORS.card },
        scheme.isFeatured && { borderWidth: 2, borderColor: COLORS.primary },
      ]}
      onPress={() => !isExpired && onPress?.(scheme.id)}
      android_ripple={{ color: COLORS.orangeOpacity10 }}
    >
      {scheme.isFeatured && (
        <View style={[styles.featuredBadge, { backgroundColor: COLORS.primary }]}>
          <Text style={[styles.featuredBadgeText, { fontFamily: FONTS.family.bold, fontSize: SIZES.font.xxs, color: COLORS.white }]}>
            MOST POPULAR
          </Text>
        </View>
      )}

      <SchemeImage
        image={scheme.image}
        height={140}
        gradientColors={[COLORS.primaryPale, COLORS.secondaryLighter]}
      >
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.badgeText, { fontFamily: FONTS.family.bold, fontSize: SIZES.font.xxs, color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
            <WishlistBtn active={isWishlisted} onToggle={toggleWish} />
          </View>
          <View style={{ position: 'absolute', bottom: 12, left: 14 }}>
            <Text style={[{ fontFamily: FONTS.family.bold, fontSize: SIZES.font.xxs, color: COLORS.primaryDark, letterSpacing: 0.5 }]}>
              {scheme.category.toUpperCase()}
            </Text>
            <Text style={[{ fontFamily: FONTS.family.extraBold, fontSize: SIZES.font.xl, color: COLORS.textPrimary, lineHeight: SIZES.font.xl * 1.2 }]}>
              {scheme.name}
            </Text>
          </View>
        </View>
        {isExpired && <ExpiredOverlay id={scheme.id} onRedeem={onRedeem} />}
      </SchemeImage>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <View style={[styles.categoryPill, { backgroundColor: COLORS.primaryPale }]}>
            <Text style={[styles.categoryText, { fontFamily: FONTS.family.bold, fontSize: SIZES.font.xxs, color: COLORS.primaryDark }]}>
              {scheme.category}
            </Text>
          </View>
          {scheme.rating != null && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={COLORS.secondary} />
              <Text style={[styles.ratingText, { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.xxs, color: COLORS.secondaryDark }]}>
                {' '}{scheme.rating.toFixed(1)}
              </Text>
              {scheme.reviewCount != null && (
                <Text style={[{ fontFamily: FONTS.family.regular, fontSize: SIZES.font.xxs, color: COLORS.textTertiary }]}>
                  {' '}({scheme.reviewCount.toLocaleString('en-IN')})
                </Text>
              )}
            </View>
          )}
        </View>

        <Text style={[styles.schemeName, { fontFamily: FONTS.family.bold, fontSize: SIZES.font.lg, color: COLORS.textPrimary }]}>
          {scheme.name}
        </Text>
        <Text style={[styles.schemeDesc, { fontFamily: FONTS.family.regular, fontSize: SIZES.font.sm, color: COLORS.textSecondary }]}>
          {scheme.description}
        </Text>

        <View style={styles.statsRow}>
          <StatBlock value={scheme.returns} label="Returns" valueColor={COLORS.successDark} bgColor={COLORS.gray50} />
          <StatBlock value={scheme.purity} label="Purity" valueColor={COLORS.secondaryDark} bgColor={COLORS.gray50} />
          <StatBlock value={`₹${scheme.minAmount.toLocaleString('en-IN')}`} label="Min / mo" valueColor={COLORS.textPrimary} bgColor={COLORS.gray50} />
        </View>

        {scheme.progress != null && (
          <View style={{ marginBottom: 12 }}>
            <View style={styles.progressLabelRow}>
              <Text style={[{ fontFamily: FONTS.family.medium, fontSize: SIZES.font.xs, color: COLORS.textSecondary }]}>
                Scheme completion
              </Text>
              <Text style={[{ fontFamily: FONTS.family.bold, fontSize: SIZES.font.xs, color: COLORS.primary }]}>
                {scheme.progress}%
              </Text>
            </View>
            <ProgressBar value={scheme.progress} color={COLORS.primary} />
          </View>
        )}

        {scheme.tags && scheme.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {scheme.tags.map(tag => (
              <View key={tag} style={[styles.tag, { borderColor: COLORS.border }]}>
                <Text style={[styles.tagText, { fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.xxs, color: COLORS.textSecondary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {scheme.monthlyAmount != null && (
          <>
            <View style={[styles.divider, { backgroundColor: COLORS.border }]} />
            <View style={styles.footer}>
              <View>
                <Text style={[{ fontFamily: FONTS.family.extraBold, fontSize: SIZES.font.xxl, color: COLORS.textPrimary }]}>
                  ₹{scheme.monthlyAmount.toLocaleString('en-IN')}
                  <Text style={[{ fontFamily: FONTS.family.regular, fontSize: SIZES.font.sm, color: COLORS.textSecondary }]}>/month</Text>
                </Text>
                {scheme.nextDueDate && (
                  <Text style={[{ fontFamily: FONTS.family.regular, fontSize: SIZES.font.xxs, color: COLORS.textTertiary, marginTop: 2 }]}>
                    Next due: {scheme.nextDueDate}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: COLORS.backgroundGold, borderColor: COLORS.secondaryLighter }]}
                onPress={() => onPress?.(scheme.id)}
                activeOpacity={0.75}
              >
                <Text style={[{ fontFamily: FONTS.family.bold, fontSize: SIZES.font.sm, color: COLORS.secondaryDark }]}>View plan</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.secondaryDark} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {!scheme.monthlyAmount && (
          <View style={styles.actions}>
            {isExpired ? (
              <>
                <TouchableOpacity style={[styles.btn, styles.btnDisabled]} disabled activeOpacity={1}>
                  <Ionicons name="close-circle-outline" size={15} color={COLORS.textTertiary} />
                  <Text style={[styles.btnText, { color: COLORS.textTertiary, fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.sm }]}>
                    Enrolment closed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnOutline, { borderColor: COLORS.border }]} onPress={() => onRedeem?.(scheme.id)} activeOpacity={0.75}>
                  <Ionicons name="cash-outline" size={15} color={COLORS.textSecondary} />
                  <Text style={[styles.btnText, { color: COLORS.textSecondary, fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.sm }]}>
                    Redeem
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.btn, styles.btnOutline, { borderColor: COLORS.border }]} onPress={() => onDetails?.(scheme.id)} activeOpacity={0.75}>
                  <Ionicons name="information-circle-outline" size={15} color={COLORS.textSecondary} />
                  <Text style={[styles.btnText, { color: COLORS.textSecondary, fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.sm }]}>
                    Details
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnGold, { backgroundColor: COLORS.secondary }]} onPress={() => onBuy?.(scheme.id)} activeOpacity={0.8}>
                  <Ionicons name="add-circle-outline" size={15} color={COLORS.white} />
                  <Text style={[styles.btnText, { color: COLORS.white, fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.sm }]}>
                    Start SIP
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// HORIZONTAL VARIANT — list row
// ─────────────────────────────────────────────────────────────────
function HorizontalCard({
  scheme, loading, onPress, onBuy, onDetails,
}: AppSchemeCardProps) {
  const { COLORS, FONTS, SIZES } = useTheme();
  const isExpired = scheme.status === 'expired';
  const statusCfg = STATUS_CONFIG[scheme.status];

  if (loading) {
    return (
      <View style={[styles.hCard, { backgroundColor: COLORS.card }]}>
        <Shimmer width={110} height={90} borderRadius={0} />
        <View style={{ flex: 1, padding: 12, gap: 8 }}>
          <Shimmer width="75%" height={12} />
          <Shimmer width="55%" height={10} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Shimmer width={36} height={28} borderRadius={6} />
            <Shimmer width={36} height={28} borderRadius={6} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Shimmer width="45%" height={32} borderRadius={10} />
            <Shimmer width="45%" height={32} borderRadius={10} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.hCard, { backgroundColor: COLORS.card }]}
      onPress={() => onPress?.(scheme.id)}
      android_ripple={{ color: COLORS.orangeOpacity10 }}
    >
      <SchemeImage image={scheme.image} height={90} gradientColors={[COLORS.primaryPale, COLORS.secondaryLighter]}>
        <View style={{ padding: 6 }}>
          <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.badgeText, { fontFamily: FONTS.family.bold, fontSize: SIZES.font.xxs, color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>
        <View style={{ position: 'absolute', bottom: 8, left: 8 }}>
          <Ionicons name="diamond-outline" size={26} color={COLORS.secondary} style={{ opacity: 0.35 }} />
        </View>
      </SchemeImage>

      <View style={styles.hBody}>
        <View>
          <Text style={[styles.hName, { fontFamily: FONTS.family.bold, fontSize: SIZES.font.sm, color: COLORS.textPrimary }]} numberOfLines={1}>
            {scheme.name}
          </Text>
          <Text style={[styles.hDesc, { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xs, color: COLORS.textSecondary }]} numberOfLines={2}>
            {scheme.description}
          </Text>
          <View style={styles.hStats}>
            <View>
              <Text style={[{ fontFamily: FONTS.family.bold, fontSize: SIZES.font.sm, color: COLORS.secondaryDark }]}>{scheme.purity}</Text>
              <Text style={[styles.hStatLabel, { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xxs, color: COLORS.textTertiary }]}>Purity</Text>
            </View>
            <View>
              <Text style={[{ fontFamily: FONTS.family.bold, fontSize: SIZES.font.sm, color: COLORS.successDark }]}>{scheme.returns}</Text>
              <Text style={[styles.hStatLabel, { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xxs, color: COLORS.textTertiary }]}>Returns</Text>
            </View>
            <View>
              <Text style={[{ fontFamily: FONTS.family.bold, fontSize: SIZES.font.sm, color: COLORS.textPrimary }]}>₹{scheme.minAmount.toLocaleString('en-IN')}</Text>
              <Text style={[styles.hStatLabel, { fontFamily: FONTS.family.regular, fontSize: SIZES.font.xxs, color: COLORS.textTertiary }]}>Min</Text>
            </View>
          </View>
        </View>
        <View style={styles.hActions}>
          <TouchableOpacity
            style={[styles.hBtn, { backgroundColor: COLORS.gray100 }]}
            onPress={() => onDetails?.(scheme.id)}
            activeOpacity={0.75}
          >
            <Text style={[{ fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.xxs, color: COLORS.textSecondary }]}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.hBtn, { backgroundColor: isExpired ? COLORS.gray200 : COLORS.secondary }]}
            onPress={() => !isExpired && onBuy?.(scheme.id)}
            disabled={isExpired}
            activeOpacity={0.8}
          >
            <Text style={[{ fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.xxs, color: isExpired ? COLORS.textTertiary : COLORS.white }]}>
              {isExpired ? 'Closed' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// MINI VARIANT — 2-column grid tile
// ─────────────────────────────────────────────────────────────────
function MiniCard({
  scheme, loading, onPress, onBuy,
}: AppSchemeCardProps) {
  const { COLORS, FONTS, SIZES } = useTheme();
  const isExpired = scheme.status === 'expired';
  const statusCfg = STATUS_CONFIG[scheme.status];

  if (loading) {
    return (
      <View style={[styles.miniCard, { backgroundColor: COLORS.card }]}>
        <Shimmer width="100%" height={80} borderRadius={0} />
        <View style={{ padding: 10, gap: 6 }}>
          <Shimmer width="80%" height={11} />
          <Shimmer width="55%" height={16} />
          <Shimmer width="40%" height={9} />
          <Shimmer width="100%" height={32} borderRadius={10} style={{ marginTop: 4 }} />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.miniCard, { backgroundColor: COLORS.card }]}
      onPress={() => onPress?.(scheme.id)}
      android_ripple={{ color: COLORS.orangeOpacity10 }}
    >
      <SchemeImage image={scheme.image} height={80} gradientColors={[COLORS.primaryPale, COLORS.secondaryLighter]}>
        <View style={{ padding: 6 }}>
          <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.badgeText, { fontFamily: FONTS.family.bold, fontSize: 8, color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>
        <View style={{ position: 'absolute', bottom: 6, right: 8, opacity: 0.18 }}>
          <Ionicons name="diamond-outline" size={22} color={COLORS.secondaryDark} />
        </View>
        {isExpired && <ExpiredOverlay id={scheme.id} />}
      </SchemeImage>
      <View style={styles.miniBody}>
        <Text style={[styles.miniName, { fontFamily: FONTS.family.bold, fontSize: SIZES.font.sm, color: COLORS.textPrimary }]} numberOfLines={1}>
          {scheme.name}
        </Text>
        <Text style={[{ fontFamily: FONTS.family.extraBold, fontSize: SIZES.font.xl, color: COLORS.secondaryDark }]}>
          {scheme.returns}
        </Text>
        <Text style={[{ fontFamily: FONTS.family.semiBold, fontSize: SIZES.font.xxs, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 }]}>
          Returns · {scheme.purity}
        </Text>
        <TouchableOpacity
          style={[styles.miniBtn, { backgroundColor: isExpired ? COLORS.gray200 : COLORS.secondary }]}
          onPress={() => !isExpired && onBuy?.(scheme.id)}
          disabled={isExpired}
          activeOpacity={0.8}
        >
          <Text style={[{ fontFamily: FONTS.family.bold, fontSize: SIZES.font.xs, color: isExpired ? COLORS.textTertiary : COLORS.white }]}>
            {isExpired ? 'Closed' : 'Invest →'}
          </Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────
export default function AppSchemeCard(props: AppSchemeCardProps) {
  const { variant = 'default' } = props;
  if (variant === 'horizontal') return <HorizontalCard {...props} />;
  if (variant === 'mini')       return <MiniCard       {...props} />;
  return                               <DefaultCard    {...props} />;
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
  },
  body:            { padding: 14 },
  metaRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  categoryPill:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  categoryText:    { letterSpacing: 0.3 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  ratingText:      {},
  schemeName:      { marginBottom: 4, lineHeight: 22 },
  schemeDesc:      { lineHeight: 18, marginBottom: 12 },
  statsRow:        { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBlock:       { flex: 1, borderRadius: 10, padding: 8, alignItems: 'center' },
  statVal:         { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  statLabel:       { fontSize: 9, color: '#9CA3AF', fontWeight: '600', marginTop: 3, letterSpacing: 0.3, textTransform: 'uppercase' },
  progressLabelRow:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressTrack:   { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: 3 },
  tagsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag:             { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 0.5 },
  tagText:         { letterSpacing: 0.2 },
  divider:         { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  footer:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 10, borderWidth: 0.5 },
  actions:         { flexDirection: 'row', gap: 8 },
  btn:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
  btnText:         { letterSpacing: 0.2 },
  btnOutline:      { borderWidth: 1.5 },
  btnGold:         {},
  btnDisabled:     { backgroundColor: '#F3F4F6' },
  badge:           { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText:       { letterSpacing: 0.4 },
  wishlistBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  featuredBadge:   { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 3, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  featuredBadgeText:{ letterSpacing: 0.5 },
  expiredOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  expiredPill:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  expiredText:     {},
  // horizontal
  hCard:           { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: '#E5E5E5' },
  hBody:           { flex: 1, padding: 12, justifyContent: 'space-between', minWidth: 0 },
  hName:           { marginBottom: 3 },
  hDesc:           { lineHeight: 16, marginBottom: 8 },
  hStats:          { flexDirection: 'row', gap: 12, marginBottom: 8 },
  hStatLabel:      {},
  hActions:        { flexDirection: 'row', gap: 6 },
  hBtn:            { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  // mini
  miniCard:        { borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#E5E5E5' },
  miniBody:        { padding: 10 },
  miniName:        { marginBottom: 2 },
  miniBtn:         { width: '100%', marginTop: 8, paddingVertical: 9, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});