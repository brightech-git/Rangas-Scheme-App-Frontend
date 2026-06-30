// src/components/ui/SubPageHeader.tsx
// Common header for all sub-pages: back arrow + title + notification bell

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';

interface Props {
  title:        string;
  subtitle?:    string;
  onBack?:      () => void;       // override back behaviour
  hideNotification?: boolean;
  rightElement?: React.ReactNode; // optional custom right slot
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SubPageHeader({
  title, subtitle, onBack, hideNotification = false, rightElement,
}: Props) {
  const { COLORS, FONTS, SIZES, SHADOWS } = useTheme();
  const navigation = useNavigation<Nav>();

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View style={[s.container, {
      backgroundColor: COLORS.card,
      borderBottomColor: COLORS.border,
    }]}>

      {/* Back button */}
      <TouchableOpacity onPress={handleBack} style={s.iconBtn} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>

      {/* Title block */}
      <View style={s.titleBlock}>
        <Text
          numberOfLines={1}
          style={[s.title, { color: COLORS.textPrimary, fontFamily: FONTS.family.bold, fontSize: SIZES.font.lg }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={[s.subtitle, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular, fontSize: SIZES.font.xs }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right slot: optional custom element, otherwise a spacer to keep the title centered */}
      {rightElement ? (
        <View style={s.iconBtn}>{rightElement}</View>
      ) : (
        <View style={s.iconBtn} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 12,
    paddingVertical:   12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   20,
  },
  titleBlock: {
    flex:      1,
    alignItems:'center',
  },
  title:    { letterSpacing: -0.2 },
  subtitle: { marginTop: 1 },
});
