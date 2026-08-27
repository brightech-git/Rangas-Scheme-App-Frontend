// src/components/ui/premium/GoldArrowButton.tsx

import React, { memo, useRef } from "react";
import {
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../theme";
import { asText } from "./tokens";

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  block?: boolean;
  style?: ViewStyle;
};

function GoldArrowButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon = "arrow-forward",
  block = true,
  style,
}: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const press = useRef(new Animated.Value(0)).current;
  const isOff = disabled || loading;

  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.97],
  });

  const discSize = moderateScale(38);

  return (
    <Pressable
      onPress={onPress}
      disabled={isOff}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPressIn={() =>
        Animated.spring(press, {
          toValue: 1,
          useNativeDriver: true,
          speed: 40,
          bounciness: 0,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(press, {
          toValue: 0,
          useNativeDriver: true,
          speed: 28,
          bounciness: 6,
        }).start()
      }
      style={block ? { width: "100%" } : undefined}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale }],
            opacity: isOff ? 0.55 : 1,
          },
          style,
        ]}
      >
        <LinearGradient
          colors={COLORS.gradient.premium1 as [string, string, ...string[]]}
          start={{ x: 1, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[
            s.pill,
            {
              width: "82%",
              height: moderateScale(54),
              borderRadius: moderateScale(34),
              alignSelf: "center",
            },
          ]}
        >
          {/* Centered content group */}
          <Animated.View style={s.content}>
            <Text
              numberOfLines={1}
              style={[
                asText(FONTS.button),
                {
                  fontFamily: FONTS.family.semiBold,
                  fontSize: SIZES.font.xl,
                  color: COLORS.white,
                  letterSpacing: 0.2,
                },
              ]}
            >
              {label}
            </Text>

            {/* Arrow */}
            <LinearGradient
              colors={COLORS.gradient.heroNoir as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                s.disc,
                {
                  width: discSize,
                  height: discSize,
                  borderRadius: discSize / 2,
                  marginLeft: moderateScale(12),
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.textOnGold} />
              ) : (
                <Ionicons
                  name={icon as any}
                  size={SIZES.icon.sm}
                  color={COLORS.textOnAccent}
                />
              )}
            </LinearGradient>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "rgba(245, 184, 0, 0.75)",

    overflow: "hidden",
  },

  // Keeps text + arrow together in the center
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  },

  disc: {
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#F5B800",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.45,
    shadowRadius: 8,

    elevation: 5,
  },
});

export default memo(GoldArrowButton);
