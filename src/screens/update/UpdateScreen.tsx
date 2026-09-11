import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Linking,
  Image,
  ImageSourcePropType,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { asText, PremiumButton } from '../../components/ui/premium';

type Props = {
  mode: 'update' | 'maintenance';
  latestVersion?: string;
  storeUrl?: string;
  maintenanceMsg?: string;
  logo?: ImageSourcePropType;
};

export default function UpdateScreen({ mode, latestVersion, storeUrl, maintenanceMsg, logo }: Props) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();

  const fade  = useRef(new Animated.Value(0)).current;
  const rise  = useRef(new Animated.Value(20)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 540, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const ring = moderateScale(96);
  const spin = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const isUpdate = mode === 'update';

  return (
    <View style={[s.root, { backgroundColor: COLORS.heroCanvas }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.heroCanvas} />

      <LinearGradient
        colors={COLORS.gradient.heroNoir as [string, string, ...string[]]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[s.bloom, { backgroundColor: COLORS.heroGoldVeil }]} />
      </View>

      <Animated.View style={[s.body, { opacity: fade, transform: [{ translateY: rise }] }]}>
        {/* Spinning arc + logo */}
        <View style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={[s.arc, {
              width: ring, height: ring, borderRadius: ring / 2,
              borderColor: COLORS.heroHairline,
              borderTopColor: COLORS.heroAccent,
              transform: [{ rotate: spin }],
            }]}
          />
          {logo ? (
            <Image
              source={logo}
              resizeMode="cover"
              style={{ width: ring * 0.56, height: ring * 0.56, borderRadius: ring * 0.28 }}
            />
          ) : (
            <Text style={{ fontFamily: FONTS.family.trajanBold, fontSize: moderateScale(30), color: COLORS.heroAccent, letterSpacing: 1 }}>
              R
            </Text>
          )}
        </View>

        {/* Icon badge */}
        <View style={[s.badge, {
          backgroundColor: isUpdate ? COLORS.heroAccent : COLORS.warning,
          marginTop: SIZES.margin.xxl,
        }]}>
          <Ionicons
            name={isUpdate ? 'arrow-up-circle' : 'construct-outline'}
            size={moderateScale(28)}
            color={COLORS.heroCanvas}
          />
        </View>

        {/* Heading */}
        <Text style={[asText(FONTS.displayMd), {
          color: COLORS.heroTextPrimary,
          marginTop: SIZES.margin.xl,
          textAlign: 'center',
          letterSpacing: 0.5,
        }]}>
          {isUpdate ? 'New Update Available' : 'Under Maintenance'}
        </Text>

        <Text style={[asText(FONTS.eyebrow), {
          color: COLORS.heroAccent,
          marginTop: 4,
          letterSpacing: 3,
          textAlign: 'center',
        }]}>
          {isUpdate ? `VERSION ${latestVersion ?? ''}` : 'BACK SOON'}
        </Text>

        {/* Body */}
        <Text style={[asText(FONTS.micro), {
          color: COLORS.heroTextTertiary,
          textAlign: 'center',
          marginTop: SIZES.margin.xl,
          lineHeight: 22,
          paddingHorizontal: SIZES.padding.xxl,
          fontSize: 13,
        }]}>
          {isUpdate
            ? `A new version of Rangas DigiGold is available with the latest features and improvements.\n\nPlease update the app to continue.`
            : (maintenanceMsg || 'We are currently performing scheduled maintenance.\n\nPlease check back shortly.')}
        </Text>

        <View style={[s.divider, { backgroundColor: COLORS.heroHairline, marginVertical: SIZES.margin.xxl }]} />

        {/* CTA */}
        {isUpdate && storeUrl ? (
          <View style={{ width: '100%', paddingHorizontal: SIZES.layout.gutter }}>
            <PremiumButton
              label="Update Now"
              variant="gold"
              onPress={() => Linking.openURL(storeUrl)}
            />
            <Text style={[asText(FONTS.micro), {
              color: COLORS.heroTextMuted,
              textAlign: 'center',
              marginTop: SIZES.margin.lg,
              fontSize: 11,
            }]}>
              You must update to continue using the app
            </Text>
          </View>
        ) : (
          <View style={[s.pill, { borderColor: COLORS.heroHairline }]}>
            <Ionicons name="time-outline" size={14} color={COLORS.heroTextMuted} />
            <Text style={[asText(FONTS.micro), { color: COLORS.heroTextMuted, fontSize: 11 }]}>
              No action needed — we'll be back shortly
            </Text>
          </View>
        )}
      </Animated.View>

      <Animated.Text style={[asText(FONTS.micro), {
        opacity: fade,
        color: COLORS.heroTextMuted,
        textAlign: 'center',
        fontSize: 10,
        paddingBottom: moderateScale(28),
        paddingHorizontal: SIZES.layout.gutter,
      }]}>
        Rangas DigiGold · Secured savings · Hallmarked metal
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  bloom:  { position: 'absolute', top: -120, alignSelf: 'center', width: 320, height: 320, borderRadius: 160 },
  body:   { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  arc:    { position: 'absolute', borderWidth: 2 },
  badge:  { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  divider:{ width: 48, height: 1 },
  pill:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
});
