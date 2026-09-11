import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import {
  asText,
  money,
  SummaryCard,
  PremiumButton,
  type SummaryRow,
} from '../../components/ui/premium';

type RouteProps = RouteProp<RootStackParamList, 'PaymentResult'>;
type NavProps   = NativeStackNavigationProp<RootStackParamList, 'PaymentResult'>;

export default function PaymentResultScreen() {
  const { COLORS, FONTS, SIZES } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route      = useRoute<RouteProps>();
  const { result, context } = route.params;

  const raw       = (result.orderStatus ?? result.status ?? '').toUpperCase();
  const isSuccess = raw === 'SUCCESSFUL' || raw === 'SUCCESS' || raw === 'CAPTURED';

  const rows: SummaryRow[] = [
    { label: 'Order ID',       value: result.orderId ?? '—' },
    { label: 'Tracking ID',    value: result.trackingId ?? '—' },
    { label: 'Bank ref no.',   value: result.bankRefNo ?? '—' },
    { label: 'Status',         value: result.orderStatus ?? result.status ?? '—', highlight: true },
    { label: 'Amount',         value: result.amount != null ? money(result.amount) : '—' },
    { label: 'Currency',       value: result.currency ?? '—' },
    { label: 'Payment mode',   value: result.paymentMode ?? '—' },
    ...(result.transactionDate && result.transactionDate !== 'null'
      ? [{ label: 'Transaction date', value: result.transactionDate }]
      : []),
    ...(result.statusMessage
      ? [{ label: 'Status message', value: result.statusMessage }]
      : []),
    ...(result.failureMessage
      ? [{ label: 'Failure reason', value: result.failureMessage }]
      : []),
    { label: 'Source', value: result.source ?? '—' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: SIZES.layout.gutter, paddingBottom: 48 }}
    >
      {/* Icon + heading */}
      <View style={s.center}>
        <View
          style={[
            s.iconWrap,
            {
              backgroundColor: isSuccess
                ? (COLORS.successBg ?? '#E6F9F0')
                : COLORS.errorBg,
              borderRadius: SIZES.radius.tile,
            },
          ]}
        >
          <Ionicons
            name={isSuccess ? 'checkmark-circle' : 'close-circle'}
            size={56}
            color={isSuccess ? (COLORS.success ?? '#1A9E5C') : COLORS.error}
          />
        </View>

        <Text
          style={[
            asText(FONTS.displaySm),
            { color: COLORS.inkPrimary, marginTop: SIZES.margin.xl, textAlign: 'center' },
          ]}
        >
          {isSuccess ? 'Payment successful 🎉' : 'Payment unsuccessful'}
        </Text>

        <Text
          style={[
            asText(FONTS.micro),
            {
              color: COLORS.inkTertiary,
              marginTop: 6,
              textAlign: 'center',
              lineHeight: 19,
            },
          ]}
        >
          {isSuccess
            ? `Your payment of ${result.amount != null ? money(result.amount) : '—'} was received successfully.`
            : (result.failureMessage ?? result.statusMessage ?? 'Your payment could not be processed. No amount has been debited.')}
        </Text>
      </View>

      {/* Full response details */}
      <View style={{ marginTop: SIZES.layout.section }}>
        <Text
          style={[
            asText(FONTS.eyebrow),
            { color: COLORS.inkTertiary, marginBottom: SIZES.margin.lg },
          ]}
        >
          Transaction details
        </Text>
        <SummaryCard rows={rows} />
      </View>

      {/* Actions */}
      <View style={{ marginTop: SIZES.layout.section, gap: 12 }}>
        {isSuccess ? (
          <PremiumButton
            label="Go to home"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
          />
        ) : (
          <>
            <PremiumButton
              label="Try again"
              onPress={() => navigation.goBack()}
            />
            <PremiumButton
              label="Go to home"
              variant="outline"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center:   { alignItems: 'center', paddingTop: 32 },
  iconWrap: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
});
