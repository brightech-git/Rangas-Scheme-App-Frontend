import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Text,
    FlatList,
    TouchableOpacity,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

import { useSchemeSliders } from '../api/hooks/HomeBanner/useHomeBanner';
import { SchemeSlider } from '../types/HomeBanner/HomeBanner';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 220;

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FALLBACK_URL = 'https://www.rangasjewellery.com/';

const HomeBannerScreen = () => {
    const { sliders, loading, error, getImageUrl } = useSchemeSliders();
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList<SchemeSlider>>(null);
    const navigation = useNavigation<Nav>();

    const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveIndex(index);
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={sliders}
                keyExtractor={(item) => String(item.SliderId)}
                horizontal
                pagingEnabled
                snapToAlignment="center"
                decelerationRate="fast"
                snapToInterval={width}
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                renderItem={({ item }: { item: SchemeSlider }) => (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.card}
                        onPress={() => navigation.navigate('WebView', {
                            url: item.link_url ?? FALLBACK_URL,
                            
                        })}
                    >
                        <Image
                            source={{ uri: getImageUrl(item.image_path) }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}
            />
            {/* Dot indicators */}
            <View style={styles.dots}>
                {sliders.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot, i === activeIndex && styles.dotActive]}
                    />
                ))}
            </View>
        </View>
    );
};

export default HomeBannerScreen;

const styles = StyleSheet.create({
    container: {
        height: ITEM_HEIGHT + 25,
        marginTop: 8,
    },

    card: {
        width,
        justifyContent: 'center',
        alignItems: 'center',
    },

    image: {
        width: width * 0.95,
        height: ITEM_HEIGHT,
        borderRadius: 18,
    },

    center: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },

    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },

    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D4AF3766',
        marginHorizontal: 4,
    },

    dotActive: {
        width: 16,
        backgroundColor: '#D4AF37',
    },
});