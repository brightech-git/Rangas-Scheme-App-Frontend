import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  StatusBar,
  Platform,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useOnboardingBanners } from '../../api/hooks/Onboard/useOnboardingBanners';
import { Banner } from '../../types/onboarding';
import { AsyncStorageHelper } from '../../utils/AsyncStorageHelper';
import { FONTS, SIZES, COLORS } from '../../theme/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const TITLES = [
  'DigiGold',
  'Trust & Security',
  'Invest in Gold',
];
const DESCRIPTIONS = [
  'Smart & Secure Digital Gold Platform for every Indian household.',
  'Your gold investments are fully secure. Trade with confidence, knowing your assets are protected.',
  'Gold is a timeless investment that grows with you. Start building your wealth today.',
];

// Animated dot indicators
function Dots({ count, current }: { count: number; current: number }) {
  return (
    <View style={dot.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[dot.base, i === current ? dot.active : dot.inactive]}
        />
      ))}
    </View>
  );
}
const dot = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 24 },
  base:     { height: 8, borderRadius: 4 },
  active:   { width: 28, backgroundColor: COLORS.secondary },       // gold for active
  inactive: { width: 8,  backgroundColor: COLORS.whiteOpacity30 },
});

const OnboardingScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const flatListRef  = useRef<FlatList>(null);
  const { banners, loading, getImageUrl } = useOnboardingBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides = banners.map((item: Banner, index: number) => ({
    id:          String(item.BannerId),
    uri:         getImageUrl(item.image_path),
    title:       TITLES[index]       ?? item.title ?? 'DigiGold',
    description: DESCRIPTIONS[index] ?? '',
  }));

  const isLast = currentIndex === slides.length - 1;

  const goTo = (index: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.6, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1,   duration: 200, useNativeDriver: true }),
    ]).start();
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) { goTo(currentIndex + 1); }
    else { AsyncStorageHelper.setOnboarded(); navigation.replace('Register'); }
  };
  const handleSkip   = () => { AsyncStorageHelper.setOnboarded(); navigation.replace('Register'); };
  const handleSignIn = () => { AsyncStorageHelper.setOnboarded(); navigation.replace('Login'); };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: any) => (
    <View style={styles.slide}>
      {/* Full-screen background image */}
      <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Brand badge — red pill with gold text */}
      <View style={styles.brandBadge}>
        <View style={styles.brandDot} />
        <Text style={styles.brandText}>Rangas DigiGold</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
      />

      {/* Bottom content — outside FlatList so it's never clipped */}
      <Animated.View style={[styles.bottomContent, { opacity: fadeAnim, paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
        <Dots count={slides.length} current={currentIndex} />
        <Text style={styles.title}>{slides[currentIndex]?.title ?? ''}</Text>
        <Text style={styles.description}>{slides[currentIndex]?.description ?? ''}</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.88}>
            <Text style={styles.primaryBtnText}>
              {isLast ? 'Get Started' : 'Next  →'}
            </Text>
          </TouchableOpacity>
          {isLast ? (
            <TouchableOpacity onPress={handleSignIn} activeOpacity={0.8}>
              <Text style={styles.secondaryText}>
                Already have an account?{'  '}
                <Text style={styles.signInLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.8}>
              <Text style={styles.secondaryText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Tap left half to go back */}
      {currentIndex > 0 && (
        <TouchableOpacity
          style={styles.tapLeft}
          activeOpacity={1}
          onPress={() => goTo(currentIndex - 1)}
        />
      )}
      {/* Tap right half to go forward (only when not on last) */}
      {!isLast && (
        <TouchableOpacity
          style={styles.tapRight}
          activeOpacity={1}
          onPress={() => goTo(currentIndex + 1)}
        />
      )}
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.backgroundDark },

  slide: { width, height },

  brandBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 42,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  brandText: {
    fontFamily:    FONTS.family.bold,
    fontSize:      13,
    color:         COLORS.secondary,
    letterSpacing: 0.8,
  },

  bottomContent: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },

  title: {
    fontFamily:    FONTS.family.extraBold,
    fontSize:      30,
    color:         COLORS.white,
    marginBottom:  10,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: FONTS.family.regular,
    fontSize:   SIZES.font.md,
    lineHeight: SIZES.font.md * 1.65,
    color:      COLORS.whiteOpacity70,
    marginBottom: 30,
  },

  buttonGroup: { gap: 14 },
  primaryBtn: {
    backgroundColor: COLORS.secondary,
    height:          56,
    borderRadius:    14,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     COLORS.secondary,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.5,
    shadowRadius:    14,
    elevation:       8,
  },
  primaryBtnText: {
    fontFamily:    FONTS.family.bold,
    fontSize:      SIZES.font.lg,
    color:         COLORS.backgroundDark,
    letterSpacing: 0.3,
  },
  secondaryText: {
    fontFamily: FONTS.family.regular,
    fontSize:   SIZES.font.sm,
    color:      COLORS.whiteOpacity50,
    textAlign:  'center',
  },
  signInLink: {
    fontFamily: FONTS.family.bold,
    color:      COLORS.secondary,
  },

  tapLeft:  { position: 'absolute', top: 0, bottom: 260, left: 0,  width: width * 0.25 },
  tapRight: { position: 'absolute', top: 0, bottom: 260, right: 0, width: width * 0.25 },
});
