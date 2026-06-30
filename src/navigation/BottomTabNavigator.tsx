// src/navigation/BottomTabNavigator.tsx

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  Easing,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '../theme';
import { useUnreadCount } from '../api/hooks/Notifications/useUnreadCount';

// ── Screens ─────────────────────────────────────────────────────
import NotificationScreen from '../screens/notification/NotificationScreen';
import SchemeScreen from '../screens/scheme/Scheme';
import HomeScreen from '../screens/home/HomeScreen';
import ContactScreen from '../screens/contact/contact';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

type TabItem = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  badge?: number;
  component: React.ComponentType<any>;
};

const TABS: TabItem[] = [
  { 
    name: 'Notification', 
    label: 'Alerts', 
    icon: 'notifications-outline',     
    iconActive: 'notifications',        
    component: NotificationScreen,
  },
  { 
    name: 'Scheme', 
    label: 'Schemes', 
    icon: 'grid-outline',     
    iconActive: 'grid',        
    component: SchemeScreen,
  },
  { 
    name: 'Home', 
    label: 'Home', 
    icon: 'home-outline',           
    iconActive: 'home',             
    component: HomeScreen,
  },
  { 
    name: 'Contact', 
    label: 'Contact', 
    icon: 'call-outline',    
    iconActive: 'call',      
    component: ContactScreen,
  },
  { 
    name: 'Profile', 
    label: 'Profile', 
    icon: 'person-outline',        
    iconActive: 'person',          
    component: ProfileScreen,
  },
];

// ── Badge component ─────────────────────────────────────────────
function BadgeDot({ count, errorColor, whiteColor }: { count: number; errorColor: string; whiteColor: string }) {
  if (!count || count <= 0) return null;
  return (
    <Animated.View style={[styles.badge, { backgroundColor: errorColor, borderColor: whiteColor }]}>
      <Text style={[styles.badgeText, { color: whiteColor }]}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
  );
}

// ── Center Tab (Home) with clean design ──────────────────────
function CenterTab({ item, isActive, onPress }: { item: TabItem; isActive: boolean; onPress: () => void }) {
  const { COLORS, moderateScale } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { 
      toValue: isActive ? 1.12 : 1, 
      useNativeDriver: true, 
      damping: 10, 
      stiffness: 150 
    }).start();

    // Pulsing animation when active
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  const onIn = () => Animated.spring(scaleAnim, { 
    toValue: 0.92, 
    useNativeDriver: true, 
    speed: 40 
  }).start();
  
  const onOut = () => Animated.spring(scaleAnim, { 
    toValue: isActive ? 1.12 : 1, 
    useNativeDriver: true, 
    speed: 24 
  }).start();

  return (
    <View style={styles.centerTabOuter}>
      <TouchableOpacity 
        onPress={onPress} 
        onPressIn={onIn} 
        onPressOut={onOut} 
        activeOpacity={1}
      >
        <Animated.View style={[
          styles.centerFabContainer,
          { 
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
          }
        ]}>
          <Animated.View style={[
            styles.centerFabRing,
            {
              backgroundColor: isActive ? COLORS.primary + '25' : 'transparent',
              transform: [{ scale: pulseAnim }],
            }
          ]} />
          <Animated.View style={[
            styles.centerFab,
            {
              backgroundColor: isActive ? COLORS.primary : COLORS.white,
              borderColor: isActive ? COLORS.primary : COLORS.borderLight,
              shadowColor: isActive ? COLORS.primary : '#000',
              shadowOffset: { width: 0, height: isActive ? 4 : 2 },
              shadowOpacity: isActive ? 0.2 : 0.05,
              shadowRadius: isActive ? 8: 4,
              elevation: isActive ? 6 : 2,
            },
          ]}>
            <Ionicons 
              name={isActive ? 'home' : 'home-outline'} 
              size={moderateScale(28)} 
              color={isActive ? COLORS.white : COLORS.textTertiary} 
            />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
      <Text style={[
        styles.centerLabel, 
        { 
          color: isActive ? COLORS.primary : COLORS.textTertiary,
          fontFamily: isActive ? 'Poppins-SemiBold' : 'Poppins-Medium',
        }
      ]}>
        {item.label}
      </Text>
    </View>
  );
}

