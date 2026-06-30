// src/screens/login/LoginLogs.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  TextInput, TouchableOpacity, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '../../theme';
import SubPageHeader from '../../components/ui/SubPageHeader';
import PoweredByFooter from '../../components/ui/PoweredByFooter';
import { loginCheckService, LoginLog } from '../../api/services/loginCheckService';

// ── Date helpers ──────────────────────────────────────────────────
function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}
function formatDateTime(raw: string | null): string {
  const d = parseDate(raw);
  if (!d) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}
function timeAgo(raw: string | null): string {
  const d = parseDate(raw);
  if (!d) return '';
  const mins  = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30)  return `${days}d ago`;
  return '';
}

const AVATAR_COLORS = ['#C9A84C', '#7A8FA6', '#7B5EA7', '#2E9E8F', '#C8607A', '#5B82C9'];

// ── Single log card ───────────────────────────────────────────────
function LogCard({ item, index }: { item: LoginLog; index: number }) {
  const { COLORS, FONTS, SHADOWS } = useTheme();
  const initial = (item.USERNAME?.[0] ?? '?').toUpperCase();
  const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const ago = timeAgo(item.CREATED_AT);

  return (
    <View style={[s.card, { backgroundColor: COLORS.card, borderColor: COLORS.borderLight, ...SHADOWS.sm }]}>
      <View style={[s.avatar, { backgroundColor: avatarBg }]}>
        <Text style={[s.avatarTxt, { fontFamily: FONTS.family.bold }]}>{initial}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={s.titleRow}>
          <Text style={[s.name, { color: COLORS.textPrimary, fontFamily: FONTS.family.semiBold }]} numberOfLines={1}>
            {item.USERNAME || 'Unknown'}
          </Text>
          {ago ? (
            <Text style={[s.ago, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>{ago}</Text>
          ) : null}
        </View>

        {item.MOBILE_NUMBER ? (
          <TouchableOpacity
            style={s.metaRow}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(`tel:${item.MOBILE_NUMBER}`)}
          >
            <Ionicons name="call-outline" size={13} color={COLORS.primary} />
            <Text style={[s.metaTxt, { color: COLORS.primary, fontFamily: FONTS.family.medium }]}>
              {item.MOBILE_NUMBER}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={s.metaRow}>
          <Ionicons name="time-outline" size={13} color={COLORS.textTertiary} />
          <Text style={[s.metaTxt, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>
            {formatDateTime(item.CREATED_AT)}
          </Text>
        </View>
      </View>

      <View style={[s.idChip, { backgroundColor: COLORS.primary + '12' }]}>
        <Text style={[s.idTxt, { color: COLORS.primary, fontFamily: FONTS.family.semiBold }]}>#{item.ID}</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────
export default function LoginLogsScreen() {
  const { COLORS, FONTS } = useTheme();
  const [users, setUsers]     = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState('');
  const [query, setQuery]     = useState('');

  const fetchUsers = useCallback(async () => {
    setError('');
    try {
      const res = await loginCheckService.list();
      if (res?.status) {
        const list = Array.isArray(res.data) ? [...res.data] : [];
        // newest first (by ID, since CREATED_AT may be null)
        list.sort((a, b) => (b.ID ?? 0) - (a.ID ?? 0));
        setUsers(list);
      } else {
        setError(res?.message || 'Failed to load login logs');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not fetch login logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.USERNAME ?? '').toLowerCase().includes(q) ||
      (u.MOBILE_NUMBER ?? '').toLowerCase().includes(q));
  }, [users, query]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <SubPageHeader title="Login Logs" subtitle={`${users.length} record${users.length !== 1 ? 's' : ''}`} />

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={[s.searchBox, { backgroundColor: COLORS.card, borderColor: COLORS.borderLight }]}>
          <Ionicons name="search-outline" size={18} color={COLORS.textTertiary} />
          <TextInput
            style={[s.searchInput, { color: COLORS.textPrimary, fontFamily: FONTS.family.regular }]}
            placeholder="Search by name or mobile"
            placeholderTextColor={COLORS.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[s.muted, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>Loading logs…</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.textTertiary} />
          <Text style={[s.muted, { color: COLORS.textSecondary, fontFamily: FONTS.family.regular }]}>{error}</Text>
          <TouchableOpacity style={[s.retryBtn, { borderColor: COLORS.primary }]} onPress={() => { setLoading(true); fetchUsers(); }}>
            <Ionicons name="refresh" size={15} color={COLORS.primary} />
            <Text style={[s.retryTxt, { color: COLORS.primary, fontFamily: FONTS.family.semiBold }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.ID)}
          renderItem={({ item, index }) => <LogCard item={item} index={index} />}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="document-text-outline" size={40} color={COLORS.textTertiary} />
              <Text style={[s.muted, { color: COLORS.textTertiary, fontFamily: FONTS.family.regular }]}>
                {query ? 'No matching logs' : 'No login logs yet'}
              </Text>
            </View>
          }
          ListFooterComponent={filtered.length > 0 ? <PoweredByFooter /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1 },
  searchWrap:  { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 46 },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 10 },

  card:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  avatar:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontSize: 18 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name:      { fontSize: 15, flex: 1 },
  ago:       { fontSize: 11 },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaTxt:   { fontSize: 12 },
  idChip:    { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  idTxt:     { fontSize: 11 },

  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  muted:     { fontSize: 13, textAlign: 'center' },
  retryBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 9, marginTop: 4 },
  retryTxt:  { fontSize: 14 },
});
