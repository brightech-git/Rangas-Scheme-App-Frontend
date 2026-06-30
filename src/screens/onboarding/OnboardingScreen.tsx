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
  active:   { width: 28, backgroundColor: COLORS.primary },
  inactive: { width: 8,  backgroundColor: 'rgba(255,255,255,0.35)' },
});

const OnboardingScreen = ({ navigation }: any) => {
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

      {/* Brand badge */}
      <View style={styles.brandBadge}>
        <Text style={styles.brandText}>✦ DigiGold</Text>
      </View>

      {/* Bottom content */}
      <Animated.View style={[styles.bottomContent, { opacity: fadeAnim }]}>
        <Dots count={slides.length} current={currentIndex} />

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>

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
    </View>
  );

  return (
    <View style={styles.container}>
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
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },

  slide: { width, height },

  // overlayTop: {
  //   ...StyleSheet.absoluteFillObject,
  //   height: height * 0.4,
  //   top: 0,
  //   backgroundColor: 'rgba(0,0,0,0.45)',
  // },
  // overlayBottom: {
  //   position: 'absolute',
  //   bottom: 0, left: 0, right: 0,
  //   height: height * 0.58,
  //   backgroundColor: 'rgba(8,8,8,0.84)',
  // },

  brandBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 42,
    left: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
  },
  brandText: {
    fontFamily: FONTS.family.bold,
    fontSize:   14,
    color:      COLORS.primary,
    letterSpacing: 0.8,
  },

  bottomContent: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
  },

  title: {
    fontFamily: FONTS.family.extraBold,
    fontSize:   30,
    color:      '#FFFFFF',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: FONTS.family.regular,
    fontSize:   SIZES.font.md,
    lineHeight: SIZES.font.md * 1.65,
    color:      'rgba(255,255,255,0.65)',
    marginBottom: 30,
  },

  buttonGroup: { gap: 16 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height:          56,
    borderRadius:    16,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.55,
    shadowRadius:    18,
    elevation:       10,
  },
  primaryBtnText: {
    fontFamily: FONTS.family.bold,
    fontSize:   SIZES.font.lg,
    color:      '#0a0a0a',
    letterSpacing: 0.2,
  },
  secondaryText: {
    fontFamily: FONTS.family.regular,
    fontSize:   SIZES.font.sm,
    color:      'rgba(255,255,255,0.5)',
    textAlign:  'center',
  },
  signInLink: {
    fontFamily: FONTS.family.bold,
    color:      COLORS.primary,
  },

  tapLeft:  { position: 'absolute', top: 0, bottom: 220, left: 0,          width: width * 0.25 },
  tapRight: { position: 'absolute', top: 0, bottom: 220, right: 0,         width: width * 0.25 },
});
