// src/components/ui/premium/PillField.tsx
//
// Plain filled pill text field -- placeholder-only, no floating label
// above the value. This is the "Instagram login" field style: a solid
// rounded rectangle carrying just the placeholder, used across the
// auth flow (Login, Register, Forgot Password) wherever that reference
// look was requested.
//
// Deliberately separate from FormField, which is the labeled/underline
// style still used elsewhere in the app (e.g. profile, KYC forms).
// Screens choose whichever field matches their surface -- this one
// does not replace FormField, it sits alongside it.

import React, { forwardRef, memo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardTypeOptions,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { asText } from './tokens';

type Props = {
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  error?: string;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoFocus?: boolean;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  autoComplete?:
    | 'tel'
    | 'password'
    | 'username'
    | 'current-password'
    | 'new-password'
    | 'name'
    | 'email'
    | 'off';
  textContentType?:
    | 'telephoneNumber'
    | 'password'
    | 'username'
    | 'newPassword'
    | 'name'
    | 'emailAddress'
    | 'oneTimeCode'
    | 'none';
  /** Toggles a show/hide eye adornment for password fields */
  isPassword?: boolean;
  secureTextEntry?: boolean;
  style?: ViewStyle;
};

const PillField = forwardRef<TextInput, Props>(function PillField(
  {
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    maxLength,
    error,
    editable = true,
    autoCapitalize = 'sentences',
    autoFocus = false,
    returnKeyType,
    onSubmitEditing,
    autoComplete,
    textContentType,
    isPassword = false,
    secureTextEntry,
    style,
  },
  ref,
) {
  const { COLORS, FONTS, SIZES, moderateScale } = useTheme();
  const [reveal, setReveal] = useState(false);
  const isSecure = isPassword ? !reveal : secureTextEntry;

  return (
    <View>
      <View
        style={[
          s.field,
          {
            backgroundColor: COLORS.inputBackground,
            borderColor: error ? COLORS.error : COLORS.inputBorder,
            height: moderateScale(54),
            borderRadius: SIZES.radius.pill,
            paddingHorizontal: SIZES.padding.xl,
          },
          style,
        ]}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.inputPlaceholder}
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={editable}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoComplete={autoComplete}
          textContentType={textContentType}
          secureTextEntry={isSecure}
          selectionColor={COLORS.primary}
          style={[
            asText(FONTS.bodyMedium),
            {
              flex: 1,
              color: editable ? COLORS.inkPrimary : COLORS.inkTertiary,
              fontSize: SIZES.font.lg,
              padding: 0,
            },
          ]}
        />
        {isPassword && (
          <Pressable onPress={() => setReveal((p) => !p)} hitSlop={10}>
            <Ionicons
              name={reveal ? 'eye-off-outline' : 'eye-outline'}
              size={SIZES.icon.md}
              color={COLORS.inkTertiary}
            />
          </Pressable>
        )}
      </View>

      {!!error && (
        <Text style={[asText(FONTS.micro), s.errorText, { color: COLORS.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
});

const s = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  errorText: {
    marginTop: 6,
    marginLeft: 18,
  },
});

export default memo(PillField);
