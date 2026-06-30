// src/utils/NotificationHandler.ts

import {
  getMessaging,
  getInitialNotification,
  onNotificationOpenedApp,
  onMessage,
} from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { displayNotification } from './NotificationService';

type NavRef = NavigationContainerRef<RootStackParamList>;

// ── Tab screens inside Main ──────────────────────────────────────
const TAB_SCREENS = ['Home', 'Portfolio', 'Transactions', 'BuyGold', 'Profile'];

// ── Navigate based on notification data ──────────────────────────
function handleNavigation(navigationRef: NavRef, data?: Record<string, string>) {
  if (!data?.screen) {
    navigationRef.navigate('Main');
    return;
  }
  const screen = data.screen;
  try {
    if (TAB_SCREENS.includes(screen)) {
      // Navigate to Main first then to the tab
      navigationRef.navigate('Main' as any);
      setTimeout(() => {
        navigationRef.navigate('Main' as any, { screen } as any);
      }, 300);
    } else {
      navigationRef.navigate(screen as any);
    }
  } catch {
    navigationRef.navigate('Main');
  }
}

// ── Register foreground handlers (call inside component) ──────────
export function registerForegroundHandlers(navigationRef: NavRef) {
  const messaging = getMessaging();

  const unsubscribeFCM = onMessage(messaging, async (remoteMessage) => {
    console.log('[FCM] Foreground message received:', JSON.stringify(remoteMessage));
    const { notification, data } = remoteMessage;
    if (notification) {
      await displayNotification(
        notification.title ?? 'DigiGold',
        notification.body  ?? '',
        data as Record<string, string>,
        notification.android?.imageUrl ?? (notification as any).ios?.imageUrl,
      );
    }
  });

  const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS && detail.notification?.data) {
      handleNavigation(navigationRef, detail.notification.data as Record<string, string>);
    }
  });

  return () => {
    unsubscribeFCM();
    unsubscribeNotifee();
  };
}

// ── Handle notification that opened app from quit state ───────────
export async function handleInitialNotification(navigationRef: NavRef) {
  const messaging = getMessaging();

  const remoteMessage = await getInitialNotification(messaging);
  if (remoteMessage?.data) {
    setTimeout(() => handleNavigation(navigationRef, remoteMessage.data as Record<string, string>), 1000);
  }

  const initialNotification = await notifee.getInitialNotification();
  if (initialNotification?.notification?.data) {
    setTimeout(() => handleNavigation(navigationRef, initialNotification.notification.data as Record<string, string>), 1000);
  }
}

// ── Handle notification that opened app from background ───────────
export function handleBackgroundOpenedApp(navigationRef: NavRef) {
  const messaging = getMessaging();
  onNotificationOpenedApp(messaging, (remoteMessage) => {
    if (remoteMessage?.data) {
      handleNavigation(navigationRef, remoteMessage.data as Record<string, string>);
    }
  });
}
