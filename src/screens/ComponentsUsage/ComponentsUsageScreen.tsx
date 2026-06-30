// src/screens/home/HomeScreen.tsx

import React, { useRef, useState, useEffect } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useTheme } from '../../theme';

// ── App Components ───────────────────────────────────────────────
import AppButton from '../../components/ui/appcomponents/AppButton';
import AppInput from '../../components/ui/appcomponents/AppInput';
import AppCard from '../../components/ui/appcomponents/AppCard';
import AppText from '../../components/ui/appcomponents/AppText';
import AppBadge from '../../components/ui/appcomponents/AppBadge';
import AppChip from '../../components/ui/appcomponents/AppChip';
import AppAvatar from '../../components/ui/appcomponents/AppAvatar';
import AppDivider from '../../components/ui/appcomponents/AppDivider';
import AppLoader from '../../components/ui/appcomponents/AppLoader';
import AppModal from '../../components/ui/appcomponents/AppModal';
import AppIcon from '../../components/ui/appcomponents/AppIcons';
import AppHeader from '../../components/ui/appcomponents/AppHeader';
import AppGoldPriceCard from '../../components/ui/appcomponents/AppGoldPriceCard';
import AppBottomSheet, { AppBottomSheetRef } from '../../components/ui/appcomponents/AppBottomSheet';
import AppOTPInput, { AppOTPInputRef } from '../../components/ui/appcomponents/AppOTPInput';
import AppPinInput, { AppPinInputRef } from '../../components/ui/appcomponents/AppPinInput';
import AppSearchBar from '../../components/ui/appcomponents/AppSearchBar';
import AppEmptyState from '../../components/ui/appcomponents/AppEmptyState';
import AppSchemeCard, { SchemeData } from '../../components/ui/AppSchemeCard';
import AppSkeletonLoader, { SkeletonBox, SkeletonCircle, SkeletonText } from '../../components/ui/appcomponents/AppSkeletonLoader';
import AppRadio, { AppRadioItem } from '../../components/ui/appcomponents/AppRadio';
import AppCheckbox from '../../components/ui/appcomponents/AppCheckbox';
import AppSwitch from '../../components/ui/appcomponents/AppSwitch';
import ScreenWrapper from '../../components/ui/appcomponents/ScreenWrapper';
import KeyboardWrapper from '../../components/ui/appcomponents/KeyboardWrapper';
import { AppProgressBar, AppProgressSteps } from '../../components/ui/appcomponents/AppProgressBar';
import AppExportSheet, { ExportData, ExportBranding } from '../../components/ui/appcomponents/Appexportsheet';
import AppLanguagePicker, { LanguageCode } from '../../components/ui/appcomponents/AppLanguage';
import { Asset } from 'expo-asset';
import * as LegacyFS from 'expo-file-system/legacy';
import { useSendNotification, useNotificationTemplates } from '../../api/hooks/Notifications/useNotifications';

// ── Other Components ─────────────────────────────────────────────
import Sidebar from '../../components/Sidebar';
import CustomAlert, { AlertType, CustomAlertProps } from '../../components/ui/CustomAlert';
import { useToast } from '../../components/ui/Toast';
import { useLanguage } from '../../providers/LanguageProvider';

