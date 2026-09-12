// src/screens/onboarding/OnboardingScreen.tsx
//
// "Premium Luxury" onboarding -- deep red canvas, serif headline,
// gold-thread progress and a die-cut gold arrow-disc CTA.
//
// The slide ARTWORK still comes from the live banner API exactly as
// before (useOnboardingBanners) -- nothing about the data source
// changed. What changed is the chrome around it: a brand-red gradient
// scrim + gold vignette sit over the photo so text stays legible on
// any banner image, a serif eyebrow/title/caption panel replaces the
// old caption-less slide, and navigation is a hairline gold thread
// instead of dots. Copy per slide is written locally (banners are
// photography, not copy, in this API) and cycles/pads to whatever
// number of banners the API returns.

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  StatusBar,
  Animated,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingBanners } from '../../api/hooks/Onboard/useOnboardingBanners';
import { Banner } from '../../types/onboarding';
import { AsyncStorageHelper } from '../../utils/AsyncStorageHelper';
import { useTheme } from '../../theme';
import { asText, GoldArrowButton } from '../../components/ui/premium';

const { width, height } = Dimensions.get('window');

// Local slide copy -- the API supplies banner photography, this is the
// editorial voice around it. Cycles by index so any banner count works.
const SLIDE_COPY = [
  { eyebrow: 'The Vault', title: 'Save gold.\nBuild your future.', body: 'Every rupee you set aside becomes real 24K gold, held securely in your name -- from as little as ₹100.' },
  { eyebrow: 'DigiGold', title: 'Invest in gold,\ndigitally.', body: 'Buy, accumulate and track gold in real time, at live market rates -- no locker, no waiting.' },
  { eyebrow: 'Assurance', title: 'Secure. Simple.\nTrusted.', body: 'Bank-grade encryption and BIS-certified purity, backed by a jeweller with decades of trust.' },
  { eyebrow: 'Begin', title: 'Start your\ngold journey.', body: 'Join thousands already building their wealth, one gram at a time.' },
];

function GoldThread({ count, current, color, inactiveColor }: { count: number; current: number; color: string; inactiveColor: string }) {
  return (
    <View style={thread.row}>
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={idx}
          style={[thread.seg, { backgroundColor: idx <= current ? color : inactiveColor }]}
        />
      ))}
    </View>
  );
}
const thread = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, marginBottom: 18 },
  seg: { flex: 1, height: 2.5, borderRadius: 2 },
});

