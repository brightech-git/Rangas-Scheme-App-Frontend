// src/components/ui/appcomponents/EmpIdField.tsx
//
// Staff-only "Emp ID" picker. Renders as a FormField button that opens a
// bottom-sheet search modal backed by GET /api/v1/employees?empId=<query>
// — type digits, pick a match. Kept as its own component since it's
// reused by both SchemeJoinScreen and BuyGoldScreen.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { employeeService } from '../../../api/services/employeeService';
import { Employee } from '../../../types/Employee/Employee';
import { FormField, asText } from '../premium';

type Props = {
  empId: string;
  empName?: string;
  onSelect: (emp: { empId: string; empName: string }) => void;
};

export default function EmpIdField({ empId, empName, onSelect }: Props) {
  const { COLORS, FONTS, SIZES } = useTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPicker = () => {
    setQuery(empId || '');
    setResults([]);
    setError(null);
    setVisible(true);
  };

  useEffect(() => {
    if (!visible) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      employeeService
        .search(q)
        .then((res) => {
          setResults(Array.isArray(res) ? res : []);
          setError(null);
        })
        .catch(() => setError('Could not search employees'))
        .finally(() => setLoading(false));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible]);

  const pick = (emp: Employee) => {
    onSelect({ empId: String(emp.EMPID), empName: emp.EMPNAME });
    setVisible(false);
  };

  return (
    <>
      <FormField
        asButton
        onPress={openPicker}
        label="Emp ID"
        indicator="optional"
        icon="person-outline"
        rightIcon="chevron-down"
        onRightIconPress={openPicker}
        value={empName ? `${empName} (${empId})` : empId}
        placeholder="Search employee"
      />

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={[s.overlay, { backgroundColor: COLORS.blackOpacity60 }]} onPress={() => setVisible(false)}>
          <Pressable
            style={[s.sheet, { backgroundColor: COLORS.canvasElevated, borderRadius: SIZES.radius.sheet }]}
          >
            <View style={[s.head, { paddingHorizontal: SIZES.layout.gutter, paddingTop: SIZES.padding.xl }]}>
              <Text style={[asText(FONTS.eyebrow), { color: COLORS.primaryInk }]}>Staff only</Text>
              <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary, marginTop: 2 }]}>
                Search Emp ID
              </Text>
            </View>

            <View
              style={[
                s.searchRow,
                {
                  marginHorizontal: SIZES.layout.gutter,
                  marginTop: SIZES.margin.lg,
                  borderColor: COLORS.hairline,
                  borderRadius: SIZES.radius.tile,
                },
              ]}
            >
              <Ionicons name="search-outline" size={16} color={COLORS.inkTertiary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                keyboardType="numeric"
                placeholder="Type Emp ID"
                placeholderTextColor={COLORS.inkMuted}
                autoFocus
                style={[asText(FONTS.microBold), { flex: 1, color: COLORS.inkPrimary, paddingVertical: 10 }]}
              />
              {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
            </View>

            {!!error && (
              <Text style={[asText(FONTS.micro), { color: COLORS.error, marginTop: 8, textAlign: 'center' }]}>
                {error}
              </Text>
            )}

            <FlatList
              data={results}
              keyExtractor={(item) => String(item.EMPID)}
              style={{ marginTop: SIZES.margin.md, maxHeight: 320 }}
              contentContainerStyle={{ paddingHorizontal: SIZES.layout.gutter, paddingBottom: SIZES.padding.xl }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                !loading && query.trim() ? (
                  <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, textAlign: 'center', marginTop: 16 }]}>
                    No employees found
                  </Text>
                ) : null
              }
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => pick(item)}
                  style={({ pressed }) => [
                    s.row,
                    {
                      paddingVertical: SIZES.padding.lg,
                      borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: COLORS.hairline,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[asText(FONTS.microBold), { color: COLORS.inkPrimary }]}>{item.EMPNAME}</Text>
                    <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, fontSize: 10, marginTop: 2 }]}>
                      Emp ID {item.EMPID}{item.ACTIVE !== 'Y' ? ' · Inactive' : ''}
                    </Text>
                  </View>
                  <Ionicons
                    name={String(item.EMPID) === empId ? 'checkmark-circle' : 'chevron-forward'}
                    size={SIZES.icon.md}
                    color={String(item.EMPID) === empId ? COLORS.primary : COLORS.inkMuted}
                  />
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  sheet: { width: '100%', maxHeight: '80%', overflow: 'hidden' },
  head: { paddingBottom: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
