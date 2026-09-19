// src/components/ui/appcomponents/DateField.tsx
//
// FormField button that opens the native date picker. Android shows its
// own dialog (fires once, no host chrome needed); iOS has no dialog of
// its own, so the spinner is hosted inside a bottom sheet with a Done
// button to commit the pick.

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../theme';
import { FormField, PremiumButton, asText } from '../premium';

type Props = {
  label: string;
  value: string;              // yyyy-MM-dd, '' when unset
  onChange: (value: string) => void;
  indicator?: 'required' | 'optional';
  icon?: string;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
};

const toISODate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const prettyDisplay = (v: string) => {
  if (!v) return '';
  const d = new Date(`${v}T00:00:00`);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function DateField({
  label,
  value,
  onChange,
  indicator,
  icon = 'calendar-outline',
  error,
  maximumDate,
  minimumDate,
  placeholder = 'Select date',
}: Props) {
  const { COLORS, FONTS, SIZES } = useTheme();
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState<Date>(value ? new Date(`${value}T00:00:00`) : new Date());

  const open = () => {
    setDraft(value ? new Date(`${value}T00:00:00`) : new Date());
    setShow(true);
  };

  if (Platform.OS === 'android') {
    return (
      <>
        <FormField
          asButton
          onPress={open}
          label={label}
          indicator={indicator}
          icon={icon}
          value={prettyDisplay(value)}
          placeholder={placeholder}
          error={error}
        />
        {show && (
          <DateTimePicker
            value={draft}
            mode="date"
            display="default"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={(event, selected) => {
              setShow(false);
              if (event.type === 'set' && selected) onChange(toISODate(selected));
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <FormField
        asButton
        onPress={open}
        label={label}
        indicator={indicator}
        icon={icon}
        value={prettyDisplay(value)}
        placeholder={placeholder}
        error={error}
      />
      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <Pressable style={[s.overlay, { backgroundColor: COLORS.blackOpacity60 }]} onPress={() => setShow(false)}>
          <Pressable style={[s.sheet, { backgroundColor: COLORS.canvasElevated, borderRadius: SIZES.radius.sheet }]}>
            <View style={{ paddingHorizontal: SIZES.layout.gutter, paddingTop: SIZES.padding.xl }}>
              <Text style={[asText(FONTS.displaySm), { color: COLORS.inkPrimary }]}>{label}</Text>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              onChange={(_, selected) => { if (selected) setDraft(selected); }}
              style={{ alignSelf: 'center' }}
            />
            <View style={{ paddingHorizontal: SIZES.layout.gutter, paddingBottom: SIZES.padding.xl, gap: 10 }}>
              <PremiumButton label="Done" onPress={() => { onChange(toISODate(draft)); setShow(false); }} />
              <PremiumButton label="Cancel" variant="outline" onPress={() => setShow(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  sheet:   { width: '100%', overflow: 'hidden' },
});
