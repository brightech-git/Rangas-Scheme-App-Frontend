import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { METAL_LABEL } from '../../types/Scheme/Scheme';
import { classifySchemeKind } from '../../utils/schemeKind';
import { useAppContent } from '../../api/hooks/AppContent/useAppContent';

import {
  PageHeader,
  PaymentTile,
  BottomActionBar,
  SummaryCard,
  StatusChip,
  asText,
  type SummaryRow,
} from '../../components/ui/premium';

type RouteProps = RouteProp<RootStackParamList, 'SchemeTerms'>;
type NavProps   = NativeStackNavigationProp<RootStackParamList, 'SchemeTerms'>;
type Lang = 'en' | 'ta';

// Wraps the API HTML with styles + lang-switch JS so it renders
// correctly inside a WebView (no external network calls needed).
// The backend markup ships its own EN/TA toggle buttons
// (.content-lang-switch / .lang-btn) — those are hidden here in favour
// of the native pill toggle rendered above the WebView, which drives
// language switching via injectJavaScript(showLang(...)).
function buildHtml(rawHtml: string, lang: Lang, isDark: boolean): string {
  const bg   = isDark ? '#1a1a1a' : '#ffffff';
  const text = isDark ? '#e5e5e5' : '#1a1a1a';
  const sub  = isDark ? '#a0a0a0' : '#555555';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${bg}; color: ${text}; font-family: -apple-system, sans-serif;
         font-size: 14px; line-height: 1.7; padding: 16px; }
  h2 { font-size: 17px; font-weight: 700; margin-bottom: 14px; }
  h3 { font-size: 14px; font-weight: 600; margin-top: 18px; margin-bottom: 8px; }
  p  { margin-bottom: 10px; color: ${sub}; }
  ul { padding-left: 18px; margin-bottom: 10px; }
  li { margin-bottom: 6px; color: ${sub}; }
  strong { color: ${text}; }
  .content-lang-switch { display: none; }
  .content-content { display: none; }
</style>
</head>
<body>
${rawHtml}
<script>
  function showLang(lang){
    var contents = document.querySelectorAll('.content-content');
    contents.forEach(function(el){
      el.style.display = el.getAttribute('data-lang') === lang ? 'block' : 'none';
    });
    setTimeout(postHeight, 60);
  }
  function postHeight(){
    window.ReactNativeWebView.postMessage('height:' + document.body.scrollHeight);
  }
  showLang('${lang}');
  postHeight();
  setTimeout(postHeight, 300);
  function switchLang(lang){ showLang(lang); }