const OnboardingScreen = ({ navigation }: any) => {
  const { COLORS, FONTS, SIZES } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { banners, loading, getImageUrl } = useOnboardingBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides = banners.map((item: Banner, idx: number) => ({
    id: String(item.BannerId),
    uri: getImageUrl(item.image_path),
    copy: SLIDE_COPY[idx % SLIDE_COPY.length],
  }));

  const count = slides.length;
  // count === 0 is a transient/empty-API edge case -- treat it as "last"
  // so the CTA reads "Get Started" and the tap-right zone doesn't render
  // over an empty red screen with nothing to advance to.
  const isLast = count === 0 || currentIndex === count - 1;

  const goTo = (index: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.5, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const finishOnboarding = () => AsyncStorageHelper.setOnboarded();

  const handleNext = () => {
    if (currentIndex < count - 1) goTo(currentIndex + 1);
    else { finishOnboarding(); navigation.replace('Register'); }
  };
  const handleSkip = () => { finishOnboarding(); navigation.replace('Register'); };
  const handleSignIn = () => { finishOnboarding(); navigation.replace('Login'); };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: COLORS.primaryDark }]}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.primaryDark }]} edges={['top']}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {/* Brand-red scrim so headline/body stay legible over any banner photo,
                plus a soft gold vignette at the top for the "subtle gold glow" the
                brief called for. */}
            
            
          </View>
        )}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      />

      {/* Top bar: brand mark + Skip, sitting in the 10% top safe zone */}
      <View style={[styles.topBar, { top: insets.top + 12 }]}>
        <Text style={[asText(FONTS.eyebrow), styles.brandMark, { color: COLORS.heroTextSecondary }]}>
          RANGAS <Text style={{ color: COLORS.secondary }}>DigiGold</Text>
        </Text>
        {!isLast && (
          <Pressable onPress={handleSkip} hitSlop={10} style={[styles.skipBtn, { borderColor: COLORS.heroHairlineBold }]}>
            <Text style={[styles.skipText, { color: COLORS.textOnPrimary }]}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Caption + CTA panel, animated on slide change, sitting in the
          bottom safe zone with room to breathe above the home indicator. */}
      <Animated.View
        style={[
          styles.bottomPanel,
          { opacity: fadeAnim, paddingBottom: Math.max(insets.bottom + 20, 32) },
        ]}
      >
        {/* {count > 0 && (
          <>
            <Text style={styles.eyebrow}>
              {String(currentIndex + 1).padStart(2, '0')} — {slides[currentIndex].copy.eyebrow.toUpperCase()}
            </Text>
            <Text style={styles.title}>{slides[currentIndex].copy.title}</Text>
            <View style={styles.rule} />
            <Text style={styles.body}>{slides[currentIndex].copy.body}</Text>
          </>
        )} */}

        <GoldThread count={count} current={currentIndex} color={COLORS.secondary} inactiveColor={COLORS.heroGlassBold} />

        <GoldArrowButton
          label={isLast ? 'Get Started' : 'Continue'}
          onPress={handleNext}
        />

        {isLast && (
          <Pressable onPress={handleSignIn} hitSlop={8} style={styles.signInBtn}>
            <Text style={[styles.signInText, { color: COLORS.heroTextMuted }]}>
              Already a member? <Text style={[styles.signInTextAccent, { color: COLORS.secondary }]}>Sign In</Text>
            </Text>
          </Pressable>
        )}
      </Animated.View>

      {currentIndex > 0 && (
        <Pressable style={styles.tapLeft} onPress={() => goTo(currentIndex - 1)} />
      )}
      {!isLast && count > 0 && (
        <Pressable style={styles.tapRight} onPress={() => goTo(Math.min(currentIndex + 1, count - 1))} />
      )}
    </SafeAreaView>
  );
};

export default OnboardingScreen;

// Colors are intentionally absent from every entry below.
// StyleSheet.create() runs once at import time, before useTheme() exists —
// a hex literal here is FROZEN and can never react to a theme change.
// Every color is applied live via inline style overrides at each usage
// site above (COLORS.xxx from useTheme()), which DO re-evaluate on every
// render. Only truly non-brand, always-white/neutral text on the dark
// hero photo (skipText) and generic white-on-photo scrims are left as
// plain white/rgba here, since those are not brand-palette colors.
const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  slide: { width, height },
  goldVeil: { position: 'absolute', top: 0, left: 0, right: 0, height: '30%' },

  topBar: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandMark: { letterSpacing: 1.4 },
  skipBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  skipText: { fontSize: 12, fontWeight: '600' },

  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // ~10% side safe space, ~20% bottom safe space per the brand brief
    paddingHorizontal: '10%',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Medium',
    fontSize: 27,
    lineHeight: 34,
    marginBottom: 14,
  },
  rule: {
    width: 46,
    height: 2,
    opacity: 0.9,
    marginBottom: 14,
    borderRadius: 2,
  },
  body: {
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '300',
    marginBottom: 22,
    maxWidth: '92%',
  },

  signInBtn: { marginTop: 16, alignSelf: 'center' },
  signInText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  signInTextAccent: {
    fontWeight: '600',
  },

  tapLeft: { position: 'absolute', top: 0, bottom: 160, left: 0, width: width * 0.22 },
  tapRight: { position: 'absolute', top: 0, bottom: 160, right: 0, width: width * 0.22 },
});