export default function ComponentsUsage() {
  const { COLORS, FONTS, SIZES, SHADOWS } = useTheme();

  // ── State ────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [passVal, setPassVal] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>(['Gold SIP']);
  const [centerModal, setCenterModal] = useState(false);
  const [bottomModal, setBottomModal] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [alert, setAlert] = useState<CustomAlertProps>({ visible: false, title: '' });

  // ── New component states ─────────────────────────────────────
  const sheetRef = useRef<AppBottomSheetRef>(null);
  const otpRef   = useRef<AppOTPInputRef>(null);
  const pinRef   = useRef<AppPinInputRef>(null);
  const [otpError, setOtpError]     = useState(false);
  const [otpErrMsg, setOtpErrMsg]   = useState('');
  const [pinError, setPinError]     = useState(false);
  const [pinErrMsg, setPinErrMsg]   = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [kycStep, setKycStep] = useState(1);
  const [skeletonType, setSkeletonType] = useState<'list' | 'card' | 'profile' | 'transaction' | 'portfolio' | 'banner' | 'grid' | 'detail' | 'chart' | 'notification' | 'text'>('card');

  // ── AppRadio states ──────────────────────────────────────────
  const [radioVal, setRadioVal]         = useState('sip');
  const [radioGold, setRadioGold]       = useState('24k');
  const [radioSize, setRadioSize]       = useState('md');

  // ── AppCheckbox states ───────────────────────────────────────
  const [cbTerms, setCbTerms]           = useState(false);
  const [cbSIP, setCbSIP]               = useState(true);
  const [cbNotify, setCbNotify]         = useState(false);
  const [cbInter, setCbInter]           = useState(false);

  // ── AppSwitch states ─────────────────────────────────────────
  const [swNotify, setSwNotify]         = useState(true);
  const [swBiometric, setSwBiometric]   = useState(false);
  const [swAutoSIP, setSwAutoSIP]       = useState(true);
  const [swDarkMode, setSwDarkMode]     = useState(false);

  // ── Send Notification states ──────────────────────────────────
  const [notifUserId, setNotifUserId]           = useState('');
  const [notifTitle, setNotifTitle]             = useState('');
  const [notifMessage, setNotifMessage]         = useState('');
  const [notifSchedule, setNotifSchedule]       = useState('');
  const [notifTemplateId, setNotifTemplateId]   = useState('');
  const [notifSchemeId, setNotifSchemeId]       = useState('');
  const [notifSendType, setNotifSendType]       = useState<'user' | 'all'>('user');
  const [notifMode, setNotifMode]               = useState<'inline' | 'template'>('inline');
  const { sending, sendToUser, sendToAll } = useSendNotification();
  const { templates } = useNotificationTemplates();

  // ── AppLanguagePicker states ──────────────────────────────────
  const [langSheet, setLangSheet]   = useState(false);
  const [langCode, setLangCode]     = useState<LanguageCode>('en');
  const [langInline, setLangInline] = useState<LanguageCode>('hi');
  const [langChips, setLangChips]   = useState<LanguageCode>('ta');

  // ── AppExportSheet states ────────────────────────────────────
  const [exportVisible, setExportVisible]   = useState(false);
  const [exportData, setExportData]         = useState<ExportData | null>(null);
  const [exportFilename, setExportFilename] = useState('export');
  const [logob64, setLogob64]               = useState('');
  const [iconb64, setIconb64]               = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [logoAsset, iconAsset] = await Asset.loadAsync([
          require('../../../assets/logo.png'),
          require('../../../assets/icon.png'),
        ]);
        const [lb, ib] = await Promise.all([
          LegacyFS.readAsStringAsync(logoAsset.localUri!, { encoding: LegacyFS.EncodingType.Base64 }),
          LegacyFS.readAsStringAsync(iconAsset.localUri!, { encoding: LegacyFS.EncodingType.Base64 }),
        ]);
        setLogob64(lb);
        setIconb64(ib);
      } catch {}
    })();
  }, []);

  const baseBranding: ExportBranding = {
    logoBase64:     logob64,
    logoMimeType:   'image/png',
    logoWidth:      110,
    logoHeight:     36,
    primaryColor:   '#FF971D',
    secondaryColor: '#C9B15D',
    companyName:    'Rangas DigiGold',
    headerBgColor:  '#FF971D',
    footerText:     'Rangas Jewels · Trusted since 1985',
  };

  const EXPORT_PRESETS: { label: string; filename: string; data: ExportData }[] = [
    {
      label: 'Transaction Report',
      filename: 'transactions_may2026',
      data: {
        title: 'Transaction Report',
        subtitle: 'DigiGold Portfolio — May 2026',
        columns: [
          { key: 'date',   label: 'Date',   width: 20 },
          { key: 'type',   label: 'Type',   width: 12 },
          { key: 'grams',  label: 'Grams',  width: 12, align: 'right' },
          { key: 'amount', label: 'Amount', width: 16, align: 'right' },
          { key: 'status', label: 'Status', width: 14 },
        ],
        rows: [
          { date: '01 May 2026', type: 'Buy',  grams: '0.5g', amount: '₹3,800', status: 'Success' },
          { date: '05 May 2026', type: 'Sell', grams: '1.0g', amount: '₹7,750', status: 'Success' },
          { date: '10 May 2026', type: 'Buy',  grams: '0.2g', amount: '₹1,520', status: 'Success' },
          { date: '18 May 2026', type: 'Buy',  grams: '1.0g', amount: '₹7,600', status: 'Pending' },
          { date: '25 May 2026', type: 'Sell', grams: '0.5g', amount: '₹3,875', status: 'Failed'  },
        ],
        summary: [
          { label: 'Total Invested', value: '₹12,920' },
          { label: 'Total Sold',     value: '₹11,625' },
          { label: 'Net Gold',       value: '0.2g'    },
        ],
        generatedBy: 'DigiGold App',
        note: 'All transactions are in INR. Gold purity: 24K.',
        branding: { ...baseBranding, watermarkText: 'CONFIDENTIAL', watermarkOpacity: 0.06 },
      },
    },
    {
      label: 'Portfolio Summary',
      filename: 'portfolio_summary',
      data: {
        title: 'Portfolio Summary',
        subtitle: 'As of June 2026',
        columns: [
          { key: 'scheme',   label: 'Scheme',   width: 24 },
          { key: 'purity',   label: 'Purity',   width: 10 },
          { key: 'invested', label: 'Invested', width: 16, align: 'right' },
          { key: 'current',  label: 'Current',  width: 16, align: 'right' },
          { key: 'returns',  label: 'Returns',  width: 12, align: 'right' },
        ],
        rows: [
          { scheme: 'DigiGold SIP',      purity: '24K', invested: '₹6,000',  current: '₹6,744',  returns: '+12.4%' },
          { scheme: 'Gold Chit Fund',    purity: '22K', invested: '₹3,000',  current: '₹3,324',  returns: '+10.8%' },
          { scheme: 'Jewellery Savings', purity: '18K', invested: '₹2,500',  current: '₹2,738',  returns: '+9.5%'  },
          { scheme: 'Gold Bonds',        purity: '24K', invested: '₹10,000', current: '₹10,800', returns: '+8.0%'  },
        ],
        summary: [
          { label: 'Total Invested', value: '₹21,500' },
          { label: 'Current Value',  value: '₹23,606' },
          { label: 'Total Returns',  value: '+9.8%'   },
        ],
        generatedBy: 'DigiGold App',
        branding: {
          ...baseBranding,
          logoBase64:     iconb64,
          primaryColor:   '#C9B15D',
          secondaryColor: '#FF971D',
          headerBgColor:  '#C9B15D',
          watermarkText:  'PORTFOLIO',
          watermarkOpacity: 0.05,
        },
      },
    },
    {
      label: 'Scheme Payments',
      filename: 'scheme_payments',
      data: {
        title: 'Scheme Payment History',
        subtitle: 'Gold Chit Fund — 12 Month Plan',
        columns: [
          { key: 'month',  label: 'Month',   width: 16 },
          { key: 'amount', label: 'Amount',  width: 14, align: 'right' },
          { key: 'date',   label: 'Paid On', width: 18 },
          { key: 'status', label: 'Status',  width: 14 },
        ],
        rows: [
          { month: 'January',  amount: '₹500', date: '05 Jan 2026', status: 'Paid' },
          { month: 'February', amount: '₹500', date: '05 Feb 2026', status: 'Paid' },
          { month: 'March',    amount: '₹500', date: '05 Mar 2026', status: 'Paid' },
          { month: 'April',    amount: '₹500', date: '05 Apr 2026', status: 'Paid' },
          { month: 'May',      amount: '₹500', date: '05 May 2026', status: 'Paid' },
          { month: 'June',     amount: '₹500', date: '15 Jun 2026', status: 'Due'  },
        ],
        summary: [
          { label: 'Paid',      value: '₹2,500' },
          { label: 'Remaining', value: '₹3,500' },
          { label: 'Progress',  value: '5 / 12' },
        ],
        generatedBy: 'DigiGold App',
        note: 'Next due: 15 Jun 2026',
        branding: { ...baseBranding, watermarkText: 'SCHEME', watermarkOpacity: 0.05 },
      },
    },
  ];

  // ── KeyboardWrapper form state ───────────────────────────────
  const [kwName, setKwName]             = useState('');
  const [kwEmail, setKwEmail]           = useState('');
  const [kwRefreshing, setKwRefreshing] = useState(false);

  // ── AppSchemeCard data ────────────────────────────────────────
  const SCHEMES: SchemeData[] = [
    {
      id: '1',
      name: 'DigiGold SIP',
      description: 'Invest as low as ₹100/month in 24K digital gold. Auto-debit enabled.',
      category: 'Investment',
      status: 'trending',
      purity: '24K',
      returns: '12.4%',
      minAmount: 100,
      duration: '11 months',
      rating: 4.7,
      reviewCount: 2340,
      tags: ['Tax Saving', 'Auto-debit', 'Flexible'],
      progress: 68,
      isFeatured: true,
    },
    {
      id: '2',
      name: 'Gold Chit Fund',
      description: 'Traditional chit fund backed by 22K gold. Monthly instalment plan.',
      category: 'Chit',
      status: 'active',
      purity: '22K',
      returns: '10.8%',
      minAmount: 500,
      duration: '12 months',
      rating: 4.3,
      reviewCount: 980,
      tags: ['Chit', 'Monthly'],
      monthlyAmount: 500,
      nextDueDate: '15 Jun 2026',
      accumulatedAmount: 3000,
    },
    {
      id: '3',
      name: 'Jewellery Savings',
      description: 'Save monthly and redeem as jewellery. 18K gold scheme.',
      category: 'Jewellery',
      status: 'new',
      purity: '18K',
      returns: '9.5%',
      minAmount: 250,
      tags: ['Jewellery', 'Redeem'],
    },
    {
      id: '4',
      name: 'Gold Bonds',
      description: 'Government-backed sovereign gold bonds with fixed interest.',
      category: 'Bonds',
      status: 'closing',
      purity: '24K',
      returns: '8.0%',
      minAmount: 1000,
      rating: 4.9,
      reviewCount: 5120,
    },
    {
      id: '5',
      name: 'Legacy Gold Plan',
      description: 'This scheme has ended. Redeem your accumulated gold now.',
      category: 'Savings',
      status: 'expired',
      purity: '22K',
      returns: '11.2%',
      minAmount: 200,
    },
  ];
  const toast = useToast();
  const { t } = useLanguage();

  const showAlert = (props: Partial<CustomAlertProps>) =>
    setAlert({ ...props, visible: true, title: props.title ?? '' });
  const hideAlert = () => setAlert(prev => ({ ...prev, visible: false }));

  const chips = ['Gold SIP', 'Buy Gold', 'Sell Gold', 'History', 'Offers'];

  const S = {
    container: { flex: 1, backgroundColor: COLORS.background } as const,
    scroll: { padding: SIZES.padding.container, paddingBottom: 60 } as const,
    section: { marginTop: SIZES.margin.lg, marginBottom: SIZES.margin.sm } as const,
    row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, flexWrap: 'wrap' as const },
    gap: { marginBottom: SIZES.margin.sm } as const,
    spacer: { height: SIZES.margin.sm } as const,
  };

  return (
    <View style={S.container}>

      {/* ══ AppHeader ══════════════════════════════════════════ */}
      <AppHeader
        title="DigiGold"
        subtitle={t('welcome')}
        variant="primary"
        actions={[
          { iconName: 'menu-outline', onPress: () => setSidebarOpen(true) },
          { iconName: 'notifications-outline', onPress: () => { }, badge: 3 },
        ]}
      />

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>

        {/* ══ AppGoldPriceCard ═══════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>0. AppGoldPriceCard</AppText>
        <AppGoldPriceCard
          rates={{ '24K': 6325, '22K': 5798, '18K': 4744 }}
          change={{ '24K': 1.2, '22K': -0.4, '18K': 0.9 }}
          sparkline={{
            '24K': [6100, 6150, 6080, 6200, 6280, 6310, 6325],
            '22K': [5860, 5840, 5880, 5820, 5800, 5810, 5798],
            '18K': [4580, 4610, 4570, 4640, 4700, 4730, 4744],
          }}
          updatedAt="Today, 10:32 AM"
          onBuy={(k) => toast.success(`Buying ${k} Gold`, { message: `₹${k === '24K' ? '6,325' : k === '22K' ? '5,798' : '4,744'}/gram` })}
          onSell={(k) => toast.warning(`Selling ${k} Gold`, { message: 'Confirm in the next step.' })}
          onRefresh={() => toast.info('Rates refreshed', { duration: 2000 })}
        />

        {/* ══ AppText ════════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>1. AppText Variants</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="h4">Heading H4</AppText>
          <AppText variant="h5">Heading H5</AppText>
          <AppText variant="bodyLarge">Body Large text</AppText>
          <AppText variant="body">Body Regular text</AppText>
          <AppText variant="bodyMedium">Body Medium text</AppText>
          <AppText variant="bodySmall">Body Small text</AppText>
          <AppText variant="caption">Caption text</AppText>
          <AppText variant="captionBold">Caption Bold</AppText>
          <AppText variant="label">Label Text</AppText>
          <AppText variant="labelUppercase">Label Uppercase</AppText>
          <AppText variant="goldText">Gold Text ✦</AppText>
          <AppText variant="orangeText">Orange Text</AppText>
        </AppCard>

        {/* ══ AppButton ══════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>2. AppButton Variants</AppText>
        <AppCard variant="outlined" padding="md">
          <View style={S.gap}><AppButton label="Primary Button" variant="primary" onPress={() => { }} /></View>
          <View style={S.gap}><AppButton label="Secondary Button" variant="secondary" onPress={() => { }} /></View>
          <View style={S.gap}><AppButton label="Outline Button" variant="outline" onPress={() => { }} /></View>
          <View style={S.gap}><AppButton label="Ghost Button" variant="ghost" onPress={() => { }} /></View>
          <View style={S.gap}><AppButton label="Danger Button" variant="danger" onPress={() => { }} /></View>
          <View style={S.gap}><AppButton label="Gold Button" variant="gold" onPress={() => { }} /></View>
          <AppDivider label="Sizes" marginVertical={8} />
          <View style={S.gap}><AppButton label="Small Button" size="sm" onPress={() => { }} /></View>
          <View style={S.gap}><AppButton label="Medium Button" size="md" onPress={() => { }} /></View>
          <View style={S.gap}><AppButton label="Large Button" size="lg" onPress={() => { }} /></View>
          <AppDivider label="States" marginVertical={8} />
          <View style={S.gap}><AppButton label="Loading..." loading onPress={() => { }} /></View>
          <View style={S.gap}><AppButton label="Disabled" disabled onPress={() => { }} /></View>
          <AppDivider label="With Icons" marginVertical={8} />
          <View style={S.gap}><AppButton label="Buy Gold" leftIcon="add-circle-outline" onPress={() => { }} /></View>
          <View style={S.gap}><AppButton label="Continue" rightIcon="arrow-forward" onPress={() => { }} /></View>
        </AppCard>

        {/* ══ AppInput ═══════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>3. AppInput Variants</AppText>
        <AppCard variant="outlined" padding="md">
          <AppInput
            label="Full Name"
            placeholder="Enter your name"
            leftIcon="person-outline"
            value={inputVal}
            onChangeText={setInputVal}
            required
          />
          <View style={S.spacer} />
          <AppInput
            label="Password"
            placeholder="Enter password"
            leftIcon="lock-closed-outline"
            isPassword
            value={passVal}
            onChangeText={setPassVal}
          />
          <View style={S.spacer} />
          <AppInput
            label="Search"
            placeholder="Search gold plans..."
            leftIcon="search-outline"
            rightIcon="options-outline"
            value={searchVal}
            onChangeText={setSearchVal}
            hint="Try 'SIP' or 'Buy'"
          />
          <View style={S.spacer} />
          <AppInput
            label="Mobile Number"
            placeholder="Enter mobile"
            leftIcon="call-outline"
            error="Invalid mobile number"
            value=""
            onChangeText={() => { }}
          />
        </AppCard>

        {/* ══ AppCard ════════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>4. AppCard Variants</AppText>
        <AppCard variant="default" padding="md" style={S.gap}>
          <AppText variant="bodyMedium">Default Card</AppText>
          <AppText variant="caption">With shadow and white background</AppText>
        </AppCard>
        <AppCard variant="outlined" padding="md" style={S.gap}>
          <AppText variant="bodyMedium">Outlined Card</AppText>
          <AppText variant="caption">With border, no shadow</AppText>
        </AppCard>
        <AppCard variant="gold" padding="md" style={S.gap}>
          <AppText variant="bodyMedium">Gold Card ✦</AppText>
          <AppText variant="caption">Light gold background</AppText>
        </AppCard>
        <AppCard variant="flat" padding="md" style={S.gap}>
          <AppText variant="bodyMedium">Flat Card</AppText>
          <AppText variant="caption">Gray50 background, no shadow</AppText>
        </AppCard>
        <AppCard variant="default" padding="md" accentBar style={S.gap}
          onPress={() => showAlert({ type: 'info', title: 'Card Pressed!', message: 'Pressable card with accent bar.', dismissible: false, buttons: [{ label: 'OK', style: 'primary' }] })}>
          <AppText variant="bodyMedium">Pressable + Accent Bar</AppText>
          <AppText variant="caption">Tap me!</AppText>
        </AppCard>

        {/* ══ AppBadge ═══════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>5. AppBadge Variants</AppText>
        <AppCard variant="outlined" padding="md">
          <View style={S.row}>
            <AppBadge label="Primary" variant="primary" />
            <AppBadge label="Gold" variant="gold" />
            <AppBadge label="Success" variant="success" />
            <AppBadge label="Error" variant="error" />
            <AppBadge label="Warning" variant="warning" />
            <AppBadge label="Info" variant="info" />
            <AppBadge label="Neutral" variant="neutral" />
          </View>
          <AppDivider label="Sizes" marginVertical={10} />
          <View style={S.row}>
            <AppBadge label="Small" size="sm" variant="primary" />
            <AppBadge label="Medium" size="md" variant="primary" />
            <AppBadge label={99} variant="error" />
            <AppBadge label={120} variant="error" />
          </View>
          <AppDivider label="Dot mode" marginVertical={10} />
          <View style={S.row}>
            <AppBadge label="" dot variant="primary" />
            <AppBadge label="" dot variant="success" />
            <AppBadge label="" dot variant="error" />
            <AppBadge label="" dot variant="gold" />
          </View>
        </AppCard>

        {/* ══ AppChip ════════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>6. AppChip Variants</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8 }}>Selectable chips:</AppText>
          <View style={S.row}>
            {chips.map(chip => (
              <AppChip
                key={chip}
                label={chip}
                selected={selectedChips.includes(chip)}
                onPress={() => setSelectedChips(prev =>
                  prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
                )}
              />
            ))}
          </View>
          <AppDivider label="Variants" marginVertical={10} />
          <View style={S.row}>
            <AppChip label="Default" variant="default" selected />
            <AppChip label="Gold" variant="gold" selected />
            <AppChip label="Outlined" variant="outlined" selected />
            <AppChip label="Disabled" disabled />
          </View>
          <AppDivider label="With icons & remove" marginVertical={10} />
          <View style={S.row}>
            <AppChip label="Buy" leftIcon="add-circle-outline" selected />
            <AppChip label="Filter" leftIcon="filter-outline" />
            <AppChip label="Remove me" onRemove={() => { }} selected />
          </View>
        </AppCard>

        {/* ══ AppAvatar ══════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>7. AppAvatar Variants</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 10 }}>Sizes:</AppText>
          <View style={S.row}>
            <AppAvatar name="Rangas" size="xs" />
            <AppAvatar name="Raj Kumar" size="sm" />
            <AppAvatar name="Priya S" size="md" />
            <AppAvatar name="Arun M" size="lg" />
            <AppAvatar name="Kavya R" size="xl" />
          </View>
          <AppDivider label="With online dot" marginVertical={10} />
          <View style={S.row}>
            <AppAvatar name="Rangas" size="md" showOnline />
            <AppAvatar name="Raj" size="lg" showOnline />
          </View>
          <AppDivider label="With edit button" marginVertical={10} />
          <View style={S.row}>
            <AppAvatar name="Rangas" size="xl" showEdit onEditPress={() =>
              showAlert({ type: 'info', title: 'Edit Photo', message: 'Camera or gallery?', dismissible: false, buttons: [{ label: 'Cancel', style: 'ghost' }, { label: 'Choose', style: 'primary' }] })
            } />
          </View>
          <AppDivider label="Rounded variant" marginVertical={10} />
          <View style={S.row}>
            <AppAvatar name="DG" size="md" variant="rounded" />
            <AppAvatar name="Gold" size="lg" variant="rounded" />
          </View>
        </AppCard>

        {/* ══ AppDivider ═════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>8. AppDivider Variants</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption">Plain divider:</AppText>
          <AppDivider />
          <AppText variant="caption">With label:</AppText>
          <AppDivider label="OR" />
          <AppText variant="caption">Custom color & thickness:</AppText>
          <AppDivider color={COLORS.primary} thickness={2} />
          <AppText variant="caption">Gold divider:</AppText>
          <AppDivider color={COLORS.secondary} thickness={1.5} />
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 40, gap: 12, marginTop: 8 }}>
            <AppText variant="caption">Vertical:</AppText>
            <AppDivider orientation="vertical" />
            <AppText variant="caption">divider</AppText>
            <AppDivider orientation="vertical" color={COLORS.primary} thickness={2} />
            <AppText variant="caption">here</AppText>
          </View>
        </AppCard>

        {/* ══ AppIcon ════════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>9. AppIcon Variants</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 10 }}>Variants:</AppText>
          <View style={S.row}>
            <AppIcon name="home" variant="default" />
            <AppIcon name="star" variant="primary" />
            <AppIcon name="diamond" variant="gold" />
            <AppIcon name="checkmark" variant="success" />
            <AppIcon name="close" variant="error" />
            <AppIcon name="person-outline" variant="ghost" />
          </View>
          <AppDivider label="Pressable icons" marginVertical={10} />
          <View style={S.row}>
            <AppIcon name="notifications-outline" variant="primary" onPress={() =>
              showAlert({ type: 'info', title: 'Notifications', message: 'You have 3 new alerts.', dismissible: false, buttons: [{ label: 'OK', style: 'primary' }] })
            } />
            <AppIcon name="share-outline" variant="gold" onPress={() =>
              showAlert({ type: 'gold', title: 'Share', message: 'Share your gold portfolio!', dismissible: false, buttons: [{ label: 'Cancel', style: 'ghost' }, { label: 'Share', style: 'primary' }] })
            } />
            <AppIcon name="trash-outline" variant="error" onPress={() =>
              showAlert({ type: 'confirm', title: 'Delete?', message: 'This action cannot be undone.', dismissible: false, buttons: [{ label: 'Cancel', style: 'secondary' }, { label: 'Delete', style: 'danger' }] })
            } />
          </View>
          <AppDivider label="Square (rounded=false)" marginVertical={10} />
          <View style={S.row}>
            <AppIcon name="wallet-outline" variant="primary" rounded={false} />
            <AppIcon name="bar-chart" variant="gold" rounded={false} />
            <AppIcon name="receipt-outline" variant="success" rounded={false} />
          </View>
        </AppCard>

        {/* ══ AppLoader ══════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>10. AppLoader Variants</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 10 }}>Inline loaders:</AppText>
          <View style={S.row}>
            <AppLoader mode="inline" size="sm" />
            <AppLoader mode="inline" size="md" />
            <AppLoader mode="inline" size="lg" />
          </View>
          <AppDivider label="Overlay loader" marginVertical={10} />
          <AppButton
            label="Show Overlay Loader (3s)"
            variant="primary"
            leftIcon="reload-outline"
            onPress={() => {
              setLoaderVisible(true);
              setTimeout(() => setLoaderVisible(false), 3000);
            }}
          />
        </AppCard>

        {/* ══ AppModal ═══════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>11. AppModal Variants</AppText>
        <AppCard variant="outlined" padding="md">
          <View style={S.gap}>
            <AppButton
              label="Center Modal"
              variant="primary"
              leftIcon="albums-outline"
              onPress={() => setCenterModal(true)}
            />
          </View>
          <AppButton
            label="Bottom Sheet Modal"
            variant="outline"
            leftIcon="chevron-up-outline"
            onPress={() => setBottomModal(true)}
          />
        </AppCard>

        {/* ══ Toast ══════════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>13. Toast Notifications</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8 }}>Types:</AppText>
          <View style={S.gap}>
            <AppButton label="✅ Success Toast" variant="primary" onPress={() =>
              toast.success('Gold purchased!', { message: '2.5g added to your portfolio.' })
            } />
          </View>
          <View style={S.gap}>
            <AppButton label="❌ Error Toast" variant="danger" onPress={() =>
              toast.error('Transaction Failed', { message: 'Payment could not be processed.' })
            } />
          </View>
          <View style={S.gap}>
            <AppButton label="⚠️ Warning Toast" variant="outline" onPress={() =>
              toast.warning('KYC Pending', { message: 'Complete KYC to unlock higher limits.' })
            } />
          </View>
          <View style={S.gap}>
            <AppButton label="ℹ️ Info Toast" variant="secondary" onPress={() =>
              toast.info('Market Update', { message: 'Gold rate: ₹6,325/gram (+1.2% today).' })
            } />
          </View>
          <View style={S.gap}>
            <AppButton label="✦ Gold Toast" variant="gold" onPress={() =>
              toast.gold('Premium Offer!', { message: 'Buy 5g today and get 0.5g bonus.' })
            } />
          </View>
          <View style={S.gap}>
            <AppButton label="⏳ Loading Toast" variant="outline" onPress={() => {
              const id = toast.loading('Processing payment…');
              setTimeout(() => {
                toast.dismiss(id);
                toast.success('Payment Complete!', { message: 'Your order has been placed.' });
              }, 3000);
            }} />
          </View>
          <AppDivider label="Positions" marginVertical={10} />
          <View style={S.row}>
            <AppButton label="Top" size="sm" onPress={() => toast.info('Top', { position: 'top' })} />
            <AppButton label="Bottom" size="sm" variant="outline" onPress={() => toast.info('Bottom', { position: 'bottom' })} />
            <AppButton label="Top-Right" size="sm" variant="secondary" onPress={() => toast.success('Top Right!', { position: 'top-right' })} />
            <AppButton label="Center" size="sm" variant="gold" onPress={() => toast.gold('Center!', { position: 'center' })} />
          </View>
          <AppDivider label="With Action" marginVertical={10} />
          <AppButton label="Toast with Action Button" variant="primary" onPress={() =>
            toast.success('Gold SIP Started!', {
              message: '₹500/month auto-invest enabled.',
              action: { label: 'View Plan', onPress: () => {} },
              duration: 5000,
            })
          } />
        </AppCard>

        {/* ══ AppSearchBar ═══════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>14. AppSearchBar</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8 }}>Filled (default) + voice + loading:</AppText>
          <AppSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search gold plans…"
            onSearch={(q) => {
              setSearchLoading(true);
              setTimeout(() => setSearchLoading(false), 1200);
            }}
            loading={searchLoading}
            onVoiceSearch={() => toast.info('Voice search activated')}
            variant="filled"
          />
          <AppDivider label="Outlined + filter button" marginVertical={12} />
          <AppSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search with filter…"
            onSearch={(q) => toast.info(`Searching: ${q}`)}
            variant="outlined"
            onFilter={() => { setFilterActive(p => !p); toast.info(filterActive ? 'Filter cleared' : 'Filter applied'); }}
            filterActive={filterActive}
          />
          <AppDivider label="Minimal + suggestions + cancel" marginVertical={12} />
          <AppSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Try a suggestion…"
            onSearch={(q) => toast.success(`Search: ${q}`)}
            variant="minimal"
            showCancel
            onCancel={() => setSearchQuery('')}
            suggestions={['Gold ETF', 'Digital Gold', 'SIP ₹500', '24K Buy']}
            onSuggestionPress={(s) => { setSearchQuery(s); toast.info(`Selected: ${s}`); }}
            debounceMs={300}
          />
        </AppCard>

        {/* ══ AppOTPInput ════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>15. AppOTPInput</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 4, textAlign: 'center' }}>6-digit OTP — enter 123456 to verify:</AppText>
          <AppOTPInput
            ref={otpRef}
            length={6}
            label="Verification Code"
            hint="Sent to +91 98765 43210"
            onChangeText={() => { setOtpError(false); setOtpErrMsg(''); }}
            onComplete={(v) => {
              if (v !== '123456') { setOtpError(true); setOtpErrMsg('Invalid OTP. Try 123456'); }
              else { setOtpError(false); setOtpErrMsg(''); toast.success('OTP Verified! ✓'); }
            }}
            error={otpError}
            errorMessage={otpErrMsg}
            onResend={() => toast.info('OTP resent!')}
            resendCountdown={30}
            autoFocus={false}
          />
          <AppDivider label="Secure / masked (4-digit)" marginVertical={14} />
          <AppOTPInput
            length={4}
            secure
            keyboardType="numeric"
            success={pinSuccess}
          />
          <View style={[S.row, { justifyContent: 'center', marginTop: 12 }]}>
            <AppButton size="sm" label="Clear" variant="outline" onPress={() => { otpRef.current?.clear(); setOtpError(false); setOtpErrMsg(''); }} />
          </View>
        </AppCard>

        {/* ══ AppPinInput ════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>16. AppPinInput</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8, textAlign: 'center' }}>Dots variant — enter 1234:</AppText>
          <AppPinInput
            ref={pinRef}
            length={4}
            variant="dots"
            label="Enter your PIN"
            hint="Use the PIN you set during registration"
            onChangeText={() => { setPinError(false); setPinErrMsg(''); setPinSuccess(false); }}
            onComplete={(v) => {
              if (v !== '1234') { setPinError(true); setPinErrMsg('Wrong PIN. Try 1234'); }
              else { setPinSuccess(true); toast.success('PIN Accepted! ✓'); }
            }}
            error={pinError}
            errorMessage={pinErrMsg}
            success={pinSuccess}
            vibrateOnError
          />
          <AppDivider label="Boxes variant + custom keypad" marginVertical={14} />
          <AppPinInput
            length={4}
            variant="boxes"
            label="Confirm PIN"
            showKeypad
            onComplete={(v) => toast.info(`Keypad PIN: ${v}`)}
          />
          <View style={[S.row, { justifyContent: 'center', marginTop: 8 }]}>
            <AppButton size="sm" label="Reset" variant="outline" onPress={() => { pinRef.current?.clear(); setPinError(false); setPinErrMsg(''); setPinSuccess(false); }} />
          </View>
        </AppCard>

        {/* ══ AppBottomSheet ═════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>17. AppBottomSheet</AppText>
        <AppCard variant="outlined" padding="md">
          <View style={S.gap}>
            <AppButton
              label="Open Sheet (50% → 90%)"
              variant="primary"
              leftIcon="chevron-up-outline"
              onPress={() => sheetRef.current?.open()}
            />
          </View>
          <AppButton
            label="Snap to 90%"
            variant="outline"
            leftIcon="expand-outline"
            onPress={() => sheetRef.current?.snapTo(1)}
          />
        </AppCard>

        {/* ══ AppEmptyState ══════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>18. AppEmptyState</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 4 }}>no-portfolio (sm):</AppText>
          <AppEmptyState
            variant="no-portfolio"
            size="sm"
            cta={{ label: 'Start Investing', onPress: () => toast.success('Redirecting to Buy…'), icon: '💰' }}
            secondaryCta={{ label: 'Learn More', onPress: () => toast.info('Opening guide…'), variant: 'ghost' }}
          />
          <AppDivider label="no-results" marginVertical={4} />
          <AppEmptyState
            variant="no-results"
            size="sm"
            cta={{ label: 'Clear Filters', onPress: () => toast.info('Filters cleared'), variant: 'outline' }}
          />
          <AppDivider label="error" marginVertical={4} />
          <AppEmptyState
            variant="error"
            size="sm"
            cta={{ label: 'Try Again', onPress: () => toast.warning('Retrying…'), variant: 'outline' }}
          />
          <AppDivider label="coming-soon (custom illustration)" marginVertical={4} />
          <AppEmptyState
            variant="coming-soon"
            size="sm"
            illustration="🏆"
            title="Gold Rewards — Coming Soon"
            subtitle="Earn rewards on every gold purchase. Stay tuned!"
            showDecorations={false}
          />
        </AppCard>

        {/* ══ AppProgressBar ═════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>19. AppProgressBar &amp; Steps</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8 }}>Sizes:</AppText>
          <View style={{ gap: 10 }}>
            <AppProgressBar progress={70} size="xs" />
            <AppProgressBar progress={55} size="sm" showLabel />
            <AppProgressBar progress={80} size="md" showLabel labelPosition="outside-right" />
            <AppProgressBar progress={40} size="lg" showLabel labelPosition="inside" />
          </View>
          <AppDivider label="Variants" marginVertical={12} />
          <View style={{ gap: 10 }}>
            <AppProgressBar progress={65} variant="default" showLabel labelPosition="outside-top" label="SIP Goal" />
            <AppProgressBar progress={45} variant="striped" size="md" showLabel color={COLORS.secondary} />
            <AppProgressBar progress={80} variant="segmented" size="md" showLabel labelPosition="outside-right" />
          </View>
          <AppDivider label="With range labels" marginVertical={12} />
          <AppProgressBar
            progress={62}
            size="md"
            showLabel
            showRange
            rangeStart="₹0"
            rangeEnd="₹1,00,000"
            label="₹62,000 saved"
            labelPosition="outside-top"
            color={COLORS.success}
          />
          <AppDivider label="Progress Steps — horizontal (tap to navigate)" marginVertical={12} />
          <AppProgressSteps
            steps={[
              { label: 'PAN', description: 'Verify PAN card' },
              { label: 'Aadhaar', description: 'Link Aadhaar' },
              { label: 'Bank', description: 'Add bank account' },
              { label: 'Done', description: 'KYC complete' },
            ]}
            currentStep={kycStep}
            variant="numbered"
            showDescriptions
            onStepPress={setKycStep}
          />
          <View style={[S.row, { justifyContent: 'center', marginTop: 12 }]}>
            <AppButton size="sm" label="← Prev" variant="outline" onPress={() => setKycStep(s => Math.max(0, s - 1))} />
            <AppButton size="sm" label="Next →" variant="primary" onPress={() => setKycStep(s => Math.min(3, s + 1))} />
          </View>
          <AppDivider label="Progress Steps — vertical (checkmarks)" marginVertical={12} />
          <AppProgressSteps
            steps={[
              { label: 'Order Placed', description: 'Your order has been received' },
              { label: 'Payment Confirmed', description: 'Payment processed successfully' },
              { label: 'Gold Allocated', description: 'Gold added to your vault' },
              { label: 'Certificate Issued', description: 'Download your certificate' },
            ]}
            currentStep={kycStep}
            orientation="vertical"
            variant="checkmarks"
            showDescriptions
            connectorStyle="dashed"
          />
        </AppCard>

        {/* ══ AppSkeletonLoader ══════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>20. AppSkeletonLoader</AppText>
        <AppCard variant="outlined" padding="md">

          <AppText variant="caption" style={{ marginBottom: 8 }}>Switch type:</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={[S.row, { flexWrap: 'nowrap' }]}>
              {(['card','list','transaction','notification','portfolio','profile','banner','grid','detail','chart','text'] as const).map(t => (
                <AppButton
                  key={t}
                  label={t}
                  size="sm"
                  variant={skeletonType === t ? 'primary' : 'outline'}
                  onPress={() => setSkeletonType(t)}
                />
              ))}
            </View>
          </ScrollView>

          <AppSkeletonLoader
            type={skeletonType}
            count={skeletonType === 'grid' ? 4 : skeletonType === 'text' ? 1 : 3}
            lines={5}
          />

          <AppDivider label="Primitives — SkeletonBox / Circle / Text" marginVertical={14} />
          <View style={{ gap: 10 }}>
            <SkeletonBox height={14} width="80%" radius={6} />
            <SkeletonBox height={14} width="60%" radius={6} />
            <View style={[S.row, { gap: 10 }]}>
              <SkeletonCircle size={48} />
              <SkeletonCircle size={36} />
              <SkeletonCircle size={24} />
            </View>
            <SkeletonText lines={4} lineHeight={13} gap={8} lastLineWidth="45%" />
          </View>

        </AppCard>

        {/* ══ AppRadio ════════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>21. AppRadio</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8 }}>Vertical group — investment type:</AppText>
          <AppRadio
            value={radioVal}
            onChange={setRadioVal}
            options={[
              { value: 'sip',  label: 'Gold SIP',      sublabel: 'Auto-invest monthly' },
              { value: 'buy',  label: 'Buy Gold',       sublabel: 'One-time purchase' },
              { value: 'sell', label: 'Sell Gold',      sublabel: 'Liquidate holdings' },
              { value: 'gift', label: 'Gift Gold',      sublabel: 'Send to a friend', disabled: true },
            ]}
          />
          <AppDivider label="Horizontal group — gold purity" marginVertical={12} />
          <AppRadio
            value={radioGold}
            onChange={setRadioGold}
            variant="gold"
            direction="horizontal"
            options={[
              { value: '24k', label: '24K' },
              { value: '22k', label: '22K' },
              { value: '18k', label: '18K' },
            ]}
          />
          <AppDivider label="Sizes — standalone AppRadioItem" marginVertical={12} />
          <View style={{ gap: 10 }}>
            {(['sm', 'md', 'lg'] as const).map(sz => (
              <AppRadioItem
                key={sz}
                selected={radioSize === sz}
                onPress={() => setRadioSize(sz)}
                label={`Size: ${sz}`}
                size={sz}
              />
            ))}
          </View>
        </AppCard>

        {/* ══ AppCheckbox ════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>22. AppCheckbox</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8 }}>Variants:</AppText>
          <View style={{ gap: 12 }}>
            <AppCheckbox
              checked={cbSIP}
              onChange={setCbSIP}
              label="Enable Gold SIP"
              sublabel="Auto-debit ₹500 every month"
              variant="primary"
            />
            <AppCheckbox
              checked={cbNotify}
              onChange={setCbNotify}
              label="Price Alerts"
              sublabel="Notify when gold rate changes by 2%"
              variant="gold"
            />
            <AppCheckbox
              checked={cbTerms}
              onChange={setCbTerms}
              label="I agree to Terms & Conditions"
              variant="success"
            />
            <AppCheckbox
              checked={false}
              onChange={() => {}}
              label="Disabled option"
              disabled
            />
          </View>
          <AppDivider label="Indeterminate + sizes" marginVertical={12} />
          <View style={{ gap: 12 }}>
            <AppCheckbox checked={cbInter} onChange={setCbInter} label="Select all transactions" indeterminate={!cbInter} size="lg" />
            <AppCheckbox checked={cbSIP}   onChange={setCbSIP}   label="Medium (default)" size="md" />
            <AppCheckbox checked={cbTerms} onChange={setCbTerms} label="Small checkbox" size="sm" />
          </View>
        </AppCard>

        {/* ══ AppSwitch ══════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>23. AppSwitch</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8 }}>Settings panel:</AppText>
          <View style={{ gap: 14 }}>
            <AppSwitch
              value={swNotify}
              onValueChange={setSwNotify}
              label="Push Notifications"
              sublabel="Receive alerts for price changes"
              variant="primary"
            />
            <AppDivider />
            <AppSwitch
              value={swBiometric}
              onValueChange={setSwBiometric}
              label="Biometric Login"
              sublabel="Use fingerprint or Face ID"
              variant="primary"
            />
            <AppDivider />
            <AppSwitch
              value={swAutoSIP}
              onValueChange={setSwAutoSIP}
              label="Auto SIP"
              sublabel="₹500/month auto-invest"
              variant="gold"
            />
            <AppDivider />
            <AppSwitch
              value={swDarkMode}
              onValueChange={setSwDarkMode}
              label="Dark Mode"
              sublabel="Switch app appearance"
              variant="success"
            />
            <AppDivider />
            <AppSwitch
              value={false}
              onValueChange={() => {}}
              label="Disabled Switch"
              disabled
            />
          </View>
          <AppDivider label="Sizes" marginVertical={12} />
          <View style={{ gap: 12 }}>
            <AppSwitch value={swNotify}  onValueChange={setSwNotify}  label="Small"  size="sm" />
            <AppSwitch value={swAutoSIP} onValueChange={setSwAutoSIP} label="Medium" size="md" />
            <AppSwitch value={swDarkMode} onValueChange={setSwDarkMode} label="Large" size="lg" />
          </View>
        </AppCard>

        {/* ══ ScreenWrapper ═══════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>24. ScreenWrapper</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8 }}>Simulated ScreenWrapper (scroll + pull-to-refresh + header/footer):</AppText>
          <View style={{ height: 260, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border }}>
            <ScreenWrapper
              scroll
              refreshing={kwRefreshing}
              onRefresh={() => {
                setKwRefreshing(true);
                setTimeout(() => { setKwRefreshing(false); toast.success('Refreshed!'); }, 1500);
              }}
              backgroundColor={COLORS.background}
              paddingHorizontal={16}
              paddingTop={8}
              paddingBottom={16}
              header={
                <View style={{ padding: 12, backgroundColor: COLORS.primary }}>
                  <AppText variant="bodyMedium" style={{ color: COLORS.white }}>📌 Fixed Header</AppText>
                </View>
              }
              footer={
                <View style={{ padding: 12, backgroundColor: COLORS.gray100, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                  <AppText variant="caption">📌 Fixed Footer — always visible</AppText>
                </View>
              }
            >
              {[1,2,3,4,5].map(i => (
                <AppCard key={i} variant="flat" padding="sm" style={{ marginBottom: 8 }}>
                  <AppText variant="body">Scrollable item {i}</AppText>
                  <AppText variant="caption">Pull down to refresh</AppText>
                </AppCard>
              ))}
            </ScreenWrapper>
          </View>
        </AppCard>

        {/* ══ KeyboardWrapper ═════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>25. KeyboardWrapper</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8 }}>Form inside KeyboardWrapper — keyboard pushes content up, tap outside dismisses:</AppText>
          <View style={{ height: 220, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border }}>
            <KeyboardWrapper scroll dismissOnTap extraScrollHeight={32}>
              <View style={{ padding: 16, gap: 12 }}>
                <AppInput
                  label="Full Name"
                  placeholder="Enter your name"
                  leftIcon="person-outline"
                  value={kwName}
                  onChangeText={setKwName}
                />
                <AppInput
                  label="Email"
                  placeholder="Enter your email"
                  leftIcon="mail-outline"
                  value={kwEmail}
                  onChangeText={setKwEmail}
                />
                <AppButton
                  label="Submit"
                  variant="primary"
                  onPress={() => toast.success(`Hello ${kwName || 'User'}!`)}
                />
              </View>
            </KeyboardWrapper>
          </View>
        </AppCard>

        {/* ══ AppExportSheet ════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>27. AppExportSheet</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 10 }}>Export different reports as PDF, Excel, or Word:</AppText>
          <View style={{ gap: 10 }}>
            {EXPORT_PRESETS.map((preset, i) => (
              <AppButton
                key={i}
                label={`Export ${preset.label}`}
                variant={i === 0 ? 'primary' : i === 1 ? 'gold' : 'outline'}
                leftIcon="share-outline"
                onPress={() => {
                  setExportData(preset.data);
                  setExportFilename(preset.filename);
                  setExportVisible(true);
                }}
              />
            ))}
          </View>
        </AppCard>

        {/* ══ AppLanguagePicker ══════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>28. AppLanguagePicker</AppText>
        <AppCard variant="outlined" padding="md">
          <AppText variant="caption" style={{ marginBottom: 8 }}>Chips mode — horizontal scroll:</AppText>
          <AppLanguagePicker
            mode="chips"
            selectedCode={langChips}
            onSelect={setLangChips}
            allowedCodes={['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu']}
          />
          <AppDivider label="Inline grid mode" marginVertical={12} />
          <AppLanguagePicker
            mode="inline"
            selectedCode={langInline}
            onSelect={setLangInline}
            allowedCodes={['en', 'hi', 'ta', 'te', 'kn', 'ml']}
            searchable
          />
          <AppDivider label="Sheet mode" marginVertical={12} />
          <AppButton
            label={`Open Language Sheet (${langCode.toUpperCase()})`}
            variant="primary"
            leftIcon="language-outline"
            onPress={() => setLangSheet(true)}
          />
        </AppCard>

        {/* ══ Send Notification ══════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>29. Send Notification (Test)</AppText>
        <AppCard variant="outlined" padding="md">

          {/* Send type toggle */}
          <AppText variant="caption" style={{ marginBottom: 6 }}>Send to:</AppText>
          <View style={[S.row, { marginBottom: 12 }]}>
            {(['user', 'all'] as const).map(t => (
              <AppButton
                key={t}
                label={t === 'user' ? '👤 Specific User' : '👥 All Users'}
                size="sm"
                variant={notifSendType === t ? 'primary' : 'outline'}
                onPress={() => setNotifSendType(t)}
              />
            ))}
          </View>

          {/* Mode toggle */}
          <AppText variant="caption" style={{ marginBottom: 6 }}>Mode:</AppText>
          <View style={[S.row, { marginBottom: 12 }]}>
            {(['inline', 'template'] as const).map(m => (
              <AppButton
                key={m}
                label={m === 'inline' ? '✏️ Inline Content' : '📋 Saved Template'}
                size="sm"
                variant={notifMode === m ? 'primary' : 'outline'}
                onPress={() => setNotifMode(m)}
              />
            ))}
          </View>

          <AppDivider marginVertical={8} />

          {/* User ID — only for specific user */}
          {notifSendType === 'user' && (
            <AppInput
              label="User ID"
              placeholder="e.g. 42"
              leftIcon="person-outline"
              keyboardType="numeric"
              value={notifUserId}
              onChangeText={setNotifUserId}
              required
            />
          )}

          {notifMode === 'inline' ? (
            <>
              <View style={S.spacer} />
              <AppInput
                label="Title"
                placeholder="Notification title"
                leftIcon="megaphone-outline"
                value={notifTitle}
                onChangeText={setNotifTitle}
                required
              />
              <View style={S.spacer} />
              <AppInput
                label="Message"
                placeholder="Notification message"
                leftIcon="chatbox-ellipses-outline"
                value={notifMessage}
                onChangeText={setNotifMessage}
                required
              />
            </>
          ) : (
            <>
              <View style={S.spacer} />
              <AppInput
                label="Template ID"
                placeholder="e.g. 1"
                leftIcon="document-text-outline"
                keyboardType="numeric"
                value={notifTemplateId}
                onChangeText={setNotifTemplateId}
                required
                hint={templates.length > 0 ? `Available: ${templates.map(t => `${t.id} — ${t.title}`).join(', ')}` : 'No templates loaded'}
              />
            </>
          )}

          <View style={S.spacer} />
          <AppInput
            label="Scheduled Time (optional)"
            placeholder="2025-12-18T10:30:00"
            leftIcon="time-outline"
            value={notifSchedule}
            onChangeText={setNotifSchedule}
            hint="Leave blank to send immediately"
          />

          <View style={{ marginTop: 16 }}>
            <AppButton
              label={sending ? 'Sending…' : notifSendType === 'user' ? '📤 Send to User' : '📢 Send to All'}
              variant={notifSendType === 'user' ? 'primary' : 'gold'}
              loading={sending}
              onPress={async () => {
                try {
                  const schedule = notifSchedule.trim() || undefined;
                  if (notifMode === 'inline') {
                    if (!notifTitle.trim() || !notifMessage.trim()) {
                      toast.error('Missing fields', { message: 'Title and message are required.' });
                      return;
                    }
                    const req = {
                      ...(notifSendType === 'user' && notifUserId ? { userId: Number(notifUserId) } : {}),
                      title: notifTitle.trim(),
                      message: notifMessage.trim(),
                      ...(schedule ? { scheduledTime: schedule } : {}),
                    };
                    notifSendType === 'user' ? await sendToUser(req) : await sendToAll(req);
                  } else {
                    if (!notifTemplateId.trim()) {
                      toast.error('Missing Template ID');
                      return;
                    }
                    const req2 = {
                      ...(notifSendType === 'user' && notifUserId ? { userId: Number(notifUserId) } : {}),
                      ...(schedule ? { scheduledTime: schedule } : {}),
                    };
                    notifSendType === 'user' ? await sendToUser({ ...req2, title: `Template:${notifTemplateId}` }) : await sendToAll(req2);
                  }
                  toast.success('Notification Sent!', {
                    message: schedule ? `Scheduled for ${schedule}` : 'Delivered immediately',
                  });
                  setNotifTitle(''); setNotifMessage(''); setNotifSchedule(''); setNotifTemplateId('');
                } catch (e: any) {
                  toast.error('Send Failed', { message: e?.message ?? 'Something went wrong' });
                }
              }}
            />
          </View>
        </AppCard>

        {/* ══ AppSchemeCard ══════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>26. AppSchemeCard</AppText>

        <AppText variant="caption" style={{ marginBottom: 8, marginTop: 4 }}>Default variant — featured + progress + tags:</AppText>
        <AppSchemeCard
          scheme={SCHEMES[0]}
          onPress={(id) => toast.info(`Pressed scheme ${id}`)}
          onBuy={(id) => toast.success('SIP started! ✓')}
          onDetails={(id) => toast.info('Opening details…')}
          onWishlistToggle={(id, w) => toast.info(w ? '❤️ Wishlisted' : 'Removed from wishlist')}
          style={{ marginBottom: 14 }}
        />

        <AppText variant="caption" style={{ marginBottom: 8 }}>Default — monthly amount + next due date:</AppText>
        <AppSchemeCard
          scheme={SCHEMES[1]}
          wishlisted
          onPress={(id) => toast.info(`View plan ${id}`)}
          onWishlistToggle={(id, w) => toast.info(w ? '❤️ Wishlisted' : 'Removed')}
          style={{ marginBottom: 14 }}
        />

        <AppText variant="caption" style={{ marginBottom: 8 }}>Default — loading skeleton:</AppText>
        <AppSchemeCard
          scheme={SCHEMES[0]}
          loading
          style={{ marginBottom: 14 }}
        />

        <AppText variant="caption" style={{ marginBottom: 8 }}>Default — expired / closed state:</AppText>
        <AppSchemeCard
          scheme={SCHEMES[4]}
          onRedeem={(id) => toast.warning('Redirecting to redeem…')}
          style={{ marginBottom: 14 }}
        />

        <AppDivider label="Horizontal variant" marginVertical={4} />
        <View style={{ gap: 10, marginBottom: 4 }}>
          {SCHEMES.slice(0, 3).map(s => (
            <AppSchemeCard
              key={s.id}
              variant="horizontal"
              scheme={s}
              onPress={(id) => toast.info(`Horizontal: ${id}`)}
              onBuy={(id) => toast.success(`Joining ${id}`)}
              onDetails={(id) => toast.info(`Details: ${id}`)}
            />
          ))}
          <AppSchemeCard
            variant="horizontal"
            scheme={SCHEMES[0]}
            loading
          />
        </View>

        <AppDivider label="Mini grid variant" marginVertical={12} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {SCHEMES.map(s => (
            <View key={s.id} style={{ width: '47%' }}>
              <AppSchemeCard
                variant="mini"
                scheme={s}
                onPress={(id) => toast.info(`Mini: ${id}`)}
                onBuy={(id) => toast.success(`Invest in ${id}`)}
              />
            </View>
          ))}
          <View style={{ width: '47%' }}>
            <AppSchemeCard variant="mini" scheme={SCHEMES[0]} loading />
          </View>
        </View>

        {/* ══ CustomAlert ════════════════════════════════════════ */}
        <AppText variant="h5" style={S.section}>12. CustomAlert Types</AppText>
        <AppCard variant="outlined" padding="md">
          {[
            { label: '✅  Success', type: 'success' as AlertType, title: 'Payment Successful!', message: 'Your gold purchase of 2.5g is complete.', buttons: [{ label: 'View Receipt', style: 'secondary' as const }, { label: 'Done', style: 'primary' as const }] },
            { label: '❌  Error', type: 'error' as AlertType, title: 'Transaction Failed', message: 'Payment could not be processed. Please retry.', buttons: [{ label: 'Cancel', style: 'ghost' as const }, { label: 'Retry', style: 'danger' as const }] },
            { label: '⚠️  Warning', type: 'warning' as AlertType, title: 'KYC Pending', message: 'Complete KYC to unlock higher investment limits.', buttons: [{ label: 'Later', style: 'ghost' as const }, { label: 'Verify Now', style: 'primary' as const }] },
            { label: 'ℹ️  Info', type: 'info' as AlertType, title: 'Market Update', message: 'Gold rate: ₹6,325/gram (+1.2% today).', buttons: [{ label: 'OK', style: 'primary' as const }] },
            { label: '✦  Gold', type: 'gold' as AlertType, title: 'Premium Offer!', message: 'Buy 5g today and get 0.5g bonus. Limited time!', buttons: [{ label: 'Skip', style: 'secondary' as const }, { label: 'Claim Now', style: 'primary' as const }] },
            { label: '❓  Confirm', type: 'confirm' as AlertType, title: 'Confirm Sell', message: 'Sell 1g at ₹6,250? This cannot be undone.', buttons: [{ label: 'Cancel', style: 'secondary' as const }, { label: 'Yes, Sell', style: 'danger' as const }] },
            { label: '⏳  Loading', type: 'info' as AlertType, title: 'Processing Payment', loading: true, autoDismiss: 3000 },
          ].map((demo, i) => (
            <View key={i} style={S.gap}>
              <AppButton
                label={demo.label}
                variant={i === 0 ? 'primary' : i === 1 ? 'danger' : i === 5 ? 'danger' : i === 3 ? 'secondary' : i === 4 ? 'gold' : 'outline'}
                onPress={() => showAlert({ ...demo, dismissible: false })}
              />
            </View>
          ))}
        </AppCard>

      </ScrollView>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Overlay Loader ──────────────────────────────────── */}
      <AppLoader visible={loaderVisible} mode="overlay" message="Loading gold data…" />

      {/* ── Center Modal ────────────────────────────────────── */}
      <AppModal
        visible={centerModal}
        onClose={() => setCenterModal(false)}
        title="Gold Investment"
        subtitle="Choose your plan"
        position="center"
      >
        <AppText variant="body" style={{ marginBottom: 12 }}>
          Start your gold SIP from as low as ₹100/month.
        </AppText>
        <View style={{ gap: 8 }}>
          <AppButton label="Start SIP" variant="primary" onPress={() => setCenterModal(false)} />
          <AppButton label="Buy Now" variant="gold" onPress={() => setCenterModal(false)} />
          <AppButton label="Learn More" variant="ghost" onPress={() => setCenterModal(false)} />
        </View>
      </AppModal>

      {/* ── Bottom Sheet Modal ──────────────────────────────── */}
      <AppModal
        visible={bottomModal}
        onClose={() => setBottomModal(false)}
        title="Quick Actions"
        subtitle="What would you like to do?"
        position="bottom"
      >
        <View style={{ gap: 10, marginTop: 8 }}>
          {[
            { label: 'Buy Gold', icon: 'add-circle-outline', variant: 'primary' as const },
            { label: 'Sell Gold', icon: 'trending-up-outline', variant: 'outline' as const },
            { label: 'View Portfolio', icon: 'bar-chart-outline', variant: 'secondary' as const },
            { label: 'Cancel', icon: 'close-outline', variant: 'ghost' as const },
          ].map((item, i) => (
            <AppButton key={i} label={item.label} variant={item.variant} leftIcon={item.icon} onPress={() => setBottomModal(false)} />
          ))}
        </View>
      </AppModal>

      {/* ── AppBottomSheet ──────────────────────────────────── */}
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={['50%', '90%']}
        title="Quick Invest"
        subtitle="Choose an action below"
        showCloseButton
        scrollable
        onClose={() => toast.info('Sheet closed')}
        onOpen={() => toast.info('Sheet opened')}
        onSnapChange={(i) => toast.info(`Snapped to ${i === 0 ? '50%' : '90%'}`)}
        footerComponent={
          <AppButton label="Close Sheet" variant="ghost" onPress={() => sheetRef.current?.close()} />
        }
      >
        <View style={{ gap: 12 }}>
          <AppButton label="Buy Gold" variant="gold" leftIcon="add-circle-outline" onPress={() => { sheetRef.current?.close(); toast.success('Buy Gold selected'); }} />
          <AppButton label="Sell Gold" variant="outline" leftIcon="trending-up-outline" onPress={() => { sheetRef.current?.close(); toast.warning('Sell Gold selected'); }} />
          <AppButton label="Start SIP" variant="primary" leftIcon="repeat-outline" onPress={() => { sheetRef.current?.close(); toast.info('SIP started'); }} />
          <AppButton label="View Portfolio" variant="secondary" onPress={() => sheetRef.current?.close()} />
          <AppButton label="Transaction History" variant="secondary" onPress={() => sheetRef.current?.close()} />
          <AppButton label="Gold Rates" variant="secondary" onPress={() => sheetRef.current?.close()} />
          <AppButton label="Refer & Earn" variant="secondary" onPress={() => sheetRef.current?.close()} />
        </View>
      </AppBottomSheet>

      {/* ── CustomAlert ─────────────────────────────────────── */}
      <CustomAlert {...alert} onDismiss={hideAlert} />

      {/* ── AppLanguagePicker sheet ──────────────────────────── */}
      <AppLanguagePicker
        mode="sheet"
        visible={langSheet}
        onClose={() => setLangSheet(false)}
        selectedCode={langCode}
        onSelect={(code) => { setLangCode(code); setLangSheet(false); toast.success(`Language: ${code.toUpperCase()}`); }}
      />

      {/* ── AppExportSheet ─────────────────────────────────── */}
      {exportData && (
        <AppExportSheet
          visible={exportVisible}
          onClose={() => setExportVisible(false)}
          data={exportData}
          filename={exportFilename}
        />
      )}

    </View>
  );
}
