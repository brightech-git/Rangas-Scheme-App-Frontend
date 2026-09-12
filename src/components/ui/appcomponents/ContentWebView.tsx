// components/ContentWebView.tsx
//
// Renders a CMS-driven app-content record (GET /app-content/:id) inside a
// height-fitting WebView, with a native EN/TA pill toggle driving the
// bilingual markup the backend returns (two `.content-content[data-lang]`
// blocks). Mirrors the pattern already used for scheme T&C in
// SchemeTermsScreen.tsx, generalised for the static legal/info pages.
import React, { useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../../theme';
import { useAppContent } from '../../../api/hooks/AppContent/useAppContent';
import AppText from './AppText';

type Lang = 'en' | 'ta';

function buildHtml(rawHtml: string, lang: Lang, colors: any): string {
  const { background, textPrimary, textSecondary } = colors;
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: ${background}; color: ${textPrimary}; font-family: -apple-system, Roboto, sans-serif;
         font-size: 14px; line-height: 1.7; padding: 2px 2px 8px; }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
  h3 { font-size: 14px; font-weight: 700; margin-top: 18px; margin-bottom: 6px; }
  p  { margin-bottom: 10px; color: ${textSecondary}; }
  ul { padding-left: 20px; margin-bottom: 10px; }
  li { margin-bottom: 6px; color: ${textSecondary}; }
  strong { color: ${textPrimary}; }
  /* Backend markup ships its own lang-switch buttons — hidden in favour
     of the native pill toggle rendered above the WebView. */
  .content-lang-switch { display: none; }
  .content-content { display: none; }
</style>
</head>
<body>
${rawHtml}
<script>
  function showLang(lang){
    var nodes = document.querySelectorAll('.content-content');
    nodes.forEach(function(el){
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
<\/script>
</body></html>`;
}

export default function ContentWebView({ contentId }: { contentId: string }) {
  const { COLORS } = useTheme();
  const { html: rawHtml, loading, error } = useAppContent(contentId);
  const [lang, setLang] = useState<Lang>('en');
  const [height, setHeight] = useState(200);
  const webViewRef = useRef<any>(null);

  const webHtml = useMemo(
    () => (rawHtml ? buildHtml(rawHtml, lang, COLORS) : null),
    [rawHtml, lang, COLORS],
  );

  const switchLang = (l: Lang) => {
    setLang(l);
    webViewRef.current?.injectJavaScript(`showLang('${l}'); true;`);
  };

  return (
    <View>
      <View style={styles.langRow}>
        {(['en', 'ta'] as Lang[]).map((l) => {
          const on = lang === l;
          return (
            <TouchableOpacity
              key={l}
              onPress={() => switchLang(l)}
              activeOpacity={0.8}
              style={[
                styles.langBtn,
                { backgroundColor: on ? COLORS.primary : COLORS.card, borderColor: on ? COLORS.primary : COLORS.border },
              ]}
            >
              <AppText variant="caption" style={{ color: on ? COLORS.textOnPrimary : COLORS.textSecondary, fontWeight: '700' }}>
                {l === 'en' ? 'English' : 'தமிழ்'}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.webWrap, { height: loading || error ? 160 : height }]}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        )}
        {error && !loading && (
          <View style={styles.center}>
            <AppText variant="bodySmall" color={COLORS.error} align="center">{error}</AppText>
          </View>
        )}
        {webHtml && !error && (
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
                if (h > 0) setHeight(h + 24);
              }
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  langRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  langBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  webWrap: { overflow: 'hidden' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
});