<\/script>
</body></html>`;
}

export default function SchemeTermsScreen() {
  const { COLORS, FONTS, SIZES, moderateScale, isDark } = useTheme();
  const navigation = useNavigation<NavProps>();
  const route      = useRoute<RouteProps>();
  const { scheme } = route.params;

  const [accepted, setAccepted] = useState(false);
  const [lang, setLang]         = useState<Lang>('en');
  const webViewRef = useRef<any>(null);

  const [webViewHeight, setWebViewHeight] = useState(400);

  const mLabel    = METAL_LABEL[scheme.MetalType] ?? scheme.MetalType;
  const isFixed   = scheme.FixedIns === 'Y';
  const canJoin   = scheme.ADDNEWMEMBER === 'Y';
  const schemeKind = classifySchemeKind(scheme.FixedIns, scheme.Instalment, scheme.WeightLedger);
  const isLumpsum  = schemeKind === 'lumpsum';
  const isDigiGold = schemeKind === 'flexible';

  // Fetch T&C HTML from API — content ID is the scheme's own code
  // (SchemeSName), e.g. "SCHEME_DIGI_GOLD".
  const contentId = String(scheme.SchemeId);
  const { html: rawHtml, loading, error } = useAppContent(contentId);

  const webHtml = useMemo(
    () => (rawHtml ? buildHtml(rawHtml, lang, !!isDark) : null),
    [rawHtml, lang, isDark],
  );

  const handleJoin = useCallback(() => {
    if (!accepted) return;
    if (isDigiGold) navigation.navigate('BuyGold', { scheme });
    else            navigation.navigate('SchemeJoin', { scheme });
  }, [accepted, navigation, scheme, isDigiGold]);

  const switchLang = (l: Lang) => {
    setLang(l);
    webViewRef.current?.injectJavaScript(`switchLang('${l}'); true;`);
  };

  const schemeFacts: SummaryRow[] = useMemo(() => [
    { label: 'Scheme code',       value: scheme.SchemeSName },
    { label: 'Metal',             value: mLabel, highlight: true },
    { label: 'Instalments',       value: String(scheme.Instalment) },
    { label: 'Instalment amount', value: isFixed ? 'Fixed each month' : isLumpsum ? 'One-time payment' : 'Flexible — by amount or weight' },
    { label: 'New enrolment',     value: canJoin ? 'Open' : 'Closed' },
  ], [scheme, mLabel, isFixed, isLumpsum, canJoin]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>

        {/* ── Scrollable body: Header + Terms + Scheme card ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: SIZES.padding.xxl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero header inside scroll */}
          <PageHeader
            eyebrow="Before you join"
            title="Terms & conditions"
            caption={scheme.schemeName}
            bleedBottom={moderateScale(24)}
          >
            <View style={[s.factStrip, { marginTop: SIZES.margin.xxl, paddingTop: SIZES.padding.lg, borderTopColor: COLORS.heroHairline }]}>
              {[
                { label: 'Instalments', value: String(scheme.Instalment) },
                { label: 'Amount',      value: isFixed ? 'Fixed' : isLumpsum ? 'One-time' : 'Flexible' },
                { label: 'Metal',       value: mLabel },
              ].map((f, i) => (
                <React.Fragment key={f.label}>
                  {i > 0 && <View style={[s.vRule, { backgroundColor: COLORS.heroHairline }]} />}
                  <View style={{ flex: 1 }}>
                    <Text style={[asText(FONTS.micro), { color: COLORS.heroTextMuted, fontSize: 10 }]}>{f.label}</Text>
                    <Text numberOfLines={1} style={[asText(FONTS.numeralSm), { color: COLORS.heroTextPrimary, marginTop: 3 }]}>{f.value}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </PageHeader>

          {/* Language toggle */}
          <View style={[s.langRow, { paddingHorizontal: SIZES.layout.gutter, marginTop: SIZES.margin.lg, marginBottom: SIZES.margin.md }]}>
            {(['en', 'ta'] as Lang[]).map((l) => {
              const on = lang === l;
              return (
                <Pressable
                  key={l}
                  onPress={() => switchLang(l)}
                  style={[s.langBtn, {
                    borderRadius: SIZES.radius.pill,
                    borderColor: on ? COLORS.primary : COLORS.hairline,
                    borderWidth: on ? 1.5 : 1,
                    backgroundColor: on ? COLORS.primary : COLORS.canvasElevated,
                    paddingVertical: SIZES.padding.sm,
                    paddingHorizontal: SIZES.padding.xl,
                  }]}
                >
                  <Text style={[asText(FONTS.microBold), { color: on ? COLORS.textOnPrimary : COLORS.inkSecondary }]}>
                    {l === 'en' ? 'English' : 'தமிழ்'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Terms WebView — auto-height, no internal scroll */}
          <View style={[
            s.webViewWrap,
            {
              height: loading ? 200 : webViewHeight,
              marginHorizontal: SIZES.layout.gutter,
              borderRadius: SIZES.radius.panel,
              borderColor: COLORS.hairline,
              backgroundColor: COLORS.canvasElevated,
            },
          ]}>
            {loading && (
              <View style={s.center}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={[asText(FONTS.micro), { color: COLORS.inkTertiary, marginTop: 8 }]}>Loading terms…</Text>
              </View>
            )}
            {error && !loading && (
              <View style={s.center}>
                <Text style={[asText(FONTS.micro), { color: COLORS.error, textAlign: 'center' }]}>{error}</Text>
              </View>
            )}
            {webHtml && (
              <WebView
                ref={webViewRef}
                source={{ html: webHtml }}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                onMessage={(e) => {
                  const msg = e.nativeEvent.data;
                  if (msg.startsWith('height:')) {
                    const h = parseInt(msg.replace('height:', ''), 10);
                    if (h > 0) setWebViewHeight(h + 32);
                  }
                }}
              />
            )}
          </View>

          {/* Scheme card below terms */}
          <View style={{ paddingHorizontal: SIZES.layout.gutter, marginTop: SIZES.margin.xl }}>
            <SummaryCard rows={schemeFacts} />
            {!canJoin && (
              <StatusChip tone="warning" icon="lock-closed-outline" label="This scheme is not accepting new members" style={{ marginTop: SIZES.margin.lg }} />
            )}
          </View>
        </ScrollView>

        {/* ── Footer ── */}
        <BottomActionBar
          actionLabel={!canJoin ? 'Enrolment closed' : isDigiGold ? 'Buy DigiGold' : 'Join scheme'}
          onAction={handleJoin}
          disabled={!accepted || !canJoin}
          helper={
            <PaymentTile
              marker="check"
              selected={accepted}
              title="I accept the terms & conditions"
              subtitle={`I have read and agree to all terms of ${scheme.schemeName}.`}
              onPress={() => setAccepted((p) => !p)}
              disabled={!canJoin}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  factStrip:  { flexDirection: 'row', borderTopWidth: 1 },
  vRule:      { width: 1, alignSelf: 'stretch', marginHorizontal: 12 },
  langRow:    { flexDirection: 'row', gap: 8 },
  langBtn:    { alignItems: 'center' },
  webViewWrap:{ borderWidth: 1, overflow: 'hidden' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
