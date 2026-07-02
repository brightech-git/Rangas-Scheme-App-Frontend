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
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

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

// ── Badge ────────────────────────────────────────────────────────
function BadgeDot({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

// ── Center Home Tab — rounded-square gradient button ─────────────
function CenterTab({ item, isActive, onPress }: { item: TabItem; isActive: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.08 : 1,
      useNativeDriver: true,
      damping: 10,
      stiffness: 150,
    }).start();
    Animated.timing(glowAnim, {
      toValue: isActive ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.9,  useNativeDriver: true, speed: 40 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: isActive ? 1.08 : 1, useNativeDriver: true, speed: 28 }).start();

  return (
    <View style={styles.centerOuter}>
      <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Animated.View style={[styles.centerGlow, { opacity: glowAnim }]} />
          {isActive ? (
            <LinearGradient
              colors={['#aa0404', '#7a0303']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.centerFab}
            >
              <View style={styles.centerGoldStripe} />
              <Ionicons name="home" size={26} color="#ffcc00" />
            </LinearGradient>
          ) : (
            <View style={[styles.centerFab, styles.centerFabInactive]}>
              <Ionicons name="home-outline" size={26} color="#9a4040" />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
      <Text style={[styles.centerLabel, { color: isActive ? '#aa0404' : '#9a4040' }]}>
        {item.label}
      </Text>
    </View>
  );
}

// ── Regular Tab ──────────────────────────────────────────────────
function RegularTab({ item, isActive, onPress }: { item: TabItem; isActive: boolean; onPress: () => void }) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const dotScale   = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: isActive ? -3 : 0,
        useNativeDriver: true,
        damping: 14,
        stiffness: 180,
      }),
      Animated.spring(dotScale, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        damping: 12,
        stiffness: 200,
      }),
    ]).start();
  }, [isActive]);

  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 40 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 28 }).start();

  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
      <Animated.View style={[styles.tabInner, { transform: [{ translateY }, { scale: scaleAnim }] }]}>
        {isActive && <View style={styles.activePill} />}

        <View style={styles.iconWrap}>
          <Ionicons
            name={isActive ? item.iconActive : item.icon}
            size={22}
            color={isActive ? '#aa0404' : '#9a4040'}
          />
          {item.badge !== undefined && <BadgeDot count={item.badge} />}
        </View>

        <Text style={[
          styles.tabLabel,
          {
            color: isActive ? '#aa0404' : '#9a4040',
            fontFamily: isActive ? 'Poppins-SemiBold' : 'Poppins-Regular',
          },
        ]}>
          {item.label}
        </Text>

        <Animated.View style={[styles.activeDot, { transform: [{ scale: dotScale }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Custom Tab Bar ───────────────────────────────────────────────
function CustomTabBar({ state, navigation }: any) {
  const { verticalScale } = useTheme();
  const { unreadCount } = useUnreadCount();

  TABS[0].badge = unreadCount || 0;

  const TAB_BAR_H = Platform.OS === 'ios' ? verticalScale(72) : verticalScale(68);

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff' }}>
      <View style={[styles.tabBar, { height: TAB_BAR_H }]}>
        <View style={styles.topRedLine} />
        <View style={styles.goldDotRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.goldDotItem} />
          ))}
        </View>
        <View style={styles.tabsRow}>
          {state.routes.map((route: any, index: number) => {
            const tab      = TABS[index];
            const isActive = state.index === index;
            const isCenter = index === 2;
            const onPress  = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
            };
            if (isCenter) return <CenterTab key={route.key} item={tab} isActive={isActive} onPress={onPress} />;
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
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
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
    borderTopWidth: 1,
    borderTopColor: '#ead8d8',
    backgroundColor: '#fff',
    paddingTop: 4,
    position: 'relative',
  },
  topRedLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#aa0404',
    opacity: 0.85,
  },
  goldDotRow: {
    position: 'absolute',
    top: 7,
    right: 14,
    flexDirection: 'row',
    gap: 5,
  },
  goldDotItem: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffcc00',
    opacity: 0.75,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    height: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 4,
    minWidth: 52,
  },
  activePill: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    bottom: 6,
    backgroundColor: 'rgba(170, 4, 4, 0.07)',
    borderRadius: 10,
  },
  iconWrap: {
    position: 'relative',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffcc00',
    marginTop: 3,
  },
  // Center tab
  centerOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  centerGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    top: -8,
    alignSelf: 'center',
    backgroundColor: 'rgba(170, 4, 4, 0.14)',
  },
  centerFab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#aa0404',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  centerFabInactive: {
    backgroundColor: '#fff5f5',
    borderWidth: 1.5,
    borderColor: '#ead8d8',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  centerGoldStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#ffcc00',
    opacity: 0.9,
  },
  centerLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
    fontFamily: 'Poppins-Medium',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#aa0404',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 8,
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },
});
