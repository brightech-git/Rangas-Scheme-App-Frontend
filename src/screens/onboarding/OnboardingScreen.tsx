import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  StatusBar,
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

function Dots({ count, current }: { count: number; current: number }) {
  return (
    <View style={dot.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[dot.base, i === current ? dot.active : dot.inactive]} />
      ))}
    </View>
  );
}
const dot = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 24 },
  base:     { height: 8, borderRadius: 4 },
  active:   { width: 28, backgroundColor: COLORS.primary },
  inactive: { width: 8,  backgroundColor: COLORS.secondary },
});

const OnboardingScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { banners, loading, getImageUrl } = useOnboardingBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides = banners.map((item: Banner) => ({
    id:  String(item.BannerId),
    uri: getImageUrl(item.image_path),
  }));

  const isLast = currentIndex === slides.length - 1;

  const goTo = (index: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.6, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1,   duration: 200, useNativeDriver: true }),
    ]).start();
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleNext    = () => {
    if (currentIndex < slides.length - 1) goTo(currentIndex + 1);
    else { AsyncStorageHelper.setOnboarded(); navigation.replace('Register'); }
  };
  const handleSkip    = () => { AsyncStorageHelper.setOnboarded(); navigation.replace('Register'); };
  const handleSignIn  = () => { AsyncStorageHelper.setOnboarded(); navigation.replace('Login'); };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
        )}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={e => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      />

      <Animated.View style={[styles.bottomContent, { opacity: fadeAnim, paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
        <Dots count={slides.length} current={currentIndex} />
        <View style={styles.buttonGroup}>
          {isLast ? (
            <View style={styles.row}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn} activeOpacity={0.88}>
                <Text style={styles.primaryBtnText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.88}>
                <Text style={styles.primaryBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.row}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSkip} activeOpacity={0.88}>
                <Text style={styles.primaryBtnText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.88}>
                <Text style={styles.primaryBtnText}>Next  →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>

      {currentIndex > 0 && (
        <TouchableOpacity style={styles.tapLeft} activeOpacity={1} onPress={() => goTo(currentIndex - 1)} />
      )}
      {!isLast && (
        <TouchableOpacity style={styles.tapRight} activeOpacity={1} onPress={() => goTo(currentIndex + 1)} />
      )}
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.backgroundDark },
  slide:     { width, height },

  bottomContent: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24,
  },

  buttonGroup: { gap: 14 },
  row:         { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    flex:            1,
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
  outlineBtn: {
    flex:         1,
    height:       56,
    borderRadius: 14,
    alignItems:   'center',
    justifyContent: 'center',
    borderWidth:  1.5,
    borderColor:  COLORS.whiteOpacity30,
  },
  outlineBtnText: {
    fontFamily:    FONTS.family.bold,
    fontSize:      SIZES.font.lg,
    color:         COLORS.white,
    letterSpacing: 0.3,
  },

  tapLeft:  { position: 'absolute', top: 0, bottom: 120, left: 0,  width: width * 0.25 },
  tapRight: { position: 'absolute', top: 0, bottom: 120, right: 0, width: width * 0.25 },
});
