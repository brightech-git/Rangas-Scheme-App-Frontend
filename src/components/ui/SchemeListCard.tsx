// src/components/ui/SchemeListCard.tsx
//
// The "All Schemes" expandable card used on the Scheme page — extracted so the
// Home page can reuse the exact same card. Pass `width` to use it inside a
// horizontal slider (otherwise it fills its parent width as a vertical list item).

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { IMAGE_BASE_URL } from '@env';

import { useTheme } from '../../theme';
import { ApiScheme, METAL_LABEL, METAL_COLOR } from '../../types/Scheme/Scheme';

const imgUrl = (path: string) => (path ? `${IMAGE_BASE_URL}${path}` : '');

export default function SchemeListCard({
  item,
  onJoin,
  width,
}: {
  item: ApiScheme;
  onJoin: (s: ApiScheme) => void;
  width?: number;
}) {
  const { COLORS, FONTS, SHADOWS, moderateScale } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      damping: 12,
      stiffness: 100,
    }).start();
  }, [expanded]);

  const maxHeight  = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 320] });
  const rotateIcon = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const mColor  = METAL_COLOR[item.MetalType] ?? COLORS.primary;
  const mLabel  = METAL_LABEL[item.MetalType] ?? item.MetalType;
  const canJoin = item.ADDNEWMEMBER === 'Y';

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: COLORS.white, borderColor: COLORS.borderLight, ...SHADOWS.sm },
        width ? { width, marginBottom: 0 } : null,
      ]}
    >
      {/* Header row */}
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.7} style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconContainer, { backgroundColor: mColor + '12' }]}>
            {item.image_path && !imgError ? (
              <Image source={{ uri: imgUrl(item.image_path) }} style={styles.schemeImage} onError={() => setImgError(true)} />
            ) : (
              <Ionicons name="diamond-outline" size={moderateScale(20)} color={mColor} />
            )}
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]} numberOfLines={1}>
              {item.schemeName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: mColor + '15' }]}>
              <Ionicons name="ellipse" size={7} color={mColor} />
              <Text style={[styles.statusText, { color: mColor }]}>{mLabel}</Text>
            </View>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
          <Ionicons name="chevron-down" size={moderateScale(22)} color={COLORS.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      {/* Always-visible stats */}
      <View style={styles.cardContent}>
        <Text style={[styles.description, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]} numberOfLines={2}>
          {item.FixedIns === 'Y' ? 'Fixed' : 'Flexible'} instalment {mLabel.toLowerCase()} savings scheme.
          Code: {item.SchemeSName}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Instalments</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{item.Instalment}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Metal</Text>
            <Text style={[styles.statValue, { color: mColor, fontFamily: FONTS.family.semiBold }]}>{mLabel}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Amount</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
              {item.FixedIns === 'Y' ? 'Fixed' : 'Flexible'}
            </Text>
          </View>
        </View>
      </View>

      {/* Expandable detail */}
      <Animated.View style={[styles.expandableContent, { maxHeight }]}>
        {expanded && (
          <View style={styles.expandedDetails}>
            <View style={[styles.divider, { backgroundColor: COLORS.borderLight }]} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Scheme Code</Text>
              <Text style={[styles.detailValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>{item.SchemeSName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Instalment Type</Text>
              <Text style={[styles.detailValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                {item.FixedIns === 'Y' ? 'Fixed Amount' : 'Flexible Amount'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Weight Ledger</Text>
              <Text style={[styles.detailValue, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]}>
                {item.WeightLedger === 'Y' ? 'Maintained' : 'Not Maintained'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Enrolment</Text>
              <Text style={[styles.detailValue, { color: canJoin ? COLORS.success : (COLORS.error ?? '#E53935'), fontFamily: FONTS.family.semiBold }]}>
                {canJoin ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Action */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: canJoin ? COLORS.primary : COLORS.borderLight }]}
          onPress={() => canJoin && onJoin(item)}
          disabled={!canJoin}
          activeOpacity={canJoin ? 0.85 : 1}
        >
          <Ionicons name={canJoin ? 'add-circle-outline' : 'lock-closed-outline'} size={20} color={canJoin ? COLORS.white : COLORS.textTertiary} />
          <Text style={[styles.actionButtonText, { color: canJoin ? COLORS.white : COLORS.textTertiary, fontFamily: FONTS.family.semiBold }]}>
            {canJoin ? 'Join Scheme' : 'Enrolment Closed'}
          </Text>
        </TouchableOpacity>
      </View>
      
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card:              { borderRadius: 16, borderWidth: 1, marginBottom: 16, padding: 16 },
  cardHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  schemeImage:       { width: 40, height: 40, borderRadius: 12 },
  cardTitleContainer:{ flex: 1 },
  cardTitle:         { fontSize: 16, lineHeight: 22 },
  statusBadge:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 3, alignSelf: 'flex-start', gap: 4 },
  statusText:        { fontSize: 10, fontWeight: '600' },
  cardContent:       { marginTop: 12 },
  description:       { fontSize: 13, lineHeight: 19, marginBottom: 12, opacity: 0.75 },
  statsRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  statItem:          { flex: 1 },
  statLabel:         { fontSize: 11, marginBottom: 2 },
  statValue:         { fontSize: 14 },
  expandableContent: { overflow: 'hidden' },
  expandedDetails:   { paddingTop: 4 },
  divider:           { height: 1, marginVertical: 10 },
  detailRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel:       { fontSize: 13 },
  detailValue:       { fontSize: 13 },
  cardFooter:        { marginTop: 16 },
  actionButton:      { flexDirection: 'row', paddingVertical: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionButtonText:  { fontSize: 14 },
});
