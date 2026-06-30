// src/screens/notification/NotificationScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useNotificationScreen, NotificationItem } from '../../api/hooks/Notifications/useNotificationScreen';
import { useUnreadCount } from '../../api/hooks/Notifications/useUnreadCount';
import CustomAlert from '../../components/ui/CustomAlert';
import AppHeader from '../../components/ui/appcomponents/AppHeader';

type Filter = 'all' | 'unread' | 'read';

// ── Time formatter ────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// ── Single notification card ──────────────────────────────────────
function NotifCard({
  item,
  onRead,
  onDelete,
}: {
  item: NotificationItem;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const { COLORS, FONTS, SHADOWS } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 24 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onIn}
        onPressOut={onOut}
        onPress={() => !item.read && onRead(item.id)}
        style={[
          styles.card,
          {
            backgroundColor:  item.read ? COLORS.card : COLORS.primaryPale,
            borderColor:      item.read ? COLORS.border : COLORS.primary + '40',
            borderLeftColor:  item.read ? COLORS.border : COLORS.primary,
            ...SHADOWS.sm,
          },
        ]}
      >
        {/* Unread dot */}
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: COLORS.primary }]} />
        )}

        {/* Icon or image */}
        <View style={[
          styles.iconWrap,
          { backgroundColor: item.read ? COLORS.gray100 : COLORS.primary + '18' },
        ]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 50, height: 50, borderRadius: 12,alignSelf: 'center' }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name={item.read ? 'notifications-outline' : 'notifications'}
              size={20}
              color={item.read ? COLORS.textTertiary : COLORS.primary}
            />
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: FONTS.family.semiBold,
              fontSize:   FONTS.bodyMedium.fontSize,
              color:      item.read ? COLORS.textSecondary : COLORS.textPrimary,
            }}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: FONTS.family.regular,
              fontSize:   FONTS.caption.fontSize,
              color:      COLORS.textTertiary,
              lineHeight: 18,
            }}
          >
            {item.message}
          </Text>
           {/* {item.status && item.status !== 'SENT' && (
            <View style={[styles.statusBadge, {
              backgroundColor:
                item.status === 'PENDING'  ? COLORS.warning  + '20' :
                item.status === 'FAILED'   ? COLORS.error    + '20' :
                COLORS.success + '20',
            }]}>
              <Text style={{
                fontFamily: FONTS.family.semiBold,
                fontSize:   FONTS.caption.fontSize - 1,
                color:
                  item.status === 'PENDING'  ? COLORS.warning  :
                  item.status === 'FAILED'   ? COLORS.error    :
                  COLORS.success,
              }}>
                {item.status}
              </Text>
            </View>
          )} */}
          <Text style={{
            fontFamily: FONTS.family.regular,
            fontSize:   FONTS.caption.fontSize,
            color:      COLORS.textDisabled,
            marginTop:  2,
          }}>
            {item.createdAt ? timeAgo(item.createdAt) : ''}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!item.read && (
            <TouchableOpacity
              onPress={() => onRead(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.actionBtn, { backgroundColor: COLORS.primary + '15' }]}
            >
              <Ionicons name="checkmark" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.actionBtn, { backgroundColor: COLORS.error + '15' }]}
          >
            <Ionicons name="trash-outline" size={14} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Empty state ───────────────────────────────────────────────────
