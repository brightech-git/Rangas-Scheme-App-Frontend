// src/navigation/BottomTabNavigator.tsx
//
// ─────────────────────────────────────────────────────────────────
// LAYOUT
//   A floating noir capsule rather than a full-width white shelf.
//   It detaches from the screen edge, so paper content scrolls
//   visibly beneath it and the app reads as layered.
//
//   The centre tab is no longer a raised gradient FAB. All five tabs
//   are equal-weight icons; the active one is marked by a gold pill
//   behind the icon and a label that fades in. This removes the
//   "Home is special" hierarchy that made the old bar feel like a
//   different app.
//
// WHY THIS IS BETTER UX
//   • Equal-weight tabs stop implying that the centre item is an
//     action rather than a destination.
//   • The floating capsule is narrower, so the thumb travels less
//     between adjacent tabs.
//   • Colours now come from AppTheme instead of the hardcoded hex
//     values the previous version used, so dark mode works.
//
// BUSINESS LOGIC — UNCHANGED
//   Tab registration, screen components, useUnreadCount polling and
//   the tabPress/navigate handler are identical.
// ─────────────────────────────────────────────────────────────────

import React, { useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
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
    icon: 'albums-outline',
    iconActive: 'albums',
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

// ── Single tab ──────────────────────────────────────────────────
const TabButton = memo(function TabButton({
  item,
  isActive,
  onPress,
}: {
  item: TabItem;
  isActive: boolean;
  onPress: () => void;
}) {
  const { COLORS, FONTS, moderateScale } = useTheme();
  const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 180,
    }).start();
  }, [isActive, anim]);

  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });

  const pillScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(press, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
          bounciness: 0,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(press, {
          toValue: 0,
          useNativeDriver: true,
          speed: 30,
          bounciness: 8,
        }).start()
      }
      style={s.tab}
      hitSlop={6}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
        <View style={s.iconSlot}>
          {/* Active pill */}
          <Animated.View
            style={[
              s.pill,
              {
                width: moderateScale(40),
                height: moderateScale(28),
                borderRadius: moderateScale(14),
                backgroundColor: COLORS.heroAccentSoft,
                opacity: anim,
                transform: [{ scale: pillScale }],
              },
            ]}
          />

          <Ionicons
            name={isActive ? item.iconActive : item.icon}
            size={moderateScale(20)}
            color={isActive ? COLORS.heroAccent : COLORS.heroTextTertiary}
          />

          {!!item.badge && item.badge > 0 && (
            <View
              style={[
                s.badge,
                {
                  backgroundColor: COLORS.primaryLighter,
                  borderColor: COLORS.heroElevated,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 8,
                  color: COLORS.white,
                  fontFamily: FONTS.family.bold,
                }}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </Text>
            </View>
          )}
        </View>

        <Animated.Text
          numberOfLines={1}
          style={[
            s.label,
            {
              color: isActive ? COLORS.heroAccent : COLORS.heroTextMuted,
              fontFamily: isActive
                ? FONTS.family.semiBold
                : FONTS.family.regular,
            },
          ]}
        >
          {item.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
});

// ── Custom Tab Bar ───────────────────────────────────────────────
function CustomTabBar({ state, navigation }: any) {
  const { COLORS, SIZES, SHADOWS, moderateScale } = useTheme();
  const { unreadCount } = useUnreadCount();

  TABS[0].badge = unreadCount || 0;

  return (
    <View pointerEvents="box-none" style={s.host}>
      <SafeAreaView edges={['bottom']} pointerEvents="box-none">
        <View
          style={[
            s.capsule,
            {
              marginHorizontal: SIZES.layout.gutter,
              marginBottom: Platform.OS === 'ios' ? 0 : moderateScale(10),
              borderRadius: SIZES.radius.pill,
              borderColor: COLORS.heroHairline,
              backgroundColor: COLORS.heroCanvas,
            },
            SHADOWS.float as any,
          ]}
        >
          <LinearGradient
            colors={COLORS.gradient.heroNoir as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: SIZES.radius.pill },
            ]}
          />

          <View style={s.row}>
            {state.routes.map((route: any, index: number) => {
              const tab = TABS[index];
              const isActive = state.index === index;
              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isActive && !event.defaultPrevented)
                  navigation.navigate(route.name);
              };
              return (
                <TabButton
                  key={route.key}
                  item={tab}
                  isActive={isActive}
                  onPress={onPress}
                />
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </View>
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
        // The bar floats over content, so screens keep their full height.
        sceneStyle: { backgroundColor: 'transparent' },
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
const s = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  capsule: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  pill: { position: 'absolute' },
  label: {
    fontSize: 9,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -10,
    minWidth: 15,
    height: 15,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
});
