// src/components/ui/appcomponents/SelectField.tsx
//
// FormField button that opens a bottom-sheet list to pick one value from
// a fixed set of options (title, ID proof type, nominee relationship…).
// Same sheet shell as EmpIdField, minus the async search.

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { FormField, asText } from '../premium';

type Props = {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  indicator?: 'required' | 'optional';
  icon?: string;
  error?: string;
  sheetTitle?: string;
};

export default function SelectField({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select',
  indicator,
  icon,
  error,
  sheetTitle,
}: Props) {
  const { COLORS, FONTS, SIZES } = useTheme();
  const [visible, setVisible] = useState(false);

  const pick = (v: string) => {
    onSelect(v);
    setVisible(false);
  };

  return (
    <>
      <FormField
        asButton
        onPress={() => setVisible(true)}
        label={label}
        indicator={indicator}
        icon={icon}
        rightIcon="chevron-down"
        onRightIconPress={() => setVisible(true)}
        value={value}
        placeholder={placeholder}
        error={error}
      />

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={[s.overlay, { backgroundColor: COLORS.blackOpacity60 }]} onPress={() => setVisible(false)}>
          <Pressable style={[s.sheet, { backgroundColor: COLORS.canvasElevated, borderRadius: SIZES.radius.sheet }]}>
            <View style={[s.head, { paddingHorizontal: SIZES.layout.gutter, paddingTop: SIZES.padding.xl }]}>
              <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary }]}>
                {sheetTitle ?? label}
              </Text>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ marginTop: SIZES.margin.md, maxHeight: 360 }}
              contentContainerStyle={{ paddingHorizontal: SIZES.layout.gutter, paddingBottom: SIZES.padding.xl }}
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
                  <Text style={[asText(FONTS.microBold), { flex: 1, color: item === value ? COLORS.primary : COLORS.inkPrimary }]}>
                    {item}
                  </Text>
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
  sheet: { width: '100%', maxHeight: '70%', overflow: 'hidden' },
  head: { paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
