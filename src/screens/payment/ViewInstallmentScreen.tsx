// src/screens/payment/ViewInstallmentScreen.tsx

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../theme';
import {
  ScreenCanvas,
  PageHeader,
  SectionHeading,
  SummaryCard,
  ProgressWidget,
  TimelineCard,
  money,
  prettyDate,
  type SummaryRow,
  type TimelineEntry,
} from '../../components/ui/premium';

type RouteProps = RouteProp<RootStackParamList, 'ViewInstallment'>;
type NavProps = NativeStackNavigationProp<RootStackParamList, 'ViewInstallment'>;

export default function ViewInstallmentScreen() {
  const { SIZES } = useTheme();
  const navigation = useNavigation<NavProps>();
  const { ppData } = useRoute<RouteProps>().params;

  const scheme = ppData.schemeSummary;
  const bal = scheme?.schemaSummaryTransBalance;
  const paid = parseInt(bal?.insPaid ?? '0', 10);
  const total = parseInt(scheme?.instalment ?? '0', 10);

  const schemeRows: SummaryRow[] = useMemo(() => [
    { label: 'Registration No.', value: `${ppData.regNo}` },
    { label: 'Group Code', value: ppData.groupCode },
    { label: 'Member', value: ppData.pName },
    { label: 'Scheme', value: scheme?.schemeName ?? '—' },
    { label: 'Join Date', value: prettyDate(ppData.joinDate) },
    { label: 'Maturity Date', value: prettyDate(ppData.maturityDate) },
    { label: 'Instalments Paid', value: `${paid} of ${total}` },
    { label: 'Amount Received', value: money(parseFloat(bal?.amtrecd ?? '0')) },
    { label: 'Bonus Amount', value: money(parseFloat(bal?.bonusAmount ?? '0')) },
    { label: 'Total with Bonus', value: money(parseFloat(bal?.totalAmount ?? '0')), highlight: true },
    { label: 'Total Weight', value: `${scheme?.totalWeight ?? '0'} g` },
    { label: 'Last Weight', value: `${scheme?.lastWeight ?? '0'} g` },
  ], [ppData, scheme, bal, paid, total]);

  const personalRows: SummaryRow[] = useMemo(() => {
    const pi = ppData.personalInfo;
    return [
      { label: 'ID', value: pi?.personalId ?? '—' },
      { label: 'Mobile', value: pi?.mobile ?? '—' },
      { label: 'Address', value: [pi?.doorNo, pi?.address2, pi?.city, pi?.state, pi?.pinCode].filter(Boolean).join(', ') },
    ];
  }, [ppData.personalInfo]);

  const timelineEntries: TimelineEntry[] = useMemo(() =>
    (ppData.paymentHistoryList ?? []).map((p) => ({
      id: p.receiptNo,
      title: `Instalment #${p.installment}`,
      meta: `Receipt ${p.receiptNo} · ${p.chqBank ?? '—'}`,
      value: money(parseFloat(p.amount ?? '0')),
      subValue: `${p.weight} g`,
      timestamp: prettyDate(p.updateTime),
      tone: 'success' as const,
      icon: 'checkmark-circle-outline',
    })),
  [ppData.paymentHistoryList]);

  return (
    <ScreenCanvas
      overlap={SIZES.margin.xxl}
      header={
        <PageHeader
          eyebrow={scheme?.schemeSName ?? ppData.groupCode}
          title="View Instalments"
          caption={`REG ${ppData.regNo}`}
          bleedBottom={SIZES.margin.xxl}
          actions={[{ icon: 'arrow-back', onPress: () => navigation.goBack() }]}
        >
          {total > 0 && (
            <ProgressWidget
              surface="hero"
              paid={paid}
              total={total}
              label="Scheme progress"
              note={ppData.lastPaidDate ? `Last paid ${prettyDate(ppData.lastPaidDate)}` : undefined}
              style={{ marginTop: SIZES.margin.xxl }}
            />
          )}
        </PageHeader>
      }
    >
      {/* Scheme Summary */}
      <View style={{ marginTop: SIZES.layout.sectionTight }}>
        <SectionHeading eyebrow="Enrolment" title="Scheme Details" />
        <SummaryCard rows={schemeRows} style={{ marginTop: SIZES.margin.lg }} />
      </View>

      {/* Personal Info */}
      <View style={{ marginTop: SIZES.layout.section }}>
        <SectionHeading eyebrow="Member" title="Personal Info" />
        <SummaryCard rows={personalRows} style={{ marginTop: SIZES.margin.lg }} />
      </View>

      {/* Payment History */}
      <View style={{ marginTop: SIZES.layout.section }}>
        <SectionHeading
          eyebrow="History"
          title="Payment History"
          count={timelineEntries.length}
        />
        <View style={{ marginTop: SIZES.margin.lg }}>
          <TimelineCard entries={timelineEntries} />
        </View>
      </View>
    </ScreenCanvas>
  );
}
