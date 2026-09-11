// src/components/MySchemeHoldings.tsx
//
// Self-contained "my holdings" block. Both HomeScreen (a 3-card rail
// under "Our Schemes") and SchemeScreen (the full "Holdings" tab) used
// to call useMySchemes() themselves and re-derive the same title /
// eyebrow / stats / status / progress mapping onto SchemeCardV2 with
// small, easy-to-drift differences between the two copies.
//
// This component owns that end-to-end: it fetches from
// /account/phone_details (via useMySchemes), derives every SchemeCardV2
// field with schemeMetrics, and navigates to ViewInstallment /
// PayInstallment itself. A screen just renders <MySchemeHoldings />
// with a layout variant — no data plumbing required.

import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useMySchemes } from '../api/hooks/Account/useMySchemes';
import { PPData } from '../types/Account/PhoneDetails';
import { schemeMetrics, num } from '../utils/schemeMetrics';
import { classifySchemeKind } from '../utils/schemeKind';

import {
  SchemeCardV2,
  SkeletonSchemeCard,
  EmptyState,
  money,
  grams,
  shortDate,
  prettyDate,
} from './ui/premium';

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export type MySchemeHoldingsHandle = { refetch: () => void };

type Props = {
  /** 'rail' = horizontal snapping strip (Home); 'list' = stacked full-width cards (Scheme). */
  variant?: 'rail' | 'list';
  /** Cap the number of holdings rendered (e.g. Home shows a top-3 preview). */
  limit?: number;
  /** Hide fully-closed schemes — Home's preview does this, Scheme's Holdings tab shows everything. */
  excludeCompleted?: boolean;
  /** Required for a sensible snap width when variant="rail". */
  cardWidth?: number;
  emptyTitle?: string;
  emptyBody?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  skeletonCount?: number;
};

function MySchemeHoldings(
  {
    variant = 'list',
    limit,
    excludeCompleted = false,
    cardWidth,
    emptyTitle = 'No enrolments yet',
    emptyBody = 'Join a savings scheme to start building your gold position.',
    emptyActionLabel,
    onEmptyAction,
    skeletonCount,
  }: Props,
  ref: React.Ref<MySchemeHoldingsHandle>,
) {
  const { SIZES } = useTheme();
  const navigation = useNavigation<Nav>();
  const { mySchemes, loading, refetch } = useMySchemes();

  // Keep holdings fresh whenever this screen regains focus — e.g. after
  // paying an instalment and navigating back.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useImperativeHandle(ref, () => ({ refetch }), [refetch]);

  const holdings = (excludeCompleted
    ? mySchemes.filter((m) => schemeMetrics(m).state !== 'completed')
    : mySchemes
  ).slice(0, limit ?? undefined);

  const renderCard = useCallback(
    (item: PPData) => {
      const mx = schemeMetrics(item);
      const isFullyPaid = mx.total > 0 && mx.paid >= mx.total;
      const isMultiPay = classifySchemeKind(
        item.schemeSummary?.fixedIns,
        item.schemeSummary?.instalment,
        item.schemeSummary?.weightLedger,
      ) === 'flexible';

      return (
        <SchemeCardV2
          key={`${item.groupCode}-${item.regNo}`}
          width={cardWidth}
          variant="holding"
          title={item.schemeSummary?.schemeName ?? item.pName}
          eyebrow={`REG ${item.regNo} · ${item.groupCode ?? ''}`.trim()}
          metal="G"
          metalLabel="GOLD"
          status={{
            label: mx.state.charAt(0).toUpperCase() + mx.state.slice(1),
            tone:
              mx.state === 'active'
                ? 'success'
                : mx.state === 'completed'
                ? 'info'
                : 'warning',
          }}
          stats={[
            { label: 'Paid', value: money(mx.invested) },
            item.schemeSummary?.weightLedger === 'Y'
              ? { label: 'Weight', value: grams(mx.weight, 3) }
              : { label: 'Remaining', value: String( money(mx.remaining)) },
            isMultiPay
              ? { label: 'bonusAmount', value: String(item.bonusAmount ?? 0) }
              : {
                  label: 'Maturity',
                  value: item.maturityDate ? fmtDate(item.maturityDate) : '—',
                },
          ]}
          paid={mx.paid}
          total={isMultiPay ? 0 : mx.total}
          flexibleNote={isMultiPay ? 'Flexible · buy anytime' : undefined}
          progressNote={
            isMultiPay
              ? item.lastPaidDate
                ? `Last bought ${fmtDate(item.lastPaidDate)}`
                : undefined
              : isFullyPaid
              ? 'All instalments paid'
              : item.nextDueDate
              ? `Due ${fmtDate(item.nextDueDate)}`
              : item.maturityDate
              ? `Matures ${fmtDate(item.maturityDate)}`
              : undefined
          }
          actionLabel="View instalments"
          onAction={() => navigation.navigate('ViewInstallment', { ppData: item })}
          secondActionLabel={isMultiPay ? 'Buy more gold' : isFullyPaid ? undefined : 'Pay instalment'}
          onSecondAction={
            isMultiPay || !isFullyPaid
              ? () => navigation.navigate('PayInstallment', { ppData: item })
              : undefined
          }
        />
      );
    },
    [cardWidth, navigation],
  );

  const G = SIZES.layout.gutter;

  if (loading) {
    const count = skeletonCount ?? (variant === 'rail' ? 2 : 3);
    if (variant === 'rail') {
      return (
        <FlatList
          horizontal
          data={Array.from({ length: count })}
          keyExtractor={(_, i) => String(i)}
          renderItem={() => <SkeletonSchemeCard width={cardWidth} />}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          style={{ marginHorizontal: -G }}
          contentContainerStyle={{ paddingHorizontal: G }}
        />
      );
    }
    return (
      <View style={{ gap: 12 }}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonSchemeCard key={i} />
        ))}
      </View>
    );
  }

  if (holdings.length === 0) {
    return (
      <EmptyState
        compact={variant === 'rail'}
        icon="albums-outline"
        title={emptyTitle}
        body={emptyBody}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  if (variant === 'rail') {
    return (
      <FlatList
        horizontal
        data={holdings}
        keyExtractor={(m) => `${m.groupCode}-${m.regNo}`}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth ? cardWidth + 12 : undefined}
        decelerationRate="fast"
        disableIntervalMomentum
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        style={{ marginHorizontal: -G }}
        contentContainerStyle={{ paddingHorizontal: G }}
        renderItem={({ item }) => renderCard(item)}
      />
    );
  }

  return <View style={{ gap: 12 }}>{holdings.map(renderCard)}</View>;
}

export default forwardRef(MySchemeHoldings);