// ── Regular tab with minimal design ────────────────────────────
function RegularTab({ item, isActive, onPress }: { item: TabItem; isActive: boolean; onPress: () => void }) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.6)).current;
  const lineScale = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { 
        toValue: isActive ? -4 : 0, 
        useNativeDriver: true, 
        damping: 14, 
        stiffness: 180 
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(lineScale, { 
        toValue: isActive ? 1 : 0, 
        useNativeDriver: true, 
        damping: 12, 
        stiffness: 200 
      }),
    ]).start();
  }, [isActive]);

  const onIn = () => Animated.spring(scaleAnim, { 
    toValue: 0.92, 
    useNativeDriver: true, 
    speed: 40 
  }).start();
  
  const onOut = () => Animated.spring(scaleAnim, { 
    toValue: 1, 
    useNativeDriver: true, 
    speed: 24 
  }).start();

  return (
    <TouchableOpacity 
      style={styles.tabItem} 
      onPress={onPress} 
      onPressIn={onIn} 
      onPressOut={onOut} 
      activeOpacity={1}
    >
      <Animated.View style={[
        styles.tabItemInner,
        { 
          transform: [{ translateY }, { scale: scaleAnim }],
          opacity: opacityAnim,
        }
      ]}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isActive ? item.iconActive : item.icon}
            size={moderateScale(24)}
            color={isActive ? COLORS.primary : COLORS.textTertiary}
          />
          {item.badge !== undefined && (
            <BadgeDot count={item.badge} errorColor={COLORS.error} whiteColor={COLORS.white} />
          )}
        </View>
        
        <Text style={[
          styles.tabLabel,
          {
            color: isActive ? COLORS.primary : COLORS.textTertiary,
            fontFamily: isActive ? FONTS.family.semiBold : FONTS.family.regular,
            fontSize: SIZES.font.xs,
          },
        ]}>
          {item.label}
        </Text>
        
        <Animated.View style={[
          styles.activeLine,
          {
            backgroundColor: COLORS.primary,
            transform: [{ scaleX: lineScale }],
          }
        ]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Custom Tab Bar with sleek design ───────────────────────────
function CustomTabBar({ state, navigation }: any) {
  const { COLORS, SIZES, SHADOWS, verticalScale } = useTheme();
  const { unreadCount } = useUnreadCount();
  
  const TAB_BAR_H = Platform.OS === 'ios' ? verticalScale(70) : verticalScale(66);
  
  // Update notification badge
  TABS[0].badge = unreadCount || 0;

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: 'transparent' }}>
      <View style={[
        styles.tabBar,
        {
          height: TAB_BAR_H,
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.borderLight,
          paddingHorizontal: SIZES.padding.sm,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.06,
          shadowRadius: 1,
          elevation: 1,
        },
      ]}>
        {/* Top accent line */}
        <View style={[styles.topAccent, { backgroundColor: COLORS.primary }]} />
        
        {/* Decorative dots */}
        <View style={styles.decorativeDots}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary + '15' }]} />
          <View style={[styles.dot, { backgroundColor: COLORS.primary + '15' }]} />
          <View style={[styles.dot, { backgroundColor: COLORS.primary + '15' }]} />
        </View>

        <View style={styles.tabsContainer}>
          {state.routes.map((route: any, index: number) => {
            const tab = TABS[index];
            const isActive = state.index === index;
            const isCenter = index === 2;

            const onPress = () => {
              const event = navigation.emit({ 
                type: 'tabPress', 
                target: route.key, 
                canPreventDefault: true 
              });
              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            if (isCenter) {
              return <CenterTab key={route.key} item={tab} isActive={isActive} onPress={onPress} />;
            }
            return <RegularTab key={route.key} item={tab} isActive={isActive} onPress={onPress} />;
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Navigator ────────────────────────────────────────────────────
export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      initialRouteName="Home"
    >
      {TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    position: 'relative',
    paddingTop: 8,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 50,
    height: 3,
    borderRadius: 2,
    marginLeft: -25,
  },
  decorativeDots: {
    position: 'absolute',
    top: 10,
    right: 20,
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  iconWrap: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    marginTop: 2,
    letterSpacing: 0.2,
    fontSize: 10,
  },
  activeLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
    marginTop: 3,
  },
  centerTabOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  centerFabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  centerFabRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  centerFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  centerLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: 9,
    letterSpacing: 0.2,
    fontFamily: 'Poppins-SemiBold',
  },
});