function EmptyState({ filter }: { filter: Filter }) {
  const { COLORS, FONTS } = useTheme();
  const msgs: Record<Filter, { icon: string; text: string }> = {
    all:    { icon: '🔔', text: 'No notifications yet' },
    unread: { icon: '✅', text: "You're all caught up!" },
    read:   { icon: '📭', text: 'No read notifications' },
  };
  const m = msgs[filter];
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 48 }}>{m.icon}</Text>
      <Text style={{
        fontFamily: FONTS.family.medium,
        fontSize:   FONTS.bodyMedium.fontSize,
        color:      COLORS.textTertiary,
        marginTop:  12,
      }}>
        {m.text}
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────
export default function NotificationScreen() {
  const { COLORS, FONTS, SIZES } = useTheme();
  const navigation = useNavigation();

  // userId is read internally from AsyncStorage inside this hook
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    deleteOne,
    deleteAll,
  } = useNotificationScreen();

  // Refresh the header badge count whenever this screen gains focus
  const { refreshUnreadCount } = useUnreadCount();
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // fires when leaving the screen — header badge re-fetches
        refreshUnreadCount();
      };
    }, [refreshUnreadCount])
  );

  const [filter, setFilter]         = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<{
    visible: boolean; id: number | null; all: boolean;
  }>({ visible: false, id: null, all: false });

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read')   return n.read;
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const confirmDelete    = (id: number) => setDeleteAlert({ visible: true, id, all: false });
  const confirmDeleteAll = ()           => setDeleteAlert({ visible: true, id: null, all: true });

  const handleDeleteConfirm = async () => {
    if (deleteAlert.all)     await deleteAll();
    else if (deleteAlert.id) await deleteOne(deleteAlert.id);
    setDeleteAlert({ visible: false, id: null, all: false });
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',    label: 'All' },
    { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'read',   label: 'Read' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }} >

      {/* ── Header ─────────────────────────────────────────────── */}
      <AppHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        showBack
        onBackPress={() => (navigation as any).navigate('Home')}
        variant="primary"
        actions={[
          ...(unreadCount > 0 ? [{
            iconName: 'checkmark-done-outline',
            onPress: markAllRead,
          }] : []),
          ...(notifications.length > 0 ? [{
            iconName: 'trash-outline',
            onPress: confirmDeleteAll,
          }] : []),
        ]}
      />

      {/* ── Filter tabs ─────────────────────────────────────────── */}
      <View style={[styles.filterRow, {
        backgroundColor:   COLORS.card,
        borderBottomColor: COLORS.border,
      }]}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterTab,
              { borderBottomColor: filter === f.key ? COLORS.primary : 'transparent' },
            ]}
          >
            <Text style={{
              fontFamily: filter === f.key ? FONTS.family.semiBold : FONTS.family.regular,
              fontSize:   FONTS.bodyMedium.fontSize,
              color:      filter === f.key ? COLORS.primary : COLORS.textTertiary,
            }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ─────────────────────────────────────────────── */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textDisabled} />
          <Text style={{
            fontFamily: FONTS.family.medium,
            fontSize:   FONTS.bodyMedium.fontSize,
            color:      COLORS.textTertiary,
            marginTop:  12,
            textAlign:  'center',
            paddingHorizontal: 24,
          }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={refresh}
            style={[styles.retryBtn, { backgroundColor: COLORS.primary }]}
          >
            <Text style={{
              fontFamily: FONTS.family.semiBold,
              fontSize:   FONTS.bodyMedium.fontSize,
              color:      COLORS.white,
            }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) =>
            item?.id != null ? String(item.id) : `notif_${index}`
          }
          contentContainerStyle={{
            padding:     SIZES.padding.md,
            paddingBottom: 40,
            flexGrow:    1,
            gap:         10,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={<EmptyState filter={filter} />}
          renderItem={({ item, index }) => (
            <NotifCard
              key={item?.id != null ? String(item.id) : `notif_${index}`}
              item={item}
              onRead={markRead}
              onDelete={confirmDelete}
            />
          )}
        />
      )}

      {/* ── Delete confirm alert ─────────────────────────────────── */}
      <CustomAlert
        visible={deleteAlert.visible}
        type="confirm"
        title={deleteAlert.all ? 'Clear All Notifications' : 'Delete Notification'}
        message={
          deleteAlert.all
            ? 'This will permanently delete all your notifications.'
            : 'Are you sure you want to delete this notification?'
        }
        buttons={[
          {
            label: 'Cancel',
            style: 'secondary',
            onPress: () => setDeleteAlert({ visible: false, id: null, all: false }),
          },
          { label: 'Delete', style: 'danger', onPress: handleDeleteConfirm },
        ]}
        onDismiss={() => setDeleteAlert({ visible: false, id: null, all: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection:    'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTab: {
    flex:           1,
    alignItems:     'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
  },
  card: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    padding:       12,
    borderRadius:  14,
    borderWidth:   1,
    borderLeftWidth: 3,
    gap:           10,
  },
  unreadDot: {
    position: 'absolute',
    top: 10, right: 10,
    width: 8, height: 8,
    borderRadius: 99,
  },
  iconWrap: {
    width: 50, height: 50,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    alignSelf:     'center',
  },
  actions: {
    flexDirection:  'column',
    gap:            6,
    alignItems:     'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 28, height: 28,
    borderRadius:   8,
    alignItems:     'center',
    justifyContent: 'center',
  },
  empty: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom:  60,
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
  },
  retryBtn: {
    marginTop:       8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius:    10,
  },
  statusBadge: {
    alignSelf:       'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius:    4,
    marginTop:       3,
  },
});
